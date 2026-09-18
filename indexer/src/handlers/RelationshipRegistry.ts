import { indexer } from "envio";

indexer.onEvent(
  { contract: "RelationshipRegistry", event: "ConnectionRegistered" },
  async ({ event, context }) => {
    const userA = event.params.userA.toLowerCase();
    const userB = event.params.userB.toLowerCase();
    const pairId = userA < userB ? `${userA}-${userB}` : `${userB}-${userA}`;
    const timestamp = BigInt(event.block.timestamp);

    context.VerifiedConnection.set({
      id: event.params.connectionId,
      userA: event.params.userA,
      userB: event.params.userB,
      signalType: event.params.signalType,
      evidenceCount: Number(event.params.evidenceCount),
      firstQualifiedAt: BigInt(event.params.firstQualifiedAt),
      lastQualifiedAt: BigInt(event.params.lastQualifiedAt),
      evidenceRef: event.params.evidenceRef,
      registeredAt: timestamp,
      updatedAt: timestamp,
    });

    const pair = await context.RelationshipPair.get(pairId);
    if (pair) {
      context.RelationshipPair.set({
        ...pair,
        connection_id: event.params.connectionId,
      });
    }
  },
);