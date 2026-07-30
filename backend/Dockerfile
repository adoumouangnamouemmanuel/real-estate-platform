FROM node:20-alpine
WORKDIR /app

# Install OpenSSL required by Prisma's query engine on Alpine
RUN apk add --no-cache openssl

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --development

# Copy database schema into the container
COPY database ./database

# Copy backend source files
COPY backend/ .

# Generate the Prisma client inside /app/node_modules
RUN npx prisma generate --schema=./database/schema.prisma

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]