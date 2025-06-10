# Build stage for frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Build stage for backend
FROM node:18-alpine as backend-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy frontend build
COPY --from=frontend-build /app/client/build ./client/build

# Copy backend
COPY --from=backend-build /app/server ./server

# Install production dependencies
WORKDIR /app/server
RUN npm install --production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"] 