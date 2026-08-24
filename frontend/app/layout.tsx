import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { APP_NAME } from "@/constants/config";
import { FONT_SCALE, PREFERENCES_STORAGE_KEY } from "@/lib/preferences";

import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The editorial display face. Only the weight axis is requested (next/font's
// default for variable fonts) — Newsreader also ships an `opsz` axis, but
// pulling it in costs payload for an effect that is imperceptible across the
// 20px–36px range this is actually used at.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Property discovery and trust platform for African markets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
      // The pre-paint script below writes theme/contrast/motion attributes here.
      // suppressHydrationWarning stops React complaining that the server markup
      // (no attributes) differs from what it finds in the DOM — that difference
      // is the entire point, and it is confined to this one element.
      suppressHydrationWarning
    >
      <head>
        {/*
          Runs before first paint, so a returning visitor never sees a flash of
          light theme before their dark preference applies. It has to be inline
          and synchronous — any deferred/bundled script runs after the first
          paint, which is exactly the flash we are preventing.

          Deliberately duplicates a little of lib/preferences.ts rather than
          importing it: an import would mean a module graph, and therefore a
          round trip, before this can run. It is wrapped in try/catch so a
          storage failure degrades to the default light theme instead of an
          uncaught error at the top of every page.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p={};try{p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFERENCES_STORAGE_KEY)}))||{}}catch(e){}
var s=${JSON.stringify(FONT_SCALE)};var d=document.documentElement;
var t=p.theme==="light"||p.theme==="dark"||p.theme==="system"?p.theme:"system";
var dark=t==="dark"||(t==="system"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);
d.classList.toggle("dark",dark);d.style.colorScheme=dark?"dark":"light";
d.dataset.theme=t;
d.dataset.contrast=p.contrast==="high"?"high":"standard";
d.dataset.motion=p.motion==="reduced"?"reduced":"standard";
d.dataset.lineSpacing=p.lineSpacing==="increased"?"increased":"standard";
d.dataset.letterSpacing=p.letterSpacing==="increased"?"increased":"standard";
d.style.setProperty("--a11y-font-scale",s[p.fontSize]||"1");}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
