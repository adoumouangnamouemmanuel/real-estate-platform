"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  /** "glass" is for placement over imagery (the hero) — frosted, light-on-dark text. Defaults to the opaque form used everywhere else. */
  variant?: "solid" | "glass";
}

export function SearchBar({ variant = "solid" }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    router.push(`${ROUTES.SEARCH}${params}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full max-w-xl items-center gap-2 rounded-lg border p-2",
        variant === "glass"
          ? "border-white/25 bg-white/10 backdrop-blur-md"
          : "border-border bg-background",
      )}
    >
      <label htmlFor="search-query" className="sr-only">
        Search by city, neighborhood, or property name
      </label>
      <input
        id="search-query"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by city, neighborhood, or property name"
        className={cn(
          "flex-1 bg-transparent px-2 text-sm outline-none",
          variant === "glass"
            ? "text-white placeholder:text-white/70"
            : "placeholder:text-muted-foreground",
        )}
      />
      <Button type="submit" size="icon" aria-label="Search">
        <Search />
      </Button>
    </form>
  );
}
