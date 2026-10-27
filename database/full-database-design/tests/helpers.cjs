const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require("@electric-sql/pglite");
const root = path.resolve(__dirname, "..");
const migrations = fs
  .readdirSync(path.join(root, "migrations"))
  .filter((n) => /^20261026/.test(n))
  .sort();
async function setup(observed, Database = PGlite) {
  const db = new Database();
  await db.exec(
    `CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE ROLE supabase_admin;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id));`,
  );
  await db.exec(
    fs.readFileSync(
      path.join(
        root,
        observed
          ? "tests/fixtures/observed-schema.sql"
          : "migrations/20260629000000_init/migration.sql",
      ),
      "utf8",
    ),
  );
  for (const name of migrations)
    await db.exec(
      fs.readFileSync(
        path.join(root, "migrations", name, "migration.sql"),
        "utf8",
      ),
    );
  await db.exec(`BEGIN;
 INSERT INTO auth.users VALUES('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
 INSERT INTO public."user"(id,email,password_hash,role,auth_user_id) VALUES('u1','one@example.test','unusable','PROPERTY_DEVELOPER','00000000-0000-4000-8000-000000000001'),('u2','two@example.test','unusable','PROPERTY_DEVELOPER','00000000-0000-4000-8000-000000000002'),('buyer','buyer@example.test','unusable','USER',NULL);
 INSERT INTO public.city(id,name)VALUES('c1','Ouagadougou'),('c2','Bobo-Dioulasso');
 INSERT INTO public.district(id,city_id,name)VALUES('d1','c1','Zone du Bois'),('d2','c2','Dafra');
 INSERT INTO public.property_developer(id,user_id,whatsapp_number,phone_number,profile_image_url,profile_image_public_id,city,updated_at,slug,seller_status)VALUES('dev1','u1','','','','','Ouagadougou',now(),'dev-one','ACTIVE'),('dev2','u2','','','','','Bobo-Dioulasso',now(),'dev-two','ACTIVE');
 INSERT INTO public.property(id,property_developer_id,title,slug,description,category,listing_type,price,address,city_id,district_id,updated_at,source_language_code,status,currency_code)
 VALUES('p1','dev1','Maison','house-one','Description française','HOUSE','SALE',100,'Example','c1','d1',now(),'fr','ACTIVE','XOF'),('draft','dev2','Private draft','private-draft','','HOUSE','SALE',0,'','c2','d2',now(),'en','DRAFT','XOF');
 INSERT INTO public.property_translation(property_id,language_code,title,description,is_published)VALUES('p1','fr','Maison','Description française',true),('p1','en','House','English description',true),('draft','en','Secret draft','Private description',false);
 INSERT INTO public.property_media(id,property_id,url,public_id,"order",is_primary)VALUES('m1','p1','https://example.test/photo','legacy-one',0,true),('md','draft','https://example.test/draft','private-photo',0,true);
 COMMIT;`);
  return db;
}
module.exports = { setup };
