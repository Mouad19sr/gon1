# Mintproof — NFT Authenticity Checker

Find out if an NFT collection is genuine before you buy. AI validators on GenLayer read the
collection and what you know, then agree on a verdict (AUTHENTIC, SUSPICIOUS, or FAKE) with a
score. The result is saved on-chain and free to read.

- **Network:** GenLayer Studionet — chainId 61999 (0xf23f)
- **RPC:** https://studio.genlayer.com/api
- **Contract:** `0x9023e3e658077dD92833A614C314633266249e09`

## Structure

```
nft-authenticity-checker/
  backend/
    contract.py          # Intelligent Contract: check() / get_check()
  frontend/
    src/
      App.tsx            # home + checker views
      chain.ts           # chain + contract address
      wagmi.ts           # wallet config (injected)
      contractService.ts # read / write via genlayer-js
      main.tsx, index.css
    index.html
    package.json
    test-read.mjs
    test-write.mjs
    test-quality.mjs
  README.md
```

## Run locally

```
cd frontend
npm install
npm run dev      # http://localhost:5230
npm run build    # production build -> frontend/dist
npm run preview
```

## Deploy

Static build. Host `frontend/dist/` on Vercel (root = `frontend/`), Netlify, or any static
host. `vite.config.ts` uses `base: "./"` so it works anywhere. The contract is already live
on-chain. Users need an injected wallet (e.g. MetaMask) on GenLayer Studionet to run a check.

## Contract

- `check(check_id, collection, details)` — writes a verdict on-chain.
- `get_check(check_id)` — reads back `verdict || score || summary`.
- Verdict: AUTHENTIC / SUSPICIOUS / FAKE. Score: 0 (clearly fake) to 100 (clearly genuine).

## Tests

```
cd frontend
$env:GL_PK="0x..."; node test-read.mjs ; Remove-Item Env:\GL_PK
$env:GL_PK="0x..."; node test-write.mjs ; Remove-Item Env:\GL_PK
$env:GL_PK="0x..."; node test-quality.mjs ; Remove-Item Env:\GL_PK
```
