# Install dependencies and build
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .

# === Define ARGs ===
ARG NEXT_PUBLIC_URL_SERVER

# === Export as ENV for build-time ===
ENV NEXT_PUBLIC_URL_SERVER=$NEXT_PUBLIC_URL_SERVER_ARG

RUN npm ci
RUN npm run build

# Serve with next start
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 8080
ENV PORT 8080
CMD ["npm", "start"]