import { isActive, daysUntilStale } from '../formatters'
import { CONTRACT_ADDRESSES, isDeployed } from '../contracts/addresses'
import { SIGNAL_LABELS } from '../contracts/config'
import { MOCK_ADDRESSES, MOCK_CONNECTIONS, MOCK_SECOND_HOP, MOCK_RHIZOME } from './mockData'

export const ENVIO_ENDPOINT = import.meta.env.VITE_ENVIO_ENDPOINT || null
export const DEMO_MODE = !ENVIO_ENDPOINT

const DEFAULT_FRESHNESS_SECONDS = 30 * 86400

async function query(document, variables) {
  const response = await fetch(ENVIO_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: document, variables }),
  })
  const { data, errors } = await response.json()
  if (errors) {
    throw new Error(errors.map((e) => e.message).join('; '))
  }
  return data
}

function withStatus(connection) {
  const active = isActive(connection.lastQualifiedAt, connection.freshnessPeriodSeconds)
  return {
    ...connection,
    status: active ? 'active' : 'stale',
    daysUntilStale: daysUntilStale(connection.lastQualifiedAt, connection.freshnessPeriodSeconds),
  }
}

let cachedFreshnessSeconds = null

async function getDefaultFreshnessSeconds() {
  if (cachedFreshnessSeconds !== null) {
    return cachedFreshnessSeconds
  }
  if (!isDeployed(CONTRACT_ADDRESSES.DEMO_RHIZOME)) {
    cachedFreshnessSeconds = DEFAULT_FRESHNESS_SECONDS
    return cachedFreshnessSeconds
  }
  const data = await query('query($id: String!) { Rhizome_by_pk(id: $id) { freshnessPeriod } }', {
    id: CONTRACT_ADDRESSES.DEMO_RHIZOME,
  })
  cachedFreshnessSeconds = data.Rhizome_by_pk
    ? Number(data.Rhizome_by_pk.freshnessPeriod)
    : DEFAULT_FRESHNESS_SECONDS
  return cachedFreshnessSeconds
}

export async function getNetwork(address) {
  if (DEMO_MODE) {
    return {
      center: address,
      connections: MOCK_CONNECTIONS.map(withStatus),
      secondHop: MOCK_SECOND_HOP.map(withStatus),
    }
  }

  const lower = address.toLowerCase()
  const freshnessPeriodSeconds = await getDefaultFreshnessSeconds()

  const pairsData = await query(
    `query($address: String!) {
      RelationshipPair(where: { _or: [{ userA: { _eq: $address } }, { userB: { _eq: $address } }] }) {
        userA
        userB
        signalLabel
        evidenceCount
        firstQualifiedAt
        lastQualifiedAt
      }
    }`,
    { address: lower },
  )

  const connections = pairsData.RelationshipPair.map((pair) => {
    const peer = pair.userA === lower ? pair.userB : pair.userA
    return withStatus({
      peer,
      signalLabel: pair.signalLabel,
      evidenceCount: pair.evidenceCount,
      firstQualifiedAt: pair.firstQualifiedAt,
      lastQualifiedAt: pair.lastQualifiedAt,
      freshnessPeriodSeconds,
    })
  })

  const peers = connections.map((c) => c.peer)
  let secondHop = []

  if (peers.length > 0) {
    const hopData = await query(
      `query($peers: [String!]) {
        RelationshipPair(where: { _or: [{ userA: { _in: $peers } }, { userB: { _in: $peers } }] }) {
          userA
          userB
          signalLabel
          evidenceCount
          firstQualifiedAt
          lastQualifiedAt
        }
      }`,
      { peers },
    )

    const directSet = new Set([lower, ...peers])
    const seen = new Set()

    secondHop = hopData.RelationshipPair.reduce((acc, pair) => {
      const via = peers.includes(pair.userA) ? pair.userA : pair.userB
      const candidate = pair.userA === via ? pair.userB : pair.userA
      if (directSet.has(candidate) || seen.has(candidate)) {
        return acc
      }
      seen.add(candidate)
      acc.push(
        withStatus({
          peer: candidate,
          via,
          signalLabel: pair.signalLabel,
          evidenceCount: pair.evidenceCount,
          firstQualifiedAt: pair.firstQualifiedAt,
          lastQualifiedAt: pair.lastQualifiedAt,
          freshnessPeriodSeconds,
        }),
      )
      return acc
    }, [])
  }

  return { center: address, connections, secondHop }
}

export async function getConnectionEvidence(selfAddress, peerAddress) {
  if (DEMO_MODE) {
    const match = MOCK_CONNECTIONS.find((c) => c.peer.toLowerCase() === peerAddress?.toLowerCase())
    return match ? withStatus(match) : null
  }

  if (!selfAddress || !peerAddress) {
    return null
  }

  const lowerSelf = selfAddress.toLowerCase()
  const [userA, userB] = [lowerSelf, peerAddress.toLowerCase()].sort()
  const pairId = `${userA}-${userB}`
  const freshnessPeriodSeconds = await getDefaultFreshnessSeconds()

  const data = await query(
    `query($id: String!) {
      RelationshipPair_by_pk(id: $id) {
        userA
        userB
        signalLabel
        evidenceCount
        firstQualifiedAt
        lastQualifiedAt
        sharedProposals {
          proposalId
          title
        }
      }
    }`,
    { id: pairId },
  )

  const pair = data.RelationshipPair_by_pk
  if (!pair) {
    return null
  }

  const peer = pair.userA === lowerSelf ? pair.userB : pair.userA

  return withStatus({
    peer,
    signalLabel: pair.signalLabel,
    evidenceCount: pair.evidenceCount,
    firstQualifiedAt: pair.firstQualifiedAt,
    lastQualifiedAt: pair.lastQualifiedAt,
    freshnessPeriodSeconds,
    evidence: pair.sharedProposals.map((s) => ({
      proposalId: Number(s.proposalId),
      title: s.title,
      bothParticipated: true,
    })),
  })
}

export async function getRhizomeQualification(rhizomeAddress, userAddress) {
  if (DEMO_MODE) {
    const network = await getNetwork(userAddress)
    const anchorSet = new Set(MOCK_RHIZOME.anchors.map((a) => a.toLowerCase()))
    const qualifyingConnections = network.connections.filter(
      (c) => anchorSet.has(c.peer.toLowerCase()) && c.status === 'active',
    )
    return {
      rhizome: { address: rhizomeAddress || MOCK_RHIZOME.address, ...MOCK_RHIZOME },
      anchors: MOCK_RHIZOME.anchors,
      qualifyingConnections,
    }
  }

  const rhizomeData = await query(
    `query($id: String!) {
      Rhizome_by_pk(id: $id) {
        id
        name
        signalType
        freshnessPeriod
        minimumConnections
        creator
        bootstrapMembers(where: { active: { _eq: true } }) {
          member
        }
      }
    }`,
    { id: rhizomeAddress },
  )

  const rhizomeRow = rhizomeData.Rhizome_by_pk
  if (!rhizomeRow) {
    return null
  }

  const anchors = rhizomeRow.bootstrapMembers.map((m) => m.member)
  const anchorSet = new Set(anchors.map((a) => a.toLowerCase()))
  const freshnessPeriodSeconds = Number(rhizomeRow.freshnessPeriod)
  const lower = userAddress.toLowerCase()

  const pairsData = await query(
    `query($address: String!) {
      RelationshipPair(where: { _or: [{ userA: { _eq: $address } }, { userB: { _eq: $address } }] }) {
        userA
        userB
        signalLabel
        evidenceCount
        firstQualifiedAt
        lastQualifiedAt
      }
    }`,
    { address: lower },
  )

  const qualifyingConnections = pairsData.RelationshipPair.map((pair) => {
    const peer = pair.userA === lower ? pair.userB : pair.userA
    return withStatus({
      peer,
      signalLabel: pair.signalLabel,
      evidenceCount: pair.evidenceCount,
      firstQualifiedAt: pair.firstQualifiedAt,
      lastQualifiedAt: pair.lastQualifiedAt,
      freshnessPeriodSeconds,
    })
  }).filter((c) => anchorSet.has(c.peer.toLowerCase()) && c.status === 'active')

  return {
    rhizome: {
      address: rhizomeRow.id,
      name: rhizomeRow.name,
      signalLabel: SIGNAL_LABELS[rhizomeRow.signalType] ?? 'Unknown signal',
      minimumConnections: Number(rhizomeRow.minimumConnections),
      freshnessPeriodDays: Math.round(freshnessPeriodSeconds / 86400),
      creator: rhizomeRow.creator,
    },
    anchors,
    qualifyingConnections,
  }
}

export async function getUserRhizomes(userAddress) {
  if (DEMO_MODE) {
    const qualification = await getRhizomeQualification(MOCK_RHIZOME.address, userAddress)
    return [
      {
        ...qualification.rhizome,
        isMember: qualification.qualifyingConnections.length >= MOCK_RHIZOME.minimumConnections,
        qualifyingCount: qualification.qualifyingConnections.length,
      },
    ]
  }

  const data = await query('query { Rhizome { id minimumConnections } }')

  const rows = await Promise.all(
    data.Rhizome.map(async (r) => {
      const qualification = await getRhizomeQualification(r.id, userAddress)
      if (!qualification) {
        return null
      }
      return {
        ...qualification.rhizome,
        isMember: qualification.qualifyingConnections.length >= Number(r.minimumConnections),
        qualifyingCount: qualification.qualifyingConnections.length,
      }
    }),
  )

  return rows.filter(Boolean)
}

export { MOCK_ADDRESSES }
