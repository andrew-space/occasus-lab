# Agent 5 - Deploy and QA

## Status: Publishing pipeline started

## Deploy target

- repo: occasus-lab
- owner: andrew-space
- expected live URL: https://andrew-space.github.io/occasus-lab/
- strategy: GitHub Pages workflow deployment from site/

## Workflow

- file: .github/workflows/deploy.yml
- actions/configure-pages uses enablement: true
- artifact path: site

## Release log

- initial MVP commit: e4bad36
- docs publish-state commit: 8cf1403

## QA checklist (Round 5)

### Functional
- [ ] Landing page loads
- [ ] Clarity Rewriter rewrites input text
- [ ] Brand Message Generator returns 3 outputs
- [ ] UTM Builder returns valid URL
- [ ] Copy result button works
- [ ] Blog article page opens

### Visual
- [ ] Typography matches editorial direction
- [ ] Beige/black/orange palette is consistent
- [ ] Logo and banner render correctly
- [ ] Mobile layout keeps all core actions accessible

### Technical
- [ ] No missing asset errors
- [ ] No console errors on first load
- [ ] GitHub Actions run ends in completed/success
- [ ] Live Pages URL is accessible

## Next deploy step

After Actions success, perform one full smoke test on the live URL and capture screenshot evidence for submission.

## Handoff - 2026-04-10 (Session Close)

- Repository migration completed from `ai-challenge-round5-studio-occasus` to `occasus-lab`.
- Pages workflow is active on the new repo; security workflow also active.
- Next-session deployment check sequence:
1. Confirm latest `Deploy GitHub Pages` run is green in `occasus-lab`.
2. Validate live URL load and auth modal behavior.
3. Validate no "Firebase not configured" message after config update.
