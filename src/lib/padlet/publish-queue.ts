import { PadletApiError } from "@/lib/padlet/errors";
import { createBoardPost, updateBoardPost } from "@/lib/padlet/server";
import type { PadletPostInput, PadletPostSummary } from "@/lib/padlet/types";

const DEFAULT_MAX_RETRY = Number(process.env.PADLET_PUBLISH_MAX_RETRY ?? 3);
const DEFAULT_CONCURRENCY = Number(process.env.PADLET_PUBLISH_CONCURRENCY ?? 1);

let active = 0;
const waiters: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (active < DEFAULT_CONCURRENCY) {
    active += 1;
    return;
  }
  await new Promise<void>((resolve) => waiters.push(resolve));
  active += 1;
}

function releaseSlot(): void {
  active = Math.max(0, active - 1);
  const next = waiters.shift();
  if (next) next();
}

function backoffMs(attempt: number): number {
  return Math.min(8000, 500 * 2 ** attempt);
}

export async function publishToPadletWithRetry(input: {
  boardId: string;
  postInput: PadletPostInput;
  existingPostId?: string | null;
  apiKey: string;
}): Promise<PadletPostSummary> {
  await acquireSlot();
  try {
    let lastError: unknown;
    for (let attempt = 0; attempt < DEFAULT_MAX_RETRY; attempt++) {
      try {
        if (input.existingPostId) {
          return await updateBoardPost(input.boardId, input.existingPostId, input.postInput, input.apiKey);
        }
        return await createBoardPost(input.boardId, input.postInput, input.apiKey);
      } catch (error) {
        lastError = error;
        if (error instanceof PadletApiError && error.status === 429) {
          await new Promise((r) => setTimeout(r, backoffMs(attempt)));
          continue;
        }
        if (error instanceof PadletApiError && error.status >= 500) {
          await new Promise((r) => setTimeout(r, backoffMs(attempt)));
          continue;
        }
        throw error;
      }
    }
    if (lastError instanceof PadletApiError && lastError.status === 429) {
      throw new PadletApiError("rate_limited", 429);
    }
    throw lastError instanceof Error ? lastError : new Error("패들렛 게시에 실패했습니다.");
  } finally {
    releaseSlot();
  }
}
