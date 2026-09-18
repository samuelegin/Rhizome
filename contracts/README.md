# Rhizome

> Communities that form from relationships, not memberships.

Smart-contract + protocol layer for the Rhizome hackathon project (Monad Metropolis).
Built with [Foundry](https://getfoundry.sh).

## Setup

```bash
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge build
forge test
```

If you already have Foundry + `svm` able to reach `binaries.soliditylang.org`,
`forge build` will fetch `solc 0.8.26` automatically (pinned in `foundry.toml`).

## Architecture

```
RIO (evidence source)                RHIZOME (protocol)
------------------------             ------------------------
RioToken.sol      (ERC20)
RioGovernance.sol (proposals/votes)  RelationshipRegistry.sol  <- Verified Connections
RioStaking.sol    (stake/unstake)    Rhizome.sol               <- derived membership
                                      RhizomeFactory.sol        <- deploys Rhizomes
                                      MemberSpace.sol           <- onlyMember right
```

Flow: `Rio events -> Envio (off-chain) -> registrar -> RelationshipRegistry
-> Rhizome.isMember() -> MemberSpace.post()`.

**Trust boundary:** Envio derives relationship signals off-chain; an
authorized `registrar` address submits them to `RelationshipRegistry`.
Monad (the registry/Rhizome contracts) is the source of truth for
enforceable state — Envio is never treated as final authority. This is a
deliberate, documented MVP boundary, not an oversight.

## Key design decision: non-recursive membership

`Rhizome.isMember(user)` is `true` iff `user` is a bootstrap anchor, **or**
`user` has `>= minimumConnections` currently-active Verified Connections
directly to bootstrap anchors (capped at 3, creator-assigned, never derived
themselves). Because the anchor set can never depend on `isMember()`, there
is no path to circular qualification (`A qualifies because B qualifies`).

Tradeoff: only bootstrap-adjacent wallets can qualify in this MVP — the
graph doesn't transitively grow past one hop from the anchors. That's the
explicit smallest-coherent-MVP choice; see `src/rhizome/Rhizome.sol` for the
full writeup and `test/Rhizome.t.sol::test_CircularMembershipPrevention` for
the proof-by-test.

## Freshness

No decay, no cron, no stored ACTIVE/STALE flag. `isConnectionActive` is a
pure derivation: `block.timestamp <= lastQualifiedAt + freshnessPeriod`.
Membership is recomputed on every `isMember()` read.

## Contracts

| Contract | Purpose |
|---|---|
| `RioToken.sol` | Plain OZ ERC20, demo fuel only |
| `RioGovernance.sol` | Proposals + one-vote-per-address voting; emits `VoteCast` (the evidence source) |
| `RioStaking.sol` | Stake/unstake, no yield — a second observable activity source |
| `RelationshipRegistry.sol` | Stores Verified Connections; registrar-gated writes; normalized, undirected connection IDs |
| `Rhizome.sol` | One community: config + bootstrap anchors + derived `isMember()` |
| `RhizomeFactory.sol` | Deploys `Rhizome` instances against a shared registry |
| `MemberSpace.sol` | `onlyMember` gated `post()` — proves membership is an enforceable right |

## Tests

84 Foundry tests across 7 suites, covering registration, address
normalization/reversed-order equivalence, renewal, duplicate-neighbor
prevention, freshness expiry, bootstrap limits, derived/circular-safe
membership, factory deployment, `MemberSpace` access control, and Rio
governance/staking/token behavior. Run with `forge test -vv`.