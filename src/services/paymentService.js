// Stripe payment service placeholder
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

module.exports = {
  createPaymentIntent: async ({ amount, currency = 'usd', metadata = {} }) => {
    // For MVP: only delivery fee + tip will be charged via Stripe
    // TODO: implement
    return { notImplemented: true };
  }
};
