import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set — Stripe checkout will fail until configured');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-06-24.dahlia',
  typescript: true,
});

/** Monthly PRO price in cents (EUR) */
export const PRO_MONTHLY_AMOUNT_CENTS = 499;
export const PRO_MONTHLY_CURRENCY = 'eur';
export const PRO_MONTHLY_DISPLAY = '€4.99';
