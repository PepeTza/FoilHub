// Tokens de inyección de los puertos de application/ports/. Los usan los guards
// (capa 3) y los módulos Nest (capa 4). Dueño: A; B no agrega tokens aquí.

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const CARD_REPOSITORY = Symbol('CARD_REPOSITORY');
export const TRADE_OFFER_REPOSITORY = Symbol('TRADE_OFFER_REPOSITORY');
export const TRADE_PROPOSAL_REPOSITORY = Symbol('TRADE_PROPOSAL_REPOSITORY');
export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
export const CARD_CATALOG_PROVIDER = Symbol('CARD_CATALOG_PROVIDER');
export const ID_GENERATOR = Symbol('ID_GENERATOR');
export const CLOCK = Symbol('CLOCK');
