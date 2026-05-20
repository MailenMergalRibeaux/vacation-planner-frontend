# === Build Stage =====================================================
FROM node:20-alpine AS build

WORKDIR /app

# Nur package-Dateien zuerst kopieren, um Layer-Caching zu nutzen
COPY package*.json ./
RUN npm ci

# Quellcode kopieren und Angular-Build ausführen
COPY . .
RUN npm run build -- --configuration production
# oder einfach: RUN npm run build

# === Runtime Stage ===================================================
FROM nginx:1.27-alpine

# Angular-Build nach Nginx kopieren (Pfad aus angular.json: outputPath)
COPY --from=build /app/dist/vacation-planner /usr/share/nginx/html

# Nginx-Config für SPA & API-Proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]