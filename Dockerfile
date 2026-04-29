# Build Stage
FROM node:22-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production Stage
FROM node:22-slim
WORKDIR /app

# Install static server
RUN npm install -g serve

# Copy build files
COPY --from=builder /app/dist ./dist

# Cloud Run uses 8080
ENV PORT=8080
EXPOSE 8080

# Serve static files
CMD ["serve", "-s", "dist", "-l", "8080"]