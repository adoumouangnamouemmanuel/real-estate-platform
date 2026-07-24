import { afterEach, describe, expect, it } from "vitest";

import { MOCK_LISTINGS } from "./mocks/listings.mock";
import {
  canDeleteListing,
  getAvailableTransitions,
  listingService,
} from "./listing.service";

/** Deep-clones the mock portfolio so mutation tests can restore it afterward and never leak state into other test files that import the same module. */
function snapshotListings() {
  return MOCK_LISTINGS.map((item) => ({ ...item }));
}

function restore(snapshot: ReturnType<typeof snapshotListings>) {
  MOCK_LISTINGS.length = 0;
  MOCK_LISTINGS.push(...snapshot);
}

describe("listingService.getListings", () => {
  it("paginates with the default page size", async () => {
    const result = await listingService.getListings({ page: 1 });
    expect(result.pageSize).toBe(10);
    expect(result.items).toHaveLength(10);
    expect(result.total).toBe(MOCK_LISTINGS.length);
  });

  it("filters by status", async () => {
    const result = await listingService.getListings({
      status: "DRAFT",
      pageSize: 50,
    });
    expect(result.items.every((item) => item.status === "DRAFT")).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("filters by category and listing type together", async () => {
    const result = await listingService.getListings({
      category: "house",
      listingType: "SALE",
      pageSize: 50,
    });
    expect(
      result.items.every(
        (item) => item.category === "house" && item.listingType === "SALE",
      ),
    ).toBe(true);
  });

  it("matches a keyword against title or city, case-insensitively", async () => {
    const result = await listingService.getListings({
      q: "kumasi",
      pageSize: 50,
    });
    expect(result.items.length).toBeGreaterThan(0);
    expect(
      result.items.every((item) => item.city.toLowerCase().includes("kumasi")),
    ).toBe(true);
  });

  it("sorts by price ascending and descending", async () => {
    const asc = await listingService.getListings({
      sort: "price_asc",
      pageSize: 50,
    });
    const desc = await listingService.getListings({
      sort: "price_desc",
      pageSize: 50,
    });
    expect(asc.items[0].price).toBeLessThanOrEqual(
      asc.items[asc.items.length - 1].price,
    );
    expect(desc.items[0].price).toBeGreaterThanOrEqual(
      desc.items[desc.items.length - 1].price,
    );
  });

  it("sorts by most recently updated by default", async () => {
    const result = await listingService.getListings({ pageSize: 50 });
    const timestamps = result.items.map((item) =>
      new Date(item.updatedAt ?? 0).getTime(),
    );
    const sorted = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(sorted);
  });
});

describe("listingService.getStatusCounts", () => {
  it("adds up to the full portfolio size", async () => {
    const counts = await listingService.getStatusCounts();
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(MOCK_LISTINGS.length);
  });
});

describe("status transitions", () => {
  it("DRAFT can only publish", () => {
    expect(getAvailableTransitions("DRAFT")).toEqual([
      { target: "ACTIVE", label: "Publish" },
    ]);
  });

  it("SOLD is terminal", () => {
    expect(getAvailableTransitions("SOLD")).toEqual([]);
  });

  it("only DRAFT and SUSPENDED are deletable", () => {
    expect(canDeleteListing("DRAFT")).toBe(true);
    expect(canDeleteListing("SUSPENDED")).toBe(true);
    expect(canDeleteListing("ACTIVE")).toBe(false);
    expect(canDeleteListing("RESERVED")).toBe(false);
    expect(canDeleteListing("SOLD")).toBe(false);
  });
});

describe("listingService mutations", () => {
  let snapshot: ReturnType<typeof snapshotListings>;

  afterEach(() => {
    // Every mutation test below writes to the shared MOCK_LISTINGS array —
    // restore it so mutation tests never leak state into each other or into
    // other test files that import the same module.
    restore(snapshot);
  });

  it("updateListingStatus applies a valid transition", async () => {
    snapshot = snapshotListings();
    const draft = MOCK_LISTINGS.find((item) => item.status === "DRAFT")!;
    const updated = await listingService.updateListingStatus(
      draft.id,
      "ACTIVE",
    );
    expect(updated.status).toBe("ACTIVE");
  });

  it("updateListingStatus rejects an invalid transition", async () => {
    snapshot = snapshotListings();
    const draft = MOCK_LISTINGS.find((item) => item.status === "DRAFT")!;
    await expect(
      listingService.updateListingStatus(draft.id, "SOLD"),
    ).rejects.toThrow(/Cannot move/);
  });

  it("deleteListing removes a deletable listing", async () => {
    snapshot = snapshotListings();
    const draft = MOCK_LISTINGS.find((item) => item.status === "DRAFT")!;
    await listingService.deleteListing(draft.id);
    expect(MOCK_LISTINGS.find((item) => item.id === draft.id)).toBeUndefined();
  });

  it("deleteListing rejects a non-deletable status", async () => {
    snapshot = snapshotListings();
    const active = MOCK_LISTINGS.find((item) => item.status === "ACTIVE")!;
    await expect(listingService.deleteListing(active.id)).rejects.toThrow(
      /can't be deleted/,
    );
  });

  it("bulkUpdateStatus applies to eligible rows and skips the rest", async () => {
    snapshot = snapshotListings();
    const draft = MOCK_LISTINGS.find((item) => item.status === "DRAFT")!;
    const active = MOCK_LISTINGS.find((item) => item.status === "ACTIVE")!;

    const result = await listingService.bulkUpdateStatus(
      [draft.id, active.id],
      "ACTIVE",
    );

    expect(result.updated).toEqual([draft.id]);
    expect(result.skipped).toEqual([active.id]);
  });

  it("bulkDelete deletes eligible rows and skips the rest", async () => {
    snapshot = snapshotListings();
    const draft = MOCK_LISTINGS.find((item) => item.status === "DRAFT")!;
    const active = MOCK_LISTINGS.find((item) => item.status === "ACTIVE")!;

    const result = await listingService.bulkDelete([draft.id, active.id]);

    expect(result.deleted).toEqual([draft.id]);
    expect(result.skipped).toEqual([active.id]);
    expect(MOCK_LISTINGS.find((item) => item.id === draft.id)).toBeUndefined();
  });

  it("createListing seeds a DRAFT with a slug derived from the title", async () => {
    snapshot = snapshotListings();
    const created = await listingService.createListing({
      title: "My New Listing",
    });

    expect(created.status).toBe("DRAFT");
    expect(created.slug).toBe("my-new-listing");
    expect(MOCK_LISTINGS.find((item) => item.id === created.id)).toBeDefined();
  });

  it("createListing falls back to 'untitled-listing' and de-duplicates slugs", async () => {
    snapshot = snapshotListings();
    const first = await listingService.createListing({});
    const second = await listingService.createListing({});

    expect(first.slug).toBe("untitled-listing");
    expect(second.slug).toBe("untitled-listing-2");
    expect(first.title).toBe("Untitled Listing");
  });

  it("createListing gives untyped fields typed empty defaults, not undefined", async () => {
    snapshot = snapshotListings();
    const created = await listingService.createListing({ title: "Draft" });

    expect(created.price).toBe(0);
    expect(created.city).toBe("");
    expect(created.media).toEqual([]);
    expect(created.amenities).toEqual([]);
  });

  it("getListingForEdit resolves by slug and rejects for an unknown slug", async () => {
    snapshot = snapshotListings();
    const existing = MOCK_LISTINGS[0];

    await expect(
      listingService.getListingForEdit(existing.slug),
    ).resolves.toMatchObject({ id: existing.id });
    await expect(
      listingService.getListingForEdit("no-such-slug"),
    ).rejects.toThrow(/not found/);
  });

  it("updateListing applies only the given patch (PATCH semantics) and keeps the slug stable", async () => {
    snapshot = snapshotListings();
    const created = await listingService.createListing({ title: "Original" });

    const updated = await listingService.updateListing(created.slug, {
      price: 5000,
    });

    expect(updated.price).toBe(5000);
    expect(updated.title).toBe("Original");
    expect(updated.slug).toBe(created.slug);
  });

  it("updateListing does not regenerate the slug when the title changes", async () => {
    snapshot = snapshotListings();
    const created = await listingService.createListing({ title: "Original" });

    const updated = await listingService.updateListing(created.slug, {
      title: "Renamed",
    });

    expect(updated.title).toBe("Renamed");
    expect(updated.slug).toBe(created.slug);
  });

  it("updateListing rejects an unknown slug", async () => {
    snapshot = snapshotListings();
    await expect(
      listingService.updateListing("no-such-slug", { price: 1 }),
    ).rejects.toThrow(/not found/);
  });
});
