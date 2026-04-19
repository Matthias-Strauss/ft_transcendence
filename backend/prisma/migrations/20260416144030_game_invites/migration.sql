-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('PONG');

-- CreateEnum
CREATE TYPE "GameInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELED');

-- CreateTable
CREATE TABLE "GameInvite" (
    "id" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL DEFAULT 'PONG',
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status" "GameInviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "matchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameInvite_senderId_recipientId_gameType_status_idx" ON "GameInvite"("senderId", "recipientId", "gameType", "status");

-- CreateIndex
CREATE INDEX "GameInvite_recipientId_status_expiresAt_idx" ON "GameInvite"("recipientId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "GameInvite_senderId_status_expiresAt_idx" ON "GameInvite"("senderId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "GameInvite_matchId_idx" ON "GameInvite"("matchId");

-- AddForeignKey
ALTER TABLE "GameInvite" ADD CONSTRAINT "GameInvite_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameInvite" ADD CONSTRAINT "GameInvite_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
