-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resetPasswordExpire" TIMESTAMPTZ,
ADD COLUMN     "resetPasswordToken" VARCHAR(255);
