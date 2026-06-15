import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const ADDR = process.env.CONTRACT || "__FILL_AFTER_DEPLOY__";
const client = createClient({ chain: studionet, account: createAccount() });
function parse(raw) { const [v, s, m] = String(raw ?? "").split("||"); return { v, s: Number(s), m: m || "" }; }

const ids = ["fake-apes", "real-cryptopunks", "unknown-mint"];
let ok = 0;
for (const id of ids) {
  const raw = await client.readContract({ address: ADDR, functionName: "get_check", args: [id] });
  const r = parse(raw);
  if (raw) { console.log(`OK   ${id} -> ${r.v} / ${r.s} / ${r.m.slice(0, 60)}`); ok++; }
  else console.log(`MISS ${id} -> (no stored result)`);
}
console.log(`\n${ok}/${ids.length} returned a valid parsed result.`);
