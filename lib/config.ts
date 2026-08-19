export const NETWORK = process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK ?? 'preprod';
export const ZK_ASSET_PATH = process.env.NEXT_PUBLIC_ZK_ASSET_PATH ?? '/zk/private-party';
export const DEFAULT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '';

export function assertPreprod(networkId: string) {
  if (NETWORK === 'preprod' && networkId !== 'preprod') {
    throw new Error(`Wallet network mismatch: expected preprod, received ${networkId}`);
  }
}
