FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY frontend/package.json ./frontend/
RUN npm install --workspaces --include-workspace-root

COPY shared ./shared
COPY frontend ./frontend
RUN npm run build -w frontend

FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8000
CMD ["nginx", "-g", "daemon off;"]