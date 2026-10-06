# Rhizome

### Communities that form from relationships, not memberships.

**Relationship-derived membership on Monad — verified connections in, enforceable rights out.**

Rhizome is a protocol for communities whose membership is **derived from live, evidence-backed relationships** rather than explicitly assigned.

Instead of asking *"Does this wallet own the right token?"* or *"Was this wallet added to the list?"*, Rhizome asks:

> **"Does this wallet have the relationships required to belong here?"**

Evidence from social, collaborative or onchain activity is turned into typed relationship signals, registered as **Verified Connections**, and evaluated by a community's membership rules. Those membership conditions can then control real onchain rights.

```
Evidence → Relationship Signal → Verified Connection → Freshness → Membership → Rights
```

A **Rhizome** defines what relationship signal qualifies, how long that relationship stays fresh, and how many qualifying connections are required. When relationships go stale, membership lapses on its own, with no admin action, no cron job and no stored flag.

> **Envio explains. Monad decides.**

> Built for **Monad Metropolis** · Social / Culture track · Monad Testnet (chain ID `10143`) · [Why Monad?](#why-monad)

---

## Table of Contents

1. [Overview](#overview)
2. [The Problem](#the-problem)
3. [The Solution](#the-solution)
4. [Why Monad](#why-monad)
5. [How It Works](#how-it-works)
6. [Repository Structure](#repository-structure)
7. [Architecture](#architecture)
8. [Smart Contracts](#smart-contracts)
9. [Membership Model](#membership-model)
10. [Freshness Model](#freshness-model)
11. [Trust Model](#trust-model)
12. [The Indexer (Envio)](#the-indexer-envio)
13. [The Registrar Bot](#the-registrar-bot)
14. [Frontend](#frontend)
15. [Live Deployment: Monad Testnet](#live-deployment-monad-testnet)
16. [Getting Started](#getting-started)
17. [Configuration Reference](#configuration-reference)
18. [Testing](#testing)
19. [Integrating Rhizome in Your Contract](#integrating-rhizome-in-your-contract)
20. [Use Cases](#use-cases)
21. [Design Decisions & Tradeoffs](#design-decisions--tradeoffs)
22. [Known Limitations](#known-limitations)
23. [Status & Roadmap](#status--roadmap)
24. [Tech Stack](#tech-stack)
25. [Team](#team)

---

## Overview

Rhizome turns **evidence of real interaction between two wallets** into **enforceable onchain rights**.

- **Rio** (a demo governance and staking environment) produces observable activity.
- **Envio** indexes that activity and derives relationship signals from it.
- A **registrar** submits qualifying relationships to a **RelationshipRegistry** on Monad as *Verified Connections*.
- A **Rhizome** (one community) reads active connections against its anchors and derives `isMember()` on every call.
- **MemberSpace** shows that membership is a real, enforceable right: a non-member's `post()` call reverts.

The name comes from the botanical rhizome: a root network with no single center, where any node can sprout a new shoot. Communities grow along relationships rather than being handed down from a list.

### Core concepts

| Term | Meaning |
|---|---|
| **Evidence** | Observable activity between wallets. In the MVP: two wallets voting on the same Rio governance proposal. |
| **Relationship signal** | A typed kind of qualifying relationship, identified onchain by a `bytes32` `signalType` (MVP: `SHARED_GOVERNANCE`). |
| **Verified Connection** | The canonical onchain record that a relationship signal has qualified between two addresses. "Verified" is the protocol's name for this canonical registered state; it does not mean the relationship is cryptographically proven (see [Trust Model](#trust-model)). |
| **Freshness** | How long a connection counts after its last qualifying activity. |
| **Anchor** | One of up to 3 creator-assigned bootstrap members a Rhizome measures connections against. |
| **Rhizome** | One community: a signal, a freshness window, a threshold and its anchors. |
| **Rights** | Anything a contract gates on `isMember()`, such as posting, minting or voting. |

### Evidence sources are pluggable

A Rhizome is defined by *what relationship signal qualifies*, not by where the evidence comes from. The registry and the Rhizome contracts only see a `signalType`. In this MVP the evidence source is Rio governance activity, derived by Envio and registered by a registrar, but social, collaborative or other onchain sources can be added the same way: derive a new signal off-chain, register it, and point a Rhizome at it.

| Traditional community | Rhizome community |
|---|---|
| Admin decides who belongs | Verified connections decide who belongs |
| Static member list | Derived membership |
| Manual approval | Connection evaluation |
| Manual removal | Membership becomes inactive on its own |
| Platform-specific roles | Shared, inspectable onchain state |
| Membership is **assigned** | Membership is **derived** |

---

## The Problem

Onchain communities mostly run on allowlists, token balances or NFT holdings. Each has a weakness:

- **Allowlists are admin-controlled and static.** Someone has to add and remove people by hand, and stale members stay forever.
- **Token and NFT gating measures wealth, not belonging.** It can be bought, borrowed or farmed across many wallets, and says nothing about whether you actually participate.
- **Membership never decays.** A wallet that joined once and vanished still holds full rights a year later.
- **Reputation systems are opaque.** Scores and badges are computed off-chain and can't be enforced by other contracts without trusting an oracle.
- **Evidence is invisible to contracts.** Real shared activity (voting on the same proposals, for example) exists onchain, but nothing turns it into a right that other contracts can check.

## The Solution

Rhizome makes membership a **pure function of fresh relationship evidence**:

1. **Evidence, not judgment.** Every Verified Connection is backed by observable activity (in the MVP, two wallets voting on the same Rio governance proposal) and carries an `evidenceRef` hash, rather than resting on anyone's opinion.
2. **Pairwise and undirected.** A connection is between two wallets and is identical regardless of which is "A" and which is "B".
3. **Anchored.** Each Rhizome has up to **3 bootstrap anchors**. Membership comes from active connections *to those anchors*.
4. **Fresh.** A connection counts only inside the Rhizome's freshness window, measured from the last qualifying activity.
5. **Derived on read.** There is no stored "is member" flag for normal members. `isMember()` is recomputed every time, so expiry is automatic.
6. **Enforceable.** Other contracts call `isMember()` directly. No oracle, no off-chain lookup.

---

## Why Monad

Rhizome is built on Monad because its core idea, **membership that is recomputed from live relationships on every call**, only works if the chain makes reads cheap, writes plentiful and state fresh. Monad is the first EVM chain where that design is practical rather than a gas problem.

| What Rhizome needs | Why it matters | What Monad gives it |
|---|---|---|
| **Cheap, constant on-chain reads and checks** | `isMember()` loops over up to 3 anchors and reads the registry up to 3 times. It is meant to sit inside a modifier on *every* interaction (see `MemberSpace.post()`), not be called once and cached. | Low execution cost and high throughput make a per-call membership check affordable, so there is no need to cache a stored flag that can go stale. |
| **State that is current within a block** | Freshness is `block.timestamp <= lastQualifiedAt + freshnessPeriod`. A member can lapse at any second, and the next call must see it. | Fast blocks (published target: ~400 ms) mean the chain's clock, and therefore the membership answer, moves in sub-second steps. Expiry is enforced almost as it happens. |
| **Fast finality for a live UI** | The My Network graph, connection badges and membership checklist should reflect a new Verified Connection right away, not minutes later. | Quick finality (published target: ~800 ms) lets the indexer and frontend show registrations as they land, so the graph feels alive. |
| **Room for many connections** | One shared `RelationshipRegistry` stores every pair, and the registrar keeps writing as new evidence appears. The graph only becomes useful when it is dense. | High throughput and cheap gas make writing and renewing connections at community scale viable. Different pairs write to different storage slots, so independent registrations rarely conflict under parallel execution. |
| **Standard EVM tooling** | The contracts are plain Solidity, tested with Foundry, wired to wagmi and WalletConnect, and indexed by Envio. | Full EVM bytecode compatibility means no new language, VM or wallet flow. Everything here is the normal Ethereum toolchain pointed at Monad (chain ID `10143` on testnet). |

### Why this fits the Social / Culture track

The track is about open social graphs, programmable incentives and fast settlement. Rhizome is an open social graph whose edges are evidence-backed and expire on their own, and whose membership gates real on-chain rights (posting, minting, voting). Those rights only feel responsive if the underlying chain settles quickly and cheaply.

### The same design on a slower, costlier chain

- A per-call `isMember()` check becomes an expense, pushing designs toward cached membership flags, which is exactly the stale-state problem Rhizome exists to remove.
- Slow blocks and finality delay the moment a lapse or a new connection becomes visible, so the graph feels like a nightly report rather than a live network.
- Keeping connections renewed at scale would mean batching, keepers or off-chain shortcuts, which weakens the trust model.

> **Envio explains. Monad decides.** Envio gives the history and context, and Monad is where the authoritative, enforceable answer lives, at a speed and price that lets it be asked every time.

> The Monad figures above are the network's published targets; see the [Monad documentation](https://docs.monad.xyz) for current numbers.

---

## How It Works

### End-to-end flow

```
  Rio (evidence)              Envio (explains)                Monad (decides)
 ─────────────────      ─────────────────────────      ───────────────────────────────

  Alice votes on #7  ─┐
                      ├─►  VoteCast events  ─►  RelationshipPair(Alice, Bob)
  Bob votes on #7    ─┘     indexed             evidenceCount = 1
                                                      │
                                                      ▼
                                            Registrar bot polls the pair,
                                            sees evidenceCount > onchain count
                                                      │
                                                      ▼
                                       RelationshipRegistry.registerConnection(...)
                                                      │
                                                      ▼
                                       VerifiedConnection (Alice ↔ Bob, SHARED_GOVERNANCE)
                                                      │
                                                      ▼
                                  Rhizome.isMember(Alice)  ──►  true if ≥ N fresh
                                                                connections to anchors
                                                      │
                                                      ▼
                                      MemberSpace.post(hash)  ──►  allowed / reverts
```

### Step by step

1. **Activity happens in Rio.** Wallets vote on `RioGovernance` proposals. Each vote emits `VoteCast(voter, proposalId, support, timestamp)`.
2. **Envio derives pairs.** For every proposal, any two distinct voters form a `RelationshipPair`. Each shared proposal adds one unit of `evidenceCount` and updates `lastQualifiedAt`.
3. **The registrar submits.** A bot polls Envio. When a pair's `evidenceCount` exceeds what is onchain and meets `MIN_EVIDENCE_COUNT`, it calls `registerConnection` on `RelationshipRegistry`.
4. **The registry records the connection.** It stores the signal type, evidence count, first and last qualified timestamps and an `evidenceRef` hash. It does **not** score or judge anything.
5. **A Rhizome derives membership.** `Rhizome.isMember(user)` loops over its anchors and counts those where `registry.isConnectionActive(user, anchor, signalType, freshnessPeriod)` is true.
6. **Rights are enforced.** `MemberSpace.post()` is `onlyMember`. A wallet that qualifies can post; one whose connections expired cannot.

---

## Repository Structure

```
Rhizome/
├── contracts/                      Foundry project (Solidity 0.8.26)
│   ├── src/
│   │   ├── rhizome/
│   │   │   ├── RelationshipRegistry.sol   Verified Connections (registrar-gated writes)
│   │   │   ├── Rhizome.sol                One community: config + anchors + derived isMember()
│   │   │   ├── RhizomeFactory.sol         Deploys Rhizome instances on a shared registry
│   │   │   └── MemberSpace.sol            onlyMember-gated post(), proof of enforceability
│   │   └── rio/
│   │       ├── RioToken.sol               Demo ERC-20
│   │       ├── RioGovernance.sol          Proposals + one-vote-per-address (evidence source)
│   │       └── RioStaking.sol             Stake / unstake (second activity source)
│   ├── script/
│   │   ├── Deploy.s.sol                   Deploys the full stack in dependency order
│   │   └── SeedDemo.s.sol                 Creates the "Monad Builders" demo Rhizome
│   ├── test/                              7 suites + TestBase
│   ├── broadcast/                         Deployment record for chain 10143
│   ├── lib/                               forge-std, openzeppelin-contracts
│   └── foundry.toml
│
├── indexer/                        Envio HyperIndex + registrar bot
│   ├── config.yaml                        Contracts, events, chain
│   ├── schema.graphql                     Entity model
│   ├── src/handlers/                      One handler file per indexed contract
│   └── registrar/
│       └── submit.js                      Off-chain registrar (viem)
│
└── frontend/                       Vite + React app
    └── src/
        ├── pages/Landing.jsx              Marketing landing page
        ├── app/                           Overview · Network · Rhizomes · Explore · Create · Demo
        ├── components/                    Graph, membership, connection, wallet and UI components
        └── lib/                           contracts (ABIs, addresses), envio client, wallet, formatters
```

---

## Architecture

```
RIO: evidence source                  RHIZOME: protocol
───────────────────────────           ───────────────────────────────────────
RioToken.sol       (ERC-20)           RelationshipRegistry.sol   ◄── Verified Connections
RioGovernance.sol  (proposals/votes)  Rhizome.sol                ◄── derived membership
RioStaking.sol     (stake/unstake)    RhizomeFactory.sol         ◄── deploys Rhizomes
                                      MemberSpace.sol            ◄── onlyMember right
```

**One registry, many Rhizomes.** Connections live in a single shared `RelationshipRegistry`, keyed by `(sorted pair, signalType)`. Each `Rhizome` is a separate contract that interprets those shared connections through its own anchors, signal, freshness window and threshold. Two communities can therefore disagree about who belongs while reading the same underlying evidence.

---

## Smart Contracts

### `RelationshipRegistry`

The onchain source of truth for Verified Connections. It stores evidence of a signal having qualified between two addresses and **nothing else**: no trust scores, no reputation, no ranking.

```solidity
struct Connection {
    bytes32 signalType;
    uint32  evidenceCount;
    uint64  firstQualifiedAt;
    uint64  lastQualifiedAt;
    bytes32 evidenceRef;
    bool    exists;
}
```

| Function | Access | Description |
|---|---|---|
| `registerConnection(userA, userB, signalType, evidenceCount, firstQualifiedAt, lastQualifiedAt, evidenceRef)` | `onlyRegistrar` | Creates or renews a connection |
| `setRegistrar(newRegistrar)` | `onlyOwner` | Rotates the registrar address |
| `connectionId(userA, userB, signalType)` | public pure | `keccak256(abi.encodePacked(min, max, signalType))` |
| `getConnection(userA, userB, signalType)` | view | Returns the stored `Connection` |
| `isConnectionActive(userA, userB, signalType, freshnessPeriod)` | view | `block.timestamp <= lastQualifiedAt + freshnessPeriod` |
| `getNeighbors(user)` | view | All addresses the user has ever been connected to |

**Behavior worth knowing**

- **Address normalization.** The pair is sorted before hashing, so `(Alice, Bob)` and `(Bob, Alice)` resolve to the same connection.
- **Renewal.** Re-registering an existing pair updates `evidenceCount`, `lastQualifiedAt` and `evidenceRef`. `firstQualifiedAt` only ever moves *earlier*.
- **No duplicate neighbors.** The neighbor list is appended to only when a connection is first created.
- **Signal separation.** Different `signalType` values never collide, even for the same pair.
- **Validation.** Reverts on zero addresses (`ZeroAddress`), self-connections (`SelfConnection`) and `firstQualifiedAt > lastQualifiedAt` (`InvalidTimestamps`).
- **Events.** `ConnectionRegistered` carries the full record so indexers never need to read storage; `RegistrarUpdated` tracks rotation.

### `Rhizome`

One community. Configuration is **immutable** (`registry`, `signalType`, `freshnessPeriod`, `minimumConnections`); only the anchor set and the creator can change.

| Constant / field | Meaning |
|---|---|
| `MAX_BOOTSTRAP_MEMBERS = 3` | Hard cap on anchors |
| `signalType` | The relationship kind this community reads (MVP: `SHARED_GOVERNANCE`) |
| `freshnessPeriod` | Seconds a connection stays active after its last qualifying activity |
| `minimumConnections` | Number of active anchor connections needed (`1 … 3`) |
| `creator` | Bootstrap admin (the factory caller) |

| Function | Access | Description |
|---|---|---|
| `addBootstrapMember(member)` | creator | Adds an anchor (max 3, no duplicates, no zero address) |
| `removeBootstrapMember(member)` | creator | Removes an anchor; swap-and-pop keeps the array compact and frees the slot |
| `transferCreator(newCreator)` | creator | Hands over admin rights |
| `isMember(user)` | view | The derived membership check |
| `getBootstrapMembers()` | view | Current anchors |
| `getConfig()` | view | Registry, name, signal, freshness, threshold, creator |

The constructor reverts with `InvalidConfig` if `minimumConnections` is `0` or greater than 3, or if `freshnessPeriod` is `0`.

### `RhizomeFactory`

Deploys `Rhizome` instances against one shared registry. The caller of `createRhizome(name, signalType, freshnessPeriod, minimumConnections)` automatically becomes the Rhizome's creator. The factory tracks every instance (`getAllRhizomes()`, `allRhizomesLength()`), stores each config, and emits `RhizomeCreated` so indexers can discover new communities with no manual address entry.

### `MemberSpace`

A deliberately trivial contract that exists to prove one point: **membership is an enforceable right, not an analytics label.**

```solidity
function post(bytes32 contentHash) external onlyMember {
    emit PostCreated(msg.sender, contentHash, block.timestamp);
}
```

`onlyMember` calls `rhizome.isMember(msg.sender)` and reverts with `"Not a Rhizome member"` otherwise. A test covers a former member losing access after their connections expire.

### Rio contracts (evidence environment)

| Contract | Role |
|---|---|
| `RioToken` | Plain OpenZeppelin ERC-20 (`RIO`) with owner-gated `mint`, used only as demo fuel. **Rhizome membership never depends on holding it.** |
| `RioGovernance` | Anyone can create a proposal (`title`, `description`, time window). Each address can vote once per proposal (`Against / For / Abstain`). Emits `VoteCast`, the evidence source. Intentionally **not** token-weighted and has no quorum or execution: the voting *activity* is the point, not the outcome. |
| `RioStaking` | Stake/unstake with `SafeERC20` and `ReentrancyGuard`; no yield. A second observable activity source, **not** used by the MVP signal. |

---

## Membership Model

```
isMember(user) =
      user is a bootstrap anchor
   OR  count of anchors a  where  isConnectionActive(user, a, signalType, freshnessPeriod)
       ≥ minimumConnections
```

### Non-recursive by design

The anchor set is **creator-assigned (max 3) and never derived** from `isMember()`. Because of that, membership can never depend on itself: there is no path to *"A qualifies because B qualifies, and B qualifies because A qualifies."* The proof-by-test is `test_CircularMembershipPrevention` in `test/Rhizome.t.sol`.

**Tradeoff (explicit and documented):** only wallets directly connected to anchors can qualify. The graph does not grow transitively past one hop in this MVP. This was chosen as the smallest coherent model that is provably free of circular qualification. See [Status & Roadmap](#status--roadmap) for how it could extend.

### Cost

`isMember()` loops over at most 3 anchors and makes at most 3 registry reads, so the check is cheap enough to run on every interaction (for example inside a modifier).

### Worked example: "Monad Builders"

The seeded demo uses `SHARED_GOVERNANCE`, a 30-day freshness window and `minimumConnections = 2`, with two anchors (`A1`, `A2`).

| Wallet | Connections | `isMember` |
|---|---|---|
| `A1`, `A2` | anchors | ✅ always |
| Alice | active with `A1` and `A2` | ✅ |
| Bob | active with `A1` only | ❌ (needs 2) |
| Carol | active with `A1`, last qualifying vote 31 days ago | ❌ (stale) |
| Alice, 31 days after her last shared vote | connections expired | ❌ lapses automatically |

---

## Freshness Model

There is **no decay job, no cron, and no stored ACTIVE/STALE flag.**

```
isConnectionActive  ≡  block.timestamp ≤ lastQualifiedAt + freshnessPeriod
```

Freshness is a pure derivation from a timestamp, recomputed on every read. This has three consequences:

- **No maintenance.** Nobody has to call anything for a membership to expire.
- **No inconsistency.** There is no window where a flag says "active" but the timestamp says otherwise.
- **Renewal is just new evidence.** When the registrar submits updated evidence, `lastQualifiedAt` moves forward and the connection is active again.

---

## Trust Model

Rhizome draws a deliberate line between **explaining** and **deciding**:

```
Envio explains.  Monad decides.
```

| Layer | Role | Authority |
|---|---|---|
| **Rio** | Produces raw activity | Evidence source only |
| **Envio** `RelationshipPair` | Off-chain, derived, explanatory graph | **Provisional**, never enforceable |
| **Registrar** | Submits derived relationships onchain | The explicit trust boundary |
| **Monad** `VerifiedConnection` | Stored in `RelationshipRegistry` | **Authoritative** and enforceable |

**What the registrar can and cannot do**

- It *can* write or renew connections (and therefore influence who qualifies).
- It *cannot* change a Rhizome's rules, anchors or freshness window, and it cannot write anything except connection evidence.
- The registrar address is rotatable by the registry `owner` via `setRegistrar`.
- By default the deployer is both owner and registrar (see `Deploy.s.sol`).

**What "Verified" means here.** A Verified Connection is the canonical onchain record that a relationship signal has qualified between two addresses. It is verified in the sense that it is registered, stored and enforceable by the protocol. It is **not** independently proven by cryptography or a zero-knowledge proof: the registrar is trusted to derive and submit it faithfully.

This is a **documented MVP boundary, not an oversight.** Every membership decision can be audited back to a stored connection with an `evidenceRef` hash that is reproducible from the indexed evidence (see [The Registrar Bot](#the-registrar-bot)).

---

## The Indexer (Envio)

Located in `indexer/`. Built on **Envio HyperIndex**, indexing Monad Testnet.

### What it indexes

| Contract | Events | Result |
|---|---|---|
| `RioGovernance` | `ProposalCreated`, `VoteCast` | `Proposal`, `Vote`, `ProposalVoters`, and the derived `RelationshipPair` / `SharedProposal` |
| `RioStaking` | `Staked`, `Unstaked` | Raw evidence (`StakePosition`, `StakeEvent`); not a signal source yet |
| `RelationshipRegistry` | `ConnectionRegistered`, `RegistrarUpdated` | `VerifiedConnection` (the enforced onchain state) |
| `RhizomeFactory` | `RhizomeCreated` | `Rhizome` entity plus **dynamic registration** of the new instance |
| `Rhizome` *(dynamic)* | `BootstrapMemberAdded`, `BootstrapMemberRemoved`, `CreatorTransferred` | `BootstrapMember` records |

### Entity model (`schema.graphql`)

| Entity | Purpose |
|---|---|
| `Proposal`, `Vote`, `ProposalVoters` | Mirror of Rio governance activity |
| `RelationshipPair` | **Provisional**: wallet pair with `evidenceCount`, `firstQualifiedAt`, `lastQualifiedAt`, linked to its `VerifiedConnection` once registered |
| `SharedProposal` | The actual proposals both wallets voted on, so the UI can show real titles ("why does Alice qualify?") |
| `VerifiedConnection` | **Authoritative**: mirrors `ConnectionRegistered` |
| `Rhizome`, `BootstrapMember` | Communities and their anchors (with `active` flag and `addedAt`) |
| `StakePosition`, `StakeEvent` | Staking activity |

### How `SHARED_GOVERNANCE` is derived

On each `VoteCast`, the handler records the `Vote`, then pairs the new voter with every earlier voter on the same proposal. For each new pair-and-proposal combination it writes a `SharedProposal` and either creates the `RelationshipPair` (`evidenceCount = 1`) or increments it and moves `lastQualifiedAt` forward. Pair IDs use the lowercase, sorted address order.

### Design notes

- **Address normalization mirrors the contract.** `RelationshipPair.id` is `${lowerAddress}-${higherAddress}`, the same ordering the registry uses, so both views line up for the same two wallets regardless of who voted first.
- **A gap between `RelationshipPair` and `VerifiedConnection` is expected.** A pair can exist (evidence seen) without a matching connection (not yet registered, or the registrar is down). That gap is the trust model working as intended, not a bug.
- **Rhizome instances are discovered automatically** through `indexer.contractRegister` off the factory's `RhizomeCreated` event. No manual address lists.
- **Staking is indexed for completeness**, but the only MVP signal is `SHARED_GOVERNANCE`.

---

## The Registrar Bot

`indexer/registrar/submit.js` (Node + viem) is the off-chain registrar.

**Loop (every `POLL_INTERVAL_MS`):**

1. Query Envio for `RelationshipPair` rows with `evidenceCount >= MIN_EVIDENCE_COUNT`.
2. For each, compare `pair.evidenceCount` with the pair's mirrored `VerifiedConnection.evidenceCount` (or `0` if none).
3. If the indexed count is higher, call `registerConnection(userA, userB, SHARED_GOVERNANCE, evidenceCount, firstQualifiedAt, lastQualifiedAt, evidenceRef)`.

**Reproducible evidence reference.**

```js
evidenceRef = keccak256( sorted(sharedProposalIds).join(",") )
```

Because it is a hash of the sorted proposal IDs behind the connection, anyone can recompute it from the same evidence set. It is not an opaque or random value.

**Configurable threshold.** `MIN_EVIDENCE_COUNT` (default `1`) sets how many shared proposals are required before a pair is submitted. It is an environment setting, not a hardcoded rule.

> The wallet in `PRIVATE_KEY` **must** be the current `RelationshipRegistry.registrar`.

---

## Frontend

Located in `frontend/`. **React 18 + Vite**, **wagmi v2 + viem + RainbowKit** for wallets, **TanStack Query** for data, **React Router v7**.

### Routes

| Route | Page | Purpose |
|---|---|---|
| `/` | Landing | Product story: hero, protocol journey, lifecycle, use cases, developer integration |
| `/app` | Overview | The connected wallet's membership qualification and checklist |
| `/app/network` | Network | Graph of the wallet's connections (and second hop) with status badges |
| `/app/rhizomes` | My Rhizomes | Communities the wallet belongs to or created |
| `/app/rhizomes/:address` | Rhizome detail | Config, anchors, qualification, "why am I a member" |
| `/app/explore` | Explore | Browse all Rhizomes |
| `/app/create` | Create | Calls `RhizomeFactory.createRhizome` and then adds up to three anchors |
| `/app/demo` | Demo | Placeholder for the guided "Alice votes with Bob" walkthrough |

### Notable components

- `NetworkGraph`, `ConnectionsList`: relationship visualization
- `ConnectionBadge`, `ConnectionDetailPanel`: active/stale status and evidence
- `QualificationChecklist`, `WhyAmIAMember`: explain *why* a wallet qualifies or doesn't
- `RhizomeSummaryCard`: community summary
- `ConnectButton`, `RequireWallet`: wallet gating
- `DemoModeBanner`: shown when no indexer is configured

### Demo mode

If `VITE_ENVIO_ENDPOINT` is **unset**, the app runs in **demo mode** against bundled mock data (`lib/envio/mockData.js`), so the UI is fully explorable without a running indexer. Setting the variable switches every query to the live Envio GraphQL API, using the same function names and return shapes.

---

## Live Deployment: Monad Testnet

**Network:** Monad Testnet · **Chain ID:** `10143` · **RPC:** `https://testnet-rpc.monad.xyz`

| Contract | Address |
|---|---|
| `RioToken` | `0x5a9Cb816b188307b6F27C5CA71491BeB96bd48EC` |
| `RioStaking` | `0x3A4ab9f0Ba9f9DAA34d2DF0e7D70a72C54290aED` |
| `RioGovernance` | `0x48D8896D16a7EA7ef71C5e615b1cDb44501AD610` |
| `RelationshipRegistry` | `0xf4F6632872b827e85517904E891F149837953469` |
| `RhizomeFactory` | `0xCafb8e54d7A86a9d37158a5069624Aaac22Eb2BF` |
| Demo `Rhizome` ("Monad Builders") | `0xcC3B99f58681157eec883D2cA98F5541Deb783D4` |
| Demo `MemberSpace` | `0xa937Ed425C0EB1079A06A3056a8E05bFc0F6ABaA` |

The first five come from `contracts/broadcast/Deploy.s.sol/10143/run-latest.json`. The demo Rhizome and MemberSpace addresses are the ones configured in `frontend/src/lib/contracts/addresses.js`.

The indexer is configured with `start_block: 63102860`.

> The contracts are **not upgradeable** and have no proxy layer. A redeploy produces new addresses, which must be updated in the places listed under [Redeploying](#redeploying).

---

## Getting Started

### Prerequisites

- [Foundry](https://getfoundry.sh) (`forge`, `cast`)
- Node.js 18+
- pnpm (indexer) and npm (frontend and registrar)
- A Monad Testnet wallet funded with testnet MON

### 1. Contracts

```bash
cd contracts
# Dependencies are vendored under lib/. If you need to re-fetch them:
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts

forge build
forge test -vv
```

`foundry.toml` pins `solc 0.8.26` with the optimizer on at 200 runs.

**Deploy the full stack** (dependency order: `RioToken → RioStaking → RioGovernance → RelationshipRegistry → RhizomeFactory`):

```bash
cd contracts
cp .env.example .env          # set PRIVATE_KEY and MONAD_RPC_URL

source .env
forge script script/Deploy.s.sol \
  --rpc-url $MONAD_RPC_URL \
  --broadcast
```

`Deploy.s.sol` mints a 1,000,000 RIO initial supply to the deployer and sets the **deployer as both registry owner and registrar**.

**Seed the demo Rhizome** ("Monad Builders", 30-day freshness, 2 minimum connections, 2 anchors):

```bash
# in contracts/.env
# RHIZOME_FACTORY=<factory address from the deploy output>
# ANCHOR_1=<wallet>
# ANCHOR_2=<wallet>

forge script script/SeedDemo.s.sol \
  --rpc-url $MONAD_RPC_URL \
  --broadcast
```

### 2. Indexer

```bash
cd indexer
cp .env.example .env
pnpm install
pnpm codegen
pnpm dev          # local dev console with a link to the Hasura GraphQL playground
```

`pnpm start` (`envio start`) serves the same API in production.

> The contract addresses and `start_block` the indexer actually uses live in **`indexer/config.yaml`**. Update them after any redeploy. `Rhizome` instances need no address; they are discovered from `RhizomeCreated` events.

### 3. Registrar bot

```bash
cd indexer/registrar
cp .env.example .env
npm install
npm start
```

Set `PRIVATE_KEY` to the **current registrar** wallet and `ENVIO_ENDPOINT` to the GraphQL URL from step 2.

### 4. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Set `VITE_ENVIO_ENDPOINT` in `.env.local` to turn demo mode off and use live data. For a production build, run `npm run build` and then `npm run preview`.

### Running the full loop

1. Deploy the contracts and seed a demo Rhizome with two anchors.
2. Start the indexer and the registrar.
3. From the anchor wallets and a test wallet, call `RioGovernance.createProposal(...)` and then `vote(proposalId, support)` from each.
4. Watch the pair appear in Envio, then a `VerifiedConnection` appear after the registrar's next poll.
5. Call `Rhizome.isMember(testWallet)`, or open the app, to see membership flip to `true`.
6. Call `MemberSpace.post(hash)` as the test wallet to confirm the right is enforced.

### Redeploying

After a fresh deploy, update:

| File | What to update |
|---|---|
| `indexer/config.yaml` | Contract addresses and `start_block` |
| `indexer/.env`, `indexer/registrar/.env` | `RELATIONSHIP_REGISTRY_ADDRESS` and the other addresses |
| `frontend/src/lib/contracts/addresses.js` | All contract addresses (including the demo Rhizome and MemberSpace) |

---

## Configuration Reference

| Variable | Where | Purpose |
|---|---|---|
| `PRIVATE_KEY` | `contracts/.env`, `indexer/registrar/.env` | Deployer / registrar key. **Never commit.** |
| `MONAD_RPC_URL` | `contracts/.env`, `indexer/registrar/.env` | Monad RPC (default `https://testnet-rpc.monad.xyz`) |
| `RHIZOME_FACTORY` | `contracts/.env` | Used by `SeedDemo.s.sol` |
| `ANCHOR_1`, `ANCHOR_2` | `contracts/.env` | Demo anchor wallets |
| `RIO_GOVERNANCE_ADDRESS`, `RIO_STAKING_ADDRESS`, `RELATIONSHIP_REGISTRY_ADDRESS`, `RHIZOME_FACTORY_ADDRESS` | `indexer/.env` | Deployed addresses |
| `ENVIO_ENDPOINT` | `indexer/registrar/.env` | Envio GraphQL URL |
| `MIN_EVIDENCE_COUNT` | `indexer/registrar/.env` | Shared proposals required before submitting (default `1`) |
| `POLL_INTERVAL_MS` | `indexer/registrar/.env` | Registrar polling interval (default `60000`) |
| `VITE_ENVIO_ENDPOINT` | `frontend/.env.local` | Envio GraphQL URL; unset means demo mode |
| `VITE_WALLETCONNECT_PROJECT_ID` | `frontend/.env.local` | WalletConnect project ID for RainbowKit |

---

## Testing

The Foundry suite lives in `contracts/test/` across **7 suites** plus a shared `TestBase.sol`:

| Suite | Covers |
|---|---|
| `RelationshipRegistry.t.sol` | Registration, registrar gating and rotation, **address normalization and reversed-order equivalence**, renewal (`firstQualifiedAt` preserved), evidence count and ref updates, duplicate-neighbor prevention, self/zero/invalid-timestamp reverts, freshness active/expired/nonexistent, signal-type isolation |
| `Rhizome.t.sol` | Config validation, creator assignment, anchor add/remove/limit (max 3), **qualification via two active anchor connections**, insufficient and stale connections, membership change on expiry and on anchor removal, **`test_CircularMembershipPrevention`**, creator transfer |
| `RhizomeFactory.t.sol` | Deployment and tracking, config forwarding, creator = caller, event completeness, multiple independent instances, invalid-config reverts |
| `MemberSpace.t.sol` | Member and anchor can post, **non-member cannot**, **former member loses access after expiry**, event emission |
| `RioGovernance.t.sol` | Proposals, For/Against/Abstain, duplicate-vote prevention, voting window enforcement, shared-proposal evidence generation |
| `RioStaking.t.sol` | Stake/unstake, zero-amount and insufficient-balance reverts, `isStaking`, events, wrong-token isolation |
| `RioToken.t.sol` | Supply, metadata, transfers, approvals, owner-only mint |

```bash
cd contracts
forge test            # run everything
forge test -vv        # with logs
forge test --match-contract RhizomeTest
forge test --match-test test_CircularMembershipPrevention -vvv
```

> The suites define roughly **98 test functions** by direct count of the source. The contracts README quotes 84, so run `forge test` to confirm the current number.

---

## Integrating Rhizome in Your Contract

Membership is one view call away. No oracle and no off-chain indexer are needed for enforcement.

```solidity
import {Rhizome} from "./Rhizome.sol";

contract MembersOnlyMint {
    Rhizome public immutable rhizome;

    constructor(address rhizomeAddress) {
        rhizome = Rhizome(rhizomeAddress);
    }

    modifier onlyMember() {
        require(rhizome.isMember(msg.sender), "Not a Rhizome member");
        _;
    }

    function mint() external onlyMember {
        // gate a mint, a vote, a payout, a post, or any right on live membership
    }
}
```

**Reading community configuration**

```solidity
(
    address registry,
    string memory name,
    bytes32 signalType,
    uint64 freshnessPeriod,
    uint16 minimumConnections,
    address creator
) = rhizome.getConfig();
```

**Creating a community from a contract or script**

```solidity
address rhizome = factory.createRhizome(
    "My Community",
    keccak256("SHARED_GOVERNANCE"),
    30 days,
    2
);
// msg.sender is the creator; now add up to 3 anchors:
Rhizome(rhizome).addBootstrapMember(anchor1);
Rhizome(rhizome).addBootstrapMember(anchor2);
```

**Notes for integrators**

- The check is a live read: a wallet that is a member now may not be a member next block if its connections expire.
- Anchors are always members, and removing an anchor immediately changes derived membership for everyone who relied on it.
- The deployed interface is per community: call `isMember(address)` on the specific `Rhizome` contract. There is no global `checkMembership(wallet, rhizomeId)`.

---

## Use Cases

The core pattern: **fresh, evidence-backed relationships to trusted anchors become enforceable rights that expire on their own.** The MVP evidence source is shared governance, but the registry is signal-agnostic (`signalType` is a `bytes32`).

**Governance and fairness**
- Relationship-gated DAO voting: only wallets with live, evidence-backed links to core contributors can vote.
- Airdrops and rewards that favor wallets with recent, evidenced interaction rather than simple holdings.
- Grant committees and reviewer pools whose members must be connected to known reviewers.

**Trust and finance**
- Vouching-based credit, where borrowers need current connections to vouched anchors.
- Permissioned DeFi pools or marketplaces vetted by network position.
- Savings circles (ajo / esusu / chama style) admitting members through existing members.

**Access and anti-spam**
- Posting rights in social apps and group chats gated on relationships to existing members.
- Event, conference and alumni communities whose access tracks actual participation.
- Gaming guilds where membership reflects who actually plays.

**Infrastructure**
- Operator, keeper and oracle sets that need fresh relationship evidence to stay eligible.
- Mentor and cohort networks where "active" means the relationship is active.

New signals (payments, commits, co-membership, attendance, repeated trades) can be added by choosing a new `signalType` and teaching the indexer and registrar to derive it.

---

## Design Decisions & Tradeoffs

| Decision | Why | Cost |
|---|---|---|
| **Derived membership, no stored flag** | Expiry is automatic and can never be inconsistent | Every check pays for up to 3 registry reads |
| **Non-recursive, anchor-based qualification** | Provably removes circular qualification | Membership doesn't spread past one hop from the anchors |
| **Anchors capped at 3** | Bounds gas and keeps `isMember()` O(3) | Small bootstrap set per community |
| **Immutable Rhizome config** | Rules can't change under members' feet | A rule change means deploying a new Rhizome |
| **Shared registry, per-Rhizome interpretation** | One evidence base, many community rules | Connections are global to a signal, not scoped per community |
| **Registrar-gated writes** | Keeps evidence derivation off-chain and cheap | A trust assumption (documented, rotatable) |
| **Registry stores evidence only** | No scoring, ranking or reputation to dispute | Consumers must define their own thresholds |
| **Rio is an evidence source, not a gate** | Membership never depends on holding RIO | The demo environment isn't an economic system |
| **Non-token-weighted governance** | Activity is the evidence, not outcomes or wealth | The signal is cheap to generate (see limitations) |

---

## Known Limitations

Being explicit about what the MVP does **not** do:

- **Registrar trust.** Whoever controls the registrar key can add or renew connections. There is no decentralized, multisig or proof-based submission yet.
- **One-hop membership.** Only wallets with direct active connections to anchors can qualify.
- **The current signal is cheap to generate.** `RioGovernance` lets anyone create proposals and vote for free, so wallets can produce `SHARED_GOVERNANCE` evidence at will, including across multiple wallets. The anchor requirement limits who can qualify, but Rhizome does not claim to be an anti-Sybil system. Stronger signals (costly, social or independently verified evidence) are a roadmap item.
- **Evidence only moves forward.** The registrar submits when indexed `evidenceCount` rises. There is no onchain revocation; connections end only by going stale.
- **Single signal.** `SHARED_GOVERNANCE` is the only implemented relationship signal. Staking is indexed but unused.
- **No admin override on connections.** The registry owner can rotate the registrar but cannot delete or edit individual connections.
- **Testnet only.** No audit has been performed; do not use with real value.
- **Polling registrar.** The bot polls Envio rather than reacting to updates in real time.

---

## Status & Roadmap

**Working today**
- Full contract suite deployed on Monad Testnet, with tests.
- Envio indexer covering Rio evidence, verified connections, dynamic Rhizome discovery and anchor changes.
- Registrar bot deriving `SHARED_GOVERNANCE` connections.
- Frontend with wallet connect, overview, network graph, Rhizome browsing and detail, and Rhizome creation.

**Known rough edges**
- The **Demo** page is currently a placeholder ("Coming next") for the guided Alice-and-Bob walkthrough.
- `OverviewPage.jsx` still reads `MOCK_RHIZOME` for its qualification query instead of `CONTRACT_ADDRESSES.DEMO_RHIZOME`.
- `MemberSpace` isn't indexed (the factory doesn't deploy it, so there is no discovery event).
- The landing page's developer section shows an illustrative `IRhizome` interface (`checkMembership(wallet, rhizomeId)`) that differs from the deployed per-community `isMember(address)` API.
- `getConnectionEvidence` takes `(selfAddress, peerAddress)` but has no call sites in `app/` yet.

**Possible next steps**
- Additional evidence sources and signals alongside `SHARED_GOVERNANCE`: social-graph activity (for example Farcaster), payments, co-membership, attendance. None of these are implemented yet.
- Multi-hop or weighted qualification, with a cycle-safe design.
- Decentralized or multi-party registrars, and proof-carrying submissions.
- An event-driven registrar instead of polling.
- Onchain revocation and dispute paths.
- Index `MemberSpace` instances and add a guided live demo.
- A security audit and mainnet-readiness review.

---

## Tech Stack

| Layer | Stack |
|---|---|
| Smart contracts | Solidity `0.8.26` · Foundry · OpenZeppelin Contracts (`Ownable`, `ERC20`, `ReentrancyGuard`, `SafeERC20`) |
| Chain | Monad Testnet (`10143`) |
| Indexing | Envio HyperIndex `3.12.0` · GraphQL (Hasura) |
| Registrar | Node.js · viem |
| Frontend | React 18 · Vite 5 · React Router 7 · wagmi v2 · viem · RainbowKit · TanStack Query |

---

## Team

| Name | Role | Links |
|---|---|---|
| **Samuel Egin** | Full-stack blockchain developer | [@0xEtherfren on X](https://x.com/0xEtherfren) |

---

## License

Released under the [MIT License](./LICENSE).
