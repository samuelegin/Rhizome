import { indexer } from "envio";

indexer.onEvent(
  { contract: "RioStaking", event: "Staked" },
  async ({ event, context }) => {
    const user = event.params.user;
    const amount = BigInt(event.params.amount);
    const timestamp = BigInt(event.params.timestamp);

    const position = await context.StakePosition.getOrCreate({
      id: user,
      staked: 0n,
      updatedAt: timestamp,
    });

    context.StakePosition.set({
      id: user,
      staked: position.staked + amount,
      updatedAt: timestamp,
    });

    context.StakeEvent.set({
      id: `${event.block.number}-${event.logIndex}`,
      user,
      amount,
      kind: "Stake",
      timestamp,
    });
  },
);

indexer.onEvent(
  { contract: "RioStaking", event: "Unstaked" },
  async ({ event, context }) => {
    const user = event.params.user;
    const amount = BigInt(event.params.amount);
    const timestamp = BigInt(event.params.timestamp);

    const position = await context.StakePosition.getOrCreate({
      id: user,
      staked: 0n,
      updatedAt: timestamp,
    });

    context.StakePosition.set({
      id: user,
      staked: position.staked - amount,
      updatedAt: timestamp,
    });

    context.StakeEvent.set({
      id: `${event.block.number}-${event.logIndex}`,
      user,
      amount,
      kind: "Unstake",
      timestamp,
    });
  },
);
