export const MOCK_ADDRESSES = {
  ALICE: '0x2bd806c97f0e00af1a1fc3328fa763a9269723c8',
  BOB: '0x81b637d8fcd2c6da6359e6963113a1170de795e4',
  CHARLIE: '0xb9dd960c1753459a78115d3cb845a57d924b6877',
  DAVID: '0x07d046d5fac12b3f82daf5035b9aae86db5adc82',
  EVE: '0x85262adf74518bbb70c7cb94cd6159d91669e5a8',
  FRANK: '0x77646f5a4f3166637627abe998e7a1470fe72d8b',
}

export const MOCK_RHIZOME = {
  address: '0x96e6beb6a0dc466611a77ec77a0e4bf05d217d4a',
  name: 'Monad Builders',
  signalLabel: 'Shared Governance',
  freshnessPeriodDays: 30,
  minimumConnections: 2,
  anchors: [MOCK_ADDRESSES.BOB, MOCK_ADDRESSES.CHARLIE],
}

const DAY = 86400
const now = () => Math.floor(Date.now() / 1000)

export const MOCK_CONNECTIONS = [
  {
    peer: MOCK_ADDRESSES.BOB,
    signalLabel: 'Shared Governance',
    evidenceCount: 4,
    firstQualifiedAt: now() - 27 * DAY,
    lastQualifiedAt: now() - 13 * DAY,
    freshnessPeriodSeconds: 30 * DAY,
    evidence: [
      { proposalId: 12, title: 'Fund the Q3 grants round', bothParticipated: true },
      { proposalId: 18, title: 'Adjust staking parameters', bothParticipated: true },
      { proposalId: 23, title: 'Add a second registrar', bothParticipated: true },
      { proposalId: 31, title: 'Renew community treasury multisig', bothParticipated: true },
    ],
  },
  {
    peer: MOCK_ADDRESSES.CHARLIE,
    signalLabel: 'Shared Governance',
    evidenceCount: 3,
    firstQualifiedAt: now() - 22 * DAY,
    lastQualifiedAt: now() - 9 * DAY,
    freshnessPeriodSeconds: 30 * DAY,
    evidence: [
      { proposalId: 18, title: 'Adjust staking parameters', bothParticipated: true },
      { proposalId: 23, title: 'Add a second registrar', bothParticipated: true },
      { proposalId: 31, title: 'Renew community treasury multisig', bothParticipated: true },
    ],
  },
  {
    peer: MOCK_ADDRESSES.DAVID,
    signalLabel: 'Shared Governance',
    evidenceCount: 1,
    firstQualifiedAt: now() - 71 * DAY,
    lastQualifiedAt: now() - 41 * DAY,
    freshnessPeriodSeconds: 30 * DAY,
    evidence: [{ proposalId: 6, title: 'Initial governance parameters', bothParticipated: true }],
  },
]

export const MOCK_SECOND_HOP = [
  {
    peer: MOCK_ADDRESSES.EVE,
    via: MOCK_ADDRESSES.BOB,
    signalLabel: 'Shared Governance',
    evidenceCount: 2,
    firstQualifiedAt: now() - 18 * DAY,
    lastQualifiedAt: now() - 5 * DAY,
    freshnessPeriodSeconds: 30 * DAY,
  },
  {
    peer: MOCK_ADDRESSES.FRANK,
    via: MOCK_ADDRESSES.CHARLIE,
    signalLabel: 'Shared Governance',
    evidenceCount: 1,
    firstQualifiedAt: now() - 60 * DAY,
    lastQualifiedAt: now() - 55 * DAY,
    freshnessPeriodSeconds: 30 * DAY,
  },
]
