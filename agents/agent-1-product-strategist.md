# Agent 1 - Product Strategist

## Status: MVP scope locked

## Product core

- Product name: Occasus Lab
- Positioning: research-backed communication system focused on clarity, not noise
- MVP model: static web app deployable on GitHub Pages

## Core audience

- founders launching a service or offer
- freelancers and consultants
- small creative businesses
- marketing generalists who need sharper messaging

## Main user problem

Users have good ideas but unclear messaging. Their copy is dense, generic, or overloaded.

## MVP value proposition

Occasus Lab helps users move from chaos to clarity in minutes with practical tools and clear editorial guidance.

## MVP feature set

1. Clarity Rewriter (functional)
2. Brand Message Generator (functional)
3. UTM Builder (functional)
4. Blog article aligned with insight-to-product logic

## 30-second jury demo flow

1. Open landing page
2. Paste unclear paragraph into Clarity Rewriter
3. Show cleaner output and editing notes
4. Open Brand Message Generator and produce positioning
5. Show UTM Builder output and article link

## Out of scope for v1

- user accounts
- billing
- backend storage
- model API integration

## Next strategic step

Replace rule-based rewriting with real LLM calls once backend and quotas are defined.

## Handoff - 2026-04-10 (Session Close)

- Canonical product URL moved to: https://andrew-space.github.io/occasus-lab/
- Product scope remains: 10-tool freemium suite with gamification.
- Strategic blocker to resolve first next session: Firebase is still not configured in deployed frontend (`firebase-config.js` has empty project fields).
- Immediate next action on resume: fill Firebase web config + authorized domains, then validate Google Sign-In on deployed URL.
