# Base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all app files
COPY . .

# Build Next.js app
RUN npm run build

# Expose port (App Engine expects 8080)
EXPOSE 8080

# Start the app
CMD [ "npm", "run", "start" ]