# -------------------------------------------------------------
# Stage 1: Build the Vite SPA
# -------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_CORE_API_URL=http://127.0.0.1:8000
ENV VITE_CORE_API_URL=$VITE_CORE_API_URL

# Install dependencies based on lockfile for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci

# Copy project files and build
COPY . .
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Serve with lightweight Nginx
# -------------------------------------------------------------
FROM nginx:alpine

# Copy custom Nginx configuration for SPA and Mini App headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
