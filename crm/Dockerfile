FROM node:20-alpine AS ui-build
WORKDIR /app/crm-ui
COPY crm-ui/package*.json ./
RUN npm ci
COPY crm-ui/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
COPY --from=ui-build /app/crm-ui/dist ./crm-ui/dist
EXPOSE ${CRM_PORT:-8081}
CMD ["node", "server.js"]
