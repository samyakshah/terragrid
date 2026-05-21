FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY backend/package.json ./backend/
RUN npm install --workspaces --include-workspace-root

COPY shared ./shared
COPY backend ./backend
RUN npm run build -w backend

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/shared ./shared
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/package.json ./package.json
EXPOSE 3001
CMD ["node", "backend/dist/index.js"]