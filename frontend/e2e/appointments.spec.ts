import { expect, test } from "@playwright/test";

/**
 * Uses .pressSequentially() rather than .fill() for text fields — see ADR-008
 * (Playwright's .fill() doesn't reliably trigger React's controlled-input onChange
 * in WebKit).
 */
async function loginAsDeveloper(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").pressSequentially("developer@byte.africa");
  await page
    .getByLabel("Password", { exact: true })
    .pressSequentially("Password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");
}

/**
 * Navigates to Appointments via the sidebar link, never page.goto("/appointments")
 * directly — per ADR-009, the mock session lives only in memory and doesn't
 * survive a full page load, so a direct goto to a protected route lands on the
 * sign-in-required fallback even with the mock cookie present. Mirrors
 * goToMyProperties in listings.spec.ts.
 */
async function goToAppointments(page: import("@playwright/test").Page) {
  await page
    .getByRole("navigation", { name: "Dashboard" })
    .first()
    .getByRole("link", { name: "Appointments" })
    .click();
  await expect(page).toHaveURL("/appointments");
}

/**
 * The table interleaves date-group header rows (a single colSpan cell, e.g.
 * "Today") between actual appointment rows, and the column header row also
 * carries a "select all" checkbox — `getByRole("row").nth(1)` or a plain
 * checkbox filter can both land on the wrong row. Only real appointment rows
 * have a per-row "Actions for <name>" button, so filtering on that reliably
 * picks a data row.
 */
function firstDataRow(page: import("@playwright/test").Page) {
  return page
    .getByRole("row")
    .filter({ has: page.getByRole("button", { name: /^Actions for/ }) })
    .first();
}

/**
 * Filters to a row whose Status cell is *exactly* the given status — not just
 * "the table contains this text somewhere". The status filter select
 * triggers an async refetch (URL-driven filtering), and `toContainText` on
 * the whole table is not a safe wait for that: the unfiltered table almost
 * always already contains *some* row of the target status mixed in with
 * others, so that assertion can pass immediately, before the refetch lands,
 * without proving the table is actually filtered. Filtering the row locator
 * itself on the exact status cell makes Playwright's own auto-retry wait out
 * the stale render correctly, whatever else is on the page.
 */
function firstRowWithStatus(
  page: import("@playwright/test").Page,
  status: string,
) {
  return page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: status, exact: true }) })
    .first();
}

// Serial: several tests here mutate the shared mock appointment book (confirm,
// cancel, reschedule, bulk actions). Running them concurrently would race on
// the same in-memory array and produce flaky row counts — same reason
// listings.spec.ts runs serially.
test.describe.configure({ mode: "serial" });

test.describe("Appointments (Phase 6.4)", () => {
  test("a developer reaches Appointments from the sidebar and sees their appointment book", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToAppointments(page);

    await expect(
      page.getByRole("heading", { level: 1, name: "Appointments" }),
    ).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("filters by status and the URL reflects it", async ({ page }) => {
    await loginAsDeveloper(page);
    await goToAppointments(page);

    await page.getByLabel("Status", { exact: true }).selectOption("REQUESTED");
    await expect(page).toHaveURL(/status=REQUESTED/);
    await expect(page.getByRole("table")).toContainText("Requested");
  });

  test("searching for a keyword narrows the table", async ({ page }) => {
    await loginAsDeveloper(page);
    await goToAppointments(page);

    await page.getByLabel("Search").fill("Sarpong");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/q=Sarpong/);
    await expect(page.getByRole("table")).toContainText("Sarpong");
  });

  test("clearing filters from the empty state resets the table", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToAppointments(page);

    await page.getByLabel("Search").fill("zzz-no-such-client-zzz");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(
      page.getByText("No appointments match your filters"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();

    await expect(page.getByRole("table")).toBeVisible();
    await expect(page).not.toHaveURL(/q=/);
  });

  test("confirms a requested appointment from its direct row action", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToAppointments(page);
    await page.getByLabel("Status", { exact: true }).selectOption("REQUESTED");
    await page.getByLabel("Rows per page").selectOption("50");

    const firstRow = firstRowWithStatus(page, "Requested");
    const clientCell = await firstRow.locator("td").nth(1).innerText();

    await firstRow
      .getByRole("button", { name: /^Confirm appointment with/ })
      .click();
    await expect(
      page.getByText(`Appointment with ${clientCell} updated.`),
    ).toBeVisible();

    // Re-select Requested: the just-confirmed appointment should no longer be in it.
    await page.getByLabel("Status", { exact: true }).selectOption("");
    await page.getByLabel("Status", { exact: true }).selectOption("REQUESTED");
    await expect(page.getByRole("table")).not.toContainText(clientCell);
  });

  test("opens the details drawer and sees the appointment's history", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToAppointments(page);

    const firstRow = firstDataRow(page);
    await firstRow.getByRole("button", { name: /Actions for/ }).click();
    await page.getByRole("menuitem", { name: "View details" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
  });

  test("reschedules an appointment via the reschedule dialog", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToAppointments(page);
    await page.getByLabel("Status", { exact: true }).selectOption("CONFIRMED");
    await page.getByLabel("Rows per page").selectOption("50");

    const firstRow = firstRowWithStatus(page, "Confirmed");
    const clientCell = await firstRow.locator("td").nth(1).innerText();

    await firstRow.getByRole("button", { name: /Actions for/ }).click();
    await page.getByRole("menuitem", { name: "Reschedule" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel(/New date/).fill("2030-09-15T14:30");
    await page.getByRole("button", { name: "Confirm reschedule" }).click();

    await expect(
      page.getByText(`Appointment with ${clientCell} rescheduled.`),
    ).toBeVisible();
  });

  test("selects rows and applies a bulk action restricted to Confirm/Cancel", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToAppointments(page);
    await page.getByLabel("Status", { exact: true }).selectOption("REQUESTED");
    await page.getByLabel("Rows per page").selectOption("50");

    await firstRowWithStatus(page, "Requested").getByRole("checkbox").check();
    await expect(page.getByText("1 selected")).toBeVisible();

    await expect(
      page.getByRole("toolbar", { name: "Bulk actions" }),
    ).not.toContainText("Reschedule");

    await page
      .getByRole("toolbar", { name: "Bulk actions" })
      .getByRole("button", { name: "Confirm" })
      .click();
    await expect(page.getByText("1 appointment(s) updated.")).toBeVisible();
    await expect(page.getByText("1 selected")).not.toBeVisible();
  });

  test("the status summary chips filter the table and toggle off on a second click", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToAppointments(page);

    await page.getByRole("button", { name: /^Confirmed/ }).click();
    await expect(page).toHaveURL(/status=CONFIRMED/);

    await page.getByRole("button", { name: /^Confirmed/ }).click();
    await expect(page).not.toHaveURL(/status=CONFIRMED/);
  });
});
