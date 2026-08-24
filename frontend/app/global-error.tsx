"use client";

import { useEffect } from "react";

import "./globals.css";

/**
 * Last-resort boundary for failures in the root layout itself.
 *
 * This file *replaces* the root layout when active, so it has to supply its own
 * `<html>`/`<body>` and its own styles. It is deliberately dependency-light:
 * no Providers, no fonts, no design-system components, no router-dependent
 * `<Link>`. Anything imported here is something that could itself be the reason
 * the root failed, and a broken error page is worse than a plain one — so
 * recovery uses a native button and a plain anchor.
 *
 * Only global styles are imported, which gives the colour tokens. The theme
 * script lives in the root layout and does not run here, so this renders in the
 * default light palette; that is the correct trade for guaranteed legibility.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <title>Something went wrong — Lumavok</title>
        <div role="alert" className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">
            Something went wrong.
          </h1>
          <p className="text-muted-foreground max-w-sm text-sm">
            Lumavok could not finish loading. You can try again, or return to
            the homepage.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="bg-primary text-primary-foreground focus-visible:ring-ring/50 h-9 rounded-lg px-4 text-sm font-medium outline-none focus-visible:ring-3"
          >
            Try again
          </button>
          {/*
            eslint-disable-next-line @next/next/no-html-link-for-pages --
            A plain anchor is deliberate here, not an oversight. <Link> performs
            client-side navigation through the very router and app shell whose
            failure triggered this boundary; a full document load is the only
            recovery that does not depend on the broken thing. This is the one
            place in the app where that trade-off applies.
          */}
          <a
            href="/"
            className="border-border focus-visible:ring-ring/50 h-9 rounded-lg border px-4 text-sm leading-9 font-medium outline-none focus-visible:ring-3"
          >
            Go to homepage
          </a>
        </div>
        {/* Opaque log-correlation id only — no stack, message or internals. */}
        {error.digest && (
          <p className="text-muted-foreground text-xs">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </body>
    </html>
  );
}
