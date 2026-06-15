# v0.2.17
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class NftAuthenticityChecker(gl.Contract):
    # check_id -> "verdict||score||summary"
    checks: TreeMap[str, str]

    def __init__(self):
        pass

    @gl.public.write
    def check(self, check_id: str, collection: str, details: str) -> None:
        prompt = (
            "You judge whether an NFT collection is authentic or a copycat/scam, using ONLY the "
            "text provided. Decide one verdict: AUTHENTIC, SUSPICIOUS, or FAKE.\n\n"
            f"Collection: {collection}\n"
            f"Details: {details}\n\n"
            "Weigh red flags (impersonating a famous collection, copied art, no verified team, "
            "fake mint links, rushed hype, no provenance) against trust signals (verified "
            "creator, original art, transparent roadmap, established history, on-chain provenance). "
            "AUTHENTIC = genuine and original, SUSPICIOUS = unclear or some red flags, "
            "FAKE = clearly a copy or scam. Authenticity is a 0-100 number: 100 = clearly genuine, "
            "0 = clearly fake.\n"
            "Respond ONLY as JSON: "
            '{"verdict":"AUTHENTIC|SUSPICIOUS|FAKE","score":0-100,"summary":"one short sentence"}.'
        )

        def leader() -> str:
            return gl.nondet.exec_prompt(prompt)

        raw = gl.eq_principle.prompt_comparative(
            leader,
            principle=(
                "Both answers are acceptable if they agree on direction. Treat AUTHENTIC and "
                "SUSPICIOUS as compatible, and SUSPICIOUS and FAKE as compatible; only AUTHENTIC "
                "vs FAKE is a real disagreement. The numeric score may differ by up to 30 points. "
                "The summary wording may be completely different."
            ),
        )

        cleaned = raw.replace("```json", "").replace("```", "").strip()
        verdict = "SUSPICIOUS"
        score = "50"
        summary = ""
        try:
            import json
            data = json.loads(cleaned)
            verdict = str(data.get("verdict", "SUSPICIOUS"))
            score = str(data.get("score", "50"))
            summary = str(data.get("summary", ""))
        except Exception:
            summary = cleaned[:160]

        self.checks[check_id] = verdict + "||" + score + "||" + summary

    @gl.public.view
    def get_check(self, check_id: str) -> str:
        return self.checks.get(check_id, "")
