# Rhizome Indexer (Envio HyperIndex)

Indexes Rio evidence (governance votes, staking) and Rhizome's on-chain
Verified Connections on Monad Testnet (chain id 10143), and derives the
`SHARED_GOVERNANCE` relationship signal from raw `VoteCast` events so it
can be submitted to `RelationshipRegistry` by an authorized registrar.

Follows the locked trust model from the spec:

```
Rio events -> Envio derives RelationshipPair (explanatory, off-chain)
           -> registrar (registrar/submit.js) submits registerConnection()
           -> Monad enforces VerifiedConnection (on-chain, authoritative)
```

Envio explains. Monad decides. `RelationshipPair` is Envio's derived
graph and is never treated as an enforceable right on its own —
`VerifiedConnection` (mirrored from `ConnectionRegistered` events) is
the only entity that reflects enforced, on-chain state.

## Project layout

```
config.yaml              contracts, events, chain (Monad Testnet)
schema.graphql           entity model
src/handlers/
  RioGovernance.ts        ProposalCreated, VoteCast -> derives RelationshipPair
  RioStaking.ts           Staked, Unstaked -> raw evidence, not a signal source yet
  RelationshipRegistry.ts ConnectionRegistered -> VerifiedConnection (source of truth)
  RhizomeFactory.ts       RhizomeCreated -> Rhizome entity + dynamic registration
  Rhizome.ts              BootstrapMemberAdded/Removed, CreatorTransferred
registrar/
  submit.js               off-chain registrar bot (viem)
```

## 1. Configure and run the indexer

```
cd rhizome-indexer
cp .env.example .env
```

Fill in `.env` with the five contract addresses from your `forge script`
deploy output (`RioGovernance`, `RioStaking`, `RelationshipRegistry`,
`RhizomeFactory`). `Rhizome` instances are discovered automatically from
`RhizomeCreated` events, so they need no address.

```
pnpm install
pnpm codegen
pnpm dev
```

`pnpm dev` opens the local dev console with a link to the Hasura
GraphQL playground. Once it's synced, point the frontend's
`VITE_ENVIO_ENDPOINT` at that GraphQL URL (`envio start` in production
serves the same API from wherever you host it).

## 2. Run the registrar bot

The registrar is the explicit trust boundary from the spec: Envio can
explain that two wallets share governance evidence, but only an
authorized `registrar` address can write that as a `VerifiedConnection`
on Monad.

```
cd registrar
cp .env.example .env
```

`PRIVATE_KEY` must belong to the address currently set as
`RelationshipRegistry.registrar` (the deployer is the registrar by
default unless `setRegistrar` was called). `ENVIO_ENDPOINT` is the same
GraphQL URL from step 1.

```
npm install
npm start
```

It polls `RelationshipPair` for pairs whose Envio-derived
`evidenceCount` has moved past what's currently on-chain, and calls
`registerConnection` for each one. `MIN_EVIDENCE_COUNT` sets how many
shared proposals are required before a pair is submitted — the spec
doesn't fix this number, so it's a `.env` knob rather than a hardcoded
threshold.

## Design notes

- **Address normalization mirrors the contract.** `RelationshipPair.id`
  is `${lowerAddress}-${higherAddress}`, the same ordering
  `RelationshipRegistry` uses internally, so `RelationshipPair` and
  `VerifiedConnection` line up for the same two wallets regardless of
  who voted first.
- **`RelationshipPair` is provisional, `VerifiedConnection` is
  enforced.** A pair can exist in `RelationshipPair` (evidence seen)
  without a matching `VerifiedConnection` (not yet registered, or the
  registrar is down) — that gap is the point of the trust model, not a
  bug.
- **Evidence detail comes straight from Rio.** `SharedProposal` links
  each `RelationshipPair` to the actual proposals both wallets voted
  on, so the frontend's "why does Alice qualify" view can list real
  proposal titles instead of just a count.
- **`evidenceRef` is a hash of the shared proposal IDs**
  (`keccak256` of the sorted, comma-joined list), computed identically
  by the registrar bot each time so it's reproducible from the same
  evidence set — not an opaque or random value.
- **Staking is indexed but not a signal source**, per spec section 21
  — `StakePosition`/`StakeEvent` exist for demo completeness only.
- **`Rhizome` instances are dynamic contracts**, registered via
  `indexer.contractRegister` off `RhizomeFactory`'s `RhizomeCreated`
  event, so bootstrap membership changes on every Rhizome the factory
  deploys are indexed without listing addresses by hand.

## Frontend wiring

`src/lib/envio/client.js` in the frontend repo has been rewritten to
query this indexer's GraphQL API instead of `mockData.js`, using the
same function names and return shapes the pages already import. Set
`VITE_ENVIO_ENDPOINT` in the frontend's `.env.local` once step 1 is
synced and `DEMO_MODE` turns off automatically.

One deliberate signature change: `getConnectionEvidence` now takes
`(selfAddress, peerAddress)` instead of just `(peerAddress)` — the
stub only worked because it silently assumed "self" was the mock
Alice. It has no call sites yet in `app/`, so this is safe; wire it up
as `getConnectionEvidence(address, peer)` from `useAccount()` when you
build the evidence view.

## Known gaps / next steps

- `OverviewPage.jsx` still imports `MOCK_RHIZOME` directly for the
  qualification query key and `getRhizomeQualification` call, instead
  of reading the demo Rhizome from `CONTRACT_ADDRESSES.DEMO_RHIZOME`.
  Left alone since frontend fixes are a separate pass.
- `MemberSpace` isn't indexed — it isn't deployed by the factory, so
  there's no discovery event to hook. Add it as a normal top-level
  contract (address from `.env`) once a `MemberSpace` instance exists
  for the demo Rhizome.
- The registrar bot polls rather than reacting to indexer updates in
  real time