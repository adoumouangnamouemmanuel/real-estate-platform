const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require("@electric-sql/pglite");
const root = path.resolve(__dirname, "..");
const migrations = fs
  .readdirSync(path.join(root, "migrations"))
  .filter((n) => /^20261026/.test(n))
  .sort();
const { setup } = require("./helpers.cjs");
async function actor(db, user = "", developer = "", role = "", auth = "") {
  await db.exec("RESET ROLE;SET ROLE lumavok_runtime;");
  await db.query(
    "SELECT set_config('lumavok.user_id',$1,false),set_config('lumavok.developer_id',$2,false),set_config('lumavok.role',$3,false),set_config('lumavok.auth_user_id',$4,false)",
    [user, developer, role, auth],
  );
}
const rows = async (db, sql, params = []) => (await db.query(sql, params)).rows;
for (const observed of [false, true])
  test(`${observed ? "observed live schema" : "fresh June migration"}: additive replay, constraints and actor access`, async () => {
    const db = await setup(observed);
    try {
      await actor(db);
      assert.deepEqual(
        (await rows(db, "SELECT id FROM public.property ORDER BY id")).map(
          (r) => r.id,
        ),
        ["p1"],
      );
      assert.equal((await rows(db, 'SELECT id FROM public."user"')).length, 0);
      assert.equal(
        (
          await rows(
            db,
            "SELECT * FROM public.property_translation WHERE property_id='draft'",
          )
        ).length,
        0,
      );
      assert.equal(
        (
          await rows(
            db,
            "SELECT * FROM public.property_media WHERE property_id='draft'",
          )
        ).length,
        0,
      );
      await assert.rejects(() =>
        db.exec(`INSERT INTO public.city(id,name)VALUES('x','Unauthorized')`),
      );
      await assert.rejects(() =>
        db.exec('SELECT password_hash FROM public."user"'),
      );
      await assert.rejects(() => db.exec("SELECT * FROM public.refresh_token"));
      await actor(db, "u1", "dev1", "PROPERTY_DEVELOPER");
      assert.equal(
        (
          await db.query(
            `UPDATE public.property SET title='steal' WHERE id='draft'`,
          )
        ).affectedRows,
        0,
      );
      await assert.rejects(() =>
        db.exec(`UPDATE public."user" SET role='ADMIN' WHERE id='u1'`),
      );
      await assert.rejects(() =>
        db.exec(
          `UPDATE public.property_developer SET is_verified=true WHERE id='dev1'`,
        ),
      );
      await assert.rejects(() =>
        db.exec(`UPDATE public.property SET favorite_count=999 WHERE id='p1'`),
      );
      await assert.rejects(() =>
        db.exec(
          `UPDATE public.property SET property_developer_id='dev2' WHERE id='p1'`,
        ),
      );
      await assert.rejects(() =>
        db.exec(`UPDATE public.property SET district_id='d2' WHERE id='p1'`),
      );
      await assert.rejects(() =>
        db.exec(
          `INSERT INTO public.property_translation(property_id,language_code,title,description)VALUES('p1','fr','duplicate','duplicate')`,
        ),
      );
      await assert.rejects(() =>
        db.exec(
          `INSERT INTO public.property_translation(property_id,language_code,title,description)VALUES('p1','zz','bad','bad')`,
        ),
      );
      await assert.rejects(() =>
        db.exec(
          `UPDATE public.property_translation SET description='' WHERE property_id='p1' AND language_code='fr'`,
        ),
      );
      await assert.rejects(() =>
        db.exec(
          `BEGIN;DELETE FROM public.property_media WHERE property_id='p1';COMMIT;`,
        ),
      );
      await db.exec("ROLLBACK;");
      assert.equal(
        (
          await rows(
            db,
            `SELECT count(*)::int n FROM public.property_media WHERE property_id='p1'`,
          )
        )[0].n,
        1,
      );
      await actor(db, "buyer", "", "USER");
      await db.exec(
        `INSERT INTO public.property_favorite(id,user_id,property_id)VALUES('fav','buyer','p1')`,
      );
      assert.equal(
        (
          await rows(
            db,
            `SELECT favorite_count FROM public.property WHERE id='p1'`,
          )
        )[0].favorite_count,
        1,
      );
      await db.exec(`DELETE FROM public.property_favorite WHERE id='fav'`);
      assert.equal(
        (
          await rows(
            db,
            `SELECT favorite_count FROM public.property WHERE id='p1'`,
          )
        )[0].favorite_count,
        0,
      );
      await assert.rejects(() =>
        db.exec(
          `INSERT INTO public.property_favorite(id,user_id,property_id)VALUES('badfav','u1','p1')`,
        ),
      );
      await assert.rejects(() =>
        db.exec(
          `INSERT INTO public.appointment(id,property_id,property_developer_id,client_user_id,client_name,scheduled_for,updated_at)VALUES('badapt','p1','dev2','buyer','Test',now(),now())`,
        ),
      );
      await db.exec("RESET ROLE;");
      await assert.rejects(() =>
        db.exec(
          `INSERT INTO public.report(id,target_type,target_id,reason,updated_at)VALUES('r','PROPERTY','p1','Test',now())`,
        ),
      );
      await db.exec(
        `BEGIN;SELECT set_config('lumavok.user_id','u1',true);COMMIT;`,
      );
      await actor(db);
      const ordinary = await rows(
        db,
        "SELECT has_table_privilege('anon','public.property','SELECT') a,has_table_privilege('authenticated','public.property','SELECT') b",
      );
      assert.equal(ordinary[0].a, false);
      assert.equal(ordinary[0].b, false);
      await db.exec("RESET ROLE;");
      const disabled = await rows(
        db,
        "SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity",
      );
      assert.deepEqual(disabled, []);
    } finally {
      await db.close();
    }
  });
