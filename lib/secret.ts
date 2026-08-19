export type SecretRole = 'host' | 'guest' | 'invitation';

export function generateSecret(): Uint8Array {
  const secret = new Uint8Array(32);
  crypto.getRandomValues(secret);
  return secret;
}

function key(role: SecretRole, contractAddress: string) {
  return `private-party:${role}:${contractAddress}`;
}

export function saveSecret(role: SecretRole, contractAddress: string, secret: Uint8Array) {
  localStorage.setItem(key(role, contractAddress), toHex(secret));
}

export function loadSecret(role: SecretRole, contractAddress: string): Uint8Array | null {
  const value = localStorage.getItem(key(role, contractAddress));
  return value ? fromHex(value) : null;
}

export function toHex(value: Uint8Array) {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function fromHex(value: string) {
  return Uint8Array.from(value.match(/.{1,2}/g) ?? [], (part) => Number.parseInt(part, 16));
}
