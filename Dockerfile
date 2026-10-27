# Stage build
FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS builder

WORKDIR /app
RUN corepack enable

# Layer ini hanya invalid saat lockfile berubah, bukan tiap edit source.
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm fetch

COPY . .
RUN pnpm install --frozen-lockfile --offline

# VITE_* dibaca saat build dan tertanam di bundle: publik, jangan isi secret.
ARG VITE_API_BASE_URL=/
ARG VITE_TELEMETRY_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
  VITE_TELEMETRY_URL=$VITE_TELEMETRY_URL
RUN pnpm build
# Source map dan service worker MSW tidak boleh dilayani publik.
RUN find apps/crm-agent/dist \( -name '*.map' -o -name mockServiceWorker.js \) -delete

# Stage runtime
FROM nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10 AS production-stage

COPY --from=builder /app/apps/crm-agent/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.inc /etc/nginx/conf.d/security-headers.inc

RUN touch /var/run/nginx.pid && \
  chown nginx:nginx /var/run/nginx.pid && \
  chown -R nginx:nginx /var/cache/nginx

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
