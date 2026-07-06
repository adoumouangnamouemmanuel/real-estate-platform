# FROM node:lts-alpine
# ENV NODE_ENV=production
# WORKDIR /app
# COPY package*.json ./
# RUN npm install --production --silent && mv node_modules ../
# COPY . .
# EXPOSE 3000
# RUN chown -R node /app
# USER node
# CMD ["npm", "run", "dev"]

FROM node:20-alpine
WORKDIR /app

# Copy the package manifests
COPY ./package*.json ./

# FIX: Force npm to include all development tooling, ignoring production defaults
RUN npm ci --development

# Copy the rest of your local codebase
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]