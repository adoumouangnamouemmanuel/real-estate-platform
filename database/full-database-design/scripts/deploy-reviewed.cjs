// Read-only by default. Never bypass the missing-history gate.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const expected = {
  "20260629000000_init":
    "6463d2eaa9074e955a7af437959f164a8f77c968d54c0459339fd3e97acb580a",
  "20260831000001_expand_enums":
    "d65a7b8abef1ec0a04c18da2dccaabd8e1c0d9b9f8d29a3e21c28d20f64c89e5",
  "20260831000002_add_tables_and_columns":
    "768cd85a9e674e8f2dd50568b26e8433e64e2eacb8320e46335422d913eee2a5",
};
async function main() {
  for (const [name, checksum] of Object.entries(expected)) {
    const file = path.join(root, "migrations", name, "migration.sql");
    if (!fs.existsSync(file))
      throw new Error(
        "Missing audited migration: " +
          name +
          ". Recover the original file; do not invent a matching history entry.",
      );
    if (
      crypto
        .createHash("sha256")
        .update(fs.readFileSync(file))
        .digest("hex") !== checksum
    )
      throw new Error("Migration checksum mismatch: " + name);
  }
  if (!process.env.DIRECT_URL)
    throw new Error(
      "DIRECT_URL must be supplied through the secure deployment environment.",
    );
  const { Client } = require("pg"),
    client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  try {
    const result = await client.query(
      "SELECT migration_name,checksum FROM public._prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL",
    );
    for (const row of result.rows) {
      const file = path.join(
        root,
        "migrations",
        row.migration_name,
        "migration.sql",
      );
      if (
        !fs.existsSync(file) ||
        crypto
          .createHash("sha256")
          .update(fs.readFileSync(file))
          .digest("hex") !== row.checksum
      )
        throw new Error(
          "Database migration history cannot be replayed: " +
            row.migration_name,
        );
    }
    console.log("Historical migration checksums verified.");
  } finally {
    await client.end();
  }
  if (!process.argv.includes("--apply")) {
    console.log("Read-only preflight completed. No migrations applied.");
    return;
  }
  if (
    !process.env.LUMAVOK_DATABASE_APPROVAL ||
    !process.env.LUMAVOK_RESTORE_TEST_REFERENCE
  )
    throw new Error(
      "Deployment requires the database approval and restore-test references in the secure deployment environment.",
    );
  const result = spawnSync(
    process.execPath,
    [
      require.resolve("prisma/build/index.js"),
      "migrate",
      "deploy",
      "--schema",
      path.join(root, "schema.prisma"),
    ],
    { cwd: root, stdio: "inherit", env: process.env },
  );
  if (result.status !== 0)
    throw new Error("Migration deployment did not complete.");
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
