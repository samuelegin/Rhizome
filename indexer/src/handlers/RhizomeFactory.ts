import { indexer } from "envio";

indexer.onEvent(
  { contract: "RhizomeFactory", event: "RhizomeCreated" },
  async ({ event, context }) => {
    context.Rhizome.set({
      id: event.params.rhizome,
      name: event.params.name,
      signalType: event.params.signalType,
      freshnessPeriod: BigInt(event.params.freshnessPeriod),
      minimumConnections: Number(event.params.minimumConnections),
      creator: event.params.creator,
      createdAt: BigInt(event.block.timestamp),
    });
  },
);

indexer.contractRegister(
  { contract: "RhizomeFactory", event: "RhizomeCreated" },
  ({ event, context }) => {
    context.chain.Rhizome.add(event.params.rhizome);
  },
);
