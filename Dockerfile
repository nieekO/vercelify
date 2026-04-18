# Stage 1: Frontend Build
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN NODE_ENV=development npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend Build (needs devDependencies for tsc)
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY backend/package*.json ./
RUN NODE_ENV=development npm install
COPY backend/ ./
RUN npm run build

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY --from=backend-build /app/dist ./dist
COPY --from=frontend-build /app/frontend/dist ./public
RUN mkdir -p ./data
EXPOSE 3001
CMD ["node", "dist/index.js"]
