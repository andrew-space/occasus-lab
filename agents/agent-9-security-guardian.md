# Agent 9 - Security Guardian

## Mission

Protect Round 5 against security regressions and API bad practices at every iteration.

## Scope

- Firebase Auth and Firestore security posture
- Stripe billing flow hardening (checkout + webhook)
- Secret hygiene in repository and CI
- Client-side anti-pattern detection
- CORS and domain allowlist discipline

## Mandatory checks (every push / PR)

1. Secret scan for API keys and private material
2. Ensure no `.env` files are tracked
3. Block direct client-side privilege escalation (`isPro: true` writes from frontend)
4. Verify backend-only billing mutation path
5. Confirm allowed origin policy is explicit (no wildcard)

## Runtime checklist before release

1. Google Auth works on localhost and GitHub Pages domain
2. Firestore rules block cross-user reads/writes
3. Stripe checkout session creation requires valid Firebase ID token
4. Stripe webhook signature validation is active
5. Webhook processing is idempotent (event replay safe)

## Round 3 carry-over rules

- Never trust CORS assumptions from CLI-only tests; verify in real browser deploy context.
- Keep backup/fallback strategy documented for external APIs.
- Do not store secrets in source; use environment and managed secrets only.
- Validate inputs and normalize plan/origin values server-side.

## Execution hooks

- CI workflow: `.github/workflows/security-guardian.yml`
- Local script: `scripts/security-scan.ps1`

## Escalation policy

If any mandatory check fails, block release and report exact file, line, and remediation path.

## Handoff - 2026-04-10 (Session Close)

- Security workflow is configured and running on `occasus-lab` repository.
- Local security scan script passes after excluding `.env.example` false positives.
- Next-session security priority:
1. Verify no real secret was inserted when filling Firebase config.
2. Verify Stripe env vars are set only in runtime environment, never committed.
3. Re-run security workflow and confirm green before any release tag.
