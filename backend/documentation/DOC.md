Using ts-node-esm

fix for the ERR_UNKNOWN_FILE_EXTENSION
//"dev": "npx nodemon --exec ts-node src/server.ts",
"dev": "nodemon --exec node --loader ts-node/esm src/server.ts"
source: [Salamante](https://github.com/remy/nodemon/issues/2155#issuecomment-1876039915)
referencing: [This GitHub Thread](https://github.com/remy/nodemon/issues/url)


Get-NetTCPConnection -LocalPort 3000 -State Listen
Stop-Process -Id 21248 -Force

## Backend startup fixes applied

The following changes were made to restore local backend availability on port 3000:

- Updated the backend entry files to use ESM-compatible import paths so the app could load correctly under ts-node/esm.
- Added a simple health route at the root endpoint so localhost:3000 returns a JSON response instead of appearing blank.
- Adjusted the server bootstrap to continue serving HTTP traffic even when the database connection is unavailable during startup.
- Installed and declared the Prisma client dependency in the backend workspace.
- Generated the Prisma client and updated the Prisma schema output path to a supported location.
- Added a minimal TypeScript configuration file so the backend could be compiled and validated.
- Resolved a local port conflict that was preventing the app from binding to port 3000.

### Files involved

- backend/src/server.ts
- backend/src/app.ts
- backend/src/api/v1/index.ts
- backend/src/api/v1/auth/auth.router.ts
- backend/package.json
- backend/tsconfig.json
- database/schema.prisma

### Notes

- The backend now responds on localhost:3000.
- Database-dependent routes may still require a reachable PostgreSQL instance at localhost:5432.

