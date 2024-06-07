import { test, expect } from "@playwright/test";

const UI_URL = "http://localhost:5173/";

test("Should allow the user to sign in", async ({ page }) => {
  await page.goto(UI_URL);

  // 1. Get the Sign In button
  await page.getByRole("link", { name: "Sign In" }).click();

  // 2. Check assertions
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();

  // 3. Find email & password fields and fill in data
  await page.locator("[name=email]").fill("1@1.com");
  await page.locator("[name=password]").fill("password123");

  // 4. Get login button and click it
  await page.getByRole("button", { name: "Login" }).click();

  // 5. Assertions for successful login
  await expect(page.getByText("Sign In successful")).toBeVisible();
  await expect(page.getByRole("link", { name: "My Bookings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "My Hotels" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
});

test("Should allow new user to register", async ({ page }) => {
  const test_email = `test_register${Math.floor(Math.random() * 9000) + 10000}@test.com`
  await page.goto(UI_URL);

  await page.getByRole("link", { name: "Sign In" }).click();
  await page.getByRole("link", { name: "Create an account here" }).click();
  await expect(
    page.getByRole("heading", { name: "Create an Account" })
  ).toBeVisible();

  await page.locator("[name=firstName]").fill("test_firstName");
  await page.locator("[name=lastName]").fill("test_lastName");
  await page.locator("[name=email]").fill(test_email);
  await page.locator("[name=password]").fill("password");
  await page.locator("[name=confirmPassword]").fill("password");

  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page.getByText("Registration Successful")).toBeVisible();
  await expect(page.getByRole("link", { name: "My Bookings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "My Hotels" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
});
