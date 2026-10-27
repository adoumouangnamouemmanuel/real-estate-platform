const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const digest = (values) =>
  crypto.createHash("sha256").update(JSON.stringify(values)).digest("hex");

async function perform(client, manifest, apply = false) {
  const { rows: counts } = await client.query(
    "SELECT count(*)::int n FROM public.property",
  );
  if (counts[0].n !== manifest.propertyCount)
    throw new Error(
      "Property count changed; review and regenerate the manifest.",
    );
  const properties = [],
    features = [],
    developers = [];
  for (const item of manifest.properties) {
    const {
      rows: [row],
    } = await client.query(
      "SELECT id,title,description,status,source_language_code,currency_code,rent_period FROM public.property WHERE id=$1",
      [item.id],
    );
    if (!row || digest([row.title, row.description]) !== item.textSha256)
      throw new Error("Property source text changed: " + item.id);
    if (
      row.source_language_code &&
      row.source_language_code !== item.sourceLanguage
    )
      throw new Error("Conflicting property source language: " + item.id);
    if (
      row.currency_code &&
      item.currencyCode &&
      row.currency_code !== item.currencyCode
    )
      throw new Error("Conflicting currency: " + item.id);
    properties.push({ item, row });
  }
  for (const item of manifest.features) {
    const {
      rows: [row],
    } = await client.query(
      "SELECT id,feature_name FROM public.feature WHERE id=$1",
      [item.id],
    );
    if (!row || digest([row.feature_name]) !== item.textSha256)
      throw new Error("Feature source text changed: " + item.id);
    features.push({ item, row });
  }
  for (const item of manifest.developers) {
    const {
      rows: [row],
    } = await client.query(
      "SELECT id,bio,specialization FROM public.property_developer WHERE id=$1",
      [item.id],
    );
    if (!row || digest([row.bio, row.specialization]) !== item.textSha256)
      throw new Error("Developer source text changed: " + item.id);
    developers.push({ item, row });
  }
  if (!apply)
    return {
      properties: properties.length,
      features: features.length,
      developers: developers.length,
      applied: false,
    };
  try {
    for (const { item, row } of properties) {
      await client.query(
        "INSERT INTO public.property_translation(property_id,language_code,title,description,is_published)VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",
        [
          item.id,
          item.sourceLanguage,
          row.title,
          row.description,
          row.status === "ACTIVE",
        ],
      );
      await client.query(
        "UPDATE public.property SET source_language_code=$2,currency_code=coalesce(currency_code,$3),rent_period=coalesce(rent_period,$4) WHERE id=$1",
        [item.id, item.sourceLanguage, item.currencyCode, item.rentPeriod],
      );
    }
    for (const { item, row } of features) {
      await client.query(
        "INSERT INTO public.feature_translation(feature_id,language_code,name)VALUES($1,$2,$3)ON CONFLICT DO NOTHING",
        [item.id, item.sourceLanguage, row.feature_name],
      );
      for (const t of item.translations ?? [])
        await client.query(
          "INSERT INTO public.feature_translation(feature_id,language_code,name)VALUES($1,$2,$3)ON CONFLICT DO NOTHING",
          [item.id, t.languageCode, t.name],
        );
      await client.query(
        "UPDATE public.feature SET source_language_code=$2 WHERE id=$1",
        [item.id, item.sourceLanguage],
      );
    }
    for (const { item, row } of developers) {
      await client.query(
        "INSERT INTO public.property_developer_translation(developer_id,language_code,bio,specialization)VALUES($1,$2,$3,$4)ON CONFLICT DO NOTHING",
        [item.id, item.sourceLanguage, row.bio, row.specialization],
      );
      await client.query(
        "UPDATE public.property_developer SET source_language_code=$2 WHERE id=$1",
        [item.id, item.sourceLanguage],
      );
    }
    return {
      properties: properties.length,
      features: features.length,
      developers: developers.length,
      applied: true,
    };
  } catch (error) {
    throw error;
  }
}
async function backfill(client, manifest, apply = false) {
  await client.query(
    apply ? "BEGIN ISOLATION LEVEL SERIALIZABLE" : "BEGIN READ ONLY",
  );
  try {
    const result = await perform(client, manifest, apply);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
async function main() {
  const apply = process.argv.includes("--apply");
  if (
    apply &&
    (!process.env.LUMAVOK_DATABASE_APPROVAL ||
      !process.env.LUMAVOK_RESTORE_TEST_REFERENCE ||
      !process.env.LUMAVOK_CONTENT_REVIEW_REFERENCE)
  )
    throw new Error(
      "Apply requires approved deployment, restore and content-review references.",
    );
  const manifestPath = process.env.LUMAVOK_CONTENT_MANIFEST;
  if (!manifestPath)
    throw new Error(
      "Supply the reviewed private manifest path in LUMAVOK_CONTENT_MANIFEST.",
    );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const { Client } = require("pg"),
    client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  try {
    console.log(JSON.stringify(await backfill(client, manifest, apply)));
  } finally {
    await client.end();
  }
}
module.exports = { backfill, digest };
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
