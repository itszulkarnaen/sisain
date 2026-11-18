/**
 * Salary Cipher Module (Application-Level Field Encryption - ALFE)
 * 
 * Menggunakan Web Crypto API (AES-GCM 256-bit) dengan key derivation PBKDF2
 * berbasis userId + secret salt aplikasi.
 * 
 * Keunggulan:
 * 1. Di Supabase Studio & database dump, data gaji tersimpan acak (contoh: "enc_v1:9Fq8...").
 * 2. Developer tidak bisa membaca gaji teman secara langsung dari Supabase dashboard.
 * 3. Tetap mendukung "Lupa Password" dan SSO Google tanpa merusak data karena userId di auth.users bersifat immutable.
 * 4. Kompatibel mundur dengan data gaji lama yang belum terenkripsi.
 */

const SALARY_APP_PEPPER = 'sisain_salary_pepper_v1_secure_2026';

/**
 * Derives a 256-bit AES-GCM CryptoKey from userId + app pepper using PBKDF2
 */
async function deriveSalaryKey(userId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(userId + SALARY_APP_PEPPER),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('sisain_salt_subtle_' + userId.slice(0, 8)),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Mengenkripsi nominal gaji menjadi format string ciphertext 'enc_v1:<base64>'
 */
export async function encryptSalary(salary: number, userId: string): Promise<string> {
  if (!userId || typeof window === 'undefined' && !globalThis.crypto) {
    return String(salary);
  }

  try {
    const key = await deriveSalaryKey(userId);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit standard IV for AES-GCM
    const data = new TextEncoder().encode(String(salary || 0));

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Gabungkan IV (12 bytes) + Encrypted Payload
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Encode to base64
    let binary = '';
    const bytes = new Uint8Array(combined);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return `enc_v1:${base64}`;
  } catch (err) {
    console.error('Failed to encrypt salary:', err);
    return String(salary);
  }
}

/**
 * Mendekripsi string ciphertext 'enc_v1:<base64>' kembali menjadi number gaji.
 * Jika data di database masih format lama (number biasa / text angka), akan otomatis dibaca normal.
 */
export async function decryptSalary(
  ciphertext: string | number | null | undefined,
  userId: string
): Promise<number> {
  if (ciphertext === null || ciphertext === undefined || ciphertext === '') {
    return 0;
  }

  // Jika masih tipe number (format lama)
  if (typeof ciphertext === 'number') {
    return ciphertext;
  }

  // Jika tipe string tapi bukan awalan enc_v1 (misal teks angka biasa "15000000")
  if (!ciphertext.startsWith('enc_v1:')) {
    const parsed = Number(ciphertext);
    return isNaN(parsed) ? 0 : parsed;
  }

  if (!userId || typeof window === 'undefined' && !globalThis.crypto) {
    return 0;
  }

  try {
    const base64 = ciphertext.slice(7); // potong 'enc_v1:'
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // IV adalah 12 bytes pertama
    const iv = bytes.slice(0, 12);
    const encryptedData = bytes.slice(12);

    const key = await deriveSalaryKey(userId);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    const salary = Number(decryptedText);
    return isNaN(salary) ? 0 : salary;
  } catch (err) {
    console.warn('Failed to decrypt salary payload, falling back to 0:', err);
    return 0;
  }
}
