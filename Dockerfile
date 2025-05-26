# Tahap 1: Builder - Membangun aplikasi Next.js
FROM node:20-alpine AS builder
WORKDIR /app

# Set NODE_ENV ke production untuk build yang optimal
ENV NODE_ENV production

# 1. Deklarasikan build argument yang akan diterima dari Cloud Build
ARG NEXT_PUBLIC_URL_SERVER_ARG

# 2. Set environment variable dari build argument agar bisa digunakan oleh 'npm run build'
#    Next.js akan mengambil variabel dengan prefix NEXT_PUBLIC_ untuk di-bundle ke client-side.
ENV NEXT_PUBLIC_URL_SERVER=${NEXT_PUBLIC_URL_SERVER_ARG}

# Copy package.json dan package-lock.json (atau yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install 

# Copy sisa kode aplikasi
COPY . .

# Build aplikasi Next.js
# Proses ini akan menggunakan ENV NEXT_PUBLIC_URL_SERVER yang sudah disetel di atas
RUN npm run build

# Tahap 2: Runner - Menjalankan aplikasi Next.js yang sudah di-build
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# App Engine Flex akan menyediakan variabel PORT, biasanya 8080.
ENV PORT 8080

# Buat user dan group non-root untuk keamanan
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001 -G nodejs

# Copy hasil build dan dependensi produksi dari tahap builder
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
# Menyalin node_modules dari builder stage (akan membuat image lebih besar)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Ganti ke user non-root
USER nextjs

EXPOSE 8080

# Pastikan skrip "start" di package.json Anda menggunakan $PORT atau PORT
# Contoh: "start": "next start -p $PORT"
CMD [ "npm", "run", "start" ]