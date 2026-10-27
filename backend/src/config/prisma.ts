import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaClient, type Prisma } from "@prisma/client";
export interface Actor {
  authUserId?: string;
  userId?: string;
  role?: string;
  developerId?: string;
}
interface Context {
  actor: Actor;
  lang?: string;
  tx?: Prisma.TransactionClient;
}
export const databaseContext = new AsyncLocalStorage<Context>();
const client = new PrismaClient();

// Every query uses a pinned transaction, including public/bootstrap reads.
// Transaction-local set_config cannot leak identity to the next pooled request.
export function createScopedPrisma(base: PrismaClient): PrismaClient {
  async function transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const context = databaseContext.getStore() ?? { actor: {} };
    if (context.tx) return fn(context.tx);
    return base.$transaction(async (tx) => {
      const a = context.actor;
      await tx.$queryRaw`SELECT set_config('lumavok.auth_user_id', ${a.authUserId ?? ""}, true), set_config('lumavok.user_id', ${a.userId ?? ""}, true), set_config('lumavok.role', ${a.role ?? ""}, true), set_config('lumavok.developer_id', ${a.developerId ?? ""}, true)`;
      return databaseContext.run({ ...context, tx }, () => fn(tx));
    });
  }
  const proxy = new Proxy(base, {
    get(target, key) {
      if (key === "$transaction")
        return (fn: (tx: PrismaClient) => Promise<unknown>) => {
          if (typeof fn !== "function")
            throw new Error(
              "Use callback transactions through the scoped client",
            );
          return transaction(() => fn(proxy));
        };
      if (key === "$queryRaw" || key === "$executeRaw")
        return (...args: unknown[]) =>
          transaction((tx) => (tx as any)[key](...args));
      if (String(key).startsWith("$")) {
        if (
          ["$queryRawUnsafe", "$executeRawUnsafe", "$extends", "$use"].includes(
            String(key),
          )
        )
          throw new Error("Unsafe runtime database operation");
        return (target as any)[key].bind(target);
      }
      const value = (target as any)[key];
      if (value && typeof value === "object")
        return new Proxy(value, {
          get(_model, method) {
            return (...args: unknown[]) =>
              transaction((tx) => (tx as any)[key][method](...args));
          },
        });
      return value;
    },
  }) as PrismaClient;
  return proxy;
}
export const prisma = createScopedPrisma(client);
export async function assertRuntimeRole(): Promise<void> {
  const [row] = await client.$queryRaw<
    Array<{ unsafe: boolean; member: boolean }>
  >`SELECT
    (current_user<>session_user OR r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb OR has_schema_privilege(current_user,'public','CREATE') OR EXISTS(SELECT 1 FROM pg_roles elevated WHERE (elevated.rolsuper OR elevated.rolbypassrls OR elevated.rolcreaterole OR elevated.rolcreatedb) AND pg_has_role(current_user,elevated.oid,'MEMBER')) OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND pg_has_role(current_user,c.relowner,'MEMBER'))) AS unsafe,
    pg_has_role(current_user,'lumavok_runtime','USAGE') AS member FROM pg_roles r WHERE r.rolname=current_user`;
  if (!row?.member || row.unsafe)
    throw new Error(
      "DATABASE_URL must use a non-owner NOBYPASSRLS Lumavok runtime login",
    );
}
