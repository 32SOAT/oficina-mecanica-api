# 🔍 Análises de qualidade e segurança

SonarQube (análise estática + cobertura) e OWASP ZAP (DAST).

## 📊 SonarQube

Análise estática de código e cobertura de testes.

### 🔼 Subir o SonarQube

```bash
docker compose up -d sonarqube
```

Painel: [http://localhost:9000](http://localhost:9000)

Login padrão: `admin` / `admin`

### 💻 Análise local (npm + npx)

Configure o token em `sonar-project.properties` (arquivo local, não versionado).

1. Gerar cobertura:

```bash
npm run test:cov
```

2. Executar o scanner:

```bash
npx sonar-scanner
```

Ou em um passo:

```bash
npm run sonar
```

### 🐳 Scanner via Docker

Substitua `SEU_TOKEN` pelo token gerado no painel:

```bash
docker run --rm \
  -e SONAR_HOST_URL="http://host.docker.internal:9000" \
  -e SONAR_TOKEN="SEU_TOKEN" \
  -v ${PWD}:/usr/src \
  sonarsource/sonar-scanner-cli
```

No Windows/Mac, use `host.docker.internal` em vez de `localhost` para acessar o SonarQube no Docker.

---

## 🛡️ OWASP ZAP

Análise dinâmica de segurança (DAST): headers, autenticação, injeções, exposição de endpoints etc.

### ✅ Pré-requisitos

- API rodando em [http://localhost:3000](http://localhost:3000)
- Token JWT obtido no login (`POST /api/v1/auth/login`)

### 🔎 Scan via OpenAPI

Substitua `SEU_TOKEN` pelo JWT:

```bash
docker run --rm -t -v "${PWD}:/zap/wrk" zaproxy/zap-stable zap-api-scan.py \
  -t http://host.docker.internal:3000/api-json \
  -f openapi \
  -r report.html \
  -z "-config replacer.full_list(0).description=auth -config replacer.full_list(0).enabled=true -config replacer.full_list(0).matchtype=REQ_HEADER_STR -config replacer.full_list(0).matchstr=Authorization -config replacer.full_list(0).replacement='Bearer SEU_TOKEN'"
```

No Windows/Mac, use `host.docker.internal` em vez de `localhost`.

O relatório `report.html` é gerado no diretório atual.

---

## 🔗 Referências

- [README principal](../../README.md)
- [Build e execução](../build/README.md)
