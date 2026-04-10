/* ═══════════════════════════════════════════════════
   Occasus Lab — App Engine v5
   Firebase Auth · Freemium Usage · 10 Tools · Gamification
   ═══════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── Firebase ─────────────────────────────────── */
  var db = null, auth = null, currentUser = null, isPro = false;
  var firebaseReady = false;

  try {
    if (typeof FIREBASE_CONFIG !== "undefined" && FIREBASE_CONFIG.apiKey) {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      auth = firebase.auth();
      db = firebase.firestore();
      firebaseReady = true;
    }
  } catch (e) {
    console.warn("Firebase not configured — running in local mode.", e);
  }

  /* ── Limits ───────────────────────────────────── */
  var LIMITS = (typeof FREE_LIMITS !== "undefined") ? FREE_LIMITS : { clarity: 5, brand: 3, utm: 999, tone: 0, headline: 0, counter: 999, readability: 5, email: 5, seo: 5, social: 0 };

  /* ── Gamification ─────────────────────────────── */
  var XP_VALUES = { clarity: 15, brand: 20, utm: 5, tone: 15, headline: 15, counter: 5, readability: 10, email: 10, seo: 10, social: 15 };
  var TOOL_NAMES = { clarity: "Clarity Rewriter", brand: "Brand Messaging", utm: "UTM Builder", tone: "Tone Analyzer", headline: "Headline Scorer", counter: "Word Counter", readability: "Readability", email: "Email Subject", seo: "SEO Preview", social: "Social Post" };
  var LEVELS = [
    { name: "Intern", min: 0 },
    { name: "Junior", min: 100 },
    { name: "Strategist", min: 300 },
    { name: "Lead", min: 600 },
    { name: "Director", min: 1000 },
    { name: "VP", min: 2000 },
    { name: "Legend", min: 5000 }
  ];
  var BADGES = {
    "first-draft": { icon: "\uD83D\uDCDD", title: "First Draft", desc: "Use any tool for the first time" },
    "daily-grinder": { icon: "\uD83D\uDCAA", title: "Daily Grinder", desc: "Maintain a 7-day streak" },
    "tool-explorer": { icon: "\uD83C\uDFC6", title: "Tool Explorer", desc: "Use every tool at least once" },
    "headline-hero": { icon: "\uD83C\uDF1F", title: "Headline Hero", desc: "Score an A-grade headline" },
    "clarity-master": { icon: "\u2600\uFE0F", title: "Clarity Master", desc: "Perform 20+ clarity rewrites" },
    "word-wizard": { icon: "\uD83D\uDCDA", title: "Word Wizard", desc: "Analyze 10,000+ words" },
    "power-user": { icon: "\u26A1", title: "Power User", desc: "Use 3+ tools daily for 5 days" },
    "perfectionist": { icon: "\uD83D\uDC8E", title: "Perfectionist", desc: "Rewrite the same text 3 times in one session" }
  };

  function todayKey() { return new Date().toISOString().slice(0, 10); }

  function getUsage() {
    try {
      var d = JSON.parse(localStorage.getItem("occ_usage") || "{}");
      if (d.date !== todayKey()) d = { date: todayKey(), clarity: 0, brand: 0, utm: 0, tone: 0, headline: 0, counter: 0, readability: 0, email: 0, seo: 0, social: 0 };
      return d;
    } catch (e) { return { date: todayKey(), clarity: 0, brand: 0, utm: 0, tone: 0, headline: 0, counter: 0, readability: 0, email: 0, seo: 0, social: 0 }; }
  }
  function saveUsage(u) { localStorage.setItem("occ_usage", JSON.stringify(u)); }

  /* ── Gamification Engine ───────────────────────── */
  function getGamification() {
    try { return JSON.parse(localStorage.getItem("occ_gamify") || "{}"); } catch (e) { return {}; }
  }
  function saveGamification(g) { localStorage.setItem("occ_gamify", JSON.stringify(g)); }

  function initStreak() {
    var g = getGamification();
    var today = todayKey();
    if (!g.lastDay) { g.lastDay = today; g.streak = 1; g.xp = g.xp || 0; g.badges = g.badges || []; g.totalWords = g.totalWords || 0; saveGamification(g); return; }
    var last = new Date(g.lastDay);
    var now = new Date(today);
    var diff = Math.round((now - last) / 86400000);
    if (diff === 1) { g.streak = (g.streak || 0) + 1; g.lastDay = today; }
    else if (diff > 1) { g.streak = 1; g.lastDay = today; }
    if (!g.badges) g.badges = [];
    if (!g.totalWords) g.totalWords = 0;
    saveGamification(g);
  }

  function addXP(amount, tool) {
    var g = getGamification();
    g.xp = (g.xp || 0) + amount;
    g.lastDay = todayKey();
    if (tool) {
      if (!g.toolsUsed) g.toolsUsed = {};
      g.toolsUsed[tool] = (g.toolsUsed[tool] || 0) + 1;
    }
    saveGamification(g);
    checkBadges();
    updateGamificationUI();
  }

  function getLevel(xp) {
    for (var i = LEVELS.length - 1; i >= 0; i--) { if (xp >= LEVELS[i].min) return LEVELS[i]; }
    return LEVELS[0];
  }

  function checkBadges() {
    var g = getGamification();
    if (!g.badges) g.badges = [];
    var u = getUsage();
    var tu = g.toolsUsed || {};
    var earned = [];

    if (g.badges.indexOf("first-draft") === -1 && Object.keys(tu).length > 0) earned.push("first-draft");
    if (g.badges.indexOf("daily-grinder") === -1 && (g.streak || 0) >= 7) earned.push("daily-grinder");
    if (g.badges.indexOf("tool-explorer") === -1) {
      var allTools = Object.keys(TOOL_NAMES);
      var usedAll = allTools.every(function (t) { return (tu[t] || 0) > 0; });
      if (usedAll) earned.push("tool-explorer");
    }
    if (g.badges.indexOf("clarity-master") === -1 && (tu.clarity || 0) >= 20) earned.push("clarity-master");
    if (g.badges.indexOf("word-wizard") === -1 && (g.totalWords || 0) >= 10000) earned.push("word-wizard");

    if (earned.length) {
      g.badges = g.badges.concat(earned);
      saveGamification(g);
      earned.forEach(function (b) { showBadgeUnlock(b); });
    }
  }

  function showBadgeUnlock(badgeKey) {
    var b = BADGES[badgeKey];
    if (!b) return;
    var modal = document.getElementById("badge-modal");
    if (!modal) return;
    var iconEl = document.getElementById("badge-modal-icon");
    var titleEl = document.getElementById("badge-modal-title");
    var descEl = document.getElementById("badge-modal-desc");
    if (iconEl) iconEl.textContent = b.icon;
    if (titleEl) titleEl.textContent = b.title + " unlocked!";
    if (descEl) descEl.textContent = b.desc;
    modal.classList.remove("hidden");
    setTimeout(function () { modal.classList.add("hidden"); }, 3500);
  }

  function updateGamificationUI() {
    var g = getGamification();
    var xp = g.xp || 0;
    var level = getLevel(xp);
    var nextLevel = null;
    for (var i = 0; i < LEVELS.length; i++) { if (LEVELS[i].min > xp) { nextLevel = LEVELS[i]; break; } }
    var pct = nextLevel ? Math.round(((xp - level.min) / (nextLevel.min - level.min)) * 100) : 100;

    /* Nav pills */
    var sc = document.getElementById("streak-count");
    if (sc) sc.textContent = g.streak || 0;
    var xl = document.getElementById("xp-level");
    if (xl) xl.textContent = level.name;
    var xp_el = document.getElementById("xp-points");
    if (xp_el) xp_el.textContent = xp + " XP";
    var xf = document.getElementById("xp-fill");
    if (xf) xf.style.width = pct + "%";

    /* Dashboard stats */
    var gs = document.getElementById("gf-streak");
    if (gs) gs.innerHTML = "&#128293; " + (g.streak || 0) + " day" + ((g.streak || 0) !== 1 ? "s" : "");
    var gl = document.getElementById("gf-level");
    if (gl) gl.textContent = level.name;
    var gx = document.getElementById("gf-xp");
    if (gx) gx.textContent = xp;
    var u = getUsage();
    var toolsToday = 0;
    Object.keys(TOOL_NAMES).forEach(function (t) { if ((u[t] || 0) > 0) toolsToday++; });
    var gt = document.getElementById("gf-tools-today");
    if (gt) gt.textContent = toolsToday + " / " + Object.keys(TOOL_NAMES).length;
    var gc = document.getElementById("gf-challenge");
    if (gc) gc.textContent = toolsToday >= 3 ? "Complete! +50 XP bonus" : "Use 3 different tools (" + toolsToday + "/3)";

    /* Badges */
    var badges = g.badges || [];
    Object.keys(BADGES).forEach(function (key) {
      var el = document.querySelector(".badge-item[data-badge='" + key + "']");
      if (el) {
        if (badges.indexOf(key) !== -1) { el.classList.remove("badge-item--locked"); el.classList.add("badge-item--earned"); }
        else { el.classList.add("badge-item--locked"); el.classList.remove("badge-item--earned"); }
      }
    });
  }

  function canUse(tool) {
    if (isPro) return true;
    var u = getUsage();
    return (u[tool] || 0) < (LIMITS[tool] || 0);
  }
  function recordUse(tool) {
    var u = getUsage();
    u[tool] = (u[tool] || 0) + 1;
    saveUsage(u);
    updateUsageBar();
    addXP(XP_VALUES[tool] || 10, tool);
    if (firebaseReady && currentUser) {
      db.collection("usage").doc(currentUser.uid).set(u, { merge: true }).catch(function () {});
    }
  }

  /* ── Auth ──────────────────────────────────────── */
  if (firebaseReady) {
    auth.onAuthStateChanged(function (user) {
      currentUser = user;
      if (user) {
        db.collection("users").doc(user.uid).set({
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        db.collection("users").doc(user.uid).get().then(function (doc) {
          isPro = doc.exists && doc.data().isPro === true;
          updateAuthUI();
          updateProGates();
          updateUsageBar();
        });
      } else {
        isPro = false;
        updateAuthUI();
        updateProGates();
        updateUsageBar();
      }
    });
  }

  function updateAuthUI() {
    var signInBtn = document.getElementById("btn-signin");
    var avatarMenu = document.getElementById("avatar-menu");
    if (!signInBtn || !avatarMenu) return;

    if (currentUser) {
      signInBtn.classList.add("hidden");
      avatarMenu.classList.remove("hidden");
      var img = avatarMenu.querySelector(".avatar-btn img");
      if (img) img.src = currentUser.photoURL || "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser.displayName || "U") + "&background=fdb54f&color=121212&size=72";
      var dropName = document.getElementById("user-name");
      var dropEmail = document.getElementById("user-email");
      var dropPlan = document.getElementById("user-plan");
      if (dropName) dropName.textContent = currentUser.displayName || "";
      if (dropEmail) dropEmail.textContent = currentUser.email || "";
      if (dropPlan) dropPlan.textContent = isPro ? "Pro Plan" : "Free Plan";
      /* Show admin link for whitelisted emails */
      var adminLink = document.getElementById("admin-link");
      var ADMIN_EMAILS = ["andrew.neuburger@community.isunet.edu", "andrew.neuburger@isunet.edu"];
      if (adminLink && ADMIN_EMAILS.indexOf(currentUser.email) !== -1) adminLink.classList.remove("hidden");
    } else {
      signInBtn.classList.remove("hidden");
      avatarMenu.classList.add("hidden");
    }
  }

  function updateProGates() {
    var gates = document.querySelectorAll(".pro-gate");
    gates.forEach(function (g) { g.classList.toggle("unlocked", isPro); });
    var proPanels = document.querySelectorAll("[data-pro-content]");
    proPanels.forEach(function (p) { p.classList.toggle("hidden", !isPro); });
  }

  function updateUsageBar() {
    var bar = document.getElementById("usage-bar");
    if (!bar) return;
    if (isPro) { bar.classList.add("hidden"); return; }
    bar.classList.remove("hidden");
    var u = getUsage();
    var total = (u.clarity || 0) + (u.brand || 0) + (u.readability || 0) + (u.email || 0) + (u.seo || 0);
    var max = LIMITS.clarity + LIMITS.brand + LIMITS.readability + LIMITS.email + LIMITS.seo;
    var pct = Math.min(100, Math.round((total / max) * 100));
    var fill = bar.querySelector(".usage-bar__fill");
    var text = bar.querySelector(".usage-bar__text");
    if (fill) { fill.style.width = pct + "%"; fill.classList.toggle("usage-bar__fill--warn", pct >= 80); }
    if (text) text.textContent = total + " / " + max + " free uses today";
  }

  /* ── OccApp global (called from HTML) ────────── */
  window.OccApp = {
    showAuthModal: function () {
      var m = document.getElementById("auth-modal");
      if (m) m.classList.remove("hidden");
    },
    closeModals: function () {
      document.querySelectorAll(".modal-backdrop").forEach(function (m) { m.classList.add("hidden"); });
    },
    googleSignIn: function () {
      if (!firebaseReady) { toast("Firebase not configured", "error"); return; }
      var provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).then(function () {
        window.OccApp.closeModals();
        toast("Welcome back!", "success");
      }).catch(function (err) {
        if (err.code !== "auth/popup-closed-by-user") toast("Sign-in error: " + err.message, "error");
      });
    },
    signOut: function () {
      if (auth) auth.signOut();
      currentUser = null;
      isPro = false;
      updateAuthUI();
      updateProGates();
      toast("Signed out", "info");
    },
    showUpgradeModal: function () {
      var m = document.getElementById("upgrade-modal");
      if (m) m.classList.remove("hidden");
    },
    selectedPlan: "monthly",
    selectPlan: function (plan) {
      window.OccApp.selectedPlan = plan;
      document.querySelectorAll(".upgrade-option").forEach(function (o) {
        o.classList.toggle("upgrade-option--active", o.dataset.plan === plan);
      });
    },
    processUpgrade: function () {
      if (!firebaseReady || !db) {
        toast("Payments require Firebase configuration", "info");
        return;
      }
      if (!currentUser) {
        window.OccApp.closeModals();
        window.OccApp.showAuthModal();
        return;
      }
      /* MVP demo: set Pro directly. Production: redirect to Stripe Checkout. */
      db.collection("users").doc(currentUser.uid).update({ isPro: true }).then(function () {
        isPro = true;
        updateAuthUI();
        updateProGates();
        updateUsageBar();
        window.OccApp.closeModals();
        toast("Welcome to Pro! All tools unlocked.", "success");
      }).catch(function () {
        toast("Upgrade failed — try again", "error");
      });
    },
    toggleAvatarDrop: function () {
      var d = document.getElementById("avatar-dropdown");
      if (d) d.classList.toggle("hidden");
    },
    loadClaritySample: function () {
      var input = document.getElementById("clarity-input");
      if (!input) return;
      input.value = "Our cross-functional integrated solution empowers growth-stage teams to operationalize high-impact storytelling and scalable positioning across fragmented digital channels.";
      toast("Example loaded", "info");
    },
    copySocial: function (platform) {
      var el = document.getElementById("social-" + platform + "-text");
      if (!el || !el.textContent) return;
      navigator.clipboard.writeText(el.textContent).then(function () { toast("Copied!", "success"); }).catch(function () { toast("Copy failed", "error"); });
    }
  };

  /* close dropdown on outside click */
  document.addEventListener("click", function (e) {
    var d = document.getElementById("avatar-dropdown");
    if (d && !d.classList.contains("hidden") && !e.target.closest(".avatar-menu")) d.classList.add("hidden");
  });

  /* close modals on backdrop click */
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal-backdrop")) window.OccApp.closeModals();
  });

  /* ── Tabs ──────────────────────────────────────── */
  function initTabs() {
    var wrap = document.querySelector(".tabs");
    if (!wrap) return;
    var btns = wrap.querySelectorAll(".tabs__btn");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var t = btn.dataset.tool;
        btns.forEach(function (b) { b.classList.toggle("tabs__btn--active", b === btn); });
        document.querySelectorAll(".panel").forEach(function (p) {
          p.classList.toggle("panel--active", p.id === "panel-" + t);
        });
      });
    });
  }

  /* ═══════════════════════════════════════════════════
     TOOL 1 · Clarity Rewriter
     ═══════════════════════════════════════════════════ */
  var JARGON = {
    "utilize": "use", "utilise": "use", "leverage": "use", "implement": "set up",
    "facilitate": "help", "optimize": "improve", "synergy": "teamwork",
    "streamline": "simplify", "paradigm": "model", "actionable": "practical",
    "bandwidth": "capacity", "circle back": "revisit", "deep dive": "look closely",
    "holistic": "complete", "ideate": "brainstorm", "incentivize": "motivate",
    "low-hanging fruit": "easy wins", "move the needle": "make progress",
    "scalable": "expandable", "touch base": "connect", "value-add": "benefit",
    "best-in-class": "leading", "disruptive": "innovative", "core competency": "strength",
    "ecosystem": "system", "end-to-end": "complete", "game-changer": "breakthrough",
    "pain point": "problem", "thought leader": "expert", "blue-sky thinking": "creative thinking",
    "drill down": "examine", "key takeaway": "main point"
  };
  var FILLERS = ["very", "really", "just", "simply", "basically", "actually", "literally", "absolutely", "definitely", "certainly", "obviously", "clearly", "honestly"];

  function rewriteClarity(text) {
    if (!text.trim()) return null;
    var original = text;
    var jargonCount = 0;
    var fillerCount = 0;

    /* jargon swap */
    Object.keys(JARGON).forEach(function (j) {
      var rgx = new RegExp("\\b" + j.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\b", "gi");
      if (rgx.test(text)) { jargonCount++; text = text.replace(rgx, JARGON[j]); }
    });

    /* filler removal */
    FILLERS.forEach(function (f) {
      var rgx = new RegExp("\\b" + f + "\\b\\s*", "gi");
      var m = text.match(rgx);
      if (m) { fillerCount += m.length; text = text.replace(rgx, ""); }
    });

    /* fix double spaces */
    text = text.replace(/ {2,}/g, " ").trim();

    /* sentence splitting */
    var sentences = text.split(/(?<=[.!?])\s+/);
    var splitCount = 0;
    sentences = sentences.map(function (s) {
      var words = s.split(/\s+/);
      if (words.length > 20) {
        var mid = Math.ceil(words.length / 2);
        for (var i = mid - 3; i <= mid + 3; i++) {
          if (words[i] && /^(and|but|or|which|that|because|while|so|yet|however)$/i.test(words[i])) {
            splitCount++;
            return words.slice(0, i).join(" ") + "." + "\n" + words[i].charAt(0).toUpperCase() + words[i].slice(1) + " " + words.slice(i + 1).join(" ");
          }
        }
      }
      return s;
    });
    text = sentences.join(" ").replace(/\n /g, "\n").trim();

    var reduction = Math.max(0, Math.round((1 - text.length / original.length) * 100));
    var readTime = Math.max(1, Math.round(text.split(/\s+/).length / 200));

    return {
      rewritten: text,
      jargon: jargonCount,
      fillers: fillerCount,
      splits: splitCount,
      reduction: reduction,
      wordCount: text.split(/\s+/).length,
      readTime: readTime,
      notes: buildClarityNotes(jargonCount, fillerCount, splitCount)
    };
  }

  function buildClarityNotes(j, f, s) {
    var notes = [];
    if (j) notes.push("Replaced " + j + " jargon term" + (j > 1 ? "s" : "") + " with plain language");
    if (f) notes.push("Removed " + f + " filler word" + (f > 1 ? "s" : ""));
    if (s) notes.push("Split " + s + " long sentence" + (s > 1 ? "s" : ""));
    if (!notes.length) notes.push("Text is already clear — no changes needed");
    return notes;
  }

  function runClarity() {
    if (!canUse("clarity")) { toast("Daily limit reached — upgrade to Pro for unlimited", "info"); window.OccApp.showUpgradeModal(); return; }
    var text = document.getElementById("clarity-input").value;
    var result = rewriteClarity(text);
    if (!result) { toast("Paste some text to rewrite", "info"); return; }
    recordUse("clarity");
    document.getElementById("clarity-output").textContent = result.rewritten;
    document.getElementById("clarity-jargon").textContent = result.jargon;
    document.getElementById("clarity-fillers").textContent = result.fillers;
    document.getElementById("clarity-reduction").textContent = result.reduction + "%";
    var notesList = document.getElementById("clarity-notes");
    notesList.innerHTML = "";
    result.notes.forEach(function (n) { var li = document.createElement("li"); li.textContent = n; notesList.appendChild(li); });
    toast("Clarity analysis complete", "success");
  }

  /* ═══════════════════════════════════════════════════
     TOOL 2 · Brand Message Generator
     ═══════════════════════════════════════════════════ */
  function runBrand() {
    if (!canUse("brand")) { toast("Daily limit reached — upgrade to Pro", "info"); window.OccApp.showUpgradeModal(); return; }
    var product = document.getElementById("brand-product").value.trim();
    var audience = document.getElementById("audience").value.trim();
    var problem = document.getElementById("problem").value.trim();
    var outcome = document.getElementById("outcome").value.trim();
    var tone = document.getElementById("tone").value;

    if (!product || !audience || !problem) { toast("Fill in at least product, audience, and problem", "info"); return; }
    recordUse("brand");

    var toneAdj = {
      calm: "clear and editorial",
      direct: "confident and direct",
      warm: "warm and approachable",
      professional: "clear and authoritative",
      friendly: "warm and approachable",
      bold: "confident and direct",
      minimal: "concise and elegant"
    };
    var adj = toneAdj[tone] || "clear";

    var tagline = capitalize(problem.split(" ").slice(0, 3).join(" ")) + "? " + capitalize(product) + ".";
    var elevator = product + " helps " + audience + " solve " + problem + (outcome ? " so they can " + outcome : "") + ". Our approach is " + adj + ".";
    var headline = "Stop " + gerund(problem.split(" ")[0]) + ". Start " + gerund((outcome || "winning").split(" ")[0]) + ".";
    var cta = (tone === "bold" || tone === "direct") ? "Get started now ->" : (tone === "friendly" || tone === "warm") ? "Let's make it happen" : "Learn more ->";

    document.getElementById("positioning-output").textContent = tagline;
    document.getElementById("value-output").textContent = elevator;
    document.getElementById("lead-output").textContent = headline;
    document.getElementById("brand-cta").textContent = cta;
    toast("Brand messages generated", "success");
  }
  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
  function gerund(w) { return w ? (w.endsWith("e") ? w.slice(0, -1) + "ing" : w + "ing") : "doing"; }

  /* ═══════════════════════════════════════════════════
     TOOL 3 · UTM Builder
     ═══════════════════════════════════════════════════ */
  function runUTM() {
    var base = document.getElementById("base-url").value.trim();
    var source = document.getElementById("utm-source").value.trim();
    var medium = document.getElementById("utm-medium").value.trim();
    var campaign = document.getElementById("utm-campaign").value.trim();
    var content = document.getElementById("utm-content").value.trim();
    var term = document.getElementById("utm-term");
    term = term ? term.value.trim() : "";

    if (!base || !source || !medium || !campaign) { toast("Fill in URL, source, medium, and campaign", "info"); return; }
    recordUse("utm");

    var slug = function (s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, ""); };
    var params = "utm_source=" + encodeURIComponent(slug(source)) + "&utm_medium=" + encodeURIComponent(slug(medium)) + "&utm_campaign=" + encodeURIComponent(slug(campaign));
    if (content) params += "&utm_content=" + encodeURIComponent(slug(content));
    if (term) params += "&utm_term=" + encodeURIComponent(slug(term));

    var sep = base.indexOf("?") === -1 ? "?" : "&";
    var full = base + sep + params;

    document.getElementById("utm-output").textContent = full;
    toast("UTM link generated", "success");
  }
  function copyUTM() {
    var url = document.getElementById("utm-output").textContent;
    if (!url || url === "—") return;
    navigator.clipboard.writeText(url).then(function () { toast("Copied to clipboard!", "success"); }).catch(function () { toast("Copy failed", "error"); });
  }

  /* ═══════════════════════════════════════════════════
     TOOL 4 · Tone Analyzer (PRO)
     ═══════════════════════════════════════════════════ */
  var TONE_DICT = {
    formal: ["furthermore", "consequently", "therefore", "regarding", "pursuant", "whereas", "hereby", "substantial", "facilitate", "commence", "endeavor", "acknowledge", "demonstrate", "implement", "constitute", "notwithstanding", "hereafter", "aforementioned", "requisite", "pertaining"],
    casual: ["awesome", "cool", "amazing", "gonna", "wanna", "stuff", "pretty", "kind of", "sort of", "hey", "wow", "honestly", "literally", "totally", "super", "dude", "alright", "yeah", "nah", "lol"],
    technical: ["algorithm", "framework", "infrastructure", "optimize", "scalable", "methodology", "paradigm", "architecture", "implementation", "protocol", "vectorize", "deploy", "compile", "integrate", "modular", "api", "refactor", "iterate", "database", "schema"],
    persuasive: ["exclusive", "guaranteed", "proven", "revolutionary", "transform", "unlock", "accelerate", "premium", "breakthrough", "empower", "maximize", "leverage", "elite", "ultimate", "discover", "secret", "irresistible", "limited", "urgent", "act now"]
  };

  function runTone() {
    if (!canUse("tone")) { toast("Tone Analyzer is a Pro feature", "info"); window.OccApp.showUpgradeModal(); return; }
    var text = document.getElementById("tone-input").value.trim().toLowerCase();
    if (!text) { toast("Enter text to analyze", "info"); return; }
    recordUse("tone");

    var counts = { formal: 0, casual: 0, technical: 0, persuasive: 0 };
    var total = 0;
    Object.keys(TONE_DICT).forEach(function (cat) {
      TONE_DICT[cat].forEach(function (w) {
        var rgx = new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\b", "gi");
        var m = text.match(rgx);
        if (m) { counts[cat] += m.length; total += m.length; }
      });
    });

    if (total === 0) total = 1;
    var pcts = {};
    Object.keys(counts).forEach(function (k) { pcts[k] = Math.round((counts[k] / total) * 100); });

    /* render bars */
    var container = document.getElementById("tone-output");
    container.innerHTML = "";
    var dominant = Object.keys(pcts).reduce(function (a, b) { return pcts[a] >= pcts[b] ? a : b; });

    ["formal", "casual", "technical", "persuasive"].forEach(function (cat) {
      var bar = document.createElement("div");
      bar.className = "tone-bar tone-bar--" + cat;
      bar.innerHTML = "<span class='tone-bar__label'>" + cat + "</span>" +
        "<div class='tone-bar__track'><div class='tone-bar__fill' style='width:" + pcts[cat] + "%'></div></div>" +
        "<span class='tone-bar__pct'>" + pcts[cat] + "%</span>";
      container.appendChild(bar);
    });

    var verdict = document.getElementById("tone-advice");
    if (verdict) verdict.textContent = "Your text is predominantly " + dominant + " (" + pcts[dominant] + "%). " + toneAdvice(dominant);
    toast("Tone analysis complete", "success");
  }

  function toneAdvice(t) {
    var map = {
      formal: "Consider softening for broader audiences.",
      casual: "Great for social media, but tighten for professional collateral.",
      technical: "Works for expert audiences — simplify for general marketing.",
      persuasive: "Strong sales copy. Ensure claims are backed by evidence."
    };
    return map[t] || "";
  }

  /* ═══════════════════════════════════════════════════
     TOOL 5 · Headline Scorer (PRO)
     ═══════════════════════════════════════════════════ */
  var POWER_WORDS = ["free", "new", "proven", "secret", "ultimate", "instant", "effortless", "exclusive", "breakthrough", "guaranteed", "discover", "master", "powerful", "unleash", "transform", "boost", "critical", "essential", "surprising", "shocking"];
  var EMOTIONAL_WORDS = ["fear", "love", "hate", "desperate", "amazing", "terrifying", "stunning", "heartbreaking", "thrilling", "dangerous", "brilliant", "tragic", "inspiring", "outrageous", "devastating", "unbelievable", "incredible", "astonishing"];

  function scoreHeadline(text) {
    if (!text.trim()) return null;
    var words = text.trim().split(/\s+/);
    var wc = words.length;
    var lower = text.toLowerCase();

    /* length score: sweet spot 6-12 words (max 25) */
    var len = 0;
    if (wc >= 6 && wc <= 12) len = 25;
    else if (wc >= 4 && wc <= 14) len = 18;
    else if (wc >= 2) len = 10;

    /* power words (max 25) */
    var pw = 0;
    POWER_WORDS.forEach(function (w) { if (lower.indexOf(w) !== -1) pw++; });
    var powerScore = Math.min(25, pw * 8);

    /* clarity: penalize jargon + fillers (max 25) */
    var jCount = 0;
    Object.keys(JARGON).forEach(function (j) { if (lower.indexOf(j) !== -1) jCount++; });
    var fCount = 0;
    FILLERS.forEach(function (f) { if (lower.indexOf(f) !== -1) fCount++; });
    var clarityScore = Math.max(0, 25 - (jCount * 5) - (fCount * 3));

    /* emotional impact (max 25) */
    var emo = 0;
    EMOTIONAL_WORDS.forEach(function (w) { if (lower.indexOf(w) !== -1) emo++; });
    var hasQuestion = /\?/.test(text);
    var hasNumber = /\d/.test(text);
    var emotionalScore = Math.min(25, emo * 7 + (hasQuestion ? 5 : 0) + (hasNumber ? 5 : 0));

    var total = len + powerScore + clarityScore + emotionalScore;
    var grade = total >= 80 ? "A" : total >= 60 ? "B" : total >= 40 ? "C" : "D";

    return { total: total, grade: grade, length: len, power: powerScore, clarity: clarityScore, emotion: emotionalScore, wordCount: wc };
  }

  function runHeadline() {
    if (!canUse("headline")) { toast("Headline Scorer is a Pro feature", "info"); window.OccApp.showUpgradeModal(); return; }
    var h1 = document.getElementById("headline-input").value.trim();
    var h2 = document.getElementById("headline-input-2").value.trim();
    if (!h1) { toast("Enter at least one headline", "info"); return; }
    recordUse("headline");

    var s1 = scoreHeadline(h1);
    renderHeadlineScore("headline-result-1", s1);

    if (h2) {
      var s2 = scoreHeadline(h2);
      document.getElementById("headline-result-2-wrap").classList.remove("hidden");
      renderHeadlineScore("headline-result-2", s2);
      var winner = document.getElementById("headline-winner");
      if (winner) {
        if (s1.total > s2.total) winner.textContent = "→ Headline A wins by " + (s1.total - s2.total) + " points.";
        else if (s2.total > s1.total) winner.textContent = "→ Headline B wins by " + (s2.total - s1.total) + " points.";
        else winner.textContent = "→ It's a tie! Both headlines score equally.";
      }
    } else {
      var wrap2 = document.getElementById("headline-result-2-wrap");
      if (wrap2) wrap2.classList.add("hidden");
    }
    toast("Headlines scored", "success");
  }

  function renderHeadlineScore(containerId, s) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var gradeClass = s.grade === "A" ? "grade-a" : s.grade === "B" ? "grade-b" : "grade-c";
    el.innerHTML =
      "<div class='headline-score'>" +
        "<div class='headline-score__total'>" +
          "<span class='headline-score__number'>" + s.total + "</span>" +
          "<span class='headline-score__grade " + gradeClass + "'>" + s.grade + "</span>" +
          "<span style='font-size:.85rem;color:var(--muted);margin-left:.5rem'>" + s.wordCount + " words</span>" +
        "</div>" +
        "<div class='headline-score__bars'>" +
          scoreBarHTML("Length", s.length, 25) +
          scoreBarHTML("Power", s.power, 25) +
          scoreBarHTML("Clarity", s.clarity, 25) +
          scoreBarHTML("Emotion", s.emotion, 25) +
        "</div>" +
      "</div>";
  }

  function scoreBarHTML(label, val, max) {
    var pct = Math.round((val / max) * 100);
    return "<div class='score-bar'>" +
      "<span class='score-bar__label'>" + label + "</span>" +
      "<div class='score-bar__track'><div class='score-bar__fill' style='width:" + pct + "%'></div></div>" +
      "<span class='score-bar__val'>" + val + "/" + max + "</span>" +
      "</div>";
  }

  /* ═══════════════════════════════════════════════════
     TOOL 6 · Word Counter (live)
     ═══════════════════════════════════════════════════ */
  var PLATFORM_LIMITS = { x: 280, li: 3000, ig: 2200, fb: 63206 };

  function runCounter() {
    var text = (document.getElementById("counter-input").value || "").trim();
    var words = text ? text.split(/\s+/).length : 0;
    var chars = text.length;
    var sentences = text ? (text.match(/[.!?]+/g) || []).length || 1 : 0;
    var readMin = Math.max(1, Math.round(words / 200));

    document.getElementById("counter-words").textContent = words;
    document.getElementById("counter-chars").textContent = chars;
    document.getElementById("counter-sentences").textContent = sentences;
    document.getElementById("counter-time").textContent = readMin + " min";

    /* platform limit bars */
    Object.keys(PLATFORM_LIMITS).forEach(function (p) {
      var fill = document.getElementById("limit-" + p);
      if (fill) {
        var pct = Math.min(100, Math.round((chars / PLATFORM_LIMITS[p]) * 100));
        fill.style.width = pct + "%";
        fill.classList.toggle("limit-bar__fill--over", chars > PLATFORM_LIMITS[p]);
      }
    });

    /* Track total words for gamification */
    var g = getGamification();
    g.totalWords = (g.totalWords || 0) + words;
    saveGamification(g);
  }

  /* ═══════════════════════════════════════════════════
     TOOL 7 · Readability Analyzer
     ═══════════════════════════════════════════════════ */
  function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, "");
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    word = word.replace(/^y/, "");
    var m = word.match(/[aeiouy]{1,2}/g);
    return m ? m.length : 1;
  }

  function runReadability() {
    if (!canUse("readability")) { toast("Daily limit reached — upgrade to Pro", "info"); window.OccApp.showUpgradeModal(); return; }
    var text = (document.getElementById("readability-input").value || "").trim();
    if (!text) { toast("Paste some text to analyze", "info"); return; }
    recordUse("readability");

    var sentences = text.split(/[.!?]+/).filter(function (s) { return s.trim().length > 0; });
    var words = text.split(/\s+/);
    var totalSyllables = 0;
    words.forEach(function (w) { totalSyllables += countSyllables(w); });

    var wc = words.length;
    var sc = Math.max(1, sentences.length);
    var avgWPS = (wc / sc).toFixed(1);
    var flesch = 206.835 - 1.015 * (wc / sc) - 84.6 * (totalSyllables / wc);
    flesch = Math.max(0, Math.min(100, Math.round(flesch)));

    var grade;
    if (flesch >= 80) grade = "5th grade (very easy)";
    else if (flesch >= 60) grade = "8th grade (standard)";
    else if (flesch >= 40) grade = "College (difficult)";
    else grade = "Graduate (very difficult)";

    /* Long sentences */
    var longSentences = sentences.filter(function (s) { return s.trim().split(/\s+/).length > 20; }).length;

    /* Passive voice (simple heuristic) */
    var passiveCount = (text.match(/\b(is|was|were|are|been|being)\s+\w+ed\b/gi) || []).length;

    document.getElementById("readability-score").textContent = flesch;
    document.getElementById("readability-score").className = "big-score " + (flesch >= 60 ? "score-good" : flesch >= 40 ? "score-ok" : "score-bad");
    document.getElementById("readability-grade").textContent = grade;
    document.getElementById("readability-avgwps").textContent = avgWPS;
    document.getElementById("readability-long").textContent = longSentences ? longSentences + " sentence" + (longSentences > 1 ? "s" : "") + " over 20 words" : "None — great!";
    document.getElementById("readability-passive").textContent = passiveCount ? passiveCount + " instance" + (passiveCount > 1 ? "s" : "") + " detected" : "None found";

    var verdict;
    if (flesch >= 70) verdict = "Excellent readability. Your audience will have no trouble understanding this.";
    else if (flesch >= 50) verdict = "Good readability. Consider shortening a few sentences for broader appeal.";
    else verdict = "Difficult to read. Try shorter sentences, simpler words, and active voice.";
    document.getElementById("readability-verdict").textContent = verdict;
    toast("Readability analysis complete", "success");
  }

  /* ═══════════════════════════════════════════════════
     TOOL 8 · Email Subject Tester
     ═══════════════════════════════════════════════════ */
  var SPAM_WORDS = ["free", "winner", "congratulations", "act now", "urgent", "limited time", "click here", "buy now", "order now", "discount", "cash", "lowest price", "guarantee", "no obligation", "risk-free", "100%"];
  var EMAIL_POWER_WORDS = ["discover", "proven", "secret", "exclusive", "instant", "new", "you", "your", "how", "why", "alert", "breaking", "mistake", "transform", "unlock"];

  function runEmail() {
    if (!canUse("email")) { toast("Daily limit reached — upgrade to Pro", "info"); window.OccApp.showUpgradeModal(); return; }
    var subject = (document.getElementById("email-subject").value || "").trim();
    if (!subject) { toast("Enter a subject line", "info"); return; }
    recordUse("email");

    var score = 50;
    var len = subject.length;
    var lower = subject.toLowerCase();

    /* Length scoring: 30-60 chars is ideal for mobile */
    if (len >= 30 && len <= 60) score += 20;
    else if (len >= 20 && len <= 70) score += 10;
    else if (len > 70) score -= 10;

    /* Spam check */
    var spamCount = 0;
    SPAM_WORDS.forEach(function (w) { if (lower.indexOf(w) !== -1) spamCount++; });
    score -= spamCount * 8;

    /* Power words */
    var powerCount = 0;
    EMAIL_POWER_WORDS.forEach(function (w) { if (lower.indexOf(w) !== -1) powerCount++; });
    score += powerCount * 6;

    /* Bonus: starts with number, has question, personalization */
    if (/^\d/.test(subject)) score += 5;
    if (/\?$/.test(subject)) score += 5;
    if (/\byou\b|\byour\b/i.test(subject)) score += 5;
    /* Penalty: ALL CAPS */
    if (subject === subject.toUpperCase() && subject.length > 3) score -= 15;
    /* Penalty: excessive punctuation */
    if (/[!]{2,}|[?]{2,}/.test(subject)) score -= 10;

    score = Math.max(0, Math.min(100, score));

    document.getElementById("email-score").textContent = score + "/100";
    document.getElementById("email-score").className = "big-score " + (score >= 70 ? "score-good" : score >= 45 ? "score-ok" : "score-bad");
    document.getElementById("email-len").textContent = len + " chars " + (len >= 30 && len <= 60 ? "(ideal for mobile)" : len > 60 ? "(may get truncated)" : "(short)");
    document.getElementById("email-spam").textContent = spamCount ? spamCount + " spam trigger" + (spamCount > 1 ? "s" : "") + " found" : "Clean — no spam triggers";
    document.getElementById("email-spam").className = spamCount ? "metric-bad" : "metric-good";
    document.getElementById("email-power").textContent = powerCount ? powerCount + " power word" + (powerCount > 1 ? "s" : "") : "No power words — consider adding one";
    document.getElementById("email-preview-subject").textContent = subject;
    document.getElementById("email-preview-preview").textContent = subject.length > 40 ? subject.slice(0, 40) + "..." : subject;
    toast("Subject line scored", "success");
  }

  /* ═══════════════════════════════════════════════════
     TOOL 9 · SEO Meta Preview
     ═══════════════════════════════════════════════════ */
  function escHTML(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  function runSEO() {
    if (!canUse("seo")) { toast("Daily limit reached — upgrade to Pro", "info"); window.OccApp.showUpgradeModal(); return; }
    var title = (document.getElementById("seo-title").value || "").trim();
    var desc = (document.getElementById("seo-desc").value || "").trim();
    var url = (document.getElementById("seo-url").value || "").trim();
    if (!title) { toast("Enter a page title", "info"); return; }
    recordUse("seo");

    var score = 50;
    var tips = [];

    /* Title length: 50-60 is ideal */
    if (title.length >= 50 && title.length <= 60) { score += 15; }
    else if (title.length < 30) { score -= 10; tips.push("Title is too short — aim for 50-60 characters"); }
    else if (title.length > 60) { tips.push("Title may be truncated — keep under 60 chars"); }
    else { score += 5; }

    /* Description length: 120-155 is ideal */
    if (desc.length >= 120 && desc.length <= 155) { score += 15; }
    else if (desc.length < 70) { score -= 10; tips.push("Meta description is too short — aim for 120-155 characters"); }
    else if (desc.length > 155) { tips.push("Description may be truncated in SERP"); }
    else { score += 5; }

    /* Power word in title */
    var hasPower = false;
    POWER_WORDS.forEach(function (w) { if (title.toLowerCase().indexOf(w) !== -1) hasPower = true; });
    if (hasPower) { score += 10; } else { tips.push("Add a power word to the title for better CTR"); }

    /* Number in title */
    if (/\d/.test(title)) { score += 5; } else { tips.push("Headlines with numbers get more clicks"); }

    if (!url) tips.push("Add a URL for the full SERP preview");
    if (!tips.length) tips.push("Looking good! Your meta tags are well-optimized.");

    score = Math.max(0, Math.min(100, score));

    /* SERP preview */
    var serpTitle = document.getElementById("serp-title");
    var serpUrl = document.getElementById("serp-url");
    var serpDesc = document.getElementById("serp-desc");
    if (serpTitle) serpTitle.textContent = title.length > 60 ? title.slice(0, 57) + "..." : title;
    if (serpUrl) serpUrl.textContent = url || "example.com";
    if (serpDesc) serpDesc.textContent = desc.length > 155 ? desc.slice(0, 152) + "..." : desc || "No description provided";

    document.getElementById("seo-score").textContent = score + "/100";
    document.getElementById("seo-score").className = "big-score " + (score >= 70 ? "score-good" : score >= 45 ? "score-ok" : "score-bad");

    var tipsList = document.getElementById("seo-tips");
    tipsList.innerHTML = "";
    tips.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; tipsList.appendChild(li); });

    /* HTML snippet */
    var html = '<title>' + escHTML(title) + '</title>\n<meta name="description" content="' + escHTML(desc) + '">';
    document.getElementById("seo-html").textContent = html;
    toast("SEO preview generated", "success");
  }

  function copySEOHTML() {
    var html = document.getElementById("seo-html").textContent;
    if (!html) return;
    navigator.clipboard.writeText(html).then(function () { toast("HTML copied!", "success"); }).catch(function () { toast("Copy failed", "error"); });
  }

  /* ═══════════════════════════════════════════════════
     TOOL 10 · Social Post Formatter (PRO)
     ═══════════════════════════════════════════════════ */
  function extractHashtags(text) {
    var words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(function (w) { return w.length > 3; });
    var freq = {};
    words.forEach(function (w) { freq[w] = (freq[w] || 0) + 1; });
    return Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 5).map(function (w) { return "#" + w; });
  }

  function runSocial() {
    if (!canUse("social")) { toast("Social Post is a Pro feature", "info"); window.OccApp.showUpgradeModal(); return; }
    var text = (document.getElementById("social-input").value || "").trim();
    if (!text) { toast("Type a message to format", "info"); return; }
    recordUse("social");

    var tags = extractHashtags(text);
    var tagStr = tags.join(" ");

    /* X: 280 char limit, concise */
    var xText = text.length > 250 ? text.slice(0, 247) + "..." : text;
    if (xText.length + tagStr.length + 2 <= 280) xText += "\n\n" + tagStr;

    /* LinkedIn: professional, longer form */
    var liText = text + "\n\n" + tagStr + "\n\n#marketing #strategy";

    /* Instagram: emoji-rich, hashtag block */
    var igText = text + "\n\n.\n.\n.\n" + tagStr + " #marketing #digitalmarketing #content";

    /* Threads: casual, conversational */
    var thText = text.replace(/\.$/, "") + " \u2014 thoughts? " + tags.slice(0, 3).join(" ");

    document.getElementById("social-x-text").textContent = xText;
    document.getElementById("social-li-text").textContent = liText;
    document.getElementById("social-ig-text").textContent = igText;
    document.getElementById("social-th-text").textContent = thText;
    document.getElementById("social-x-count").textContent = xText.length + "/280";
    document.getElementById("social-li-count").textContent = liText.length + "/3000";
    document.getElementById("social-ig-count").textContent = igText.length + "/2200";
    document.getElementById("social-th-count").textContent = thText.length + "/500";
    toast("Formatted for 4 platforms", "success");
  }

  /* ═══════════════════════════════════════════════════
     TOAST
     ═══════════════════════════════════════════════════ */
  function toast(msg, type) {
    var c = document.getElementById("toast-container");
    if (!c) return;
    var t = document.createElement("div");
    t.className = "toast toast--" + (type || "info");
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(function () { t.style.opacity = "0"; setTimeout(function () { t.remove(); }, 300); }, 3200);
  }

  /* ═══════════════════════════════════════════════════
     NAV SCROLL OBSERVATION
     ═══════════════════════════════════════════════════ */
  function initScrollSpy() {
    var sections = document.querySelectorAll("section[id]");
    if (!sections.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var id = e.target.id;
          document.querySelectorAll(".nav__link").forEach(function (l) {
            l.classList.toggle("active", l.getAttribute("href") === "#" + id);
          });
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (s) { obs.observe(s); });
  }

  /* ═══════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════ */
  function init() {
    initTabs();
    initScrollSpy();
    updateUsageBar();
    initStreak();
    updateGamificationUI();

    /* Wire tool buttons */
    var btnClarity = document.getElementById("btn-clarity");
    if (btnClarity) btnClarity.addEventListener("click", runClarity);

    var btnClaritySample = document.getElementById("clarity-sample");
    if (btnClaritySample) btnClaritySample.addEventListener("click", window.OccApp.loadClaritySample);

    var btnBrand = document.getElementById("btn-brand");
    if (btnBrand) btnBrand.addEventListener("click", runBrand);

    var btnUTM = document.getElementById("btn-utm");
    if (btnUTM) btnUTM.addEventListener("click", runUTM);

    var btnCopyUTM = document.getElementById("utm-copy");
    if (btnCopyUTM) btnCopyUTM.addEventListener("click", copyUTM);

    var btnTone = document.getElementById("btn-tone");
    if (btnTone) btnTone.addEventListener("click", runTone);

    var btnHeadline = document.getElementById("btn-headline");
    if (btnHeadline) btnHeadline.addEventListener("click", runHeadline);

    var btnReadability = document.getElementById("btn-readability");
    if (btnReadability) btnReadability.addEventListener("click", runReadability);

    var btnEmail = document.getElementById("btn-email");
    if (btnEmail) btnEmail.addEventListener("click", runEmail);

    var btnSeo = document.getElementById("btn-seo");
    if (btnSeo) btnSeo.addEventListener("click", runSEO);

    var btnSeoCopy = document.getElementById("seo-copy");
    if (btnSeoCopy) btnSeoCopy.addEventListener("click", copySEOHTML);

    var btnSocial = document.getElementById("btn-social");
    if (btnSocial) btnSocial.addEventListener("click", runSocial);

    /* Word Counter: live input */
    var counterInput = document.getElementById("counter-input");
    if (counterInput) {
      counterInput.addEventListener("input", runCounter);
      runCounter();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
