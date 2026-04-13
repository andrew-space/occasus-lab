const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

const PLAN_TO_PRICE = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || "",
  yearly: process.env.STRIPE_PRICE_YEARLY || ""
};

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function sanitizeReturnPath(pathValue) {
  const raw = typeof pathValue === "string" ? pathValue.trim() : "";
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  if (raw.includes("..")) return "/";
  return raw;
}

function setCors(req, res) {
  const origin = req.headers.origin || "";
  if (allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
}

function safeJson(res, code, payload) {
  res.status(code).set("Content-Type", "application/json").send(payload);
}

async function requireAuth(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("missing_auth");
  }
  const idToken = authHeader.slice(7);
  return admin.auth().verifyIdToken(idToken);
}

exports.createCheckoutSession = onRequest({ region: "europe-west1" }, async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }
  if (req.method !== "POST") {
    return safeJson(res, 405, { error: "method_not_allowed" });
  }
  if (!stripe) {
    logger.error("Stripe not configured");
    return safeJson(res, 500, { error: "stripe_not_configured" });
  }

  try {
    const decoded = await requireAuth(req);
    const plan = (req.body && req.body.plan) || "";
    const origin = (req.body && req.body.origin) || "";
    const returnPath = sanitizeReturnPath((req.body && req.body.returnPath) || "/");

    if (!["monthly", "yearly"].includes(plan)) {
      return safeJson(res, 400, { error: "invalid_plan" });
    }
    if (!allowedOrigins.includes(origin)) {
      return safeJson(res, 400, { error: "invalid_origin" });
    }

    const priceId = PLAN_TO_PRICE[plan];
    if (!priceId) {
      return safeJson(res, 500, { error: "price_not_configured" });
    }

    const userDoc = await db.collection("users").doc(decoded.uid).get();
    const customerEmail = decoded.email || (userDoc.exists ? userDoc.data().email : null) || null;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}${returnPath}?checkout=success`,
      cancel_url: `${origin}${returnPath}?checkout=cancel`,
      customer_email: customerEmail || undefined,
      metadata: {
        uid: decoded.uid,
        plan
      },
      allow_promotion_codes: true
    });

    return safeJson(res, 200, { url: session.url });
  } catch (err) {
    logger.error("createCheckoutSession failed", err);
    const code = err.message === "missing_auth" ? 401 : 500;
    return safeJson(res, code, { error: "checkout_failed" });
  }
});

exports.stripeWebhook = onRequest({ region: "europe-west1" }, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("method_not_allowed");
  }
  if (!stripe || !stripeWebhookSecret) {
    logger.error("Stripe webhook not configured");
    return res.status(500).send("stripe_not_configured");
  }

  try {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      return res.status(400).send("missing_signature");
    }

    const event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret);

    const eventRef = db.collection("stripe_events").doc(event.id);
    const existing = await eventRef.get();
    if (existing.exists) {
      return res.status(200).send("already_processed");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const uid = session.metadata && session.metadata.uid;
      const plan = (session.metadata && session.metadata.plan) || "monthly";

      if (uid) {
        await db.collection("users").doc(uid).set(
          {
            isPro: true,
            proPlan: plan,
            stripeCustomerId: session.customer || null,
            stripeSubscriptionId: session.subscription || null,
            proSince: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          },
          { merge: true }
        );
      }
    }

    await eventRef.set({
      type: event.type,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).send("ok");
  } catch (err) {
    logger.error("stripeWebhook failed", err);
    return res.status(400).send("webhook_failed");
  }
});
