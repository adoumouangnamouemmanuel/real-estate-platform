import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireAuth role="ADMIN">
      <main className="flex flex-1 flex-col">{children}</main>
    </RequireAuth>
  );
}
