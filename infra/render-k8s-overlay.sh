#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"
generated_dir="${PROJECT_ROOT}/k8s/overlays/generated"

if ! command -v envsubst >/dev/null 2>&1; then
  echo "Comando obrigatorio nao encontrado: envsubst" >&2
  exit 1
fi

if ! find "${generated_dir}" -maxdepth 1 -type f -name '*.yaml' -print -quit | grep -q .; then
  echo "Nenhum YAML encontrado em ${generated_dir}. Rode ./infra/prepare-k8s-overlay.sh antes." >&2
  exit 1
fi

envsubst_vars='${API_NAME} ${PROJECT_NAME} ${APP_INSTANCE} ${KUBERNETES_NAMESPACE} ${API_REPLICAS} ${API_HEALTHCHECK_PATH} ${API_IMAGE_PULL_POLICY} ${API_HPA_MIN_REPLICAS} ${API_HPA_MAX_REPLICAS} ${API_HPA_TARGET_CPU_UTILIZATION_PERCENTAGE} ${ECR_REPOSITORY_URL} ${API_IMAGE_TAG} ${NODE_ENV} ${APP_PORT} ${POSTGRES_HOST} ${POSTGRES_PORT} ${POSTGRES_DB} ${POSTGRES_SYNC} ${POSTGRES_SSL} ${POSTGRES_SSL_REJECT_UNAUTHORIZED} ${JWT_EXPIRES_IN} ${POSTGRES_USER} ${POSTGRES_PASSWORD} ${JWT_SECRET}'

for file in "${generated_dir}"/*.yaml; do
  tmp_file="${file}.tmp"
  envsubst "${envsubst_vars}" < "${file}" > "${tmp_file}"
  mv "${tmp_file}" "${file}"
done

echo "Overlay renderizado em: ${generated_dir}"
