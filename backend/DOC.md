Using ts-node-esm


fix for the ERR_UNKNOWN_FILE_EXTENSION
//"dev": "npx nodemon --exec ts-node src/server.ts",
"dev": "nodemon --exec node --loader ts-node/esm src/server.ts"
source: [Salamante](https://github.com/remy/nodemon/issues/2155#issuecomment-1876039915)
referencing: [This GitHub Thread](https://github.com/remy/nodemon/issues/url)

