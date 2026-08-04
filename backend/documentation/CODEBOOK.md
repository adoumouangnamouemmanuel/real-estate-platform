# Routine

#### Fire up Docker Containers
`docker compose up -d`

#### Create RDB Tables inside the running Docker database
`npx prisma db push`

#### Updates @prisma/client (that lives inside node_modules) so VS Code knows exactly what models exist
`npx prisma generate`

npm test

docker compose down -v
docker compose build --no-cache backend
docker compose up

or, from backend/

`npx prisma generate --schema=../database/schema.prisma`

# Branches & Commits
### Branches
type/TICKET-ID-description
feature/LUMAVOK-013-auth-endpoints

### Commit Messages
type(scope): description
feat(auth): add registration controllers

# Docker Reference
#### Start everything in the background
`docker compose up -d`

#### Run, rebuild the images if there are any changes
`docker compose up --build`

#### Stop/Remove all containers
`docker compose down`

#### Pause Containers
`docker compose stop`

#### Continue from pause
`docker compose start`

#### See images
`docker images`

#### Delete an image
`docker rmi <IMAGE_ID_OR_NAME>`

#### Clear start
`docker system prune -a --volumes`


# Git & Github Reference
#### 1. Remote Branches
`git branch -a`

#### 1. Get Changes from another Branch
`git fetch origin` or `git fetch origin <some_branch>`

#### 2. Merge those changes into our current branch
`git merge origin/master`

#### 3. Send this branch to GitHub (origin)
`git push origin <my_branch>`

