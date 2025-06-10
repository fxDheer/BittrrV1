const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { apiLimiter } = require('../middleware/rateLimiter');
const Subscription = require('../models/Subscription');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Get user's subscription
router.get('/', auth, apiLimiter, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id });
    if (!subscription) {
      return res.json({
        plan: 'free',
        features: [],
        status: 'active'
      });
    }
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscription' });
  }
});

// Create or update subscription
router.post('/', auth, apiLimiter, async (req, res) => {
  try {
    const { plan, paymentMethodId } = req.body;

    // Validate plan
    const validPlans = ['basic', 'premium', 'vip'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    // Get plan price
    const planPrices = {
      basic: 9.99,
      premium: 19.99,
      vip: 29.99
    };

    // Create or update Stripe customer
    let customer = await stripe.customers.create({
      email: req.user.email,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: planPrices[plan] }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    // Create or update subscription in database
    const subscription = await Subscription.updateSubscription(req.user._id, plan);

    // Add payment to history
    await Subscription.addPayment(req.user._id, {
      amount: planPrices[plan],
      currency: 'USD',
      status: 'success',
      transactionId: stripeSubscription.id
    });

    res.json({
      subscription,
      clientSecret: stripeSubscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating subscription' });
  }
});

// Cancel subscription
router.post('/cancel', auth, apiLimiter, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id });
    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    // Cancel Stripe subscription
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.del(subscription.stripeSubscriptionId);
    }

    // Update subscription in database
    const updatedSubscription = await Subscription.cancelSubscription(req.user._id);
    res.json(updatedSubscription);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling subscription' });
  }
});

// Get billing history
router.get('/billing', auth, apiLimiter, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id });
    if (!subscription) {
      return res.json({ billingHistory: [] });
    }
    res.json({ billingHistory: subscription.billingHistory });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching billing history' });
  }
});

// Check feature access
router.get('/check-feature/:feature', auth, apiLimiter, async (req, res) => {
  try {
    const { feature } = req.params;
    const hasAccess = await Subscription.checkFeature(req.user._id, feature);
    res.json({ hasAccess });
  } catch (error) {
    res.status(500).json({ message: 'Error checking feature access' });
  }
});

// Update payment method
router.post('/payment-method', auth, apiLimiter, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const subscription = await Subscription.findOne({ user: req.user._id });
    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    // Update Stripe payment method
    if (subscription.stripeCustomerId) {
      await stripe.customers.update(subscription.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }

    // Update payment method in database
    const updatedSubscription = await Subscription.findOneAndUpdate(
      { user: req.user._id },
      {
        'paymentMethod.type': 'credit_card',
        'paymentMethod.last4': paymentMethodId.slice(-4)
      },
      { new: true }
    );

    res.json(updatedSubscription);
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment method' });
  }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'invoice.payment_succeeded':
      const subscription = event.data.object;
      // Update subscription status
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.subscription },
        { status: 'active' }
      );
      break;
    case 'invoice.payment_failed':
      const failedSubscription = event.data.object;
      // Handle failed payment
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: failedSubscription.subscription },
        { status: 'expired' }
      );
      break;
  }

  res.json({ received: true });
});

module.exports = router; 