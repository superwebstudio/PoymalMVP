-- Enable Row Level Security on all public app tables.
--
-- Architecture: this app accesses data via Prisma (DATABASE_URL / pooler),
-- not via the Supabase anon/authenticated PostgREST API.
-- Enabling RLS with no policies for anon/authenticated denies direct
-- table access through PostgREST while Prisma (table owner / privileged
-- connection) continues to work.
--
-- Do NOT use FORCE ROW LEVEL SECURITY here — that would also apply to
-- the table owner and can break Prisma.
--
-- Run in Supabase SQL Editor (or: psql "$DATABASE_URL" -f ...)

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Catch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CatchView" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Like" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommentLike" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Follow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavedLocation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Referral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavedPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecurityAlert" ENABLE ROW LEVEL SECURITY;
