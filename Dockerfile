# Production image for the staff dashboard (admin.alnojoommeat.sa). Build from the repo root:
#
#   docker build -t alnojoom-dashboard .
#
# VITE_API_URL is written into the code at build time. Empty (the default here) = the dashboard calls
# /api on its own domain, and the reverse proxy in front sends /api and /health to the API container.
# That is how the server is set up, and it avoids cross-domain cookies. To call the API directly instead:
#   --build-arg VITE_API_URL=https://api.alnojoommeat.sa   (then list the dashboard in the API's CORS_ORIGINS)
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
