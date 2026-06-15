// Quality: a clear copycat -> FAKE/low; an established original -> AUTHENTIC/high.
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const ADDR = process.env.CONTRACT || "__FILL_AFTER_DEPLOY__";
const PK = process.env.GL_PK;
if (!PK) { console.error("Set GL_PK"); process.exit(1); }
const account = createAccount(PK.startsWith("0x") ? PK : "0x" + PK);
const client = createClient({ chain: studionet, account });

const CASES = [
  {
    label: "Obvious copycat",
    collection: "Bored Ape Yacht Clubb",
    details: "Misspelled name impersonating BAYC, identical copied art, anonymous team, brand-new mint link spammed in DMs, no provenance.",
    ok: ["FAKE"], min: 0, max: 35,
  },
  {
    label: "Established original",
    collection: "CryptoPunks",
    details: "One of the earliest NFT collections, original 10k pixel-art set, verified on-chain provenance since 2017, widely recognized and traded.",
    ok: ["AUTHENTIC"], min: 65, max: 100,
  },
  {
    label: "Unclear new drop",
    collection: "A new art collection by an unknown artist",
    details: "Original-looking art, small following, roadmap is vague, no verified team yet but nothing clearly wrong.",
    ok: ["AUTHENTIC", "SUSPICIOUS", "FAKE"], min: 0, max: 100,
  },
];

function parse(raw) { const [v, s, m] = String(raw ?? "").split("||"); return { verdict: v, score: Number(s), summary: m || "" }; }

let pass = 0;
for (const c of CASES) {
  const id = c.label.replace(/\W+/g, "_") + "_" + Date.now();
  const hash = await client.writeContract({ address: ADDR, functionName: "check", args: [id, c.collection, c.details], value: 0n });
  await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 5000, retries: 60 });
  const r = parse(await client.readContract({ address: ADDR, functionName: "get_check", args: [id] }));

  const problems = [];
  if (!c.ok.includes(r.verdict)) problems.push(`verdict ${r.verdict} not in [${c.ok}]`);
  if (!(r.score >= c.min && r.score <= c.max)) problems.push(`score ${r.score} out of [${c.min}-${c.max}]`);
  if (!r.summary || r.summary.length < 12) problems.push("summary too short");
  if (r.verdict === "AUTHENTIC" && r.score < 60) problems.push("AUTHENTIC but low score");
  if (r.verdict === "FAKE" && r.score > 40) problems.push("FAKE but high score");

  if (problems.length === 0) { console.log(`PASS  ${c.label}: ${r.verdict}/${r.score} — ${r.summary.slice(0, 60)}`); pass++; }
  else console.log(`FAIL  ${c.label}: ${r.verdict}/${r.score} — ${problems.join("; ")}`);
}
console.log(`\nQUALITY: ${pass}/${CASES.length} verdicts correct & coherent.`);
process.exit(pass === CASES.length ? 0 : 1);
