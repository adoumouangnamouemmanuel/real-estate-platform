# Routine

- Fire up Docker Containers
docker compose up -d

- Create RDB Tables inside the running Docker database
npx prisma db push

- Updates @prisma/client (that lives inside node_modules) so VS Code knows exactly what models exist
npx prisma generate

or, from backend/

npx prisma generate --schema=../database/schema.prisma

- 



- Dockerfile
FROM node:20-alpine
WORKDIR /app

# Copy the backend files from the build context
COPY package*.json ./

# FIX: Force npm to install ALL dependencies, including devDependencies like nodemon
RUN npm ci --include=dev

COPY . .

EXPOSE 5000
CMD ["npm", "run", "dev"]



- Start everything in the background
docker compose up -d

- Run, rebuild the images if there are any changes
docker compose up --build

- Stop/Remove all containers
docker compose down

- Pause Containers
docker compose stop

- Continue from pause
docker compose start

- See images
docker images

- Delete an image
docker rmi <IMAGE_ID_OR_NAME>

- CLear start
docker system prune -a --volumes


# GIT & GITHUB
git fetch origin
git merge origin/master
git push origin <my_branch>


