-- Database schema outline for hopes-go-launch (Postgres / Supabase)

-- Unified users table (role: customer | driver | owner)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- nullable for oauth/social
  name TEXT,
  role TEXT NOT NULL,
  phone TEXT,
  created_at timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES users(id),
  driver_id uuid REFERENCES users(id),
  status TEXT NOT NULL, -- requested, accepted, picked_up, delivered, cancelled
  pickup_address JSONB,
  dropoff_address JSONB,
  request_type TEXT, -- e.g., 'food', 'parcel'
  delivery_fee_cents integer,
  tip_cents integer DEFAULT 0,
  total_cents integer,
  metadata JSONB,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Geotags to track driver location after accept until dropoff
CREATE TABLE IF NOT EXISTS geotags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES users(id),
  latitude double precision,
  longitude double precision,
  recorded_at timestamptz DEFAULT now()
);

-- Chats (in-app chat between customer and driver)
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id),
  message TEXT,
  metadata JSONB,
  created_at timestamptz DEFAULT now()
);

-- Driver shifts (clock in/out)
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES users(id),
  clock_in_at timestamptz,
  clock_out_at timestamptz,
  notes TEXT
);

-- Payments (Stripe charges / payment history)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  stripe_payment_intent_id TEXT,
  amount_cents integer,
  currency TEXT DEFAULT 'usd',
  status TEXT,
  created_at timestamptz DEFAULT now()
);

-- Simple performance metrics table for owner dashboards
CREATE TABLE IF NOT EXISTS metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES users(id),
  date date,
  completed_orders integer,
  avg_delivery_time_seconds integer,
  earnings_cents integer
);

-- Indexes (examples)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_geotags_order ON geotags(order_id);
