(function () {
  /* ═══════════════════════════════════════════════
     TAB SYSTEM
     ═══════════════════════════════════════════════ */
  const tabButtons = document.querySelectorAll(".tabs__btn");
  const panels = document.querySelectorAll(".panel");

  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("aria-controls");

      tabButtons.forEach(function (b) {
        b.classList.remove("tabs__btn--active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("tabs__btn--active");
      btn.setAttribute("aria-selected", "true");

      panels.forEach(function (p) {
        p.classList.remove("panel--active");
      });

      var activePanel = document.getElementById(target);
      if (activePanel) {
        activePanel.classList.add("panel--active");
      }
    });
  });

  /* ═══════════════════════════════════════════════
     ACTIVE NAV — Intersection Observer
     ═══════════════════════════════════════════════ */
  var navLinks = document.querySelectorAll(".nav__link");
  var sections = document.querySelectorAll("section[id]");

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (link) {
            link.classList.remove("active");
          });
          var activeLink = document.querySelector(
            '.nav__link[href="#' + entry.target.id + '"]'
          );
          if (activeLink) activeLink.classList.add("active");
        }
      });
    },
    { rootMargin: "-40% 0px -60%" }
  );

  sections.forEach(function (s) {
    observer.observe(s);
  });

  /* ═══════════════════════════════════════════════
     CLARITY REWRITER
     ═══════════════════════════════════════════════ */
  const clarityForm = document.getElementById("clarity-form");
  const clarityInput = document.getElementById("clarity-input");
  const clarityOutput = document.getElementById("clarity-output");
  const clarityMetrics = document.getElementById("clarity-metrics");
  const clarityNotes = document.getElementById("clarity-notes");
  const claritySample = document.getElementById("clarity-sample");

  const jargonMap = new Map([
    ["cutting-edge", "advanced"],
    ["full-spectrum", "broad"],
    ["empower", "help"],
    ["mission-aligned", "purpose-led"],
    ["holistic", "clear"],
    ["framework", "system"],
    ["leverages", "uses"],
    ["high-value", "strong"],
    ["strategic differentiation", "clear distinction"],
    ["digital ecosystem", "digital channels"],
    ["synergy", "alignment"],
    ["utilize", "use"],
    ["best-in-class", "strong"],
    ["robust", "solid"],
    ["optimize", "improve"],
    ["stakeholders", "people"],
    ["seamless", "smooth"],
    ["innovative", "useful"],
    ["scalable", "repeatable"],
    ["solution", "tool"]
  ]);

  const fillerWords = ["really", "very", "basically", "actually", "just", "simply", "quite"];
  const claritySamples = [
    "Our integrated solution enables visionary founders to activate a scalable thought-leadership ecosystem that aligns strategic storytelling with conversion-ready content outputs.",
    "We help mission-driven businesses unlock meaningful audience engagement by deploying a holistic narrative architecture across owned and earned media touchpoints.",
    "This offer is designed to give consultants a robust and transformative framework for elevating perception, authority, and consistent digital visibility."
  ];

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function countWords(text) {
    return (text.match(/\b[\w'-]+\b/g) || []).length;
  }

  function countSentences(text) {
    return Math.max(1, (text.match(/[.!?]+/g) || []).length || 1);
  }

  function simplifyText(source) {
    let updated = " " + source.trim() + " ";
    const notes = [];

    jargonMap.forEach(function (replacement, phrase) {
      var regex = new RegExp(
        "\\b" + phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b",
        "gi"
      );
      if (regex.test(updated)) {
        updated = updated.replace(regex, replacement);
        notes.push('Replaced jargon like "' + phrase + '" with simpler wording.');
      }
    });

    fillerWords.forEach(function (word) {
      var regex = new RegExp("\\b" + word + "\\b", "gi");
      if (regex.test(updated)) {
        updated = updated.replace(regex, "");
      }
    });

    if (source !== updated.trim()) {
      notes.push("Removed filler words to reduce noise.");
    }

    updated = updated
      .replace(/\s+,/g, ",")
      .replace(/\s{2,}/g, " ")
      .replace(/,\s+(and|but|so)\s+/gi, ". $1 ")
      .replace(/\s*;\s*/g, ". ")
      .trim();

    var sentences = updated
      .split(/(?<=[.!?])\s+/)
      .flatMap(function (s) { return splitLongSentence(s.trim()); })
      .map(sentenceCase)
      .filter(Boolean);

    if (sentences.length > countSentences(source)) {
      notes.push("Split long sentences into shorter units for easier reading.");
    }

    var rewritten = sentences.join(" ");
    if (!notes.length) {
      notes.push("Tightened sentence flow and preserved the main promise.");
    }

    return { rewritten: rewritten, notes: dedupe(notes) };
  }

  function splitLongSentence(sentence) {
    var words = sentence.split(/\s+/).filter(Boolean);
    if (words.length <= 18) return [sentence];

    var pivot = sentence.search(/,| and | while | which | that /i);
    if (pivot === -1) return [sentence];

    var first = sentence.slice(0, pivot).replace(/[,:;\s]+$/, "");
    var second = sentence.slice(pivot + 1).replace(/^[,:;\s]+/, "");
    return [first.endsWith(".") ? first : first + ".", second];
  }

  function sentenceCase(sentence) {
    if (!sentence) return "";
    var cleaned = sentence.replace(/\s{2,}/g, " ").trim();
    if (!cleaned) return "";
    var normalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return /[.!?]$/.test(normalized) ? normalized : normalized + ".";
  }

  function dedupe(items) {
    return Array.from(new Set(items));
  }

  function renderClarity() {
    var source = clarityInput.value.trim();
    if (!source) return;

    var result = simplifyText(source);
    var beforeWords = countWords(source);
    var afterWords = countWords(result.rewritten);
    var beforeSentences = countSentences(source);
    var afterSentences = countSentences(result.rewritten);
    var sentenceDelta = beforeSentences === 0 ? 0 : Math.round(
      (beforeWords / beforeSentences) - (afterWords / afterSentences)
    );

    clarityOutput.innerHTML = "<p>" + escapeHtml(result.rewritten) + "</p>";
    clarityNotes.innerHTML = result.notes
      .map(function (note) { return "<li>" + escapeHtml(note) + "</li>"; })
      .join("");
    clarityMetrics.innerHTML = [
      metricCard("Words", beforeWords + " → " + afterWords),
      metricCard("Sentences", beforeSentences + " → " + afterSentences),
      metricCard("Avg. load", (sentenceDelta >= 0 ? "−" : "+") + Math.abs(sentenceDelta) + " words")
    ].join("");
  }

  function metricCard(label, value) {
    return '<div class="metric"><span>' + escapeHtml(label) + "</span><strong>" + escapeHtml(value) + "</strong></div>";
  }

  clarityForm.addEventListener("submit", function (event) {
    event.preventDefault();
    renderClarity();
  });

  claritySample.addEventListener("click", function () {
    var current = claritySamples.indexOf(clarityInput.value.trim());
    var nextIndex = current === -1 ? 0 : (current + 1) % claritySamples.length;
    clarityInput.value = claritySamples[nextIndex];
    renderClarity();
  });

  /* ═══════════════════════════════════════════════
     BRAND MESSAGE GENERATOR
     ═══════════════════════════════════════════════ */
  const brandForm = document.getElementById("brand-form");
  const positioningOutput = document.getElementById("positioning-output");
  const valueOutput = document.getElementById("value-output");
  const leadOutput = document.getElementById("lead-output");

  var toneMap = {
    calm: "Clear, calm, and editorial",
    direct: "Direct, confident, and practical",
    warm: "Warm, intelligent, and reassuring"
  };

  brandForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var form = new FormData(brandForm);
    var audience = form.get("audience").toString().trim();
    var problem = form.get("problem").toString().trim();
    var outcome = form.get("outcome").toString().trim();
    var difference = form.get("difference").toString().trim();
    var proof = form.get("proof").toString().trim();
    var tone = form.get("tone").toString();

    positioningOutput.textContent =
      "For " + audience + ", Occasus Lab solves the problem that " + problem +
      " by delivering " + outcome + " through " + difference + ".";
    valueOutput.textContent =
      "Get " + outcome + " without bloated tools or generic messaging systems. Built on " + proof + ".";
    leadOutput.textContent =
      toneMap[tone] + ". We help " + audience + " move from confusion to usable clarity.";
  });

  /* ═══════════════════════════════════════════════
     UTM BUILDER
     ═══════════════════════════════════════════════ */
  const utmForm = document.getElementById("utm-form");
  const utmOutput = document.getElementById("utm-output");
  const utmCopy = document.getElementById("utm-copy");

  function slugify(value) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  utmForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var form = new FormData(utmForm);
    var baseUrl = form.get("base-url").toString().trim();
    var url;

    try {
      url = new URL(baseUrl);
    } catch (e) {
      utmOutput.textContent = "Enter a valid base URL first.";
      return;
    }

    ["utm-source", "utm-medium", "utm-campaign", "utm-content", "utm-term"].forEach(function (field) {
      var value = form.get(field).toString().trim();
      if (value) {
        url.searchParams.set(field.replace("utm-", "utm_"), slugify(value));
      }
    });

    utmOutput.textContent = url.toString();
  });

  utmCopy.addEventListener("click", function () {
    var value = utmOutput.textContent.trim();
    if (!value || value === "Enter a valid base URL first.") return;
    navigator.clipboard.writeText(value).then(function () {
      utmCopy.textContent = "Copied";
      window.setTimeout(function () {
        utmCopy.textContent = "Copy result";
      }, 1200);
    });
  });

  /* ═══════════════════════════════════════════════
     INIT — run tools once on load
     ═══════════════════════════════════════════════ */
  renderClarity();
  brandForm.dispatchEvent(new Event("submit", { cancelable: true }));
  utmForm.dispatchEvent(new Event("submit", { cancelable: true }));
})();
