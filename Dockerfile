FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .
RUN mkdir -p /app/runtime && chown node:node /app/runtime

USER node
EXPOSE 3000
CMD ["node", "docker-entrypoint.js"]
