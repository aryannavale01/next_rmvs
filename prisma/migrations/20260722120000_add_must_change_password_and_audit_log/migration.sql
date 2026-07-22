-- AlterTable: Add mustChangePassword to User
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: AuthActivityLog
CREATE TABLE "AuthActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_auth_activity_log_user_time" ON "AuthActivityLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_auth_activity_log_action_time" ON "AuthActivityLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "AuthActivityLog" ADD CONSTRAINT "AuthActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
