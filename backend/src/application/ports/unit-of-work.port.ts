import type { TradeOfferRepository } from './trade-offer-repository.port.js';
import type { TradeProposalRepository } from './trade-proposal-repository.port.js';

export interface TransactionalRepositories {
  offers: TradeOfferRepository;
  proposals: TradeProposalRepository;
}

/** Ejecuta `work` en una transacción: si lanza, no se guarda nada. */
export interface UnitOfWork {
  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T>;
}
