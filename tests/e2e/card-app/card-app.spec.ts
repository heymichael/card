import { expect, test } from "@playwright/test";

test("app shows login gate when auth is required @smoke @card-app", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Sign in required" })).toBeVisible();
  await expect(page.getByText("Please contact your administrator")).toBeVisible();
});

test("card app default controls render @smoke @regression @card-app", async ({ page }) => {
  await page.goto("/?authBypass=1");

  await expect(page.getByRole("heading", { name: "Card Designer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "A — Headline" })).toBeVisible();
  await expect(page.getByRole("button", { name: "B — Message" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finish (Export JPEG)" })).toBeVisible();
});

test("text and font controls update state @smoke @regression @card-app", async ({ page }) => {
  await page.goto("/?authBypass=1");

  const textInput = page.locator("#text-input");
  await textInput.fill("Testing greeting");
  await expect(textInput).toHaveValue("Testing greeting");

  const fontSizeRange = page.locator("#font-size");
  await fontSizeRange.fill("90");
  await expect(page.locator('input.number-input')).toHaveValue("90");
});

test("export triggers jpeg download @smoke @card-app", async ({ page }) => {
  await page.goto("/?authBypass=1");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Finish (Export JPEG)" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^greeting-card-\d{8}-\d{6}\.jpg$/);
});
