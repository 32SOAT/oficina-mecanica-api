#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"
generated_dir="${PROJECT_ROOT}/k8s/overlays/generated"
values_dir="${generated_dir}/values"

if ! command -v envsubst >/dev/null 2>&1; then
  echo "Comando obrigatorio nao encontrado: envsubst" >&2
  exit 1
fi

if ! find "${generated_dir}" -maxdepth 1 -type f -name '*.yaml' -print -quit | grep -q .; then
  echo "Nenhum YAML encontrado em ${generated_dir}. Rode ./infra/prepare-k8s-overlay.sh antes." >&2
  exit 1
fi

template_vars=(
  API_NAME
  PROJECT_NAME
  APP_INSTANCE
  KUBERNETES_NAMESPACE
  API_REPLICAS
  API_HEALTHCHECK_PATH
  API_IMAGE_PULL_POLICY
  API_HPA_MIN_REPLICAS
  API_HPA_MAX_REPLICAS
  API_HPA_TARGET_CPU_UTILIZATION_PERCENTAGE
  ECR_REPOSITORY_URL
  API_IMAGE_TAG
  APP_PORT
)

value_vars=(
  NODE_ENV
  APP_PORT
  POSTGRES_HOST
  POSTGRES_PORT
  POSTGRES_DB
  POSTGRES_SYNC
  POSTGRES_SSL
  POSTGRES_SSL_REJECT_UNAUTHORIZED
  JWT_EXPIRES_IN
  POSTGRES_USER
  POSTGRES_PASSWORD
  JWT_SECRET
  RESEND_API_KEY
  NOTIFICACAO_EMAIL_MECANICOS
  NOTIFICACAO_EMAIL_ADMIN
)

required_vars=(
  "${template_vars[@]}"
  NODE_ENV
  POSTGRES_HOST
  POSTGRES_PORT
  POSTGRES_DB
  POSTGRES_SYNC
  POSTGRES_SSL
  POSTGRES_SSL_REJECT_UNAUTHORIZED
  JWT_EXPIRES_IN
  POSTGRES_USER
  POSTGRES_PASSWORD
  JWT_SECRET
  RESEND_API_KEY
  NOTIFICACAO_EMAIL_MECANICOS
  NOTIFICACAO_EMAIL_ADMIN
)

missing_vars=()
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing_vars+=("${var}")
  fi
done

if ((${#missing_vars[@]} > 0)); then
  echo "Variaveis obrigatorias ausentes ou vazias:" >&2
  printf '  - %s\n' "${missing_vars[@]}" >&2
  echo "Carregue as variaveis antes de renderizar o overlay." >&2
  exit 1
fi

validate_dns_label() {
  local var_name="$1"
  local value="${!var_name}"

  if ((${#value} > 63)) || [[ ! "${value}" =~ ^[a-z0-9]([-a-z0-9]*[a-z0-9])?$ ]]; then
    echo "${var_name} deve ser um nome DNS Kubernetes valido, com no maximo 63 caracteres: ${value}" >&2
    exit 1
  fi
}

validate_integer_range() {
  local var_name="$1"
  local min="$2"
  local max="$3"
  local value="${!var_name}"

  if [[ ! "${value}" =~ ^[0-9]+$ ]] || ((10#${value} < min || 10#${value} > max)); then
    echo "${var_name} deve ser um inteiro entre ${min} e ${max}: ${value}" >&2
    exit 1
  fi
}

validate_dns_label API_NAME
validate_dns_label PROJECT_NAME
validate_dns_label APP_INSTANCE
validate_dns_label KUBERNETES_NAMESPACE
validate_integer_range API_REPLICAS 0 1000
validate_integer_range API_HPA_MIN_REPLICAS 1 1000
validate_integer_range API_HPA_MAX_REPLICAS 1 1000
validate_integer_range API_HPA_TARGET_CPU_UTILIZATION_PERCENTAGE 1 100
validate_integer_range APP_PORT 1 65535
validate_integer_range POSTGRES_PORT 1 65535

if ((10#${API_HPA_MIN_REPLICAS} > 10#${API_HPA_MAX_REPLICAS})); then
  echo "API_HPA_MIN_REPLICAS nao pode ser maior que API_HPA_MAX_REPLICAS." >&2
  exit 1
fi

if [[ ! "${API_IMAGE_PULL_POLICY}" =~ ^(Always|IfNotPresent|Never)$ ]]; then
  echo "API_IMAGE_PULL_POLICY deve ser Always, IfNotPresent ou Never: ${API_IMAGE_PULL_POLICY}" >&2
  exit 1
fi

if [[ ! "${API_HEALTHCHECK_PATH}" =~ ^/[A-Za-z0-9._~/%+-]*$ ]]; then
  echo "API_HEALTHCHECK_PATH contem caracteres nao suportados: ${API_HEALTHCHECK_PATH}" >&2
  exit 1
fi

if [[ ! "${ECR_REPOSITORY_URL}" =~ ^[A-Za-z0-9][A-Za-z0-9._:/-]*$ ]]; then
  echo "ECR_REPOSITORY_URL invalida: ${ECR_REPOSITORY_URL}" >&2
  exit 1
fi

if [[ ! "${API_IMAGE_TAG}" =~ ^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$ ]]; then
  echo "API_IMAGE_TAG invalida: ${API_IMAGE_TAG}" >&2
  exit 1
fi

for var in POSTGRES_SYNC POSTGRES_SSL POSTGRES_SSL_REJECT_UNAUTHORIZED; do
  if [[ ! "${!var}" =~ ^[01]$ ]]; then
    echo "${var} deve ser 0 ou 1: ${!var}" >&2
    exit 1
  fi
done

umask 077
mkdir -p "${values_dir}"
chmod 700 "${values_dir}"
for var in "${value_vars[@]}"; do
  printf '%s' "${!var}" > "${values_dir}/${var}"
  chmod 600 "${values_dir}/${var}"
done

printf -v envsubst_vars '${%s} ' "${template_vars[@]}"

for file in "${generated_dir}"/*.yaml; do
  tmp_file="${file}.tmp"
  envsubst "${envsubst_vars}" < "${file}" > "${tmp_file}"
  mv "${tmp_file}" "${file}"
done

echo "Overlay renderizado em: ${generated_dir}"
