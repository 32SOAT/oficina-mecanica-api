#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

templates_dir="${PROJECT_ROOT}/k8s/templates"
generated_dir="${PROJECT_ROOT}/k8s/overlays/generated"
values_dir="${generated_dir}/values"

mkdir -p "${generated_dir}"
rm -f "${generated_dir}"/*.yaml
mkdir -p "${values_dir}"
rm -f "${values_dir}"/*

cp "${templates_dir}/deployment.yaml" "${generated_dir}/"
cp "${templates_dir}/hpa.yaml" "${generated_dir}/"
cp "${templates_dir}/kustomization.yaml" "${generated_dir}/"
cp "${templates_dir}/namespace.yaml" "${generated_dir}/"
cp "${templates_dir}/service.yaml" "${generated_dir}/"

echo "Overlay preparado em: ${generated_dir}"
