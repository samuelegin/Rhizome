export const RELATIONSHIP_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'registrar',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'connectionId',
    stateMutability: 'pure',
    inputs: [
      { name: 'userA', type: 'address' },
      { name: 'userB', type: 'address' },
      { name: 'signalType', type: 'bytes32' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'getConnection',
    stateMutability: 'view',
    inputs: [
      { name: 'userA', type: 'address' },
      { name: 'userB', type: 'address' },
      { name: 'signalType', type: 'bytes32' },
    ],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'signalType', type: 'bytes32' },
          { name: 'evidenceCount', type: 'uint32' },
          { name: 'firstQualifiedAt', type: 'uint64' },
          { name: 'lastQualifiedAt', type: 'uint64' },
          { name: 'evidenceRef', type: 'bytes32' },
          { name: 'exists', type: 'bool' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'isConnectionActive',
    stateMutability: 'view',
    inputs: [
      { name: 'userA', type: 'address' },
      { name: 'userB', type: 'address' },
      { name: 'signalType', type: 'bytes32' },
      { name: 'freshnessPeriod', type: 'uint64' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getNeighbors',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'registerConnection',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'userA', type: 'address' },
      { name: 'userB', type: 'address' },
      { name: 'signalType', type: 'bytes32' },
      { name: 'evidenceCount', type: 'uint32' },
      { name: 'firstQualifiedAt', type: 'uint64' },
      { name: 'lastQualifiedAt', type: 'uint64' },
      { name: 'evidenceRef', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setRegistrar',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newRegistrar', type: 'address' }],
    outputs: [],
  },
  {
    type: 'event',
    name: 'ConnectionRegistered',
    inputs: [
      { name: 'connectionId', type: 'bytes32', indexed: true },
      { name: 'userA', type: 'address', indexed: true },
      { name: 'userB', type: 'address', indexed: true },
      { name: 'signalType', type: 'bytes32', indexed: false },
      { name: 'evidenceCount', type: 'uint32', indexed: false },
      { name: 'firstQualifiedAt', type: 'uint64', indexed: false },
      { name: 'lastQualifiedAt', type: 'uint64', indexed: false },
      { name: 'evidenceRef', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RegistrarUpdated',
    inputs: [
      { name: 'oldRegistrar', type: 'address', indexed: true },
      { name: 'newRegistrar', type: 'address', indexed: true },
    ],
  },
]

export const RHIZOME_ABI = [
  {
    type: 'function',
    name: 'MAX_BOOTSTRAP_MEMBERS',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  { type: 'function', name: 'registry', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'name', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'signalType', stateMutability: 'view', inputs: [], outputs: [{ type: 'bytes32' }] },
  { type: 'function', name: 'freshnessPeriod', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint64' }] },
  { type: 'function', name: 'minimumConnections', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint16' }] },
  { type: 'function', name: 'creator', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  {
    type: 'function',
    name: 'isBootstrapMember',
    stateMutability: 'view',
    inputs: [{ type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'isMember',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getBootstrapMembers',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'getConfig',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'registryAddress', type: 'address' },
      { name: 'name_', type: 'string' },
      { name: 'signalType_', type: 'bytes32' },
      { name: 'freshnessPeriod_', type: 'uint64' },
      { name: 'minimumConnections_', type: 'uint16' },
      { name: 'creator_', type: 'address' },
    ],
  },
  {
    type: 'function',
    name: 'addBootstrapMember',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'member', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'removeBootstrapMember',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'member', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'transferCreator',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newCreator', type: 'address' }],
    outputs: [],
  },
  {
    type: 'event',
    name: 'BootstrapMemberAdded',
    inputs: [{ name: 'member', type: 'address', indexed: true }],
  },
  {
    type: 'event',
    name: 'BootstrapMemberRemoved',
    inputs: [{ name: 'member', type: 'address', indexed: true }],
  },
  {
    type: 'event',
    name: 'CreatorTransferred',
    inputs: [
      { name: 'oldCreator', type: 'address', indexed: true },
      { name: 'newCreator', type: 'address', indexed: true },
    ],
  },
]

export const RHIZOME_FACTORY_ABI = [
  { type: 'function', name: 'registry', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  {
    type: 'function',
    name: 'createRhizome',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'signalType', type: 'bytes32' },
      { name: 'freshnessPeriod', type: 'uint64' },
      { name: 'minimumConnections', type: 'uint16' },
    ],
    outputs: [{ name: 'rhizomeAddress', type: 'address' }],
  },
  {
    type: 'function',
    name: 'getAllRhizomes',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'allRhizomesLength',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'rhizomeConfigs',
    stateMutability: 'view',
    inputs: [{ type: 'address' }],
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'signalType', type: 'bytes32' },
      { name: 'freshnessPeriod', type: 'uint64' },
      { name: 'minimumConnections', type: 'uint16' },
      { name: 'creator', type: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'RhizomeCreated',
    inputs: [
      { name: 'rhizome', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'signalType', type: 'bytes32', indexed: false },
      { name: 'freshnessPeriod', type: 'uint64', indexed: false },
      { name: 'minimumConnections', type: 'uint16', indexed: false },
    ],
  },
]

export const MEMBER_SPACE_ABI = [
  { type: 'function', name: 'rhizome', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  {
    type: 'function',
    name: 'post',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'contentHash', type: 'bytes32' }],
    outputs: [],
  },
  {
    type: 'event',
    name: 'PostCreated',
    inputs: [
      { name: 'author', type: 'address', indexed: true },
      { name: 'contentHash', type: 'bytes32', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
]

export const RIO_GOVERNANCE_ABI = [
  { type: 'function', name: 'proposalCount', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  {
    type: 'function',
    name: 'getProposal',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'creator', type: 'address' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'startTime', type: 'uint64' },
          { name: 'endTime', type: 'uint64' },
          { name: 'forVotes', type: 'uint256' },
          { name: 'againstVotes', type: 'uint256' },
          { name: 'abstainVotes', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'hasVoted',
    stateMutability: 'view',
    inputs: [
      { type: 'uint256' },
      { type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'createProposal',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'startTime', type: 'uint64' },
      { name: 'endTime', type: 'uint64' },
    ],
    outputs: [{ name: 'proposalId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'vote',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
    ],
    outputs: [],
  },
  {
    type: 'event',
    name: 'ProposalCreated',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'title', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'VoteCast',
    inputs: [
      { name: 'voter', type: 'address', indexed: true },
      { name: 'proposalId', type: 'uint256', indexed: true },
      { name: 'support', type: 'uint8', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
]

export const RIO_STAKING_ABI = [
  { type: 'function', name: 'stakingToken', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  {
    type: 'function',
    name: 'stakedBalance',
    stateMutability: 'view',
    inputs: [{ type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'isStaking',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'stake',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'unstake',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'event',
    name: 'Staked',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Unstaked',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
]

export const RIO_TOKEN_ABI = [
  { type: 'function', name: 'name', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
]
