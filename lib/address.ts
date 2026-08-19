import { MidnightBech32m, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';

export function bech32ToUserAddress(value: string, networkId: string): { bytes: Uint8Array } {
  const parsed = MidnightBech32m.parse(value).decode(UnshieldedAddress, networkId);
  return { bytes: new Uint8Array(parsed.data) };
}
