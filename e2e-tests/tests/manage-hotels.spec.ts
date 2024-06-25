import { test, expect } from "@playwright/test";
import path from "path";

const UI_URL = "http://localhost:5173/";

test.beforeEach(async ({ page }) => {
  await page.goto(UI_URL);
  await page.getByRole("link", { name: "Sign In" }).click();
  await page.locator("[name=email]").fill("1@1.com");
  await page.locator("[name=password]").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
});

test("Should allow user to add a hotel", async ({ page }) => {
  await page.goto(`${UI_URL}add-hotel`);

  await page.locator('[name="name"]').fill("Test Hotel");
  await page.locator('[name="city"]').fill("Test City");
  await page.locator('[name="country"]').fill("Test Country");
  await page
    .locator('[name="description"]')
    .fill("Test Description for the test hotel");
  await page.locator('[name="pricePerNight"]').fill("60");

  await page.selectOption('select[name="starRating"]', "4");

  await page.getByText("Budget").click();

  await page.getByLabel("Free Wifi").check();
  await page.getByLabel("Parking").check();
  await page.getByLabel("Spa").check();

  await page.locator('[name="adultCount"]').fill("2");
  await page.locator('[name="childCount"]').fill("2");

  await page.setInputFiles('[name="imageFiles"]', [
    path.join(__dirname, "files", "hotel1.jpg"),
    path.join(__dirname, "files", "hotel2.jpg"),
  ]);

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Hotel added successfully")).toBeVisible();
});

test("Should allow user to view hotel details", async ({ page }) => {
  await page.goto(`${UI_URL}my-hotels`);
  await expect(page.getByText("Test Hotel 1")).toBeVisible();
  await expect(
    page.locator(':has-text("Test Description for the test hotel")')
  ).toBeVisible();
  await expect(page.getByText("Test City, Test Country")).toBeVisible();
  await expect(page.getByText("Budget")).toBeVisible();
  await expect(page.getByText("$60 per night")).toBeVisible();
  await expect(page.getByText("2 adults, 2 children")).toBeVisible();
  await expect(page.getByText("4 Star Rating")).toBeVisible();

  await expect(
    page.getByRole("link", { name: "View Details" }).first()
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Add Hotel" })).toBeVisible();
});

test("Should update hotel", async ({ page }) => {
  page.goto(`${UI_URL}my-hotels`);
  await page.getByRole("link", { name: "View Details" }).first().click();

  await page.waitForSelector('[name="name"]', { state: "attached" });
  await expect(page.locator('[name="name"]')).toHaveValue("Test Hotel 1");
  await page.locator('[name="name"]').fill("Test Hotel UPDATED");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Hotel Updated successfully!")).toBeVisible();

  await page.reload();
  await expect(page.locator('[name="name"]')).toHaveValue("Test Hotel UPDATED");
  await page.locator('[name="name"]').fill("Test Hotel 1");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Hotel Updated successfully!")).toBeVisible();
});
