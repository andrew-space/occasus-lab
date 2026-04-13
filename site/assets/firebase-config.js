/* ═══════════════════════════════════════════════════
   Firebase Configuration — Occasus Lab
   ═══════════════════════════════════════════════════
   SETUP: 1. Go to https://console.firebase.google.com
          2. Create project "occasus-lab"
          3. Enable Authentication > Google provider
          4. Enable Firestore Database
          5. Add web app, copy config below
          6. Add your GitHub Pages domain to Authorized Domains
   ═══════════════════════════════════════════════════ */

var FIREBASE_CONFIG = {
  apiKey: "AIzaSyDa4A2WWxtoa8DMEitITRmOF9yZ7iVWapI",
  authDomain: "studio-occasus.firebaseapp.com",
  projectId: "studio-occasus",
  storageBucket: "studio-occasus.firebasestorage.app",
  messagingSenderId: "635904077616",
  appId: "1:635904077616:web:93e0805d3bcf3b12c2a2f5"
};

/* Freemium limits */
var FREE_LIMITS = {
  clarity: 3,
  brand: 1,
  utm: 999,
  tone: 0,
  headline: 0,
  counter: 999,
  readability: 999,
  email: 999,
  seo: 999,
  social: 0
};

var PRO_PRICE = { monthly: 18, yearly: 180, currency: "€" };

/* Server-side billing endpoint (Firebase Functions) */
var BACKEND_CONFIG = {
  checkoutEndpoint: "https://europe-west1-studio-occasus.cloudfunctions.net/createCheckoutSession"
};
