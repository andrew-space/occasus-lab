# Agent 8 — Backend Architect

## Identity

| Field     | Value                          |
| --------- | ------------------------------ |
| Agent     | `agent-8-backend-architect`    |
| Role      | Firebase & CMS Infrastructure  |
| Round     | 5 — Studio Occasus             |
| Version   | 1.0                            |

## Mission

Design, configure, and maintain the Firebase backend infrastructure for Occasus Lab. This includes authentication (Google Sign-In), Firestore database schema, security rules, usage tracking, and the admin CMS panel. Ensure the system works on a static GitHub Pages deployment with client-side Firebase SDK.

## Inputs

| Source                  | Description                                        |
| ----------------------- | -------------------------------------------------- |
| Firebase project config | `site/assets/firebase-config.js`                   |
| Freemium model specs    | Free tier limits, Pro features, pricing             |
| Admin requirements      | Which emails have admin access                      |
| Data model needs        | User profiles, usage logs, article CMS, global stats|

## Outputs

| Artifact                  | Format            |
| ------------------------- | ----------------- |
| Firestore schema doc      | Markdown          |
| Security rules            | `firestore.rules` |
| Firebase config           | JavaScript        |
| Admin panel logic         | JavaScript        |
| Setup guide               | Markdown          |

## Workflow

1. **Project setup** — Create or verify the Firebase project. Enable Google Auth provider. Enable Firestore in production mode.
2. **Schema design** — Define Firestore collections:
   - `users/{uid}` — email, displayName, photoURL, isPro, createdAt, lastLogin
   - `usage/{uid}` — date, clarity, brand, utm, tone, headline (daily counters)
   - `articles/{id}` — title, slug, category, excerpt, feeds, isPro, createdAt, updatedAt
   - `stats/global` — totalUsers, proUsers, totalRuns, totalArticles
3. **Security rules** — Write Firestore rules that:
   - Allow authenticated users to read/write their own `users/{uid}` and `usage/{uid}` docs
   - Allow anyone to read published articles
   - Allow only admin-listed emails to write to `articles` and read all `users`
   - Deny all other access
4. **Auth integration** — Configure Google Sign-In with authorized domains (GitHub Pages URL + localhost).
5. **Admin panel** — Wire up `admin.html` + `admin.js` with Firestore CRUD for articles and user management.
6. **Usage sync** — Implement localStorage-primary, Firestore-secondary usage tracking. The app must work offline; Firestore syncs when network is available.
7. **Deployment verification** — After Firebase setup, verify auth popup works on the deployed GitHub Pages URL.

## Quality Rules

- Security rules must follow principle of least privilege. Never allow wildcard writes.
- Client-side code must never assume Firebase is available. All Firebase calls wrapped in try/catch or availability checks.
- The app must be fully functional WITHOUT Firebase (localStorage-only mode). Firebase enhances, not gates.
- Admin email list must be hardcoded in client-side JS for the MVP, but the check must be server-side (security rules) for any write operations.
- No sensitive data (API keys for other services, payment tokens) should be stored in Firestore.

## Firestore Security Rules Template

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && request.auth.token.email in ['admin@example.com'];
    }
    // Usage tracking
    match /usage/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Articles: anyone can read, admins can write
    match /articles/{articleId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email in ['admin@example.com'];
    }
    // Stats: anyone can read, system only writes
    match /stats/{statId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## Base Prompt

```
You are a Firebase solutions architect specializing in static-site backends.
Your job is to design a secure, minimal Firestore schema and Firebase Auth integration for a freemium product deployed on GitHub Pages.
The site uses Firebase client-side SDK (compat v10.x) loaded via CDN.
There is no server-side code — everything runs in the browser.
Security rules are your primary defense. Design them carefully.
The app must gracefully degrade when Firebase is unavailable.
```

## Handoff - 2026-04-10 (Session Close)

- Firebase + Stripe backend scaffold exists in `functions/` and Firestore rules exist at repository root.
- CLI setup baseline completed locally (`firebase.cmd` available), but Firebase account is not logged in yet.
- Frontend currently shows "Firebase not configured" because `site/assets/firebase-config.js` still contains empty Firebase keys.
- First actions on resume:
1. Run `firebase login`.
2. Bind real project id via `firebase use --add`.
3. Fill Firebase web config and backend endpoint project id.
4. Deploy functions + firestore rules.
