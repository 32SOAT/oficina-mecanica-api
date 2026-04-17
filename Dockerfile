# ---- Stage 1: Build ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# ---- Stage 2: Production ----
FROM node:22-alpine AS production

WORKDIR /app

COPY --chown=node:node package.json package-lock.json ./

RUN npm ci --omit=dev

COPY --chown=node:node --from=build /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
