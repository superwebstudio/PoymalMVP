-- Add missing columns to Catch table
ALTER TABLE "Catch" 
ADD COLUMN IF NOT EXISTS "rating" INTEGER,
ADD COLUMN IF NOT EXISTS "weatherData" JSONB;

