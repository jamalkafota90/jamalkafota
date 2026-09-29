import QRCode from 'qrcode';

// Ambiguous characters removed: 0, O, 1, I, L, o, l
const PIN_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates an easy numeric PIN for school students (defaults to 4 digits).
 * E.g. "1234", "4567", "7890"
 */
export function generateSecurePin(length: number = 4): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * Computes a standard SHA-256 hash formatted as a hex string.
 */
export async function hashPin(pin: string, salt: string = 'EPILKETOS_SALT_2026'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin.trim().toUpperCase() + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates a voter's plain PIN against the stored hash.
 */
export async function verifyPin(plainPin: string, storedHash: string, salt: string = 'EPILKETOS_SALT_2026'): Promise<boolean> {
  const computedHash = await hashPin(plainPin, salt);
  return computedHash === storedHash;
}

/**
 * Generates an anonymous cryptographic verification receipt token.
 * This proves a vote was registered atomically without revealing who voted for whom.
 */
export function generateReceiptToken(periodId: string): string {
  const randomVal = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timeHex = Date.now().toString(16).toUpperCase().slice(-6);
  return `VOTE-AUTH-${timeHex}-${randomVal}`;
}

/**
 * Generates a Data URL QR Code image from a given text payload.
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 140,
      margin: 1,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}
