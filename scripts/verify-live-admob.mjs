import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_PREFIX = 'ca-app-pub-3940256099942544';
const APP_ID_PATTERN = /^ca-app-pub-\d{16}~\d{10}$/;
const UNIT_ID_PATTERN = /^ca-app-pub-\d{16}\/\d{10}$/;

const requirements = Object.freeze([
  ['VITE_ADMOB_LIVE', /^1$/],
  ['MORROWMERE_ADMOB_APP_ID', APP_ID_PATTERN],
  ['VITE_ADMOB_BANNER_ID', UNIT_ID_PATTERN],
  ['VITE_ADMOB_REWARDED_ID', UNIT_ID_PATTERN],
  ['VITE_ADMOB_INTERSTITIAL_ID', UNIT_ID_PATTERN],
]);

export function validateLiveAdMobEnvironment(environment = process.env) {
  const missing = [];
  const invalid = [];

  for (const [name, pattern] of requirements) {
    const value = environment[name];
    if (!value) {
      missing.push(name);
    } else if (!pattern.test(value) || value.startsWith(SAMPLE_PREFIX)) {
      invalid.push(name);
    }
  }

  const unitNames = ['VITE_ADMOB_BANNER_ID', 'VITE_ADMOB_REWARDED_ID', 'VITE_ADMOB_INTERSTITIAL_ID'];
  const unitValues = unitNames.map((name) => environment[name]).filter(Boolean);
  if (unitValues.length === unitNames.length && new Set(unitValues).size !== unitValues.length) {
    for (const name of unitNames) if (!invalid.includes(name)) invalid.push(name);
  }

  return Object.freeze({ ok: missing.length === 0 && invalid.length === 0, missing, invalid });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const result = validateLiveAdMobEnvironment();
  if (!result.ok) {
    if (result.missing.length > 0) console.error(`Missing live AdMob variables: ${result.missing.join(', ')}`);
    if (result.invalid.length > 0) console.error(`Invalid live AdMob variables: ${result.invalid.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log('Live AdMob variable names and formats validated.');
  }
}
