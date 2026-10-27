import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import request from "supertest";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
const require = createRequire(import.meta.url);
const {
  setup,
} = require("../../database/full-database-design/tests/helpers.cjs");

test(
  "HTTP + Prisma + PostgreSQL: catalogue, locale, ownership, seller approval and atomic workflows",
  { timeout: 90000 },
  async () => {
    const db = await setup(true, PGlite);
    const authIds = {
      one: "00000000-0000-4000-8000-000000000001",
      two: "00000000-0000-4000-8000-000000000002",
      buyer: "00000000-0000-4000-8000-000000000003",
      admin: "00000000-0000-4000-8000-000000000004",
      missing: "00000000-0000-4000-8000-000000000005",
    };
    const tokens = new Map<string, string>();
    const jwt = (id: string) =>
      "test." +
      Buffer.from(JSON.stringify({ session_id: id })).toString("base64url") +
      ".verified-by-test-provider";
    await db.exec(`BEGIN;INSERT INTO auth.users(id)VALUES('${authIds.buyer}'),('${authIds.admin}'),('${authIds.missing}');
  SELECT set_config('lumavok.role','ADMIN',true);
  UPDATE public."user" SET auth_user_id='${authIds.buyer}' WHERE id='buyer';
  INSERT INTO public."user"(id,email,password_hash,role,auth_user_id)VALUES('admin','admin@example.test','unusable','ADMIN','${authIds.admin}'),('missing','missing@example.test','unusable','PROPERTY_DEVELOPER','${authIds.missing}');
  UPDATE public.property SET currency_code='XOF' WHERE id='p1';
  INSERT INTO public.feature(id,feature_name,code,source_language_code)VALUES('f1','Garage','garage','en');
  INSERT INTO public.feature_translation(feature_id,language_code,name)VALUES('f1','fr','Garage'),('f1','en','Garage');
  COMMIT;`);
    for (const [name, id] of Object.entries(authIds)) {
      await db.query("INSERT INTO auth.sessions(id,user_id)VALUES($1,$1)", [
        id,
      ]);
      tokens.set(jwt(id), id);
    }
    for (let i = 0; i < 25; i++)
      await db.query(
        "INSERT INTO public.appointment(id,property_id,property_developer_id,client_user_id,client_name,scheduled_for,updated_at)VALUES($1,'p1','dev1','buyer','Client',now()+interval '1 day',now())",
        ["apt" + String(i).padStart(2, "0")],
      );
    for (let i = 0; i < 15; i++)
      await db.query(
        "INSERT INTO public.notification(id,property_developer_id,type,title,message)VALUES($1,'dev1','SYSTEM','Test','Test')",
        ["note" + i],
      );
    await db.exec("SET ROLE lumavok_runtime;");
    const server = new PGLiteSocketServer({
      db,
      host: "127.0.0.1",
      port: 55438,
    });
    await server.start();
    process.env.DATABASE_URL =
      "postgresql://lumavok_runtime@127.0.0.1:55438/postgres?connection_limit=1&sslmode=disable";
    delete process.env.DIRECT_URL;
    process.env.NODE_ENV = "test";
    process.env.SUPABASE_URL = "https://auth.example.test";
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    process.env.AUTH_REDIRECT_URL = "http://localhost:3000/reset-password";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: any, init: any) => {
      const authorization =
        new Headers(init?.headers).get("authorization") ?? "";
      const id = tokens.get(authorization.replace(/^Bearer /, ""));
      if (String(input).endsWith("/auth/v1/user") && id)
        return new Response(
          JSON.stringify({
            id,
            email: "user@example.test",
            email_confirmed_at: "2026-01-01T00:00:00Z",
            user_metadata: { role: "ADMIN", developerId: "dev2" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      return new Response(
        JSON.stringify({ code: "bad_jwt", msg: "Invalid JWT" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    };

    const { createApp } = await import("../src/app.js");
    const { prisma, assertRuntimeRole } =
      await import("../src/config/prisma.js");
    const app = createApp(),
      api = request(app);
    const auth = (name: keyof typeof authIds) => ({
      Authorization: "Bearer " + jwt(authIds[name]),
    });
    try {
      // The socket fixture uses SET ROLE within a superuser session. Startup must
      // reject that connection; real deployment requires a dedicated non-owner login.
      await assert.rejects(assertRuntimeRole);

      const fr = await api
          .get("/api/v1/properties/house-one?lang=fr")
          .expect(200),
        en = await api.get("/api/v1/properties/house-one?lang=en").expect(200);
      assert.equal(fr.body.data.title, "Maison");
      assert.equal(en.body.data.title, "House");
      assert.equal(fr.body.data.id, en.body.data.id);
      assert.equal(fr.body.data.price, en.body.data.price);
      assert.equal(fr.body.data.category, "house");
      await api.get("/api/v1/properties?lang=zz").expect(400);
      await api.get("/api/v1/properties/private-draft?lang=en").expect(404);
      await api.get("/api/v1/properties/draft/related?lang=en").expect(404);
      await api.get("/api/v1/properties/by-id/p1?lang=en").expect(200);
      await api
        .get("/api/v1/developers/me/listings")
        .set(auth("admin"))
        .expect(403);
      await api
        .get("/api/v1/developers/me/listings")
        .set(auth("missing"))
        .expect(403);
      await api
        .get("/api/v1/developers/me/listings")
        .set(auth("buyer"))
        .expect(403);

      const own = await api
        .get("/api/v1/developers/me/listings?lang=fr")
        .set(auth("one"))
        .expect(200);
      assert.deepEqual(
        own.body.data.items.map((p: any) => p.id),
        ["p1"],
      );
      await api
        .patch("/api/v1/developers/me/listings/draft")
        .set(auth("one"))
        .send({ contentLanguage: "en", rowVersion: 1, title: "Stolen" })
        .expect(404);

      const created = await api
        .post("/api/v1/developers/me/listings?lang=fr")
        .set(auth("one"))
        .send({
          title: "Bâtiment",
          description: "Description",
          contentLanguage: "fr",
          cityId: "c1",
          districtId: "d1",
          category: "office",
          featureIds: ["f1"],
          buildingSizeSqm: 42,
        })
        .expect(201);
      const listing = created.body.data;
      assert.equal(listing.buildingSizeSqm, 42);
      assert.equal(listing.category, "office");
      assert.equal(listing.districtId, "d1");
      assert.deepEqual(listing.featureIds, ["f1"]);
      await api
        .patch(`/api/v1/developers/me/listings/${listing.id}/status`)
        .set(auth("one"))
        .send({ status: "ACTIVE" })
        .expect(400);
      await api
        .patch(`/api/v1/developers/me/listings/${listing.id}`)
        .set(auth("one"))
        .send({ contentLanguage: "fr", rowVersion: 1, districtId: "d2" })
        .expect(400);
      const saved = await api
        .patch(`/api/v1/developers/me/listings/${listing.id}`)
        .set(auth("one"))
        .send({ contentLanguage: "fr", rowVersion: 1, buildingSizeSqm: 55 })
        .expect(200);
      assert.equal(saved.body.data.buildingSizeSqm, 55);
      assert.equal(saved.body.data.rowVersion, 2);
      await api
        .patch(`/api/v1/developers/me/listings/${listing.id}`)
        .set(auth("one"))
        .send({ contentLanguage: "fr", rowVersion: 1, title: "Stale" })
        .expect(409);
      const page = await api
        .get("/api/v1/developers/me/appointments?page=2&pageSize=10")
        .set(auth("one"))
        .expect(200);
      assert.equal(page.body.data.items.length, 10);
      assert.equal(page.body.data.total, 25);
      assert.equal(page.body.data.items[0].id, "apt10");
      await api
        .patch("/api/v1/developers/me/appointments/apt00/status")
        .set(auth("one"))
        .send({ status: "CONFIRMED" })
        .expect(200);
      const appointment = await api
        .get("/api/v1/developers/me/appointments/apt00")
        .set(auth("one"))
        .expect(200);
      assert.equal(appointment.body.data.history.length, 1);
      const pending = await api
        .post("/api/v1/sellers/request")
        .set(auth("buyer"))
        .send({
          businessName: "Test business",
          cityId: "c1",
          phoneNumber: "+22600000",
          whatsappNumber: "+22600000",
        })
        .expect(201);
      await api
        .post(`/api/v1/sellers/${pending.body.data.id}/activate`)
        .set(auth("buyer"))
        .expect(403);
      await api
        .post(`/api/v1/sellers/${pending.body.data.id}/activate`)
        .set(auth("admin"))
        .expect(200);
      await api
        .get("/api/v1/developers/me/listings")
        .set(auth("buyer"))
        .expect(200);
      await api
        .post("/api/v1/uploads/file")
        .set(auth("one"))
        .field("folder", "../../escape")
        .attach("file", Buffer.from("<svg/>"), {
          filename: "photo.jpg",
          contentType: "image/jpeg",
        })
        .expect(400);
      // A later public request must not inherit the last authenticated connection's scope.
      const publicAgain = await api
        .get("/api/v1/properties?lang=fr")
        .expect(200);
      assert.deepEqual(
        publicAgain.body.data.items.map((p: any) => p.id),
        ["p1"],
      );
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SET LOCAL ROLE postgres`;
        await tx.$executeRaw`UPDATE public.property_translation SET is_published=false WHERE property_id='p1' AND language_code='en'`;
      });
      const fallback = await api
        .get("/api/v1/properties/house-one?lang=en")
        .expect(200);
      assert.equal(fallback.body.data.title, "Maison");
      assert.equal(fallback.body.data.contentLanguage, "fr");
      assert.equal(fallback.body.data.fallbackUsed, true);
      const dashboard = await api
        .get("/api/v1/developers/me/dashboard?lang=fr")
        .set(auth("one"))
        .expect(200);
      assert.equal(dashboard.body.data.metrics.unreadNotifications, 15);
      assert.equal(dashboard.body.data.recentNotifications.length, 5);
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SET LOCAL ROLE postgres`;
        await tx.$executeRaw`CREATE FUNCTION public.fixture_reject_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture rejection'; END $$`;
        await tx.$executeRaw`CREATE TRIGGER fixture_reject_history BEFORE INSERT ON public.appointment_history FOR EACH ROW EXECUTE FUNCTION public.fixture_reject_history()`;
      });
      await api
        .patch("/api/v1/developers/me/appointments/apt01/status")
        .set(auth("one"))
        .send({ status: "CONFIRMED" })
        .expect(500);
      const unchanged = await api
        .get("/api/v1/developers/me/appointments/apt01")
        .set(auth("one"))
        .expect(200);
      assert.equal(unchanged.body.data.status, "REQUESTED");
      assert.equal(unchanged.body.data.history.length, 0);
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SET LOCAL ROLE postgres`;
        await tx.$executeRaw`DROP TRIGGER fixture_reject_history ON public.appointment_history`;
        await tx.$executeRaw`DROP FUNCTION public.fixture_reject_history()`;
      });
      // Removed Auth sessions are denied even when the provider accepts the JWT.
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SET LOCAL ROLE postgres`;
        await tx.$executeRaw`DELETE FROM auth.sessions WHERE id=${authIds.one}::uuid`;
      });
      await api
        .get("/api/v1/developers/me/listings")
        .set(auth("one"))
        .expect(401);
    } finally {
      globalThis.fetch = originalFetch;
      await prisma.$disconnect();
      await server.stop();
      await db.close();
    }
  },
);
