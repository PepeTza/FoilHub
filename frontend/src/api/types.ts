/** Contrato de tipos de la API REST (docs/ARCHITECTURE.md §6). */

export type CardDto = {
  code: string;
  name: string;
  setName: string | null;
  rarity: string | null;
  color: string | null;
  cardType: string | null;
  imageUrl: string | null;
};

export type UserSummaryDto = {
  id: string;
  username: string;
};

export type OfferStatus = 'OPEN' | 'COMPLETED' | 'CANCELLED';

export type OfferDto = {
  id: string;
  owner: UserSummaryDto;
  offered: { card: CardDto; quantity: number };
  wanted: { card: CardDto; quantity: number };
  status: OfferStatus;
  createdAt: string;
  closedAt: string | null;
};

export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export type ProposalDto = {
  id: string;
  offer: OfferDto;
  proposer: UserSummaryDto;
  counterOffer: OfferDto | null;
  message: string | null;
  status: ProposalStatus;
  createdAt: string;
  respondedAt: string | null;
  contacts: { offerOwner: string | null; proposer: string | null } | null;
};

export type PageDto<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type ApiErrorBody = {
  statusCode: number;
  error: string;
  message: string | string[];
};

export type LoginResponseDto = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string | number;
  user: UserSummaryDto;
};

export type CurrentUserDto = {
  id: string;
  username: string;
  contactInfo: string | null;
};
