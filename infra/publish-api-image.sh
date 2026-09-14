#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

aws_region="${AWS_REGION_OUT:-${AWS_REGION:-${AWS_DEFAULT_REGION:-}}}"
image_platform="${API_IMAGE_PLATFORM:-linux/amd64}"

required_vars=(SOURCE_SHA ECR_REPOSITORY_URL)
missing_vars=()
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing_vars+=("${var}")
  fi
done

if [[ -z "${aws_region}" ]]; then
  missing_vars+=("AWS_REGION_OUT (ou AWS_REGION/AWS_DEFAULT_REGION)")
fi

if ((${#missing_vars[@]} > 0)); then
  echo "Variaveis obrigatorias ausentes ou vazias:" >&2
  printf '  - %s\n' "${missing_vars[@]}" >&2
  echo "Carregue infra/.env e infra/load-terraform-outputs.sh antes de publicar." >&2
  exit 1
fi

if [[ ! "${SOURCE_SHA}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "SOURCE_SHA deve ser um SHA Git completo com 40 caracteres hexadecimais minusculos." >&2
  exit 1
fi

repository_name="${ECR_REPOSITORY_URL##*/}"
if [[ ! "${ECR_REPOSITORY_URL}" =~ ^[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com/oficina-mecanica-api$ ]]; then
  echo "ECR_REPOSITORY_URL deve ser o repositório ECR da API: ${ECR_REPOSITORY_URL}" >&2
  exit 1
fi

if [[ ! "${image_platform}" =~ ^linux/(amd64|arm64)(/v[0-9]+)?$ ]]; then
  echo "API_IMAGE_PLATFORM invalida: ${image_platform}" >&2
  exit 1
fi

required_commands=(aws docker)
for command_name in "${required_commands[@]}"; do
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Comando obrigatorio nao encontrado: ${command_name}" >&2
    exit 1
  fi
done

if ! docker buildx version >/dev/null 2>&1; then
  echo "Plugin obrigatorio nao encontrado: docker buildx" >&2
  exit 1
fi

ecr_registry="${ECR_REPOSITORY_URL%%/*}"
image_tag="sha-${SOURCE_SHA}"
image="${ECR_REPOSITORY_URL}:${image_tag}"

echo "Autenticando no ECR: ${ecr_registry}"
aws ecr get-login-password --region "${aws_region}" \
  | docker login --username AWS --password-stdin "${ecr_registry}"

echo "Publicando ${image} para ${image_platform}"
docker buildx build \
  --platform "${image_platform}" \
  --tag "${image}" \
  --push \
  "${PROJECT_ROOT}"

image_digest="$(aws ecr describe-images \
  --region "${aws_region}" \
  --repository-name "${repository_name}" \
  --image-ids "imageTag=${image_tag}" \
  --query 'imageDetails[0].imageDigest' \
  --output text)"

if [[ ! "${image_digest}" =~ ^sha256:[0-9a-f]{64}$ ]]; then
  echo "Digest invalido retornado pelo ECR: ${image_digest}" >&2
  exit 1
fi

image_ref="${ECR_REPOSITORY_URL}@${image_digest}"

echo "IMAGE_TAG=${image_tag}"
echo "IMAGE_DIGEST=${image_digest}"
echo "IMAGE_REF=${image_ref}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "IMAGE_TAG=${image_tag}"
    echo "IMAGE_DIGEST=${image_digest}"
    echo "IMAGE_REF=${image_ref}"
  } >>"${GITHUB_OUTPUT}"
fi

echo "Imagem publicada: ${image_ref} (tag ${image_tag}, plataforma ${image_platform})"
