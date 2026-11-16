import { DomainError } from './domain-error.js';

// Errores de negocio de docs/ARCHITECTURE.md §3. El status HTTP lo decide
// DomainExceptionFilter (capa 3) a partir de `code`.

export class InvalidUsernameError extends DomainError {
  constructor() {
    super(
      'INVALID_USERNAME',
      'El usuario debe tener entre 3 y 20 caracteres: letras, números o _',
    );
  }
}

export class InvalidCardCodeError extends DomainError {
  constructor(code: string) {
    super(
      'INVALID_CARD_CODE',
      `El código de carta "${code}" no es válido (ej. BT1-084)`,
    );
  }
}

export class InvalidQuantityError extends DomainError {
  constructor() {
    super(
      'INVALID_QUANTITY',
      'La cantidad debe ser un número entero entre 1 y 99',
    );
  }
}

export class WeakPasswordError extends DomainError {
  constructor() {
    super('WEAK_PASSWORD', 'La contraseña debe tener entre 8 y 72 caracteres');
  }
}

export class SameCardTradeError extends DomainError {
  constructor() {
    super('SAME_CARD_TRADE', 'No puedes ofrecer y pedir la misma carta');
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Usuario o contraseña incorrectos');
  }
}

export class NotOfferOwnerError extends DomainError {
  constructor() {
    super('FORBIDDEN', 'Solo el dueño de la oferta puede hacer esto');
  }
}

export class NotProposalPartyError extends DomainError {
  constructor() {
    super('FORBIDDEN', 'Solo quien hizo la propuesta puede hacer esto');
  }
}

export class UserNotFoundError extends DomainError {
  constructor() {
    super('USER_NOT_FOUND', 'Usuario no encontrado');
  }
}

export class CardNotFoundError extends DomainError {
  constructor(code: string) {
    super('CARD_NOT_FOUND', `No existe la carta ${code}`);
  }
}

export class OfferNotFoundError extends DomainError {
  constructor() {
    super('OFFER_NOT_FOUND', 'Oferta no encontrada');
  }
}

export class ProposalNotFoundError extends DomainError {
  constructor() {
    super('PROPOSAL_NOT_FOUND', 'Propuesta no encontrada');
  }
}

export class UsernameTakenError extends DomainError {
  constructor() {
    super('USERNAME_TAKEN', 'Ese nombre de usuario ya está en uso');
  }
}

export class OfferNotOpenError extends DomainError {
  constructor() {
    super('OFFER_NOT_OPEN', 'La oferta ya no está abierta');
  }
}

export class ProposalNotPendingError extends DomainError {
  constructor() {
    super('PROPOSAL_NOT_PENDING', 'La propuesta ya no está pendiente');
  }
}

export class DuplicateProposalError extends DomainError {
  constructor() {
    super(
      'DUPLICATE_PROPOSAL',
      'Ya tienes una propuesta pendiente para esta oferta',
    );
  }
}

export class ConcurrencyConflictError extends DomainError {
  constructor() {
    super(
      'CONCURRENCY_CONFLICT',
      'Otra persona modificó esto al mismo tiempo, intenta de nuevo',
    );
  }
}

export class CannotTradeWithYourselfError extends DomainError {
  constructor() {
    super('SELF_TRADE', 'No puedes proponer un trade sobre tu propia oferta');
  }
}

export class CounterOfferNotMatchingError extends DomainError {
  constructor() {
    super(
      'COUNTER_OFFER_NOT_MATCHING',
      'Tu oferta vinculada no es la inversa exacta de esta oferta',
    );
  }
}
