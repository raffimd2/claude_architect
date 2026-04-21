/**
 * Handoff packet constructor.
 *
 * When escalating, emit a structured packet the human agent can consume
 * without re-reading the transcript.
 */

export type HandoffPacket = {
  customer_id: string;
  root_cause: string;
  attempted: string[];
  recommended_action: string;
  transactional_facts: Record<string, unknown>;
};

export function buildHandoff(args: {
  customerId: string;
  rootCause: string;
  attempted: string[];
  recommendedAction: string;
  facts: Record<string, unknown>;
}): HandoffPacket {
  return {
    customer_id: args.customerId,
    root_cause: args.rootCause,
    attempted: args.attempted,
    recommended_action: args.recommendedAction,
    transactional_facts: args.facts,
  };
}

// Example usage (run with: npx ts-node src/handoff-packet.ts)
if (require.main === module) {
  const packet = buildHandoff({
    customerId: "C-42",
    rootCause: "Duplicate charge on order A-1138 on 2024-11-14.",
    attempted: [
      "get_customer(email=priya@example.com) — verified",
      "lookup_order(A-1138) — confirmed $800 charge",
      "process_refund(A-1138, $800) — BLOCKED by policy hook (> $500 limit)",
    ],
    recommendedAction: "Approve and issue $800 refund manually.",
    facts: { order_id: "A-1138", amount_usd: 800, charge_date: "2024-11-14" },
  });
  console.log(JSON.stringify(packet, null, 2));
}
