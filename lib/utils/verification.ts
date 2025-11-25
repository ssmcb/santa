import { customAlphabet } from 'nanoid';

// Generate a 6-digit numeric verification code
export function generateVerificationCode(): string {
  const nanoid = customAlphabet('0123456789', 6);
  return nanoid();
}

// Generate verification code expiration time (30 minutes from now)
export function getCodeExpiration(): Date {
  return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
}

// Check if code has expired
export function isCodeExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

// Check if cooldown period has passed (30 seconds)
export function canResendCode(lastSentAt: Date | null): boolean {
  if (!lastSentAt) return true;
  const cooldownMs = 30 * 1000; // 30 seconds
  return Date.now() - lastSentAt.getTime() >= cooldownMs;
}

// Get remaining cooldown seconds
export function getRemainingCooldown(lastSentAt: Date | null): number {
  if (!lastSentAt) return 0;
  const cooldownMs = 30 * 1000; // 30 seconds
  const elapsed = Date.now() - lastSentAt.getTime();
  const remaining = Math.max(0, cooldownMs - elapsed);
  return Math.ceil(remaining / 1000);
}
