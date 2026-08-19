import { createUnprovenDeployTx, submitCallTxAsync, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { getCompiledContract, getLedger, sampleSigningKey, ContractState } from '../contract/src/index';
import type { ConnectedSession } from './midnight';
import { fromHex, waitForState } from './midnight';
import { bech32ToUserAddress } from './address';

export const PRIVATE_STATE_ID = 'PrivatePartyState';
export const ZK_PATH = '/zk/private-party';

async function compiled() { return getCompiledContract(); }

export async function deployParty(session: ConnectedSession, eventInfoCommitment: Uint8Array, deadline: number, maxGuests: number, hostSecret: Uint8Array) {
  const deploy = await (createUnprovenDeployTx as any)({ zkConfigProvider: session.providers.zkConfigProvider, walletProvider: session.providers.walletProvider }, { compiledContract: await compiled(), args: [eventInfoCommitment, BigInt(deadline), BigInt(maxGuests), hostSecret], privateStateId: PRIVATE_STATE_ID, initialPrivateState: {}, signingKey: sampleSigningKey() });
  const address = deploy.public.contractAddress;
  await (submitTxAsync as any)(session.providers, { unprovenTx: deploy.private.unprovenTx });
  await session.providers.privateStateProvider.setContractAddress(address);
  await session.providers.privateStateProvider.set(PRIVATE_STATE_ID, {});
  await session.providers.privateStateProvider.setSigningKey(address, deploy.private.signingKey);
  return address;
}

async function call(session: ConnectedSession, address: string, circuitId: string, args: unknown[]) {
  await (submitCallTxAsync as any)(session.providers, { compiledContract: await compiled(), contractAddress: address, circuitId, args, privateStateId: PRIVATE_STATE_ID });
}
export const addInvitation = (s: ConnectedSession, a: string, i: Uint8Array, h: Uint8Array) => call(s, a, 'addInvitation', [i, h]);
export const revokeInvitation = (s: ConnectedSession, a: string, i: Uint8Array, h: Uint8Array) => call(s, a, 'revokeInvitation', [i, h]);
export const submitRsvp = (s: ConnectedSession, a: string, response: Uint8Array, invitation: Uint8Array, guest: Uint8Array) => call(s, a, 'submitRsvp', [response, invitation, guest]);
export const closeParty = (s: ConnectedSession, a: string, h: Uint8Array) => call(s, a, 'closeParty', [h]);

export async function fetchPartyState(session: ConnectedSession, address: string) {
  const serialized = await waitForState(session.config.indexerUri, address);
  const ledger = await getLedger();
  const value = ledger(serialized.data) as any;
  return { guestCount: Number(value.guestCount), deadline: Number(value.deadline), maxGuests: Number(value.maxGuests), partyState: Number(value.partyState) === 0 ? 'OPEN' : 'CLOSED' };
}

export function userAddressFromSession(session: ConnectedSession) { return bech32ToUserAddress(session.unshieldedAddress, session.config.networkId); }
export function hashEventInfo(value: string): Promise<Uint8Array> { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then((hash) => new Uint8Array(hash)); }
export function responseBytes(value: 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE') { const bytes = new Uint8Array(32); bytes.set(new TextEncoder().encode(value)); return bytes; }
export function decodeStateHex(value: string) { return ContractState.deserialize(fromHex(value)); }
