/**
 * BimbelSync Plan Quota & Price Validation Library
 * Digunakan untuk memvalidasi batas kapasitas paket dan harga secara server-side dan client-side.
 */

export type ParseValidationResult =
  | { success: true; value: number; error?: undefined }
  | { success: false; error: string; value?: undefined };

export function parsePositiveQuotaLimit(
  value: unknown,
  fieldName: string
): ParseValidationResult {
  if (value === null || value === undefined) {
    return { success: false, error: `${fieldName} wajib diisi.` };
  }

  const str = String(value).trim();
  if (str === "") {
    return { success: false, error: `${fieldName} wajib diisi dengan bilangan bulat positif.` };
  }

  // Hanya izinkan digit angka bulat positif murni (menolak negatif, desimal, huruf, spasi)
  if (!/^\d+$/.test(str)) {
    return { success: false, error: `${fieldName} harus berupa bilangan bulat positif (contoh: 1, 10, 50).` };
  }

  const num = Number(str);
  if (!Number.isSafeInteger(num) || num <= 0) {
    return { success: false, error: `${fieldName} harus lebih besar dari 0 dan berada dalam rentang aman sistem.` };
  }

  if (num > 1000000) {
    return { success: false, error: `${fieldName} melebihi batas wajar sistem (maksimum 1.000.000).` };
  }

  return { success: true, value: num };
}

export function parsePlanPrice(
  value: unknown
): ParseValidationResult {
  if (value === null || value === undefined) {
    return { success: false, error: "Harga paket wajib diisi." };
  }
  const str = String(value).trim();
  if (!/^\d+$/.test(str)) {
    return { success: false, error: "Harga paket harus berupa bilangan bulat (angka saja, tanpa titik atau koma)." };
  }
  const num = Number(str);
  if (!Number.isSafeInteger(num) || num < 0 || num > 1000000000) {
    return { success: false, error: "Harga paket tidak valid atau berada di luar batas wajar." };
  }
  return { success: true, value: num };
}
