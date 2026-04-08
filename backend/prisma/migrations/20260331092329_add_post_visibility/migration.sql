-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'FRIENDS');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC';
