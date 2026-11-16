-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "contact_info" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "set_name" TEXT,
    "rarity" TEXT,
    "color" TEXT,
    "card_type" TEXT,
    "image_url" TEXT,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_offers" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "offered_card_id" UUID NOT NULL,
    "offered_quantity" INTEGER NOT NULL,
    "wanted_card_id" UUID NOT NULL,
    "wanted_quantity" INTEGER NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "trade_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_proposals" (
    "id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "proposer_id" UUID NOT NULL,
    "counter_offer_id" UUID,
    "message" VARCHAR(280),
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "trade_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "cards_code_key" ON "cards"("code");

-- CreateIndex
CREATE INDEX "cards_name_idx" ON "cards"("name");

-- CreateIndex
CREATE INDEX "trade_offers_status_offered_card_id_wanted_card_id_idx" ON "trade_offers"("status", "offered_card_id", "wanted_card_id");

-- CreateIndex
CREATE INDEX "trade_proposals_offer_id_status_idx" ON "trade_proposals"("offer_id", "status");

-- AddForeignKey
ALTER TABLE "trade_offers" ADD CONSTRAINT "trade_offers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_offers" ADD CONSTRAINT "trade_offers_offered_card_id_fkey" FOREIGN KEY ("offered_card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_offers" ADD CONSTRAINT "trade_offers_wanted_card_id_fkey" FOREIGN KEY ("wanted_card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_proposals" ADD CONSTRAINT "trade_proposals_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "trade_offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_proposals" ADD CONSTRAINT "trade_proposals_counter_offer_id_fkey" FOREIGN KEY ("counter_offer_id") REFERENCES "trade_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_proposals" ADD CONSTRAINT "trade_proposals_proposer_id_fkey" FOREIGN KEY ("proposer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
