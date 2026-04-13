/* ═══════════════════════════════════════════════════
   Occasus Lab — App Engine v5
   Firebase Auth · Freemium Usage · 10 Tools · Gamification
   ═══════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── Firebase ─────────────────────────────────── */
  var db = null, auth = null, currentUser = null, isPro = false;
  var firebaseReady = false;
  var currentLang = localStorage.getItem("occ_lang") === "fr" ? "fr" : "en";
  var activeTool = "clarity";

  var UI_TEXT = {
    en: {
      docTitle: "Occasus Lab | Clarity Service for Founders",
      metaDescription: "Turn messy messaging into clear positioning before you spend on marketing. Free tier with guided clarity workflow, Pro for unlimited execution.",
      ogTitle: "Occasus Lab | Clarity Service for Founders",
      ogDescription: "A repeatable clarity method with practical tools: diagnose your message, rewrite with precision, and scale with Pro.",
      navTools: "Tools",
      navPricing: "Pricing",
      navBlog: "Blog",
      signIn: "Sign in",
      freePlan: "Free Plan",
      adminPanel: "Admin panel",
      signOut: "Sign out",
      heroTag: "Clarity service + tools — free to start",
      heroTitle: "Get your core message right<br>before you spend on marketing.",
      heroSub: "Occasus Lab combines a repeatable clarity method with practical tools so founders and consultants can ship sharper positioning, faster.",
      heroStart: "Start free clarity workflow",
      heroPricing: "See pricing →",
      toolsTag: "Clarity workspace",
      toolsTitle: "One method, ten tools, clearer positioning.",
      toolNavTag: "Tool navigator",
      toolNavCopy: "Pick one task, move through the tools without hunting, and keep the workspace focused on one action at a time.",
      chooseTool: "Choose your tool",
      prevTool: "← Previous",
      nextTool: "Next →",
      usageLink: "Upgrade for unlimited →",
      pricingTag: "Simple pricing",
      pricingTitle: "Start free. Upgrade when clarity becomes mission-critical.",
      ctaTitle: "Ready to lead with a clearer message?",
      ctaText: "Start with the free clarity workflow. Upgrade when you need unlimited execution and team velocity.",
      ctaButton: "Open clarity workspace",
      authTitle: "Sign in to Occasus Lab",
      authText: "Save your work, unlock Pro features, and access your history across devices.",
      authGoogle: "Continue with Google",
      authFooter: "Free plan activates instantly. Upgrade anytime.",
      footerBrand: "Occasus Lab — Personal Project",
      footerTools: "Tools",
      footerPricing: "Pricing",
      footerBlog: "Blog",
      footerAdmin: "Admin",
      toolDayLabel: "day",
      toolDaysLabel: "days",
      dailyChallengeComplete: "Complete! +50 XP bonus",
      dailyChallengePending: "Use 3 different tools",
      choosePlanTitle: "Upgrade to Pro",
      upgradeText: "Unlimited access, versioning, and premium exports for teams that need consistent messaging.",
      toolInputText: "Your original text",
      clarityBtn: "Rewrite for clarity",
      claritySample: "Load example",
      brandBtn: "Generate messaging",
      utmBtn: "Build URL",
      copyResult: "Copy result",
      toneBtn: "Analyze tone",
      headlineBtn: "Score headlines",
      readabilityBtn: "Analyze readability",
      emailBtn: "Score subject line",
      seoBtn: "Generate preview",
      seoCopy: "Copy HTML",
      socialBtn: "Format for all platforms"
    },
    fr: {
      docTitle: "Occasus Lab | Service de clarte pour fondateurs",
      metaDescription: "Transformez un message confus en positionnement clair avant de depenser en marketing. Offre gratuite guidee, Pro pour execution illimitee.",
      ogTitle: "Occasus Lab | Service de clarte pour fondateurs",
      ogDescription: "Une methode de clarte repetable avec des outils pratiques: diagnostic, reecriture precise, puis passage a l'echelle avec Pro.",
      navTools: "Outils",
      navPricing: "Tarifs",
      navBlog: "Blog",
      signIn: "Connexion",
      freePlan: "Plan gratuit",
      adminPanel: "Admin",
      signOut: "Déconnexion",
      heroTag: "Service de clarte + outils — gratuit pour commencer",
      heroTitle: "Clarifiez votre message central<br>avant d'investir en marketing.",
      heroSub: "Occasus Lab combine une methode de clarte repetable et des outils pratiques pour aider fondateurs et consultants a positionner plus vite.",
      heroStart: "Demarrer le parcours gratuit",
      heroPricing: "Voir les tarifs →",
      toolsTag: "Espace clarte",
      toolsTitle: "Une methode, dix outils, un positionnement plus net.",
      toolNavTag: "Navigation outils",
      toolNavCopy: "Choisis une tâche, passe d'un outil à l'autre sans chercher, et garde l'espace de travail centré sur une action à la fois.",
      chooseTool: "Choisir un outil",
      prevTool: "← Précédent",
      nextTool: "Suivant →",
      usageLink: "Passer en illimité →",
      pricingTag: "Tarification simple",
      pricingTitle: "Commencez gratuitement. Passez en Pro quand la clarte devient critique.",
      ctaTitle: "Pret a communiquer avec plus de clarte ?",
      ctaText: "Commencez avec le parcours gratuit. Passez en Pro pour une execution illimitee et collaborative.",
      ctaButton: "Ouvrir l'espace clarte",
      authTitle: "Se connecter à Occasus Lab",
      authText: "Sauvegarde ton travail, débloque les fonctionnalités Pro et retrouve ton historique sur tous tes appareils.",
      authGoogle: "Continuer avec Google",
      authFooter: "Le plan gratuit s'active instantanément. Upgrade à tout moment.",
      footerBrand: "Occasus Lab — Projet personnel",
      footerTools: "Outils",
      footerPricing: "Tarifs",
      footerBlog: "Blog",
      footerAdmin: "Admin",
      toolDayLabel: "jour",
      toolDaysLabel: "jours",
      dailyChallengeComplete: "Complété ! +50 XP bonus",
      dailyChallengePending: "Utilise 3 outils différents",
      choosePlanTitle: "Passer en Pro",
      upgradeText: "Acces illimite, versioning et exports premium pour les equipes qui exigent une communication coherente.",
      toolInputText: "Texte original",
      clarityBtn: "Réécrire clairement",
      claritySample: "Charger un exemple",
      brandBtn: "Générer le message",
      utmBtn: "Créer l'URL",
      copyResult: "Copier le résultat",
      toneBtn: "Analyser le ton",
      headlineBtn: "Noter les titres",
      readabilityBtn: "Analyser la lisibilité",
      emailBtn: "Noter l'objet",
      seoBtn: "Générer l'aperçu",
      seoCopy: "Copier le HTML",
      socialBtn: "Adapter à toutes les plateformes"
    }
  };

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

  function t(key) {
    return (UI_TEXT[currentLang] && UI_TEXT[currentLang][key]) || UI_TEXT.en[key] || key;
  }

  function setText(selector, value) {
    var el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function setHTML(selector, value) {
    var el = document.querySelector(selector);
    if (el) el.innerHTML = value;
  }

  function setPlaceholder(selector, value) {
    var el = document.querySelector(selector);
    if (el) el.setAttribute("placeholder", value);
  }

  function setLabel(forId, value) {
    var el = document.querySelector('label[for="' + forId + '"]');
    if (el) el.textContent = value;
  }

  function applyToolButtonLabels() {
    document.querySelectorAll(".tabs__btn").forEach(function (btn, index) {
      var label = currentLang === "fr" ? btn.dataset.labelFr : btn.dataset.labelEn;
      var num = String(index + 1).padStart(2, "0");
      btn.innerHTML = '<span class="tabs__num">' + num + '</span> ' + label + (btn.classList.contains("tabs__btn--pro") ? ' <span class="pro-badge">PRO</span>' : '');
      btn.setAttribute("aria-label", label);
      var option = document.querySelector('#tool-select option[value="' + btn.dataset.tool + '"]');
      if (option) option.textContent = num + " — " + label;
    });
  }

  function applyLanguage() {
    document.documentElement.lang = currentLang;
    document.title = t("docTitle");
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", t("metaDescription"));
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", t("ogTitle"));
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", t("ogDescription"));

    document.querySelectorAll(".lang-switch__btn").forEach(function (btn) {
      btn.classList.toggle("lang-switch__btn--active", btn.dataset.lang === currentLang);
    });

    setText('.nav__link[href="#tools"]', t("navTools"));
    setText('.nav__link[href="#pricing"]', t("navPricing"));
    setText('.nav__link[href="blog.html"]', t("navBlog"));
    setText("#btn-signin", t("signIn"));
    setText("#user-plan", isPro ? "Pro Plan" : t("freePlan"));
    setText("#admin-link", t("adminPanel"));
    setText(".avatar-dropdown .btn", t("signOut"));

    setText(".hero .tag", t("heroTag"));
    setHTML(".hero h1", t("heroTitle"));
    setText(".hero__sub", t("heroSub"));
    setText('.hero__actions .btn--primary[href="#tools"]', t("heroStart"));
    setText('.hero__actions .btn--ghost[href="#pricing"]', t("heroPricing"));

    setText("#tools .section__head .tag", t("toolsTag"));
    setText("#tools .section__head h2", t("toolsTitle"));
    setText(".tool-nav__intro .tag", t("toolNavTag"));
    setText(".tool-nav__copy", t("toolNavCopy"));
    setText('.tool-mobile-switch__label[for="tool-select"]', t("chooseTool"));
    setText("#tool-prev", t("prevTool"));
    setText("#tool-next", t("nextTool"));
    setText(".usage-bar__link", t("usageLink"));

    setText('#pricing .section__head .tag', t("pricingTag"));
    setText('#pricing .section__head h2', t("pricingTitle"));
    setText('.cta-banner h2', t("ctaTitle"));
    setText('.cta-banner p', t("ctaText"));
    setText('.cta-banner .btn', t("ctaButton"));
    setText('#auth-modal h2', t("authTitle"));
    setText('#auth-modal p', t("authText"));
    setText('#google-signin-text', t("authGoogle"));
    setText('#auth-modal .modal__footer', t("authFooter"));
    setText('#upgrade-modal h2', t("choosePlanTitle"));
    setText('#upgrade-modal p', t("upgradeText"));
    setText('.footer__brand p', t("footerBrand"));
    setText('.footer__links a[href="#tools"]', t("footerTools"));
    setText('.footer__links a[href="#pricing"]', t("footerPricing"));
    setText('.footer__links a[href="blog.html"]', t("footerBlog"));
    setText('.footer__links a[href="admin.html"]', t("footerAdmin"));

    setLabel("clarity-input", t("toolInputText"));
    setText("#btn-clarity", t("clarityBtn"));
    setText("#clarity-sample", t("claritySample"));
    setText("#btn-brand", t("brandBtn"));
    setText("#btn-utm", t("utmBtn"));
    setText("#utm-copy", t("copyResult"));
    setText("#btn-tone", t("toneBtn"));
    setText("#btn-headline", t("headlineBtn"));
    setText("#btn-readability", t("readabilityBtn"));
    setText("#btn-email", t("emailBtn"));
    setText("#btn-seo", t("seoBtn"));
    setText("#seo-copy", t("seoCopy"));
    setText("#btn-social", t("socialBtn"));

    setLabel("brand-product", currentLang === "fr" ? "Nom du produit" : "Product name");
    setLabel("audience", currentLang === "fr" ? "Audience" : "Audience");
    setLabel("problem", currentLang === "fr" ? "Problème principal" : "Main problem");
    setLabel("outcome", currentLang === "fr" ? "Résultat attendu" : "Desired outcome");
    setLabel("difference", currentLang === "fr" ? "Différenciation clé" : "Key difference");
    setLabel("proof", currentLang === "fr" ? "Preuve ou crédibilité" : "Proof or credibility");
    setLabel("tone", currentLang === "fr" ? "Ton" : "Tone");
    setLabel("base-url", currentLang === "fr" ? "URL de base" : "Base URL");
    setLabel("utm-source", currentLang === "fr" ? "Source" : "Source");
    setLabel("utm-medium", currentLang === "fr" ? "Canal" : "Medium");
    setLabel("utm-campaign", currentLang === "fr" ? "Campagne" : "Campaign");
    setLabel("utm-content", currentLang === "fr" ? "Contenu" : "Content");
    setLabel("utm-term", currentLang === "fr" ? "Terme" : "Term");
    setLabel("tone-input", currentLang === "fr" ? "Collez votre texte" : "Paste your text");
    setLabel("headline-input", currentLang === "fr" ? "Entrez votre titre" : "Enter your headline");
    setLabel("headline-input-2", currentLang === "fr" ? "Alternative (optionnel)" : "Alternative (optional)");
    setLabel("counter-input", currentLang === "fr" ? "Votre texte" : "Your text");
    setLabel("readability-input", currentLang === "fr" ? "Collez votre texte" : "Paste your text");
    setLabel("email-subject", currentLang === "fr" ? "Objet de l'email" : "Subject line");
    setLabel("seo-title", currentLang === "fr" ? "Titre de la page" : "Page title");
    setLabel("seo-desc", currentLang === "fr" ? "Meta description" : "Meta description");
    setLabel("seo-url", currentLang === "fr" ? "URL de la page" : "Page URL");
    setLabel("social-input", currentLang === "fr" ? "Message central" : "Core message");

    setPlaceholder("#clarity-input", currentLang === "fr" ? "Collez ici un texte marketing confus..." : "Paste messy marketing copy here...");
    setPlaceholder("#tone-input", currentLang === "fr" ? "Collez un texte marketing, un email ou une page de vente..." : "Paste marketing copy, email, or landing page text...");
    setPlaceholder("#headline-input", currentLang === "fr" ? "ex. Comment écrire un texte qui convertit en 30 secondes" : "e.g. How to write copy that converts in 30 seconds");
    setPlaceholder("#headline-input-2", currentLang === "fr" ? "Comparer avec un second titre" : "Compare with a second headline");
    setPlaceholder("#counter-input", currentLang === "fr" ? "Collez ou écrivez du texte..." : "Paste or type text...");
    setPlaceholder("#readability-input", currentLang === "fr" ? "Collez un texte marketing, une landing page ou un article..." : "Paste marketing copy, landing page text, or blog post...");
    setPlaceholder("#email-subject", currentLang === "fr" ? "ex. Vous laissez de l'argent sur la table" : "e.g. You're leaving money on the table");
    setPlaceholder("#seo-title", currentLang === "fr" ? "Ma landing page" : "My Awesome Landing Page");
    setPlaceholder("#seo-desc", currentLang === "fr" ? "Une description convaincante..." : "A compelling description...");
    setPlaceholder("#social-input", currentLang === "fr" ? "Écris ton message principal..." : "Type your core message...");

    applyToolButtonLabels();
    updateToolStageHeader();
    updateGamificationUI();
    updateUsageBar();
  }

  function setLanguage(lang) {
    currentLang = lang === "fr" ? "fr" : "en";
    localStorage.setItem("occ_lang", currentLang);
    applyLanguage();
  }

  function updateToolStageHeader() {
    var btns = Array.prototype.slice.call(document.querySelectorAll(".tabs__btn"));
    if (!btns.length) return;
    var index = btns.findIndex(function (btn) { return btn.dataset.tool === activeTool; });
    if (index < 0) index = 0;
    var btn = btns[index];
    var label = currentLang === "fr" ? btn.dataset.labelFr : btn.dataset.labelEn;
    var desc = currentLang === "fr" ? btn.dataset.descFr : btn.dataset.descEn;
    setText("#tool-current-step", String(index + 1).padStart(2, "0") + " / " + btns.length);
    setText("#tool-current-title", label);
    setText("#tool-current-desc", desc);

    var select = document.getElementById("tool-select");
    if (select) select.value = activeTool;
  }

  /* ── Limits ───────────────────────────────────── */
  var LIMITS = (typeof FREE_LIMITS !== "undefined") ? FREE_LIMITS : { clarity: 3, brand: 1, utm: 999, tone: 0, headline: 0, counter: 999, readability: 999, email: 999, seo: 999, social: 0 };

  /* ── Gamification ─────────────────────────────── */
  var XP_VALUES = { clarity: 15, brand: 20, utm: 5, tone: 15, headline: 15, counter: 5, readability: 10, email: 10, seo: 10, social: 15 };
  var TOOL_NAMES = { clarity: "Message Clarity Engine", brand: "Positioning Builder", utm: "UTM Builder", tone: "Tone Analyzer", headline: "Headline Scorer", counter: "Word Counter", readability: "Readability", email: "Email Subject", seo: "SEO Preview", social: "Social Post" };
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

  function pruneDailyTools(g) {
    if (!g.dailyTools) return;
    var keys = Object.keys(g.dailyTools).sort();
    if (keys.length <= 30) return;
    keys.slice(0, keys.length - 30).forEach(function (k) { delete g.dailyTools[k]; });
  }

  function getConsecutivePowerDays(g) {
    var daily = g.dailyTools || {};
    var days = Object.keys(daily).sort();
    if (!days.length) return 0;
    var streak = 0;
    var prev = null;
    for (var i = 0; i < days.length; i++) {
      var day = days[i];
      var tools = daily[day] || {};
      var used = Object.keys(tools).length;
      if (used < 3) {
        streak = 0;
        prev = day;
        continue;
      }
      if (!prev) {
        streak = 1;
        prev = day;
        continue;
      }
      var prevDate = new Date(prev);
      var currDate = new Date(day);
      var diff = Math.round((currDate - prevDate) / 86400000);
      streak = (diff === 1) ? streak + 1 : 1;
      prev = day;
    }
    return streak;
  }

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
    var today = todayKey();
    g.lastDay = today;
    if (tool) {
      if (!g.toolsUsed) g.toolsUsed = {};
      g.toolsUsed[tool] = (g.toolsUsed[tool] || 0) + 1;
      if (!g.dailyTools) g.dailyTools = {};
      if (!g.dailyTools[today]) g.dailyTools[today] = {};
      g.dailyTools[today][tool] = true;
    }
    pruneDailyTools(g);
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
    var tu = g.toolsUsed || {};
    var earned = [];
    var today = todayKey();

    if (!g.dailyTools) g.dailyTools = {};

    /* Daily challenge bonus: one-time +50 XP once 3 different tools are used in a day */
    var todayTools = g.dailyTools[today] ? Object.keys(g.dailyTools[today]).length : 0;
    if (todayTools >= 3 && g.dailyChallengeBonusDate !== today) {
      g.xp = (g.xp || 0) + 50;
      g.dailyChallengeBonusDate = today;
      toast(currentLang === "fr" ? "Défi quotidien complété ! +50 XP" : "Daily challenge complete! +50 XP", "success");
    }

    if (g.badges.indexOf("first-draft") === -1 && Object.keys(tu).length > 0) earned.push("first-draft");
    if (g.badges.indexOf("daily-grinder") === -1 && (g.streak || 0) >= 7) earned.push("daily-grinder");
    if (g.badges.indexOf("tool-explorer") === -1) {
      var allTools = Object.keys(TOOL_NAMES);
      var usedAll = allTools.every(function (t) { return (tu[t] || 0) > 0; });
      if (usedAll) earned.push("tool-explorer");
    }
    if (g.badges.indexOf("headline-hero") === -1 && g.headlineHeroUnlocked) earned.push("headline-hero");
    if (g.badges.indexOf("clarity-master") === -1 && (tu.clarity || 0) >= 20) earned.push("clarity-master");
    if (g.badges.indexOf("word-wizard") === -1 && (g.totalWords || 0) >= 10000) earned.push("word-wizard");
    if (g.badges.indexOf("power-user") === -1 && getConsecutivePowerDays(g) >= 5) earned.push("power-user");
    if (g.badges.indexOf("perfectionist") === -1 && (g.sameTextClarityStreak || 0) >= 3) earned.push("perfectionist");

    if (earned.length) {
      g.badges = g.badges.concat(earned);
      saveGamification(g);
      earned.forEach(function (b) { showBadgeUnlock(b); });
    } else {
      saveGamification(g);
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
    if (gs) gs.innerHTML = "&#128293; " + (g.streak || 0) + " " + ((g.streak || 0) !== 1 ? t("toolDaysLabel") : t("toolDayLabel"));
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
    if (gc) gc.textContent = toolsToday >= 3 ? t("dailyChallengeComplete") : t("dailyChallengePending") + " (" + toolsToday + "/3)";

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
      if (dropPlan) dropPlan.textContent = isPro ? "Pro Plan" : t("freePlan");
      /* Show admin link for whitelisted emails */
      var adminLink = document.getElementById("admin-link");
      var ADMIN_EMAILS = ["andrew.neuburger@community.isunet.edu", "andrew.neuburger@isunet.edu"];
      if (adminLink) {
        adminLink.textContent = t("adminPanel");
        if (ADMIN_EMAILS.indexOf(currentUser.email) !== -1) adminLink.classList.remove("hidden");
      }
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
    if (text) text.textContent = currentLang === "fr" ? total + " / " + max + " usages gratuits aujourd'hui" : total + " / " + max + " free uses today";
  }

  /* ── Guided diagnostic (Gate B) ───────────────── */
  function runDiagnostic() {
    var offer = (document.getElementById("diag-offer") || {}).value || "";
    var audience = (document.getElementById("diag-audience") || {}).value || "";
    var difference = (document.getElementById("diag-difference") || {}).value || "";
    var pain = (document.getElementById("diag-pain") || {}).value || "too-vague";
    var current = (document.getElementById("diag-current") || {}).value || "";

    if (!offer.trim() || !audience.trim() || !difference.trim()) {
      toast(currentLang === "fr" ? "Renseigne offre, audience et difference" : "Fill in offer, audience, and differentiation", "info");
      return;
    }

    var penalties = 0;
    var gapLabel = "Focus";
    if (pain === "too-vague") { penalties += 3; gapLabel = currentLang === "fr" ? "Precision" : "Precision"; }
    if (pain === "too-long") { penalties += 2; gapLabel = currentLang === "fr" ? "Concision" : "Concision"; }
    if (pain === "too-generic") { penalties += 3; gapLabel = currentLang === "fr" ? "Differenciation" : "Differentiation"; }
    if (pain === "wrong-audience") { penalties += 3; gapLabel = currentLang === "fr" ? "Audience fit" : "Audience fit"; }
    if (!current.trim()) penalties += 1;

    var currentScore = Math.max(3, 9 - penalties);
    var potential = Math.min(10, currentScore + 4);

    var report = currentLang === "fr"
      ? "Votre message montre du potentiel, mais il manque de structure actionnable. Priorite: clarifier la promesse pour " + audience + " et expliciter ce qui rend " + offer + " distinctif."
      : "Your message has strong potential but lacks actionable structure. Priority: clarify the promise for " + audience + " and make the differentiator of " + offer + " explicit.";

    var seed = current.trim() || (offer + " for " + audience + ". " + difference + ".");
    var next = currentLang === "fr"
      ? "Passez dans Message Clarity Engine pour transformer ce brouillon en positionnement net, puis sauvegardez votre meilleure version."
      : "Move to Message Clarity Engine to turn this draft into clear positioning, then save your strongest version.";

    var elCurrent = document.getElementById("diag-current-score");
    var elPotential = document.getElementById("diag-potential-score");
    var elGap = document.getElementById("diag-gap");
    var elReport = document.getElementById("diag-report");
    var elNext = document.getElementById("diag-next");
    if (elCurrent) elCurrent.textContent = currentScore + "/10";
    if (elPotential) elPotential.textContent = potential + "/10";
    if (elGap) elGap.textContent = gapLabel;
    if (elReport) elReport.textContent = report;
    if (elNext) elNext.textContent = next;

    try { localStorage.setItem("occ_diag_seed", seed); } catch (e) {}
    toast(currentLang === "fr" ? "Clarity Report genere" : "Clarity Report generated", "success");
  }

  function jumpToClarityFromDiagnostic() {
    var seed = "";
    try { seed = localStorage.getItem("occ_diag_seed") || ""; } catch (e) {}
    var input = document.getElementById("clarity-input");
    if (input && seed) input.value = seed;
    if (window.OccApp && typeof window.OccApp.activateTool === "function") {
      window.OccApp.activateTool("clarity");
    }
    var tools = document.getElementById("tools");
    if (tools && tools.scrollIntoView) tools.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ── OccApp global (called from HTML) ────────── */
  function mapAuthError(err) {
    if (!err || !err.code) return "Sign-in error.";
    if (err.code === "auth/popup-closed-by-user") return "Sign-in popup was closed.";
    if (err.code === "auth/unauthorized-domain") {
      var host = window.location.hostname;
      return "Unauthorized domain. Add " + host + " in Firebase Authentication > Settings > Authorized domains.";
    }
    if (err.code === "auth/operation-not-allowed") return "Google provider is disabled in Firebase Authentication.";
    if (err.code === "auth/network-request-failed") return "Network error during sign-in.";
    return "Sign-in error: " + (err.message || err.code);
  }

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
      provider.setCustomParameters({ prompt: "select_account" });
      auth.signInWithPopup(provider).then(function () {
        window.OccApp.closeModals();
        toast("Welcome back!", "success");
      }).catch(function (err) {
        if (err.code !== "auth/popup-closed-by-user") toast(mapAuthError(err), "error");
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
      if (!firebaseReady || !auth) {
        toast("Payments require Firebase configuration", "info");
        return;
      }
      if (!currentUser) {
        window.OccApp.closeModals();
        window.OccApp.showAuthModal();
        return;
      }
      if (typeof BACKEND_CONFIG === "undefined" || !BACKEND_CONFIG.checkoutEndpoint) {
        toast("Billing backend is not configured yet", "info");
        return;
      }

      var plan = window.OccApp.selectedPlan || "monthly";
      if (!["monthly", "yearly"].includes(plan)) {
        toast("Invalid plan selected", "error");
        return;
      }

      currentUser.getIdToken(true).then(function (idToken) {
        return fetch(BACKEND_CONFIG.checkoutEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + idToken
          },
          body: JSON.stringify({
            plan: plan,
            origin: window.location.origin
          })
        });
      }).then(function (res) {
        return res.json().then(function (payload) { return { ok: res.ok, payload: payload }; });
      }).then(function (result) {
        if (!result.ok) {
          throw new Error((result.payload && result.payload.error) || "Unable to create checkout session");
        }
        if (!result.payload || !result.payload.url) {
          throw new Error("Missing checkout URL");
        }
        window.location.href = result.payload.url;
      }).catch(function (err) {
        toast("Upgrade failed: " + err.message, "error");
      });
    },
    toggleAvatarDrop: function () {
      var d = document.getElementById("avatar-dropdown");
      if (d) d.classList.toggle("hidden");
    },
    loadClaritySample: function () {
      var input = document.getElementById("clarity-input");
      if (!input) return;
      input.value = currentLang === "fr"
        ? "Notre solution intégrée aide les équipes en croissance à structurer un storytelling à fort impact et un positionnement lisible sur des canaux digitaux fragmentés."
        : "Our cross-functional integrated solution empowers growth-stage teams to operationalize high-impact storytelling and scalable positioning across fragmented digital channels.";
      toast(currentLang === "fr" ? "Exemple chargé" : "Example loaded", "info");
    },
    copySocial: function (platform) {
      var el = document.getElementById("social-" + platform + "-text");
      if (!el || !el.textContent) return;
      navigator.clipboard.writeText(el.textContent).then(function () { toast("Copied!", "success"); }).catch(function () { toast("Copy failed", "error"); });
    },
    loadClarityVersion: loadClarityVersionById
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
    var btns = Array.prototype.slice.call(wrap.querySelectorAll(".tabs__btn"));
    var select = document.getElementById("tool-select");
    var prev = document.getElementById("tool-prev");
    var next = document.getElementById("tool-next");

    function activateTool(tool) {
      activeTool = tool;
      btns.forEach(function (btn) {
        var selected = btn.dataset.tool === tool;
        btn.classList.toggle("tabs__btn--active", selected);
        btn.setAttribute("aria-selected", selected ? "true" : "false");
      });
      document.querySelectorAll(".panel").forEach(function (p) {
        p.classList.toggle("panel--active", p.id === "panel-" + tool);
      });
      updateToolStageHeader();
    }

    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        activateTool(btn.dataset.tool);
      });
    });

    if (select) {
      btns.forEach(function (btn) {
        var option = document.createElement("option");
        option.value = btn.dataset.tool;
        select.appendChild(option);
      });
      select.addEventListener("change", function () {
        activateTool(select.value);
      });
    }

    if (prev) {
      prev.addEventListener("click", function () {
        var index = btns.findIndex(function (btn) { return btn.dataset.tool === activeTool; });
        activateTool(btns[(index - 1 + btns.length) % btns.length].dataset.tool);
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        var index = btns.findIndex(function (btn) { return btn.dataset.tool === activeTool; });
        activateTool(btns[(index + 1) % btns.length].dataset.tool);
      });
    }

    window.OccApp.activateTool = activateTool;
    applyToolButtonLabels();
    activateTool(activeTool);
  }

    /* ═══════════════════════════════════════════════════
      TOOL 1 · Message Clarity Engine
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
  var CLARITY_HISTORY_KEY = "occ_clarity_versions";

  function getClarityHistory() {
    try {
      var parsed = JSON.parse(localStorage.getItem(CLARITY_HISTORY_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function setClarityHistory(items) {
    localStorage.setItem(CLARITY_HISTORY_KEY, JSON.stringify(items));
  }

  function renderClarityHistory() {
    var list = document.getElementById("clarity-history");
    if (!list) return;
    var items = getClarityHistory();
    list.innerHTML = "";
    if (!items.length) {
      var empty = document.createElement("li");
      empty.textContent = currentLang === "fr" ? "Aucune version enregistree" : "No saved versions yet";
      list.appendChild(empty);
      return;
    }
    items.forEach(function (v, i) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn--ghost btn--sm";
      btn.setAttribute("data-clarity-id", v.id);
      btn.textContent = (currentLang === "fr" ? "Version " : "Version ") + (items.length - i) + " - " + new Date(v.createdAt).toLocaleString();
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function saveClarityVersion() {
    var input = (document.getElementById("clarity-input") || {}).value || "";
    var output = (document.getElementById("clarity-output") || {}).textContent || "";
    if (!output.trim()) {
      toast(currentLang === "fr" ? "Genere d'abord une version" : "Generate a version first", "info");
      return;
    }

    var items = getClarityHistory();
    var max = isPro ? 50 : 3;
    if (!isPro && items.length >= max) {
      toast(currentLang === "fr" ? "Limite gratuite: 3 versions. Passe en Pro." : "Free limit: 3 saved versions. Upgrade to Pro.", "info");
      window.OccApp.showUpgradeModal();
      return;
    }

    var id = "cv-" + Date.now();
    var version = {
      id: id,
      createdAt: new Date().toISOString(),
      input: input,
      output: output,
      reduction: (document.getElementById("clarity-reduction") || {}).textContent || ""
    };
    items.unshift(version);
    if (items.length > max) items = items.slice(0, max);
    setClarityHistory(items);
    renderClarityHistory();

    if (firebaseReady && currentUser) {
      db.collection("users").doc(currentUser.uid).collection("clarity_versions").doc(id).set(version).catch(function () {});
    }

    toast(currentLang === "fr" ? "Version enregistree" : "Version saved", "success");
  }

  function loadLatestClarityVersion() {
    var items = getClarityHistory();
    if (!items.length) {
      toast(currentLang === "fr" ? "Aucune version enregistree" : "No saved version yet", "info");
      return;
    }
    loadClarityVersionById(items[0].id);
  }

  function loadClarityVersionById(id) {
    var items = getClarityHistory();
    var found = items.find(function (v) { return v.id === id; });
    if (!found) return;
    var input = document.getElementById("clarity-input");
    var output = document.getElementById("clarity-output");
    if (input) input.value = found.input || "";
    if (output) output.textContent = found.output || "";
    if (found.input) {
      var recomputed = rewriteClarity(found.input);
      if (recomputed) {
        document.getElementById("clarity-jargon").textContent = recomputed.jargon;
        document.getElementById("clarity-fillers").textContent = recomputed.fillers;
        document.getElementById("clarity-reduction").textContent = recomputed.reduction + "%";
        var notesList = document.getElementById("clarity-notes");
        if (notesList) {
          notesList.innerHTML = "";
          recomputed.notes.forEach(function (n) { var li = document.createElement("li"); li.textContent = n; notesList.appendChild(li); });
        }
      }
    }
    toast(currentLang === "fr" ? "Version chargee" : "Version loaded", "success");
  }

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
    if (currentLang === "fr") {
      if (j) notes.push("Remplacement de " + j + " terme" + (j > 1 ? "s" : "") + " trop jargonneux par un langage plus simple");
      if (f) notes.push("Suppression de " + f + " mot" + (f > 1 ? "s" : "") + " de remplissage");
      if (s) notes.push("Découpage de " + s + " phrase" + (s > 1 ? "s" : "") + " trop longue");
      if (!notes.length) notes.push("Le texte est déjà clair — aucun changement nécessaire");
    } else {
      if (j) notes.push("Replaced " + j + " jargon term" + (j > 1 ? "s" : "") + " with plain language");
      if (f) notes.push("Removed " + f + " filler word" + (f > 1 ? "s" : ""));
      if (s) notes.push("Split " + s + " long sentence" + (s > 1 ? "s" : ""));
      if (!notes.length) notes.push("Text is already clear — no changes needed");
    }
    return notes;
  }

  function runClarity() {
    if (!canUse("clarity")) { toast(currentLang === "fr" ? "Limite du jour atteinte — passe en Pro pour un accès illimité" : "Daily limit reached — upgrade to Pro for unlimited", "info"); window.OccApp.showUpgradeModal(); return; }
    var text = document.getElementById("clarity-input").value;
    var result = rewriteClarity(text);
    if (!result) { toast(currentLang === "fr" ? "Colle un texte à réécrire" : "Paste some text to rewrite", "info"); return; }
    recordUse("clarity");
    document.getElementById("clarity-output").textContent = result.rewritten;
    document.getElementById("clarity-jargon").textContent = result.jargon;
    document.getElementById("clarity-fillers").textContent = result.fillers;
    document.getElementById("clarity-reduction").textContent = result.reduction + "%";
    var notesList = document.getElementById("clarity-notes");
    notesList.innerHTML = "";
    result.notes.forEach(function (n) { var li = document.createElement("li"); li.textContent = n; notesList.appendChild(li); });

    var g = getGamification();
    var normalized = (text || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (normalized && normalized === g.lastClarityText) g.sameTextClarityStreak = (g.sameTextClarityStreak || 0) + 1;
    else g.sameTextClarityStreak = 1;
    g.lastClarityText = normalized;
    saveGamification(g);
    checkBadges();

    toast(currentLang === "fr" ? "Analyse de clarté terminée" : "Clarity analysis complete", "success");
  }

    /* ═══════════════════════════════════════════════════
      TOOL 2 · Positioning Builder
      ═══════════════════════════════════════════════════ */
  function runBrand() {
    if (!canUse("brand")) { toast(currentLang === "fr" ? "Limite du jour atteinte — passe en Pro" : "Daily limit reached — upgrade to Pro", "info"); window.OccApp.showUpgradeModal(); return; }
    var product = document.getElementById("brand-product").value.trim();
    var audience = document.getElementById("audience").value.trim();
    var problem = document.getElementById("problem").value.trim();
    var outcome = document.getElementById("outcome").value.trim();
    var tone = document.getElementById("tone").value;

    if (!product || !audience || !problem) { toast(currentLang === "fr" ? "Renseigne au minimum le produit, l'audience et le problème" : "Fill in at least product, audience, and problem", "info"); return; }
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

    var tagline = currentLang === "fr"
      ? capitalize(product) + " clarifie " + problem + "."
      : capitalize(problem.split(" ").slice(0, 3).join(" ")) + "? " + capitalize(product) + ".";
    var elevator = currentLang === "fr"
      ? product + " aide " + audience + " à résoudre " + problem + (outcome ? " pour obtenir " + outcome : "") + ". L'approche est " + adj + "."
      : product + " helps " + audience + " solve " + problem + (outcome ? " so they can " + outcome : "") + ". Our approach is " + adj + ".";
    var headline = currentLang === "fr"
      ? "Arrête de subir le flou. Commence à clarifier."
      : "Stop " + gerund(problem.split(" ")[0]) + ". Start " + gerund((outcome || "winning").split(" ")[0]) + ".";
    var cta = currentLang === "fr"
      ? ((tone === "bold" || tone === "direct") ? "Commencer maintenant ->" : (tone === "friendly" || tone === "warm") ? "On le construit ensemble" : "En savoir plus ->")
      : ((tone === "bold" || tone === "direct") ? "Get started now ->" : (tone === "friendly" || tone === "warm") ? "Let's make it happen" : "Learn more ->");

    document.getElementById("positioning-output").textContent = tagline;
    document.getElementById("value-output").textContent = elevator;
    document.getElementById("lead-output").textContent = headline;
    document.getElementById("brand-cta").textContent = cta;
    toast(currentLang === "fr" ? "Positionnement genere" : "Positioning generated", "success");
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
    toast(currentLang === "fr" ? "Lien UTM généré" : "UTM link generated", "success");
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

    if ((s1 && s1.grade === "A") || (h2 && s2 && s2.grade === "A")) {
      var g = getGamification();
      g.headlineHeroUnlocked = true;
      saveGamification(g);
      checkBadges();
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
    if (!text) { toast(currentLang === "fr" ? "Colle un texte à analyser" : "Paste some text to analyze", "info"); return; }
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
    if (flesch >= 80) grade = currentLang === "fr" ? "Très facile" : "5th grade (very easy)";
    else if (flesch >= 60) grade = currentLang === "fr" ? "Standard" : "8th grade (standard)";
    else if (flesch >= 40) grade = currentLang === "fr" ? "Difficile" : "College (difficult)";
    else grade = currentLang === "fr" ? "Très difficile" : "Graduate (very difficult)";

    /* Long sentences */
    var longSentences = sentences.filter(function (s) { return s.trim().split(/\s+/).length > 20; }).length;

    /* Passive voice (simple heuristic) */
    var passiveCount = (text.match(/\b(is|was|were|are|been|being)\s+\w+ed\b/gi) || []).length;

    document.getElementById("readability-score").textContent = flesch;
    document.getElementById("readability-score").className = "big-score " + (flesch >= 60 ? "score-good" : flesch >= 40 ? "score-ok" : "score-bad");
    document.getElementById("readability-grade").textContent = grade;
    document.getElementById("readability-avgwps").textContent = avgWPS;
    document.getElementById("readability-long").textContent = currentLang === "fr"
      ? (longSentences ? longSentences + " phrase" + (longSentences > 1 ? "s" : "") + " de plus de 20 mots" : "Aucune — très bien")
      : (longSentences ? longSentences + " sentence" + (longSentences > 1 ? "s" : "") + " over 20 words" : "None — great!");
    document.getElementById("readability-passive").textContent = currentLang === "fr"
      ? (passiveCount ? passiveCount + " occurrence" + (passiveCount > 1 ? "s" : "") + " détectée" + (passiveCount > 1 ? "s" : "") : "Aucune détectée")
      : (passiveCount ? passiveCount + " instance" + (passiveCount > 1 ? "s" : "") + " detected" : "None found");

    var verdict;
    if (flesch >= 70) verdict = currentLang === "fr" ? "Excellente lisibilité. Ton audience comprendra facilement ce texte." : "Excellent readability. Your audience will have no trouble understanding this.";
    else if (flesch >= 50) verdict = currentLang === "fr" ? "Bonne lisibilité. Tu peux encore raccourcir quelques phrases pour élargir l'impact." : "Good readability. Consider shortening a few sentences for broader appeal.";
    else verdict = currentLang === "fr" ? "Le texte est difficile à lire. Essaie des phrases plus courtes, des mots plus simples et une voix plus active." : "Difficult to read. Try shorter sentences, simpler words, and active voice.";
    document.getElementById("readability-verdict").textContent = verdict;
    toast(currentLang === "fr" ? "Analyse de lisibilité terminée" : "Readability analysis complete", "success");
  }

  /* ═══════════════════════════════════════════════════
     TOOL 8 · Email Subject Tester
     ═══════════════════════════════════════════════════ */
  var SPAM_WORDS = ["free", "winner", "congratulations", "act now", "urgent", "limited time", "click here", "buy now", "order now", "discount", "cash", "lowest price", "guarantee", "no obligation", "risk-free", "100%"];
  var EMAIL_POWER_WORDS = ["discover", "proven", "secret", "exclusive", "instant", "new", "you", "your", "how", "why", "alert", "breaking", "mistake", "transform", "unlock"];

  function runEmail() {
    if (!canUse("email")) { toast("Daily limit reached — upgrade to Pro", "info"); window.OccApp.showUpgradeModal(); return; }
    var subject = (document.getElementById("email-subject").value || "").trim();
    if (!subject) { toast(currentLang === "fr" ? "Entre un objet d'email" : "Enter a subject line", "info"); return; }
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
    document.getElementById("email-len").textContent = currentLang === "fr"
      ? len + " caractères " + (len >= 30 && len <= 60 ? "(idéal sur mobile)" : len > 60 ? "(peut être tronqué)" : "(court)")
      : len + " chars " + (len >= 30 && len <= 60 ? "(ideal for mobile)" : len > 60 ? "(may get truncated)" : "(short)");
    document.getElementById("email-spam").textContent = currentLang === "fr"
      ? (spamCount ? spamCount + " déclencheur" + (spamCount > 1 ? "s" : "") + " spam trouvé" + (spamCount > 1 ? "s" : "") : "Propre — aucun déclencheur spam")
      : (spamCount ? spamCount + " spam trigger" + (spamCount > 1 ? "s" : "") + " found" : "Clean — no spam triggers");
    document.getElementById("email-spam").className = spamCount ? "metric-bad" : "metric-good";
    document.getElementById("email-power").textContent = currentLang === "fr"
      ? (powerCount ? powerCount + " mot" + (powerCount > 1 ? "s" : "") + " puissant" + (powerCount > 1 ? "s" : "") : "Aucun mot puissant — pense à en ajouter un")
      : (powerCount ? powerCount + " power word" + (powerCount > 1 ? "s" : "") : "No power words — consider adding one");
    document.getElementById("email-preview-subject").textContent = subject;
    document.getElementById("email-preview-preview").textContent = subject.length > 40 ? subject.slice(0, 40) + "..." : subject;
    toast(currentLang === "fr" ? "Objet d'email noté" : "Subject line scored", "success");
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
    if (!title) { toast(currentLang === "fr" ? "Entre un titre de page" : "Enter a page title", "info"); return; }
    recordUse("seo");

    var score = 50;
    var tips = [];

    /* Title length: 50-60 is ideal */
    if (title.length >= 50 && title.length <= 60) { score += 15; }
    else if (title.length < 30) { score -= 10; tips.push(currentLang === "fr" ? "Le titre est trop court — vise 50 à 60 caractères" : "Title is too short — aim for 50-60 characters"); }
    else if (title.length > 60) { tips.push(currentLang === "fr" ? "Le titre peut être tronqué — reste sous 60 caractères" : "Title may be truncated — keep under 60 chars"); }
    else { score += 5; }

    /* Description length: 120-155 is ideal */
    if (desc.length >= 120 && desc.length <= 155) { score += 15; }
    else if (desc.length < 70) { score -= 10; tips.push(currentLang === "fr" ? "La meta description est trop courte — vise 120 à 155 caractères" : "Meta description is too short — aim for 120-155 characters"); }
    else if (desc.length > 155) { tips.push(currentLang === "fr" ? "La description peut être tronquée dans les résultats de recherche" : "Description may be truncated in SERP"); }
    else { score += 5; }

    /* Power word in title */
    var hasPower = false;
    POWER_WORDS.forEach(function (w) { if (title.toLowerCase().indexOf(w) !== -1) hasPower = true; });
    if (hasPower) { score += 10; } else { tips.push(currentLang === "fr" ? "Ajoute un mot fort dans le titre pour améliorer le CTR" : "Add a power word to the title for better CTR"); }

    /* Number in title */
    if (/\d/.test(title)) { score += 5; } else { tips.push(currentLang === "fr" ? "Les titres avec des chiffres obtiennent plus de clics" : "Headlines with numbers get more clicks"); }

    if (!url) tips.push(currentLang === "fr" ? "Ajoute une URL pour l'aperçu SERP complet" : "Add a URL for the full SERP preview");
    if (!tips.length) tips.push(currentLang === "fr" ? "Très bien. Tes balises meta sont bien optimisées." : "Looking good! Your meta tags are well-optimized.");

    score = Math.max(0, Math.min(100, score));

    /* SERP preview */
    var serpTitle = document.getElementById("serp-title");
    var serpUrl = document.getElementById("serp-url");
    var serpDesc = document.getElementById("serp-desc");
    if (serpTitle) serpTitle.textContent = title.length > 60 ? title.slice(0, 57) + "..." : title;
    if (serpUrl) serpUrl.textContent = url || "example.com";
    if (serpDesc) serpDesc.textContent = desc.length > 155 ? desc.slice(0, 152) + "..." : desc || (currentLang === "fr" ? "Aucune description fournie" : "No description provided");

    document.getElementById("seo-score").textContent = score + "/100";
    document.getElementById("seo-score").className = "big-score " + (score >= 70 ? "score-good" : score >= 45 ? "score-ok" : "score-bad");

    var tipsList = document.getElementById("seo-tips");
    tipsList.innerHTML = "";
    tips.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; tipsList.appendChild(li); });

    /* HTML snippet */
    var html = '<title>' + escHTML(title) + '</title>\n<meta name="description" content="' + escHTML(desc) + '">';
    document.getElementById("seo-html").textContent = html;
    toast(currentLang === "fr" ? "Aperçu SEO généré" : "SEO preview generated", "success");
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
    applyLanguage();

    document.querySelectorAll(".lang-switch__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLanguage(btn.dataset.lang);
      });
    });

    /* Wire tool buttons */
    var btnClarity = document.getElementById("btn-clarity");
    if (btnClarity) btnClarity.addEventListener("click", runClarity);

    var btnClaritySample = document.getElementById("clarity-sample");
    if (btnClaritySample) btnClaritySample.addEventListener("click", window.OccApp.loadClaritySample);

    var btnClaritySave = document.getElementById("clarity-save");
    if (btnClaritySave) btnClaritySave.addEventListener("click", saveClarityVersion);

    var btnClarityLoadLatest = document.getElementById("clarity-load-latest");
    if (btnClarityLoadLatest) btnClarityLoadLatest.addEventListener("click", loadLatestClarityVersion);

    var clarityHistory = document.getElementById("clarity-history");
    if (clarityHistory) {
      clarityHistory.addEventListener("click", function (e) {
        var target = e.target;
        if (target && target.getAttribute && target.getAttribute("data-clarity-id")) {
          loadClarityVersionById(target.getAttribute("data-clarity-id"));
        }
      });
      renderClarityHistory();
    }

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

    var btnDiagnostic = document.getElementById("btn-diagnostic");
    if (btnDiagnostic) btnDiagnostic.addEventListener("click", runDiagnostic);

    var btnDiagToClarity = document.getElementById("btn-diag-to-clarity");
    if (btnDiagToClarity) btnDiagToClarity.addEventListener("click", jumpToClarityFromDiagnostic);

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
