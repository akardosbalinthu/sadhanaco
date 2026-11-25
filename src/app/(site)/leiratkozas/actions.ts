"use server";

import { unsubscribeToken } from "@/lib/unsubscribe";

export type UnsubState = { status: "idle" | "ok" | "error" };

export async function unsubscribe(_prev: UnsubState, fd: FormData): Promise<UnsubState> {
  return { status: (await unsubscribeToken(fd.get("t"))) ? "ok" : "error" };
}
