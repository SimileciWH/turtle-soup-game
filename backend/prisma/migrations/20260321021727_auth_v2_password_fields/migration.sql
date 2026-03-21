-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locked_until" TIMESTAMP(3),
ADD COLUMN     "login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "password_hash" TEXT;
