#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

namespace="${KUBERNETES_NAMESPACE:-${TF_VAR_kubernetes_namespace:-oficina-mecanica}}"
api_name="${API_NAME:-${TF_VAR_api_name:-fase2-kubernetes-oficina-mecanica-api}}"
job_name="${api_name}-migrations"
job_manifest="${PROJECT_ROOT}/k8s/overlays/generated/migration-job.yaml"
timeout_seconds="${MIGRATION_JOB_TIMEOUT_SECONDS:-300}"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "Comando obrigatorio nao encontrado: kubectl" >&2
  exit 1
fi

if [[ ! -f "${job_manifest}" ]]; then
  echo "Manifesto nao encontrado: ${job_manifest}" >&2
  echo "Rode ./infra/prepare-k8s-overlay.sh e ./infra/render-k8s-overlay.sh antes." >&2
  exit 1
fi

# O spec de um Job e imutavel; remover a execucao anterior antes de aplicar.
kubectl -n "${namespace}" delete job "${job_name}" --ignore-not-found --wait=true

kubectl apply -f "${job_manifest}"

echo "Aguardando job ${job_name} (timeout: ${timeout_seconds}s)..."
elapsed=0
while true; do
  succeeded="$(kubectl -n "${namespace}" get job "${job_name}" -o jsonpath='{.status.succeeded}' 2>/dev/null || echo '')"
  failed="$(kubectl -n "${namespace}" get job "${job_name}" -o jsonpath='{.status.failed}' 2>/dev/null || echo '')"

  if [[ "${succeeded:-0}" -ge 1 ]]; then
    echo "Migrations executadas com sucesso."
    kubectl -n "${namespace}" logs "job/${job_name}" --tail=50 || true
    exit 0
  fi

  if [[ "${failed:-0}" -ge 2 ]]; then
    echo "Job de migrations falhou." >&2
    kubectl -n "${namespace}" logs "job/${job_name}" --all-containers --tail=100 || true
    exit 1
  fi

  if (( elapsed >= timeout_seconds )); then
    echo "Timeout aguardando o job de migrations." >&2
    kubectl -n "${namespace}" describe job "${job_name}" || true
    kubectl -n "${namespace}" logs "job/${job_name}" --all-containers --tail=100 || true
    exit 1
  fi

  sleep 5
  elapsed=$((elapsed + 5))
done
