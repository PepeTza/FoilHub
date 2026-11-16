/** Carta tal como la entrega el proveedor del catálogo, sin validar. */
export interface CatalogCard {
  code: string;
  name: string;
  setName: string | null;
  rarity: string | null;
  color: string | null;
  cardType: string | null;
  imageUrl: string | null;
}

export interface CardCatalogProvider {
  fetchAll(): Promise<CatalogCard[]>;
}
