FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npx -y npm@11 ci
COPY . .
RUN npm run build && npx -y npm@11 prune --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 8080
CMD ["sh", "-c", "node dist/migrations/umzug.js up && node dist/scripts/seed.js && node dist/src/main"]
