import PQueue from "p-queue";

export const reportQueue = new PQueue({ concurrency: 1 });

// Maximum number of pending tasks before rejecting new requests.
// With concurrency 1 and ~15s per report, 10 pending = ~2.5 min max wait.
const MAX_QUEUE_SIZE = 10;

/**
 * Check if the queue can accept more tasks.
 * Returns the current pending count if full.
 */
export function isQueueFull(): { full: boolean; pending: number } {
  const pending = reportQueue.pending + reportQueue.size;
  return { full: pending >= MAX_QUEUE_SIZE, pending };
}
