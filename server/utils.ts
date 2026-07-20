/**
 * Generate a 4-character room code
 * Uses uppercase letters and numbers, excluding confusing characters (0, O, I, 1)
 * Example: "AB3X", "P7M2"
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars.charAt(randomIndex);
  }
  return code;
}

/**
 * Generate a shareable link for a room
 */
export function generateShareableLink(roomCode: string, baseUrl: string): string {
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/join/${roomCode}`;
}

/**
 * Validate room code format — accepts both 4-char (free) and 6-char (custom instance)
 */
export function isValidRoomCode(code: string): boolean {
  if (!code) return false;
  if (code.length !== 4 && code.length !== 6) return false;
  const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
  return validChars.test(code);
}
