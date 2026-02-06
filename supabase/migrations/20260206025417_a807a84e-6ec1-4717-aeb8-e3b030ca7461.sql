-- Add must_change_password flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN deve_trocar_senha boolean NOT NULL DEFAULT false;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.deve_trocar_senha IS 'Flag indicating user must change password on first login';