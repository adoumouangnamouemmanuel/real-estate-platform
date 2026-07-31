FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl

# Recreate the monorepo layout: database/ and backend/ as siblings under /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --development

COPY database ./database
COPY backend/ ./backend/

# Same command your local db:generate script runs — now resolves identically
RUN cd database && npx prisma generate --schema=./schema.prisma

# step into backend and run the dev server
WORKDIR /app/backend
EXPOSE 3000
CMD ["npm", "run", "dev"]