-- Add scientificName column to Catch table
ALTER TABLE "Catch" 
ADD COLUMN IF NOT EXISTS "scientificName" TEXT;

