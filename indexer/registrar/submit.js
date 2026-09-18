import { createPublicClient, createWalletClient, http, keccak256, toHex, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz"] },
  },
});

const RELATIONSHIP_REGISTRY_ABI = [
  {
    type: "function",
    name: "registerConnection",
    stateMutability: "nonpayable",
    inputs: [
      { name: "userA", type: "address" },
      { name: "userB", type: "address" },
      { name: "signalType", type: "bytes32" },
      { name: "evidenceCount", type: "uint32" },
      { name: "firstQualifiedAt", type: "uint64" },
      { name: "lastQualifiedAt", type: "uint64" },
      { name: "evidenceRef", type: "bytes32" },
    ],
    outputs: [],
  },
];

const SIGNAL_TYPE = keccak256(toHex("SHARED_GOVERNANCE"));
const MIN_EVIDENCE_COUNT = Number(process.env.MIN_EVIDENCE_COUNT || 1);
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 60000);

const account = privateKeyToAccount(process.env.PRIVATE_KEY);
const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });
const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http() });

async function fetchQualifyingPairs() {
  const query = `
    query($minEvidence: Int!) {
      RelationshipPair(where: { evidenceCount: { _gte: $minEvidence } }) {
        id
        userA
        userB
        evidenceCount
        firstQualifiedAt
        lastQualifiedAt
        connection {
          evidenceCount
        }
        sharedProposals {
          proposalId
        }
      }
    }
  `;

  const response = await fetch(process.env.ENVIO_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { minEvidence: MIN_EVIDENCE_COUNT } }),
  });

  const { data, errors } = await response.json();
  if (errors) {
    throw new Error(JSON.stringify(errors));
  }
  return data.RelationshipPair;
}

function computeEvidenceRef(pair) {
  const proposalIds = pair.sharedProposals.map((s) => s.proposalId.toString()).sort();
  return keccak256(toHex(proposalIds.join(",")));
}

async function submitPair(pair) {
  const hash = await walletClient.writeContract({
    address: process.env.RELATIONSHIP_REGISTRY_ADDRESS,
    abi: RELATIONSHIP_REGISTRY_ABI,
    functionName: "registerConnection",
    args: [
      pair.userA,
      pair.userB,
      SIGNAL_TYPE,
      pair.evidenceCount,
      BigInt(pair.firstQualifiedAt),
      BigInt(pair.lastQualifiedAt),
      computeEvidenceRef(pair),
    ],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

async function tick() {
  const pairs = await fetchQualifyingPairs();

  for (const pair of pairs) {
    const onChainCount = pair.connection ? pair.connection.evidenceCount : 0;
    if (pair.evidenceCount <= onChainCount) {
      continue;
    }

    const hash = await submitPair(pair);
    console.log(`registered ${pair.userA} <-> ${pair.userB}: ${hash}`);
  }
}

async function main() {
  console.log(`registrar running as ${account.address}`);
  await tick();
  setInterval(() => {
    tick().catch((error) => console.error(error));
  }, POLL_INTERVAL_MS);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});