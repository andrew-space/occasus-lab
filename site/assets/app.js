/* ═══════════════════════════════════════════════════
   Occasus Lab — App Engine v4
   10 Tools · Gamification · Firebase Auth
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
  } catch (e) { console.warn("Firebase not configured — local mode.", e); }

  /* ── Limits ───────────────────────────────────── */
  var LIMITS = (typeof FREE_LIMITS !== "undefined") ? FREE_LIMITS
    : { clarity:5, brand:3, utm:999, counter:999, readability:5, email:5, seo:5, headline:0, tone:0, social:0 };
  var XP_VALUES = { clarity:10, brand:10, utm:10, counter:10, readability:10, email:15, seo:15, headline:25, tone:25, social:25 };
  var TOOL_NAMES = {
    clarity:"Clarity Rewriter", brand:"Brand Messaging", utm:"UTM Builder",
    counter:"Word Counter", readability:"Readability Analyzer", email:"Email Subject Tester",
    seo:"SEO Meta Preview", headline:"Headline Scorer", tone:"Tone Analyzer", social:"Social Formatter"
  };

  function todayKey() { return new Date().toISOString().slice(0,10); }

  /* ── Usage Tracking ───────────────────────────── */
  function getUsage() {
    try {
      var d = JSON.parse(localStorage.getItem("occ_usage") || "{}");
      if (d.date !== todayKey()) d = { date:todayKey(), clarity:0, brand:0, utm:0, counter:0, readability:0, email:0, seo:0, headline:0, tone:0, social:0 };
      return d;
    } catch(e) { return { date:todayKey(), clarity:0, brand:0, utm:0, counter:0, readability:0, email:0, seo:0, headline:0, tone:0, social:0 }; }
  }
  function saveUsage(u) { localStorage.setItem("occ_usage", JSON.stringify(u)); }
  function canUse(tool) {
    if (isPro) return true;
    var u = getUsage();
    return (u[tool]||0) < (LIMITS[tool]||0);
  }
  function recordUse(tool) {
    var u = getUsage();
    u[tool] = (u[tool]||0) + 1;
    saveUsage(u);
    updateUsageBar();
    addXP(XP_VALUES[tool]||10, tool);
    if (firebaseReady && currentUser) {
      db.collection("usage").doc(currentUser.uid).set(u, { merge:true }).catch(function(){});
    }
  }

  /* ═══════════════════════════════════════════════════
     GAMIFICATION ENGINE
     ═══════════════════════════════════════════════════ */
  var LEVELS = [
    { name:"Intern", min:0 },
    { name:"Junior", min:100 },
    { name:"Strategist", min:500 },
    { name:"Manager", min:1500 },
    { name:"Director", min:3500 },
    { name:"CMO", min:7000 },
    { name:"Legend", min:15000 }
  ];

  var BADGES = {
    "first-draft":    { icon:"\uD83D\uDCDD", name:"First Draft",       desc:"Use any tool for the first time", check:function(g){ return g.totalUses >= 1; } },
    "daily-grinder":  { icon:"\uD83D\uDCAA", name:"Daily Grinder",     desc:"Reach a 7-day streak",            check:function(g){ return g.streak >= 7; } },
    "tool-explorer":  { icon:"\uD83C\uDFC6", name:"Tool Explorer",     desc:"Use every tool at least once",    check:function(g){ return Object.keys(g.toolsUsed||{}).length >= 10; } },
    "headline-hero":  { icon:"\uD83C\uDF1F", name:"Headline Hero",     desc:"Score 10+ headlines above 85",    check:function(g){ return (g.headlinesAbove85||0) >= 10; } },
    "clarity-master": { icon:"\u2600\uFE0F", name:"Clarity Master",    desc:"Run 20 clarity rewrites",         check:function(g){ return (g.toolsUsed||{}).clarity >= 20; } },
    "word-wizard":    { icon:"\uD83D\uDCDA", name:"Word Wizard",       desc:"Count 10,000+ words",             check:function(g){ return (g.wordsProcessed||0) >= 10000; } },
    "power-user":     { icon:"\u26A1",       name:"Power User",        desc:"Use 3+ tools in a single session, 5 days", check:function(g){ return (g.powerUserDays||0) >= 5; } },
    "perfectionist":  { icon:"\uD83D\uDC8E", name:"Perfectionist",     desc:"Rewrite and improve 3x in one session",   check:function(g){ return (g.rewrites||0) >= 3; } }
  };

  function getGameState() {
    try { return JSON.parse(localStorage.getItem("occ_game")||"{}"); }
    catch(e) { return {}; }
  }
  function saveGameState(g) { localStorage.setItem("occ_game", JSON.stringify(g)); }

  function initStreak() {
    var g = getGameState();
    var today = todayKey();
    if (!g.lastActive) { g.lastActive = today; g.streak = 1; g.totalUses = g.totalUses||0; g.xp = g.xp||0; g.toolsUsed = g.toolsUsed||{}; g.badges = g.badges||[]; }
    else {
      var last = new Date(g.lastActive);
      var now = new Date(today);
      var diff = Math.round((now - last) / 86400000);
      if (diff === 1) { g.streak = (g.streak||0) + 1; }
      else if (diff > 1) { g.streak = 1; }
      g.lastActive = today;
    }
    saveGameState(g);
    return g;
  }

  function addXP(amount, tool) {
    var g = getGameState();
    g.xp = (g.xp||0) + amount;
    g.totalUses = (g.totalUses||0) + 1;
    if (!g.toolsUsed) g.toolsUsed = {};
    g.toolsUsed[tool] = (g.toolsUsed[tool]||0) + 1;
    if (!g.sessionTools) g.sessionTools = {};
    g.sessionTools[tool] = true;
    g.lastActive = todayKey();
    saveGameState(g);
    checkBadges(g);
    updateGamificationUI(g);
  }

  function getLevel(xp) {
    for (var i = LEVELS.length-1; i >= 0; i--) {
      if (xp >= LEVELS[i].min) return { level:LEVELS[i], index:i, next: LEVELS[i+1] || null };
    }
    return { level:LEVELS[0], index:0, next:LEVELS[1] };
  }

  function checkBadges(g) {
    if (!g.badges) g.badges = [];
    Object.keys(BADGES).forEach(function(key) {
      if (g.badges.indexOf(key) === -1 && BADGES[key].check(g)) {
        g.badges.push(key);
        saveGameState(g);
        showBadgeUnlock(key);
      }
    });
  }

  function showBadgeUnlock(key) {
    var b = BADGES[key];
    var modal = document.getElementById("badge-modal");
    if (!modal) return;
    var icon = document.getElementById("badge-modal-icon");
    var title = document.getElementById("badge-modal-title");
    var desc = document.getElementById("badge-modal-desc");
    if (icon) icon.textContent = b.icon;
    if (title) title.textContent = b.name + " Unlocked!";
    if (desc) desc.textContent = b.desc;
    modal.classList.remove("hidden");
    /* auto-close after 3s */
    setTimeout(function(){ modal.classList.add("hidden"); }, 3000);
  }

  function updateGamificationUI(g) {
    if (!g) g = getGameState();
    var info = getLevel(g.xp||0);

    /* Nav pills */
    var sc = document.getElementById("streak-count");
    if (sc) sc.textContent = g.streak || 0;
    var xl = document.getElementById("xp-level");
    if (xl) xl.textContent = info.level.name;
    var xp = document.getElementById("xp-points");
    if (xp) xp.textContent = (g.xp||0) + " XP";
    var xf = document.getElementById("xp-fill");
    if (xf && info.next) {
      var pct = Math.min(100, Math.round(((g.xp||0) - info.level.min) / (info.next.min - info.level.min) * 100));
      xf.style.width = pct + "%";
    } else if (xf) { xf.style.width = "100%"; }

    /* Dashboard */
    var gs = document.getElementById("gf-streak");
    if (gs) gs.innerHTML = "&#128293; " + (g.streak||0) + " day" + ((g.streak||0)!==1?"s":"");
    var gl = document.getElementById("gf-level");
    if (gl) gl.textContent = info.level.name;
    var gx = document.getElementById("gf-xp");
    if (gx) gx.textContent = (g.xp||0);
    var gt = document.getElementById("gf-tools-today");
    if (gt) gt.textContent = Object.keys(g.sessionTools||{}).length + " / 10";

    /* Badges */
    var badgeRow = document.getElementById("badges-row");
    if (badgeRow) {
      var items = badgeRow.querySelectorAll(".badge-item");
      items.forEach(function(item) {
        var key = item.dataset.badge;
        if ((g.badges||[]).indexOf(key) !== -1) {
          item.classList.remove("badge-item--locked");
          item.classList.add("badge-item--earned");
        }
      });
    }

    /* Daily challenge */
    var gc = document.getElementById("gf-challenge");
    if (gc) {
      var toolsToday = Object.keys(g.sessionTools||{}).length;
      if (toolsToday >= 3) gc.innerHTML = '<span style="color:var(--green)">&#10003; Challenge complete!</span>';
      else gc.textContent = "Use " + (3-toolsToday) + " more tool" + ((3-toolsToday)!==1?"s":"");
    }
  }

  /* ── Auth ──────────────────────────────────────── */
  if (firebaseReady) {
    auth.onAuthStateChanged(function(user) {
      currentUser = user;
      if (user) {
        db.collection("users").doc(user.uid).set({
          email:user.email, displayName:user.displayName, photoURL:user.photoURL,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge:true });
        db.collection("users").doc(user.uid).get().then(function(doc) {
          isPro = doc.exists && doc.data().isPro === true;
          updateAuthUI(); updateProGates(); updateUsageBar();
        });
      } else { isPro = false; updateAuthUI(); updateProGates(); updateUsageBar(); }
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
      if (img) img.src = currentUser.photoURL || "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser.displayName||"U") + "&background=fdb54f&color=121212&size=72";
      var dropName = document.getElementById("user-name");
      var dropEmail = document.getElementById("user-email");
      var dropPlan = document.getElementById("user-plan");
      if (dropName) dropName.textContent = currentUser.displayName || "";
      if (dropEmail) dropEmail.textContent = currentUser.email || "";
      if (dropPlan) dropPlan.textContent = isPro ? "Pro Plan" : "Free Plan";
      var adminLink = document.getElementById("admin-link");
      var ADMIN_EMAILS = ["andrew.neuburger@community.isunet.edu","andrew.neuburger@isunet.edu"];
      if (adminLink && ADMIN_EMAILS.indexOf(currentUser.email) !== -1) adminLink.classList.remove("hidden");
    } else {
      signInBtn.classList.remove("hidden");
      avatarMenu.classList.add("hidden");
    }
  }

  function updateProGates() {
    document.querySelectorAll(".pro-gate").forEach(function(g) { g.classList.toggle("unlocked", isPro); });
  }

  function updateUsageBar() {
    var bar = document.getElementById("usage-bar");
    if (!bar) return;
    if (isPro) { bar.classList.add("hidden"); return; }
    bar.classList.remove("hidden");
    var u = getUsage();
    var total = (u.clarity||0)+(u.brand||0)+(u.readability||0)+(u.email||0)+(u.seo||0);
    var max = LIMITS.clarity + LIMITS.brand + LIMITS.readability + LIMITS.email + LIMITS.seo;
    var pct = Math.min(100, Math.round((total/max)*100));
    var fill = bar.querySelector(".usage-bar__fill");
    var text = bar.querySelector(".usage-bar__text");
    if (fill) { fill.style.width = pct+"%"; fill.classList.toggle("usage-bar__fill--warn", pct >= 80); }
    if (text) text.textContent = (max-total) + " free uses left today";
  }

  /* ── OccApp Global ────────────────────────────── */
  window.OccApp = {
    showAuthModal: function() { var m=document.getElementById("auth-modal"); if(m) m.classList.remove("hidden"); },
    closeModals: function() { document.querySelectorAll(".modal-backdrop").forEach(function(m){ m.classList.add("hidden"); }); },
    googleSignIn: function() {
      if (!firebaseReady) { toast("Firebase not configured","error"); return; }
      var provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).then(function(){ window.OccApp.closeModals(); toast("Welcome back!","success"); })
        .catch(function(err){ if(err.code!=="auth/popup-closed-by-user") toast("Sign-in error: "+err.message,"error"); });
    },
    signOut: function() { if(auth) auth.signOut(); currentUser=null; isPro=false; updateAuthUI(); updateProGates(); toast("Signed out","info"); },
    showUpgradeModal: function() { var m=document.getElementById("upgrade-modal"); if(m) m.classList.remove("hidden"); },
    selectedPlan: "yearly",
    selectPlan: function(plan) {
      window.OccApp.selectedPlan = plan;
      document.querySelectorAll(".upgrade-option").forEach(function(o){ o.classList.toggle("upgrade-option--active", o.dataset.plan===plan); });
    },
    processUpgrade: function() {
      if (!currentUser) { window.OccApp.closeModals(); window.OccApp.showAuthModal(); return; }
      db.collection("users").doc(currentUser.uid).update({ isPro:true }).then(function(){
        isPro=true; updateAuthUI(); updateProGates(); updateUsageBar(); window.OccApp.closeModals();
        toast("Welcome to Pro! All 10 tools unlocked.","success");
      }).catch(function(){ toast("Upgrade failed","error"); });
    },
    toggleAvatarDrop: function() { var d=document.getElementById("avatar-dropdown"); if(d) d.classList.toggle("hidden"); },

    /* ── Tool Card Navigation ────────────────────── */
    openTool: function(tool) {
      var ws = document.getElementById("tool-workspace");
      var cards = document.getElementById("tool-cards");
      var title = document.getElementById("tool-workspace__title");
      if (!ws || !cards) return;
      /* hide card grid, show workspace */
      cards.classList.add("hidden");
      document.getElementById("usage-bar").classList.add("hidden");
      ws.classList.remove("hidden");
      /* show correct panel */
      document.querySelectorAll("#tool-workspace .panel").forEach(function(p){ p.style.display = "none"; });
      var panel = document.getElementById("panel-" + tool);
      if (panel) panel.style.display = "block";
      if (title) title.innerHTML = '<span class="tool-workspace__icon">' + getToolIcon(tool) + '</span> ' + (TOOL_NAMES[tool]||tool);
      ws.scrollIntoView({ behavior:"smooth", block:"start" });
    },
    closeTool: function() {
      var ws = document.getElementById("tool-workspace");
      var cards = document.getElementById("tool-cards");
      if (ws) ws.classList.add("hidden");
      if (cards) cards.classList.remove("hidden");
      updateUsageBar();
      document.getElementById("tools").scrollIntoView({ behavior:"smooth", block:"start" });
    },

    /* Social copy helpers */
    copySocial: function(platform) {
      var map = { x:"social-x-text", li:"social-li-text", ig:"social-ig-text", th:"social-th-text" };
      var el = document.getElementById(map[platform]);
      if (el) navigator.clipboard.writeText(el.textContent).then(function(){ toast("Copied!","success"); }).catch(function(){ toast("Copy failed","error"); });
    }
  };

  function getToolIcon(tool) {
    var icons = { clarity:"\u270F\uFE0F", brand:"\uD83C\uDFAF", utm:"\uD83D\uDD17", counter:"\uD83D\uDD22", readability:"\uD83D\uDCD6", email:"\u2709\uFE0F", seo:"\uD83D\uDD0D", headline:"\uD83C\uDFC6", tone:"\uD83C\uDFA8", social:"\uD83D\uDCE1" };
    return icons[tool] || "";
  }

  /* close dropdown on outside click */
  document.addEventListener("click", function(e) {
    var d = document.getElementById("avatar-dropdown");
    if (d && !d.classList.contains("hidden") && !e.target.closest(".avatar-menu")) d.classList.add("hidden");
  });
  document.addEventListener("click", function(e) {
    if (e.target.classList.contains("modal-backdrop")) window.OccApp.closeModals();
  });

  /* ═══════════════════════════════════════════════════
     TOOL ENGINES
     ═══════════════════════════════════════════════════ */

  /* ── 1. Clarity Rewriter ──────────────────────── */
  window.OccApp.runClarity = function() {
    var input = document.getElementById("clarity-input").value.trim();
    if (!input) { toast("Paste some text first","warn"); return; }
    if (!canUse("clarity")) { toast("Daily limit reached — Upgrade to Pro","warn"); window.OccApp.showUpgradeModal(); return; }
    var output = document.getElementById("clarity-output");
    output.textContent = "Rewriting…";
    setTimeout(function() {
      var result = clarityEngine(input);
      output.textContent = result;
      recordUse("clarity");
      var g = getGameState(); g.rewrites = (g.rewrites||0)+1; saveGameState(g); checkBadges(g);
      toast("+10 XP — Clarity","success");
    }, 600);
  };

  function clarityEngine(text) {
    var rules = [
      [/\b(in order to)\b/gi, "to"],
      [/\b(due to the fact that)\b/gi, "because"],
      [/\b(at this point in time)\b/gi, "now"],
      [/\b(in the event that)\b/gi, "if"],
      [/\b(has the ability to)\b/gi, "can"],
      [/\b(it is important to note that)\b/gi, "notably,"],
      [/\b(a large number of)\b/gi, "many"],
      [/\b(in spite of the fact that)\b/gi, "although"],
      [/\b(on a daily basis)\b/gi, "daily"],
      [/\b(at the present time)\b/gi, "currently"],
      [/\b(for the purpose of)\b/gi, "to"],
      [/\b(in close proximity to)\b/gi, "near"],
      [/\b(make a decision)\b/gi, "decide"],
      [/\b(take into consideration)\b/gi, "consider"],
      [/\b(is able to)\b/gi, "can"],
      [/\b(give an indication of)\b/gi, "indicate"],
      [/\b(in the near future)\b/gi, "soon"],
      [/\b(with regard to)\b/gi, "about"],
      [/\b(each and every)\b/gi, "every"],
      [/\b(first and foremost)\b/gi, "first"],
      [/\b(whether or not)\b/gi, "whether"],
      [/\b(completely eliminate)\b/gi, "eliminate"],
      [/\b(completely finish)\b/gi, "finish"],
      [/\b(absolutely essential)\b/gi, "essential"],
      [/\b(basic fundamentals)\b/gi, "fundamentals"],
      [/\b(very unique)\b/gi, "unique"],
      [/\b(past experience)\b/gi, "experience"],
      [/\b(advance planning)\b/gi, "planning"],
      [/\b(free gift)\b/gi, "gift"],
      [/\b(end result)\b/gi, "result"],
      [/\b(utilize)\b/gi, "use"],
      [/\b(leverage)\b/gi, "use"],
      [/\b(synergize)\b/gi, "combine"],
      [/\b(paradigm)\b/gi, "model"],
      [/\b(robust)\b/gi, "strong"],
      [/\b(endeavor)\b/gi, "try"],
      [/\b(facilitate)\b/gi, "help"],
      [/\b(optimal)\b/gi, "best"],
      [/\b(subsequently)\b/gi, "then"],
      [/\b(commence)\b/gi, "start"],
      [/\b(furthermore)\b/gi, "also"],
      [/\b(nevertheless)\b/gi, "still"]
    ];
    var out = text;
    var changes = 0;
    rules.forEach(function(r) {
      if (r[0].test(out)) { changes++; out = out.replace(r[0], r[1]); }
    });
    /* Shorten sentences over 30 words */
    var sentences = out.split(/(?<=[.!?])\s+/);
    var cleaned = sentences.map(function(s) {
      var words = s.split(/\s+/);
      if (words.length > 30) {
        var mid = Math.floor(words.length / 2);
        return words.slice(0, mid).join(" ") + ".\n" + words.slice(mid).join(" ");
      }
      return s;
    });
    out = cleaned.join(" ");
    return out + "\n\n— " + changes + " improvement" + (changes!==1?"s":"") + " applied.";
  }

  /* ── 2. Brand Messaging ───────────────────────── */
  window.OccApp.runBrand = function() {
    var product = document.getElementById("brand-product").value.trim();
    var audience = document.getElementById("brand-audience").value.trim();
    var unique = document.getElementById("brand-unique").value.trim();
    if (!product || !audience) { toast("Fill in product and audience","warn"); return; }
    if (!canUse("brand")) { toast("Daily limit reached","warn"); window.OccApp.showUpgradeModal(); return; }
    var output = document.getElementById("brand-output");
    output.textContent = "Generating…";
    setTimeout(function() {
      var usp = unique || product;
      var taglines = [
        audience.split(" ")[0] + "-first " + product + ". Built different.",
        "Stop guessing. Start " + product.toLowerCase().replace(/\b\w/g,function(l){return l.toUpperCase();}) + ".",
        "The " + product + " " + audience.toLowerCase() + " actually need.",
        usp + " — for " + audience.toLowerCase() + " who demand more.",
        "Where " + audience.toLowerCase() + " meet " + product.toLowerCase() + "."
      ];
      var elevator = "We help " + audience.toLowerCase() + " achieve more with " + product.toLowerCase()
        + (unique ? ", leveraging " + unique.toLowerCase() : "")
        + ". Unlike alternatives, we focus on clarity, speed, and measurable outcomes.";
      var val = "1. " + product + " designed for " + audience + "\n2. "
        + (unique || "Results-driven approach") + "\n3. Measurable ROI in weeks, not months";
      output.textContent = "=== TAGLINES ===\n" + taglines.join("\n") + "\n\n=== ELEVATOR PITCH ===\n" + elevator
        + "\n\n=== VALUE PROPOSITIONS ===\n" + val;
      recordUse("brand");
      toast("+10 XP — Brand","success");
    }, 700);
  };

  /* ── 3. UTM Builder ───────────────────────────── */
  window.OccApp.runUTM = function() {
    var url = document.getElementById("utm-url").value.trim();
    var source = document.getElementById("utm-source").value.trim();
    var medium = document.getElementById("utm-medium").value.trim();
    var campaign = document.getElementById("utm-campaign").value.trim();
    if (!url || !source || !medium || !campaign) { toast("Fill in all required fields","warn"); return; }
    var term = document.getElementById("utm-term").value.trim();
    var content = document.getElementById("utm-content").value.trim();
    var sep = url.indexOf("?") === -1 ? "?" : "&";
    var result = url + sep + "utm_source=" + encodeURIComponent(source) + "&utm_medium=" + encodeURIComponent(medium)
      + "&utm_campaign=" + encodeURIComponent(campaign);
    if (term) result += "&utm_term=" + encodeURIComponent(term);
    if (content) result += "&utm_content=" + encodeURIComponent(content);
    document.getElementById("utm-result").textContent = result;
    recordUse("utm");
    toast("+10 XP — UTM","success");
  };
  window.OccApp.copyUTM = function() {
    var el = document.getElementById("utm-result");
    if (el && el.textContent) navigator.clipboard.writeText(el.textContent).then(function(){ toast("Copied!","success"); });
  };

  /* ── 4. Word Counter ──────────────────────────── */
  window.OccApp.runCounter = function() {
    var input = document.getElementById("counter-input").value;
    var text = input.trim();
    if (!text) {
      setCounterMetrics(0, 0, 0, "0:00");
      return;
    }
    var words = text.split(/\s+/).filter(function(w){ return w.length > 0; }).length;
    var chars = text.length;
    var charsNoSpace = text.replace(/\s/g,"").length;
    var sentences = text.split(/[.!?]+/).filter(function(s){ return s.trim().length > 0; }).length;
    var paragraphs = text.split(/\n\n+/).filter(function(p){ return p.trim().length > 0; }).length;
    var readTime = Math.max(1, Math.ceil(words / 200));
    var speakTime = Math.max(1, Math.ceil(words / 150));
    setCounterMetrics(words, chars, sentences, readTime + " min");
    /* platform limits */
    updatePlatformLimits(chars, words);
    /* XP only on first count per session */
    if (words > 0) {
      var g = getGameState();
      g.wordsProcessed = (g.wordsProcessed||0) + words;
      saveGameState(g);
      checkBadges(g);
    }
    recordUse("counter");
  };

  function setCounterMetrics(words, chars, sentences, readTime) {
    var el;
    el = document.getElementById("counter-words"); if(el) el.textContent = words.toLocaleString();
    el = document.getElementById("counter-chars"); if(el) el.textContent = chars.toLocaleString();
    el = document.getElementById("counter-sentences"); if(el) el.textContent = sentences.toLocaleString();
    el = document.getElementById("counter-time"); if(el) el.textContent = readTime;
  }
  function updatePlatformLimits(chars) {
    var limits = { x:280, li:3000, ig:2200, fb:63206 };
    ["x","li","ig","fb"].forEach(function(p) {
      var fill = document.getElementById("limit-" + p);
      if (fill) {
        var pct = Math.min(100, (chars / limits[p]) * 100);
        fill.style.width = pct + "%";
        fill.classList.toggle("limit-bar__fill--over", chars > limits[p]);
      }
    });
  }

  /* ── 5. Readability Analyzer ──────────────────── */
  window.OccApp.runReadability = function() {
    var input = document.getElementById("readability-input").value.trim();
    if (!input) { toast("Paste text to analyze","warn"); return; }
    if (!canUse("readability")) { toast("Daily limit reached","warn"); window.OccApp.showUpgradeModal(); return; }
    var words = input.split(/\s+/).filter(function(w){ return w.length > 0; });
    var totalWords = words.length;
    var sentences = input.split(/[.!?]+/).filter(function(s){ return s.trim().length > 0; }).length;
    var syllables = 0;
    words.forEach(function(w) { syllables += countSyllables(w); });
    /* Flesch Reading Ease */
    var fre = 206.835 - 1.015 * (totalWords / Math.max(1,sentences)) - 84.6 * (syllables / Math.max(1,totalWords));
    fre = Math.round(Math.max(0, Math.min(100, fre)));
    /* Flesch-Kincaid Grade Level */
    var grade = 0.39 * (totalWords / Math.max(1,sentences)) + 11.8 * (syllables / Math.max(1,totalWords)) - 15.59;
    grade = Math.max(0, Math.round(grade * 10) / 10);
    /* Avg words per sentence */
    var avgWPS = Math.round(totalWords / Math.max(1, sentences) * 10) / 10;
    /* Long sentences */
    var longSentences = input.split(/[.!?]+/).filter(function(s) {
      return s.trim().split(/\s+/).length > 20;
    }).length;
    /* Passive voice (simple estimate) */
    var passiveMatches = input.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi) || [];
    var passivePct = Math.round(passiveMatches.length / Math.max(1, sentences) * 100);

    var el;
    el = document.getElementById("readability-score"); if(el) { el.textContent = fre; el.className = "big-score " + (fre >= 60 ? "score-good" : fre >= 30 ? "score-ok" : "score-bad"); }
    el = document.getElementById("readability-grade"); if(el) el.textContent = "Grade " + grade;
    el = document.getElementById("readability-avgwps"); if(el) el.textContent = avgWPS;
    el = document.getElementById("readability-long"); if(el) el.textContent = longSentences;
    el = document.getElementById("readability-passive"); if(el) el.textContent = passivePct + "%";
    el = document.getElementById("readability-verdict"); if(el) {
      if (fre >= 70) el.textContent = "Excellent — easy for most audiences.";
      else if (fre >= 50) el.textContent = "Good — accessible for general readers.";
      else if (fre >= 30) el.textContent = "Moderate — may need simplification.";
      else el.textContent = "Difficult — consider rewriting for clarity.";
    }
    recordUse("readability");
    toast("+10 XP — Readability","success");
  };

  function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g,"");
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    word = word.replace(/^y/, "");
    var m = word.match(/[aeiouy]{1,2}/g);
    return m ? m.length : 1;
  }

  /* ── 6. Email Subject Tester ──────────────────── */
  window.OccApp.runEmail = function() {
    var subject = document.getElementById("email-subject").value.trim();
    if (!subject) { toast("Enter a subject line","warn"); return; }
    if (!canUse("email")) { toast("Daily limit reached","warn"); window.OccApp.showUpgradeModal(); return; }
    var words = subject.split(/\s+/);
    var len = subject.length;
    var scores = { length:0, spam:0, urgency:0, personal:0, emoji:0 };
    /* Length score (40-60 chars ideal) */
    if (len >= 30 && len <= 60) scores.length = 30;
    else if (len >= 20 && len <= 80) scores.length = 20;
    else scores.length = 10;
    /* Spam word check */
    var spamWords = ["free","buy now","click here","act now","limited time","order now","winner","congratulations","guaranteed","no cost","credit","promotion","discount","deal","offer","cheap","save big","earn money","cash","bonus"];
    var spamFound = [];
    spamWords.forEach(function(sw) {
      if (subject.toLowerCase().indexOf(sw) !== -1) spamFound.push(sw);
    });
    scores.spam = Math.max(0, 25 - spamFound.length * 8);
    /* Urgency/power words */
    var powerWords = ["new","secret","exclusive","proven","discover","ultimate","essential","breaking","urgent","now","today","limited","last chance","don't miss","announcement","revealed","insider","critical","introducing"];
    var powerFound = [];
    powerWords.forEach(function(pw) {
      if (subject.toLowerCase().indexOf(pw) !== -1) powerFound.push(pw);
    });
    scores.urgency = Math.min(20, powerFound.length * 7);
    /* Personalization cues */
    if (/\{.*?\}|%.*?%|you|your/i.test(subject)) scores.personal = 15;
    else scores.personal = 5;
    /* Emoji presence */
    var emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/u;
    scores.emoji = emojiRegex.test(subject) ? 10 : 5;
    var total = scores.length + scores.spam + scores.urgency + scores.personal + scores.emoji;
    total = Math.min(100, total);

    document.getElementById("email-score").textContent = total + "/100";
    document.getElementById("email-score").className = "big-score " + (total >= 70 ? "score-good" : total >= 40 ? "score-ok" : "score-bad");
    document.getElementById("email-len").textContent = len + " chars (" + words.length + " words)";
    document.getElementById("email-spam").textContent = spamFound.length > 0 ? "Found: " + spamFound.join(", ") : "Clean — no spam triggers";
    document.getElementById("email-spam").className = spamFound.length > 0 ? "metric-bad" : "metric-good";
    document.getElementById("email-power").textContent = powerFound.length > 0 ? powerFound.join(", ") : "No power words found";
    /* Mobile preview */
    document.getElementById("email-preview-subject").textContent = subject.length > 40 ? subject.substring(0, 40) + "…" : subject;
    document.getElementById("email-preview-preview").textContent = subject;
    recordUse("email");
    toast("+15 XP — Email","success");
  };

  /* ── 7. SEO Meta Preview ──────────────────────── */
  window.OccApp.runSEO = function() {
    var title = document.getElementById("seo-title").value.trim();
    var desc = document.getElementById("seo-desc").value.trim();
    var url = document.getElementById("seo-url").value.trim() || "https://example.com";
    if (!title) { toast("Enter a page title","warn"); return; }
    if (!canUse("seo")) { toast("Daily limit reached","warn"); window.OccApp.showUpgradeModal(); return; }
    /* Score */
    var score = 0;
    var tips = [];
    if (title.length >= 30 && title.length <= 60) { score += 30; }
    else { score += 15; tips.push("Title: aim for 30-60 characters (current: " + title.length + ")"); }
    if (desc.length >= 120 && desc.length <= 160) { score += 30; }
    else if (desc.length > 0) { score += 15; tips.push("Description: aim for 120-160 characters (current: " + desc.length + ")"); }
    else { tips.push("Add a meta description for better CTR"); }
    /* Keyword density check (simple) */
    var keywords = title.toLowerCase().split(/\s+/).filter(function(w){ return w.length > 4; });
    if (desc && keywords.length > 0) {
      var found = keywords.filter(function(k){ return desc.toLowerCase().indexOf(k) !== -1; });
      if (found.length > 0) { score += 20; } else { score += 5; tips.push("Include title keywords in your description"); }
    }
    score += 20; /* base points */
    score = Math.min(100, score);
    /* SERP preview */
    var serpTitle = document.getElementById("serp-title");
    var serpUrl = document.getElementById("serp-url");
    var serpDesc = document.getElementById("serp-desc");
    if (serpTitle) serpTitle.textContent = title.length > 60 ? title.substring(0, 57) + "..." : title;
    if (serpUrl) serpUrl.textContent = url;
    if (serpDesc) serpDesc.textContent = desc.length > 160 ? desc.substring(0, 157) + "..." : (desc || "No description provided.");
    document.getElementById("seo-score").textContent = score + "/100";
    document.getElementById("seo-score").className = "big-score " + (score >= 70 ? "score-good" : score >= 40 ? "score-ok" : "score-bad");
    document.getElementById("seo-tips").innerHTML = tips.length > 0 ? tips.map(function(t){ return "<li>" + t + "</li>"; }).join("") : "<li>Looking good! All meta tags optimized.</li>";
    /* HTML snippet */
    var snippet = '&lt;title&gt;' + escHTML(title) + '&lt;/title&gt;\n&lt;meta name="description" content="' + escHTML(desc) + '"&gt;';
    document.getElementById("seo-html").textContent = '<title>' + title + '</title>\n<meta name="description" content="' + desc + '">';
    recordUse("seo");
    toast("+15 XP — SEO","success");
  };
  window.OccApp.copySEOHTML = function() {
    var el = document.getElementById("seo-html");
    if (el) navigator.clipboard.writeText(el.textContent).then(function(){ toast("Copied!","success"); });
  };

  /* ── 8. Headline Scorer (PRO) ─────────────────── */
  window.OccApp.runHeadline = function() {
    var headline = document.getElementById("headline-input").value.trim();
    if (!headline) { toast("Enter a headline","warn"); return; }
    if (!canUse("headline")) { toast("Pro only — Upgrade to unlock","warn"); window.OccApp.showUpgradeModal(); return; }
    var words = headline.split(/\s+/);
    var score = 50; /* base */
    /* Length scoring */
    if (words.length >= 6 && words.length <= 12) score += 15;
    else if (words.length >= 4 && words.length <= 15) score += 8;
    else score -= 5;
    /* Power words */
    var power = ["how","why","what","best","top","ultimate","guide","secret","proven","essential","new","free","easy","fast","simple","complete","step"];
    var pw = 0;
    power.forEach(function(p){ if (headline.toLowerCase().indexOf(p) !== -1) pw++; });
    score += Math.min(15, pw * 5);
    /* Number presence */
    if (/\d/.test(headline)) score += 10;
    /* Question */
    if (/\?$/.test(headline)) score += 5;
    /* Emotional trigger */
    var emotional = ["amazing","incredible","shocking","surprising","powerful","brilliant","stunning","mind-blowing","unbelievable","extraordinary"];
    emotional.forEach(function(e){ if (headline.toLowerCase().indexOf(e) !== -1) score += 3; });
    score = Math.min(100, Math.max(0, score));
    document.getElementById("headline-score").textContent = score;
    document.getElementById("headline-score").className = "big-score " + (score >= 70 ? "score-good" : score >= 40 ? "score-ok" : "score-bad");
    document.getElementById("headline-analysis").textContent =
      "Words: " + words.length + " | Power Words: " + pw + " | " + (score >= 80 ? "Excellent headline!" : score >= 60 ? "Good, but could be stronger." : "Needs improvement — add power words or numbers.");
    if (score >= 85) {
      var g = getGameState();
      g.headlinesAbove85 = (g.headlinesAbove85||0) + 1;
      saveGameState(g); checkBadges(g);
    }
    recordUse("headline");
    toast("+25 XP — Headline","success");
  };

  /* ── 9. Tone Analyzer (PRO) ───────────────────── */
  window.OccApp.runTone = function() {
    var input = document.getElementById("tone-input").value.trim();
    if (!input) { toast("Paste text to analyze","warn"); return; }
    if (!canUse("tone")) { toast("Pro only — Upgrade to unlock","warn"); window.OccApp.showUpgradeModal(); return; }
    var tones = { professional:0, casual:0, urgent:0, friendly:0, authoritative:0 };
    /* Casual markers */
    var casualWords = ["hey","cool","awesome","gonna","wanna","lol","btw","tbh","imo","fyi","yep","nope","stuff","thing","kinda","sorta","pretty much","no worries","chill","vibe"];
    casualWords.forEach(function(c){ if (input.toLowerCase().indexOf(c)!==-1) tones.casual += 8; });
    /* Professional markers */
    var proWords = ["therefore","consequently","furthermore","regarding","implementation","strategic","stakeholder","deliverable","metrics","performance","optimize","initiative","objective","framework","compliance","leverage","synergy"];
    proWords.forEach(function(p){ if (input.toLowerCase().indexOf(p)!==-1) tones.professional += 6; });
    /* Urgent markers */
    var urgentWords = ["now","immediately","urgent","asap","critical","deadline","hurry","last chance","don't miss","limited","expires","today only","act fast"];
    urgentWords.forEach(function(u){ if (input.toLowerCase().indexOf(u)!==-1) tones.urgent += 10; });
    /* Friendly markers */
    var friendlyWords = ["we'd love","happy to","glad","thank","appreciate","welcome","excited","wonderful","great","fantastic","enjoy","together","share"];
    friendlyWords.forEach(function(f){ if (input.toLowerCase().indexOf(f)!==-1) tones.friendly += 7; });
    /* Authoritative markers */
    var authWords = ["must","shall","required","proven","research shows","studies show","data","evidence","according to","experts","conclusive","definitive"];
    authWords.forEach(function(a){ if (input.toLowerCase().indexOf(a)!==-1) tones.authoritative += 7; });
    /* Normalize */
    var max = Math.max.apply(null, Object.values(tones));
    if (max === 0) max = 1;
    Object.keys(tones).forEach(function(k) { tones[k] = Math.min(100, Math.round(tones[k] / max * 100)); });
    /* Display */
    Object.keys(tones).forEach(function(k) {
      var bar = document.getElementById("tone-" + k);
      if (bar) { bar.style.width = tones[k] + "%"; bar.textContent = tones[k] + "%"; }
    });
    var dominant = Object.keys(tones).reduce(function(a,b){ return tones[a]>tones[b]?a:b; });
    document.getElementById("tone-verdict").textContent = "Dominant tone: " + dominant.charAt(0).toUpperCase() + dominant.slice(1);
    recordUse("tone");
    toast("+25 XP — Tone","success");
  };

  /* ── 10. Social Post Formatter (PRO) ──────────── */
  window.OccApp.runSocial = function() {
    var input = document.getElementById("social-input").value.trim();
    if (!input) { toast("Enter your message","warn"); return; }
    if (!canUse("social")) { toast("Pro only — Upgrade to unlock","warn"); window.OccApp.showUpgradeModal(); return; }
    var hashtags = extractHashtags(input);
    var plain = input.replace(/#\w+/g, "").trim();
    /* X/Twitter — 280 chars */
    var xText = plain.length > 250 ? plain.substring(0, 247) + "..." : plain;
    if (hashtags.length > 0) xText += "\n\n" + hashtags.slice(0,3).join(" ");
    /* LinkedIn — professional tone */
    var liText = plain.split(/[.!]/)[0] + ".\n\n" + plain + "\n\n" + hashtags.slice(0,5).join(" ") + "\n\n#Marketing #Strategy";
    /* Instagram — engagement-focused */
    var igText = plain + "\n\n.\n.\n.\n" + hashtags.join(" ") + " #Marketing #ContentCreator #Strategy #Growth";
    /* Threads */
    var thText = plain.length > 500 ? plain.substring(0, 497) + "..." : plain;
    document.getElementById("social-x-text").textContent = xText;
    document.getElementById("social-li-text").textContent = liText;
    document.getElementById("social-ig-text").textContent = igText;
    document.getElementById("social-th-text").textContent = thText;
    /* Char counts */
    document.getElementById("social-x-count").textContent = xText.length + "/280";
    document.getElementById("social-li-count").textContent = liText.length + "/3000";
    document.getElementById("social-ig-count").textContent = igText.length + "/2200";
    document.getElementById("social-th-count").textContent = thText.length + "/500";
    recordUse("social");
    toast("+25 XP — Social","success");
  };

  function extractHashtags(text) {
    var m = text.match(/#\w+/g);
    if (m) return m;
    /* auto-generate from keywords */
    var words = text.split(/\s+/).filter(function(w){ return w.length > 5 && !/^(about|those|which|their|these|would|could|should|being|after|before|other)$/i.test(w); });
    return words.slice(0,5).map(function(w){ return "#" + w.replace(/[^a-zA-Z]/g,""); });
  }

  /* ═══════════════════════════════════════════════════
     UTILITIES
     ═══════════════════════════════════════════════════ */
  function escHTML(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  /* Toast notification */
  function toast(msg, type) {
    type = type || "info";
    var container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.style.cssText = "position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;";
      document.body.appendChild(container);
    }
    var t = document.createElement("div");
    t.className = "toast toast--" + type;
    t.textContent = msg;
    t.style.cssText = "padding:0.75rem 1.25rem;border-radius:8px;font-size:0.875rem;font-family:'Space Grotesk',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.15);opacity:0;transform:translateX(100%);transition:all 0.3s ease;pointer-events:auto;";
    if (type === "success") t.style.background = "#10b981"; 
    else if (type === "error") t.style.background = "#ef4444";
    else if (type === "warn") t.style.background = "#f59e0b";
    else t.style.background = "#6366f1";
    t.style.color = "#fff";
    container.appendChild(t);
    requestAnimationFrame(function() { t.style.opacity = "1"; t.style.transform = "translateX(0)"; });
    setTimeout(function() {
      t.style.opacity = "0"; t.style.transform = "translateX(100%)";
      setTimeout(function() { t.remove(); }, 300);
    }, 2500);
  }

  /* ── Smooth Scroll ────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener("click", function(e) {
      e.preventDefault();
      var target = document.querySelector(this.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior:"smooth" });
    });
  });

  /* ── Counter live update on keyup ─────────────── */
  var counterInput = document.getElementById("counter-input");
  if (counterInput) {
    counterInput.addEventListener("keyup", function() {
      var text = this.value.trim();
      if (!text) { setCounterMetrics(0,0,0,"0 min"); updatePlatformLimits(0); return; }
      var words = text.split(/\s+/).filter(function(w){ return w.length > 0; }).length;
      var chars = text.length;
      var sentences = text.split(/[.!?]+/).filter(function(s){ return s.trim().length > 0; }).length;
      var readTime = Math.max(1, Math.ceil(words / 200));
      setCounterMetrics(words, chars, sentences, readTime + " min");
      updatePlatformLimits(chars);
    });
  }

  /* ── Mobile menu toggle ───────────────────────── */
  var menuToggle = document.getElementById("menu-toggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", function() {
      var nav = document.getElementById("main-nav");
      if (nav) nav.classList.toggle("nav--open");
    });
  }

  /* ── INIT ─────────────────────────────────────── */
  var g = initStreak();
  updateGamificationUI(g);
  updateUsageBar();

  /* Track session tools for Power User badge */
  window.addEventListener("beforeunload", function() {
    var g = getGameState();
    if (Object.keys(g.sessionTools||{}).length >= 3) {
      g.powerUserDays = (g.powerUserDays||0) + 1;
      saveGameState(g);
    }
    g.sessionTools = {};
    saveGameState(g);
  });

})();
