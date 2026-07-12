"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export function SearchBar() {
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
      className="border-border bg-background flex w-full max-w-xl items-center gap-2 rounded-lg border p-2"
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
        className="placeholder:text-muted-foreground flex-1 bg-transparent px-2 text-sm outline-none"
      />
      <Button type="submit" size="icon" aria-label="Search">
        <Search />
      </Button>
    </form>
  );
}
