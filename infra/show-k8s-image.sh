#!/usr/bin/env bash
set -Eeuo pipefail

namespace="${KUBERNETES_NAMESPACE:-${TF_VAR_kubernetes_namespace:-oficina-mecanica}}"
api_name="${API_NAME:-${TF_VAR_api_name:-fase2-kubernetes-oficina-mecanica-api}}"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "Comando obrigatorio nao encontrado: kubectl" >&2
  exit 1
fi

kubectl -n "${namespace}" get deployment "${api_name}" \
  -o jsonpath='{.spec.template.spec.containers[0].image}'
echo
