#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

aws_region="${AWS_REGION_OUT:-${AWS_REGION:-${AWS_DEFAULT_REGION:-}}}"
image_platform="${API_IMAGE_PLATFORM:-linux/amd64}"

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

required_vars=(ECR_REPOSITORY_URL API_IMAGE_TAG)
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

if [[ "${ECR_REPOSITORY_URL}" != */* ]]; then
  echo "ECR_REPOSITORY_URL deve conter o registry e o repositorio: ${ECR_REPOSITORY_URL}" >&2
  exit 1
fi

if [[ ! "${API_IMAGE_TAG}" =~ ^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$ ]]; then
  echo "API_IMAGE_TAG invalida: ${API_IMAGE_TAG}" >&2
  exit 1
fi

if [[ ! "${image_platform}" =~ ^linux/(amd64|arm64)(/v[0-9]+)?$ ]]; then
  echo "API_IMAGE_PLATFORM invalida: ${image_platform}" >&2
  exit 1
fi

ecr_registry="${ECR_REPOSITORY_URL%%/*}"
image="${ECR_REPOSITORY_URL}:${API_IMAGE_TAG}"

echo "Autenticando no ECR: ${ecr_registry}"
aws ecr get-login-password --region "${aws_region}" \
  | docker login --username AWS --password-stdin "${ecr_registry}"

echo "Publicando ${image} para ${image_platform}"
docker buildx build \
  --platform "${image_platform}" \
  --tag "${image}" \
  --push \
  "${PROJECT_ROOT}"

echo "Imagem publicada: ${image} (${image_platform})"
