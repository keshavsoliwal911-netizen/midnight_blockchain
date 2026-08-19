'use client';

import { useState } from 'react';
import { DEFAULT_CONTRACT_ADDRESS, NETWORK, ZK_ASSET_PATH } from '../../lib/config';
import { addInvitation, closeParty, deployParty, fetchPartyState, hashEventInfo, responseBytes, submitRsvp } from '../../lib/party';
import { createConnectedSession, detectWallet, type ConnectedSession } from '../../lib/midnight';
import { generateSecret, loadSecret, saveSecret, toHex } from '../../lib/secret';

type Mode = 'host' | 'guest';

export default function PartyClient() {
  const [session, setSession] = useState<ConnectedSession | null>(null);
  const [mode, setMode] = useState<Mode>('host');
  const [address, setAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [capacity, setCapacity] = useState('0');
  const [inviteCode, setInviteCode] = useState('');
  const [response, setResponse] = useState<'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE'>('ATTENDING');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function connect() {
    setError(''); setBusy(true);
    try { const wallet = await detectWallet(); const api = await wallet.connect(NETWORK); setSession(await createConnectedSession(api, ZK_ASSET_PATH)); setStatus('Wallet connected on Preprod.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Wallet connection failed.'); }
    finally { setBusy(false); }
  }
  async function run(label: string, operation: () => Promise<void>) { setBusy(true); setError(''); setStatus(label); try { await operation(); setStatus('Transaction submitted. Waiting for indexer is safe to do in the background.'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Transaction failed.'); } finally { setBusy(false); } }
  async function createParty() {
    if (!session) return;
    const secret = generateSecret(); const details = JSON.stringify({ eventName, description, deadline });
    await run('Proving and deploying the private party...', async () => { const commitment = await hashEventInfo(details); const deployed = await deployParty(session, commitment, Math.floor(new Date(deadline).getTime() / 1000), Number(capacity), secret); saveSecret('host', deployed, secret); setAddress(deployed); setStatus(`Party deployed at ${deployed}.`); });
  }
  async function invite() {
    if (!session || !address) return; const hostSecret = loadSecret('host', address); if (!hostSecret) { setError('Host secret is not available in this browser.'); return; }
    const invitation = generateSecret(); await run('Adding an invitation commitment...', async () => { await addInvitation(session, address, invitation, hostSecret); setInviteCode(toHex(invitation)); });
  }
  async function rsvp() {
    if (!session || !address) return; const invitation = new Uint8Array((inviteCode.match(/.{1,2}/g) ?? []).map((part) => Number.parseInt(part, 16))); let guestSecret = loadSecret('guest', address); if (!guestSecret) { guestSecret = generateSecret(); saveSecret('guest', address, guestSecret); }
    await run('Proving your invitation and RSVP privately...', async () => submitRsvp(session, address, responseBytes(response), invitation, guestSecret));
  }
  async function close() { if (!session || !address) return; const secret = loadSecret('host', address); if (!secret) { setError('Host secret is not available in this browser.'); return; } await run('Closing the party...', async () => closeParty(session, address, secret)); }

  return <section className="hero" style={{ display: 'block', paddingTop: 54 }}><div className="eyebrow">Private party desk / {NETWORK}</div><h1 style={{ maxWidth: 720 }}>A guest list with a boundary.</h1>
    <div className="actions"><button className="button" onClick={connect} disabled={busy || !!session}>{session ? 'Wallet connected' : 'Connect 1AM wallet'}</button><button className="button alt" onClick={() => setMode('host')}>Host</button><button className="button alt" onClick={() => setMode('guest')}>Guest</button></div>
    {session && <p className="private">Connected: {session.unshieldedAddress.slice(0, 16)}... / {session.config.networkId}</p>}
    {mode === 'host' ? <div className="panel form"><div><div className="eyebrow">Host / create</div><h2>Set the room</h2></div><label>Event name<input value={eventName} onChange={(event) => setEventName(event.target.value)} placeholder="A small evening" /></label><label>Private description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Share this through your invitation, not the ledger." /></label><label>RSVP deadline<input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label><label>Maximum guests<input type="number" min="0" value={capacity} onChange={(event) => setCapacity(event.target.value)} /></label><button className="button" onClick={createParty} disabled={busy || !session || !eventName || !deadline}>Create private party</button>{address && <><label>Contract address<input value={address} onChange={(event) => setAddress(event.target.value)} /></label><button className="button alt" onClick={invite} disabled={busy || !session}>Generate invitation commitment</button><button className="button alt" onClick={close} disabled={busy || !session}>Close party</button></>}</div> : <div className="panel form"><div><div className="eyebrow">Guest / RSVP</div><h2>Bring your invitation</h2></div><label>Contract address<input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Paste the party contract address" /></label><label>Invitation code<input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="The host shares this privately" /></label><label>Your answer<select value={response} onChange={(event) => setResponse(event.target.value as typeof response)}><option value="ATTENDING">Attending</option><option value="NOT_ATTENDING">Not attending</option><option value="MAYBE">Maybe</option></select></label><button className="button" onClick={rsvp} disabled={busy || !session || !address || !inviteCode}>Submit private RSVP</button></div>}
    {status && <p className="status">{status}</p>}{error && <p className="status">{error}</p>}
    <div className="panel" style={{ marginTop: 24 }}><div className="eyebrow">Privacy boundary</div><p><strong>Private:</strong> wallet identity, invitation secret, guest response, and response commitment salt.</p><p><strong>Public:</strong> event commitment, deadline, capacity, invitation commitments, salted RSVP commitments, and guest count.</p><p className="private">This UI never reads individual RSVP answers from the ledger.</p></div>
  </section>;
}
