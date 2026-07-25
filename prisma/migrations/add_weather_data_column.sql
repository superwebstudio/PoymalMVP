-- Add weatherData column to Catch table
ALTER TABLE "Catch" ADD COLUMN IF NOT EXISTS "weatherData" JSONB;

