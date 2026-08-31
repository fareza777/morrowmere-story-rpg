import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_ANDROID_BUNDLE_BYTES = 188_743_680;
export const DEFAULT_ANDROID_BUNDLE_PATH = resolve('android/app/build/outputs/bundle/release/app-release.aab');

export async function checkAndroidBundleSize(path = DEFAULT_ANDROID_BUNDLE_PATH) {
  let details;
  try {
    details = await stat(path);
  } catch {
    throw new Error('Android release bundle is missing. Build bundleRelease before checking size.');
  }
  if (!details.isFile()) throw new Error('Android release bundle path is not a file.');
  const result = Object.freeze({ bytes: details.size, mebibytes: details.size / (1024 * 1024) });
  if (details.size > MAX_ANDROID_BUNDLE_BYTES) {
    throw new Error(`Android release bundle exceeds the 180 MiB limit (${details.size} bytes).`);
  }
  return result;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const result = await checkAndroidBundleSize();
    console.log(`Android release bundle: ${result.bytes} bytes (${result.mebibytes.toFixed(2)} MiB).`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Android size check failed.');
    process.exitCode = 1;
  }
}
