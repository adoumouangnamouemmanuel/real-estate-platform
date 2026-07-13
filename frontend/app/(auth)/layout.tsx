import { RedirectIfAuthenticated } from "@/components/auth/RedirectIfAuthenticated";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RedirectIfAuthenticated>
      <main className="flex flex-1 flex-col">{children}</main>
    </RedirectIfAuthenticated>
  );
}
