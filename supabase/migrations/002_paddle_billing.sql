-- Migrate from Stripe to Paddle billing columns
ALTER TABLE profiles
  RENAME COLUMN stripe_customer_id TO paddle_customer_id;

ALTER TABLE profiles
  RENAME COLUMN stripe_subscription_id TO paddle_subscription_id;
