export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main className="flex flex-1 flex-col">{children}</main>;
}
