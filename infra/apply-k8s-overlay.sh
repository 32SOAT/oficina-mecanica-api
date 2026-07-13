#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

overlay_dir="${PROJECT_ROOT}/k8s/overlays/generated"
namespace="${KUBERNETES_NAMESPACE:-${TF_VAR_kubernetes_namespace:-oficina-mecanica}}"
api_name="${API_NAME:-${TF_VAR_api_name:-fase2-kubernetes-oficina-mecanica-api}}"
timeout="${KUBECTL_ROLLOUT_TIMEOUT:-5m}"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "Comando obrigatorio nao encontrado: kubectl" >&2
  exit 1
fi

if [[ ! -d "${overlay_dir}" ]]; then
  echo "Diretorio de overlay nao encontrado: ${overlay_dir}" >&2
  echo "Rode ./infra/prepare-k8s-overlay.sh e ./infra/render-k8s-overlay.sh antes." >&2
  exit 1
fi

kubectl apply -k "${overlay_dir}"
kubectl -n "${namespace}" rollout restart "deployment/${api_name}"
kubectl -n "${namespace}" rollout status "deployment/${api_name}" --timeout="${timeout}"
