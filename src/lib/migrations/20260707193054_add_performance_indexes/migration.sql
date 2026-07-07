-- CreateIndex
CREATE INDEX "ChatMessage_senderId_createdAt_idx" ON "ChatMessage"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_receiverId_createdAt_idx" ON "ChatMessage"("receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_receiverId_createdAt_idx" ON "ChatMessage"("senderId", "receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_isRead_idx" ON "ChatMessage"("isRead");

-- CreateIndex
CREATE INDEX "LiveStream_isActive_idx" ON "LiveStream"("isActive");

-- CreateIndex
CREATE INDEX "Match_date_idx" ON "Match"("date");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_date_status_idx" ON "Match"("date", "status");

-- CreateIndex
CREATE INDEX "Match_homeTeamId_date_idx" ON "Match"("homeTeamId", "date");

-- CreateIndex
CREATE INDEX "Match_awayTeamId_date_idx" ON "Match"("awayTeamId", "date");

-- CreateIndex
CREATE INDEX "Match_homeTeamId_awayTeamId_idx" ON "Match"("homeTeamId", "awayTeamId");

-- CreateIndex
CREATE INDEX "MatchEvent_matchId_createdAt_idx" ON "MatchEvent"("matchId", "createdAt");

-- CreateIndex
CREATE INDEX "MatchEvent_matchId_minute_idx" ON "MatchEvent"("matchId", "minute");

-- CreateIndex
CREATE INDEX "NewsPost_isPublished_createdAt_idx" ON "NewsPost"("isPublished", "createdAt");

-- CreateIndex
CREATE INDEX "NewsPost_authorId_createdAt_idx" ON "NewsPost"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "NewsPost_category_isPublished_idx" ON "NewsPost"("category", "isPublished");

-- CreateIndex
CREATE INDEX "NewsPost_title_idx" ON "NewsPost"("title");

-- CreateIndex
CREATE INDEX "RoleRequest_userId_status_idx" ON "RoleRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "RoleRequest_status_createdAt_idx" ON "RoleRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportMessage_senderId_idx" ON "SupportMessage"("senderId");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_createdAt_idx" ON "SupportTicket"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_teamId_idx" ON "User"("teamId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_role_createdAt_idx" ON "User"("role", "createdAt");

-- CreateIndex
CREATE INDEX "User_fullName_idx" ON "User"("fullName");
