#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." >/dev/null 2>&1 && pwd)"
PUBLISH_SCRIPT="${PROJECT_ROOT}/infra/publish-api-image.sh"
TEST_TMP_DIR="$(mktemp -d)"
FAKE_BIN_DIR="${TEST_TMP_DIR}/bin"
DOCKER_LOG="${TEST_TMP_DIR}/docker.log"
AWS_LOG="${TEST_TMP_DIR}/aws.log"
GITHUB_OUTPUT_FILE="${TEST_TMP_DIR}/github-output"

cleanup() {
  rm -rf -- "${TEST_TMP_DIR}"
}
trap cleanup EXIT

mkdir -p -- "${FAKE_BIN_DIR}"

cat >"${FAKE_BIN_DIR}/docker" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s\n' "$*" >>"${DOCKER_LOG}"

if [[ "${1:-}" == "login" ]]; then
  cat >/dev/null
fi
EOF

cat >"${FAKE_BIN_DIR}/aws" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s\n' "$*" >>"${AWS_LOG}"

case "$*" in
  'ecr get-login-password --region us-east-1')
    printf '%s\n' 'temporary-password'
    ;;
  *'ecr describe-images '*'--output text'*)
    printf '%s\n' 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    ;;
  *)
    echo "Chamada AWS inesperada: $*" >&2
    exit 1
    ;;
esac
EOF

chmod +x "${FAKE_BIN_DIR}/aws" "${FAKE_BIN_DIR}/docker"
export PATH="${FAKE_BIN_DIR}:${PATH}"
export DOCKER_LOG AWS_LOG

assert_contains() {
  local expected="$1"
  local file="$2"

  if ! grep -Fq -- "${expected}" "${file}"; then
    echo "Esperado '${expected}' em ${file}" >&2
    exit 1
  fi
}

assert_invalid_before_docker() {
  local description="$1"
  local source_sha="$2"
  local repository_url="$3"
  local platform="$4"
  local output_file="${TEST_TMP_DIR}/invalid-output"

  : >"${DOCKER_LOG}"
  if SOURCE_SHA="${source_sha}" \
    AWS_REGION='us-east-1' \
    ECR_REPOSITORY_URL="${repository_url}" \
    API_IMAGE_PLATFORM="${platform}" \
    GITHUB_OUTPUT="${GITHUB_OUTPUT_FILE}" \
    bash "${PUBLISH_SCRIPT}" >"${output_file}" 2>&1; then
    echo "Esperava falha para ${description}" >&2
    exit 1
  fi

  if [[ -s "${DOCKER_LOG}" ]]; then
    echo "Docker foi chamado antes de rejeitar ${description}:" >&2
    cat "${DOCKER_LOG}" >&2
    exit 1
  fi
}

: >"${DOCKER_LOG}"
: >"${AWS_LOG}"
: >"${GITHUB_OUTPUT_FILE}"

export SOURCE_SHA='0123456789abcdef0123456789abcdef01234567'
export AWS_REGION='us-east-1'
export ECR_REPOSITORY_URL='123456789012.dkr.ecr.us-east-1.amazonaws.com/oficina-mecanica-api'
export API_IMAGE_PLATFORM='linux/amd64'
export API_IMAGE_TAG='custom-tag-must-not-be-used'
export GITHUB_OUTPUT="${GITHUB_OUTPUT_FILE}"

publisher_output="${TEST_TMP_DIR}/publisher-output"
bash "${PUBLISH_SCRIPT}" >"${publisher_output}"

expected_tag='sha-0123456789abcdef0123456789abcdef01234567'
expected_digest='sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
expected_ref="${ECR_REPOSITORY_URL}@${expected_digest}"

assert_contains "--tag ${ECR_REPOSITORY_URL}:${expected_tag} --push" "${DOCKER_LOG}"
assert_contains "--repository-name oficina-mecanica-api --image-ids imageTag=${expected_tag}" "${AWS_LOG}"
assert_contains "IMAGE_TAG=${expected_tag}" "${publisher_output}"
assert_contains "IMAGE_DIGEST=${expected_digest}" "${publisher_output}"
assert_contains "IMAGE_REF=${expected_ref}" "${publisher_output}"
assert_contains "IMAGE_TAG=${expected_tag}" "${GITHUB_OUTPUT_FILE}"
assert_contains "IMAGE_DIGEST=${expected_digest}" "${GITHUB_OUTPUT_FILE}"
assert_contains "IMAGE_REF=${expected_ref}" "${GITHUB_OUTPUT_FILE}"

if grep -Fq ':latest' "${DOCKER_LOG}"; then
  echo 'O publicador não pode criar a tag latest.' >&2
  exit 1
fi

if grep -Fq 'custom-tag-must-not-be-used' "${DOCKER_LOG}"; then
  echo 'O publicador não pode aceitar uma tag arbitrária.' >&2
  exit 1
fi

build_count="$(grep -Fc 'buildx build' "${DOCKER_LOG}")"
if [[ "${build_count}" != '1' ]]; then
  echo "Esperava um único build com push; recebeu ${build_count}." >&2
  exit 1
fi

assert_invalid_before_docker \
  'SOURCE_SHA curto' \
  '0123456' \
  '123456789012.dkr.ecr.us-east-1.amazonaws.com/oficina-mecanica-api' \
  'linux/amd64'

assert_invalid_before_docker \
  'ECR_REPOSITORY_URL sem repository' \
  '0123456789abcdef0123456789abcdef01234567' \
  '123456789012.dkr.ecr.us-east-1.amazonaws.com' \
  'linux/amd64'

assert_invalid_before_docker \
  'API_IMAGE_PLATFORM inválida' \
  '0123456789abcdef0123456789abcdef01234567' \
  '123456789012.dkr.ecr.us-east-1.amazonaws.com/oficina-mecanica-api' \
  'linux/ppc64le'

CI_WORKFLOW="${PROJECT_ROOT}/.github/workflows/ci.yml"
PUBLISH_WORKFLOW="${PROJECT_ROOT}/.github/workflows/publish-image.yml"

if rg -n '^[[:space:]]{2}(push|pull_request|schedule):|docker push|:latest|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY' "${PUBLISH_WORKFLOW}"; then
  echo 'O workflow de publicação contém gatilho automático, latest ou credenciais estáticas.' >&2
  exit 1
fi

assert_contains 'workflow_dispatch:' "${PUBLISH_WORKFLOW}"
assert_contains 'environment: image-publishing' "${PUBLISH_WORKFLOW}"
assert_contains 'git_ref:' "${PUBLISH_WORKFLOW}"
assert_contains 'required: true' "${PUBLISH_WORKFLOW}"
assert_contains 'id-token: write' "${PUBLISH_WORKFLOW}"
assert_contains 'contents: read' "${PUBLISH_WORKFLOW}"

if rg -n 'uses:' "${CI_WORKFLOW}" "${PUBLISH_WORKFLOW}" \
  | rg -v 'uses:[[:space:]]*[^#[:space:]]+@[0-9a-f]{40}([[:space:]]*(#.*)?)?$'; then
  echo 'As actions dos novos workflows devem estar fixadas por SHA completo.' >&2
  exit 1
fi

if rg -n '^[[:space:]]{2}deploy[^:]*:' "${PROJECT_ROOT}/.github/workflows"; then
  echo 'O repositório da API não pode conter job de deploy.' >&2
  exit 1
fi

assert_contains 'pull_request:' "${CI_WORKFLOW}"
assert_contains 'name: api / gate' "${CI_WORKFLOW}"
assert_contains 'npm run build' "${CI_WORKFLOW}"
assert_contains 'npm run test:cov' "${CI_WORKFLOW}"
assert_contains 'docker build -t oficina-mecanica-api:ci .' "${CI_WORKFLOW}"
assert_contains '/oficina/shared/ecr/repository-url' "${PUBLISH_WORKFLOW}"
assert_contains "role-to-assume: \${{ vars.PUBLISH_ROLE_ARN }}" "${PUBLISH_WORKFLOW}"
assert_contains 'run: bash infra/publish-api-image.sh' "${PUBLISH_WORKFLOW}"

test_step_line="$(grep -nF 'npm run test:cov' "${PUBLISH_WORKFLOW}" | cut -d: -f1)"
oidc_step_line="$(grep -nF 'aws-actions/configure-aws-credentials@' "${PUBLISH_WORKFLOW}" | cut -d: -f1)"
if ((test_step_line >= oidc_step_line)); then
  echo 'Build e testes devem terminar antes da configuração OIDC.' >&2
  exit 1
fi

echo 'PASS: publicação imutável da imagem da API validada.'
