window.addEventListener("load", () => {
  const intro = document.querySelector(".cinematic-intro");
  initLiveNumbers();
  initButtonAnalytics();
  initSectionAnalytics();
  initAnalyticsHeartbeat();

  if (intro) {
    window.setTimeout(() => {
      intro.remove();
    }, 7400);
  }
});

function sayHello() {
  window.location.href = "mailto:baidaev.rasul00@gmail.com?subject=Contact%20from%20Website";
}

const brandscanForm = document.querySelector("#brandscan-form");
const brandInput = document.querySelector("#brand-name");
const brandLoading = document.querySelector("#brandscan-loading");
const loadingText = document.querySelector("#loading-text");
const brandReveal = document.querySelector("#brand-name-reveal");
const revealName = document.querySelector("#reveal-name");
const particleField = document.querySelector("#particle-field");
const brandResults = document.querySelector("#brandscan-results");
const tryAgainButton = document.querySelector("#try-again");
const sampleButtons = document.querySelectorAll("[data-sample]");

const loadingMessages = [
  "Scanning identity...",
  "Analyzing brand signal...",
  "Generating personal brand profile..."
];

const recentAnalysisSignatures = [];
const recentVisualSignatures = [];
const liveNumbersState = {
  metrics: null,
  factIndex: 0,
  factTimer: null,
  supabase: null,
  sessionId: null
};

function cleanBrandName(value) {
  return value.trim().replace(/\s+/g, " ");
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("en-US");
}

function getSupabaseClient() {
  if (liveNumbersState.supabase) return liveNumbersState.supabase;

  const config = window.BRANDSCAN_SUPABASE_CONFIG || {};
  const hasConfig = config.url && config.anonKey && !config.url.includes("YOUR_") && !config.anonKey.includes("YOUR_");

  if (!hasConfig || !window.supabase) {
    return null;
  }

  liveNumbersState.supabase = window.supabase.createClient(config.url, config.anonKey);
  return liveNumbersState.supabase;
}

function getSessionId() {
  if (liveNumbersState.sessionId) return liveNumbersState.sessionId;

  try {
    const existing = window.sessionStorage.getItem("brandscanSessionId");
    if (existing) {
      liveNumbersState.sessionId = existing;
      return existing;
    }

    const next = window.crypto?.randomUUID ? window.crypto.randomUUID() : `session-${Date.now()}`;
    window.sessionStorage.setItem("brandscanSessionId", next);
    liveNumbersState.sessionId = next;
    return next;
  } catch (error) {
    liveNumbersState.sessionId = `session-${Date.now()}`;
    return liveNumbersState.sessionId;
  }
}

function getDeviceType() {
  if (window.matchMedia("(max-width: 760px)").matches) return "mobile";
  if (window.matchMedia("(max-width: 1040px)").matches) return "tablet";
  return "desktop";
}

function getBrowserName() {
  const agent = navigator.userAgent;
  if (/Edg\//.test(agent)) return "Edge";
  if (/Chrome\//.test(agent) && !/Chromium/.test(agent)) return "Chrome";
  if (/Safari\//.test(agent) && !/Chrome\//.test(agent)) return "Safari";
  if (/Firefox\//.test(agent)) return "Firefox";
  return "Unknown";
}

function getDateRange() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
  const onlineWindow = new Date(now.getTime() - 5 * 60 * 1000);

  return { now, today, yesterday, tomorrow, weekStart, monthStart, lastHour, onlineWindow };
}

async function trackAnalyticsEvent(eventType, details = {}) {
  const client = getSupabaseClient();
  if (!client) return;

  await client.from("analytics_events").insert({
    event_type: eventType,
    name_input: details.nameInput || null,
    page_url: details.pageUrl || window.location.href,
    session_id: getSessionId(),
    device_type: getDeviceType(),
    browser: getBrowserName(),
    country: null,
    city: null
  });
}

async function countEvents(eventType, fromDate, toDate) {
  const client = getSupabaseClient();
  if (!client) return 0;

  let query = client
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", eventType);

  if (fromDate) query = query.gte("created_at", fromDate.toISOString());
  if (toDate) query = query.lt("created_at", toDate.toISOString());

  const { count, error } = await query;
  return error ? 0 : count || 0;
}

function getMostCommon(rows, key) {
  const counts = new Map();
  rows.forEach((row) => {
    const value = row[key];
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || [null, 0];
}

async function fetchLiveMetrics() {
  const client = getSupabaseClient();
  const emptyMetrics = {
    totalVisits: 0,
    visitsToday: 0,
    visitsYesterday: 0,
    visitsWeek: 0,
    visitsMonth: 0,
    totalAnalyses: 0,
    analysesToday: 0,
    analysesLastHour: 0,
    onlineNow: 0,
    topName: "None yet",
    topNameCount: 0,
    topPage: "None yet",
    topPageCount: 0,
    configured: Boolean(client)
  };

  if (!client) return emptyMetrics;

  const range = getDateRange();
  const [
    totalVisits,
    visitsToday,
    visitsYesterday,
    visitsWeek,
    visitsMonth,
    totalAnalyses,
    analysesToday,
    analysesLastHour,
    recentSessions,
    nameRows,
    pageRows
  ] = await Promise.all([
    countEvents("page_view"),
    countEvents("page_view", range.today, range.tomorrow),
    countEvents("page_view", range.yesterday, range.today),
    countEvents("page_view", range.weekStart),
    countEvents("page_view", range.monthStart),
    countEvents("name_analysis"),
    countEvents("name_analysis", range.today, range.tomorrow),
    countEvents("name_analysis", range.lastHour),
    client.from("analytics_events").select("session_id").gte("created_at", range.onlineWindow.toISOString()),
    client.from("analytics_events").select("name_input").eq("event_type", "name_analysis").not("name_input", "is", null).limit(1000),
    client.from("analytics_events").select("page_url").in("event_type", ["page_view", "section_view"]).limit(1000)
  ]);

  const onlineSessions = recentSessions.error ? [] : [...new Set((recentSessions.data || []).map((row) => row.session_id).filter(Boolean))];
  const [topName, topNameCount] = getMostCommon(nameRows.error ? [] : nameRows.data || [], "name_input");
  const [topPage, topPageCount] = getMostCommon(pageRows.error ? [] : pageRows.data || [], "page_url");

  return {
    totalVisits,
    visitsToday,
    visitsYesterday,
    visitsWeek,
    visitsMonth,
    totalAnalyses,
    analysesToday,
    analysesLastHour,
    onlineNow: onlineSessions.length,
    topName: topName || "None yet",
    topNameCount,
    topPage: topPage ? new URL(topPage).hash || new URL(topPage).pathname || "/" : "None yet",
    topPageCount,
    configured: true
  };
}

function getHumanComparison(key, value, metrics) {
  if (!metrics.configured) return "Connect Supabase to begin tracking real analytics.";
  if (!value || value === "None yet") {
    const empty = {
      totalVisits: "No real visits tracked yet.",
      visitsToday: "No real visits tracked today.",
      visitsYesterday: "No real visits tracked yesterday.",
      visitsWeek: "No real visits tracked this week.",
      visitsMonth: "No real visits tracked this month.",
      totalAnalyses: "0 names analyzed on this website.",
      analysesToday: "0 names analyzed today.",
      analysesLastHour: "0 names analyzed in the last hour.",
      onlineNow: "No active sessions detected right now.",
      topName: "No names searched on this website yet.",
      topPage: "No page activity tracked yet."
    };
    return empty[key] || "No real analytics tracked yet.";
  }

  const copy = {
    totalVisits: `${formatNumber(value)} real page views have been recorded from this website.`,
    visitsToday: `${formatNumber(value)} real visits have happened today on RasulTech.`,
    visitsYesterday: `${formatNumber(value)} real visits were tracked yesterday.`,
    visitsWeek: `${formatNumber(value)} real visits have been tracked this week.`,
    visitsMonth: `${formatNumber(value)} real visits have been tracked this month.`,
    totalAnalyses: `${formatNumber(value)} real name analyses have been generated here.`,
    analysesToday: `${formatNumber(value)} names have been analyzed today.`,
    analysesLastHour: `${formatNumber(value)} analyses were created in the last hour.`,
    onlineNow: `${formatNumber(value)} active session${value === 1 ? "" : "s"} detected in the last five minutes.`,
    topName: `${metrics.topName} has been searched ${formatNumber(metrics.topNameCount)} time${metrics.topNameCount === 1 ? "" : "s"}.`,
    topPage: `${metrics.topPage} is the most visited tracked page or section.`
  };

  return copy[key] || "Real analytics from this website.";
}

function getLiveFacts(metrics) {
  if (!metrics.configured) {
    return ["Connect Supabase to show real analytics from this website."];
  }

  const facts = [
    `${formatNumber(metrics.totalVisits)} total real visits have been stored in analytics_events.`,
    `${formatNumber(metrics.totalAnalyses)} real name analyses have been generated on this website.`,
    metrics.topNameCount > 0 ? `${metrics.topName} is currently the most searched name on this website.` : "No searched names have been recorded yet.",
    metrics.topPageCount > 0 ? `${metrics.topPage} is currently the most visited tracked page or section.` : "No page activity has been recorded yet.",
    `${formatNumber(metrics.onlineNow)} people are currently online based on activity in the last five minutes.`
  ];

  return facts;
}

function animateCounter(element, target) {
  const start = Number(element.dataset.currentValue || "0");
  const duration = 1100;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = start + (target - start) * eased;
    element.textContent = formatNumber(value);

    if (progress < 1) {
      window.requestAnimationFrame(tick);
    } else {
      element.dataset.currentValue = String(target);
      element.textContent = formatNumber(target);
    }
  }

  window.requestAnimationFrame(tick);
}

function renderLiveNumbers(metrics) {
  document.querySelectorAll("[data-live-key]").forEach((element) => {
    const key = element.dataset.liveKey;
    animateCounter(element, metrics[key]);
  });

  document.querySelectorAll("[data-live-copy]").forEach((element) => {
    const key = element.dataset.liveCopy;
    element.textContent = getHumanComparison(key, metrics[key], metrics);
  });

  const topNameElement = document.querySelector("[data-live-text='topName']");
  if (topNameElement) {
    topNameElement.textContent = metrics.topName;
  }

  const topPageElement = document.querySelector("[data-live-text='topPage']");
  if (topPageElement) {
    topPageElement.textContent = metrics.topPage;
  }

  const facts = getLiveFacts(metrics);
  const factElement = document.querySelector("#live-fact");
  if (factElement) {
    factElement.textContent = facts[liveNumbersState.factIndex % facts.length];
  }

  window.clearInterval(liveNumbersState.factTimer);
  liveNumbersState.factTimer = window.setInterval(() => {
    liveNumbersState.factIndex += 1;
    if (factElement) {
      factElement.style.opacity = "0";
      window.setTimeout(() => {
        factElement.textContent = facts[liveNumbersState.factIndex % facts.length];
        factElement.style.opacity = "1";
      }, 220);
    }
  }, 4200);
}

async function initLiveNumbers() {
  if (!document.querySelector(".live-numbers")) return;

  await trackAnalyticsEvent("page_view");
  liveNumbersState.metrics = await fetchLiveMetrics();
  renderLiveNumbers(liveNumbersState.metrics);

  window.setInterval(() => {
    fetchLiveMetrics().then((metrics) => {
      liveNumbersState.metrics = metrics;
      renderLiveNumbers(metrics);
    });
  }, 30000);
}

async function refreshLiveNumbers() {
  liveNumbersState.metrics = await fetchLiveMetrics();
  renderLiveNumbers(liveNumbersState.metrics);
}

async function recordLiveAnalysis(name) {
  await trackAnalyticsEvent("name_analysis", { nameInput: name });
  await refreshLiveNumbers();
}

function initButtonAnalytics() {
  document.querySelectorAll("button, a").forEach((element) => {
    element.addEventListener("click", () => {
      const label = element.dataset.sample || element.textContent.trim() || element.getAttribute("href") || "unknown";
      trackAnalyticsEvent("button_click", { nameInput: label.slice(0, 120) });
    });
  });
}

function initSectionAnalytics() {
  if (!("IntersectionObserver" in window)) return;

  const seenSections = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.45) return;
      const id = entry.target.id || entry.target.getAttribute("aria-label");
      if (!id || seenSections.has(id)) return;

      seenSections.add(id);
      trackAnalyticsEvent("section_view", {
        pageUrl: `${window.location.origin}${window.location.pathname}#${id}`
      });
    });
  }, { threshold: [0.45] });

  document.querySelectorAll("section[id], section[aria-label]").forEach((section) => {
    observer.observe(section);
  });
}

function initAnalyticsHeartbeat() {
  window.setInterval(() => {
    trackAnalyticsEvent("heartbeat");
  }, 60000);
}

function slugifyBrand(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18) || "brand";
}

function clampScore(value, min = 18, max = 97) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function countSyllableSignals(value) {
  const groups = value.toLowerCase().match(/[aeiouy]+/g);
  return groups ? groups.length : 0;
}

function scoreLengthEfficiency(compact) {
  const length = compact.length;
  if (length >= 5 && length <= 9) return 92;
  if (length >= 4 && length <= 12) return 80;
  if (length >= 13 && length <= 16) return 58;
  if (length >= 17) return 34;
  return 48;
}

function scorePronunciation(compact) {
  const lower = compact.toLowerCase();
  const vowels = (lower.match(/[aeiouy]/g) || []).length;
  const vowelRatio = compact.length ? vowels / compact.length : 0;
  const hardClusterPenalty = (lower.match(/[bcdfghjklmnpqrstvwxyz]{4,}/g) || []).length * 18;
  const digitPenalty = /\d/.test(compact) ? 8 : 0;
  const vowelScore = 100 - Math.abs(vowelRatio - 0.42) * 145;
  return clampScore(vowelScore - hardClusterPenalty - digitPenalty, 18, 94);
}

function scoreUniqueness(compact) {
  const lower = compact.toLowerCase();
  const uniqueRatio = compact.length ? new Set(lower).size / compact.length : 0;
  const repeatedPenalty = /(.)\1{2,}/.test(lower) ? 18 : 0;
  const numberBonus = /\d/.test(lower) ? 8 : 0;
  const techBonus = /(x|z|q|404|ai|sec|dev|byte|solve)/i.test(lower) ? 9 : 0;
  return clampScore(34 + uniqueRatio * 54 + numberBonus + techBonus - repeatedPenalty, 20, 96);
}

function scoreBrandability(name, compact) {
  const hasCompound = /[A-Z][a-z]+[A-Z][a-z]+/.test(name) || /(tech|lab|studio|ai|sec|dev|works|forge|code)/i.test(name);
  const hasBadSymbols = /[^a-z0-9 _-]/i.test(name);
  const syllables = countSyllableSignals(compact);
  let score = 48;
  score += hasCompound ? 22 : 0;
  score += compact.length >= 5 && compact.length <= 12 ? 18 : 0;
  score += syllables >= 2 && syllables <= 4 ? 10 : 0;
  score -= hasBadSymbols ? 18 : 0;
  return clampScore(score, 18, 95);
}

function scoreDomainFriendliness(name, compact) {
  let score = 54;
  score += compact.length >= 5 && compact.length <= 11 ? 22 : 0;
  score += /^[a-z0-9]+$/i.test(compact) ? 13 : 0;
  score += /(tech|dev|ai|sec|lab|hq)$/i.test(compact) ? 7 : 0;
  score -= /\d{3,}/.test(compact) ? 10 : 0;
  score -= /\s/.test(name) ? 12 : 0;
  score -= compact.length > 16 ? 18 : 0;
  return clampScore(score, 16, 94);
}

function scoreVisualPotential(name, compact) {
  const hasInitials = name.split(" ").filter(Boolean).length > 1;
  const hasTechGlyph = /(x|z|v|404|ai|sec|dev)/i.test(compact);
  const hasSymmetry = compact[0] && compact[0].toLowerCase() === compact[compact.length - 1]?.toLowerCase();
  let score = 45;
  score += compact.length <= 10 ? 18 : 7;
  score += hasTechGlyph ? 18 : 0;
  score += hasInitials ? 8 : 0;
  score += hasSymmetry ? 6 : 0;
  return clampScore(score, 24, 94);
}

function scoreSocialHandle(compact) {
  let score = 52;
  score += compact.length >= 5 && compact.length <= 12 ? 22 : 0;
  score += /^[a-z0-9]+$/i.test(compact) ? 14 : 0;
  score += /\d{1,3}$/.test(compact) ? 6 : 0;
  score -= compact.length > 15 ? 18 : 0;
  return clampScore(score, 18, 93);
}

function scoreMemorability(name, compact, uniqueness, pronunciation) {
  const syllables = countSyllableSignals(compact);
  let score = 35;
  score += compact.length >= 4 && compact.length <= 9 ? 24 : 8;
  score += syllables >= 1 && syllables <= 3 ? 15 : 0;
  score += uniqueness > 72 ? 10 : uniqueness > 55 ? 5 : 0;
  score += pronunciation > 72 ? 10 : pronunciation > 55 ? 5 : 0;
  score += /[A-Z]/.test(name.slice(1)) ? 4 : 0;
  return clampScore(score, 20, 96);
}

function getScoreProfile(name) {
  const compact = slugifyBrand(name);
  const pronunciation = scorePronunciation(compact);
  const uniqueness = scoreUniqueness(compact);
  const factors = [
    ["Memorability", scoreMemorability(name, compact, uniqueness, pronunciation), 0.16],
    ["Pronunciation", pronunciation, 0.13],
    ["Uniqueness", uniqueness, 0.13],
    ["Brandability", scoreBrandability(name, compact), 0.16],
    ["Domain friendliness", scoreDomainFriendliness(name, compact), 0.11],
    ["Visual identity potential", scoreVisualPotential(name, compact), 0.11],
    ["Social handle potential", scoreSocialHandle(compact), 0.10],
    ["Length efficiency", scoreLengthEfficiency(compact), 0.10]
  ];
  const weighted = factors.reduce((total, [, score, weight]) => total + score * weight, 0);
  const hasPremiumSignal = /(tech|dev|code|cyber|sec|ai|404|solve|byte|lab|studio|forge)/i.test(name)
    || /[A-Z][a-z]+[A-Z][a-z]+/.test(name);
  const exceptionalBonus = factors.filter(([, score]) => score >= 88).length >= 6 && hasPremiumSignal ? 3 : 0;
  const weaknessPenalty = factors.filter(([, score]) => score < 45).length * 3;
  let score = clampScore(weighted * 0.82 + 8 + exceptionalBonus - weaknessPenalty, 20, 94);

  if (compact.length <= 3) {
    score = Math.min(score, 68);
  }

  if (!hasPremiumSignal && compact.length <= 6) {
    score = Math.min(score, 84);
  }

  if (score >= 95 && factors.some(([, value]) => value < 82)) {
    score = 94;
  }

  return {
    score,
    factors: factors.map(([label, value, weight]) => ({
      label,
      value,
      weight,
      contribution: Math.round(value * weight)
    }))
  };
}

function getPersonality(name, scoreProfile) {
  const compact = slugifyBrand(name);
  const isTech = /(tech|dev|code|cyber|sec|ai|404|solve|byte)/i.test(name);
  const isPlayful = /(nacho|pop|zap|fun|game|pixel|nova)/i.test(name) || /\d/.test(compact);
  const isPremium = scoreProfile.score >= 82 && !isPlayful;
  const isShort = compact.length <= 7;

  if (isTech) {
    return {
      archetype: scoreProfile.score >= 82 ? "Innovator" : "Builder",
      tone: "Confident, technical, precise",
      visual: "Dark interface, crisp lines, scanner details, terminal-inspired motion",
      energy: "Focused and future-facing",
      logo: "Angular wordmark, shield glyph, cursor symbol, or monogram with a signal line",
      palette: "Electric cyan, graphite black, clean white, and controlled amber"
    };
  }

  if (isPlayful) {
    return {
      archetype: "Creator",
      tone: "Creative, memorable, slightly playful",
      visual: "Bold typography, kinetic shapes, high-contrast social graphics",
      energy: "Approachable and expressive",
      logo: "Rounded wordmark or mascot-free symbol built from the strongest letter",
      palette: "Signal blue, bright gold, midnight black, and soft white"
    };
  }

  return {
    archetype: isPremium ? "Strategist" : isShort ? "Explorer" : "Builder",
    tone: isPremium ? "Premium, calm, editorial" : "Clear, personal, adaptable",
    visual: isPremium ? "Minimal glass panels, large type, elegant spacing" : "Clean personal-brand system with flexible content blocks",
    energy: isPremium ? "Polished and authoritative" : "Curious and momentum-driven",
    logo: isShort ? "Monogram-first identity with a strong single-letter mark" : "Custom wordmark with a simple badge variation",
    palette: isPremium ? "Carbon black, ice white, muted cyan, and champagne gold" : "Deep navy, cool cyan, slate, and warm gold"
  };
}

function getNameTraits(name, scoreProfile, history) {
  const compact = slugifyBrand(name);
  const lower = compact.toLowerCase();
  const nameFamilies = {
    rasul: "mission-led",
    egor: "distinctive-slavic",
    alexander: "classic-authority",
    nacho: "playful-nickname",
    diana: "mythic-elegant"
  };
  const vowels = (lower.match(/[aeiouy]/g) || []).length;
  const consonants = Math.max(0, compact.length - vowels);
  const startsWith = lower[0] || "";
  const endsWith = lower[lower.length - 1] || "";
  const hasTech = /(tech|dev|code|cyber|sec|ai|404|solve|byte|lab|forge|logic)/i.test(name);
  const hasCorporate = /(group|global|capital|consult|partners|systems|solutions|corp|enterprise)/i.test(name);
  const hasCreative = /(art|studio|pixel|nova|spark|craft|muse|maker|nacho|wave)/i.test(name);
  const hasNumbers = /\d/.test(name);
  const topFactor = [...scoreProfile.factors].sort((a, b) => b.value - a.value)[0];
  const lowFactor = [...scoreProfile.factors].sort((a, b) => a.value - b.value)[0];
  const originFact = history.facts.find(([label]) => /origin|language/i.test(label));
  const meaningFact = history.facts.find(([label]) => /meaning/i.test(label));
  const soundShape = vowels >= consonants
    ? "open-vowel"
    : /[xqzv]/i.test(compact)
      ? "edgy-consonant"
      : endsWith && /[aeiouy]/.test(endsWith)
        ? "soft-ending"
        : "firm-ending";
  const lengthClass = compact.length <= 4
    ? "ultra-short"
    : compact.length <= 7
      ? "short"
      : compact.length <= 12
        ? "balanced"
        : "long-form";
  const category = hasCorporate
    ? "corporate"
    : hasTech
      ? "technical"
      : hasCreative || soundShape === "soft-ending"
        ? "creative"
        : hasNumbers
          ? "digital-alias"
          : "personal";

  return {
    compact,
    lower,
    startsWith,
    endsWith,
    vowels,
    consonants,
    syllables: countSyllableSignals(compact),
    hasTech,
    hasCorporate,
    hasCreative,
    hasNumbers,
    topFactor,
    lowFactor,
    origin: originFact ? originFact[1] : "unconfirmed origin",
    meaning: meaningFact ? meaningFact[1] : "meaning not confirmed",
    nameFamily: nameFamilies[lower] || (compact.length >= 8 ? "expanded-personal" : "compact-personal"),
    soundShape,
    lengthClass,
    category,
    rhythm: `${compact.length} characters, ${vowels} vowel signals, ${consonants} consonant signals`
  };
}

function getEmotionalRead(name, traits) {
  const personalReads = {
    "mission-led": `${name} carries a message-first feeling; it sounds like a person or project built around purpose, guidance, and communication.`,
    "distinctive-slavic": `${name} feels compact but uncommon in English-language branding, which gives it a sharper personal signature than many familiar first names.`,
    "classic-authority": `${name} has a long historic weight; it sounds more like a public-facing expert, founder, or strategist than a casual creator handle.`,
    "mythic-elegant": `${name} feels elegant and luminous, with a mythic association that suits beauty, storytelling, lifestyle, or a refined founder identity.`,
    "expanded-personal": `${name} feels established and complete, but the longer shape asks for a strong visual system so it does not feel too formal.`,
    "compact-personal": `${name} feels direct and person-led; it can become credible quickly if the page shows a real story and visible work.`
  };
  const reads = {
    technical: `${name} sounds like a builder identity: precise, system-minded, and more comfortable around products than lifestyle content.`,
    creative: `${name} has a warmer creative pulse; the sound feels more like a studio, creator alias, or expressive personal channel than a formal company.`,
    corporate: `${name} reads as structured and business-facing, with a trust-first feeling that could suit consulting, services, or B2B positioning.`,
    "digital-alias": `${name} feels like an internet-native handle, especially because the numeric detail gives it a coded signature instead of a traditional name shape.`,
    personal: personalReads[traits.nameFamily]
  };
  const soundNote = {
    "open-vowel": "The vowel-heavy sound makes it feel more approachable and verbal.",
    "edgy-consonant": "The sharper consonants create a more digital, high-contrast edge.",
    "soft-ending": "The ending softens the name, which helps it feel friendly and easy to introduce.",
    "firm-ending": "The ending gives it a firmer stop, useful for authority and confidence."
  };

  return `${reads[traits.category]} ${soundNote[traits.soundShape]} Its strongest measurable trait is ${traits.topFactor.label.toLowerCase()}, while ${traits.lowFactor.label.toLowerCase()} is the pressure point to fix.`;
}

function getComparisonSet(traits) {
  if (traits.category === "technical") {
    return [
      ["Common names", "Compared with ordinary first-name branding, this has more product energy and clearer tech context."],
      ["Trending online brands", `It sits closer to names like code labs, AI tools, and security products because "${traits.compact}" contains a stronger system signal.`],
      ["Popular usernames", "It is more ownable than random gamer handles, but it should keep the spelling consistent everywhere."]
    ];
  }

  if (traits.category === "creative") {
    return [
      ["Common names", "Compared with standard names, it has more personality and less corporate distance."],
      ["Trending online brands", "It can compete with creator-led brands because the sound leaves room for color, motion, and a recognizable content style."],
      ["Popular usernames", "It feels more human than heavily coded usernames, but it needs a visual hook to avoid blending into nickname culture."]
    ];
  }

  if (traits.category === "corporate") {
    return [
      ["Common names", "Compared with casual personal names, it sounds more formal and easier to trust in a business context."],
      ["Trending online brands", "It is less playful than many startup names, but stronger for serious services and authority-building."],
      ["Popular usernames", "It is weaker as a short social handle, but stronger as a LinkedIn, portfolio, or consulting identity."]
    ];
  }

  if (traits.category === "digital-alias") {
    return [
      ["Common names", "Compared with normal names, the number pattern makes it feel more private, coded, and internet-born."],
      ["Trending online brands", "It has more edge than polished startup names, but less immediate trust unless the story explains the code."],
      ["Popular usernames", "It competes well with gaming and developer handles because it feels like a chosen identity, not a legal name."]
    ];
  }

  return [
    ["Common names", traits.nameFamily === "classic-authority" ? "Compared with short modern names, it carries more heritage and authority, but it is slower to type and needs abbreviation strategy." : traits.nameFamily === "mission-led" ? "Compared with ordinary first names, the meaning gives it a built-in mission angle that can become the brand story." : traits.nameFamily === "distinctive-slavic" ? "Compared with familiar Western first names, it feels more distinctive and search-friendly, but may need pronunciation support." : `Compared with common personal names, ${traits.compact} depends more on story and presentation than built-in category meaning.`],
    ["Trending online brands", traits.nameFamily === "classic-authority" ? "It is less startup-flashy than names ending in AI, Lab, or Forge, but stronger for expert positioning and long-term reputation." : traits.nameFamily === "mission-led" ? "It is more human and symbolic than most trending tech names; the opportunity is to connect the meaning to modern work." : traits.nameFamily === "distinctive-slavic" ? "It can stand apart from polished creator brands because the sound feels personal, direct, and less manufactured." : "It is less obviously productized than modern AI or studio names, which can be an advantage for a founder-led brand."],
    ["Popular usernames", traits.nameFamily === "classic-authority" ? "It is weaker as a compact handle unless shortened, but stronger as a full-name authority brand." : traits.nameFamily === "mission-led" ? "It is more meaningful than random handle culture, but it needs a consistent visual mark to become recognizable." : traits.nameFamily === "distinctive-slavic" ? "It has better memorability than many number-heavy usernames, but the pronunciation should be reinforced in bio copy." : "It is cleaner than many handle-style usernames, but it may need a signature visual mark to become instantly recognizable."]
  ];
}

function getGrowthSuggestions(name, traits, personality) {
  const suffix = traits.endsWith ? traits.endsWith.toUpperCase() : name[0]?.toUpperCase() || "X";
  const initials = name.split(/[\s_-]+/).filter(Boolean).map((part) => part[0]).join("").toUpperCase();
  const domainBase = traits.compact;

  const categoryPlans = {
    technical: [
      ["Creator niche", `Build around ${traits.hasTech ? "security breakdowns, AI experiments, and project case studies" : "technical tutorials and transparent build logs"}; the name already sounds comfortable around systems.`],
      ["Startup niche", `Use it for a focused tool, portfolio lab, or developer utility rather than a broad lifestyle brand.`],
      ["Website style", "Use a dark command-center layout with dense proof: projects, metrics, demos, and short technical explanations."],
      ["Logo concept", `Create a compact ${initials || suffix} mark with a scan line, bracket, cursor, or shield detail.`],
      ["Domain strategy", `Prioritize ${domainBase}.dev or ${domainBase}.io for product energy, then redirect the .com if you get it later.`],
      ["Social positioning", "Lead with useful technical posts first; personality should appear through project choices, not motivational quotes."]
    ],
    creative: [
      ["Creator niche", `Lean into visual storytelling, idea sketches, experiments, and personal taste; the sound can carry a more expressive channel.`],
      ["Startup niche", "Best fit is a design studio, creator toolkit, content brand, or playful micro-product."],
      ["Website style", "Use larger imagery, warmer accents, motion, and an editorial project wall instead of a strict dashboard."],
      ["Logo concept", `Turn the ${suffix} ending or ${initials || name[0]} initial into a flexible stamp, sticker, or animated wordmark.`],
      ["Domain strategy", `Try ${domainBase}.studio, ${domainBase}.co, or ${domainBase}.world before forcing a long .com.`],
      ["Social positioning", "Make the feed feel personal and visual: process clips, before/after posts, and short opinions with a distinct tone."]
    ],
    corporate: [
      ["Creator niche", "Publish credibility content: frameworks, lessons, business analysis, and practical decision guides."],
      ["Startup niche", "Best suited for consulting, operations tools, B2B services, education, or professional systems."],
      ["Website style", "Use restrained glass panels, clear proof points, testimonials, and calm typography to build trust quickly."],
      ["Logo concept", `Use a disciplined ${initials || name[0].toUpperCase()} monogram with a balanced grid and minimal ornament.`],
      ["Domain strategy", `Prefer ${domainBase}.com or ${domainBase}group.com; avoid playful extensions unless the offer is experimental.`],
      ["Social positioning", "Position around authority and clarity: fewer posts, stronger claims, cleaner visuals."]
    ],
    "digital-alias": [
      ["Creator niche", "Aim at gaming, cybersecurity, coding challenges, internet culture, or anonymous build logs."],
      ["Startup niche", "Use it for a developer tool, challenge platform, game server, or experimental product rather than formal consulting."],
      ["Website style", "Use terminal details, status badges, glitch-light motion, and a profile-first hero that explains the number."],
      ["Logo concept", `Make the digits part of the symbol so they look intentional, not randomly attached.`],
      ["Domain strategy", `Keep the exact handle in domains and socials; test ${domainBase}.dev, ${domainBase}.gg, and ${domainBase}.xyz.`],
      ["Social positioning", "Own the alias: short posts, coded visual language, project drops, and a pinned origin story."]
    ],
    personal: [
      ["Creator niche", traits.nameFamily === "mission-led" ? "Focus on communication, guidance, technology lessons, and projects that help people understand complex ideas." : traits.nameFamily === "distinctive-slavic" ? "Use the uncommon sound for a personal learning channel, coding journey, or opinion-led creator page." : traits.nameFamily === "classic-authority" ? "Build around expertise, leadership notes, long-form essays, or consulting insights rather than casual daily posts." : `Build around personal expertise, learning in public, and a clear promise tied to the story behind ${name}.`],
      ["Startup niche", traits.nameFamily === "mission-led" ? "Best fit is an education, communication, AI assistant, or portfolio platform with a purpose-driven message." : traits.nameFamily === "distinctive-slavic" ? "Best fit is a developer portfolio, creator tool, or independent product where the founder identity matters." : traits.nameFamily === "classic-authority" ? "Best fit is a premium advisory, strategy studio, educational product, or professional services brand." : "Use it as a founder site, portfolio, newsletter identity, or small studio before turning it into a product name."],
      ["Website style", traits.nameFamily === "mission-led" ? "Use a cinematic hero, a short origin panel, and message-led project cards so the meaning becomes obvious." : traits.nameFamily === "distinctive-slavic" ? "Use bold pronunciation-friendly typography, a compact intro, and visible proof of work above the fold." : traits.nameFamily === "classic-authority" ? "Use editorial spacing, restrained color, case studies, and a monogram so the longer name feels premium." : "Use a confident portrait, concise origin story, selected projects, and one strong visual motif from the name."],
      ["Logo concept", `Develop a ${name[0]?.toUpperCase() || "letter"} monogram that can sit beside the full name without feeling like a corporate badge.`],
      ["Domain strategy", traits.nameFamily === "classic-authority" ? `Secure the full ${domainBase}.com if possible, then use a shorter handle for socials.` : traits.nameFamily === "distinctive-slavic" ? `Try ${domainBase}.dev or ${domainBase}.me if the .com is unavailable; keep the spelling exact everywhere.` : `Secure ${domainBase}.com if possible; if not, pair it with a meaningful modifier like lab, works, or studio.`],
      ["Social positioning", traits.nameFamily === "mission-led" ? "Use a calm teacher-builder voice: short lessons, project explanations, and one pinned origin story." : traits.nameFamily === "classic-authority" ? "Post fewer but stronger pieces: frameworks, analysis, decisions, and polished project summaries." : "Make the person visible: opinions, progress, lessons, and a consistent visual signature."]
    ]
  };

  return categoryPlans[traits.category].map(([label, text]) => [label, `${text} This fits the ${personality.archetype.toLowerCase()} energy and the ${traits.rhythm} rhythm.`]);
}

function rewriteIfGeneric(text, traits) {
  const genericPatterns = [
    /clean and memorable/gi,
    /strong personal brand/gi,
    /good for social media/gi,
    /easy to pronounce/gi,
    /future-ready/gi
  ];
  let revised = text;
  genericPatterns.forEach((pattern) => {
    revised = revised.replace(pattern, `${traits.lengthClass} ${traits.soundShape.replace("-", " ")} signal`);
  });
  return revised;
}

function uniqueText(text, traits) {
  const signature = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((word) => word.length > 4).slice(0, 10).join("-");
  let revised = rewriteIfGeneric(text, traits);

  if (recentAnalysisSignatures.includes(signature)) {
    revised += ` The specific differentiator here is the ${traits.startsWith.toUpperCase()} opening, ${traits.endsWith.toUpperCase()} ending, and ${traits.lowFactor.label.toLowerCase()} score.`;
  }

  recentAnalysisSignatures.push(signature);
  if (recentAnalysisSignatures.length > 12) {
    recentAnalysisSignatures.shift();
  }

  return revised;
}

function getNameHash(value) {
  return [...value].reduce((total, character, index) => total + character.charCodeAt(0) * (index + 3), 0);
}

function buildVisualIdentity(name, traits, personality) {
  const hash = getNameHash(traits.compact);
  const first = traits.startsWith.toUpperCase() || "A";
  const last = traits.endsWith.toUpperCase() || "Z";
  const pair = `${first}${last}`;
  const hasMirror = traits.startsWith && traits.startsWith === traits.endsWith;
  const rareLetters = (traits.compact.match(/[xqzvkg]/gi) || []).join("").toUpperCase();
  const meaning = traits.meaning !== "meaning not confirmed" ? traits.meaning.toLowerCase() : "";

  const identityFamilies = {
    "mission-led": {
      paletteName: "Messenger Signal",
      colors: ["#06241f", "#0f766e", "#d6a84f", "#f8f4e8"],
      colorReason: `The deep green-black base gives ${name} seriousness, the teal suggests communication and clarity, and the restrained gold connects to purpose, heritage, and the messenger meaning.`,
      type: "Humanist serif for headlines paired with a precise sans-serif for interface labels",
      typeReason: `A humanist serif gives ${name} cultural weight without making it feel old, while the sans-serif keeps the RasulTech context modern.`,
      logo: `A ${first} monogram shaped like an open message mark, with a thin horizontal line suggesting delivery, guidance, or a transmitted signal`,
      logoReason: `The first letter can carry the identity alone, and the messenger meaning gives the symbol a reason to look directional rather than decorative.`,
      atmosphere: "Cinematic founder portfolio with a quiet origin panel, guided project cards, and a luminous message-line running through the page",
      atmosphereReason: `The site should feel purposeful and calm, as if ${name} is guiding the visitor through a mission instead of simply showing projects.`
    },
    "distinctive-slavic": {
      paletteName: "Northern Forge",
      colors: ["#111827", "#31515f", "#b7c9d3", "#b23a48"],
      colorReason: `${name} benefits from a cooler, sharper palette: iron navy for focus, mineral blue for technical calm, ice gray for clarity, and a small red accent to make the compact name memorable.`,
      type: "Condensed geometric sans-serif with generous spacing and a pronunciation-friendly secondary font",
      typeReason: `The four-letter structure can look powerful when condensed, but the supporting type should soften pronunciation friction and keep the identity approachable.`,
      logo: `A compact ${first}${last} block mark using the vertical strokes of the first and last letters as a frame`,
      logoReason: `Because ${name} is short, the logo should exploit the entire word shape rather than hide behind an unrelated icon.`,
      atmosphere: "Minimal developer-founder profile with cold light, precise content blocks, and one bold pronunciation/story moment above the fold",
      atmosphereReason: `The website should make the uncommon sound feel intentional, focused, and search-friendly.`
    },
    "classic-authority": {
      paletteName: "Classical Authority",
      colors: ["#111827", "#23395d", "#b08d57", "#f4efe6"],
      colorReason: `The navy and bronze combination gives ${name} the historical authority its Greek origin deserves, while warm ivory prevents the identity from feeling too corporate.`,
      type: "Elegant serif headlines with a disciplined grotesk for captions, navigation, and case-study data",
      typeReason: `The long name needs classical authority in display type and modern restraint in the UI so it feels premium instead of heavy.`,
      logo: `A crest-inspired ${first} monogram with a subtle shield or laurel geometry, supported by a shorter social mark`,
      logoReason: `The historical meaning and public-authority sound make an emblem appropriate, but it must be simplified for digital use.`,
      atmosphere: "Premium consulting or leadership brand with editorial spacing, marble-like light, calm transitions, and proof-led sections",
      atmosphereReason: `${name} should feel established, strategic, and expensive, not playful or startup-cute.`
    },
    "playful-nickname": {
      paletteName: "Studio Spark",
      colors: ["#21140f", "#f25f3a", "#f6c85f", "#35c2a6"],
      colorReason: `${name} has nickname warmth, so the palette uses roasted dark brown for grounding, tomato and corn tones for instant personality, and teal as a fresh digital counterweight.`,
      type: "Expressive rounded display type with a clean creator-friendly sans-serif system",
      typeReason: `The soft ending and playful sound can handle expressive letterforms, but the supporting type keeps the brand from becoming childish.`,
      logo: `A sticker-like wordmark using the ${last} ending as a smile-shaped terminal or motion curve`,
      logoReason: `The name is memorable as a full sound, so the wordmark should preserve its spoken personality rather than reduce it to initials.`,
      atmosphere: "Creative studio experience with warm motion, project tiles, behind-the-scenes moments, and tactile hover effects",
      atmosphereReason: `${name} should feel social, visual, and alive, like a creator brand people want to follow.`
    },
    "mythic-elegant": {
      paletteName: "Moonlit Atelier",
      colors: ["#161326", "#d8c7ff", "#c9a46a", "#f7f1ea"],
      colorReason: `${name} carries a refined mythic quality, so the palette uses night violet for mystery, lunar lavender for softness, antique gold for heritage, and porcelain ivory for elegance.`,
      type: "High-contrast elegant serif for headlines with a light editorial sans-serif for navigation and captions",
      typeReason: `The name has a graceful vowel flow, so typography should feel poised and luminous rather than technical or loud.`,
      logo: `A crescent-like ${first} monogram or refined wordmark where the ${last} ending tapers like a signature stroke`,
      logoReason: `The historical and mythic association gives the logo permission to use celestial geometry, but the execution should stay minimal and premium.`,
      atmosphere: "Luxury digital identity with moonlit contrast, soft editorial imagery, spacious story sections, and quiet cinematic transitions",
      atmosphereReason: `${name} should feel calm, composed, and emotionally polished, like a personal brand with cultural depth.`
    }
  };

  const categoryFamilies = {
    technical: {
      paletteName: "Signal Lab",
      colors: ["#020617", "#00d4ff", "#8b5cf6", "#d7ff64"],
      colorReason: `${name} reads technical, so the palette should feel like a live interface: black for depth, cyan for scanning intelligence, violet for AI energy, and acid green for system status.`,
      type: "Structured geometric sans-serif with mono accents for metrics, domains, and score labels",
      typeReason: `The letter structure needs precision; mono accents make the identity feel engineered instead of merely futuristic.`,
      logo: `A geometric wordmark with the ${rareLetters || pair} letter feature turned into a circuit, cursor, or scanning bracket`,
      logoReason: `The strongest logo material is already inside the name: technical fragments and hard letter angles can become ownable symbols.`,
      atmosphere: "Futuristic AI laboratory with live diagnostics, dark glass panels, animated scan lines, and proof-of-work modules",
      atmosphereReason: `${name} should feel like a product people can trust, test, and inspect.`
    },
    creative: identityFamilies["playful-nickname"],
    corporate: {
      paletteName: "Trust Architecture",
      colors: ["#0f172a", "#334155", "#c8a96a", "#f8fafc"],
      colorReason: `${name} needs authority first, so the palette uses slate structure, muted gold for value, and clean white for professional clarity.`,
      type: "Refined modern serif paired with a neutral enterprise sans-serif",
      typeReason: `Corporate positioning needs trust and readability before personality; the contrast gives it both.`,
      logo: `A balanced emblem or grid-based ${first} monogram designed to look stable in proposals, slides, and website headers`,
      logoReason: `The name should project reliability, so symmetry and measured spacing matter more than decorative effects.`,
      atmosphere: "Premium consulting brand with calm proof blocks, case studies, muted motion, and strong trust signals",
      atmosphereReason: `${name} should feel like a decision has already been organized before the visitor arrives.`
    },
    "digital-alias": {
      paletteName: "Alias Code",
      colors: ["#050505", "#39ff88", "#ff3d81", "#9ca3af"],
      colorReason: `The alias structure needs high contrast: black for anonymity, green for code, magenta for edge, and gray for utility.`,
      type: "Hybrid techno sans with monospace numerals and tight uppercase labels",
      typeReason: `The digits and handle-like structure should look intentional, so numerals need the same design attention as letters.`,
      logo: `A handle badge where the numeric or unusual letter sequence is locked into the symbol`,
      logoReason: `The code-like part is the brand asset; hiding it would make the name less distinctive.`,
      atmosphere: "Underground digital profile with terminal cards, challenge badges, coded transitions, and a pinned origin story",
      atmosphereReason: `${name} should feel chosen, private, and technically capable.`
    },
    personal: {
      paletteName: "Founder Mark",
      colors: ["#07111f", "#2563eb", "#f59e0b", "#e5edf7"],
      colorReason: `${name} needs a flexible founder palette: dark blue for trust, bright blue for motion, amber for personal warmth, and pale blue for readability.`,
      type: "Clean contemporary sans-serif with one custom display treatment for the name itself",
      typeReason: `A personal brand should stay readable, but the name needs one custom typographic move so it feels owned.`,
      logo: `A ${first} monogram paired with a full-name wordmark, using the ${last} ending as a subtle cut or terminal detail`,
      logoReason: `The safest identity system is flexible: initials for small spaces and the full name when trust matters.`,
      atmosphere: "Personal storytelling experience with a strong hero, origin moment, proof cards, and a focused project path",
      atmosphereReason: `${name} should feel human first, then capable.`
    }
  };

  let identity = identityFamilies[traits.nameFamily] || categoryFamilies[traits.category] || categoryFamilies.personal;
  const accentVariants = ["#22d3ee", "#f97316", "#a3e635", "#e879f9", "#38bdf8", "#f43f5e"];
  const variantAccent = accentVariants[hash % accentVariants.length];

  identity = {
    ...identity,
    colors: [...identity.colors.slice(0, 3), variantAccent],
    logo: hasMirror
      ? `${identity.logo}. Because the name starts and ends with ${first}, add a mirrored axis so the symbol feels intentionally balanced.`
      : identity.logo,
    atmosphere: traits.topFactor.value >= 88
      ? `${identity.atmosphere}, with the first screen emphasizing ${traits.topFactor.label.toLowerCase()} as the main brand asset`
      : identity.atmosphere
  };

  return avoidRepeatedVisualIdentity(identity, name, traits);
}

function avoidRepeatedVisualIdentity(identity, name, traits) {
  let current = { ...identity };
  let signature = [
    current.paletteName,
    current.colors.join("-"),
    current.type.split(" ").slice(0, 4).join(" "),
    current.logo.split(" ").slice(0, 5).join(" "),
    current.atmosphere.split(" ").slice(0, 5).join(" ")
  ].join("|").toLowerCase();

  if (recentVisualSignatures.includes(signature)) {
    const alternateAccent = ["#14b8a6", "#eab308", "#6366f1", "#ef4444", "#06b6d4"][getNameHash(name) % 5];
    current = {
      ...current,
      paletteName: `${current.paletteName} ${traits.startsWith.toUpperCase()}-${traits.endsWith.toUpperCase()}`,
      colors: [current.colors[0], current.colors[1], alternateAccent, current.colors[3]],
      type: `${current.type}, with a custom ${traits.startsWith.toUpperCase()} initial treatment to separate it from similar identities`,
      logo: `${current.logo} Add a unique ${traits.compact.length}-unit grid so the mark belongs specifically to ${name}.`,
      atmosphere: `${current.atmosphere}. The layout should include a name-origin signature panel to prevent it from feeling interchangeable.`
    };
    signature = `${signature}|${alternateAccent}|${traits.compact.length}`;
  }

  recentVisualSignatures.push(signature);
  if (recentVisualSignatures.length > 10) {
    recentVisualSignatures.shift();
  }

  return current;
}

function getAnalysis(profile) {
  const { name, scoreProfile, personality, traits } = profile;
  const industryMap = {
    technical: "developer tools, cybersecurity, AI experiments, coding education, and technical portfolios",
    creative: "creator channels, design studios, visual projects, entertainment, and personal media",
    corporate: "consulting, professional services, B2B products, education, and business leadership",
    "digital-alias": "gaming, coding challenges, security labs, online communities, and experimental products",
    personal: "founder websites, portfolios, newsletters, consulting profiles, and learning-in-public brands"
  };
  const personalIndustryMap = {
    "mission-led": "education, communication projects, faith-aware personal storytelling, technology lessons, and purpose-driven portfolios",
    "distinctive-slavic": "developer portfolios, learning journals, independent creator pages, and founder-led micro-products",
    "classic-authority": "strategy consulting, leadership writing, premium portfolios, advisory services, and long-form educational brands",
    "mythic-elegant": "premium lifestyle, beauty, wellness, photography, storytelling, founder portfolios, and refined creative studios",
    "expanded-personal": "expert portfolios, newsletters, case-study libraries, and professional personal websites",
    "compact-personal": "personal sites, creator profiles, portfolio pages, and learning-in-public brands"
  };
  const audienceMap = {
    technical: "builders, recruiters, technical founders, and people who judge credibility through proof",
    creative: "visual audiences, young creators, collaborators, and people attracted to personality-led brands",
    corporate: "clients, partners, hiring managers, and audiences looking for maturity and reliability",
    "digital-alias": "internet-native communities, gamers, developers, and people who enjoy coded identity",
    personal: "people who connect with a real person, personal story, and visible progress"
  };
  const personalAudienceMap = {
    "mission-led": "people who value guidance, clarity, cultural meaning, and a visible sense of purpose",
    "distinctive-slavic": "people who notice uncommon names, founder journeys, and compact personal identities",
    "classic-authority": "clients, readers, and collaborators who respond to authority, heritage, and polished expertise",
    "mythic-elegant": "audiences drawn to elegance, emotional storytelling, visual calm, and timeless cultural references",
    "expanded-personal": "audiences that trust complete names, credentials, and well-organized proof",
    "compact-personal": "people who connect with a real person, personal story, and visible progress"
  };
  const opportunityMap = {
    technical: "turn the name into a product-lab identity with demos, case studies, and a precise visual system",
    creative: "build a recognizable creator world around color, motion, and repeatable content formats",
    corporate: "use the name as a trust platform with proof, frameworks, and calm authority",
    "digital-alias": "make the alias feel intentional by explaining the number, symbol, or code behind it",
    personal: "attach a strong origin story so the name becomes more than a label"
  };
  const personalOpportunityMap = {
    "mission-led": "make the messenger meaning visible through a short origin panel and communication-focused projects",
    "distinctive-slavic": "teach the pronunciation once, then use the uncommon spelling as a search-friendly signature",
    "classic-authority": "pair the full name with a refined monogram and a shorter social handle",
    "mythic-elegant": "translate the mythic and moonlike association into a refined visual world without becoming fantasy-themed",
    "expanded-personal": "use the full name for credibility while giving the site one memorable visual motif",
    "compact-personal": "attach a strong origin story so the name becomes more than a label"
  };
  const emotional = getEmotionalRead(name, traits);
  const originNote = traits.origin !== "unconfirmed origin"
    ? `The origin signal adds ${traits.origin.toLowerCase()} context, which can become part of the brand story.`
    : "Because the origin is not confirmed, the brand should create its own meaning through visuals and repeated messaging.";

  return {
    title: `${personality.archetype} identity with ${traits.topFactor.label.toLowerCase()} as the lead advantage`,
    copy: uniqueText(`${emotional} It fits ${traits.category === "personal" ? personalIndustryMap[traits.nameFamily] : industryMap[traits.category]} and speaks best to ${traits.category === "personal" ? personalAudienceMap[traits.nameFamily] : audienceMap[traits.category]}. The biggest branding opportunity is to ${traits.category === "personal" ? personalOpportunityMap[traits.nameFamily] : opportunityMap[traits.category]}. ${originNote}`, traits)
  };
}

async function fetchHistory(name) {
  const firstWord = name.split(/[\s_-]+/)[0];
  const fallback = getFallbackHistory(firstWord);
  const queries = [`${firstWord} (name)`, firstWord];

  for (const query of queries) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1600);

    try {
      const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const response = await fetch(endpoint, { signal: controller.signal });
      window.clearTimeout(timeout);
      if (!response.ok) continue;
      const data = await response.json();
      if (!data.extract || data.type === "disambiguation") continue;

      return {
        title: data.title || `${firstWord} history`,
        copy: `${data.extract} ${fallback ? fallback.copy : ""}`.trim(),
        facts: fallback?.facts || [
          ["Origin", "Live encyclopedia summary found"],
          ["Language", "Review the linked source for exact linguistic details"],
          ["Meaning", "Extracted from the available historical summary"],
          ["Cultural Signal", "Useful for checking whether the name has existing public meaning"],
          ["Famous / Notable References", data.description || "See the linked source for notable people and references"]
        ],
        source: data.content_urls?.desktop?.page || endpoint,
        sourceLabel: "Wikipedia source"
      };
    } catch (error) {
      window.clearTimeout(timeout);
      continue;
    }
  }

  return fallback || {
    title: `${firstWord} origin research`,
    copy: `No reliable live source was reachable for ${firstWord}. Treat this as a brand-first analysis: the name should be validated through name dictionaries, cultural sources, and trademark research before being used professionally.`,
    facts: [
      ["Origin", "Not confirmed from a live source"],
      ["Language", "Unknown"],
      ["Meaning", "Needs source validation"],
      ["Cultural Signal", "Check name dictionaries and cultural references before final branding"],
      ["Interesting Fact", "A unique brand can still work if the story and visual identity are strong"]
    ],
    source: "",
    sourceLabel: ""
  };
}

function getFallbackHistory(name) {
  const key = name.toLowerCase();
  const known = {
    rasul: {
      title: "Rasul: Arabic name meaning Messenger",
      copy: "Rasul comes from Arabic and is commonly understood as Messenger or Apostle. In Islamic language and history, rasul carries deep cultural and religious significance because it refers to a divinely sent messenger. As a personal brand, the meaning gives the name a serious, mission-driven feeling connected to communication, leadership, and purpose.",
      facts: [
        ["Origin", "Arabic"],
        ["Language", "Arabic"],
        ["Historical Meaning", "Messenger or Apostle"],
        ["Cultural Significance", "Strong religious and historical association with a divinely sent messenger in Islamic context"],
        ["Famous / Notable References", "Used as a given name and surname in Muslim communities; verify specific public figures from the linked reference before using them in brand copy"],
        ["Brand Fact", "The meaning supports a mission-driven identity built around communication, guidance, and trust"]
      ],
      source: "https://en.wikipedia.org/wiki/Rasul_(name)",
      sourceLabel: "Reference"
    },
    nacho: {
      title: "Nacho: Spanish nickname with warm personality",
      copy: "Nacho is widely used as a Spanish nickname for Ignacio. It feels casual, friendly, and memorable, with strong social and creator-brand potential. The sound is playful and quick to say, which makes it useful for gaming, food, entertainment, and personal content brands.",
      facts: [
        ["Origin", "Spanish nickname"],
        ["Language", "Spanish"],
        ["Historical Meaning", "Common short form of Ignacio"],
        ["Cultural Significance", "Friendly, informal, and familiar in Spanish-speaking contexts"],
        ["Famous / Notable References", "Often appears as a nickname and is also widely recognized through food and pop culture references"],
        ["Interesting Fact", "Its playful sound gives it strong nickname and social-handle energy"]
      ],
      source: "https://en.wikipedia.org/wiki/Nacho",
      sourceLabel: "Reference"
    },
    egor: {
      title: "Egor: Slavic form connected to George",
      copy: "Egor is commonly associated with Russian and Slavic usage and is related to the name George, often interpreted through the older meaning of farmer or earth-worker. As a brand, Egor feels compact, direct, and distinctive in English-language contexts, which can help a personal site feel memorable without sounding invented.",
      facts: [
        ["Origin", "Russian and Slavic usage"],
        ["Language", "Russian / Slavic"],
        ["Historical Meaning", "Related to George, often connected with farmer or earth-worker"],
        ["Cultural Significance", "Recognizable as a real given name while feeling uncommon in many English-language brand spaces"],
        ["Brand Fact", "The four-letter shape is useful for a precise personal mark or developer identity"]
      ],
      source: "https://en.wikipedia.org/wiki/Yegor",
      sourceLabel: "Reference"
    },
    alexander: {
      title: "Alexander: Greek name associated with defender of men",
      copy: "Alexander comes from Greek roots commonly understood as defender of men or protector of people. It has major historical weight through figures such as Alexander the Great, which gives the name authority, ambition, and classical scale. As a brand, it feels more premium and institutional than playful.",
      facts: [
        ["Origin", "Greek"],
        ["Language", "Greek"],
        ["Historical Meaning", "Defender of men or protector of people"],
        ["Cultural Significance", "A long-standing royal, historical, and international given name"],
        ["Famous / Notable References", "Strong association with Alexander the Great and many public figures across history"],
        ["Brand Fact", "Best used with a monogram or shortened handle so the full name keeps its authority without becoming heavy"]
      ],
      source: "https://en.wikipedia.org/wiki/Alexander",
      sourceLabel: "Reference"
    },
    diana: {
      title: "Diana: Roman name associated with moon and hunt mythology",
      copy: "Diana is strongly associated with Roman mythology, especially the goddess of the hunt, the moon, nature, and protection. The name carries elegance, independence, and a luminous historical quality. As a brand, it can feel refined, feminine, timeless, and emotionally polished.",
      facts: [
        ["Origin", "Roman / Latin"],
        ["Language", "Latin"],
        ["Historical Meaning", "Associated with the Roman goddess Diana, linked to the moon, hunt, nature, and protection"],
        ["Cultural Significance", "A classical mythological name with elegant, independent, and luminous associations"],
        ["Famous / Notable References", "Known through Roman mythology and many modern public figures with the name"],
        ["Brand Fact", "Best suited for a refined visual identity using lunar geometry, elegant type, and soft contrast"]
      ],
      source: "https://en.wikipedia.org/wiki/Diana_(name)",
      sourceLabel: "Reference"
    }
  };

  return known[key] || null;
}

async function makeBrandProfile(name) {
  const scoreProfile = getScoreProfile(name);
  const personality = getPersonality(name, scoreProfile);
  const history = await fetchHistory(name);
  const traits = getNameTraits(name, scoreProfile, history);
  const slug = slugifyBrand(name);
  const first = name.split(" ")[0];
  const isTech = /(tech|dev|code|cyber|sec|ai|404|solve)/i.test(name);
  const hasNumbers = /\d/.test(name);
  const analysis = getAnalysis({ name, scoreProfile, personality, traits });
  const comparison = getComparisonSet(traits);
  const growth = getGrowthSuggestions(name, traits, personality);
  const visualIdentity = buildVisualIdentity(name, traits, personality);

  const strengths = [
    `${traits.topFactor.label} leads the score, so ${name} should put that advantage at the center of the first impression.`,
    traits.lengthClass === "ultra-short"
      ? `The ${traits.compact.length}-character shape is fast to type and can become a compact mark.`
      : traits.lengthClass === "long-form"
        ? `The longer structure gives room for a more descriptive, professional story.`
        : `The ${traits.rhythm} pattern gives the name a usable identity rhythm.`,
    traits.category === "technical"
      ? `The technical signal makes ${name} credible for products, portfolios, and security-minded projects.`
      : traits.category === "creative"
        ? `The sound gives ${name} room for expressive content, color, and visual storytelling.`
        : traits.category === "corporate"
          ? `The formal tone can create trust before the user even reads the offer.`
          : `The personal tone can work well when paired with a visible founder story.`,
    traits.meaning !== "meaning not confirmed"
      ? `The meaning layer adds narrative material: ${traits.meaning}.`
      : `The lack of a fixed public meaning gives you freedom to define the story yourself.`,
    `${personality.archetype} energy gives the brand a focused direction instead of a random aesthetic.`
  ].map((item) => uniqueText(item, traits));

  const weaknesses = [
    `${traits.lowFactor.label} is the weakest measured factor, so the brand should compensate for it in design and messaging.`,
    traits.category === "technical" ? "The name could feel too tool-like unless the site adds a human mission and visible projects." : traits.category === "corporate" ? "The formal edge may feel distant unless the copy includes clear personality and proof." : traits.category === "creative" ? "The expressive feel could become vague unless the content niche is tightly chosen." : "The identity may need a sharper category signal so people know what it represents.",
    "Domain availability is not checked yet",
    hasNumbers ? `The number pattern in ${name} needs an origin story or it can look accidental.` : `Without a signature visual element, ${name} could blend into nearby names with similar sounds.`,
    `Trademark, search results, and social handles should be checked before committing to the ${traits.compact} identity.`
  ].map((item) => uniqueText(item, traits));

  const useCases = traits.category === "technical"
    ? [`${first} technical portfolio`, "Cybersecurity proof-of-work hub", "AI experiment archive", "Developer utility brand", "Technical newsletter handle"]
    : traits.category === "creative"
      ? [`${first} creator channel`, "Visual studio identity", "Content series brand", "Personal merch or media project", "Experimental project gallery"]
      : traits.category === "corporate"
        ? [`${first} professional website`, "Consulting practice", "B2B service brand", "Leadership newsletter", "Case-study portfolio"]
        : traits.category === "digital-alias"
          ? [`${first} gaming identity`, "Coding challenge profile", "Security lab alias", "Developer community handle", "Project drop page"]
          : [`${first} personal website`, "Founder profile", "Learning-in-public journal", "Portfolio identity", "Small studio name"];

  const taglines = [
    traits.category === "technical" ? `${first} turns systems into signal.` : traits.category === "creative" ? `${first} makes ideas visible.` : traits.category === "corporate" ? `${first} brings structure to the next decision.` : `${first} builds identity in public.`,
    traits.soundShape === "edgy-consonant" ? "Sharp name. Sharper execution." : traits.soundShape === "open-vowel" ? "Open sound. Focused story." : "A name with a point of view.",
    `${name}: ${traits.topFactor.label.toLowerCase()} with ${personality.energy.toLowerCase()}.`,
    traits.hasNumbers ? "The code is part of the signature." : `Turn the ${traits.startsWith.toUpperCase()} into a recognizable mark.`,
    `${traits.category.replace("-", " ")} branding shaped around ${traits.lowFactor.label.toLowerCase()} discipline.`
  ].map((item) => uniqueText(item, traits));

  const domains = [
    `${slug}.com`,
    `${slug}.ai`,
    `${slug}.dev`,
    `${slug}lab.com`,
    `${slug}hq.io`
  ];

  const bios = [
    {
      label: "LinkedIn",
      text: uniqueText(`${name} is a ${personality.archetype.toLowerCase()}-style identity for ${traits.category === "technical" ? "technical projects, proof-driven builds, and useful systems" : traits.category === "corporate" ? "professional thinking, structured services, and trust-building work" : traits.category === "creative" ? "creative direction, visual experiments, and personal media" : "visible progress, personal projects, and focused digital identity"}.`, traits)
    },
    {
      label: "Instagram",
      text: uniqueText(`${name} | ${traits.soundShape.replace("-", " ")} energy, ${personality.energy.toLowerCase()} ideas, and a visual world built around ${traits.startsWith.toUpperCase()}.`, traits)
    },
    {
      label: "X/Twitter",
      text: uniqueText(`${name}: ${traits.category === "technical" ? "systems, code, and proof" : traits.category === "creative" ? "taste, process, and experiments" : traits.category === "corporate" ? "clarity, trust, and decisions" : "identity, progress, and projects"}.`, traits)
    },
    {
      label: "Personal Website",
      text: uniqueText(`${name} should open with a ${traits.category.replace("-", " ")} promise, show the origin or meaning quickly, then prove the brand through selected work instead of generic biography text.`, traits)
    }
  ];

  return {
    name,
    score: scoreProfile.score,
    scoreProfile,
    traits,
    title: analysis.title,
    analysis: analysis.copy,
    summary: scoreProfile.score >= 85
      ? "Exceptional brand signal. Strong enough to anchor a serious identity."
      : scoreProfile.score >= 70
        ? "Good brand signal with clear commercial potential."
        : scoreProfile.score >= 45
          ? "Average brand signal. Useful, but it needs sharper positioning."
          : "Weak brand signal. Consider simplifying or making it more distinctive.",
    strengths,
    weaknesses,
    useCases,
    taglines,
    domains,
    bios,
    comparison,
    growth,
    personality,
    history,
    visualIdentity,
    style: [
      ["Color Strategy", `${visualIdentity.paletteName}: ${visualIdentity.colors.join(", ")}. ${visualIdentity.colorReason}`, visualIdentity.colors],
      ["Typography System", `${visualIdentity.type}. ${visualIdentity.typeReason}`],
      ["Logo Intelligence", `${visualIdentity.logo}. ${visualIdentity.logoReason}`],
      ["Website Atmosphere", `${visualIdentity.atmosphere}. ${visualIdentity.atmosphereReason}`]
    ]
  };
}

function createNameReveal(name) {
  revealName.innerHTML = "";
  particleField.innerHTML = "";
  const motionSeed = getNameHash(name);

  [...name].forEach((character, index) => {
    const letter = document.createElement("span");
    letter.className = character === " " ? "reveal-letter reveal-space" : "reveal-letter";
    letter.textContent = character === " " ? "\u00a0" : character;
    const direction = index % 5;
    const offset = ((motionSeed + index * 37) % 100) - 50;
    const depth = (motionSeed + index * 53) % 180;
    const x = direction === 0 ? "-46vw" : direction === 1 ? "42vw" : `${Math.round(offset * 0.8)}vw`;
    const y = direction === 2 ? "-36vh" : direction === 3 ? "36vh" : `${Math.round(offset * 0.58)}vh`;
    const z = direction === 4 ? "360px" : `${depth}px`;
    letter.style.setProperty("--reveal-x", x);
    letter.style.setProperty("--reveal-y", y);
    letter.style.setProperty("--reveal-z", z);
    letter.style.setProperty("--reveal-rotate", `${Math.round(offset * 0.9)}deg`);
    letter.style.setProperty("--reveal-delay", `${index * 78}ms`);
    revealName.appendChild(letter);
  });

  for (let index = 0; index < 34; index += 1) {
    const particle = document.createElement("span");
    particle.style.setProperty("--particle-x", `${(motionSeed + index * 29) % 100}%`);
    particle.style.setProperty("--particle-y", `${(motionSeed + index * 43) % 100}%`);
    particle.style.setProperty("--particle-delay", `${(motionSeed + index * 71) % 900}ms`);
    particleField.appendChild(particle);
  }
}

function fillList(selector, items, tagName = "li") {
  const list = document.querySelector(selector);
  list.innerHTML = "";

  items.forEach((item) => {
    const element = document.createElement(tagName);
    element.textContent = item;
    list.appendChild(element);
  });
}

function showBrandProfile(profile) {
  const scoreOrbit = document.querySelector("#score-orbit");

  document.querySelector("#result-name").textContent = profile.name;
  document.querySelector("#score-value").textContent = profile.score;
  document.querySelector("#score-title").textContent = `${profile.score}/100`;
  document.querySelector("#score-summary").textContent = profile.summary;
  document.querySelector("#analysis-title").textContent = profile.title;
  document.querySelector("#analysis-copy").textContent = profile.analysis;
  scoreOrbit.style.setProperty("--score", `${profile.score * 3.6}deg`);

  const breakdownList = document.querySelector("#breakdown-list");
  breakdownList.innerHTML = "";
  profile.scoreProfile.factors.forEach((factor) => {
    const row = document.createElement("div");
    row.className = "breakdown-row";

    const top = document.createElement("div");
    const label = document.createElement("span");
    const value = document.createElement("strong");
    label.textContent = `${factor.label} (${Math.round(factor.weight * 100)}%)`;
    value.textContent = `${factor.value}/100`;
    top.append(label, value);

    const track = document.createElement("div");
    const fill = document.createElement("span");
    fill.style.width = `${factor.value}%`;
    track.appendChild(fill);

    row.append(top, track);
    breakdownList.appendChild(row);
  });

  const personalityGrid = document.querySelector("#personality-grid");
  personalityGrid.innerHTML = "";
  [
    ["Archetype", profile.personality.archetype],
    ["Tone", profile.personality.tone],
    ["Visual Style", profile.personality.visual],
    ["Brand Energy", profile.personality.energy],
    ["Logo Direction", profile.personality.logo],
    ["Color Palette", profile.personality.palette]
  ].forEach(([label, text]) => {
    const item = document.createElement("div");
    const labelElement = document.createElement("strong");
    const textElement = document.createElement("p");
    labelElement.textContent = label;
    textElement.textContent = text;
    item.append(labelElement, textElement);
    personalityGrid.appendChild(item);
  });

  document.querySelector("#history-title").textContent = profile.history.title;
  document.querySelector("#history-copy").textContent = profile.history.copy;
  const historyFacts = document.querySelector("#history-facts");
  historyFacts.innerHTML = "";
  profile.history.facts.forEach(([label, text]) => {
    const item = document.createElement("div");
    const labelElement = document.createElement("strong");
    const textElement = document.createElement("p");
    labelElement.textContent = label;
    textElement.textContent = text;
    item.append(labelElement, textElement);
    historyFacts.appendChild(item);
  });
  const historySource = document.querySelector("#history-source");
  if (profile.history.source) {
    historySource.hidden = false;
    historySource.href = profile.history.source;
    historySource.textContent = profile.history.sourceLabel || "View source";
  } else {
    historySource.hidden = true;
  }

  const comparisonList = document.querySelector("#comparison-list");
  comparisonList.innerHTML = "";
  profile.comparison.forEach(([label, text]) => {
    const item = document.createElement("div");
    const labelElement = document.createElement("strong");
    const textElement = document.createElement("p");
    labelElement.textContent = label;
    textElement.textContent = text;
    item.append(labelElement, textElement);
    comparisonList.appendChild(item);
  });

  const growthList = document.querySelector("#growth-list");
  growthList.innerHTML = "";
  profile.growth.forEach(([label, text]) => {
    const item = document.createElement("div");
    const labelElement = document.createElement("strong");
    const textElement = document.createElement("p");
    labelElement.textContent = label;
    textElement.textContent = text;
    item.append(labelElement, textElement);
    growthList.appendChild(item);
  });

  fillList("#strengths-list", profile.strengths);
  fillList("#weaknesses-list", profile.weaknesses);
  fillList("#tagline-list", profile.taglines);

  const useCaseList = document.querySelector("#use-case-list");
  useCaseList.innerHTML = "";
  profile.useCases.forEach((item) => {
    const chip = document.createElement("span");
    chip.textContent = item;
    useCaseList.appendChild(chip);
  });

  const domainList = document.querySelector("#domain-list");
  domainList.innerHTML = "";
  profile.domains.forEach((domain) => {
    const item = document.createElement("span");
    item.textContent = domain;
    domainList.appendChild(item);
  });

  const bioList = document.querySelector("#bio-list");
  bioList.innerHTML = "";
  profile.bios.forEach((bio) => {
    const item = document.createElement("div");
    const label = document.createElement("strong");
    const text = document.createElement("p");
    label.textContent = bio.label;
    text.textContent = bio.text;
    item.append(label, text);
    bioList.appendChild(item);
  });

  const styleList = document.querySelector("#style-list");
  styleList.innerHTML = "";
  profile.style.forEach(([label, text, colors]) => {
    const item = document.createElement("div");
    const labelElement = document.createElement("strong");
    const textElement = document.createElement("p");
    labelElement.textContent = label;
    textElement.textContent = text;

    if (colors) {
      const swatches = document.createElement("div");
      swatches.className = "identity-swatches";
      colors.forEach((color) => {
        const swatch = document.createElement("span");
        swatch.style.background = color;
        swatch.textContent = color;
        swatches.appendChild(swatch);
      });
      item.append(labelElement, swatches, textElement);
    } else {
      item.append(labelElement, textElement);
    }

    styleList.appendChild(item);
  });
}

async function analyzeBrand(value) {
  const name = cleanBrandName(value);

  if (!name) {
    brandInput.focus();
    return;
  }

  recordLiveAnalysis(name);

  let messageIndex = 0;
  brandResults.hidden = true;
  brandReveal.hidden = true;
  brandLoading.hidden = false;
  loadingText.textContent = loadingMessages[messageIndex];

  const messageTimer = window.setInterval(() => {
    messageIndex = (messageIndex + 1) % loadingMessages.length;
    loadingText.textContent = loadingMessages[messageIndex];
  }, 760);

  const profilePromise = makeBrandProfile(name);

  window.setTimeout(async () => {
    window.clearInterval(messageTimer);
    const profile = await profilePromise;
    createNameReveal(name);
    brandLoading.hidden = true;
    brandReveal.hidden = false;
    brandReveal.scrollIntoView({ behavior: "smooth", block: "center" });

    window.setTimeout(() => {
      showBrandProfile(profile);
      brandReveal.hidden = true;
      brandResults.hidden = false;
      brandResults.scrollIntoView({ behavior: "smooth", block: "start" });
    }, Math.min(2600, 1450 + name.length * 90));
  }, 2200);
}

if (brandscanForm) {
  brandscanForm.addEventListener("submit", (event) => {
    event.preventDefault();
    analyzeBrand(brandInput.value);
  });
}

sampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    brandInput.value = button.dataset.sample;
    analyzeBrand(button.dataset.sample);
  });
});

if (tryAgainButton) {
  tryAgainButton.addEventListener("click", () => {
    brandResults.hidden = true;
    brandReveal.hidden = true;
    brandInput.value = "";
    brandInput.focus();
  });
}
