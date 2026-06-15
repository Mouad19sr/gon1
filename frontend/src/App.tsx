import { useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { check, getCheck, type CheckResult } from "./contractService";
import { GENLAYER_CHAIN_ID, CONTRACT_ADDRESS } from "./chain";

type Phase = "idle" | "working";
type View = "home" | "tool";
type Toast = { msg: string; kind: "ok" | "err" | "" } | null;

function WalletControl() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;
        return (
          <div
            className="wallet"
            {...(!ready && { "aria-hidden": true, style: { opacity: 0, pointerEvents: "none" as const } })}
          >
            {!connected ? (
              <button className="wbtn" onClick={openConnectModal} type="button">
                Connect wallet
              </button>
            ) : chain.unsupported ? (
              <button className="wbtn warn" onClick={openChainModal} type="button">
                Wrong network
              </button>
            ) : (
              <button className="wchip" onClick={openAccountModal} type="button">
                <span className="wdot" />
                {account.displayName}
              </button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

export function App() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const onRightNetwork = chainId === GENLAYER_CHAIN_ID;

  const [view, setView] = useState<View>("home");
  const [cid, setCid] = useState("");
  const [collection, setCollection] = useState("");
  const [details, setDetails] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const flash = (msg: string, kind: "ok" | "err" | "" = "") => {
    setToast({ msg, kind });
    window.clearTimeout((flash as any)._t);
    (flash as any)._t = window.setTimeout(() => setToast(null), 4500);
  };

  const goTool = () => { setView("tool"); window.scrollTo({ top: 0 }); };
  const goHome = () => { setView("home"); window.scrollTo({ top: 0 }); };

  const canRun =
    !!isConnected && onRightNetwork && !!cid.trim() && !!collection.trim() && !!details.trim() && phase === "idle";

  async function run() {
    if (!address) return flash("Connect a wallet first.", "err");
    if (!onRightNetwork) return flash("Switch to GenLayer Studionet.", "err");
    if (!cid.trim() || !collection.trim() || !details.trim()) return flash("Fill every field.", "err");
    setPhase("working");
    setResult(null);
    try {
      flash("Submitted. Validators are checking the collection.");
      const res = await check(address, cid.trim(), collection.trim(), details.trim(), (h) =>
        flash("Tx " + h.slice(0, 10) + "…")
      );
      if (!res) flash("No verdict came back. Try again.", "err");
      else { setResult(res); flash("Verdict saved on-chain.", "ok"); }
    } catch (e: any) {
      flash("Failed: " + (e?.shortMessage || e?.message || String(e)), "err");
    } finally {
      setPhase("idle");
    }
  }

  async function lookup() {
    if (!cid.trim()) return flash("Enter a check ID to look up.", "err");
    setPhase("working");
    try {
      const res = await getCheck(cid.trim());
      if (!res) flash("Nothing saved under that ID.", "err");
      else { setResult(res); flash("Loaded from chain.", "ok"); }
    } catch (e: any) {
      flash("Lookup failed: " + (e?.shortMessage || e?.message || String(e)), "err");
    } finally {
      setPhase("idle");
    }
  }

  const v = result?.verdict || "";

  return (
    <>
      <nav className="nav">
        <div className="bar">
          <a className="brand" onClick={goHome}>
            <span className="logo">◆</span> Mintproof
          </a>
          <div className="right">
            <a className="navl" onClick={goHome}>Home</a>
            <a className="navl" onClick={goTool}>Checker</a>
            <WalletControl />
          </div>
        </div>
      </nav>

      {view === "home" && (
        <main>
          <section className="hero">
            <div className="hero-inner">
              <span className="badge">Authenticity, verified on-chain</span>
              <h1>Know if an NFT collection is <span className="hl">real</span>.</h1>
              <p className="sub">
                Paste a collection and what you know. AI validators decide if it is genuine,
                suspicious, or a copy, then save the verdict for anyone to check.
              </p>
              <div className="cta">
                <button className="primary" onClick={goTool}>Check a collection</button>
                <a className="ghost" href="#how">See how it works</a>
              </div>
              <div className="trust">
                <span><b>3-way</b> verdict</span>
                <span className="sep" />
                <span><b>On-chain</b> record</span>
                <span className="sep" />
                <span><b>Free</b> to read</span>
              </div>
            </div>

            <div className="hero-card" aria-hidden="true">
              <div className="hc-top">
                <span className="hc-chip ok">AUTHENTIC</span>
                <span className="hc-num">96<small>/100</small></span>
              </div>
              <div className="hc-track"><span className="hc-bar" /></div>
              <p className="hc-say">Verified creator, original 2017 art, on-chain provenance. Genuine.</p>
              <div className="hc-foot">CryptoPunks · saved on-chain</div>
            </div>
          </section>

          <section className="how" id="how">
            <div className="how-head">
              <span className="eyebrow">How it works</span>
              <h2>From a hunch to a verdict in three steps.</h2>
            </div>
            <ol className="steps">
              <li><span className="sn">1</span><h3>Describe it</h3><p>Name the collection and drop in any detail you have.</p></li>
              <li><span className="sn">2</span><h3>Validators weigh in</h3><p>Independent AI models judge the signals and agree.</p></li>
              <li><span className="sn">3</span><h3>Read the verdict</h3><p>Authentic, suspicious, or fake, with a score, saved on-chain.</p></li>
            </ol>
          </section>

          <section className="strip">
            <article className="tint mint">
              <span className="k">Authentic</span>
              <p>Verified creator, original art, a clear history. The collection checks out.</p>
            </article>
            <article className="tint sky">
              <span className="k">Suspicious</span>
              <p>Some signals do not add up. Worth a closer look before you buy.</p>
            </article>
            <article className="tint rose">
              <span className="k">Fake</span>
              <p>Copied art or a famous name borrowed. Walk away.</p>
            </article>
          </section>

          <section className="band">
            <h2>Spot the copy before it costs you.</h2>
            <button className="primary" onClick={goTool}>Run a free check</button>
          </section>
        </main>
      )}

      {view === "tool" && (
        <main className="tool">
          <div className="toolhead">
            <h2>Check a collection</h2>
            <p className="sub">Three short fields. The verdict prints below and saves on-chain.</p>
          </div>

          {isConnected && !onRightNetwork && (
            <p className="netwarn">
              Wrong network. <a onClick={() => switchChain({ chainId: GENLAYER_CHAIN_ID })}>Switch to Studionet</a>
            </p>
          )}

          <div className="form">
            <label className="field">
              <span className="flabel">Check ID</span>
              <input value={cid} onChange={(e) => setCid(e.target.value)} placeholder="bored-apes-lookalike" />
              <span className="fhelp">A short name to save and recall this check.</span>
            </label>

            <label className="field">
              <span className="flabel">Collection name</span>
              <input value={collection} onChange={(e) => setCollection(e.target.value)} placeholder="e.g. Bored Ape Yacht Club" />
              <span className="fhelp">The collection you want to verify.</span>
            </label>

            <label className="field">
              <span className="flabel">What you know</span>
              <input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Creator, mint link, art origin, roadmap, anything suspicious…" />
              <span className="fhelp">More context means a sharper verdict.</span>
            </label>

            <div className="runrow">
              <button className="primary" disabled={!canRun} onClick={run}>
                {phase === "working" ? "Checking…" : "Run check"}
              </button>
              <button className="link" disabled={phase !== "idle" || !cid.trim()} onClick={lookup}>
                Look up a saved check
              </button>
              {!isConnected && <span className="hint">Connect your wallet to run a check.</span>}
            </div>
          </div>

          <div className="result">
            {phase === "working" && <p className="muted">Validators reviewing the collection…</p>}
            {phase === "idle" && !result && <p className="muted">The verdict will appear here.</p>}
            {phase === "idle" && result && (
              <div className={"card v-" + v}>
                <div className="vtop">
                  <span className={"verdict " + v}>{v || "—"}</span>
                  <span className="num">{Number.isFinite(result.score) ? result.score : "--"}<small>/100</small></span>
                </div>
                <div className="track"><span className={"bar " + v} style={{ width: Math.max(3, Math.min(100, result.score)) + "%" }} /></div>
                <p className="say">{result.summary}</p>
                <span className="saved">Saved on-chain · {cid}</span>
              </div>
            )}
          </div>

          <p className="cfoot">
            {CONTRACT_ADDRESS ? CONTRACT_ADDRESS.slice(0, 6) + "…" + CONTRACT_ADDRESS.slice(-4) : "not deployed yet"} · Studionet 61999
          </p>
        </main>
      )}

      <footer className="foot">
        <span>Mintproof</span>
        <span>NFT authenticity on GenLayer</span>
      </footer>

      {toast && <div className={"toast " + toast.kind}>{toast.msg}</div>}
    </>
  );
}
