import { SkipToContentLink } from "@/components/common/SkipToContentLink";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* The dashboard shell has had this since Stage 6; the public site never
          did, so a keyboard visitor tabbed through the wordmark, four nav
          links and the display controls on every single page before reaching
          content. Same component, same target contract. */}
      <SkipToContentLink targetId="main-content" />
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer />
    </>
  );
}
