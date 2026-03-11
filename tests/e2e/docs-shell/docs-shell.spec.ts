import { expect, test } from "@playwright/test";

test("docs shell renders required tabs @smoke @docs-shell", async ({ page }) => {
  await page.goto("/card/docs/?tab=test-status");

  await expect(page.getByRole("tab", { name: "Test Status" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Priorities" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Learnings" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Requirements" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Testing" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Architecture" })).toBeVisible();
});

test("requirements detail returns to list cleanly @smoke @docs-shell", async ({
  page,
}) => {
  await page.goto("/card/docs/?tab=requirements");

  const projectLink = page.getByRole("button", { name: "Greeting Card Designer" });
  await expect(projectLink).toBeVisible();
  await projectLink.click();

  await expect(page.getByRole("heading", { name: "Business Requirements Document" })).toBeVisible();
  await page.getByRole("button", { name: "Back to all requirements" }).click();
  await expect(page.getByRole("button", { name: "Greeting Card Designer" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Business Requirements Document" })).toHaveCount(0);
});

test("rapid tab switching keeps final tab content @regression @docs-shell", async ({
  page,
}) => {
  await page.goto("/card/docs/?tab=test-status");

  await page.getByRole("tab", { name: "Testing" }).click();
  await page.getByRole("tab", { name: "Priorities" }).click();
  await page.getByRole("tab", { name: "Architecture" }).click();

  await expect(page.getByRole("tab", { name: "Architecture", selected: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Architecture" })).toBeVisible();
});

test("prod monitor docs shell availability @prod-monitor", async ({ page }) => {
  await page.goto("/card/docs/?tab=test-status");
  await expect(page.getByRole("heading", { name: "card Documents" })).toBeVisible();
  await expect(page.getByRole("button", { name: "PR Checks" })).toBeVisible();
});
