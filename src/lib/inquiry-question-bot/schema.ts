export const QB_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    probe: { type: "string" },
    candidates: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["probe", "candidates"],
} as const;
