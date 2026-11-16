import { DomainError } from './domain-error.js';
import * as errors from './domain-errors.js';

// Códigos de docs/ARCHITECTURE.md §3. Si cambian, cambia el contrato.
const EXPECTED_CODES: Record<keyof typeof errors, string> = {
  InvalidUsernameError: 'INVALID_USERNAME',
  InvalidCardCodeError: 'INVALID_CARD_CODE',
  InvalidQuantityError: 'INVALID_QUANTITY',
  WeakPasswordError: 'WEAK_PASSWORD',
  SameCardTradeError: 'SAME_CARD_TRADE',
  InvalidCredentialsError: 'INVALID_CREDENTIALS',
  NotOfferOwnerError: 'FORBIDDEN',
  NotProposalPartyError: 'FORBIDDEN',
  UserNotFoundError: 'USER_NOT_FOUND',
  CardNotFoundError: 'CARD_NOT_FOUND',
  OfferNotFoundError: 'OFFER_NOT_FOUND',
  ProposalNotFoundError: 'PROPOSAL_NOT_FOUND',
  UsernameTakenError: 'USERNAME_TAKEN',
  OfferNotOpenError: 'OFFER_NOT_OPEN',
  ProposalNotPendingError: 'PROPOSAL_NOT_PENDING',
  DuplicateProposalError: 'DUPLICATE_PROPOSAL',
  ConcurrencyConflictError: 'CONCURRENCY_CONFLICT',
  CannotTradeWithYourselfError: 'SELF_TRADE',
  CounterOfferNotMatchingError: 'COUNTER_OFFER_NOT_MATCHING',
};

describe('errores de dominio', () => {
  it.each(Object.entries(EXPECTED_CODES))('%s tiene code %s', (name, code) => {
    const ErrorClass = errors[name as keyof typeof errors] as new (
      detail: string,
    ) => DomainError;
    const error = new ErrorClass('BT1-084');

    expect(error).toBeInstanceOf(DomainError);
    expect(error.code).toBe(code);
    expect(error.name).toBe(name);
    expect(error.message.length).toBeGreaterThan(0);
  });
});
