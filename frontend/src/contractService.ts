/**
 * Contract service for the NFT Authenticity Checker.
 * Reads use a read-only client; writes are signed via the browser wallet.
 */
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { CONTRACT_ADDRESS } from "./chain";

export interface CheckResult {
  verdict: string; // AUTHENTIC | SUSPICIOUS | FAKE
  score: number; // 0..100
  summary: string;
}

type Hex = `0x${string}`;

const CHECK_TIMEOUT_MS = 120_000;

function readClient() {
  return createClient({ chain: studionet, account: createAccount() });
}

function writeClient(account: Hex) {
  return createClient({ chain: studionet, account });
}

export function parseResult(raw: string): CheckResult | null {
  if (!raw) return null;
  const [verdict, score, summary] = String(raw).split("||");
  return {
    verdict: verdict ?? "",
    score: Number(score ?? 0),
    summary: summary ?? "",
  };
}

export async function getCheck(checkId: string): Promise<CheckResult | null> {
  const raw = await readClient().readContract({
    address: CONTRACT_ADDRESS as Hex,
    functionName: "get_check",
    args: [checkId],
  });
  return parseResult(String(raw ?? ""));
}

export async function check(
  account: Hex,
  checkId: string,
  collection: string,
  details: string,
  onSubmitted?: (hash: string) => void
): Promise<CheckResult | null> {
  const client = writeClient(account);
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as Hex,
    functionName: "check",
    args: [checkId, collection, details],
    value: 0n,
  });
  onSubmitted?.(String(hash));

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Check timed out after 120s")), CHECK_TIMEOUT_MS);
  });
  try {
    await Promise.race([
      client.waitForTransactionReceipt({
        hash,
        status: TransactionStatus.ACCEPTED,
        interval: 5000,
        retries: 60,
      }),
      timeout,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
  return getCheck(checkId);
}
