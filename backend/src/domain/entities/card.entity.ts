import type { CardCode } from '../value-objects/card-code.vo.js';

export interface CardProps {
  id: string;
  code: CardCode;
  name: string;
  setName: string | null;
  rarity: string | null;
  color: string | null;
  cardType: string | null;
  imageUrl: string | null;
}

/** Carta del catálogo. Solo lectura para los usuarios; se carga con ImportCardCatalogUseCase. */
export class Card {
  private constructor(private readonly props: CardProps) {}

  static create(props: CardProps): Card {
    return new Card({ ...props, name: props.name.trim() });
  }

  static restore(props: CardProps): Card {
    return new Card({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get code(): CardCode {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get setName(): string | null {
    return this.props.setName;
  }
  get rarity(): string | null {
    return this.props.rarity;
  }
  get color(): string | null {
    return this.props.color;
  }
  get cardType(): string | null {
    return this.props.cardType;
  }
  get imageUrl(): string | null {
    return this.props.imageUrl;
  }
}
