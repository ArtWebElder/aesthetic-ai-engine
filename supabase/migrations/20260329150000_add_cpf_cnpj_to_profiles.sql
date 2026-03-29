-- Add CPF/CNPJ column to profiles for Brazilian Pix payments
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
