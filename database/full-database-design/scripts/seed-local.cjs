const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
let host;
try {
  host = new URL(process.env.DATABASE_URL).hostname;
} catch {}
if (
  process.env.NODE_ENV === "production" ||
  !["localhost", "127.0.0.1", "[::1]"].includes(host) ||
  process.env.LUMAVOK_ALLOW_LOCAL_SEED !== "1"
) {
  console.error(
    "Seed runner is restricted to explicitly enabled local development databases.",
  );
  process.exitCode = 1;
} else {
  // Legacy seeds stay byte-for-byte unchanged. Do not partially populate an
  // expanded database using a script without locale/slug metadata.
  if (process.env.LUMAVOK_PRE_EXPANSION_SEED !== "1") {
    console.error(
      "Legacy seeds require an explicitly selected pre-expansion local database; use architecture test fixtures for the expanded schema.",
    );
    process.exit(1);
  }

  const root = path.resolve(__dirname, "..");
  const check = spawnSync(
    process.execPath,
    [
      "-e",
      `const {Client}=require('pg');(async()=>{const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();try{const {rows:[r]}=await db.query("SELECT to_regclass('public.language') AS expanded,to_regclass('public.property') AS original");if(r.expanded||!r.original)throw new Error('not pre-expansion');}finally{await db.end();}})().catch(()=>{console.error('Seed preflight requires an original, pre-expansion local database.');process.exitCode=1;});`,
    ],
    { cwd: root, stdio: "inherit", env: process.env },
  );
  if (check.status !== 0) {
    process.exitCode = 1;
    return;
  }
  const legacy = spawnSync(
    "git",
    [
      "show",
      "cd80160779dcd2bdcebee1e12692d695e7380d42:database/full-database-design/schema.prisma",
    ],
    { cwd: root, encoding: "utf8" },
  );
  if (legacy.status !== 0) {
    console.error(
      "Pinned repository history is required for the legacy local seed model.",
    );
    process.exit(1);
  }
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), "lumavok-legacy-seed-"),
  );
  try {
    const schema = path.join(temporary, "schema.prisma");
    const output = path.join(root, "node_modules/.prisma/client");
    fs.writeFileSync(
      schema,
      legacy.stdout.replace(
        "generator client {",
        "generator client {\n  output = " + JSON.stringify(output),
      ),
    );
    const seedEnv = { ...process.env, DIRECT_URL: process.env.DATABASE_URL };
    const generated = spawnSync(
      process.execPath,
      [
        require.resolve("prisma/build/index.js"),
        "generate",
        "--schema",
        schema,
      ],
      { cwd: root, stdio: "inherit", env: seedEnv },
    );
    if (generated.status !== 0) process.exitCode = generated.status ?? 1;
    else {
      const result = spawnSync(
        process.execPath,
        [
          require.resolve("ts-node/dist/bin.js"),
          path.join(root, "seeds/index.ts"),
        ],
        { cwd: root, stdio: "inherit", env: seedEnv },
      );
      process.exitCode = result.status ?? 1;
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
