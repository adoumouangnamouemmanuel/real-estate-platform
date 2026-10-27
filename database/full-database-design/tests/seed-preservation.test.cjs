const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const expected = {
  "seeds/developers.seed.ts":
    "f05696f822dde614aca3fc1caa7bd25c2c22a2757a56ae0d5454419959cf3768",
  "seeds/features.seed.ts":
    "4535f647d6c004c23598607bbbf031b264dadceebdaf54ed65a97faea6835923",
  "seeds/properties.seed.ts":
    "428ba05b4683505689b1badbf0d5bdefc77e3e9175a7b9d3cadf5ca42d3eddb1",
  "seeds/index.ts":
    "76085f2fd55a2ba7e4099b9276d5011c033b7a97a96236b7efa40c6ee8d90652",
  "seeds/locations.seed.ts":
    "0a7c510c00c60cce104e7bbf83468ef8578e5c289340bc33a746db0692516a78",
};
test("Burkina seed files remain byte-for-byte unchanged", () => {
  for (const [file, hash] of Object.entries(expected))
    assert.equal(
      crypto
        .createHash("sha256")
        .update(fs.readFileSync(path.join(root, file)))
        .digest("hex"),
      hash,
      file,
    );
});
test("deployment fails closed before contacting a database when audited migrations are missing", () => {
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/deploy-reviewed.cjs")],
    { encoding: "utf8", env: { ...process.env, DIRECT_URL: "" } },
  );
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /Missing audited migration: 20260831000001_expand_enums/,
  );
});
test("seed runner denies production even with an override flag", () => {
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/seed-local.cjs")],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://localhost/test",
        LUMAVOK_ALLOW_LOCAL_SEED: "1",
      },
    },
  );
  assert.equal(result.status, 1);
});
