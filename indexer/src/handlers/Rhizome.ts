import { indexer } from "envio";

indexer.onEvent(
  { contract: "Rhizome", event: "BootstrapMemberAdded" },
  async ({ event, context }) => {
    const id = `${event.srcAddress}-${event.params.member}`;

    context.BootstrapMember.set({
      id,
      rhizome_id: event.srcAddress,
      member: event.params.member,
      active: true,
      addedAt: BigInt(event.block.timestamp),
    });
  },
);

indexer.onEvent(
  { contract: "Rhizome", event: "BootstrapMemberRemoved" },
  async ({ event, context }) => {
    const id = `${event.srcAddress}-${event.params.member}`;
    const existing = await context.BootstrapMember.get(id);

    if (existing) {
      context.BootstrapMember.set({ ...existing, active: false });
    }
  },
);

indexer.onEvent(
  { contract: "Rhizome", event: "CreatorTransferred" },
  async ({ event, context }) => {
    const rhizome = await context.Rhizome.get(event.srcAddress);

    if (rhizome) {
      context.Rhizome.set({ ...rhizome, creator: event.params.newCreator });
    }
  },
);