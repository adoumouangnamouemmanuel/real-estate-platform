"use client";
import { useEffect, useRef, useState } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { InvalidResetLink } from "./InvalidResetLink";
import { Loading } from "@/components/common/Loading";
export function RecoveryLink() {
  const [token, setToken] = useState<string | null | undefined>();
  const capturedToken = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    // Fragments never reach web-server/access logs. Remove it before form use.
    // Keep the capture across Strict Mode's effect replay after URL scrubbing.
    if (capturedToken.current === undefined) {
      capturedToken.current = new URLSearchParams(
        window.location.hash.slice(1),
      ).get("token");
      window.history.replaceState(null, "", window.location.pathname);
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setToken(capturedToken.current ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return token === undefined ? (
    <Loading />
  ) : token ? (
    <ResetPasswordForm token={token} />
  ) : (
    <InvalidResetLink reason="missing" />
  );
}
