/**
 * RFC 6238 TOTP (Time-based One-Time Password) implementation using Web Crypto API.
 * Compatible with Google Authenticator, Authy, 1Password, Microsoft Authenticator.
 */

// Base32 Alphabet
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Generate a random 16-character Base32 TOTP secret key
export function generateRandomSecret(length: number = 16): string {
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[randomBytes[i] % BASE32_CHARS.length];
  }
  return secret;
}

// Decode Base32 string to Uint8Array
export function base32ToUint8Array(base32: string): Uint8Array {
  let bits = '';
  const clean = base32.toUpperCase().replace(/=/g, '').replace(/[^A-Z2-7]/g, '');
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean.charAt(i));
    if (val !== -1) {
      bits += val.toString(2).padStart(5, '0');
    }
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}

// Generate 6-digit TOTP for timestamp
export async function generateTOTP(base32Secret: string, timeSeconds: number = Math.floor(Date.now() / 1000)): Promise<string> {
  const timeStep = Math.floor(timeSeconds / 30);
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setBigUint64(0, BigInt(timeStep), false);

  const secretBytes = base32ToUint8Array(base32Secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    secretBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
  const sigBytes = new Uint8Array(signature);
  const offset = sigBytes[sigBytes.length - 1] & 0xf;

  const binary =
    ((sigBytes[offset] & 0x7f) << 24) |
    ((sigBytes[offset + 1] & 0xff) << 16) |
    ((sigBytes[offset + 2] & 0xff) << 8) |
    (sigBytes[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, '0');
  return otp;
}

// Verify TOTP token with +/- 30s clock skew tolerance
export async function verifyTOTP(base32Secret: string, token: string): Promise<boolean> {
  const cleanToken = token.trim();
  if (cleanToken.length !== 6 || isNaN(Number(cleanToken))) return false;

  const now = Math.floor(Date.now() / 1000);
  for (const delta of [0, -30, 30]) {
    const validOtp = await generateTOTP(base32Secret, now + delta);
    if (validOtp === cleanToken) return true;
  }
  return false;
}

// Generate OTPAuth URI for QR code generators
export function getOTPAuthURL(username: string, secret: string, issuer: string = 'WealthTracker'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
}
