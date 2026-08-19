# Quiet RSVP

A privacy-first party RSVP dApp for Midnight Preprod. Hosts create a party and add invitation commitments. Guests prove eligibility and submit an RSVP whose response is stored only as a salted commitment.

## Status

This repository includes the Compact contract, Next.js UI, 1AM wallet provider wiring, deployment/circuit helpers, invariant tests, and setup documentation. The official Compact compiler is required to generate the proving assets before a real chain deployment.

## Privacy boundary

Private data: wallet-derived guest identity, invitation secret, response, and response salt. The contract uses a private witness secret to derive a pseudonymous key and stores only `persistentCommit(response, guestSecret)`.

Public data: event commitment, deadline, optional capacity, invitation commitments, RSVP commitments, party state, and aggregate guest count. Invitation commitments prove eligibility without exposing the invitation secret. Individual responses are never disclosed or decoded by the UI.

The host stores event details in the invitation payload and the contract stores their SHA-256 commitment. This keeps the contract minimal and makes the host's intentional sharing decision explicit.

## Architecture

- `contract/src/private-party-rsvp.compact`: host authorization, invitation commitment registry, deadline/capacity checks, and private RSVP commitments.
- `lib/midnight.ts`: 1AM detection, Preprod connection, proving, balancing, submission, and indexer polling.
- `lib/party.ts`: deployment and the five exported application operations.
- `app/party/PartyClient.tsx`: host/guest workflows and transaction/error states.
- `tests/rsvp-model.test.ts`: fast behavioral checks for the contract invariants while Compact assets are unavailable.

The host secret and guest secret are generated with `crypto.getRandomValues` and stored in browser local storage. Losing a role secret means losing authorization for that role; secrets are never sent to an application server.

## Prerequisites

- Node.js 20 or newer.
- 1AM Wallet browser extension configured for Midnight `preprod` and funded with test NIGHT.
- Midnight Compact compiler installed and available as `compact` on `PATH`.

On Windows, `compact.exe` is already a system compression command. This project detects that collision; set `MIDNIGHT_COMPACT_BIN` to the actual Midnight compiler executable if its command is not first on `PATH`.

The current published `compact-js` metadata requests an unavailable ledger-v9 alpha. `package.json` contains an explicit npm override to the published `1.0.0-rc.4` release so installation is reproducible; recheck this override when the official SDK publishes a matching stable dependency.

## Setup

```powershell
cd midnight_blockchain
npm install
Copy-Item .env.example .env.local
npm test
npm run compact
npm run sync:assets
npm run dev
```

Open `http://localhost:3000/party`. Connect 1AM, create a party, generate an invitation commitment, and share the displayed invitation code with the guest. A second wallet/browser can paste the contract address and code.

## Environment

- `NEXT_PUBLIC_MIDNIGHT_NETWORK`: defaults to `preprod`; the UI rejects a wallet on another network.
- `NEXT_PUBLIC_ZK_ASSET_PATH`: defaults to `/zk/private-party`.
- `NEXT_PUBLIC_CONTRACT_ADDRESS`: optional address prefilled for guests.

Never put private keys, seed phrases, or role secrets in environment files.

## Contract circuits

- `addInvitation` and `revokeInvitation`: host-only commitment registry operations.
- `submitRsvp`: checks party state, `blockTime()` deadline, response domain, invitation commitment, and capacity; inserting the same guest identity modifies an existing commitment without increasing the count.
- `closeParty`: host-only finalization.

`disclose` is used only for host identity, event commitment, deadline, and capacity fields that are intentionally public. The RSVP response and guest secret never cross the boundary.

## Tests and troubleshooting

`npm test` runs the fast model tests. `npm run compact` must succeed before `npm run build`, because generated contract modules and ZK assets are intentionally gitignored.

If wallet connection fails, check that 1AM is initialized, the selected network is `preprod`, and the wallet has test NIGHT. If proving fails, remove stale generated assets, run `npm run compact`, then `npm run sync:assets`. If a host secret is lost, redeploy; it cannot be recovered from the public chain.
