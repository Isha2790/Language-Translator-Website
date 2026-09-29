/* ===== romanize.js — phonetic romanization for non-Latin scripts ===== */

// Scripts that need romanization
const NON_LATIN_LANGS = new Set([
  "ru", "uk", "bg", "hr", "sr", // Cyrillic
  "el", // Greek
  "ar", "fa", "ur", // Arabic/Perso-Arabic
  "he", // Hebrew
  "ja", // Japanese
  "ko", // Korean
  "hi", "mr", // Devanagari
]);

// --- Cyrillic ---
const CYRILLIC = {
  а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"y",
  к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",
  х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
  і:"i",ї:"yi",є:"ye",ґ:"g",ђ:"đ",џ:"dž",ћ:"ć",њ:"nj",љ:"lj",
  А:"A",Б:"B",В:"V",Г:"G",Д:"D",Е:"E",Ё:"Yo",Ж:"Zh",З:"Z",И:"I",Й:"Y",
  К:"K",Л:"L",М:"M",Н:"N",О:"O",П:"P",Р:"R",С:"S",Т:"T",У:"U",Ф:"F",
  Х:"Kh",Ц:"Ts",Ч:"Ch",Ш:"Sh",Щ:"Shch",Ъ:"",Ы:"Y",Ь:"",Э:"E",Ю:"Yu",Я:"Ya",
};

// --- Greek ---
const GREEK = {
  α:"a",β:"v",γ:"g",δ:"d",ε:"e",ζ:"z",η:"i",θ:"th",ι:"i",κ:"k",λ:"l",
  μ:"m",ν:"n",ξ:"x",ο:"o",π:"p",ρ:"r",σ:"s",ς:"s",τ:"t",υ:"y",φ:"f",
  χ:"ch",ψ:"ps",ω:"o",
  Α:"A",Β:"V",Γ:"G",Δ:"D",Ε:"E",Ζ:"Z",Η:"I",Θ:"Th",Ι:"I",Κ:"K",Λ:"L",
  Μ:"M",Ν:"N",Ξ:"X",Ο:"O",Π:"P",Ρ:"R",Σ:"S",Τ:"T",Υ:"Y",Φ:"F",
  Χ:"Ch",Ψ:"Ps",Ω:"O",
  ά:"a",έ:"e",ή:"i",ί:"i",ό:"o",ύ:"y",ώ:"o",
  ϊ:"i",ϋ:"y",ΐ:"i",ΰ:"y",
};

// --- Arabic / Persian / Urdu ---
const ARABIC = {
  "\u0627":"a","\u0628":"b","\u062A":"t","\u062B":"th","\u062C":"j","\u062D":"h","\u062E":"kh","\u062F":"d","\u0630":"dh","\u0631":"r","\u0632":"z",
  "\u0633":"s","\u0634":"sh","\u0635":"s","\u0636":"d","\u0637":"t","\u0638":"z","\u0639":"'","\u063A":"gh","\u0641":"f","\u0642":"q","\u0643":"k",
  "\u0644":"l","\u0645":"m","\u0646":"n","\u0647":"h","\u0648":"w","\u064A":"y","\u0621":"'",
  "\u067E":"p","\u0686":"ch","\u0698":"zh","\u06AF":"g","\u06A9":"k","\u06CC":"y","\u06BE":"h","\u0693":"r","\u0679":"t","\u0688":"d",
  "\u06BA":"n","\u06C0":"h",
  // Diacritics (combining marks)
  "\u064E":"a","\u064F":"u","\u0650":"i","\u064B":"an","\u064C":"un","\u064D":"in","\u0651":"","\u0652":"","\u0670":"a",
};

// --- Hebrew ---
const HEBREW = {
  "\u05D0":"","\u05D1":"b","\u05D2":"g","\u05D3":"d","\u05D4":"h","\u05D5":"v","\u05D6":"z","\u05D7":"ch","\u05D8":"t","\u05D9":"y","\u05DB":"k",
  "\u05DC":"l","\u05DE":"m","\u05DD":"m","\u05E0":"n","\u05DF":"n","\u05E1":"s","\u05E2":"","\u05E4":"p","\u05E3":"f","\u05E6":"ts","\u05E5":"ts",
  "\u05E7":"k","\u05E8":"r","\u05E9":"sh","\u05EA":"t",
  // Dagesh / vowel points (combining marks)
  "\u05BC":"","\u05B0":"a","\u05B1":"e","\u05B2":"a","\u05B4":"i","\u05B5":"e","\u05BB":"u","\u05B9":"o",
};

// --- Japanese kana ---
const HIRAGANA = {
  あ:"a",い:"i",う:"u",え:"e",お:"o",
  か:"ka",き:"ki",く:"ku",け:"ke",こ:"ko",
  さ:"sa",し:"shi",す:"su",せ:"se",そ:"so",
  た:"ta",ち:"chi",つ:"tsu",て:"te",と:"to",
  な:"na",に:"ni",ぬ:"nu",ね:"ne",の:"no",
  は:"ha",ひ:"hi",ふ:"fu",へ:"he",ほ:"ho",
  ま:"ma",み:"mi",む:"mu",め:"me",も:"mo",
  や:"ya",ゆ:"yu",よ:"yo",
  ら:"ra",り:"ri",る:"ru",れ:"re",ろ:"ro",
  わ:"wa",を:"wo",ん:"n",
  が:"ga",ぎ:"gi",ぐ:"gu",げ:"ge",ご:"go",
  ざ:"za",じ:"ji",ず:"zu",ぜ:"ze",ぞ:"zo",
  だ:"da",ぢ:"ji",づ:"zu",で:"de",ど:"do",
  ば:"ba",び:"bi",ぶ:"bu",べ:"be",ぼ:"bo",
  ぱ:"pa",ぴ:"pi",ぷ:"pu",ぺ:"pe",ぽ:"po",
  ぁ:"a",ぃ:"i",ぅ:"u",ぇ:"e",ぉ:"o",
  ゃ:"ya",ゅ:"yu",ょ:"yo",っ:"",
  ゐ:"wi",ゑ:"we",
};

const KATAKANA = {
  ア:"a",イ:"i",ウ:"u",エ:"e",オ:"o",
  カ:"ka",キ:"ki",ク:"ku",ケ:"ke",コ:"ko",
  サ:"sa",シ:"shi",ス:"su",セ:"se",ソ:"so",
  タ:"ta",チ:"chi",ツ:"tsu",テ:"te",ト:"to",
  ナ:"na",ニ:"ni",ヌ:"nu",ネ:"ne",ノ:"no",
  ハ:"ha",ヒ:"hi",フ:"fu",ヘ:"he",ホ:"ho",
  マ:"ma",ミ:"mi",ム:"mu",メ:"me",モ:"mo",
  ヤ:"ya",ユ:"yu",ヨ:"yo",
  ラ:"ra",リ:"ri",ル:"ru",レ:"re",ロ:"ro",
  ワ:"wa",ヲ:"wo",ン:"n",
  ガ:"ga",ギ:"gi",グ:"gu",ゲ:"ge",ゴ:"go",
  ザ:"za",ジ:"ji",ズ:"zu",ゼ:"ze",ゾ:"zo",
  ダ:"da",ヂ:"ji",ヅ:"zu",デ:"de",ド:"do",
  バ:"ba",ビ:"bi",ブ:"bu",ベ:"be",ボ:"bo",
  パ:"pa",ピ:"pi",プ:"pu",ペ:"pe",ポ:"po",
  ァ:"a",ィ:"i",ゥ:"u",ェ:"e",ォ:"o",
  ャ:"ya",ュ:"yu",ョ:"yo",ッ:"",
  ヰ:"wi",ヱ:"we",
};

// Yō-on combinations: preceding char + small y-kana
const YOON_BASE = {
  き:"k",し:"sh",ち:"ch",に:"n",ひ:"h",み:"m",り:"r",
  ぎ:"g",じ:"j",び:"b",ぴ:"p",
  キ:"k",シ:"sh",チ:"ch",ニ:"n",ヒ:"h",ミ:"m",リ:"r",
  ギ:"g",ジ:"j",ビ:"b",ピ:"p",
};
const YOON_SMALL = { ゃ:"ya",ゅ:"yu",ょ:"yo", ャ:"ya",ュ:"yu",ョ:"yo" };

function romanizeJapanese(text) {
  let result = "";
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1] || "";
    // Small tsu (っ/ッ) doubles next consonant
    if (ch === "っ" || ch === "ッ") {
      const nextRomaji = HIRAGANA[next] || KATAKANA[next] || "";
      if (nextRomaji) {
        result += nextRomaji[0];
      }
      continue;
    }
    // Yō-on: base + small y-kana
    if (YOON_BASE[ch] && YOON_SMALL[next]) {
      result += YOON_BASE[ch] + YOON_SMALL[next].slice(1);
      i++;
      continue;
    }
    // Regular kana
    result += HIRAGANA[ch] || KATAKANA[ch] || ch;
  }
  return result;
}

// --- Korean hangul ---
const HANGUL_INITIAL = ["g","kk","n","d","tt","r","m","b","pp","s","ss","","j","jj","ch","k","t","p","h"];
const HANGUL_MEDIAL = ["a","ae","ya","yae","eo","e","yeo","ye","o","wa","wae","oe","yo","u","wo","we","wi","yu","eu","ui","i"];
const HANGUL_FINAL = ["","k","k","ks","n","nj","nh","t","l","lg","lm","lb","ls","lt","lp","lh","m","p","ps","s","ss","ng","j","ch","k","t","p","h"];

function romanizeKorean(text) {
  let result = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = code - 0xac00;
      const initial = Math.floor(idx / 588);
      const medial = Math.floor((idx % 588) / 28);
      const fin = idx % 28;
      result += HANGUL_INITIAL[initial] + HANGUL_MEDIAL[medial] + HANGUL_FINAL[fin];
    } else {
      result += ch;
    }
  }
  return result;
}

// --- Devanagari (Hindi/Marathi) ---
const DEVANAGARI = {
  "\u0905":"a","\u0906":"aa","\u0907":"i","\u0908":"ii","\u0909":"u","\u090A":"uu","\u090B":"ri","\u090F":"e","\u0910":"ai","\u0913":"o","\u0914":"au",
  "\u0915":"ka","\u0916":"kha","\u0917":"ga","\u0918":"gha","\u0919":"nga",
  "\u091A":"ca","\u091B":"cha","\u091C":"ja","\u091D":"jha","\u091E":"nya",
  "\u091F":"ta","\u0920":"tha","\u0921":"da","\u0922":"dha","\u0923":"na",
  "\u0924":"ta","\u0925":"tha","\u0926":"da","\u0927":"dha","\u0928":"na",
  "\u092A":"pa","\u092B":"pha","\u092C":"ba","\u092D":"bha","\u092E":"ma",
  "\u092F":"ya","\u0930":"ra","\u0932":"la","\u0935":"va","\u0936":"sha","\u0937":"sha","\u0938":"sa","\u0939":"ha",
  // Matras (combining vowel signs)
  "\u093E":"aa","\u093F":"i","\u0940":"ii","\u0941":"u","\u0942":"uu","\u0943":"ri","\u0947":"e","\u0948":"ai","\u094B":"o","\u094C":"au",
  // Anusvara, visarga, chandrabindu
  "\u0902":"n","\u0903":"h","\u0901":"n",
  // Common conjuncts
  "\u0936\u094D\u0930":"shra","\u0915\u094D\u0937":"ksha","\u091C\u094D\u091E":"jna","\u0924\u094D\u0930":"tra",
};

function romanizeDevanagari(text) {
  let result = "";
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    // Check for conjuncts (2-char sequences first)
    const pair = ch + (chars[i + 1] || "");
    if (DEVANAGARI[pair]) {
      result += DEVANAGARI[pair];
      i++;
      continue;
    }
    result += DEVANAGARI[ch] || ch;
  }
  return result;
}

// --- Simple char-map romanizer ---
function romanizeByMap(text, map) {
  let result = "";
  for (const ch of text) {
    result += map[ch] ?? ch;
  }
  return result;
}

// --- Main export ---
export function romanize(text, langCode) {
  if (!text || !NON_LATIN_LANGS.has(langCode)) return null;
  switch (langCode) {
    case "ru":
    case "uk":
    case "bg":
    case "hr":
    case "sr":
      return romanizeByMap(text, CYRILLIC);
    case "el":
      return romanizeByMap(text, GREEK);
    case "ar":
    case "fa":
    case "ur":
      return romanizeByMap(text, ARABIC);
    case "he":
      return romanizeByMap(text, HEBREW);
    case "ja":
      return romanizeJapanese(text);
    case "ko":
      return romanizeKorean(text);
    case "hi":
    case "mr":
      return romanizeDevanagari(text);
    default:
      return null;
  }
}
