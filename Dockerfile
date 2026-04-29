# Build Stage
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build the frontend
COPY . .
RUN npm run build

# Production Stage
FROM node:22-slim

WORKDIR /app

# Set environment variable for production
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from builder
# We need package.json, server.ts, node_modules, and dist/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
