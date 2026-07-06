FROM node:20-alpine
WORKDIR /app

# Copy the backend files from the build context
COPY package*.json ./

# FIX: Force npm to install ALL dependencies, including devDependencies like nodemon
RUN npm ci --include=dev

COPY . .

EXPOSE 5000
CMD ["npm", "run", "dev"]