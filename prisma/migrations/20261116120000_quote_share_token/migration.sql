-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "shareToken" UUID NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "Quote_shareToken_key" ON "Quote"("shareToken");

