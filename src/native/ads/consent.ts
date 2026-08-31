import {
  AdmobConsentStatus,
  type AdmobConsentInfo,
} from '@capacitor-community/admob';

import type { ConsentSnapshot } from './types';

export const UNKNOWN_CONSENT: Readonly<ConsentSnapshot> = Object.freeze({
  status: 'unknown',
  canRequestAds: false,
  privacyOptionsRequired: false,
});

export const UNAVAILABLE_CONSENT: Readonly<ConsentSnapshot> = Object.freeze({
  status: 'unavailable',
  canRequestAds: false,
  privacyOptionsRequired: false,
});

export function mapConsentInfo(info: AdmobConsentInfo): ConsentSnapshot {
  let status: ConsentSnapshot['status'];

  switch (info.status) {
    case AdmobConsentStatus.REQUIRED:
      status = 'required';
      break;
    case AdmobConsentStatus.OBTAINED:
      status = 'obtained';
      break;
    case AdmobConsentStatus.NOT_REQUIRED:
      status = 'not-required';
      break;
    case AdmobConsentStatus.UNKNOWN:
    default:
      status = 'unknown';
      break;
  }

  const knownStatus = Object.values(AdmobConsentStatus).includes(info.status);

  return {
    status,
    canRequestAds: knownStatus && info.canRequestAds === true,
    privacyOptionsRequired: String(info.privacyOptionsRequirementStatus) === 'REQUIRED',
  };
}
