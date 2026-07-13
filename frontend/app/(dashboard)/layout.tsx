import { RequireAuth } from "@/components/auth/RequireAuth";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireAuth role="DEVELOPER">
      <main className="flex flex-1 flex-col">{children}</main>
    </RequireAuth>
  );
}
