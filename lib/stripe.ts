import Stripe from 'stripe';

/** Monthly PRO price in cents (EUR) */
export const PRO_MONTHLY_AMOUNT_CENTS = 499;
export const PRO_MONTHLY_CURRENCY = 'eur';
export const PRO_MONTHLY_DISPLAY = '€4.99';

let stripeClient: Stripe | null = null;

/**
 * Lazy Stripe client — avoids crashing module load when STRIPE_SECRET_KEY
 * is missing (e.g. during build or before Vercel env is configured).
 */
export function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Add it in Vercel → Project → Settings → Environment Variables.'
    );
  }

  if (!stripeClient) {
    stripeClient = new Stripe(apiKey, {
      apiVersion: '2026-06-24.dahlia',
      typescript: true,
    });
  }

  return stripeClient;
}
