import { indexer } from "envio";

function normalizePair(a: string, b: string): [string, string] {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  return lowerA < lowerB ? [lowerA, lowerB] : [lowerB, lowerA];
}

indexer.onEvent(
  { contract: "RioGovernance", event: "ProposalCreated" },
  async ({ event, context }) => {
    context.Proposal.set({
      id: event.params.proposalId.toString(),
      creator: event.params.creator,
      title: event.params.title,
      createdAt: BigInt(event.block.timestamp),
    });
  },
);

indexer.onEvent(
  { contract: "RioGovernance", event: "VoteCast" },
  async ({ event, context }) => {
    const proposalId = event.params.proposalId.toString();
    const voter = event.params.voter;
    const timestamp = BigInt(event.params.timestamp);

    context.Vote.set({
      id: `${proposalId}-${voter.toLowerCase()}`,
      proposal_id: proposalId,
      voter,
      support: Number(event.params.support),
      timestamp,
    });

    const proposal = await context.Proposal.get(proposalId);
    const proposalVoters = await context.ProposalVoters.getOrCreate({
      id: proposalId,
      voters: [],
    });

    for (const existingVoter of proposalVoters.voters) {
      if (existingVoter.toLowerCase() === voter.toLowerCase()) {
        continue;
      }

      const [userA, userB] = normalizePair(existingVoter, voter);
      const pairId = `${userA}-${userB}`;
      const sharedProposalId = `${pairId}-${proposalId}`;

      const existingShared = await context.SharedProposal.get(sharedProposalId);
      if (existingShared) {
        continue;
      }

      context.SharedProposal.set({
        id: sharedProposalId,
        pair_id: pairId,
        proposalId: BigInt(proposalId),
        title: proposal?.title ?? "",
      });

      const pair = await context.RelationshipPair.get(pairId);

      context.RelationshipPair.set(
        pair
          ? {
              ...pair,
              evidenceCount: pair.evidenceCount + 1,
              lastQualifiedAt: timestamp,
            }
          : {
              id: pairId,
              userA,
              userB,
              signalLabel: "Shared Governance",
              evidenceCount: 1,
              firstQualifiedAt: timestamp,
              lastQualifiedAt: timestamp,
            },
      );
    }

    const alreadyCounted = proposalVoters.voters.some(
      (v) => v.toLowerCase() === voter.toLowerCase(),
    );
    if (!alreadyCounted) {
      context.ProposalVoters.set({
        id: proposalId,
        voters: [...proposalVoters.voters, voter],
      });
    }
  },
);
