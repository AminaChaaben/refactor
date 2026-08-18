/**
 * Feature: Shopping Cart End-to-End Flow — ShopZone
 *
 * Prerequisites:
 *   1. Set SHOPZONE_BASE_URL in .env (e.g. http://localhost:3000)
 *   2. The app must have 2 items pre-loaded in the cart for a fresh session
 *      (via storageState, API seed in beforeEach, or demo data).
 *   3. Add a "shopzone" project entry in playwright.config.ts with baseURL = SHOPZONE_BASE_URL
 *      and storageState: undefined so it runs as a clean new visitor.
 *
 * ⚠️  SPEC NOTES (confirm with Product Owner before finalising):
 *   - Step 4: Subtotal asserted as "$154.98" after qty increment — likely wrong expected value.
 *   - Step 5: Total asserted as "$154.98" after item removal — likely wrong expected value.
 */

import { test } from '@playwright/test';
import { ShopzoneHomePage } from '../support/page-objects/shopzone/shopzone-home.page';
import { ShopzoneCartDrawer } from '../support/page-objects/shopzone/shopzone-cart-drawer.page';
import { ShopzoneAuthModal } from '../support/page-objects/shopzone/shopzone-auth-modal.page';

// Run as a clean new visitor — bypasses any stored Salesforce auth state
test.use({ storageState: undefined });

test.describe('Shopping Cart End-to-End Flow @shopzone', () => {
  test('[P1] Full shopping flow from filtering to checkout as an authenticated user', async ({ page }) => {
    const home = new ShopzoneHomePage(page);
    const cart = new ShopzoneCartDrawer(page);
    const authModal = new ShopzoneAuthModal(page);

    // Background ──────────────────────────────────────────────────────────────
    await test.step('Background: navigate to ShopZone and verify pre-loaded cart', async () => {
      await home.navigate();
      // TODO: Implement cart pre-seeding (storageState / API / demo data)
      await home.expectCartBadge('2');
    });

    // Step 1: Filter the catalog ───────────────────────────────────────────────
    await test.step('Filter catalog by Electronics, max $200, in stock only', async () => {
      await home.selectCategory('Electronics');
      await home.setPriceRangeMax(200);
      await home.checkInStockOnly();
      await home.applyFilters();
      await home.expectFilteredResults();
    });

    // Step 2: Add a product ───────────────────────────────────────────────────
    await test.step('Add "Mirrorless Camera Kit" to cart; toast appears and auto-dismisses', async () => {
      await home.addToCart('Mirrorless Camera Kit');
      await home.expectToast('Added to cart!');
      await home.expectToastDismissed('Added to cart!', 3_000);
    });

    // Step 3: Open cart and verify contents ───────────────────────────────────
    await test.step('Open cart drawer and verify items and subtotal', async () => {
      await home.clickCartIcon();
      await cart.expectOpen();
      await cart.expectItemPresent('Wireless Headphones Pro');
      await cart.expectItemPresent('Mechanical Keyboard TKL');
      await cart.expectSubtotal('$154.98');
    });

    // Step 4: Adjust quantity ─────────────────────────────────────────────────
    await test.step('Increment qty for "Wireless Headphones Pro"; verify toast', async () => {
      await cart.incrementQty('Wireless Headphones Pro');
      await cart.expectToast('Qty updated');
      // ⚠️ SPEC NOTE: Subtotal "$154.98" unchanged after qty++ — confirm correct value with PO
      await cart.expectSubtotal('$154.98');
    });

    // Step 5: Remove an item ──────────────────────────────────────────────────
    await test.step('Remove "Mechanical Keyboard TKL"; verify toast', async () => {
      await cart.removeItem('Mechanical Keyboard TKL');
      await cart.expectToast('Removed');
      // ⚠️ SPEC NOTE: Total "$154.98" unchanged after item removal — confirm correct value with PO
      await cart.expectTotal('$154.98');
    });

    // Step 6: Proceed to checkout ─────────────────────────────────────────────
    await test.step('Click "Checkout →"; verify toast', async () => {
      await cart.clickCheckout();
      await cart.expectToast('Proceeding to checkout…');
    });

    // Step 7: Close cart and open sign-in modal ────────────────────────────────
    await test.step('Click "Continue shopping"; cart closes; open Sign in modal', async () => {
      await cart.clickContinueShopping();
      await cart.expectClosed();
      await home.clickSignIn();
      await authModal.expectVisible();
      await authModal.expectTabActive('Sign in');
      await authModal.expectTabInactive('Create account');
    });

    // Step 8: Switch to registration tab ──────────────────────────────────────
    await test.step('Switch to "Create account" tab; verify form visibility', async () => {
      await authModal.clickTab('Create account');
      await authModal.expectRegistrationFormVisible();
      await authModal.expectLoginFormHidden();
      await authModal.expectRegistrationFieldsPresent();
    });

    // Step 9: Fill and submit registration form ────────────────────────────────
    await test.step('Fill registration form and submit; toast then modal closes', async () => {
      await authModal.fillFirstName('Jane');
      await authModal.fillLastName('Doe');
      await authModal.fillEmail('jane.doe@exampe.com');
      await authModal.fillPassword('Password123!');
      await authModal.fillConfirmPassword('Password123!');
      await authModal.selectCountry('Tunisia');
      await authModal.acceptTerms();
      await authModal.submitRegistration();
      await authModal.expectToast('Account created!');
      await authModal.expectClosed();
    });

    // Step 10: Subscribe to newsletter ────────────────────────────────────────
    await test.step('Scroll to newsletter, enter email, subscribe; verify toast', async () => {
      await home.scrollToNewsletter();
      await home.fillNewsletterEmail('jane.doe@example.com');
      await home.clickSubscribe();
      await home.expectToast('Subscribed!');
    });
  });
});
