-- AlterTable
ALTER TABLE "Post"
ADD COLUMN "bookmarkCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill bookmark counts for existing posts
UPDATE "Post" p
SET "bookmarkCount" = b.cnt
FROM (
  SELECT "postId", COUNT(*)::INTEGER AS cnt
  FROM "PostBookmark"
  GROUP BY "postId"
) b
WHERE p."id" = b."postId";
