-- Add product approval tracking columns to products table
ALTER TABLE public.products 
ADD COLUMN approved boolean NOT NULL DEFAULT true,
ADD COLUMN approved_by uuid REFERENCES public.profiles(id),
ADD COLUMN approved_at timestamp with time zone;

-- Create index for faster filtering of approved products
CREATE INDEX idx_products_approved ON public.products(approved) WHERE approved = true;

-- Add comment for documentation
COMMENT ON COLUMN public.products.approved IS 'Soft delete flag - false means product is disapproved by admin';
COMMENT ON COLUMN public.products.approved_by IS 'Admin user who approved/disapproved the product';
COMMENT ON COLUMN public.products.approved_at IS 'Timestamp when product was last approved/disapproved';