const shouldSkipHomeIntro = new URLSearchParams(window.location.search).get("skipIntro") === "1";

if (shouldSkipHomeIntro) {
  document.documentElement.classList.add("skip-intro");
}

window.addEventListener("load", () => {
  const intro = document.querySelector(".cinematic-intro");
  initLiveNumbers();

  if (shouldSkipHomeIntro) {
    if (intro) intro.remove();
    window.history.replaceState(null, "", "index.html");
  } else if (intro) {
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
const homeNameForm = document.querySelector("#home-name-form");
const homeNameInput = document.querySelector("#home-name-input");
const homeLifeForm = document.querySelector("#home-life-form");
const homeBirthDateInput = document.querySelector("#home-birth-date");
const copyResultButton = document.querySelector("#copy-result");
const shareResultButton = document.querySelector("#share-result");
const generateShareCardButton = document.querySelector("#generate-share-card");
const copyDirectLinkButton = document.querySelector("#copy-direct-link");

const loadingMessages = [
  "Scanning identity...",
  "Analyzing brand signal...",
  "Generating personal brand profile..."
];

const recentAnalysisSignatures = [];
const recentVisualSignatures = [];
let activeBrandProfile = null;
const liveNumbersState = {
  metrics: null,
  factIndex: 0,
  factTimer: null,
  supabase: null
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

function getDateRange() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

  return { now, today, tomorrow, lastHour };
}

async function trackAnalyticsEvent(eventType, details = {}) {
  const client = getSupabaseClient();
  if (!client) return;

  await client.from("analytics_events").insert({
    event_type: eventType,
    name_input: details.nameInput || null,
    page_url: details.pageUrl || window.location.href
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
    totalAnalyses: 0,
    analysesToday: 0,
    analysesLastHour: 0,
    topName: "None yet",
    topNameCount: 0,
    configured: Boolean(client)
  };

  if (!client) return emptyMetrics;

  const range = getDateRange();
  const [
    totalAnalyses,
    analysesToday,
    analysesLastHour,
    nameRows
  ] = await Promise.all([
    countEvents("name_analysis"),
    countEvents("name_analysis", range.today, range.tomorrow),
    countEvents("name_analysis", range.lastHour),
    client.from("analytics_events").select("name_input").eq("event_type", "name_analysis").not("name_input", "is", null).limit(1000)
  ]);

  const [topName, topNameCount] = getMostCommon(nameRows.error ? [] : nameRows.data || [], "name_input");

  return {
    totalAnalyses,
    analysesToday,
    analysesLastHour,
    topName: topName || "None yet",
    topNameCount,
    configured: true
  };
}

function getHumanComparison(key, value, metrics) {
  if (!metrics.configured) return "Connect Supabase to begin tracking real analytics.";
  if (!value || value === "None yet") {
    const empty = {
      totalAnalyses: "0 names analyzed on this website.",
      analysesToday: "0 names analyzed today.",
      analysesLastHour: "0 names analyzed in the last hour.",
      topName: "No names searched on this website yet."
    };
    return empty[key] || "No real analytics tracked yet.";
  }

  const copy = {
    totalAnalyses: `${formatNumber(value)} real name analyses have been generated here.`,
    analysesToday: `${formatNumber(value)} names have been analyzed today.`,
    analysesLastHour: `${formatNumber(value)} analyses were created in the last hour.`,
    topName: `${metrics.topName} has been searched ${formatNumber(metrics.topNameCount)} time${metrics.topNameCount === 1 ? "" : "s"}.`
  };

  return copy[key] || "Real analytics from this website.";
}

function getLiveFacts(metrics) {
  if (!metrics.configured) {
    return ["Connect Supabase to show real analytics from this website."];
  }

  const facts = [
    `${formatNumber(metrics.totalAnalyses)} real name analyses have been generated on this website.`,
    metrics.topNameCount > 0 ? `${metrics.topName} is currently the most searched name on this website.` : "No searched names have been recorded yet.",
    `${formatNumber(metrics.analysesToday)} names have been analyzed today.`,
    `${formatNumber(metrics.analysesLastHour)} analyses were generated in the last hour.`
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

function slugifyBrand(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18) || "brand";
}

function clampScore(value, min = 18, max = 97) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clamp(value, min = 0, max = 100) {
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
    rassul: "mission-led",
    egor: "distinctive-slavic",
    yegor: "distinctive-slavic",
    igor: "distinctive-slavic",
    alexander: "classic-authority",
    alexandr: "classic-authority",
    aleksandr: "classic-authority",
    alex: "classic-authority",
    nacho: "playful-nickname",
    ignacio: "playful-nickname",
    diana: "mythic-elegant",
    diane: "mythic-elegant",
    sophia: "mythic-elegant",
    sofia: "mythic-elegant",
    victoria: "classic-authority",
    victor: "classic-authority",
    muhammad: "mission-led",
    mohammed: "mission-led",
    mohammad: "mission-led",
    ahmed: "mission-led",
    aaliyah: "mission-led",
    maria: "mythic-elegant",
    mary: "mythic-elegant",
    anna: "classic-authority",
    john: "classic-authority",
    ivan: "classic-authority"
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
    nameFamily: nameFamilies[lower] || nameFamilies[normalizeNameKey(name)] || (compact.length >= 8 ? "expanded-personal" : "compact-personal"),
    soundShape,
    lengthClass,
    category,
    rhythm: `${compact.length} characters, ${vowels} vowel signals, ${consonants} consonant signals`
  };
}

function getEmotionalRead(name, traits) {
  const hasMeaning = traits.meaning !== "meaning not confirmed";
  const hasOrigin = traits.origin !== "unconfirmed origin";
  const culturalRead = hasMeaning || hasOrigin
    ? `${name} carries ${hasOrigin ? traits.origin.toLowerCase() : "a documented"} context${hasMeaning ? ` around ${traits.meaning.toLowerCase()}` : ""}; that makes the brand feel less invented and gives the identity a story to build from.`
    : null;
  const personalReads = {
    "mission-led": `${name} carries a message-first feeling; it sounds like a person or project built around purpose, guidance, and communication.`,
    "distinctive-slavic": `${name} feels compact but uncommon in English-language branding, which gives it a sharper personal signature than many familiar first names.`,
    "classic-authority": `${name} has a long historic weight; it sounds more like a public-facing expert, founder, or strategist than a casual creator handle.`,
    "mythic-elegant": `${name} feels elegant and luminous, with a mythic association that suits beauty, storytelling, lifestyle, or a refined founder identity.`,
    "expanded-personal": `${name} feels established and complete, but the longer shape asks for a strong visual system so it does not feel too formal.`,
    "compact-personal": culturalRead || `${name} feels direct and person-led; it can become credible quickly if the page shows a real story and visible work.`
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

function getQualityScores(scoreProfile, traits, history) {
  const factorMap = Object.fromEntries(scoreProfile.factors.map((factor) => [factor.label, factor.value]));
  const historyDepth = Math.min(18, (history.facts?.length || 0) * 3);
  const meaningBonus = traits.meaning !== "meaning not confirmed" ? 8 : 0;
  const globalSignal = /international|global|widely|across|multicultural|many cultures/i.test(`${history.copy} ${traits.origin}`) ? 16 : 0;
  const rarityBase = 100 - Math.round((factorMap["Social Handle Potential"] || 50) * 0.36) - Math.max(0, 14 - traits.compact.length) * 2;

  return [
    {
      label: "Coolness Score",
      value: clamp(Math.round((factorMap.Brandability || 50) * 0.45 + (factorMap["Visual Identity Potential"] || 50) * 0.35 + (traits.hasTech || traits.hasNumbers ? 16 : 8)), 0, 100),
      note: traits.hasTech || traits.hasNumbers ? "Digital signal gives it modern edge." : "Driven by sound, visual shape, and brand energy."
    },
    {
      label: "Rarity Score",
      value: clamp(rarityBase + (/[xzqvk]/i.test(traits.compact) ? 10 : 0) + (traits.origin.includes("Estimated") ? 6 : 0), 0, 100),
      note: "Higher means it feels less crowded and easier to own."
    },
    {
      label: "Memorability Score",
      value: clamp(Math.round((factorMap.Memorability || 50) * 0.72 + (factorMap.Pronunciation || 50) * 0.18 + meaningBonus), 0, 100),
      note: "Balances rhythm, pronunciation, length, and story."
    },
    {
      label: "Global Popularity Score",
      value: clamp(Math.round((100 - (factorMap.Uniqueness || 50)) * 0.34 + (factorMap.Pronunciation || 50) * 0.24 + historyDepth + globalSignal), 0, 100),
      note: globalSignal ? "History suggests cross-cultural recognition." : "Estimated from familiarity, pronunciation, and available history."
    }
  ];
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
      atmosphereReason: `The site should feel purposeful and calm, as if ${name} is guiding someone through a mission instead of simply showing projects.`
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
      atmosphereReason: `${name} should feel like a decision has already been organized before the page is opened.`
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

const NAME_VARIANTS = {
  rasul: ["rassul", "rasool", "resul"],
  egor: ["yegor", "igor", "georgy", "george"],
  yegor: ["egor", "igor", "georgy", "george"],
  alexander: ["alexandr", "aleksandr", "alexandre", "alejandro", "alex", "iskandar"],
  nacho: ["ignacio", "inaki"],
  diana: ["diane", "dianna"],
  sophia: ["sofia", "sofie", "sophie"],
  sofia: ["sophia", "sofie", "sophie"],
  muhammad: ["mohammed", "mohammad", "muhammed", "mohamed"],
  mohammed: ["muhammad", "mohammad", "muhammed", "mohamed"],
  ahmed: ["ahmad", "akhmad"],
  john: ["jon", "juan", "ivan", "johan", "jean", "ioannes"],
  maria: ["mary", "marie", "mariam", "mariya"],
  anna: ["anne", "ana", "hannah"],
  elena: ["helena", "yelena", "helen"],
  victor: ["viktor", "victorio"],
  victoria: ["viktoria", "victor"],
  zayn: ["zain", "zane", "zein"],
  aaliyah: ["aliyah", "alia", "alya"],
  xochitl: ["xochil", "sochitl"],
  fatima: ["fatimah", "fatma"],
  aisha: ["aesha", "aysha", "ayesha"],
  yusuf: ["yousef", "youssef", "joseph"],
  jose: ["joseph", "josef"],
  isabella: ["isabel", "isabelle"],
  priya: ["priya"],
  arjun: ["arjuna"],
  sakura: ["sakura"],
  mei: ["may", "meilin"],
  kai: ["cai", "kay"]
};

const NAME_HISTORY_DATA = {
  rasul: {
    title: "Rasul: Arabic name meaning Messenger",
    copy: "Rasul comes from Arabic and is commonly understood as Messenger or Apostle. In Islamic language and history, rasul carries deep cultural and religious significance because it refers to a divinely sent messenger. As a personal brand, the meaning gives the name a serious, mission-driven feeling connected to communication, leadership, and purpose.",
    facts: [
      ["Origin", "Arabic"],
      ["Language", "Arabic"],
      ["Historical Meaning", "Messenger or Apostle"],
      ["Cultural Significance", "Strong religious and historical association with a divinely sent messenger in Islamic context"],
      ["Famous / Notable References", "Used as a given name and surname in Muslim communities; verify specific public figures before using them in brand copy"],
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
  },
  sophia: createHistoryRecord("Sophia", "Greek", "Greek", "wisdom", "A classical international name with philosophical and elegant associations.", "The meaning supports an intelligent, refined, and trustworthy personal brand."),
  muhammad: createHistoryRecord("Muhammad", "Arabic", "Arabic", "praiseworthy or praised", "One of the most widely used names in the world, with major Islamic historical and cultural significance.", "The name carries dignity, recognition, and a strong public trust signal."),
  ahmed: createHistoryRecord("Ahmed", "Arabic", "Arabic", "highly praised or one who thanks God", "A major Arabic name used across Muslim communities and many regions.", "Works well for a calm, respected, and professional identity."),
  aaliyah: createHistoryRecord("Aaliyah", "Arabic / Hebrew usage", "Arabic / Hebrew", "high, exalted, or ascending", "A name with graceful upward meaning and strong modern recognition.", "The upward meaning is useful for a premium growth, creator, or wellness identity."),
  maria: createHistoryRecord("Maria", "Latin / Greek form of Mary", "Latin / Greek / Hebrew tradition", "often connected to Mary; exact ancient meaning is debated", "A deeply international name with Christian, European, and global cultural presence.", "Feels human, trusted, classic, and adaptable across many industries."),
  anna: createHistoryRecord("Anna", "Hebrew through Greek and Latin tradition", "Hebrew / Greek / Latin", "grace or favor", "A widely used international name with a simple, balanced shape.", "The symmetry and gentle meaning support a clean, warm, premium identity."),
  john: createHistoryRecord("John", "Hebrew through Greek and Latin tradition", "Hebrew / Greek / Latin", "God is gracious", "A classic international name with major religious, historical, and cultural depth.", "Best branded through specificity, because the name is trusted but very common."),
  ivan: createHistoryRecord("Ivan", "Slavic form of John", "Slavic", "God is gracious", "A strong Slavic form used across Eastern Europe and beyond.", "Feels concise, direct, and more distinctive than John in English-language branding."),
  elena: createHistoryRecord("Elena", "Greek / Romance / Slavic usage", "Greek-derived", "bright, shining, or torch-like", "A graceful international form connected to Helen and Helena.", "The light meaning supports elegant visuals, editorial layouts, and refined creator branding."),
  victor: createHistoryRecord("Victor", "Latin", "Latin", "winner or conqueror", "A strong Roman name that communicates success and resilience.", "The meaning gives immediate strategic, athletic, or founder-brand energy."),
  victoria: createHistoryRecord("Victoria", "Latin", "Latin", "victory", "A royal and classical name associated with triumph, power, and historic elegance.", "Strong fit for premium, leadership, and achievement-led identity systems."),
  zayn: createHistoryRecord("Zayn", "Arabic", "Arabic", "beauty, grace, or adornment", "A short Arabic name with modern global recognition and stylish sound.", "The compact Z opening gives it fashion, creator, and music-brand potential."),
  noah: createHistoryRecord("Noah", "Hebrew", "Hebrew", "rest or comfort", "A biblical name with a soft, widely recognized international profile.", "The calm meaning works well for wellness, storytelling, education, and founder identity."),
  olivia: createHistoryRecord("Olivia", "Latin literary usage", "Latin", "connected to olive or olive tree", "A graceful name popularized through literature and modern global usage.", "The olive association can become a visual story around peace, growth, and elegance."),
  emma: createHistoryRecord("Emma", "Germanic", "Germanic", "whole or universal", "A concise international name with soft sound and broad familiarity.", "The simple shape needs a strong visual motif to stand apart from other familiar first names."),
  david: createHistoryRecord("David", "Hebrew", "Hebrew", "beloved", "A historic biblical and royal name used across many cultures.", "The meaning creates a warm trust signal, while the commonness requires precise positioning."),
  michael: createHistoryRecord("Michael", "Hebrew", "Hebrew", "who is like God?", "A classic biblical name with major international usage and strong historical presence.", "Feels established and reliable, best with a modern visual system to avoid feeling generic."),
  xochitl: createHistoryRecord("Xochitl", "Nahuatl", "Nahuatl", "flower", "A culturally distinctive Indigenous Mexican name with botanical meaning and strong visual potential.", "The flower meaning can become an elegant symbol system without making the identity feel generic or decorative."),
  fatima: createHistoryRecord("Fatima", "Arabic", "Arabic", "one who abstains or weans", "A deeply significant Arabic name with major Islamic cultural and historical presence.", "Works well for a respected, graceful, trust-led identity."),
  aisha: createHistoryRecord("Aisha", "Arabic", "Arabic", "alive or living", "A widely used Arabic name with strong historical recognition in Islamic tradition.", "The living meaning supports warm, energetic, creator-led branding."),
  omar: createHistoryRecord("Omar", "Arabic", "Arabic", "flourishing, long-lived, or eloquent", "A concise Arabic name used across many cultures and public figures.", "The short shape and mature sound make it strong for professional or founder branding."),
  ali: createHistoryRecord("Ali", "Arabic", "Arabic", "high, elevated, or noble", "A short name with major Arabic and Islamic historical significance.", "The three-letter form is excellent for a monogram but needs distinctive positioning because it is common."),
  yusuf: createHistoryRecord("Yusuf", "Arabic / Hebrew tradition", "Arabic / Hebrew", "God increases", "A major cross-cultural form related to Joseph, used widely in Muslim communities and beyond.", "The softer sound and long history make it useful for trustworthy personal branding."),
  jose: createHistoryRecord("Jose", "Spanish and Portuguese form of Joseph", "Spanish / Portuguese / Hebrew tradition", "God increases", "A very familiar name across Spanish- and Portuguese-speaking cultures.", "The brand should add a precise category signal so the familiarity becomes trust rather than blandness."),
  diego: createHistoryRecord("Diego", "Spanish", "Spanish", "meaning debated; often connected to James, Jacob, or teaching traditions", "A strong Spanish name with energetic, artistic, and international recognition.", "The open ending gives it movement, making it useful for creator, sports, or founder identity."),
  mateo: createHistoryRecord("Mateo", "Spanish form of Matthew", "Spanish / Hebrew tradition", "gift of God", "A warm international name with biblical roots and modern popularity.", "The vowel rhythm makes it approachable and excellent for personal storytelling."),
  carlos: createHistoryRecord("Carlos", "Spanish and Portuguese form of Charles", "Spanish / Portuguese / Germanic tradition", "free man", "A classic Iberian and Latin American name with broad professional familiarity.", "Works well when paired with a sharp specialty, because the base name is trusted and familiar."),
  isabella: createHistoryRecord("Isabella", "Romance-language form of Elizabeth", "Italian / Spanish / Hebrew tradition", "pledged to God or God is abundance", "A graceful royal and literary name with premium emotional tone.", "Best suited to elegant typography, storytelling, and lifestyle or founder branding."),
  priya: createHistoryRecord("Priya", "Sanskrit", "Sanskrit / Indian usage", "beloved or dear", "A warm South Asian name with affectionate meaning and broad cultural recognition.", "The meaning gives it immediate emotional warmth for creator, wellness, and people-centered brands."),
  arjun: createHistoryRecord("Arjun", "Sanskrit", "Sanskrit / Indian usage", "bright, white, or shining", "A major Indian name strongly associated with the heroic figure Arjuna from the Mahabharata.", "The heroic association supports a bold, disciplined, achievement-led identity."),
  sakura: createHistoryRecord("Sakura", "Japanese", "Japanese", "cherry blossom", "A Japanese name and symbol connected to beauty, seasonality, impermanence, and renewal.", "The visual system can use delicate contrast and seasonal motion while staying modern."),
  mei: createHistoryRecord("Mei", "Chinese and Japanese usage", "Chinese / Japanese", "often connected to beauty, plum blossom, or brightness depending on characters", "A very compact East Asian name where meaning depends on written characters.", "Because the name is short, the logo should rely on spacing, mark design, and a clear cultural context."),
  kai: createHistoryRecord("Kai", "Multicultural", "Hawaiian / Japanese / Chinese / Germanic and other uses", "meaning varies by culture; often associated with sea in Hawaiian", "A short global name with different meanings across languages and regions.", "The name feels modern and flexible, but the brand should choose one cultural story carefully.")
};

function createHistoryRecord(name, origin, language, meaning, culture, brandFact) {
  return {
    title: `${name}: ${origin} name intelligence`,
    copy: `${name} is commonly connected to ${origin} naming history, with a meaning often given as ${meaning}. ${culture} As a brand, it should turn that background into a specific visual and storytelling angle rather than relying only on familiarity.`,
    facts: [
      ["Origin", origin],
      ["Language", language],
      ["Historical Meaning", meaning],
      ["Cultural Significance", culture],
      ["Brand Fact", brandFact]
    ],
    source: `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}_(given_name)`,
    sourceLabel: "Reference"
  };
}

function normalizeNameKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getPrimaryNamePart(name) {
  return String(name || "").trim().split(/[\s_-]+/).filter(Boolean)[0] || "";
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function getNameCandidates(name) {
  const firstWord = getPrimaryNamePart(name);
  const normalized = normalizeNameKey(firstWord);
  const candidates = [firstWord, normalized];
  const variants = NAME_VARIANTS[normalized] || [];

  candidates.push(...variants);
  Object.entries(NAME_VARIANTS).forEach(([base, baseVariants]) => {
    if (baseVariants.includes(normalized)) {
      candidates.push(base);
    }
  });

  if (normalized.includes("ph")) candidates.push(normalized.replace(/ph/g, "f"));
  if (normalized.includes("f")) candidates.push(normalized.replace(/f/g, "ph"));
  if (normalized.includes("ks")) candidates.push(normalized.replace(/ks/g, "x"));
  if (normalized.includes("x")) candidates.push(normalized.replace(/x/g, "ks"));
  if (normalized.endsWith("y")) candidates.push(`${normalized.slice(0, -1)}i`);
  if (normalized.endsWith("i")) candidates.push(`${normalized.slice(0, -1)}y`);
  candidates.push(normalized.replace(/(.)\1+/g, "$1"));

  return uniqueValues(candidates.map((candidate) => normalizeNameKey(candidate)));
}

function getFallbackHistory(name) {
  const candidates = getNameCandidates(name);
  for (const candidate of candidates) {
    if (NAME_HISTORY_DATA[candidate]) {
      return cloneHistoryRecord(NAME_HISTORY_DATA[candidate], name, candidate);
    }
  }

  return null;
}

function cloneHistoryRecord(record, requestedName, matchedKey) {
  const requested = getPrimaryNamePart(requestedName);
  const facts = record.facts.map(([label, text]) => [label, text]);

  if (normalizeNameKey(requested) !== matchedKey) {
    facts.push(["Variant Match", `${requested} was matched to the related form ${matchedKey}. Treat the origin as a close linguistic signal, not a guaranteed exact etymology.`]);
  }

  return {
    ...record,
    facts
  };
}

function isLikelyNameSummary(data, candidate) {
  const haystack = `${data.title || ""} ${data.description || ""} ${data.extract || ""}`.toLowerCase();
  const key = normalizeNameKey(candidate);
  return Boolean(data.extract)
    && data.type !== "disambiguation"
    && (
      haystack.includes("given name")
      || haystack.includes("surname")
      || haystack.includes("name")
      || normalizeNameKey(data.title).includes(key)
    );
}

async function fetchWithTimeout(endpoint, timeoutMs = 1700) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    window.clearTimeout(timeout);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    window.clearTimeout(timeout);
    return null;
  }
}

async function fetchWikipediaSummary(query, candidate, fallback) {
  const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
  const data = await fetchWithTimeout(endpoint);

  if (!data || !isLikelyNameSummary(data, candidate)) {
    return null;
  }

  return {
    title: data.title || `${candidate} history`,
    copy: `${data.extract} ${fallback ? fallback.copy : ""}`.trim(),
    facts: fallback?.facts || [
      ["Origin", "Live encyclopedia summary found"],
      ["Language", "See the linked source for exact linguistic details"],
      ["Historical Meaning", "Extracted from the available historical summary"],
      ["Cultural Significance", "Useful for checking whether the name has existing public meaning"],
      ["Famous / Notable References", data.description || "See the linked source for notable people and references"]
    ],
    source: data.content_urls?.desktop?.page || endpoint,
    sourceLabel: "Wikipedia source"
  };
}

async function fetchWikipediaSearchTitles(candidate) {
  const endpoint = `https://en.wikipedia.org/w/api.php?action=opensearch&namespace=0&limit=6&format=json&origin=*&search=${encodeURIComponent(`${candidate} given name`)}`;
  const data = await fetchWithTimeout(endpoint);
  const titles = Array.isArray(data?.[1]) ? data[1] : [];
  return titles.filter((title) => /name|given|surname/i.test(title) || normalizeNameKey(title).includes(candidate));
}

async function fetchWikidataNameRecord(candidate) {
  const endpoint = `https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&format=json&origin=*&limit=6&search=${encodeURIComponent(candidate)}`;
  const data = await fetchWithTimeout(endpoint);
  const records = Array.isArray(data?.search) ? data.search : [];
  const match = records.find((record) => {
    const text = `${record.label || ""} ${record.description || ""} ${(record.aliases || []).join(" ")}`.toLowerCase();
    return normalizeNameKey(record.label).includes(candidate) && /given name|family name|surname|name/i.test(text);
  });

  if (!match) return null;

  return {
    title: `${match.label}: name record found`,
    copy: `Wikidata has a name-related record for ${match.label}. The available description is "${match.description || "name record"}"; use this as a live evidence signal alongside the brand analysis, especially if the exact origin is not fully documented in a short public summary.`,
    facts: [
      ["Origin", "Matched in a live name record"],
      ["Language", "See Wikidata record for language and regional details"],
      ["Historical Meaning", match.description || "Name record found, meaning requires deeper validation"],
      ["Cultural Significance", "The name appears in a structured public knowledge base, which helps confirm it is not just an invented handle"],
      ["Variant / Alias Signal", (match.aliases || []).slice(0, 4).join(", ") || "No aliases listed in the short search result"]
    ],
    source: match.concepturi || "",
    sourceLabel: "Wikidata source"
  };
}

function getLevenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, index) => [index]);
  for (let column = 1; column <= b.length; column += 1) matrix[0][column] = column;

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function getFuzzyFallbackHistory(name) {
  const key = normalizeNameKey(getPrimaryNamePart(name));
  if (!key || key.length < 3) return null;

  const searchable = Object.keys(NAME_HISTORY_DATA).flatMap((base) => [base, ...(NAME_VARIANTS[base] || [])].map((variant) => [base, variant]));
  let best = null;

  searchable.forEach(([base, variant]) => {
    const distance = getLevenshteinDistance(key, normalizeNameKey(variant));
    const limit = key.length <= 6 ? 1 : 2;
    if (distance <= limit && (!best || distance < best.distance)) {
      best = { base, variant, distance };
    }
  });

  if (!best) return null;

  const record = cloneHistoryRecord(NAME_HISTORY_DATA[best.base], name, best.base);
  return {
    ...record,
    title: `${getPrimaryNamePart(name)}: closest historical match found`,
    copy: `${getPrimaryNamePart(name)} did not return a perfect public-source match, but it is close to ${best.variant}, a known related form. ${record.copy}`,
    facts: [
      ["Match Confidence", best.distance === 0 ? "High variant match" : "Estimated fuzzy match"],
      ["Closest Form", best.variant],
      ...record.facts
    ]
  };
}

function estimateNameHistory(name) {
  const firstWord = getPrimaryNamePart(name);
  const key = normalizeNameKey(firstWord);
  const hasNumbers = /\d/.test(firstWord);
  const signals = [];

  if (/^(xoch|itz|citl)/.test(key) || /(tl|tzin)$/.test(key)) {
    signals.push(["Origin", "Estimated Nahuatl or Indigenous Mexican naming signal"], ["Language", "Likely Nahuatl-influenced"], ["Historical Meaning", "May connect to nature, place, or cultural symbolism; validate exact spelling and meaning"]);
  } else if (/^(abd|abu|ras|muh|moh|ahm|ali|omar|zay|aali|fatim|aish|yus)/.test(key)) {
    signals.push(["Origin", "Estimated Arabic / Islamic naming signal"], ["Language", "Likely Arabic-influenced"], ["Historical Meaning", "Meaning should be validated against Arabic name dictionaries"]);
  } else if (/^(priy|arjun|ravi|dev|anaya)/.test(key)) {
    signals.push(["Origin", "Estimated Sanskrit / South Asian naming signal"], ["Language", "Likely Sanskrit or Indian-language influence"], ["Historical Meaning", "May connect to virtue, light, devotion, or epic naming traditions; validate the exact form"]);
  } else if (/^(sakur|hiro|yuki|mei|kai)/.test(key)) {
    signals.push(["Origin", "Estimated East Asian naming signal"], ["Language", "Likely Japanese, Chinese, or regional East Asian influence"], ["Historical Meaning", "Meaning may depend on written characters, so exact confirmation is important"]);
  } else if (/(mir|slav|vlad|igor|egor|yev|yevgen|nik|ov)$/.test(key)) {
    signals.push(["Origin", "Estimated Slavic or Eastern European signal"], ["Language", "Likely Slavic-influenced"], ["Historical Meaning", "May connect to older regional naming roots; validate exact form"]);
  } else if (/(el|iel|iah)$/.test(key)) {
    signals.push(["Origin", "Estimated Hebrew / biblical-style signal"], ["Language", "Likely Hebrew-influenced"], ["Historical Meaning", "Names with this structure often carry religious or virtue-based meanings"]);
  } else if (/(a|ia|ina|ella)$/.test(key)) {
    signals.push(["Origin", "Estimated Latin, Romance, Slavic, or international feminine-name signal"], ["Language", "Likely cross-cultural European usage"], ["Historical Meaning", "Soft ending suggests an established given-name pattern, but exact meaning needs validation"]);
  } else if (/(o|io|ino)$/.test(key)) {
    signals.push(["Origin", "Estimated Romance, Spanish, Italian, or nickname-style signal"], ["Language", "Likely Romance-language influence"], ["Historical Meaning", "May be a short form, affectionate form, or regional variant"]);
  } else {
    signals.push(["Origin", hasNumbers ? "Digital alias or modern handle signal" : "Estimated modern personal-name signal"], ["Language", "Not enough public data for a confident language assignment"], ["Historical Meaning", "No exact meaning confirmed; analysis is based on sound, structure, and naming patterns"]);
  }

  return {
    title: `${firstWord}: estimated name intelligence`,
    copy: `${firstWord} does not have a strong exact public-source match in the quick live lookup, so BrandScan AI is using linguistic pattern analysis, spelling structure, sound, and related-name behavior. This is still useful for branding: the name's ${key.length}-character shape, ${/[aeiouy]/.test(key.slice(-1)) ? "open ending" : "firm ending"}, and ${/[xzqvk]/.test(key) ? "sharper consonant profile" : "softer sound profile"} give it a specific identity direction even when historical data is limited.`,
    facts: [
      ...signals,
      ["Confidence", "Estimated, not a verified etymology"],
      ["Cultural Significance", "Use this as a branding read; validate with cultural and linguistic sources before making formal claims"],
      ["Brand Fact", hasNumbers ? "The numeric detail makes it feel more like a chosen internet identity than a traditional given name" : "The absence of a dominant public meaning can be an advantage if the visual identity creates a clear story"]
    ],
    source: "",
    sourceLabel: ""
  };
}

async function fetchHistory(name) {
  const firstWord = getPrimaryNamePart(name);
  const candidates = getNameCandidates(firstWord);
  const fallback = getFallbackHistory(firstWord);

  for (const candidate of candidates) {
    const queries = [`${candidate} (given name)`, `${candidate} (name)`, candidate];
    for (const query of queries) {
      const summary = await fetchWikipediaSummary(query, candidate, fallback);
      if (summary) return summary;
    }
  }

  for (const candidate of candidates) {
    const titles = await fetchWikipediaSearchTitles(candidate);
    for (const title of titles) {
      const summary = await fetchWikipediaSummary(title, candidate, fallback);
      if (summary) return summary;
    }
  }

  for (const candidate of candidates) {
    const wikidataRecord = await fetchWikidataNameRecord(candidate);
    if (wikidataRecord) return fallback ? { ...wikidataRecord, copy: `${wikidataRecord.copy} ${fallback.copy}`, facts: fallback.facts } : wikidataRecord;
  }

  return fallback || getFuzzyFallbackHistory(firstWord) || estimateNameHistory(firstWord);
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
  const qualityScores = getQualityScores(scoreProfile, traits, history);

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
    qualityScores,
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
  if (!list) return;
  list.innerHTML = "";

  items.forEach((item) => {
    const element = document.createElement(tagName);
    element.textContent = item;
    list.appendChild(element);
  });
}

function getNameSlug(name) {
  return slugifyBrand(name).toLowerCase() || "name";
}

function getDirectResultUrl(profile) {
  const url = new URL(window.location.href);
  const slug = getNameSlug(profile.name);
  return `${url.origin}/name/${slug}`;
}

function getShareText(profile) {
  const topQuality = [...profile.qualityScores].sort((a, b) => b.value - a.value)[0];
  return `${profile.name} scored ${profile.score}/100 on BrandScan AI. ${topQuality.label}: ${topQuality.value}/100. ${profile.summary}`;
}

async function copyText(value, button, successLabel = "Copied") {
  const original = button?.textContent;
  try {
    await navigator.clipboard.writeText(value);
    if (button) {
      button.textContent = successLabel;
      window.setTimeout(() => {
        button.textContent = original;
      }, 1200);
    }
  } catch (error) {
    if (button) {
      button.textContent = "Copy failed";
      window.setTimeout(() => {
        button.textContent = original;
      }, 1200);
    }
  }
}

function updateSeoMetadata(profile) {
  const directUrl = getDirectResultUrl(profile);
  const title = `${profile.name} Name Meaning, Origin, Popularity & Brand Score | RasulTech`;
  const description = `Analyze ${profile.name}: ${profile.history.title}. Brand score ${profile.score}/100, quality scores, origin, meaning, similar names, and shareable identity insights.`;
  document.title = title;

  const ensureMeta = (selector, attributes) => {
    let element = document.head.querySelector(selector);
    if (!element) {
      element = document.createElement("meta");
      Object.entries(attributes.identity || {}).forEach(([key, value]) => element.setAttribute(key, value));
      document.head.appendChild(element);
    }
    Object.entries(attributes.values).forEach(([key, value]) => element.setAttribute(key, value));
  };

  ensureMeta('meta[name="description"]', { identity: { name: "description" }, values: { content: description } });
  ensureMeta('meta[property="og:title"]', { identity: { property: "og:title" }, values: { content: title } });
  ensureMeta('meta[property="og:description"]', { identity: { property: "og:description" }, values: { content: description } });
  ensureMeta('meta[property="og:url"]', { identity: { property: "og:url" }, values: { content: directUrl } });

  const schema = document.querySelector("#brandscan-schema");
  if (schema) {
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      url: directUrl,
      about: {
        "@type": "Thing",
        name: profile.name,
        description: profile.history.copy
      },
      mainEntity: {
        "@type": "DefinedTerm",
        name: profile.name,
        description: profile.analysis
      }
    });
  }

  const seoTitle = document.querySelector("#seo-title-preview");
  const seoDescription = document.querySelector("#seo-description-preview");
  const seoLink = document.querySelector("#seo-direct-link");
  if (seoTitle) seoTitle.textContent = title;
  if (seoDescription) seoDescription.textContent = description;
  if (seoLink) {
    seoLink.hidden = false;
    seoLink.href = directUrl;
    seoLink.textContent = directUrl.replace(/^https?:\/\//, "");
  }
}

function drawShareCard(profile) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#020617");
  gradient.addColorStop(0.55, "#083344");
  gradient.addColorStop(1, "#422006");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 630);

  context.fillStyle = "rgba(34, 211, 238, 0.18)";
  context.beginPath();
  context.arc(980, 120, 210, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(251, 191, 36, 0.14)";
  context.beginPath();
  context.arc(170, 520, 260, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#fbbf24";
  context.font = "700 34px Arial";
  context.fillText("RasulTech / BrandScan AI", 76, 92);
  context.fillStyle = "#ffffff";
  context.font = "900 88px Arial";
  context.fillText(profile.name.slice(0, 18), 76, 210);
  context.font = "900 126px Arial";
  context.fillText(`${profile.score}/100`, 76, 360);
  context.fillStyle = "#cbd5e1";
  context.font = "500 34px Arial";
  context.fillText(profile.summary.slice(0, 64), 76, 430);
  context.fillStyle = "#e0f2fe";
  context.font = "700 30px Arial";
  profile.qualityScores.slice(0, 3).forEach((item, index) => {
    context.fillText(`${item.label.replace(" Score", "")}: ${item.value}`, 76, 500 + index * 40);
  });

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${getNameSlug(profile.name)}-brandscan-card.png`;
  link.click();
}

function showBrandProfile(profile) {
  const scoreOrbit = document.querySelector("#score-orbit");
  activeBrandProfile = profile;

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

  const qualityGrid = document.querySelector("#quality-grid");
  if (qualityGrid) {
    qualityGrid.innerHTML = "";
    profile.qualityScores.forEach((item) => {
      const quality = document.createElement("div");
      quality.className = "quality-meter";
      quality.style.setProperty("--quality", `${item.value * 3.6}deg`);
      quality.innerHTML = `
        <div class="quality-ring"><span>${item.value}</span></div>
        <div>
          <strong>${item.label}</strong>
          <p>${item.note}</p>
        </div>
      `;
      qualityGrid.appendChild(quality);
    });
  }

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

  updateSeoMetadata(profile);
}

async function analyzeBrand(value) {
  const name = cleanBrandName(value);

  if (!name) {
    brandInput?.focus();
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
      if (window.location.pathname.includes("brandscan.html")) {
        window.history.replaceState({ name }, "", `brandscan.html?name=${encodeURIComponent(name)}#/name/${getNameSlug(name)}`);
      }
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

if (homeNameForm) {
  homeNameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = cleanBrandName(homeNameInput.value);
    if (!name) {
      homeNameInput.focus();
      return;
    }
    window.location.href = `brandscan.html?name=${encodeURIComponent(name)}#/name/${getNameSlug(name)}`;
  });
}

if (homeLifeForm) {
  homeLifeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const dateValue = homeBirthDateInput.value;
    if (!dateValue) {
      homeBirthDateInput.focus();
      return;
    }
    window.location.href = `lifetimeline.html?date=${encodeURIComponent(dateValue)}#/timeline/${dateValue}`;
  });
}

if (copyResultButton) {
  copyResultButton.addEventListener("click", () => {
    if (!activeBrandProfile) return;
    copyText(`${getShareText(activeBrandProfile)}\n${getDirectResultUrl(activeBrandProfile)}`, copyResultButton, "Result Copied");
  });
}

if (copyDirectLinkButton) {
  copyDirectLinkButton.addEventListener("click", () => {
    if (!activeBrandProfile) return;
    copyText(getDirectResultUrl(activeBrandProfile), copyDirectLinkButton, "Link Copied");
  });
}

if (shareResultButton) {
  shareResultButton.addEventListener("click", async () => {
    if (!activeBrandProfile) return;
    const shareData = {
      title: `${activeBrandProfile.name} BrandScan AI Result`,
      text: getShareText(activeBrandProfile),
      url: getDirectResultUrl(activeBrandProfile)
    };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      copyText(`${shareData.text}\n${shareData.url}`, shareResultButton, "Share Text Copied");
    }
  });
}

if (generateShareCardButton) {
  generateShareCardButton.addEventListener("click", () => {
    if (!activeBrandProfile) return;
    drawShareCard(activeBrandProfile);
  });
}

if (brandscanForm) {
  const params = new URLSearchParams(window.location.search);
  const pathNameMatch = window.location.pathname.match(/\/name\/([^/]+)/);
  const initialName = params.get("name") || (pathNameMatch ? decodeURIComponent(pathNameMatch[1].replace(/-/g, " ")) : "");
  if (initialName) {
    brandInput.value = initialName;
    window.setTimeout(() => analyzeBrand(initialName), 280);
  }
}

const lifeForm = document.querySelector("#life-form");
const birthDateInput = document.querySelector("#birth-date");
const lifeDateDisplay = document.querySelector("#life-date-display");
const lifeYearJump = document.querySelector("#life-year-jump");
const lifeYearGrid = document.querySelector("#life-year-grid");
const lifeMonthGrid = document.querySelector("#life-month-grid");
const lifeDayGrid = document.querySelector("#life-day-grid");
const lifeLoading = document.querySelector("#life-loading");
const lifeResults = document.querySelector("#life-results");
const resetLifeButton = document.querySelector("#reset-life");
const downloadLifeCardButton = document.querySelector("#download-life-card");
const copyLifeLinkButton = document.querySelector("#copy-life-link");
const shareLifeResultButton = document.querySelector("#share-life-result");
let activeLifeProfile = null;
const lifeDateState = {
  year: 2000,
  month: 10,
  day: 6
};

const HISTORICAL_FACTS = {
  1980: ["CNN launched and changed the speed of global news.", "Pac-Man became an arcade icon.", "The Voyager probes continued sending back deep-space perspective."],
  1981: ["MTV launched with a new visual language for music.", "The first Space Shuttle mission flew.", "IBM released its first personal computer."],
  1982: ["E.T. became a defining movie of the decade.", "The compact disc was introduced commercially.", "The Commodore 64 helped bring computing into homes."],
  1983: ["The internet's TCP/IP standard became official.", "Motorola introduced the DynaTAC mobile phone.", "Sally Ride became the first American woman in space."],
  1984: ["Apple introduced the Macintosh.", "The first TED conference was held.", "Tetris was created and became a global puzzle language."],
  1985: ["Back to the Future made time travel pop culture.", "Nintendo released the NES in North America.", "Live Aid showed the scale of global televised music events."],
  1986: ["The Mir space station launched.", "Pixar was founded.", "The Chernobyl disaster reshaped global nuclear conversations."],
  1987: ["The Simpsons began as shorts on The Tracey Ullman Show.", "Final Fantasy launched in Japan.", "The Montreal Protocol became a major environmental agreement."],
  1988: ["The first major internet worm exposed network vulnerability.", "CDs began overtaking vinyl in many markets.", "NASA resumed shuttle flights after Challenger."],
  1989: ["The Berlin Wall fell.", "The World Wide Web was proposed by Tim Berners-Lee.", "Game Boy launched and made portable gaming iconic."],
  1990: ["The Hubble Space Telescope launched.", "Home Alone became a cultural movie phenomenon.", "The web moved from idea toward working reality."],
  1991: ["The World Wide Web became publicly available.", "Nirvana's Nevermind changed mainstream music.", "The Gulf War became a global televised conflict."],
  1992: ["Text messaging began its long climb into daily life.", "The Dream Team dominated Olympic basketball.", "Windows 3.1 made PCs feel more approachable."],
  1993: ["The Mosaic browser made the web easier to explore.", "Jurassic Park redefined blockbuster effects.", "The first Beanie Babies arrived."],
  1994: ["Amazon was founded.", "The PlayStation launched in Japan.", "Netscape helped turn the web into a consumer platform."],
  1995: ["Windows 95 brought the Start menu into everyday life.", "Toy Story became the first feature-length computer-animated film.", "eBay launched."],
  1996: ["Pokemon debuted in Japan.", "DVD technology launched commercially.", "The Nintendo 64 brought 3D gaming into living rooms."],
  1997: ["Netflix was founded as a DVD rental company.", "Deep Blue defeated Garry Kasparov.", "Titanic became a global film event."],
  1998: ["Google was founded, changing how the world searched for information.", "The International Space Station began assembly in orbit.", "MP3 players were becoming part of everyday digital culture."],
  1999: ["The world prepared for Y2K and a new digital century.", "Bluetooth 1.0 was introduced.", "The euro launched as an electronic currency."],
  2000: ["The world entered a new millennium with intense technology optimism.", "Camera phones began moving toward mainstream life.", "The PlayStation 2 launched and shaped home entertainment."],
  2001: ["Wikipedia launched and changed public knowledge forever.", "The iPod introduced a new era of portable music.", "Human spaceflight continued aboard the International Space Station."],
  2002: ["Friendster helped define early social networking.", "Camera phones spread more widely across global markets.", "The Segway became a symbol of futuristic urban mobility."],
  2003: ["Skype launched, making internet calls feel normal.", "Myspace grew into an early social media giant.", "The Human Genome Project was completed."],
  2004: ["Facebook launched from a college dorm room.", "Mozilla Firefox 1.0 gave web users a major browser alternative.", "NASA rovers Spirit and Opportunity landed on Mars."],
  2005: ["YouTube launched and transformed video culture.", "Google Maps made digital navigation feel everyday.", "Podcasting began entering mainstream awareness."],
  2006: ["Twitter launched and changed real-time public conversation.", "Nintendo Wii made motion controls mainstream.", "Cloud computing started becoming a serious business category."],
  2007: ["The first iPhone was introduced.", "Netflix began streaming video online.", "Kindle helped push digital reading into the mainstream."],
  2008: ["Spotify launched in Europe.", "The Large Hadron Collider powered up.", "The Beijing Olympics became a major global spectacle."],
  2009: ["Bitcoin's network began.", "Avatar pushed 3D cinema into the spotlight.", "Kepler launched to search for exoplanets."],
  2010: ["Instagram launched.", "The iPad introduced a new tablet era.", "The FIFA World Cup brought vuvuzelas into global pop culture."],
  2011: ["Snapchat launched.", "Minecraft officially released.", "NASA's Juno mission launched toward Jupiter."],
  2012: ["Curiosity landed on Mars.", "Gangnam Style became a global internet music moment.", "The London Olympics dominated sports culture."],
  2013: ["Frozen became a major cultural phenomenon.", "The PlayStation 4 and Xbox One launched.", "Vine shaped short-form internet humor."],
  2014: ["The Rosetta mission reached comet 67P.", "TikTok's predecessor Musical.ly launched.", "The Ice Bucket Challenge showed viral fundraising power."],
  2015: ["CRISPR entered mainstream science conversation.", "The Paris Climate Agreement was adopted.", "Apple Watch launched."],
  2016: ["Pokemon Go turned streets into game boards.", "Reusable rocket landings became more visible.", "TikTok launched in China as Douyin."],
  2017: ["Fortnite Battle Royale exploded in popularity.", "Scientists detected a neutron-star merger.", "The Nintendo Switch launched."],
  2018: ["Black Panther became a global cultural event.", "The Parker Solar Probe launched toward the Sun.", "Short-form creator culture accelerated."],
  2019: ["The first image of a black hole was released.", "Disney+ launched.", "TikTok became a dominant global social platform."],
  2020: ["Remote life became mainstream almost overnight.", "Animal Crossing became a comfort game for millions.", "SpaceX flew astronauts from U.S. soil."],
  2021: ["The James Webb Space Telescope launched.", "NFTs entered mainstream culture.", "Perseverance landed on Mars."],
  2022: ["Generative AI entered public conversation.", "The World Cup in Qatar became a global sports focus.", "Artemis I flew around the Moon."],
  2023: ["AI assistants became everyday creative tools.", "Barbie and Oppenheimer became a shared movie moment.", "India's Chandrayaan-3 landed near the lunar south pole."],
  2024: ["A total solar eclipse crossed North America.", "AI video and multimodal tools accelerated.", "Paris prepared to host the Summer Olympics."],
  2025: ["Personal AI tools continued moving into everyday work.", "Mixed-reality devices pushed spatial computing forward.", "Climate technology and battery systems stayed in focus."],
  2026: ["AI-native apps became a normal part of building and learning.", "Private space missions continued expanding access to orbit.", "Personal analytics products became more interactive and visual."]
};

const DECADE_CONTEXT = {
  1980: ["analog-to-digital transition", "arcades, cable TV, synth pop, blockbuster movies"],
  1990: ["early internet childhood", "CDs, game consoles, sitcoms, grunge, and the first web browsers"],
  2000: ["millennial internet culture", "flip phones, forums, DVDs, pop music, and early social networks"],
  2010: ["mobile-first life", "apps, streaming, creators, memes, and always-connected identity"],
  2020: ["AI and remote-era adulthood", "short video, streaming culture, spatial computing, and generative tools"]
};

const MONTH_SIGNALS = [
  ["January", "new-year energy", "Your birth month carries reset energy: planning, first chapters, and the feeling of stepping into a blank calendar."],
  ["February", "quiet winter focus", "Your birth month sits close to reflection, loyalty, and the small rituals people use to get through winter."],
  ["March", "threshold energy", "Your birth month feels like a doorway from winter into motion, giving the timeline a renewal signal."],
  ["April", "spring momentum", "Your birth month is tied to growth, rain, color returning, and the emotional lift of longer days."],
  ["May", "bright social energy", "Your birth month often feels warm, expressive, and close to graduation seasons, outdoor life, and early summer anticipation."],
  ["June", "summer opening", "Your birth month has long-day energy: movement, celebration, school endings, and open horizons."],
  ["July", "high-summer intensity", "Your birth month feels cinematic and warm, with travel, independence, and peak-season memories."],
  ["August", "late-summer glow", "Your birth month carries golden-hour energy: endings approaching, heat, reflection, and readiness."],
  ["September", "fresh-start focus", "Your birth month is tied to school-year energy, structure, reinvention, and the first signal of autumn."],
  ["October", "cinematic autumn", "Your birth month feels atmospheric: darker evenings, memory, mystery, warm lights, and story-rich nostalgia."],
  ["November", "deep reflection", "Your birth month has quiet intensity: gratitude, colder air, family rituals, and end-of-year perspective."],
  ["December", "closing chapter magic", "Your birth month carries celebration, reflection, winter brightness, and the emotional weight of a year ending."]
];

const DAY_SIGNALS = [
  "first spark", "builder rhythm", "connector energy", "steady foundation", "restless explorer",
  "mentor signal", "analyst mind", "ambition pulse", "old-soul curiosity", "reset marker"
];

const TECHNOLOGY_ERAS = [
  [1995, "Web Era", "The internet becomes personal, searchable, and social."],
  [2001, "Portable Digital Life", "Music, phones, and messaging become pocket-sized identity tools."],
  [2007, "Smartphone World", "Touchscreens turn the internet into something people carry everywhere."],
  [2012, "Social Video Culture", "Feeds, creators, and mobile cameras reshape memory and attention."],
  [2020, "Remote-First Life", "Work, school, and connection become more digitally distributed."],
  [2023, "AI Companion Era", "Generative AI makes software feel conversational and creative."]
];

const YEAR_CAPSULES = {
  1985: {
    world: "Mikhail Gorbachev became leader of the Soviet Union, setting up a decade of major geopolitical change.",
    science: "The ozone hole over Antarctica became a major scientific warning signal for the planet.",
    politics: "Cold War tension was still shaping world identity, but the system was beginning to shift.",
    sports: "Chicago Bears energy dominated American football culture as the 1985 season became legendary.",
    culture: "Live Aid turned music into a global televised humanitarian event.",
    movies: "Back to the Future made time travel, nostalgia, and possibility part of pop culture language.",
    music: "Synth pop, arena rock, and MTV-driven visuals were defining how music looked and felt.",
    technology: "Home computers and game consoles were moving from hobbyist worlds into family rooms."
  },
  1990: {
    world: "Germany reunified, marking one of the clearest symbols of the post-Cold War world.",
    science: "The Hubble Space Telescope launched, changing how people imagined deep space.",
    politics: "Nelson Mandela was released from prison, becoming a central figure in a new political era.",
    sports: "The FIFA World Cup in Italy gave the year a global football soundtrack.",
    culture: "Sitcoms, CDs, malls, and cable TV shaped mainstream memory.",
    movies: "Home Alone became a defining family movie of the year.",
    music: "Hip-hop, dance pop, and alternative rock were all pushing into the mainstream.",
    technology: "Most people were not online yet; personal computers existed, but the web was still about to arrive."
  },
  1995: {
    world: "The World Trade Organization was formed, reflecting a more connected global economy.",
    science: "The first exoplanet around a Sun-like star was confirmed, expanding the map of possible worlds.",
    politics: "The Dayton Agreement helped end the Bosnian War.",
    sports: "The Rugby World Cup in South Africa became a powerful sports and cultural moment.",
    culture: "The 1990s felt bright, commercial, and increasingly digital.",
    movies: "Toy Story became the first feature-length computer-animated film.",
    music: "Pop, hip-hop, R&B, grunge echoes, and Britpop were all competing for attention.",
    technology: "Windows 95 made personal computing feel more mainstream and visual."
  },
  2000: {
    world: "The world entered a new millennium with Y2K behind it and global tech optimism ahead.",
    science: "The Human Genome Project was accelerating toward a completed draft.",
    politics: "A disputed U.S. presidential election became one of the year's defining political stories.",
    sports: "The Sydney Olympics created a bright global sports moment.",
    culture: "DVDs, boy bands, pop stars, and early internet culture shaped the atmosphere.",
    movies: "Gladiator and Cast Away were among the movies defining the year.",
    music: "Pop, R&B, nu metal, and hip-hop dominated radio and MTV.",
    technology: "Many people used dial-up internet, desktop PCs, early mobile phones, and physical media."
  },
  2005: {
    world: "The internet was becoming more social, searchable, and video-driven.",
    science: "The Huygens probe landed on Titan, revealing a strange moon-world.",
    politics: "Global attention stayed focused on conflict, climate, and post-9/11 politics.",
    sports: "Liverpool's Champions League comeback became one of football's famous modern finals.",
    culture: "Reality TV, blogs, forums, and ringtone culture were everywhere.",
    movies: "Star Wars: Revenge of the Sith closed the prequel era.",
    music: "iPods, digital downloads, pop punk, hip-hop, and R&B shaped listening habits.",
    technology: "YouTube launched, making online video feel like a new public stage."
  },
  2010: {
    world: "The world was entering a mobile-first decade after the financial crisis years.",
    science: "The first synthetic bacterial cell was announced, pushing synthetic biology into headlines.",
    politics: "The Arab Spring was about to begin, with social media becoming part of political movements.",
    sports: "The FIFA World Cup in South Africa became a global cultural moment.",
    culture: "Memes, apps, streaming, and social feeds were becoming normal life.",
    movies: "Inception and Toy Story 3 became major cultural touchpoints.",
    music: "Pop, EDM, rap, and YouTube-driven discovery were shaping youth culture.",
    technology: "The iPad launched, Instagram launched, and smartphones were becoming the center of daily life."
  },
  2015: {
    world: "The Paris Climate Agreement made climate action a central global conversation.",
    science: "CRISPR gene-editing became a major mainstream science story.",
    politics: "Migration, climate, and digital security were major global themes.",
    sports: "The U.S. women's national soccer team won the World Cup.",
    culture: "Streaming culture, fandoms, and creator platforms became more powerful.",
    movies: "Star Wars: The Force Awakens revived one of cinema's biggest franchises.",
    music: "Streaming was changing charts, discovery, and how songs became global.",
    technology: "Apple Watch launched and wearables moved deeper into personal data."
  }
};

const CATEGORY_FALLBACKS = {
  world: [
    "Globalization, climate, migration, and digital networks were reshaping daily life.",
    "The world was becoming more connected, but also more complex and fast-moving.",
    "News cycles were accelerating, making global events feel closer to ordinary people."
  ],
  science: [
    "Space science, genetics, computing, and climate research were expanding what people could measure.",
    "Scientific work was becoming more computational, collaborative, and data-heavy.",
    "New discoveries were making the universe feel larger and the human body feel more readable."
  ],
  politics: [
    "Politics was increasingly shaped by media, global markets, and fast communication.",
    "Public life was being influenced by television, the internet, and changing international alliances.",
    "Trust, security, and global cooperation were recurring political themes."
  ],
  sports: [
    "Sports culture was becoming more global, televised, and personality-driven.",
    "Major tournaments and superstar athletes were turning sports into shared world events.",
    "Broadcast media made athletic moments feel immediate across borders."
  ],
  culture: [
    "The culture of the period mixed entertainment, fashion, screens, and youth identity.",
    "The year's atmosphere was shaped by what people watched, wore, played, and shared.",
    "Pop culture was becoming a stronger language for belonging and memory."
  ],
  movies: [
    "Blockbusters and home video shaped how people remembered the era.",
    "Movies were a major shared language before social feeds fragmented attention.",
    "Cinema was balancing big spectacle with character-driven cultural moments."
  ],
  music: [
    "Music discovery was tied to radio, television, physical media, downloads, or streaming depending on the era.",
    "Songs from this period often became memory anchors for school, travel, and family life.",
    "The sound of the time reflected both technology and youth culture."
  ],
  technology: [
    "The devices around a newborn's world were a strong clue to the speed of the era.",
    "Technology was changing how people stored memories, talked, learned, and entertained themselves.",
    "Everyday tech was quietly shaping what childhood would feel like."
  ]
};

const TECH_MILESTONES = [
  { year: 1981, title: "IBM PC", copy: "Personal computers started becoming a serious business and home category." },
  { year: 1984, title: "Macintosh", copy: "Graphical interfaces made computers feel more visual and personal." },
  { year: 1989, title: "World Wide Web Proposed", copy: "The idea of the web was born before most people knew they would one day live inside it." },
  { year: 1995, title: "Mainstream Web Moment", copy: "Windows 95, browsers, and early websites made the internet feel reachable." },
  { year: 1998, title: "Google Founded", copy: "Search became the front door to the internet." },
  { year: 2001, title: "iPod + Wikipedia", copy: "Portable music and open knowledge changed how people carried culture and facts." },
  { year: 2004, title: "Facebook Launches", copy: "Real-name social networking began reshaping identity online." },
  { year: 2005, title: "YouTube Launches", copy: "Anyone could publish video to the world." },
  { year: 2007, title: "iPhone", copy: "The phone became a pocket computer and a camera for daily life." },
  { year: 2010, title: "iPad + Instagram", copy: "Touchscreens and image-first social life became mainstream signals." },
  { year: 2012, title: "Short-Form Social Era", copy: "Mobile video and creator culture started speeding up internet culture." },
  { year: 2016, title: "Pokemon Go + Practical AR", copy: "Phones began blending digital layers with physical places." },
  { year: 2020, title: "Remote-First Tools", copy: "Video calls, cloud work, and online school became ordinary infrastructure." },
  { year: 2023, title: "Generative AI Goes Mainstream", copy: "AI became a creative and practical assistant for millions of people." }
];

const SHARE_EVENT_LIBRARY = [
  { year: 1985, category: "culture", title: "Back to the Future released", copy: "time travel became one of the decade's defining movie ideas" },
  { year: 1989, category: "world", title: "the Berlin Wall fell", copy: "the map of modern Europe began changing in a dramatic public way" },
  { year: 1990, category: "space", title: "Hubble launched", copy: "humanity put a new eye into orbit" },
  { year: 1991, category: "internet", title: "the World Wide Web became public", copy: "the internet started moving toward ordinary life" },
  { year: 1993, category: "movies", title: "Jurassic Park changed cinema", copy: "digital effects started feeling impossible and real at the same time" },
  { year: 1995, category: "technology", title: "Windows 95 arrived", copy: "home computing became more visual and mainstream" },
  { year: 1997, category: "culture", title: "Titanic became a global event", copy: "movie culture became a shared worldwide memory" },
  { year: 1998, category: "internet", title: "Google was founded", copy: "search became the front door to the web" },
  { year: 2000, category: "sports", title: "the Sydney Olympics happened", copy: "the new millennium opened with a global sports celebration" },
  { year: 2001, category: "technology", title: "the iPod and Wikipedia arrived", copy: "portable music and open knowledge changed how people carried culture" },
  { year: 2004, category: "internet", title: "Facebook launched", copy: "real-name social networking began reshaping identity online" },
  { year: 2005, category: "internet", title: "YouTube launched", copy: "ordinary people could publish video to the world" },
  { year: 2006, category: "internet", title: "Twitter launched", copy: "real-time public conversation became part of internet culture" },
  { year: 2007, category: "technology", title: "the iPhone was introduced", copy: "the phone began turning into the center of daily life" },
  { year: 2008, category: "science", title: "the Large Hadron Collider powered up", copy: "physics entered a new public imagination era" },
  { year: 2008, category: "sports", title: "the Beijing Olympics happened", copy: "global sports spectacle entered a new visual scale" },
  { year: 2009, category: "technology", title: "Bitcoin began", copy: "digital money started as a strange experiment" },
  { year: 2010, category: "social", title: "Instagram launched", copy: "photo-sharing began changing identity, memory, and attention" },
  { year: 2010, category: "sports", title: "the South Africa World Cup happened", copy: "global football culture had one of its loudest shared soundtracks" },
  { year: 2012, category: "space", title: "Curiosity landed on Mars", copy: "a rover began exploring another world in high definition" },
  { year: 2012, category: "music", title: "Gangnam Style went global", copy: "internet music became a worldwide shared joke and dance" },
  { year: 2013, category: "culture", title: "Frozen became a phenomenon", copy: "animation and music turned into a generational memory" },
  { year: 2015, category: "science", title: "CRISPR entered mainstream conversation", copy: "gene editing became one of the biggest science stories of the decade" },
  { year: 2016, category: "gaming", title: "Pokemon Go exploded", copy: "phones turned streets and parks into game worlds" },
  { year: 2017, category: "gaming", title: "Fortnite Battle Royale launched", copy: "gaming became social space, performance, and culture at once" },
  { year: 2018, category: "movies", title: "Black Panther became a cultural event", copy: "superhero cinema carried a different kind of global meaning" },
  { year: 2019, category: "science", title: "the first black hole image was released", copy: "the invisible became visible to the public" },
  { year: 2020, category: "world", title: "remote life became mainstream", copy: "school, work, family, and friendship moved through screens" },
  { year: 2021, category: "space", title: "James Webb launched", copy: "humanity sent its next great telescope toward deep space" },
  { year: 2022, category: "ai", title: "generative AI entered public conversation", copy: "software started feeling creative in a new way" },
  { year: 2023, category: "ai", title: "AI assistants went mainstream", copy: "millions of people began using AI for writing, coding, learning, and creating" },
  { year: 2024, category: "space", title: "a total solar eclipse crossed North America", copy: "millions looked up at the same sky event" }
];

function formatDateLong(date) {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatCompact(value) {
  return Math.round(value).toLocaleString("en-US");
}

function capitalizeFirst(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function getLifeDateValue() {
  return `${lifeDateState.year}-${padDatePart(lifeDateState.month)}-${padDatePart(lifeDateState.day)}`;
}

function setLifeDateState(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return;
  lifeDateState.year = Math.max(1900, Math.min(2026, year));
  lifeDateState.month = Math.max(1, Math.min(12, month));
  const maxDay = new Date(lifeDateState.year, lifeDateState.month, 0).getDate();
  lifeDateState.day = Math.max(1, Math.min(maxDay, day));
}

function updateLifeDateInput() {
  if (!birthDateInput) return;
  const value = getLifeDateValue();
  birthDateInput.value = value;
  if (lifeDateDisplay) {
    lifeDateDisplay.textContent = formatDateLong(new Date(`${value}T00:00:00`));
  }
  if (lifeYearJump) {
    lifeYearJump.value = lifeDateState.year;
  }
}

function renderLifeDatePicker(centerYear = lifeDateState.year) {
  if (!lifeYearGrid || !lifeMonthGrid || !lifeDayGrid) return;
  const startYear = Math.max(1900, Math.min(2026 - 11, centerYear - 5));
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const daysInMonth = new Date(lifeDateState.year, lifeDateState.month, 0).getDate();

  lifeYearGrid.innerHTML = "";
  for (let year = startYear; year < startYear + 12; year += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = year;
    button.className = year === lifeDateState.year ? "is-selected" : "";
    button.addEventListener("click", () => {
      lifeDateState.year = year;
      lifeDateState.day = Math.min(lifeDateState.day, new Date(lifeDateState.year, lifeDateState.month, 0).getDate());
      updateLifeDateInput();
      renderLifeDatePicker(year);
    });
    lifeYearGrid.appendChild(button);
  }

  lifeMonthGrid.innerHTML = "";
  monthNames.forEach((month, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = month;
    button.className = index + 1 === lifeDateState.month ? "is-selected" : "";
    button.addEventListener("click", () => {
      lifeDateState.month = index + 1;
      lifeDateState.day = Math.min(lifeDateState.day, new Date(lifeDateState.year, lifeDateState.month, 0).getDate());
      updateLifeDateInput();
      renderLifeDatePicker(lifeDateState.year);
    });
    lifeMonthGrid.appendChild(button);
  });

  lifeDayGrid.innerHTML = "";
  for (let day = 1; day <= daysInMonth; day += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = day;
    button.className = day === lifeDateState.day ? "is-selected" : "";
    button.addEventListener("click", () => {
      lifeDateState.day = day;
      updateLifeDateInput();
      renderLifeDatePicker(lifeDateState.year);
    });
    lifeDayGrid.appendChild(button);
  }

  updateLifeDateInput();
}

function getAgeParts(birthDate, now = new Date()) {
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  let days = now.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

function getBirthdayForYear(birthDate, year) {
  const birthday = new Date(year, birthDate.getMonth(), birthDate.getDate());
  if (birthday.getMonth() !== birthDate.getMonth()) {
    return new Date(year, 1, 28);
  }
  return birthday;
}

function getAgeYearProgress(birthDate, now = new Date()) {
  let lastBirthday = getBirthdayForYear(birthDate, now.getFullYear());
  if (lastBirthday > now) {
    lastBirthday = getBirthdayForYear(birthDate, now.getFullYear() - 1);
  }
  const nextBirthday = getBirthdayForYear(birthDate, lastBirthday.getFullYear() + 1);
  const daysIntoAge = Math.max(0, Math.floor((now - lastBirthday) / 86400000));
  const daysInAgeYear = Math.max(1, Math.round((nextBirthday - lastBirthday) / 86400000));

  return {
    daysIntoAge,
    daysInAgeYear,
    percent: Math.min(100, (daysIntoAge / daysInAgeYear) * 100)
  };
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDecadeStart(year) {
  return Math.floor(year / 10) * 10;
}

function getGeneration(year) {
  if (year <= 1980) return ["Gen X edge", "You were born near the analog-to-digital handoff, where physical media and early networks shaped memory."];
  if (year <= 1996) return ["Millennial", "Your generation grew up while the internet moved from strange novelty to daily infrastructure."];
  if (year <= 2012) return ["Gen Z", "Your generation arrived into a world where phones, feeds, video, and identity were already merging."];
  return ["Gen Alpha", "Your generation is growing up with AI, tablets, streaming, and voice interfaces as normal background technology."];
}

function getGenerationProfile(year) {
  if (year <= 1980) {
    return {
      name: "Gen X edge",
      tech: ["cassette tapes", "arcades", "cable TV", "early PCs", "landline phones"],
      culture: "analog childhood, independent youth culture, MTV, malls, and the first serious home computing wave",
      inventions: "personal computers, game consoles, cable channels, and early mobile phones",
      internet: "The internet arrived later, which means you experienced the before-and-after more clearly than younger generations."
    };
  }

  if (year <= 1996) {
    return {
      name: "Millennial",
      tech: ["CDs", "desktop computers", "AIM/MSN-style messaging", "early web browsers", "MP3 players"],
      culture: "Saturday cartoons, school computer labs, DVDs, early social networks, and the jump from offline life to online identity",
      inventions: "the mainstream web, search engines, smartphones, streaming, and social platforms",
      internet: "You watched the internet grow up beside you, from slow pages and usernames to feeds, apps, and AI."
    };
  }

  if (year <= 2012) {
    return {
      name: "Gen Z",
      tech: ["smartphones", "apps", "YouTube", "social feeds", "streaming"],
      culture: "creator culture, memes, mobile video, algorithmic discovery, and identity shaped through screens",
      inventions: "touchscreen phones, app stores, short-form video, cloud tools, and generative AI",
      internet: "For you, the internet was not a destination. It was the atmosphere."
    };
  }

  return {
    name: "Gen Alpha",
    tech: ["tablets", "voice assistants", "streaming", "AI tools", "connected classrooms"],
    culture: "video-first childhood, AI-assisted learning, immersive games, and personalized entertainment",
    inventions: "generative AI, spatial computing, smart devices, and always-on cloud ecosystems",
    internet: "You are growing up after the internet became invisible infrastructure."
  };
}

function getMonthSignal(birthDate) {
  const month = birthDate.getMonth();
  return MONTH_SIGNALS[month];
}

function getDaySignal(birthDate) {
  const day = birthDate.getDate();
  return DAY_SIGNALS[day % DAY_SIGNALS.length];
}

function getHistoricalFacts(year) {
  if (HISTORICAL_FACTS[year]) return HISTORICAL_FACTS[year];
  const closestYear = Object.keys(HISTORICAL_FACTS)
    .map(Number)
    .sort((a, b) => Math.abs(year - a) - Math.abs(year - b))[0];
  return [
    `Exact static facts for ${year} are limited in this MVP, so this capsule uses the closest available era: ${closestYear}.`,
    ...HISTORICAL_FACTS[closestYear].slice(0, 2)
  ];
}

function getYearCapsule(year) {
  const exact = YEAR_CAPSULES[year] || {};
  const seed = year % 3;
  return Object.fromEntries(Object.entries(CATEGORY_FALLBACKS).map(([key, values]) => [
    key,
    exact[key] || values[(seed + key.length) % values.length]
  ]));
}

function getPersonalCapsule(birthDate) {
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  const decade = getDecadeStart(year);
  const [generation, generationCopy] = getGeneration(year);
  const [monthName, monthTheme, monthCopy] = getMonthSignal(birthDate);
  const daySignal = getDaySignal(birthDate);
  const decadeContext = DECADE_CONTEXT[decade] || DECADE_CONTEXT[2000];
  const capsule = getYearCapsule(year);

  return [
    { year, title: "Major World Event", copy: capsule.world },
    { year, title: "Science / Discovery", copy: capsule.science },
    { year, title: "Politics", copy: capsule.politics },
    { year, title: "Sports Moment", copy: capsule.sports },
    { year, title: "Movies Around Your Birth", copy: capsule.movies },
    { year, title: "Music and Culture", copy: `${capsule.music} ${capsule.culture}` },
    { year, title: "Technology at Birth", copy: capsule.technology },
    { year, title: `${generation} Context`, copy: generationCopy },
    { year, title: `${monthName} Birth-Month Signal`, copy: `${monthName} adds ${monthTheme} to the story. ${monthCopy}` },
    { year, title: "Decade Atmosphere", copy: `You were born into the ${decade}s: ${decadeContext[1]}. This makes your starting point feel different from someone born just one decade earlier or later.` },
    { year, title: "Exact Date Signature", copy: `The ${day}${day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th"} day gives this timeline a "${daySignal}" character, making ${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} feel more specific than a birth year alone.` }
  ];
}

function getTechSnapshotAtBirth(year) {
  if (year < 1990) return "At birth, computers were physical, expensive, and mostly offline; music, games, and photos lived on separate devices.";
  if (year < 2000) return "At birth, the web was young or just becoming mainstream; family computers, CDs, cartridges, and early browsers defined the digital atmosphere.";
  if (year < 2007) return "At birth, the internet was social but not fully mobile; desktops, flip phones, MP3 players, DVDs, and early social networks shaped daily tech.";
  if (year < 2013) return "At birth, smartphones, apps, touchscreens, streaming, and social photos were becoming the default interface to life.";
  if (year < 2020) return "At birth, mobile video, cloud apps, voice assistants, streaming, and creator platforms were already normal.";
  return "At birth, AI tools, remote life, streaming, short video, and connected devices were already part of the background of childhood.";
}

function getAgeLabelAtYear(eventYear, birthYear) {
  const age = eventYear - birthYear;
  if (age < 0) {
    const yearsBefore = Math.abs(age);
    return `${yearsBefore} ${yearsBefore === 1 ? "year" : "years"} before you were born`;
  }
  if (age === 0) return "the year you were born";
  if (age <= 5) return `when you were about ${age}`;
  if (age <= 12) return `during childhood, around age ${age}`;
  if (age <= 19) return `during your teen years, around age ${age}`;
  return `during adulthood, around age ${age}`;
}

function sortTimelineByYear(items) {
  return items
    .map((item, index) => ({ ...item, order: item.order ?? index }))
    .sort((a, b) => {
      const yearA = Number(a.year ?? 0);
      const yearB = Number(b.year ?? 0);
      if (yearA !== yearB) return yearA - yearB;
      return a.order - b.order;
    })
    .map(({ order, ...item }) => item);
}

function getPersonalTechTimeline(birthYear, currentYear) {
  const visible = TECH_MILESTONES
    .map((item, index) => ({ ...item, order: index + 10 }))
    .filter((item) => item.year >= Math.max(1981, birthYear - 2) && item.year <= currentYear)
    .map((item) => ({
      year: item.year,
      title: `${item.title} (${getAgeLabelAtYear(item.year, birthYear)})`,
      copy: item.copy,
      order: item.order
    }));

  const birthSnapshot = {
    year: birthYear,
    title: "Technology When You Were Born",
    copy: getTechSnapshotAtBirth(birthYear),
    order: 0
  };

  const future = currentYear < 2026
    ? []
    : [{
      year: 2026,
      title: "Your Current Tech Moment",
      copy: "Your timeline now sits in an AI-native era where personal tools can generate images, code, text, analysis, and dashboards on demand.",
      order: 999
    }];

  return sortTimelineByYear([birthSnapshot, ...visible, ...future]).slice(0, 9);
}

function countRecurringEvents(birthYear, currentYear, interval, startYear) {
  let count = 0;
  for (let year = startYear; year <= currentYear; year += interval) {
    if (year >= birthYear) count += 1;
  }
  return count;
}

function getLifespanPerspective(daysLived) {
  const averageLifeDays = 80 * 365.2425;
  const percent = Math.min(100, (daysLived / averageLifeDays) * 100);
  const remaining = Math.max(0, averageLifeDays - daysLived);
  return {
    percent,
    remainingDays: remaining,
    livedDays: daysLived,
    averageLifeDays
  };
}

function describeAgeAtEvent(eventYear, birthYear) {
  const age = eventYear - birthYear;
  if (age < 0) {
    const before = Math.abs(age);
    return `${before} ${before === 1 ? "year" : "years"} before you were born`;
  }
  if (age === 0) return "the year you were born";
  if (age === 1) return "when you were 1 year old";
  return `when you were ${age} years old`;
}

function getEventsNearAge(profile, targetAge, categories = []) {
  const targetYear = profile.year + targetAge;
  return SHARE_EVENT_LIBRARY
    .filter((event) => event.year >= profile.year && event.year <= 2026)
    .filter((event) => !categories.length || categories.includes(event.category))
    .map((event) => ({ ...event, distance: Math.abs(event.year - targetYear) }))
    .sort((a, b) => a.distance - b.distance || a.year - b.year);
}

function getShareMoments(profile) {
  const moments = [];
  const birthCapsule = getYearCapsule(profile.year);
  const birthEvent = SHARE_EVENT_LIBRARY.find((event) => event.year === profile.year);

  if (birthEvent) {
    moments.push(`You were born the same year ${birthEvent.title}; ${birthEvent.copy}.`);
  } else {
    moments.push(`The year you were born, ${birthCapsule.movies.toLowerCase()} That gives your birth year a specific cultural fingerprint.`);
  }

  const childhoodEvent = getEventsNearAge(profile, 5, ["internet", "technology", "culture", "movies", "gaming"])[0];
  if (childhoodEvent) {
    moments.push(`${capitalizeFirst(describeAgeAtEvent(childhoodEvent.year, profile.year))}, ${childhoodEvent.title}; ${childhoodEvent.copy}.`);
  }

  const earlyTeenEvent = getEventsNearAge(profile, 12, ["technology", "internet", "social", "gaming", "science"])[0];
  if (earlyTeenEvent && !moments.some((moment) => moment.includes(earlyTeenEvent.title))) {
    moments.push(`${capitalizeFirst(describeAgeAtEvent(earlyTeenEvent.year, profile.year))}, ${earlyTeenEvent.title}; ${earlyTeenEvent.copy}.`);
  }

  const adultEvent = getEventsNearAge(profile, 18, ["ai", "space", "science", "world", "sports"])[0];
  if (adultEvent && !moments.some((moment) => moment.includes(adultEvent.title))) {
    moments.push(`${capitalizeFirst(describeAgeAtEvent(adultEvent.year, profile.year))}, ${adultEvent.title}; ${adultEvent.copy}.`);
  }

  const backupEvents = SHARE_EVENT_LIBRARY
    .filter((event) => event.year >= profile.year && event.year <= 2026)
    .sort((a, b) => a.year - b.year);

  backupEvents.forEach((event) => {
    if (moments.length >= 5 || moments.some((moment) => moment.includes(event.title))) return;
    moments.push(`${capitalizeFirst(describeAgeAtEvent(event.year, profile.year))}, ${event.title}; ${event.copy}.`);
  });

  if (moments.length < 5) {
    const nextMilestoneAge = profile.age.years < 5 ? 5 : profile.age.years < 10 ? 10 : 18;
    moments.push(`Your age-${nextMilestoneAge} chapter is still ahead, which means this timeline is not only memory. It is an unfolding story.`);
  }

  const generationMoment = profile.year < 1995
    ? "Your childhood began before the mainstream web, so your timeline crosses the rare before-and-after of internet history."
    : profile.year < 2007
      ? "Your childhood started in the desktop internet era and shifted into smartphones before adulthood."
      : profile.year < 2015
        ? "Your childhood unfolded inside the app era, where photos, video, games, and school life were already becoming mobile."
        : "Your early life belongs to the AI-and-streaming generation, where screens, voice assistants, and personalization were already normal.";

  moments.push(generationMoment);

  return moments.slice(0, 5);
}

function getPersonalStoryTimeline(profile) {
  const moments = [5, 10, 15, 18, 21, 25, 30]
    .filter((age) => age <= profile.age.years)
    .map((age) => {
      const year = profile.year + age;
      const capsule = getYearCapsule(year);
      const tech = TECH_MILESTONES.find((item) => item.year >= year) || TECH_MILESTONES[TECH_MILESTONES.length - 1];
      return {
        year,
        title: `When you were ${age}`,
        copy: `${capsule.culture} Around this chapter, technology was moving toward ${tech.title.toLowerCase()}: ${tech.copy}`
      };
    });

  if (!moments.length) {
    return [{
      year: profile.year,
      title: "Your story is just beginning",
      copy: "The first chapters of your timeline are still forming, which makes every future milestone feel closer and more visible."
    }];
  }

  return moments.slice(0, 7);
}

function buildLifeProfile(dateValue) {
  const birthDate = new Date(`${dateValue}T00:00:00`);
  const now = new Date();
  const age = getAgeParts(birthDate, now);
  const year = birthDate.getFullYear();
  const daysLived = Math.max(0, Math.floor((now - birthDate) / 86400000));
  const weeksLived = daysLived / 7;
  const monthsLived = age.years * 12 + age.months;
  const hoursLived = daysLived * 24;
  const sleepHours = hoursLived * 0.33;
  const heartbeats = daysLived * 24 * 60 * 72;
  const breaths = daysLived * 24 * 60 * 16;
  const earthOrbitKm = daysLived * 2570000;
  const earthOrbitMiles = earthOrbitKm * 0.621371;
  const sunrises = daysLived;
  const moonCycles = daysLived / 29.53;
  const earthRotations = daysLived;
  const weekends = Math.floor(daysLived / 7) * 2;
  const birthdaysCelebrated = age.years;
  const olympicGames = countRecurringEvents(year, now.getFullYear(), 4, 1980);
  const worldCups = countRecurringEvents(year, now.getFullYear(), 4, 1982);
  const marsAge = age.years / 1.8808;
  const jupiterAge = age.years / 11.862;
  const facts = getHistoricalFacts(year);
  const personalCapsule = getPersonalCapsule(birthDate);
  const techTimeline = getPersonalTechTimeline(year, now.getFullYear());
  const generationProfile = getGenerationProfile(year);
  const perspective = getLifespanPerspective(daysLived);

  const milestones = [10000, 15000, 20000, 25000, 30000].map((day) => ({
    title: `${formatCompact(day)} days old`,
    date: formatDateLong(addDays(birthDate, day)),
    copy: day > daysLived ? "A future checkpoint worth looking forward to." : "A milestone you have already passed."
  }));

  return {
    birthDate,
    dateValue,
    year,
    age,
    daysLived,
    weeksLived,
    monthsLived,
    hoursLived,
    sleepHours,
    heartbeats,
    breaths,
    earthOrbitKm,
    earthOrbitMiles,
    sunrises,
    moonCycles,
    earthRotations,
    weekends,
    birthdaysCelebrated,
    olympicGames,
    worldCups,
    marsAge,
    jupiterAge,
    facts,
    personalCapsule,
    techTimeline,
    generationProfile,
    perspective,
    milestones,
    directUrl: `${window.location.origin}/timeline/${dateValue}`,
    summary: `You have lived about ${formatCompact(daysLived)} days, traveled roughly ${formatCompact(earthOrbitKm)} km around the Sun, and crossed through ${age.years} years of technology, culture, and ${getMonthSignal(birthDate)[1]}.`
  };
}

function renderLifeMetrics(profile) {
  const metrics = [
    ["Days Lived", profile.daysLived, "Every day is one dot in your personal constellation."],
    ["Weeks Lived", profile.weeksLived, "A calendar view of momentum and memory."],
    ["Hours Lived", profile.hoursLived, "Time translated into scale."],
    ["Sleep Estimate", profile.sleepHours, "Approximate, based on one third of life asleep."],
    ["Heartbeats", profile.heartbeats, "Estimated at 72 beats per minute."],
    ["Breaths", profile.breaths, "Estimated at 16 breaths per minute."]
  ];
  const container = document.querySelector("#life-metrics");
  container.innerHTML = "";
  metrics.forEach(([label, value, note], index) => {
    const card = document.createElement("div");
    card.className = "life-metric-card";
    card.style.setProperty("--metric-delay", `${index * 80}ms`);
    card.innerHTML = `<span>${label}</span><strong data-count-to="${Math.round(value)}">0</strong><p>${note}</p>`;
    container.appendChild(card);
  });
}

function animateLifeCounters(scope = document) {
  scope.querySelectorAll("[data-count-to]").forEach((element) => {
    const target = Number(element.dataset.countTo || 0);
    const start = performance.now();
    const duration = 900;
    const tick = (time) => {
      const progress = Math.min(1, (time - start) / duration);
      element.textContent = formatCompact(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function renderLifeChart(profile) {
  const ageYear = getAgeYearProgress(profile.birthDate);
  const awakeHours = Math.max(0, profile.hoursLived - profile.sleepHours);
  const awakePercent = profile.hoursLived ? (awakeHours / profile.hoursLived) * 100 : 0;
  const sleepPercent = profile.hoursLived ? (profile.sleepHours / profile.hoursLived) * 100 : 0;
  const values = [
    [
      "Life lived",
      profile.perspective.percent,
      `${profile.perspective.percent.toFixed(1)}%`,
      "of an 80-year reference point"
    ],
    [
      "This age",
      ageYear.percent,
      `${ageYear.daysIntoAge}/${ageYear.daysInAgeYear}`,
      "days through your current age year"
    ],
    [
      "Awake",
      awakePercent,
      `${formatCompact(awakeHours)}h`,
      "estimated hours awake since birth"
    ],
    [
      "Sleep",
      sleepPercent,
      `${formatCompact(profile.sleepHours)}h`,
      "estimated at one third of total hours"
    ]
  ];
  const chart = document.querySelector("#life-chart");
  chart.innerHTML = values.map(([label, value, displayValue, note]) => `
    <div class="chart-row">
      <span>${label}</span>
      <div><i style="width: ${Math.max(6, value)}%"></i></div>
      <strong>${displayValue}</strong>
      <small>${note}</small>
    </div>
  `).join("");
}

function renderWowMetrics(profile) {
  const container = document.querySelector("#wow-metrics");
  if (!container) return;
  const metrics = [
    ["Sunrises", profile.sunrises, "roughly one sunrise for every day you have been here"],
    ["Moon Cycles", profile.moonCycles, "full lunar cycles lived through"],
    ["Earth Rotations", profile.earthRotations, "spins of the planet since your birth"],
    ["Weekends", profile.weekends, "weekend days that passed through your timeline"],
    ["Birthdays", profile.birthdaysCelebrated, "birthdays already celebrated"],
    ["Olympic Games", profile.olympicGames, "Summer Olympic cycles during your lifetime"],
    ["World Cups", profile.worldCups, "FIFA World Cup cycles during your lifetime"],
    ["Space Travel", profile.earthOrbitMiles, "miles carried around the Sun by Earth"]
  ];

  container.innerHTML = metrics.map(([label, value, note], index) => `
    <div class="wow-metric" style="--metric-delay: ${index * 70}ms">
      <span>${label}</span>
      <strong data-count-to="${Math.round(value)}">0</strong>
      <p>${note}</p>
    </div>
  `).join("");
}

function renderShareMoments(profile) {
  const container = document.querySelector("#share-moments");
  if (!container) return;
  container.innerHTML = getShareMoments(profile).map((moment) => `
    <div class="share-moment-card">
      <span>Share Moment</span>
      <strong>${moment}</strong>
    </div>
  `).join("");
}

function renderGenerationProfile(profile) {
  const container = document.querySelector("#generation-profile");
  if (!container) return;
  const generation = profile.generationProfile;
  container.innerHTML = `
    <h4>${generation.name}</h4>
    <p>${generation.internet}</p>
    <div class="generation-tags">
      ${generation.tech.map((item) => `<span>${item}</span>`).join("")}
    </div>
    <div class="generation-detail">
      <strong>Cultural texture</strong>
      <p>${generation.culture}</p>
    </div>
    <div class="generation-detail">
      <strong>Defining inventions</strong>
      <p>${generation.inventions}</p>
    </div>
  `;
}

function renderLifePerspective(profile) {
  const container = document.querySelector("#life-perspective");
  if (!container) return;
  const percent = profile.perspective.percent;
  container.innerHTML = `
    <div class="perspective-meter">
      <span style="width: ${percent}%"></span>
    </div>
    <h4>${percent.toFixed(1)}% of an 80-year life estimate</h4>
    <p>You have lived about ${formatCompact(profile.perspective.livedDays)} days. If you use age 80 as a gentle reference point, there are about ${formatCompact(profile.perspective.remainingDays)} days ahead. This is not a prediction; it is perspective.</p>
    <div class="perspective-split">
      <span><strong>${formatCompact(profile.perspective.livedDays)}</strong> lived</span>
      <span><strong>${formatCompact(profile.perspective.remainingDays)}</strong> possible ahead</span>
    </div>
  `;
}

function getFinalLifeSummary(profile) {
  const techArc = profile.year < 1995
    ? "the rise of the web, search engines, social media, smartphones, streaming, and artificial intelligence"
    : profile.year < 2007
      ? "the shift from early internet life into smartphones, social platforms, streaming, and artificial intelligence"
      : profile.year < 2015
        ? "the app era, creator culture, streaming, remote life, and the arrival of mainstream AI"
        : "a world where mobile life, streaming, creator culture, and AI were already shaping childhood";

  return `You have already experienced over ${formatCompact(profile.sunrises)} sunrises, about ${formatCompact(profile.moonCycles)} moon cycles, and roughly ${formatCompact(profile.heartbeats)} heartbeats. Earth has carried you around the Sun for over ${formatCompact(profile.earthOrbitMiles)} miles. You have lived through ${techArc}. This is your story so far.`;
}

function renderTimeline(selector, items) {
  const container = document.querySelector(selector);
  container.innerHTML = "";
  items.forEach((item) => {
    const entry = document.createElement("div");
    entry.className = "timeline-entry";
    entry.innerHTML = `<span>${item.year || item.date}</span><strong>${item.title}</strong><p>${item.copy}</p>`;
    container.appendChild(entry);
  });
}

function updateLifeSeo(profile) {
  const title = `Born on ${formatDateLong(profile.birthDate)} | Life Timeline`;
  const description = `Personal time capsule for ${formatDateLong(profile.birthDate)}: ${formatCompact(profile.daysLived)} days lived, world events, technology timeline, cosmic age, and future milestones.`;
  document.title = title;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) descriptionMeta.setAttribute("content", description);
  const schema = document.querySelector("#life-schema");
  if (schema) {
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: profile.directUrl,
      about: "Life timeline calculator and personal time capsule"
    });
  }
}

function renderLifeProfile(profile) {
  activeLifeProfile = profile;
  document.querySelector("#life-result-title").textContent = `Born on ${formatDateLong(profile.birthDate)}`;
  document.querySelector("#life-result-summary").textContent = profile.summary;
  document.querySelector("#life-age-years").textContent = profile.age.years;
  document.querySelector("#life-age-copy").textContent = `${profile.age.months} months and ${profile.age.days} days into your current orbit.`;
  document.querySelector("#share-card-date").textContent = `Born in ${profile.year}`;
  document.querySelector("#share-card-copy").textContent = `${formatCompact(profile.daysLived)} days lived. ${profile.personalCapsule[0].copy}`;
  renderLifeMetrics(profile);
  renderWowMetrics(profile);
  renderShareMoments(profile);
  renderGenerationProfile(profile);
  renderLifeChart(profile);
  renderTimeline("#world-capsule", profile.personalCapsule);
  renderTimeline("#technology-timeline", profile.techTimeline);
  renderTimeline("#milestone-timeline", profile.milestones);
  renderTimeline("#personal-story-timeline", getPersonalStoryTimeline(profile));
  renderLifePerspective(profile);

  const cosmic = document.querySelector("#cosmic-timeline");
  cosmic.innerHTML = [
    ["Age on Mars", `${profile.marsAge.toFixed(1)} Martian years`, "Mars takes 687 Earth days to orbit the Sun."],
    ["Age on Jupiter", `${profile.jupiterAge.toFixed(2)} Jovian years`, "Jupiter years are huge, which makes life feel beautifully small."],
    ["Solar Distance", `${formatCompact(profile.earthOrbitKm)} km`, "Estimated distance carried around the Sun by Earth."],
    ["Moon Cycles", `${formatCompact(profile.daysLived / 29.53)}`, "Approximate lunar months since your birth."]
  ].map(([label, value, copy]) => `<div><span>${label}</span><strong>${value}</strong><p>${copy}</p></div>`).join("");

  const finalSummary = getFinalLifeSummary(profile);
  document.querySelector("#life-final-title").textContent = `${profile.generationProfile.name}: your story so far`;
  document.querySelector("#life-final-summary").textContent = finalSummary;

  updateLifeSeo(profile);
  animateLifeCounters(lifeResults);
}

function downloadLifeShareCard(profile) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#020617");
  gradient.addColorStop(0.5, "#082f49");
  gradient.addColorStop(1, "#3b0764");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 630);
  context.fillStyle = "rgba(34, 211, 238, 0.16)";
  context.beginPath();
  context.arc(930, 160, 260, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#fbbf24";
  context.font = "700 34px Arial";
  context.fillText("RasulTech / Life Timeline", 72, 90);
  context.fillStyle = "#ffffff";
  context.font = "900 68px Arial";
  context.fillText(`Born ${formatDateLong(profile.birthDate)}`, 72, 190);
  context.font = "900 118px Arial";
  context.fillText(`${formatCompact(profile.daysLived)} days`, 72, 340);
  context.fillStyle = "#dbeafe";
  context.font = "500 34px Arial";
  context.fillText("lived on Earth, moving through history and space.", 72, 410);
  context.fillStyle = "#e0f2fe";
  context.font = "700 30px Arial";
  context.fillText(`Heartbeats: ${formatCompact(profile.heartbeats)}`, 72, 500);
  context.fillText(`Age on Mars: ${profile.marsAge.toFixed(1)} years`, 72, 545);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `life-timeline-${profile.dateValue}.png`;
  link.click();
}

function getLifeShareText(profile) {
  return `I made my Life Timeline: ${formatCompact(profile.daysLived)} days lived, ${formatCompact(profile.heartbeats)} estimated heartbeats, and ${profile.marsAge.toFixed(1)} years old on Mars.`;
}

if (lifeForm) {
  const params = new URLSearchParams(window.location.search);
  const pathMatch = window.location.pathname.match(/\/timeline\/(\d{4}-\d{2}-\d{2})/);
  const initialDate = params.get("date") || (pathMatch ? pathMatch[1] : "");
  if (initialDate) setLifeDateState(initialDate);
  renderLifeDatePicker(lifeDateState.year);

  if (lifeYearJump) {
    lifeYearJump.addEventListener("input", () => {
      const year = Number(lifeYearJump.value);
      if (year >= 1900 && year <= 2026) {
        lifeDateState.year = year;
        lifeDateState.day = Math.min(lifeDateState.day, new Date(lifeDateState.year, lifeDateState.month, 0).getDate());
        renderLifeDatePicker(year);
      }
    });
  }

  lifeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateLifeDateInput();
    if (!birthDateInput.value) return;
    lifeLoading.hidden = false;
    lifeResults.hidden = true;
    window.setTimeout(() => {
      const profile = buildLifeProfile(birthDateInput.value);
      renderLifeProfile(profile);
      lifeLoading.hidden = true;
      lifeResults.hidden = false;
      window.history.replaceState({ date: profile.dateValue }, "", `lifetimeline.html?date=${profile.dateValue}#/timeline/${profile.dateValue}`);
      lifeResults.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 900);
  });

  if (initialDate) {
    window.setTimeout(() => lifeForm.requestSubmit(), 320);
  }
}

if (resetLifeButton) {
  resetLifeButton.addEventListener("click", () => {
    lifeResults.hidden = true;
    birthDateInput.value = "";
    birthDateInput.focus();
  });
}

if (downloadLifeCardButton) {
  downloadLifeCardButton.addEventListener("click", () => {
    if (activeLifeProfile) downloadLifeShareCard(activeLifeProfile);
  });
}

if (copyLifeLinkButton) {
  copyLifeLinkButton.addEventListener("click", () => {
    if (activeLifeProfile) copyText(activeLifeProfile.directUrl, copyLifeLinkButton, "Link Copied");
  });
}

if (shareLifeResultButton) {
  shareLifeResultButton.addEventListener("click", async () => {
    if (!activeLifeProfile) return;
    const shareData = {
      title: "My Life Timeline",
      text: getLifeShareText(activeLifeProfile),
      url: activeLifeProfile.directUrl
    };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      copyText(`${shareData.text}\n${shareData.url}`, shareLifeResultButton, "Share Text Copied");
    }
  });
}

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { threshold: 0.16 })
  : null;

document.querySelectorAll(".reveal-on-scroll").forEach((element) => {
  if (revealObserver) {
    revealObserver.observe(element);
  } else {
    element.classList.add("is-visible");
  }
});

const worldModal = document.querySelector("#world-modal");
const openWorldModalButton = document.querySelector("#open-world-modal");
const worldCards = document.querySelectorAll(".world-card[data-world]");
const worldStorageKey = "rasultechWorld";
const worldActionLabels = {
  space: "Enter the Cosmos",
  beach: "Follow the Horizon",
  antarctica: "Open the Aurora",
  jungle: "Enter the Canopy",
  desert: "Open the Sands",
  cyber: "Step into Neon"
};

function setActiveWorld(world) {
  const selectedWorld = world || "space";
  document.documentElement.dataset.world = selectedWorld;
  if (openWorldModalButton) {
    openWorldModalButton.textContent = worldActionLabels[selectedWorld] || worldActionLabels.space;
  }
  try {
    window.localStorage.setItem(worldStorageKey, selectedWorld);
  } catch (error) {
    // The visual still updates if storage is unavailable.
  }
  worldCards.forEach((card) => {
    card.classList.toggle("is-active", card.dataset.world === selectedWorld);
  });
}

function closeWorldModal() {
  if (!worldModal) return;
  worldModal.hidden = true;
  document.body.classList.remove("modal-open");
}

if (worldModal && openWorldModalButton) {
  setActiveWorld(document.documentElement.dataset.world);

  openWorldModalButton.addEventListener("click", () => {
    worldModal.hidden = false;
    document.body.classList.add("modal-open");
  });

  worldModal.querySelectorAll("[data-close-world]").forEach((button) => {
    button.addEventListener("click", closeWorldModal);
  });

  worldCards.forEach((card) => {
    card.addEventListener("click", () => {
      setActiveWorld(card.dataset.world);
      closeWorldModal();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeWorldModal();
  });
}
