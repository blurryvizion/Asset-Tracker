# Step 1: build the React app
FROM node:22-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Step 2: the server image, with only what it needs to run
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY --from=client /app/client/dist ./client/dist

EXPOSE 4000
CMD ["node", "src/index.js"]
