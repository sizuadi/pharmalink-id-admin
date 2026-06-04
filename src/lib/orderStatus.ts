// Mirrors backend TRANSACTION_STATUS_TRANSITIONS / TransactionStatus seed.

export const STATUS_NAME: Record<number, string> = {
  1: "Draft",
  2: "Waiting Payment",
  3: "Payment Verified",
  4: "Processing",
  5: "Ready for Pickup",
  6: "On Delivery",
  7: "Completed",
  8: "Cancelled",
  9: "Failed",
  10: "Refunded",
};

export const ALL_STATUS_IDS = Object.keys(STATUS_NAME).map(Number);

const TRANSITIONS: Record<number, number[]> = {
  1: [2, 8],
  2: [3, 9, 8],
  3: [4, 8, 10],
  4: [5, 6, 8, 10],
  5: [7, 10],
  6: [7, 10],
  7: [10],
  8: [],
  9: [2, 8],
  10: [],
};

/** Valid next status ids from the current status. */
export function getNextStatusIds(statusId: number): number[] {
  return TRANSITIONS[statusId] ?? [];
}
