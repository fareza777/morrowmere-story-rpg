type BrandedId<Name extends string> = string & { readonly __brand: Name };

export type EventId = string & { readonly __eventId: unique symbol };
export type ChapterId = 'ch01' | 'ch02' | 'ch03' | 'ch04' | 'ch05' | 'ch06' | 'ch07' | 'ch08';
export type ChoiceId = BrandedId<'ChoiceId'>;
export type ItemId = BrandedId<'ItemId'>;
export type EnemyId = BrandedId<'EnemyId'>;
export type EncounterId = BrandedId<'EncounterId'>;
export type CompanionId = BrandedId<'CompanionId'>;
export type MerchantId = BrandedId<'MerchantId'>;
export type FlagId = BrandedId<'FlagId'>;
export type FactionId = BrandedId<'FactionId'>;
export type DecisionId = BrandedId<'DecisionId'>;
export type SceneFamilyId = BrandedId<'SceneFamilyId'>;
export type IllustrationId = BrandedId<'IllustrationId'>;
export type VoiceCueId = BrandedId<'VoiceCueId'>;
export type CallbackId = BrandedId<'CallbackId'>;
export type MerchantStockPoolId = BrandedId<'MerchantStockPoolId'>;
export type MerchantDialogueSetId = BrandedId<'MerchantDialogueSetId'>;

export interface StoryPosition {
  readonly chapterId: ChapterId;
  readonly slot: number;
}
