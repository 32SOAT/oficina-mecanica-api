#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

namespace="${KUBERNETES_NAMESPACE:-${TF_VAR_kubernetes_namespace:-oficina-mecanica}}"
api_name="${API_NAME:-${TF_VAR_api_name:-fase2-kubernetes-oficina-mecanica-api}}"
delete_namespace="${DELETE_NAMESPACE:-1}"

if command -v kubectl >/dev/null 2>&1; then
  kubectl -n "${namespace}" delete hpa "${api_name}" --ignore-not-found=true
  kubectl -n "${namespace}" delete service "${api_name}" --ignore-not-found=true
  kubectl -n "${namespace}" delete deployment "${api_name}" --ignore-not-found=true
  kubectl -n "${namespace}" delete configmap "${api_name}-config" --ignore-not-found=true
  kubectl -n "${namespace}" delete secret "${api_name}-secret" --ignore-not-found=true

  if [[ "${delete_namespace}" == "1" ]]; then
    kubectl delete namespace "${namespace}" --ignore-not-found=true
  fi
else
  echo "kubectl nao encontrado; pulando limpeza do Kubernetes." >&2
  echo "Se existir Service LoadBalancer no cluster, o destroy da infraestrutura pode falhar por dependencias." >&2
fi

terraform -chdir="${SCRIPT_DIR}" destroy "$@"
