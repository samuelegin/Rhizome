import { keccak256, toBytes } from 'viem'
import { CONTRACT_ADDRESSES, isDeployed } from './addresses'

export const SIGNAL_TYPES = {
  SHARED_GOVERNANCE: keccak256(toBytes('SHARED_GOVERNANCE')),
}

export const SIGNAL_LABELS = {
  [SIGNAL_TYPES.SHARED_GOVERNANCE]: 'Shared Governance',
}

export const MAX_BOOTSTRAP_MEMBERS = 3
export function contractsDeployed(...keys) {
  return keys.every((k) => isDeployed(CONTRACT_ADDRESSES[k]))
}

export { CONTRACT_ADDRESSES }
