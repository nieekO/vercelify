# Stage 1: Frontend Build
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend + Frontend serving
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./
RUN npm run build
COPY --from=frontend-build /app/frontend/dist ./public
RUN mkdir -p ./data
EXPOSE 3001
CMD ["node", "dist/index.js"]
