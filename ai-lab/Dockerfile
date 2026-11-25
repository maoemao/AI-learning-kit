FROM node:22.23.3-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run ingest
# The learning server binds loopback. Use host networking on Linux for local experiments;
# production deployment requires authentication and an explicit network/security design.
CMD ["npm","start"]
