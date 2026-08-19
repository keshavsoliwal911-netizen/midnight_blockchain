import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import type { MidnightProvider, WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import { assertPreprod } from './config';

export type ConnectedSession = { api: any; config: any; providers: any; unshieldedAddress: string };

export function fromHex(value: string) {
  const hex = value.startsWith('0x') ? value.slice(2) : value;
  return Uint8Array.from(hex.match(/.{1,2}/g) ?? [], (part) => Number.parseInt(part, 16));
}
export function toHex(value: Uint8Array) { return Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join(''); }

function privateStateProvider() {
  const states = new Map<string, unknown>();
  const keys = new Map<string, unknown>();
  return {
    setContractAddress(address: string) { this.scope = address; }, scope: '',
    async set(id: string, state: unknown) { states.set(`${this.scope}:${id}`, state); },
    async get(id: string) { return states.get(`${this.scope}:${id}`) ?? null; },
    async remove(id: string) { states.delete(`${this.scope}:${id}`); }, async clear() { states.clear(); },
    async setSigningKey(address: string, key: unknown) { keys.set(address, key); }, async getSigningKey(address: string) { return keys.get(address) ?? null; },
    async removeSigningKey(address: string) { keys.delete(address); }, async clearSigningKeys() { keys.clear(); },
  };
}

function publicDataProvider(queryUrl: string, subscriptionUrl: string) {
  const base = indexerPublicDataProvider(queryUrl, subscriptionUrl);
  return { ...base, async queryContractState(address: string, config?: unknown) {
    if (config) return base.queryContractState(address, config as never);
    const response = await fetch(queryUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: 'query($address: HexEncoded!) { contractAction(address: $address) { state } }', variables: { address } }) });
    if (!response.ok) throw new Error(`Indexer HTTP error: ${response.status}`);
    const payload = await response.json();
    if (payload.errors?.length) throw new Error(payload.errors.map((error: { message: string }) => error.message).join('; '));
    const state = payload.data?.contractAction?.state;
    return state ? ContractState.deserialize(fromHex(state)) : null;
  } };
}

export async function detectWallet() {
  const wallet = (window as any).midnight?.['1am'] ?? Object.values((window as any).midnight ?? {})[0];
  if (!wallet) throw new Error('No Midnight wallet extension found. Install 1AM Wallet.');
  return wallet;
}

export async function createConnectedSession(api: any, zkAssetPath: string): Promise<ConnectedSession> {
  const [config, unshielded, shielded] = await Promise.all([api.getConfiguration(), api.getUnshieldedAddress(), api.getShieldedAddresses()]);
  assertPreprod(config.networkId);
  setNetworkId(config.networkId);
  const zkConfigProvider = new FetchZkConfigProvider(new URL(zkAssetPath, window.location.origin).toString(), window.fetch.bind(window));
  const provingProvider = await api.getProvingProvider(zkConfigProvider);
  const providers = privateStateProvider();
  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => shielded.shieldedCoinPublicKey,
    getEncryptionPublicKey: () => shielded.shieldedEncryptionPublicKey,
    balanceTx: async (tx: any) => {
      const balanced = await api.balanceUnsealedTransaction(toHex(tx.serialize()));
      const { Transaction } = await import('@midnight-ntwrk/ledger-v8');
      return Transaction.deserialize('signature', 'proof', 'binding', fromHex(balanced.tx));
    },
  } as any;
  const midnightProvider: MidnightProvider = { submitTx: async (tx: any) => api.submitTransaction(toHex(tx.serialize())) };
  return { api, config, unshieldedAddress: unshielded.unshieldedAddress, providers: { privateStateProvider: providers, publicDataProvider: publicDataProvider(config.indexerUri, config.indexerWsUri), zkConfigProvider, proofProvider: { proveTx: (tx: any) => tx.prove(provingProvider) }, walletProvider, midnightProvider } };
}

export async function waitForState(queryUrl: string, address: string, attempts = 60) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const state = await publicDataProvider(queryUrl, '').queryContractState(address);
    if (state) return state;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Contract state was not indexed in time.');
}
