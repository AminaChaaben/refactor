import { type Page, expect } from '@playwright/test';
import { expectToast, expectToastDismissed } from '../../helpers/toast';

const SHOPZONE_URL = process.env.SHOPZONE_BASE_URL ?? 'https://moonlit-flan-a34b2e.netlify.app/';

export class ShopzoneHomePage {
  constructor(readonly page: Page) {}

  async navigate(): Promise<void> {
    await this.page.goto(SHOPZONE_URL);
  }

  // ── Navigation bar ────────────────────────────────────────────────────────

  // Cart is rendered as a plain div: "🛒 Cart (2)" — no separate badge element
  async expectCartBadge(count: string): Promise<void> {
    await expect(this.page.locator('.top-bar div').filter({ hasText: 'Cart' }))
      .toContainText(`(${count})`);
  }

  async clickCartIcon(): Promise<void> {
    const cartDrawer = this.page.locator('.cart-drawer');

    const isOpen = await cartDrawer.evaluate(el =>
      el.classList.contains('open')
    );

    if (!isOpen) {
      await this.page
        .locator('.top-bar div')
        .filter({ hasText: 'Cart' })
        .click();
    }
  }

  // Sign in is a plain <div> in .top-bar, not a <button>
  async clickSignIn(): Promise<void> {
    await this.page.locator('.top-bar div').filter({ hasText: 'Sign in' }).click();
  }

  // ── Catalog filters ───────────────────────────────────────────────────────

  async selectCategory(category: string): Promise<void> {
    await this.page.locator('.filters select').first().selectOption(category);
  }

  async setPriceRangeMax(maxPrice: number): Promise<void> {
    const slider = this.page.locator('.filters input[type="range"]');
    await slider.fill(String(maxPrice));
    await slider.dispatchEvent('change');
  }

  async checkInStockOnly(): Promise<void> {
    // <label><input type="checkbox" /> In stock only</label> — Playwright resolves this correctly
    await this.page.getByLabel('In stock only').check();
  }

  async applyFilters(): Promise<void> {
    await this.page.locator('.filters button').click();
  }

  async expectFilteredResults(): Promise<void> {
    await expect(this.page.locator('.grid')).toBeVisible();
  }

  // ── Product cards ─────────────────────────────────────────────────────────

  private productCard(productName: string) {
    return this.page.locator('.card').filter({ hasText: productName });
  }

  async addToCart(productName: string): Promise<void> {
    await this.productCard(productName)
      .getByRole('button', { name: /add to cart/i })
      .click();
  }

  // ── Toast delegates ───────────────────────────────────────────────────────

  async expectToast(message: string): Promise<void> {
    await expectToast(this.page, message);
  }

  async expectToastDismissed(message: string, withinMs?: number): Promise<void> {
    await expectToastDismissed(this.page, message, withinMs);
  }

  // ── Newsletter section ────────────────────────────────────────────────────

  async scrollToNewsletter(): Promise<void> {
    await this.page.locator('.newsletter').scrollIntoViewIfNeeded();
  }

  async fillNewsletterEmail(email: string): Promise<void> {
    await this.page.locator('.newsletter form input').fill(email);
  }

  async clickSubscribe(): Promise<void> {
    await this.page.locator('.newsletter form button').click();
  }
}
