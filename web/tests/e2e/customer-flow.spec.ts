import { test, expect } from "@playwright/test";

test.describe("Parcours client complet", () => {
  test("Inscription → connexion → catalogue → devis", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Imprimer simplement");
    await page.getByRole("link", { name: /commander|créer un compte/i }).first().click();
    await expect(page).toHaveURL(/register/);

    // Inscription
    await page.getByLabel("Prénom").fill("Jean");
    await page.getByLabel("Nom").fill("Test");
    await page.getByLabel("Email").fill(`test+${Date.now()}@printhub.io`);
    await page.getByLabel("Mot de passe").fill("Pwd!12345678");
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page).toHaveURL(/otp/);
  });

  test("Connexion existing user → dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("aissata@demo.printhub.io");
    await page.getByLabel("Mot de passe").fill("Printhub2026!");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator("h1")).toContainText(/bonjour/i);
  });

  test("Navigation catalogue", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("aissata@demo.printhub.io");
    await page.getByLabel("Mot de passe").fill("Printhub2026!");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.goto("/catalog");
    await expect(page.locator("h1")).toContainText("Catalogue");
  });
});
