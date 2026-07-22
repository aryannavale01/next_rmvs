-- CreateIndex: Add unique constraint to Session.token
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
