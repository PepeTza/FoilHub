-- Un usuario no puede tener dos propuestas PENDING sobre la misma oferta
-- (docs/ARCHITECTURE.md §5). Prisma no soporta índices parciales en el schema,
-- por eso esta migración es SQL manual.
CREATE UNIQUE INDEX "trade_proposals_one_pending"
  ON "trade_proposals" ("offer_id", "proposer_id")
  WHERE "status" = 'PENDING';
