-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_audit_log (
  id integer NOT NULL DEFAULT nextval('admin_audit_log_id_seq'::regclass),
  admin_id uuid,
  action character varying,
  details text,
  timestamp timestamp without time zone DEFAULT now(),
  CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cart_items (
  id integer NOT NULL DEFAULT nextval('cart_items_id_seq'::regclass),
  cart_id integer,
  product_id_old_text text,
  quantity integer NOT NULL CHECK (quantity > 0),
  added_at timestamp without time zone DEFAULT now(),
  price_snapshot numeric,
  product_id uuid,
  user_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id),
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.lego_products(id)
);
CREATE TABLE public.carts (
  id integer NOT NULL DEFAULT nextval('carts_id_seq'::regclass),
  user_id uuid,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'checked_out'::character varying, 'abandoned'::character varying]::text[])),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT carts_pkey PRIMARY KEY (id),
  CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.event_logs (
  id integer NOT NULL DEFAULT nextval('event_logs_id_seq'::regclass),
  event_type character varying,
  reference_id integer,
  description text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT event_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE,
  order_id uuid UNIQUE,
  user_id uuid,
  amount numeric,
  currency character varying DEFAULT 'USD'::character varying,
  payment_provider text,
  payment_transaction_id text,
  status character varying DEFAULT 'stored'::character varying,
  content bytea,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.lego_products (
  id_old_text text NOT NULL,
  name text,
  description text,
  price_shipping_included numeric DEFAULT 0 CHECK (price_shipping_included >= 0::numeric),
  lego_pieces integer DEFAULT 0 CHECK (lego_pieces >= 0),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT lego_products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_items (
  id integer NOT NULL DEFAULT nextval('order_items_id_seq'::regclass),
  order_id uuid,
  product_id_old_text text,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_each numeric NOT NULL,
  subtotal numeric DEFAULT ((quantity)::numeric * price_each),
  product_id uuid,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.lego_products(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  product_id_old_text text,
  quantity integer CHECK (quantity > 0),
  status character varying DEFAULT 'pending'::character varying,
  shipping_address text,
  total_price numeric,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  product_id uuid,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.lego_products(id)
);
CREATE TABLE public.payments (
  id integer NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
  order_id uuid,
  provider character varying DEFAULT 'Card2Crypto'::character varying,
  transaction_id character varying UNIQUE,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'confirmed'::character varying, 'failed'::character varying, 'refunded'::character varying]::text[])),
  amount numeric,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.product_id_map (
  old_id text NOT NULL,
  new_id uuid NOT NULL,
  CONSTRAINT product_id_map_pkey PRIMARY KEY (old_id)
);
CREATE TABLE public.product_images (
  id integer NOT NULL DEFAULT nextval('product_images_id_seq'::regclass),
  product_id_old_text text,
  image_url text,
  updated_at timestamp without time zone DEFAULT now(),
  created_at timestamp without time zone DEFAULT now(),
  product_id uuid,
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.lego_products(id)
);
CREATE TABLE public.reviews (
  id integer NOT NULL DEFAULT nextval('reviews_id_seq'::regclass),
  user_id uuid,
  product_id_old_text text,
  rating smallint CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp without time zone DEFAULT now(),
  product_id uuid,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.lego_products(id)
);
CREATE TABLE public.user_activity (
  id integer NOT NULL DEFAULT nextval('user_activity_id_seq'::regclass),
  user_id uuid,
  action character varying,
  details text,
  timestamp timestamp without time zone DEFAULT now(),
  CONSTRAINT user_activity_pkey PRIMARY KEY (id),
  CONSTRAINT user_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying UNIQUE,
  email character varying UNIQUE,
  password character varying,
  role character varying DEFAULT 'user'::character varying,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  name character varying,
  password_hash text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);