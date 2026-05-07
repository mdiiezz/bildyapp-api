FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nodeapp

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nodeapp:nodejs . .

RUN mkdir -p uploads \
  && chown -R nodeapp:nodejs uploads

USER nodeapp

EXPOSE 3000

CMD ["node", "src/index.js"]