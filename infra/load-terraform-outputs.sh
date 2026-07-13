#!/usr/bin/env bash

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "Use 'source ./load-terraform-outputs.sh' para carregar os outputs no shell atual." >&2
  exit 1
fi

INFRA_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

terraform_output_raw() {
  terraform -chdir="${INFRA_DIR}" output -raw "$1"
}

export CLUSTER_NAME="$(terraform_output_raw cluster_name)"
export AWS_REGION_OUT="$(terraform_output_raw aws_region)"
export ECR_REPOSITORY_URL="$(terraform_output_raw ecr_repository_url)"
export KUBERNETES_NAMESPACE="$(terraform_output_raw kubernetes_namespace)"
export API_SERVICE_NAME="$(terraform_output_raw api_service_name)"
export API_NAME="${API_SERVICE_NAME}"
export PROJECT_NAME="$(terraform_output_raw project_name)"
export APP_INSTANCE="$(terraform_output_raw app_instance)"
export APP_PORT="$(terraform_output_raw api_container_port)"
export POSTGRES_HOST="$(terraform_output_raw postgres_address)"
