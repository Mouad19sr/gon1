import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const ADDR = process.env.CONTRACT || "__FILL_AFTER_DEPLOY__";
const PK = process.env.GL_PK;
if (!PK) { console.error("Set GL_PK"); process.exit(1); }
const account = createAccount(PK.startsWith("0x") ? PK : "0x" + PK);
const client = createClient({ chain: studionet, account });
function parse(raw) { const [v, s, m] = String(raw ?? "").split("||"); return { v, s: Number(s), m: m || "" }; }

const id = "roundtrip_" + Date.now();
console.log("write check(", id, ")…");
const hash = await client.writeContract({
  address: ADDR, functionName: "check",
  args: [id, "Bored Apes Yacht Clubb", "Copied art from the real BAYC, anonymous team, fresh mint link spammed on social, name misspelled to impersonate."],
  value: 0n,
});
console.log("tx:", hash);
await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 5000, retries: 60 });
console.log("accepted. reading back…");
const r = parse(await client.readContract({ address: ADDR, functionName: "get_check", args: [id] }));
const ok = r.v && Number.isFinite(r.s) && r.m;
console.log((ok ? "OK -> " : "FAIL -> ") + `${r.v} / ${r.s} / ${r.m}`);
process.exit(ok ? 0 : 1);
