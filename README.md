<p align="center">
  <img src="frontend/public/logo.png" alt="Rhizome" width="360" />
</p>

<h3 align="center">Membership built from relationships, not ownership.</h3>

<p align="center">
  A programmable onchain membership protocol for communities whose boundaries are defined by relationships.
</p>

<p align="center">
  <b>Live on Monad Testnet</b> · Built for Monad Metropolis · Social / Culture
</p>

---

# Rhizome

Most onchain communities decide membership through **ownership or assignment**:

- Hold this token.
- Own this NFT.
- Complete this quest.
- Be on this allowlist.
- Have this credential.

Rhizome explores a different primitive:

> **What if belonging could be derived from relationships?**

Rhizome lets a community define **which relationships qualify**, **how many qualifying connections are required**, and **how fresh those relationships must be**.

The resulting membership is evaluated onchain and exposed through a simple contract primitive:

```solidity
rhizome.isMember(user)
```

Any smart contract can use that result to gate rights such as posting, voting, minting, claiming, participating, or accessing a community.

> **Relationships become state.
> Membership becomes policy.
> Rights become enforceable.**

---

# The idea in 30 seconds

Imagine a community whose membership rule is:

```text
You need at least 2 active relationships
with the community's existing members.
```

Instead of maintaining:

```solidity
members[user] = true;
```

Rhizome evaluates the user's current relationship state.

```text
Relationship evidence
        ↓
Relationship signal
        ↓
Registered connection
        ↓
Membership policy
        ↓
isMember(user)
        ↓
Contract-enforced access
```

If the relationships remain active, membership remains valid.

If they become stale, membership naturally stops qualifying.

No manual removal is required.

---

# Why Rhizome?

Traditional onchain membership usually asks:

> **What does this wallet own?**

or:

> **Was this wallet approved?**

Rhizome asks:

> **Does this wallet currently have the relationships required by this community?**

That distinction matters.

A token can be bought.

An NFT can be transferred.

An allowlist can become stale.

A permanent role can survive long after the activity that justified it.

Rhizome instead treats membership as a **live predicate over relationships**.

```text
Relationship state
       ↓
Membership policy
       ↓
isMember(user)
       ↓
Onchain rights
```

---

# What makes Rhizome different?

| Model            | Membership comes from             |
| ---------------- | --------------------------------- |
| Allowlist        | Admin assignment                  |
| NFT / Token Gate | Asset ownership                   |
| Reputation       | Individual score                  |
| Social Graph     | Relationship data                 |
| **Rhizome**      | **Configured live relationships** |

Rhizome is **not another reputation score**.

Reputation describes an individual.

Rhizome evaluates **relationships between participants**.

A wallet does not qualify because it has an arbitrary "85/100" reputation.

It qualifies because it has the relationships that a particular community requires.

---

# The core primitive

Rhizome separates three things that are normally coupled:

### 1. Relationship state

The `RelationshipRegistry` records qualifying relationship signals between wallets.

It answers:

> **What qualifying relationships exist?**

### 2. Membership policy

A `Rhizome` defines how those relationships become membership.

It answers:

> **Given this community's rules, does this wallet qualify?**

### 3. Rights

Other contracts consume the membership result.

They answer:

> **What can this member do?**

```text
                 RELATIONSHIP STATE
                         │
                         ▼
              RelationshipRegistry
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
      Rhizome A       Rhizome B      Rhizome C
      1 connection    2 connections  3 connections
      7 days          30 days        90 days
          │              │              │
          ▼              ▼              ▼
      isMember()      isMember()     isMember()
          │              │              │
          ▼              ▼              ▼
        Rights         Rights         Rights
```

The same relationship can therefore be interpreted differently by different communities.

---

# The MVP

The current Rhizome MVP uses **governance participation** as its relationship signal.

We built a small governance environment called **Rio**.

When two wallets participate in the same governance proposal, the Envio indexer derives:

```text
SHARED_GOVERNANCE
```

relationship signals between them.

For example:

```text
Proposal #42

Alice  ✓
Bob    ✓
Carol  ✓
```

This produces relationship signals such as:

```text
Alice ↔ Bob
Alice ↔ Carol
Bob   ↔ Carol
```

The registrar submits qualifying relationships to the onchain `RelationshipRegistry`.

Rhizome then evaluates those relationships against a community's membership policy.

```text
Rio Governance
      ↓
     Envio
      ↓
SHARED_GOVERNANCE
      ↓
   Registrar
      ↓
RelationshipRegistry
      ↓
    Rhizome
      ↓
  isMember(user)
      ↓
  MemberSpace
```

The important part is that Rhizome **does not need to know how the relationship was originally discovered**.

It consumes a relationship signal and turns it into programmable membership.

---

# A Rhizome is a membership policy

Each Rhizome defines rules such as:

### Relationship signal

What kind of relationship qualifies?

```text
SHARED_GOVERNANCE
```

### Freshness

How recently must the relationship have been active?

```text
30 days
```

### Minimum connections

How many qualifying relationships are required?

```text
2
```

### Anchors

Which members establish the initial boundary of the community?

A Rhizome currently supports up to **3 anchors**.

For example:

```text
Community: Monad Builders

Signal:              SHARED_GOVERNANCE
Freshness:           30 days
Minimum connections: 2
Anchors:             Alice, Bob
```

If Carol has active qualifying relationships with both Alice and Bob:

```text
Carol → Alice   ✓
Carol → Bob     ✓
```

then:

```text
Carol = MEMBER
```

If those relationships become stale:

```text
Carol → Alice   expired
Carol → Bob     expired
```

then:

```text
Carol = NOT MEMBER
```

No removal transaction is required.

---

# The membership rule

Conceptually, a Rhizome evaluates:

```text
user is an anchor

OR

number of active qualifying connections
to the Rhizome's anchors
>= minimumConnections
```

For example:

```text
Monad Builders

Freshness: 30 days
Minimum connections: 2
Anchors: Alice, Bob
```

Carol:

```text
Carol → Alice  ✓
Carol → Bob    ✓

2 active connections

Carol = MEMBER
```

Dave:

```text
Dave → Alice   ✓
Dave → Bob     ✗

1 active connection

Dave = NOT MEMBER
```

If Carol's relationships become stale:

```text
Carol → Alice  expired
Carol → Bob    expired

0 active connections

Carol = NOT MEMBER
```

Membership therefore changes naturally with relationship state.

---

# Why anchors?

Anchors establish the initial boundary of a Rhizome without requiring recursive graph traversal.

Rather than traversing:

```text
Alice → Bob → Carol → Dave → Eve
```

Rhizome currently evaluates direct connections to a bounded set of anchors:

```text
             Anchor A
                │
                │
User ───────────┤
                │
                │
             Anchor B
```

This keeps membership evaluation predictable and bounded.

The current MVP limits each Rhizome to **three anchors** and uses one-hop relationships.

This is an intentional protocol tradeoff.

Future versions can explore:

* multi-hop relationships
* weighted connections
* larger anchor sets
* threshold structures
* multiple relationship types

---

# Relationship state vs membership policy

This separation is central to Rhizome.

The `RelationshipRegistry` does not decide whether someone belongs to a community.

It stores relationship signals.

A Rhizome interprets those signals.

For example:

```text
Alice ↔ Bob
```

could exist in the shared registry.

Community A might require:

```text
1 active connection
7-day freshness
```

while Community B might require:

```text
2 active connections
30-day freshness
```

The relationship is shared.

The membership policy is not.

This allows a common relationship layer to support many different communities.

---

# Evidence is not the same as truth

Rhizome intentionally separates **evidence**, **relationship signals**, and **membership**.

For the MVP:

```text
Rio governance activity
        ↓
observable evidence
        ↓
SHARED_GOVERNANCE signal
        ↓
registered connection
        ↓
Rhizome membership
```

Voting on the same proposal does not objectively prove friendship, trust, or belonging.

It is simply the relationship signal chosen for this MVP.

This distinction allows Rhizome to remain **signal-agnostic**.

Different applications can define different ways of deriving meaningful relationship signals.

---

# Trust model

The current implementation does **not** claim trustless relationship verification.

The trust boundary is explicit:

```text
Rio
 ↓
observable activity

Envio
 ↓
derives relationship signals

Registrar
 ↓
submits qualifying relationship claims

Monad
 ↓
stores the registered relationship

Rhizome
 ↓
deterministically evaluates membership

Consumer contract
 ↓
enforces rights
```

The registrar is therefore a trusted component in the current MVP.

A malicious registrar could submit an incorrect relationship.

However, once a relationship is registered:

* the relationship state is onchain
* membership calculation is deterministic
* freshness is evaluated onchain
* membership rules cannot be silently changed
* consuming contracts do not need an offchain membership lookup

Future versions can reduce this trust assumption through:

* decentralized registrars
* multiparty verification
* event-driven registration
* dispute mechanisms
* stronger evidence verification

### Important terminology

"Verified" in Rhizome means that a relationship signal has been accepted and registered by the configured verification authority.

It does **not** mean that the relationship has been cryptographically proven.

---

# The MVP: Rio Governance

The current MVP uses a small governance environment called **Rio** to produce relationship evidence.

Rio allows wallets to participate in governance proposals.

When multiple wallets vote on the same proposal, the Envio indexer derives a:

```text
SHARED_GOVERNANCE
```

relationship signal between them.

For example:

```text
Proposal #42

Alice ── voted
Bob   ── voted
Carol ── voted
```

The indexer can derive:

```text
Alice ↔ Bob
Alice ↔ Carol
Bob   ↔ Carol
```

The registrar can then register qualifying connections in the shared `RelationshipRegistry`.

Rhizome does not need to understand how Rio produced the evidence.

It only consumes the resulting relationship signal.

---

# Architecture

```text
                         ┌─────────────────┐
                         │      Rio        │
                         │   Governance    │
                         └────────┬────────┘
                                  │
                              Vote events
                                  │
                                  ▼
                         ┌─────────────────┐
                         │     Envio       │
                         │  Relationship   │
                         │    Indexer      │
                         └────────┬────────┘
                                  │
                         relationship signal
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    Registrar    │
                         └────────┬────────┘
                                  │
                         registerConnection()
                                  │
                                  ▼
                  ┌─────────────────────────────┐
                  │   RelationshipRegistry      │
                  │                             │
                  │  shared relationship state  │
                  └─────────────┬───────────────┘
                                │
                  ┌─────────────┼─────────────┐
                  │             │             │
                  ▼             ▼             ▼
             Rhizome A      Rhizome B      Rhizome C
                  │             │             │
                  └─────────────┼─────────────┘
                                │
                           isMember()
                                │
                                ▼
                       ┌─────────────────┐
                       │ Consumer Apps   │
                       │ / Contracts     │
                       └─────────────────┘
```

---

# RelationshipRegistry

`RelationshipRegistry` is the shared onchain store for relationship signals.

It stores relationship information such as:

```text
signal type
evidence count
first qualified time
last qualified time
evidence reference
existence
```

Connections are identified by:

```text
wallet A
wallet B
signal type
```

Wallet pairs are normalized so that:

```text
Alice ↔ Bob
```

and:

```text
Bob ↔ Alice
```

refer to the same relationship.

The registry is responsible for storing relationship state.

It does not determine community membership.

---

# Rhizome

A `Rhizome` is a membership policy built on top of the shared registry.

Its configuration includes:

```text
registry
signalType
freshnessPeriod
minimumConnections
anchors
```

The configuration is immutable after deployment.

This means the rules defining a particular Rhizome cannot silently change after users begin participating.

A new policy can instead be deployed as another Rhizome.

---

# `isMember()`

The core interface is intentionally small:

```solidity
function isMember(address user) external view returns (bool);
```

A consuming contract can simply do:

```solidity
modifier onlyMember() {
    require(
        rhizome.isMember(msg.sender),
        "Not a member"
    );
    _;
}
```

This means the same membership primitive can be used to gate:

```text
posting
voting
minting
claims
payouts
events
governance
permissions
```

Rhizome does not need to know what the right is.

It only determines whether the caller satisfies the community's membership rule.

---

# MemberSpace

`MemberSpace` is a minimal demonstration of contract-level enforcement.

Its `post()` function is restricted to Rhizome members.

```text
Wallet
  ↓
isMember()
  ↓
true  → post succeeds
false → transaction reverts
```

MemberSpace is not intended to be the product itself.

It demonstrates that a relationship-derived membership decision can become a real smart-contract permission.

---

# Envio

Envio provides the indexing and relationship-derivation layer for the MVP.

It indexes:

* Rio governance events
* Rio staking
* RelationshipRegistry events
* RhizomeFactory events
* Rhizome instances

For the `SHARED_GOVERNANCE` signal, governance participants can be compared based on their participation in the same proposal.

The resulting relationship is provisional until the registrar registers it onchain.

This creates a clear distinction:

```text
Envio RelationshipPair
        ↓
provisional / explanatory state

RelationshipRegistry
        ↓
authoritative onchain state
```

---

# Registrar

The registrar connects indexed relationship evidence to the onchain registry.

The current registrar:

1. queries relationship pairs from Envio
2. checks whether the indexed evidence meets the configured threshold
3. compares the relationship against registered onchain state
4. submits new or updated connections
5. records an `evidenceRef`

The current implementation uses a polling model.

Future versions can move toward event-driven registration or decentralized verification.

---

# Evidence references

Registered connections contain an `evidenceRef`.

For the MVP, the registrar derives this reference from the relevant shared proposal IDs.

This allows a registered relationship to be traced back to the evidence that the registrar used when submitting it.

The reference is an audit trail.

It is not itself a cryptographic proof that the underlying social interpretation is correct.

---

# Why onchain?

A backend can calculate:

```text
user → member
```

But the application must then trust the backend's answer.

Rhizome moves the membership predicate into a contract:

```text
relationship state
       ↓
onchain membership policy
       ↓
isMember(user)
       ↓
contract enforcement
```

The important property is **composability**.

A community's membership rule can be consumed by another smart contract without that contract depending on a private database or offchain membership API.

---

# Why Monad?

Rhizome intentionally favors **live membership evaluation** instead of maintaining cached membership flags.

A membership check may need to inspect the user's qualifying relationships and determine whether they are still fresh.

The MVP keeps that evaluation bounded:

* maximum 3 anchors
* direct one-hop relationships
* bounded registry reads
* no recursive graph traversal

Monad is the execution environment for the current MVP.

The goal is to make fresh relationship-derived membership practical without turning every membership check into an unbounded graph traversal.

---

# Social / Culture

Rhizome is built around a simple idea:

> **What if an onchain community could define belonging through relationships rather than ownership?**

Social participation naturally produces relationships:

```text
people who collaborate
people who govern together
people who attend together
people who transact together
people who contribute together
people who repeatedly interact
```

Rhizome turns those relationship signals into programmable membership.

The social graph becomes an input.

The membership policy becomes programmable.

The resulting right becomes enforceable.

---

# Example applications

### Relationship-based governance

Require a wallet to have active relationships with existing governance participants before voting.

### Community access

Allow posting or participation only while a wallet maintains the relationships required by the community.

### Contributor communities

Membership can depend on relationships created through shared contributions or projects.

### Cohorts and groups

A cohort can define membership through shared participation rather than a permanent role assignment.

### Events

Attendance or repeated participation can produce relationship signals that determine access to future events.

### Rewards

A reward contract can require active membership instead of a static allowlist.

### Permissioned applications

Any contract can use `isMember()` as a composable access-control primitive.

---

# What Rhizome does not solve

Rhizome does not claim to solve every problem around identity or social trust.

The current implementation does **not** provide:

* universal Sybil resistance
* cryptographically proven social relationships
* decentralized relationship verification
* multi-hop membership
* arbitrary graph traversal
* multiple production relationship signals
* onchain dispute resolution
* mainnet deployment
* audited contracts

The MVP deliberately focuses on one primitive:

> **Turn a configured relationship signal into live, enforceable membership.**

---

# Current limitations

## Registrar trust

The current relationship-registration process relies on a configured registrar.

This is the largest trust assumption in the MVP.

## One-hop membership

Membership currently evaluates direct relationships to a maximum of three anchors.

## Signal generation

The MVP's governance activity is relatively easy to generate and is not intended to be a production-grade Sybil-resistant identity system.

## Single implemented signal

`SHARED_GOVERNANCE` is the current relationship signal.

The architecture is designed to support additional signal types.

## Polling

The current registrar polls indexed state rather than using a fully event-driven pipeline.

## Testnet

The current deployment is on Monad Testnet and has not undergone a production security audit.

---

# Protocol design tradeoffs

Rhizome intentionally chooses:

### Derived membership over stored membership

**Benefit:** no stale membership flags.

**Tradeoff:** membership requires evaluating relationship state.

### One-hop relationships over recursive traversal

**Benefit:** predictable execution.

**Tradeoff:** less expressive graph policies.

### Immutable Rhizome rules

**Benefit:** predictable community policy.

**Tradeoff:** changing the policy requires deploying a new Rhizome.

### Shared registry

**Benefit:** relationship state can be reused across communities.

**Tradeoff:** registry design and signal isolation become important protocol concerns.

### Registrar-based verification

**Benefit:** practical MVP implementation.

**Tradeoff:** relationship registration is not fully trustless.

---

# Current deployment

Rhizome is deployed on **Monad Testnet**.

**Chain ID:** `10143`

### Contracts

| Contract             | Address                                      |
| -------------------- | -------------------------------------------- |
| RioToken             | `0x5a9Cb816b188307b6F27C5CA71491BeB96bd48EC` |
| RioStaking           | `0x3A4ab9f0Ba9f9DAA34d2DF0e7D70a72C54290aED` |
| RioGovernance        | `0x48D8896D16a7EA7ef71C5e615b1cDb44501AD610` |
| RelationshipRegistry | `0xf4F6632872b827e85517904E891F149837953469` |
| RhizomeFactory       | `0xCafb8e54d7A86a9d37158a5069624Aaac22Eb2BF` |
| Demo Rhizome         | `0xcC3B99f58681157eec883D2cA98F5541Deb783D4` |
| Demo MemberSpace     | `0xa937Ed425C0EB1079A06A3056a8E05bFc0F6ABaA` |

The Envio indexer starts from block:

```text
63102860
```

Contracts are not upgradeable.

---

# Repository structure

```text
contracts/
├── RelationshipRegistry.sol
├── Rhizome.sol
├── RhizomeFactory.sol
├── MemberSpace.sol
├── RioToken.sol
├── RioGovernance.sol
└── RioStaking.sol

indexer/
├── Envio HyperIndex
├── relationship derivation
├── registrar
└── GraphQL / Hasura

frontend/
├── landing
├── overview
├── network
├── rhizomes
├── explore
├── create
└── demo
```

---

# Testing

The protocol includes tests covering:

* connection normalization
* reversed pair ordering
* freshness
* relationship renewal
* registrar authorization
* duplicate neighbors
* signal isolation
* Rhizome configuration
* anchor management
* membership evaluation
* circular membership prevention
* MemberSpace enforcement
* membership expiry
* Rio governance
* Rio staking
* Rio token behavior

The test suite focuses on the protocol's core invariants rather than only testing frontend behavior.

---

# Getting started

Rhizome has four parts. You only need the ones relevant to what you are doing:

| I want to...                          | Set up              |
| ------------------------------------- | ------------------- |
| Try the app against the live testnet  | Frontend            |
| Build on or test the contracts        | Contracts           |
| Run the indexer and registrar locally | Indexer + Registrar |

## Prerequisites

| Tool                | Needed for              |
| ------------------- | ----------------------- |
| Node.js 20+ and npm | Frontend, registrar     |
| pnpm                | Indexer                 |
| Foundry             | Contracts               |
| Docker              | Running Envio locally   |
| Monad Testnet MON   | Deploying / registering |

Install Foundry:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

---

# Clone

```bash
git clone https://github.com/<your-username>/Rhizome.git
cd Rhizome
```

If the `contracts/lib` folder is empty after cloning:

```bash
git submodule update --init --recursive
```

---

# 1. Contracts

```bash
cd contracts

forge install
forge build
forge test
```

`forge build` uses the pinned Solidity `0.8.26`.

To deploy your own copy to Monad Testnet:

```bash
cp .env.example .env
```

Fill in the required environment variables, then:

```bash
source .env

forge script script/Deploy.s.sol \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast
```

Never commit a `.env` file containing a private key.

---

# 2. Indexer and Registrar

Skip this section if you are using the deployed testnet contracts and existing indexer.

## Envio HyperIndex

```bash
cd indexer

cp .env.example .env

pnpm install
pnpm codegen
pnpm dev
```

Once the indexer is running, note the GraphQL endpoint.

The frontend and registrar use this endpoint.

## Registrar bot

```bash
cd indexer/registrar

cp .env.example .env

npm install
npm start
```

The registrar requires:

```text
ENVIO_ENDPOINT
RELATIONSHIP_REGISTRY_ADDRESS
PRIVATE_KEY
```

`PRIVATE_KEY` must belong to the address currently configured as the `RelationshipRegistry` registrar.

See [`indexer/README.md`](indexer/README.md) for additional details.

---

# 3. Frontend

```bash
cd frontend

cp .env.example .env.local

npm install
npm run dev
```

Then open the URL printed by Vite, usually:

```text
http://localhost:5173
```

### Environment variables

| Variable                        | Purpose                          |
| ------------------------------- | -------------------------------- |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID         |
| `VITE_ENVIO_ENDPOINT`           | GraphQL URL of the Envio indexer |

If `VITE_ENVIO_ENDPOINT` is empty, the application can run in demo mode with mock data.

Production build:

```bash
npm run build
npm run preview
```

The frontend is configured for Vercel deployment.

---

# 4. Monad Testnet

Add Monad Testnet to your wallet:

| Setting         | Value                           |
| --------------- | ------------------------------- |
| Network name    | Monad Testnet                   |
| RPC URL         | `https://testnet-rpc.monad.xyz` |
| Chain ID        | `10143`                         |
| Currency symbol | `MON`                           |

---

# Integration

Any smart contract can consume a Rhizome.

Example:

```solidity
interface IRhizome {
    function isMember(address user)
        external
        view
        returns (bool);
}

contract CommunityApp {
    IRhizome public rhizome;

    modifier onlyMember() {
        require(
            rhizome.isMember(msg.sender),
            "Not a member"
        );
        _;
    }

    function performMemberAction()
        external
        onlyMember
    {
        // member-only action
    }
}
```

The consuming application does not need to understand:

* Envio
* Rio
* the registrar
* relationship derivation
* evidence sources

It only needs the membership interface.

This is what makes Rhizome a **protocol primitive rather than a single social application**.

---

# Future relationship signals

The MVP uses governance participation.

The broader protocol can support signals derived from:

```text
Farcaster interactions
Payments
Shared communities
Events / attendance
Contributions
Collaborative projects
Repeated trading
Onchain coordination
```

The important abstraction is that Rhizome does not need to know the original source of the evidence.

It consumes a typed relationship signal.

---

# Roadmap

## 1. More relationship signals

Expand beyond governance activity into:

* social interactions
* payments
* contributions
* attendance
* shared communities

## 2. Richer membership policies

Explore:

* weighted relationships
* multi-hop relationships
* larger graph structures
* multiple signal types
* more expressive thresholds

## 3. Stronger verification

Reduce registrar trust through:

* multiparty registrars
* decentralized derivation
* dispute mechanisms
* revocation paths
* event-driven verification

## 4. Production readiness

* security review
* contract audit
* stronger indexing infrastructure
* production relationship sources
* mainnet deployment

---

# Design philosophy

Rhizome is built around three separations:

### Evidence is not membership.

Observable activity is an input.

### Membership is not ownership.

A wallet can qualify because of relationships rather than assets.

### Membership is not a database flag.

It is a live contract predicate.

Together:

```text
Evidence
   ↓
Relationship
   ↓
Membership policy
   ↓
Rights
```

---

# The protocol in one example

Imagine a community with:

```text
Signal: SHARED_GOVERNANCE
Anchors: Alice, Bob
Freshness: 30 days
Minimum connections: 2
```

Carol votes on the same proposals as Alice and Bob.

The system derives:

```text
Carol ↔ Alice
Carol ↔ Bob
```

The registrar registers those connections.

Rhizome evaluates:

```text
Carol
 ├── Alice ✓ active
 └── Bob   ✓ active

2 >= minimumConnections

Carol = MEMBER
```

A separate contract can then enforce:

```solidity
require(rhizome.isMember(carol));
```

Thirty days pass without qualifying activity.

The relationships become stale:

```text
Carol
 ├── Alice ✗ expired
 └── Bob   ✗ expired
```

Without an admin transaction:

```text
isMember(Carol) == false
```

The community's definition of belonging has therefore become a **live, enforceable protocol rule**.

---

# Why this matters

The interesting part of an onchain social system is not simply putting profiles, posts, or communities on a blockchain.

It is giving social relationships **programmable consequences**.

Rhizome explores a different model of onchain community:

```text
Not:

Ownership → Membership

Not:

Admin → Membership

Not:

Score → Membership

But:

Relationship → Membership → Rights
```

That is the primitive Rhizome is building.

---

# Team

**Samuel Egin**
Full-stack blockchain developer

X: `@0xEtherfren`

---

# License

MIT
