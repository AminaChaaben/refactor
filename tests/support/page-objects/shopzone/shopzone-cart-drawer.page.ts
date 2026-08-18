import { type Page, expect } from '@playwright/test';
import { expectToast } from '../../helpers/toast';

export class ShopzoneCartDrawer {
  private readonly drawer = this.page.locator('.cart-drawer');

  constructor(readonly page: Page) {}

  // ── Drawer state ──────────────────────────────────────────────────────────

  // Cart opens by adding the "open" CSS class: .cart-drawer.open { right: 0 }
  async expectOpen(): Promise<void> {
    await expect(this.drawer).toHaveClass(/\bopen\b/);
  }

  async expectClosed(): Promise<void> {
    await expect(this.drawer).not.toHaveClass(/\bopen\b/);
  }

  // ── Item assertions ───────────────────────────────────────────────────────

  private itemRow(productName: string) {
    return this.drawer.locator('.cart-item').filter({ hasText: productName });
  }

  async expectItemPresent(productName: string): Promise<void> {
    await expect(this.itemRow(productName)).toBeVisible();
  }

  // Cart total section has 3 rows: Subtotal (nth 0), Shipping (nth 1), Total (nth 2)
  async expectSubtotal(amount: string): Promise<void> {
    await expect(this.drawer.locator('.cart-total div').nth(0)).toContainText(amount);
  }

  async expectTotal(amount: string): Promise<void> {
    await expect(this.drawer.locator('.cart-total div').nth(2)).toContainText(amount);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async incrementQty(productName: string): Promise<void> {
    await this.itemRow(productName).getByRole('button', { name: '+' }).click();
  }

  // Remove is a <span> with onclick, not a <button>
  async removeItem(productName: string): Promise<void> {
    await this.itemRow(productName).locator('span').filter({ hasText: 'Remove' }).click();
  }

  async clickCheckout(): Promise<void> {
    await this.drawer.locator('.cart-cta button').first().click();
  }

  async clickContinueShopping(): Promise<void> {
    await this.drawer.locator('.cart-cta button').last().click();
  }

  // ── Toast delegate ────────────────────────────────────────────────────────

  async expectToast(message: string): Promise<void> {
    await expectToast(this.page, message);
  }
}
