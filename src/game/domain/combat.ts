/** Shared combat vocabulary kept below feature modules to avoid import cycles. */
export type AttackOutcome = 'miss' | 'glancing' | 'hit' | 'critical' | 'blocked' | 'parried';

export type CombatIntent = 'strike' | 'heavy' | 'guard' | 'hex' | 'recover' | 'flee';
