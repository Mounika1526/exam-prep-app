-- Add isActive column to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Add indexes
CREATE INDEX IF NOT EXISTS "ai_conversations_userId_idx" ON "ai_conversations"("userId");
CREATE INDEX IF NOT EXISTS "ai_conversations_userId_topicId_idx" ON "ai_conversations"("userId", "topicId");
CREATE INDEX IF NOT EXISTS "ai_suggestions_userId_examId_idx" ON "ai_suggestions"("userId", "examId");
CREATE INDEX IF NOT EXISTS "study_sessions_userId_date_idx" ON "study_sessions"("userId", "date");
CREATE INDEX IF NOT EXISTS "test_sessions_examId_idx" ON "test_sessions"("examId");
CREATE INDEX IF NOT EXISTS "test_sessions_userId_idx" ON "test_sessions"("userId");
CREATE INDEX IF NOT EXISTS "test_sessions_userId_status_idx" ON "test_sessions"("userId", "status");
CREATE INDEX IF NOT EXISTS "user_progress_userId_status_idx" ON "user_progress"("userId", "status");
