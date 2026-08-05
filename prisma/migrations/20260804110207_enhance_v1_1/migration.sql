-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CIRCLE_APPROVED', 'CIRCLE_REJECTED', 'CERTIFICATE_VERIFIED', 'RESULT_VERIFIED', 'GROUP_ADDED', 'SYSTEM', 'EMAIL_VERIFY');

-- AlterTable
ALTER TABLE "circles" ADD COLUMN     "clickCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "course_centers" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circle_views" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "userId" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circle_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "circle_views_circleId_idx" ON "circle_views"("circleId");

-- CreateIndex
CREATE INDEX "circle_views_userId_idx" ON "circle_views"("userId");

-- CreateIndex
CREATE INDEX "circle_views_createdAt_idx" ON "circle_views"("createdAt");

-- CreateIndex
CREATE INDEX "certificates_groupId_idx" ON "certificates"("groupId");

-- CreateIndex
CREATE INDEX "certificates_verified_idx" ON "certificates"("verified");

-- CreateIndex
CREATE INDEX "circles_ownerId_idx" ON "circles"("ownerId");

-- CreateIndex
CREATE INDEX "circles_priceAmount_idx" ON "circles"("priceAmount");

-- CreateIndex
CREATE INDEX "circles_createdAt_idx" ON "circles"("createdAt");

-- CreateIndex
CREATE INDEX "circles_viewCount_idx" ON "circles"("viewCount");

-- CreateIndex
CREATE INDEX "circles_deletedAt_idx" ON "circles"("deletedAt");

-- CreateIndex
CREATE INDEX "circles_latitude_longitude_idx" ON "circles"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "circles_name_idx" ON "circles"("name");

-- CreateIndex
CREATE INDEX "course_centers_ownerId_idx" ON "course_centers"("ownerId");

-- CreateIndex
CREATE INDEX "course_centers_deletedAt_idx" ON "course_centers"("deletedAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "results_circleId_idx" ON "results"("circleId");

-- CreateIndex
CREATE INDEX "results_verified_idx" ON "results"("verified");

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_views" ADD CONSTRAINT "circle_views_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_views" ADD CONSTRAINT "circle_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
