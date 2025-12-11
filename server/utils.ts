/**
 * Generate a 6-character room code using nanoid
 * Uses uppercase letters and numbers, excluding confusing characters (0, O, I, 1)
 * Example: "AB3XK9", "P7M2RS"
 */
export function generateRoomCode(): string {
  // Safe alphabet: excludes 0, O, I, 1 to avoid confusion
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars.charAt(randomIndex);
  }

  return code;
}

/**
 * Generate a shareable link for a room
 * @param roomCode - The 6-character room code
 * @param baseUrl - Base URL of the client app
 * @returns Full URL to join the room
 */
export function generateShareableLink(roomCode: string, baseUrl: string): string {
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/join/${roomCode}`;
}

/**
 * Validate room code format
 * @param code - Room code to validate
 * @returns true if valid format
 */
export function isValidRoomCode(code: string): boolean {
  if (!code || code.length !== 6) return false;

  const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
  return validChars.test(code);
}
