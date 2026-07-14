import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireAuth role="DEVELOPER">
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}
