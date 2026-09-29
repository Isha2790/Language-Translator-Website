/* ===== Lingua Translator — app.js ===== */
import { romanize } from "./romanize.js";

// ----- Language list (code: label) -----
const LANGUAGES = {
  auto: "Auto Detect",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  ru: "Russian",
  pl: "Polish",
  tr: "Turkish",
  ar: "Arabic",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  bn: "Bengali",
  ur: "Urdu",
  fa: "Persian",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ms: "Malay",
  sv: "Swedish",
  no: "Norwegian",
  da: "Danish",
  fi: "Finnish",
  cs: "Czech",
  el: "Greek",
  he: "Hebrew",
  ro: "Romanian",
  hu: "Hungarian",
  uk: "Ukrainian",
  bg: "Bulgarian",
  hr: "Croatian",
  sr: "Serbian",
  sk: "Slovak",
  sl: "Slovenian",
  lt: "Lithuanian",
  lv: "Latvian",
  et: "Estonian",
  ca: "Catalan",
  gl: "Galician",
  sw: "Swahili",
  af: "Afrikaans",
  ta: "Tamil",
  te: "Telugu",
  ml: "Malayalam",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  cy: "Welsh",
  is: "Icelandic",
};

// ----- DOM refs -----
const $ = (id) => document.getElementById(id);
const sourceLangSel = $("sourceLang");
const targetLangSel = $("targetLang");
const sourceTextEl = $("sourceText");
const outputTextEl = $("outputText");
const charCountEl = $("charCount");
const translationMetaEl = $("translationMeta");
const translateBtn = $("translateBtn");
const swapBtn = $("swapBtn");
const clearBtn = $("clearBtn");
const copyBtn = $("copyBtn");
const micBtn = $("micBtn");
const speakOutputBtn = $("speakOutputBtn");
const favoriteBtn = $("favoriteBtn");
const themeToggle = $("themeToggle");
const loadingBar = $("loadingBar");
const errorMsg = $("errorMsg");
const toast = $("toast");

// Pronunciation
const pronunciationGuide = $("pronunciationGuide");
const pronunciationText = $("pronunciationText");

// Voice mode
const modeBtns = document.querySelectorAll(".mode-btn");
const textModePanel = $("textMode");
const voiceModePanel = $("voiceMode");
const voiceMicBtn = $("voiceMicBtn");
const micOrb = $("micOrb");
const vizBars = $("vizBars");
const voiceStatus = $("voiceStatus");
const recognizedTextEl = $("recognizedText");
const voiceTranslationEl = $("voiceTranslation");
const voiceSpeakBtn = $("voiceSpeakBtn");

// Conversation mode
const conversationModePanel = $("conversationMode");
const convLangA = $("convLangA");
const convLangB = $("convLangB");
const convMessages = $("convMessages");
const convInput = $("convInput");
const convMicBtn = $("convMicBtn");
const convSendBtn = $("convSendBtn");
const convTurnBtn = $("convTurnBtn");
const convTurnLabel = $("convTurnLabel");

// History
const historyList = $("historyList");
const clearHistoryBtn = $("clearHistoryBtn");

// Favorites
const favoritesList = $("favoritesList");
const clearFavoritesBtn = $("clearFavoritesBtn");

// ----- State -----
let currentMode = "text";
let recognition = null;
let isRecording = false;
let isVoiceRecording = false;
let isConvRecording = false;
let history = [];
let favorites = [];
let convTurn = "a"; // "a" = you speak langA, "b" = they speak langB
let convMessageCount = 0;

// =====================
// Init
// =====================
function init() {
  populateLanguages();
  loadTheme();
  loadHistory();
  loadFavorites();
  bindEvents();
  updateCharCount();
}

function populateLanguages() {
  // Source: include auto-detect
  for (const [code, name] of Object.entries(LANGUAGES)) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = name;
    sourceLangSel.appendChild(opt);
  }
  // Target: exclude auto-detect
  for (const [code, name] of Object.entries(LANGUAGES)) {
    if (code === "auto") continue;
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = name;
    targetLangSel.appendChild(opt);
  }
  sourceLangSel.value = "auto";
  targetLangSel.value = "es";

  // Conversation language selectors (no auto-detect)
  for (const [code, name] of Object.entries(LANGUAGES)) {
    if (code === "auto") continue;
    const optA = document.createElement("option");
    optA.value = code;
    optA.textContent = name;
    convLangA.appendChild(optA);
    const optB = optA.cloneNode(true);
    convLangB.appendChild(optB);
  }
  convLangA.value = "en";
  convLangB.value = "es";
}

// =====================
// Theme
// =====================
function loadTheme() {
  const saved = localStorage.getItem("lingua-theme");
  if (saved) {
    document.documentElement.setAttribute("data-theme", saved);
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("lingua-theme", next);
}

// =====================
// Mode toggle (text / voice / conversation)
// =====================
function switchMode(mode) {
  currentMode = mode;
  modeBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  textModePanel.classList.toggle("active", mode === "text");
  voiceModePanel.classList.toggle("active", mode === "voice");
  conversationModePanel.classList.toggle("active", mode === "conversation");

  // Stop any active recording when switching away
  if (mode !== "text" && isRecording) stopRecording();
  if (mode !== "voice" && isVoiceRecording) stopVoiceRecognition();
  if (mode !== "conversation" && isConvRecording) stopConvRecognition();
}

// =====================
// Translation (MyMemory API)
// =====================
async function translateText(text, source, target) {
  if (!text.trim()) return "";
  // MyMemory does not accept an empty source language. Auto Detect uses English
  // as the browser speech fallback, while users can still choose a precise source.
  const src = source === "auto" ? "en" : source;
  const langPair = `${src}|${target}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation request failed (${res.status})`);
  const data = await res.json();

  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || "The translation service rejected this language pair.");
  }
  if (data.responseData?.translatedText) {
    return data.responseData.translatedText;
  }
  throw new Error("No translation was returned. Please try again.");
}

async function handleTranslate() {
  const text = sourceTextEl.value.trim();
  if (!text) {
    showError("Please enter some text to translate.");
    return;
  }

  hideError();
  translateBtn.disabled = true;
  loadingBar.classList.remove("hidden");
  pronunciationGuide.classList.add("hidden");

  try {
    const result = await translateText(text, sourceLangSel.value, targetLangSel.value);
    outputTextEl.textContent = result;
    translationMetaEl.textContent = `${LANGUAGES[sourceLangSel.value]} → ${LANGUAGES[targetLangSel.value]}`;

    // Pronunciation guide
    const pron = romanize(result, targetLangSel.value);
    if (pron) {
      pronunciationText.textContent = pron;
      pronunciationGuide.classList.remove("hidden");
    }

    addToHistory(text, result, sourceLangSel.value, targetLangSel.value);
  } catch (err) {
    showError(err.message || "Could not translate. Please try again.");
  } finally {
    translateBtn.disabled = false;
    loadingBar.classList.add("hidden");
  }
}

// =====================
// Swap languages
// =====================
function swapLanguages() {
  const src = sourceLangSel.value;
  const tgt = targetLangSel.value;
  if (src === "auto") {
    sourceLangSel.value = tgt;
    targetLangSel.value = "en";
  } else {
    sourceLangSel.value = tgt;
    targetLangSel.value = src;
  }
  const srcText = sourceTextEl.value;
  const outText = outputTextEl.textContent;
  sourceTextEl.value = outText;
  outputTextEl.textContent = srcText;
  updateCharCount();
  pronunciationGuide.classList.add("hidden");
}

// =====================
// Character count
// =====================
function updateCharCount() {
  const len = sourceTextEl.value.length;
  charCountEl.textContent = `${len} / 5000`;
  charCountEl.style.color = len > 5000 ? "var(--error)" : "";
}

// =====================
// Copy
// =====================
async function copyOutput() {
  const text = outputTextEl.textContent;
  if (!text) {
    showToast("Nothing to copy yet");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  } catch {
    showToast("Copy failed");
  }
}

// =====================
// Text-to-speech
// =====================
function speak(text, lang) {
  if (!text || !("speechSynthesis" in window)) {
    showToast("Speech not supported in this browser");
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = langToBcp47(lang);
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

function langToBcp47(code) {
  const map = { zh: "zh-CN", en: "en-US", pt: "pt-PT", fa: "fa-IR" };
  return map[code] || code;
}

// =====================
// Speech recognition (text mode mic)
// =====================
function initRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  return rec;
}

function getRecognitionLang() {
  const src = sourceLangSel.value;
  if (src !== "auto") return langToBcp47(src);
  return "en-US";
}

function startRecording() {
  recognition = initRecognition();
  if (!recognition) {
    showError("Voice input is not supported in this browser. Try Chrome or Edge.");
    return;
  }
  recognition.lang = getRecognitionLang();
  isRecording = true;
  micBtn.classList.add("recording");

  let finalTranscript = "";

  recognition.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        finalTranscript += e.results[i][0].transcript;
      } else {
        interim += e.results[i][0].transcript;
      }
    }
    sourceTextEl.value = finalTranscript + interim;
    updateCharCount();
  };

  recognition.onerror = (e) => {
    showError(`Voice input error: ${e.error}`);
    stopRecording();
  };

  recognition.onend = () => stopRecording();
  recognition.start();
}

function stopRecording() {
  if (recognition) {
    try { recognition.stop(); } catch {}
  }
  isRecording = false;
  micBtn.classList.remove("recording");
}

function toggleMic() {
  if (isRecording) stopRecording();
  else startRecording();
}

// =====================
// Voice mode
// =====================
function toggleVoiceRecognition() {
  if (isVoiceRecording) stopVoiceRecognition();
  else startVoiceRecognition();
}

function startVoiceRecognition() {
  recognition = initRecognition();
  if (!recognition) {
    voiceStatus.textContent = "Voice input is not supported in this browser. Try Chrome or Edge.";
    return;
  }

  const src = sourceLangSel.value;
  recognition.lang = src !== "auto" ? langToBcp47(src) : "en-US";
  recognition.continuous = false;
  recognition.interimResults = true;

  isVoiceRecording = true;
  voiceMicBtn.classList.add("recording");
  voiceMicBtn.querySelector("span").textContent = "Stop Listening";
  micOrb.classList.add("recording");
  vizBars.classList.add("active");
  voiceStatus.textContent = "Listening... speak now";
  recognizedTextEl.textContent = "";
  voiceTranslationEl.textContent = "";
  voiceSpeakBtn.classList.add("hidden");

  let finalTranscript = "";

  recognition.onresult = async (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        finalTranscript += e.results[i][0].transcript;
      } else {
        interim += e.results[i][0].transcript;
      }
    }
    recognizedTextEl.textContent = finalTranscript + interim;

    if (finalTranscript.trim() && !interim) {
      voiceStatus.textContent = "Translating...";
      try {
        const result = await translateText(finalTranscript, sourceLangSel.value, targetLangSel.value);
        voiceTranslationEl.textContent = result;
        voiceSpeakBtn.classList.remove("hidden");
        addToHistory(finalTranscript, result, sourceLangSel.value, targetLangSel.value);
        voiceStatus.textContent = "Done! Tap the microphone to translate again.";
      } catch (err) {
        voiceStatus.textContent = "Translation failed: " + (err.message || "try again");
      }
    }
  };

  recognition.onerror = (e) => {
    voiceStatus.textContent = `Error: ${e.error}`;
    stopVoiceRecognition();
  };

  recognition.onend = () => {
    if (isVoiceRecording) stopVoiceRecognition();
  };

  recognition.start();
}

function stopVoiceRecognition() {
  if (recognition) {
    try { recognition.stop(); } catch {}
  }
  isVoiceRecording = false;
  voiceMicBtn.classList.remove("recording");
  voiceMicBtn.querySelector("span").textContent = "Start Listening";
  micOrb.classList.remove("recording");
  vizBars.classList.remove("active");
  if (voiceStatus.textContent === "Listening... speak now") {
    voiceStatus.textContent = "Tap the microphone and start speaking";
  }
}

// =====================
// Conversation mode
// =====================
function toggleConvTurn() {
  convTurn = convTurn === "a" ? "b" : "a";
  convTurnBtn.dataset.turn = convTurn;
  convTurnBtn.classList.toggle("active", true);
  convTurnLabel.textContent = convTurn === "a" ? "Your turn" : "Their turn";
}

async function convSend() {
  const text = convInput.value.trim();
  if (!text) return;

  const isSideA = convTurn === "a";
  const srcLang = isSideA ? convLangA.value : convLangB.value;
  const tgtLang = isSideA ? convLangB.value : convLangA.value;

  convInput.value = "";
  convInput.disabled = true;
  convSendBtn.disabled = true;

  // Show original immediately
  const msgId = ++convMessageCount;
  const sideClass = isSideA ? "side-a" : "side-b";
  const msgEl = document.createElement("div");
  msgEl.className = `conv-msg ${sideClass}`;
  msgEl.innerHTML = `<div class="conv-msg-original">${escapeHtml(text)}</div><div class="conv-msg-translated conv-msg-loading">Translating...</div>`;
  convMessages.appendChild(msgEl);
  convMessages.scrollTop = convMessages.scrollHeight;

  // Remove empty placeholder
  const empty = convMessages.querySelector(".conv-empty");
  if (empty) empty.remove();

  try {
    const result = await translateText(text, srcLang, tgtLang);
    const translatedEl = msgEl.querySelector(".conv-msg-translated");
    translatedEl.classList.remove("conv-msg-loading");
    translatedEl.textContent = result;

    // Pronunciation
    const pron = romanize(result, tgtLang);
    if (pron) {
      const pronEl = document.createElement("div");
      pronEl.className = "conv-msg-pron";
      pronEl.textContent = pron;
      msgEl.insertBefore(pronEl, translatedEl);
    }

    // Action buttons (speak + favorite)
    const actionsEl = document.createElement("div");
    actionsEl.className = "conv-msg-actions";

    const speakBtn = document.createElement("button");
    speakBtn.className = "mini-btn";
    speakBtn.title = "Listen";
    speakBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>`;
    speakBtn.addEventListener("click", () => speak(result, tgtLang));
    actionsEl.appendChild(speakBtn);

    const favBtn = document.createElement("button");
    favBtn.className = "mini-btn";
    favBtn.title = "Save to favorites";
    favBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>`;
    favBtn.addEventListener("click", () => {
      addToFavorites(text, result, srcLang, tgtLang);
      favBtn.classList.add("fav-active");
      showToast("Saved to favorites");
    });
    actionsEl.appendChild(favBtn);

    msgEl.appendChild(actionsEl);

    addToHistory(text, result, srcLang, tgtLang);
  } catch (err) {
    const translatedEl = msgEl.querySelector(".conv-msg-translated");
    translatedEl.textContent = "Translation failed";
    translatedEl.style.color = "var(--error)";
  } finally {
    convInput.disabled = false;
    convSendBtn.disabled = false;
    convInput.focus();
  }

  // Auto-switch turn after each message
  toggleConvTurn();
}

function startConvRecognition() {
  recognition = initRecognition();
  if (!recognition) {
    showToast("Voice input not supported. Try Chrome or Edge.");
    return;
  }

  const isSideA = convTurn === "a";
  const srcLang = isSideA ? convLangA.value : convLangB.value;
  recognition.lang = langToBcp47(srcLang);
  recognition.continuous = false;
  recognition.interimResults = true;

  isConvRecording = true;
  convMicBtn.classList.add("recording");

  let finalTranscript = "";

  recognition.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        finalTranscript += e.results[i][0].transcript;
      } else {
        interim += e.results[i][0].transcript;
      }
    }
    convInput.value = finalTranscript + interim;
  };

  recognition.onerror = (e) => {
    showToast(`Voice error: ${e.error}`);
    stopConvRecognition();
  };

  recognition.onend = () => {
    stopConvRecognition();
    if (finalTranscript.trim()) {
      convSend();
    }
  };

  recognition.start();
}

function stopConvRecognition() {
  if (recognition) {
    try { recognition.stop(); } catch {}
  }
  isConvRecording = false;
  convMicBtn.classList.remove("recording");
}

function toggleConvMic() {
  if (isConvRecording) stopConvRecognition();
  else startConvRecognition();
}

// =====================
// Favorites
// =====================
function loadFavorites() {
  try {
    const saved = localStorage.getItem("lingua-favorites");
    if (saved) favorites = JSON.parse(saved);
  } catch {
    favorites = [];
  }
  renderFavorites();
}

function saveFavorites() {
  localStorage.setItem("lingua-favorites", JSON.stringify(favorites));
}

function addToFavorites(source, target, srcLang, tgtLang) {
  // Avoid duplicates
  const exists = favorites.some(
    (f) => f.source === source && f.target === target && f.srcLang === srcLang && f.tgtLang === tgtLang
  );
  if (exists) return;
  favorites.unshift({
    id: Date.now(),
    source,
    target,
    srcLang,
    tgtLang,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });
  if (favorites.length > 50) favorites = favorites.slice(0, 50);
  saveFavorites();
  renderFavorites();
}

function removeFromFavorites(id) {
  favorites = favorites.filter((f) => f.id !== id);
  saveFavorites();
  renderFavorites();
}

function renderFavorites() {
  if (favorites.length === 0) {
    favoritesList.innerHTML = '<p class="empty-state">Star a translation to save it here for quick access.</p>';
    clearFavoritesBtn.classList.add("hidden");
    return;
  }
  clearFavoritesBtn.classList.remove("hidden");
  favoritesList.innerHTML = favorites
    .map(
      (f) => `
      <div class="history-item fav-item" data-id="${f.id}">
        <div class="fav-item-header">
          <div class="history-lang">${LANGUAGES[f.srcLang] || f.srcLang} → ${LANGUAGES[f.tgtLang] || f.tgtLang}</div>
          <button class="mini-btn fav-remove" data-fav-id="${f.id}" aria-label="Remove" title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div class="history-source">${escapeHtml(f.source)}</div>
        <div class="history-target">${escapeHtml(f.target)}</div>
        <div class="history-time">${f.time}</div>
      </div>`
    )
    .join("");

  // Click to restore
  favoritesList.querySelectorAll(".fav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".fav-remove")) return;
      const entry = favorites.find((f) => f.id == item.dataset.id);
      if (!entry) return;
      sourceLangSel.value = entry.srcLang;
      targetLangSel.value = entry.tgtLang;
      sourceTextEl.value = entry.source;
      outputTextEl.textContent = entry.target;
      translationMetaEl.textContent = `${LANGUAGES[entry.srcLang]} → ${LANGUAGES[entry.tgtLang]}`;
      // Show pronunciation if applicable
      const pron = romanize(entry.target, entry.tgtLang);
      if (pron) {
        pronunciationText.textContent = pron;
        pronunciationGuide.classList.remove("hidden");
      } else {
        pronunciationGuide.classList.add("hidden");
      }
      updateCharCount();
      switchMode("text");
      sourceTextEl.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast("Translation restored");
    });
  });

  // Remove buttons
  favoritesList.querySelectorAll(".fav-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromFavorites(Number(btn.dataset.favId));
      showToast("Removed from favorites");
    });
  });
}

function clearFavorites() {
  favorites = [];
  saveFavorites();
  renderFavorites();
  showToast("Favorites cleared");
}

function toggleFavoriteCurrent() {
  const text = sourceTextEl.value.trim();
  const result = outputTextEl.textContent.trim();
  if (!text || !result) {
    showToast("Translate something first");
    return;
  }
  // Check if already favorited
  const exists = favorites.some(
    (f) => f.source === text && f.target === result
  );
  if (exists) {
    // Remove it
    favorites = favorites.filter((f) => !(f.source === text && f.target === result));
    saveFavorites();
    renderFavorites();
    favoriteBtn.classList.remove("fav-active");
    showToast("Removed from favorites");
  } else {
    addToFavorites(text, result, sourceLangSel.value, targetLangSel.value);
    favoriteBtn.classList.add("fav-active");
    showToast("Saved to favorites");
  }
}

function checkFavoriteStatus() {
  const text = sourceTextEl.value.trim();
  const result = outputTextEl.textContent.trim();
  const exists = favorites.some((f) => f.source === text && f.target === result);
  favoriteBtn.classList.toggle("fav-active", exists);
}

// =====================
// History
// =====================
function loadHistory() {
  try {
    const saved = localStorage.getItem("lingua-history");
    if (saved) history = JSON.parse(saved);
  } catch {
    history = [];
  }
  renderHistory();
}

function saveHistory() {
  localStorage.setItem("lingua-history", JSON.stringify(history));
}

function addToHistory(source, target, srcLang, tgtLang) {
  const entry = {
    id: Date.now(),
    source,
    target,
    srcLang,
    tgtLang,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
  history.unshift(entry);
  if (history.length > 20) history = history.slice(0, 20);
  saveHistory();
  renderHistory();
  checkFavoriteStatus();
}

function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = '<p class="empty-state">Your translation history will appear here.</p>';
    clearHistoryBtn.classList.add("hidden");
    return;
  }
  clearHistoryBtn.classList.remove("hidden");
  historyList.innerHTML = history
    .map(
      (h) => `
      <div class="history-item" data-id="${h.id}">
        <div class="history-lang">${LANGUAGES[h.srcLang] || h.srcLang} → ${LANGUAGES[h.tgtLang] || h.tgtLang}</div>
        <div class="history-source">${escapeHtml(h.source)}</div>
        <div class="history-target">${escapeHtml(h.target)}</div>
        <div class="history-time">${h.time}</div>
      </div>`
    )
    .join("");

  historyList.querySelectorAll(".history-item").forEach((item) => {
    item.addEventListener("click", () => {
      const entry = history.find((h) => h.id == item.dataset.id);
      if (!entry) return;
      sourceLangSel.value = entry.srcLang;
      targetLangSel.value = entry.tgtLang;
      sourceTextEl.value = entry.source;
      outputTextEl.textContent = entry.target;
      translationMetaEl.textContent = `${LANGUAGES[entry.srcLang]} → ${LANGUAGES[entry.tgtLang]}`;
      const pron = romanize(entry.target, entry.tgtLang);
      if (pron) {
        pronunciationText.textContent = pron;
        pronunciationGuide.classList.remove("hidden");
      } else {
        pronunciationGuide.classList.add("hidden");
      }
      updateCharCount();
      switchMode("text");
      sourceTextEl.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast("Translation restored");
    });
  });
}

function clearHistory() {
  history = [];
  saveHistory();
  renderHistory();
  showToast("History cleared");
}

// =====================
// Helpers
// =====================
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

function hideError() {
  errorMsg.classList.add("hidden");
}

let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  requestAnimationFrame(() => toast.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 2200);
}

// =====================
// Event bindings
// =====================
function bindEvents() {
  themeToggle.addEventListener("click", toggleTheme);

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchMode(btn.dataset.mode));
  });

  translateBtn.addEventListener("click", handleTranslate);
  sourceTextEl.addEventListener("input", () => {
    updateCharCount();
    hideError();
  });
  sourceTextEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleTranslate();
    }
  });

  swapBtn.addEventListener("click", swapLanguages);
  clearBtn.addEventListener("click", () => {
    sourceTextEl.value = "";
    outputTextEl.textContent = "";
    translationMetaEl.textContent = "";
    pronunciationGuide.classList.add("hidden");
    favoriteBtn.classList.remove("fav-active");
    updateCharCount();
    sourceTextEl.focus();
  });
  copyBtn.addEventListener("click", copyOutput);
  speakOutputBtn.addEventListener("click", () => {
    speak(outputTextEl.textContent, targetLangSel.value);
  });
  micBtn.addEventListener("click", toggleMic);
  favoriteBtn.addEventListener("click", toggleFavoriteCurrent);

  // Voice mode
  voiceMicBtn.addEventListener("click", toggleVoiceRecognition);
  voiceSpeakBtn.addEventListener("click", () => {
    speak(voiceTranslationEl.textContent, targetLangSel.value);
  });

  // Conversation mode
  convSendBtn.addEventListener("click", convSend);
  convInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      convSend();
    }
  });
  convMicBtn.addEventListener("click", toggleConvMic);
  convTurnBtn.addEventListener("click", toggleConvTurn);

  // History & Favorites
  clearHistoryBtn.addEventListener("click", clearHistory);
  clearFavoritesBtn.addEventListener("click", clearFavorites);

  // Auto-translate on target language change if text exists
  targetLangSel.addEventListener("change", () => {
    if (sourceTextEl.value.trim() && currentMode === "text") {
      handleTranslate();
    }
  });
}

// Start
init();
