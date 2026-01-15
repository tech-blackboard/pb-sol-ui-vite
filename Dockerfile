# ============================
# 1. Build Stage
# ============================
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production=false

# Build argument for environment (defaults to production)
ARG BUILD_ENV=production

# Copy environment file based on BUILD_ENV
COPY .env.${BUILD_ENV} .env

# Copy rest of source
COPY . .

# Build with specified env
RUN npm run build

# ============================
# 2. NGINX Serve Stage
# ============================
FROM nginx:alpine

# Build argument for environment
ARG BUILD_ENV=production

# Remove default NGINX website
RUN rm -rf /usr/share/nginx/html/*

# Copy build files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom NGINX configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Set environment variable for API backend (will be substituted by nginx at runtime)
ENV API_BACKEND_HOST=pb-api-${BUILD_ENV}

# Create error page
RUN echo '<html><body><h1>503 Service Temporarily Unavailable</h1></body></html>' > /usr/share/nginx/html/50x.html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start NGINX (envsubst happens automatically via /docker-entrypoint.d/20-envsubst-on-templates.sh)
CMD ["nginx", "-g", "daemon off;"]