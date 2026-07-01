#!/usr/bin/env bash

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "Use 'source ./load-k8s-template-vars.sh' para carregar as variaveis no shell atual." >&2
  exit 1
fi

export API_NAME="${TF_VAR_api_name:-fase2-kubernetes-oficina-mecanica-api}"
export PROJECT_NAME="${TF_VAR_project_name:-oficina-mecanica}"
export APP_INSTANCE="${PROJECT_NAME}-${TF_VAR_environment:-dev}"
export APP_PORT="${TF_VAR_api_container_port:-3000}"

export API_REPLICAS="${TF_VAR_api_replicas:-1}"
export API_HEALTHCHECK_PATH="${TF_VAR_api_healthcheck_path:-/api/v1/health}"
export API_IMAGE_PULL_POLICY="${TF_VAR_api_image_pull_policy:-Always}"
export API_HPA_MIN_REPLICAS="${TF_VAR_api_hpa_min_replicas:-1}"
export API_HPA_MAX_REPLICAS="${TF_VAR_api_hpa_max_replicas:-3}"
export API_HPA_TARGET_CPU_UTILIZATION_PERCENTAGE="${TF_VAR_api_hpa_target_cpu_utilization_percentage:-70}"
export NODE_ENV="${TF_VAR_node_env:-production}"
export POSTGRES_PORT="${TF_VAR_db_port:-5432}"
export POSTGRES_DB="${TF_VAR_db_name}"
export POSTGRES_SYNC="${TF_VAR_postgres_sync:-0}"
export POSTGRES_SSL="${TF_VAR_postgres_ssl:-1}"
export POSTGRES_SSL_REJECT_UNAUTHORIZED="${TF_VAR_postgres_ssl_reject_unauthorized:-0}"
export JWT_EXPIRES_IN="${TF_VAR_jwt_expires_in:-1h}"
export POSTGRES_USER="${TF_VAR_db_username}"
export POSTGRES_PASSWORD="${TF_VAR_db_password}"
export JWT_SECRET="${TF_VAR_jwt_secret}"
