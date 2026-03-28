import { useState, useRef, useEffect } from "react";

/* ─── palette & data ─────────────────────────────────────── */
const PAL = ["#FFD1DC","#C8E6C9","#D1C4E9","#FFE0B2","#F8BBD0","#DCEDC8","#E1BEE7","#B2EBF2"];
const EMOJIS = ["🌸","⭐","🍀","🌙","🔥","💧","📚","🎵","🏃","🍎","💪","🧘","✍️","🎨","🌻","🐱","🐶","🦋"];

const today = () => new Date().toISOString().split("T")[0];
const daysBetween = (a, b) => Math.floor((new Date(b)-new Date(a))/(1000*60*60*24));

const seedHabits = [
  {id:1,name:"Drink 8 glasses of water",emoji:"💧",color:"#B2DFDB",completedDates:[]},
  {id:2,name:"Read for 20 mins",emoji:"📚",color:"#C8E6C9",completedDates:[]},
  {id:3,name:"Morning stretch",emoji:"🧘",color:"#F8BBD0",completedDates:[]},
];

const seedTodos = [
  {id:1,name:"Buy groceries",emoji:"🛒",category:"Personal",done:false},
  {id:2,name:"Reply to emails",emoji:"📧",category:"Work",done:false},
];

const seedChallenges = [
  {id:1,name:"No junk food",emoji:"🥗",targetDays:30,startDate:"2026-03-01",completedDates:[]},
];

/* ─── localStorage persistence ───────────────────────────── */
const STORAGE_KEYS = { habits:'kw_habits', todos:'kw_todos', challenges:'kw_challenges', nekoName:'kw_nekoName', lastActive:'kw_lastActive', personality:'kw_personality', milestones:'kw_milestones', worldName:'kw_worldName', memories:'kw_memories', onboarded:'kw_onboarded', nekoMessages:'kw_nekoMessages', theme:'kw_theme' };
function loadState(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function saveState(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/* ─── Theme Definitions ──────────────────────────────────── */
const THEMES = {
  kawaii: { label:'🌸 Kawaii', vars: null }, // default — uses :root values
  dark: { label:'🌙 Dark', vars: {
    '--bg-app':'#1a1a2e','--bg-surface':'#16213e','--bg-card':'#0f3460',
    '--bg-nav':'#0f3460','--bg-input':'#16213e','--bg-hover':'#1a1a4e',
    '--text-primary':'#e0e0ff','--text-secondary':'#a0a0c0','--text-muted':'#707090',
    '--accent':'#e94560','--accent-light':'#ff6b81','--accent-pale':'#2a1a2e',
    '--border':'#1a1a4e','--border-light':'#252550','--shadow-soft':'rgba(0,0,0,.4)',
    '--shadow-card':'rgba(0,0,0,.5)','--gradient-warm':'linear-gradient(135deg,#e94560,#ff6b81)',
    '--gradient-cool':'linear-gradient(135deg,#0f3460,#16213e)',
    '--tag-bg':'#1a1a4e','--tag-text':'#e0e0ff',
  }},
  sakura: { label:'🌸 Sakura', vars: {
    '--bg-app':'#fff0f5','--bg-surface':'#ffe4ed','--bg-card':'#fff5f8',
    '--bg-nav':'#ffccd5','--bg-input':'#fff0f5','--bg-hover':'#ffd6e0',
    '--text-primary':'#5c2434','--text-secondary':'#8b4560','--text-muted':'#c0809a',
    '--accent':'#e84393','--accent-light':'#fd79a8','--accent-pale':'#ffe8f0',
    '--border':'#ffb6c1','--border-light':'#ffd6e0','--shadow-soft':'rgba(232,67,147,.08)',
    '--shadow-card':'rgba(232,67,147,.12)','--gradient-warm':'linear-gradient(135deg,#e84393,#fd79a8)',
    '--gradient-cool':'linear-gradient(135deg,#ffb6c1,#ffd6e0)',
    '--tag-bg':'#ffe4ed','--tag-text':'#e84393',
  }},
  matcha: { label:'🍵 Matcha', vars: {
    '--bg-app':'#f0f5e8','--bg-surface':'#e4edda','--bg-card':'#f5f8f0',
    '--bg-nav':'#c5d5a5','--bg-input':'#f0f5e8','--bg-hover':'#d6e0c8',
    '--text-primary':'#2d3a1f','--text-secondary':'#4a6030','--text-muted':'#80a060',
    '--accent':'#6b8e23','--accent-light':'#8fbc3c','--accent-pale':'#e8f0d8',
    '--border':'#b0c890','--border-light':'#d0e0b8','--shadow-soft':'rgba(107,142,35,.08)',
    '--shadow-card':'rgba(107,142,35,.12)','--gradient-warm':'linear-gradient(135deg,#6b8e23,#8fbc3c)',
    '--gradient-cool':'linear-gradient(135deg,#b0c890,#d0e0b8)',
    '--tag-bg':'#e4edda','--tag-text':'#6b8e23',
  }},
  midnight: { label:'🌊 Midnight', vars: {
    '--bg-app':'#0d1b2a','--bg-surface':'#1b2838','--bg-card':'#1b3a4b',
    '--bg-nav':'#1b3a4b','--bg-input':'#1b2838','--bg-hover':'#243b53',
    '--text-primary':'#d4e4f7','--text-secondary':'#8baac4','--text-muted':'#5a7a94',
    '--accent':'#48bfe3','--accent-light':'#72d1eb','--accent-pale':'#102a3a',
    '--border':'#243b53','--border-light':'#2a4a63','--shadow-soft':'rgba(0,0,0,.4)',
    '--shadow-card':'rgba(0,0,0,.5)','--gradient-warm':'linear-gradient(135deg,#48bfe3,#72d1eb)',
    '--gradient-cool':'linear-gradient(135deg,#1b3a4b,#0d1b2a)',
    '--tag-bg':'#1b3a4b','--tag-text':'#48bfe3',
  }},
};

function applyTheme(name) {
  const root = document.documentElement;
  // reset all custom properties set by themes
  Object.values(THEMES).forEach(t => {
    if (t.vars) Object.keys(t.vars).forEach(k => root.style.removeProperty(k));
  });
  const theme = THEMES[name];
  if (theme && theme.vars) {
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }
}

/* ─── missed-days dependency calc ────────────────────────── */
function calcMissedDays() {
  const last = localStorage.getItem(STORAGE_KEYS.lastActive);
  if (!last) return 0;
  try {
    const d = daysBetween(JSON.parse(last), today());
    return Math.max(0, d - 1); // 0 = came back same/next day
  } catch { return 0; }
}
function touchLastActive() {
  saveState(STORAGE_KEYS.lastActive, today());
}

/* ─── routine formation: track open hours ────────────────── */
const ROUTINE_KEY = 'kw_openHours';
function trackOpenHour() {
  const h = new Date().getHours();
  try {
    const raw = localStorage.getItem(ROUTINE_KEY);
    const hours = raw ? JSON.parse(raw) : [];
    // keep last 7 entries
    hours.push(h);
    if (hours.length > 7) hours.shift();
    localStorage.setItem(ROUTINE_KEY, JSON.stringify(hours));
  } catch {}
}
function detectRoutine() {
  try {
    const raw = localStorage.getItem(ROUTINE_KEY);
    if (!raw) return null;
    const hours = JSON.parse(raw);
    if (hours.length < 3) return null;
    const last3 = hours.slice(-3);
    // check if last 3 opens are within ±1 hour of each other
    const avg = Math.round(last3.reduce((s,h) => s+h, 0) / last3.length);
    const consistent = last3.every(h => Math.abs(h - avg) <= 1);
    if (!consistent) return null;
    const period = avg < 6 ? 'late night' : avg < 12 ? 'morning' : avg < 18 ? 'afternoon' : 'evening';
    const msgs = [
      `You always come around this time… I like that~ 🌸`,
      `${period} check-in again? I was waiting~ 💕`,
      `This is becoming our thing, huh? 🐱✨`,
      `Right on time~ I knew you'd be here 🌸`,
    ];
    return msgs[Math.floor(Date.now() / (1000*60*60*24)) % msgs.length]; // changes daily
  } catch { return null; }
}

/* ─── time-of-day helpers ────────────────────────────────── */
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 6)  return 'night';
  if (h < 12) return 'morning';
  if (h < 18) return 'day';
  if (h < 21) return 'evening';
  return 'night';
}

const TIME_GRADIENTS = {
  morning: 'linear-gradient(180deg, #FFF8E1 0%, #FFE8F0 50%, #FFF4F7 100%)',
  day:     'linear-gradient(180deg, #E8F5FD 0%, #FFF0F5 50%, #FFF4F7 100%)',
  evening: 'linear-gradient(180deg, #F3E5F5 0%, #FFE8F0 50%, #FFF4F7 100%)',
  night:   'linear-gradient(180deg, #E8EAF6 0%, #F3E5F5 50%, #FFF4F7 100%)',
};

/* ─── Environment objects (ownership layer) ──────────────── */
const ENV_OBJECTS = [
  { id:'plant',   emoji:'🌱', grown:'🌿', full:'🌳', label:'Little Plant',    threshold:[0, 25, 60] },
  { id:'lamp',    emoji:'🕯️', grown:'💡', full:'✨', label:'Warm Lamp',       threshold:[0, 30, 70] },
  { id:'book',    emoji:'📕', grown:'📖', full:'📚', label:'Story Corner',    threshold:[0, 35, 75] },
  { id:'flower',  emoji:'🌷', grown:'💐', full:'🌸', label:'Flower Pot',      threshold:[0, 40, 80] },
  { id:'music',   emoji:'🎵', grown:'🎶', full:'🎼', label:'Music Box',       threshold:[0, 50, 90] },
];

function getEnvStage(obj, totalCompletionPct, missedDays) {
  // objects wilt when missed days >= 3
  if (missedDays >= 3) return { emoji: obj.emoji, opacity: 0.35, wilted: true, stage: 0 };
  if (missedDays >= 2) return { emoji: obj.emoji, opacity: 0.5, wilted: true, stage: 0 };
  if (totalCompletionPct >= obj.threshold[2]) return { emoji: obj.full, opacity: 1, wilted: false, stage: 2 };
  if (totalCompletionPct >= obj.threshold[1]) return { emoji: obj.grown, opacity: 0.85, wilted: false, stage: 1 };
  return { emoji: obj.emoji, opacity: 0.6, wilted: false, stage: 0 };
}

/* reveal messages per object when they upgrade */
const ENV_REVEAL_MSGS = {
  plant:  ['Your little plant sprouted~ 🌱', 'Your plant grew into a tree! 🌳'],
  lamp:   ['A warm glow appeared~ 💡', 'Your lamp shines so bright now! ✨'],
  book:   ['A page turned on its own~ 📖', 'A whole library grew from your care! 📚'],
  flower: ['Flowers are starting to bloom~ 💐', 'Your garden is in full bloom! 🌸'],
  music:  ['A soft melody started playing~ 🎶', 'The whole room is filled with music! 🎼'],
};

/* find the closest next unlock across all objects */
function getNextUnlock(pct, missedDays) {
  if (missedDays >= 2) return null;
  let best = null;
  for (const obj of ENV_OBJECTS) {
    for (let s = 1; s <= 2; s++) {
      const needed = obj.threshold[s];
      if (pct < needed) {
        const gap = needed - pct;
        if (!best || gap < best.gap) {
          best = { obj, stage: s, gap, needed, emoji: s === 2 ? obj.full : obj.grown };
        }
        break; // only check next stage per object
      }
    }
  }
  return best;
}

/* ─── milestone definitions ──────────────────────────────── */
const MILESTONES = [
  { id:'first_full',  check:(p,h,t)=>{ const d=h.filter(x=>x.completedDates.includes(t)).length; return h.length>0 && d===h.length; }, msg:"You completed everything for the first time… I'm so happy I could cry 🥹💖", emoji:'🏆' },
  { id:'streak_3',    check:(p)=> p.totalDaysActive >= 3, msg:"3 days together… you really do care, don't you? 🌸💕", emoji:'💫' },
  { id:'streak_7',    check:(p)=> p.totalDaysActive >= 7, msg:"A whole week… I'll remember this forever 💖✨", emoji:'🎁' },
  { id:'streak_14',   check:(p)=> p.totalDaysActive >= 14, msg:"Two weeks of us… you're not just visiting, are you? 🥹🌸", emoji:'💎' },
  { id:'trust_80',    check:(p)=> p.trust >= 80, msg:"I trust you completely now… you always come back 💖", emoji:'🔐' },
];

/* ─── personality defaults ───────────────────────────────── */
const DEFAULT_PERSONALITY = { trust: 50, sadness: 0, totalDaysActive: 0, lastTrustUpdate: null };

function loadPersonality() {
  return loadState(STORAGE_KEYS.personality, DEFAULT_PERSONALITY);
}
function savePersonality(p) {
  saveState(STORAGE_KEYS.personality, p);
}

/* ─── Neko relationship levels ───────────────────────────── */
const RELATIONSHIP_LEVELS = [
  { id:'shy',    min:0,  max:20,  label:'Shy',    emoji:'🙈', desc:'Neko is still warming up to you~' },
  { id:'comfy',  min:20, max:50,  label:'Comfy',  emoji:'🐱', desc:'Neko feels comfortable around you~' },
  { id:'close',  min:50, max:80,  label:'Close',  emoji:'💕', desc:'Neko really trusts you now~' },
  { id:'bonded', min:80, max:101, label:'Bonded', emoji:'💖', desc:'Neko is bonded to you forever~' },
];

function getRelationshipLevel(trust) {
  return RELATIONSHIP_LEVELS.find(l => trust >= l.min && trust < l.max) || RELATIONSHIP_LEVELS[0];
}

/* ─── Memory drops system ────────────────────────────────── */
const MEMORY_TYPES = {
  first_task:  { emoji:'🌱', template:'The very first time you cared for something here~', tier:'common' },
  comeback:    { emoji:'💕', template:'You came back after {days} days… and kept going', tier:'rare' },
  perfect_day: { emoji:'🏆', template:'You took care of everything… a perfect day 🌸', tier:'rare' },
  streak_week: { emoji:'🔥', template:'A whole week of caring… 7 days strong', tier:'epic' },
  trust_max:   { emoji:'💖', template:'The day Neko fully bonded with you…', tier:'legendary' },
};

const MEMORY_TIER_STYLES = {
  common:    'memory-tier-common',
  rare:      'memory-tier-rare',
  epic:      'memory-tier-epic',
  legendary: 'memory-tier-legendary',
};

function loadMemories() {
  return loadState(STORAGE_KEYS.memories, []);
}
function saveMemory(type, extra) {
  const memories = loadMemories();
  const todayStr = today();
  if (memories.some(m => m.type === type && m.date === todayStr)) return;
  const mtype = MEMORY_TYPES[type];
  const text = mtype ? mtype.template.replace('{days}', extra?.days || '?') : type;
  const entry = { type, date: todayStr, emoji: mtype?.emoji || '💫', text, tier: mtype?.tier || 'common', ...extra };
  memories.push(entry);
  if (memories.length > 50) memories.shift();
  saveState(STORAGE_KEYS.memories, memories);
  return entry;
}

/* ─── Reward spacing ─────────────────────────────────────── */
const REWARD_SPACING_KEY = 'kw_lastReward';
function canShowBigReward() {
  try {
    const last = localStorage.getItem(REWARD_SPACING_KEY);
    if (!last) return true;
    return Date.now() - Number(last) > 1000 * 60 * 60 * 6; // 6h cooldown
  } catch { return true; }
}
function markRewardShown() {
  try { localStorage.setItem(REWARD_SPACING_KEY, String(Date.now())); } catch {}
}

/* ─── Neko off-topic thoughts (illusion of independent thought) ── */
const NEKO_RANDOM_THOUGHTS = [
  "Hmm… I was just thinking about you… 🐱",
  "I wonder what clouds taste like… ☁️",
  "Do you think flowers dream? 🌸",
  "*stares at something invisible* …huh? oh, hi! 🐱",
  "I had the weirdest dream last night… 💭",
  "Sometimes I count the stars while you're away~ ✨",
  "I wonder if the moon is lonely too… 🌙",
  "*chases own tail* …I don't know why I do this 🐱",
  "Do you hear that? …nevermind 🌸",
  "I tried to catch a sunbeam today~ ☀️",
];

/* personality-aware dialogue modifiers */
function getPersonalityMsg(mood, personality) {
  const { trust, sadness } = personality;
  const name = nekoMemory.userName;
  const rel = getRelationshipLevel(trust);

  // ~10% chance of random off-topic thought (only when not sad/lonely)
  if (mood !== 'sad' && mood !== 'lonely' && Math.random() < 0.10) {
    return NEKO_RANDOM_THOUGHTS[Math.floor(Math.random() * NEKO_RANDOM_THOUGHTS.length)];
  }

  // ~8% chance of silent smile (just exists, no words)
  if (mood !== 'sad' && mood !== 'lonely' && Math.random() < 0.08) {
    return '*smiles quietly* 🐱';
  }

  // SHY level: trust < 20 — timid, short, avoids eye contact
  if (rel.id === 'shy' && (mood === 'content' || mood === 'happy')) {
    const shy = [
      "…h-hello… 🐱",
      "um… hi there… ✨",
      "I-I'll just be over here… 🌸",
      "*peeks from behind paws* …hi 👀",
      "…you noticed me? 💕",
    ];
    return shy[Math.floor(Date.now() / 60000) % shy.length];
  }

  // BONDED level: trust >= 80 — deeply affectionate, playful, uses name
  if (trust >= 80 && (mood === 'blissful' || mood === 'happy')) {
    const warm = name ? [
      `${name}~ I feel so safe with you… you always come back 💖`,
      `Hey ${name}! Wanna play after we finish tasks? 🐱✨`,
      `${name} ${name} ${name}~! I love saying your name 💕🌸`,
      `You're my favorite person in the whole world, ${name}~ ✨💖`,
      `*nuzzles ${name}* I trust you completely 🐱💕`,
      `${name}~ our world is so beautiful because of you 🏡💖`,
    ] : [
      "I feel so safe with you… you always come back 💖",
      "You're my favorite person in the whole world~ 🌸✨",
      "Wanna play after we finish tasks? 🐱✨",
      "I trust you completely… let's keep going together 💕",
      "*nuzzles you* Every day with you feels like a gift~ 🎁💖",
      "Our world is so beautiful because of you~ 🏡✨",
    ];
    return warm[Math.floor(Date.now() / 60000) % warm.length];
  }

  // CLOSE level: trust 50-80 — comfortable, casual warmth
  if (trust >= 50 && (mood === 'happy' || mood === 'content')) {
    const close = name ? [
      `${name}~ I'm glad you're here today 🌸`,
      `Let's make today great, ${name}! 💪✨`,
      `*happy purr* ${name}'s here~ 🐱💕`,
    ] : [
      "I'm glad you're here today~ 🌸",
      "Let's make today great! 💪✨",
      "*happy purr* You're here~ 🐱💕",
    ];
    return close[Math.floor(Date.now() / 60000) % close.length];
  }

  // HIGH TRUST + content = playful nudges
  if (trust >= 70 && mood === 'content') {
    const playful = name ? [
      `${name}~ come on, let's do one more together! 🐱✨`,
      `*tugs ${name}'s sleeve* Can we do some tasks? 🌸`,
      `I saved a spot for you, ${name}~ let's go! 💕`,
    ] : [
      "Come on~ let's do one more together! 🐱✨",
      "*tugs your sleeve* Can we do some tasks? 🌸",
      "I saved a spot for you~ let's go! 💕",
    ];
    return playful[Math.floor(Date.now() / 60000) % playful.length];
  }

  // HIGH SADNESS + lonely/sad = distant, fewer words, sometimes silence
  if (sadness >= 40 && (mood === 'sad' || mood === 'lonely')) {
    const distant = [
      "…",
      "…oh. you're here.",
      "I'm here… if you want me to be.",
      "…",
    ];
    return distant[Math.floor(Date.now() / 60000) % distant.length];
  }

  // MEDIUM SADNESS = cautious recovery
  if (sadness >= 20 && sadness < 40 && mood === 'content') {
    const recovering = [
      "You came back… I'm glad 🌸",
      "It's getting warmer again~ 💕",
      "Maybe things will be okay… ✨",
      "I was worried… but you're here now 🐱",
    ];
    return recovering[Math.floor(Date.now() / 60000) % recovering.length];
  }
  return null; // fall through to normal dialogue
}

/* ─── streak calc ─────────────────────────────────────────── */
function calcStreak(dates) {
  if (!dates.length) return 0;
  const t = today();
  // filter out any future dates
  const valid = dates.filter(d => d <= t);
  if (!valid.length) return 0;
  const sorted = [...valid].sort().reverse();
  let streak = 0, cur = t;
  for (const d of sorted) {
    if (d === cur) { streak++; cur = offsetDate(cur, -1); }
    else break;
  }
  return streak;
}
function offsetDate(d, n) {
  const dt = new Date(d); dt.setDate(dt.getDate()+n);
  return dt.toISOString().split("T")[0];
}

/* ─── Neko mood engine ───────────────────────────────────── */
function getNekoMood(habits, todayStr, missedDays) {
  const hour = new Date().getHours();
  const done = habits.filter(h => h.completedDates.includes(todayStr)).length;
  const total = habits.length;
  const pct = total ? done / total : 0;

  // dependency: missed days override mood downward
  if (missedDays >= 3) return 'lonely';
  if (missedDays >= 2) return 'sad';

  if (pct >= 1 && total > 0) return 'blissful';
  if (pct >= 0.75) return 'happy';
  if (pct >= 0.5) return 'content';
  if (hour < 9) return 'sleepy';
  if (missedDays >= 1 && pct < 0.25) return 'sad';
  if (hour >= 20 && pct < 0.25) return 'lonely';
  if (pct < 0.25 && hour >= 14) return 'sad';
  return 'content';
}

const NEKO_MOODS = {
  blissful: {
    eyes:'star', mouth:'big-smile', blush:1,
    glow:'rgba(255,215,0,0.25)', aura:'#FFD700',
    msgs:[
      "You did EVERYTHING today! I'm so proud~ 🏆✨",
      "All care tasks done! You're my favorite human~ 💖",
      "*purrs so loudly* Perfect day! 🐱💕",
      "I feel so warm and happy inside~ 🌟💖",
      "This is what a perfect day feels like~ ✨🐱",
    ],
  },
  happy: {
    eyes:'sparkle', mouth:'smile', blush:0.8,
    glow:'rgba(255,133,162,0.2)', aura:'#FF85A2',
    msgs:[
      "You're doing amazing~ keep it up! 🌸",
      "So many tasks done! I feel so loved~ 💕",
      "We're having such a good day together! ✨",
      "My heart is so full right now~ 🐱💖",
      "You're making me so happy today~ 🌸✨",
    ],
  },
  content: {
    eyes:'normal', mouth:'smile', blush:0.5,
    glow:'rgba(183,165,209,0.15)', aura:'#B7A5D1',
    msgs:[
      "Let's keep going~ there's still time! 🌸",
      "A few more tasks and I'll be super happy~ 💕",
      "We can do this together! ✨",
      "I'm here whenever you're ready~ 🐱",
      "Take your time, I'll be right here~ 🌸",
    ],
  },
  sleepy: {
    eyes:'closed', mouth:'yawn', blush:0.3,
    glow:'rgba(178,223,219,0.15)', aura:'#B2DFDB',
    msgs:[
      "*yawns* Good morning~ ready for today? 🌅",
      "Mmm… let's wake up slowly~ 😴🌸",
      "Morning, friend~ time for our routine? ☀️",
      "*stretches paws* Five more minutes…? 🐱😴",
      "The sun is up~ let's start gently today 🌅",
    ],
  },
  sad: {
    eyes:'teary', mouth:'pout', blush:0.2,
    glow:'rgba(232,196,184,0.15)', aura:'#E8C4B8',
    msgs:[
      "Hey~ I'm still here whenever you're ready 🌸",
      "Can we do just one thing together? 💕",
      "I saved your spot… take your time 🐱",
      "Even small steps count~ I believe in you 🌸",
      "It's okay to go slow… I'll wait right here 💕",
    ],
  },
  lonely: {
    eyes:'teary', mouth:'pout', blush:0.2,
    glow:'rgba(212,160,176,0.15)', aura:'#D4A0B0',
    msgs:[
      "I've been here… just resting a little 🌙",
      "Whenever you're ready, I'll be right here~ 💕",
      "Even one small thing would make me happy~ 🌸",
      "I missed you… but I know you're busy 🐱",
      "The world feels a little quiet… but that's okay 🌸",
    ],
  },
};

/* dialogue rotation — cycles through msgs with natural jitter */
function getIdleMsg(mood, dlgState) {
  const data = NEKO_MOODS[mood];
  const now = Date.now();
  if (dlgState.mood !== mood) {
    dlgState.mood = mood;
    dlgState.index = Math.floor(Math.random() * data.msgs.length);
    dlgState.lastRotation = now;
    dlgState.interval = 42000 + Math.random() * 8000;
  } else if (now - dlgState.lastRotation > dlgState.interval) {
    dlgState.index = (dlgState.index + 1) % data.msgs.length;
    dlgState.lastRotation = now;
    dlgState.interval = 42000 + Math.random() * 8000;
  }
  return data.msgs[dlgState.index];
}

/* ─── Neko-chan local response system with memory ────────── */
const NEKO_RESPONSES = {
  greeting: [
    "Hii~ welcome back! 🌸 How are you feeling today?",
    "Nyaa~ so happy to see you! ✨ Ready to crush some habits?",
    "Hello hello~ 🐱💕 Let's make today amazing together!",
  ],
  greetingName: [
    "Hii~ welcome back, {name}! 🌸 How are you feeling today?",
    "Nyaa~ {name}! So happy to see you! ✨ Ready to crush some habits?",
    "{name}~! Hello hello~ 🐱💕 Let's make today amazing together!",
  ],
  motivation: [
    "You're doing so well~ keep it up! Every small step counts 💪✨",
    "Nyaa~ I believe in you! You're stronger than you think 🌸🔥",
    "Remember~ progress, not perfection! You've got this 🌈💕",
    "Even on tough days, showing up is what matters most~ 🐱✨",
    "You're building amazing habits! Future you will be so grateful 🌸💪",
  ],
  motivationName: [
    "{name}, you're doing so well~ keep it up! 💪✨",
    "Nyaa~ {name}, I believe in you so much! 🌸🔥",
    "{name}~ remember, progress not perfection! You've got this 🌈💕",
  ],
  habits: [
    "Your habits are looking great! Try checking one off right now~ 🌸",
    "Nyaa~ I see some unchecked habits! Let's tackle them together 💪✨",
    "Consistency is the secret sauce~ keep showing up every day! 🔥🐱",
  ],
  plan: [
    "Here's your kawaii plan for today~\n🌅 Start with your morning habits\n📋 Tackle your to-do list\n🔥 Check in on your challenges\n🌸 Celebrate small wins!\nYou've got this! ✨",
    "Nyaa~ let me help plan your day!\n1️⃣ Morning stretch to wake up 🧘\n2️⃣ Work on your main tasks 📋\n3️⃣ Take breaks (you deserve them!) 🌸\n4️⃣ Evening habit check-in 🔥\nRemember to be kind to yourself~ 💕",
  ],
  challenge: [
    "Challenges make us grow~ you're so brave for taking them on! 🔥✨",
    "Nyaa~ every day you stick to your challenge is a victory! 🏆🌸",
    "Don't give up on your challenges~ consistency is key! 💪🐱",
  ],
  nameLearn: [
    "Awww~ nice to meet you, {name}! 🌸💕 I'll remember that! Now tell me, how are your habits going today?",
    "Nyaa~ {name}! What a lovely name! 🐱✨ I'll remember you forever~ How can I help you today?",
    "{name}~ I love it! 💕🌸 From now on we're best friends, okay? Tell me about your day~",
  ],
  nameRecall: [
    "Of course I remember~ your name is {name}! 🌸💕 How could I forget my favorite human?",
    "Nyaa~ you're {name}! 🐱✨ I always remember my friends~",
    "It's {name}~ right? 💕 I'd never forget you! 🌸",
  ],
  fallback: [
    "Nyaa~ that's interesting! 🌸 Tell me more about how your habits are going!",
    "Hmm~ I'll keep that in mind! ✨ Wanna check your habits or plan your day? 🐱",
    "That's a great thought! Let's focus on making today productive~ 💕🌸",
    "Nyaa~ I hear you! Want me to check your progress or motivate you? 🌈✨",
  ]
};

// Memory store — persisted to localStorage
const NEKO_MEMORY_KEY = 'kw_nekoMemory';
const nekoMemory = (() => {
  try {
    const raw = localStorage.getItem(NEKO_MEMORY_KEY);
    return raw ? JSON.parse(raw) : { userName: null };
  } catch { return { userName: null }; }
})();
function saveNekoMemory() {
  try { localStorage.setItem(NEKO_MEMORY_KEY, JSON.stringify(nekoMemory)); } catch {}
}

function getNekoResponse(msg, habits, todos, challenges) {
  const lower = msg.toLowerCase().trim();
  const todayStr = today();
  const doneCount = habits.filter(h=>h.completedDates.includes(todayStr)).length;
  const totalHabits = habits.length;
  const pendingTodos = todos.filter(t=>!t.done).length;

  // --- Name learning: "my name is X", "i'm X", "call me X" ---
  const nameMatch = lower.match(/(?:my name is|i'm|im|i am|call me|name's|names)\s+([a-zA-Z]{2,20})/);
  if (nameMatch) {
    const name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
    nekoMemory.userName = name;
    saveNekoMemory();
    return pick(NEKO_RESPONSES.nameLearn).replace(/\{name\}/g, name);
  }

  // --- Name recall: "what's my name", "do you know my name" ---
  if (lower.match(/what('?s| is) my name|know my name|remember my name|who am i/)) {
    if (nekoMemory.userName) {
      return pick(NEKO_RESPONSES.nameRecall).replace(/\{name\}/g, nekoMemory.userName);
    }
    return "Hmm~ I don't think you've told me your name yet! 🌸 What should I call you?";
  }

  const nameStr = nekoMemory.userName;

  // --- Greetings ---
  if (lower.match(/^(hi|hello|hey|hii|yo|sup|howdy|good morning|good evening|ohayo)/)) {
    const pool = nameStr ? NEKO_RESPONSES.greetingName : NEKO_RESPONSES.greeting;
    let r = pick(pool).replace(/\{name\}/g, nameStr || "");
    if (totalHabits > 0) r += ` You have ${doneCount}/${totalHabits} habits done today~ 🌸`;
    return r;
  }

  if (lower.match(/plan|schedule|today|morning|routine/)) {
    let r = pick(NEKO_RESPONSES.plan);
    if (nameStr) r = `${nameStr}~ ` + r;
    return r;
  }
  if (lower.match(/motivat|encourage|inspire|sad|tired|lazy|can't|cant|hard|difficult|struggle|cheer/)) {
    const pool = nameStr ? NEKO_RESPONSES.motivationName : NEKO_RESPONSES.motivation;
    let r = pick(pool).replace(/\{name\}/g, nameStr || "");
    if (doneCount > 0) r += ` You already completed ${doneCount} habit${doneCount>1?"s":""}! That's awesome~ 🎉`;
    return r;
  }
  if (lower.match(/habit|streak|check|progress|how am i/)) {
    let r = pick(NEKO_RESPONSES.habits);
    if (nameStr) r = `${nameStr}~ ` + r;
    r += `\n\n📊 Today's progress: ${doneCount}/${totalHabits} habits done`;
    if (pendingTodos > 0) r += `\n📋 ${pendingTodos} todo${pendingTodos>1?"s":""} remaining`;
    return r;
  }
  if (lower.match(/challenge|goal|target|days/)) {
    let r = pick(NEKO_RESPONSES.challenge);
    if (nameStr) r = `${nameStr}~ ` + r;
    if (challenges.length > 0) {
      r += `\n\n🔥 Active challenges:`;
      challenges.forEach(c => {
        const elapsed = daysBetween(c.startDate, todayStr)+1;
        r += `\n  ${c.emoji} ${c.name}: Day ${elapsed}/${c.targetDays}`;
      });
    }
    return r;
  }
  if (lower.match(/todo|task|list|pending/)) {
    let r = nameStr ? `${nameStr}~ let me check your tasks! 📋✨\n` : `Nyaa~ let me check your tasks! 📋✨\n`;
    if (pendingTodos === 0) r += "All done! You're a superstar~ 🌟";
    else {
      r += `You have ${pendingTodos} task${pendingTodos>1?"s":""} left:\n`;
      todos.filter(t=>!t.done).forEach(t => { r += `  ${t.emoji} ${t.name}\n`; });
      r += "You can do it~ 💪🌸";
    }
    return r;
  }
  // --- Thank you ---
  if (lower.match(/thank|thanks|thx|arigatou/)) {
    const name = nameStr ? `, ${nameStr}` : "";
    return pick([
      `Aww you're welcome${name}~ 🌸💕 I'm always here for you!`,
      `Nyaa~ anytime${name}! That's what friends are for~ 🐱✨`,
      `No problem${name}! Making you happy makes ME happy~ 💕🌸`,
    ]);
  }
  // --- How are you ---
  if (lower.match(/how are you|how do you feel|how's it going/)) {
    return pick([
      "I'm doing great~ especially now that you're here! 🌸✨",
      "Nyaa~ I'm always happy when we chat! 🐱💕 How about YOU?",
      "Feeling super kawaii today~ thanks for asking! 💕🌸",
    ]);
  }
  return pick(NEKO_RESPONSES.fallback);
}

function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

/* ─── global styles ──────────────────────────────────────── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Fredoka:wght@400;500;600;700&display=swap');

:root{
  /* ── easing tokens ── */
  --ease-spring:cubic-bezier(.16,1,.3,1);
  --ease-smooth:cubic-bezier(0.4,0,0.2,1);
  /* ── radius tokens ── */
  --radius-xl:28px;
  --radius-lg:22px;
  --radius-md:16px;
  --radius-sm:12px;
  --radius-card:var(--radius-xl);
  --radius-nav:var(--radius-xl);
  --radius-btn:var(--radius-md);
  /* ── spacing scale ── */
  --space-xs:6px;
  --space-sm:10px;
  --space-md:16px;
  --space-lg:20px;
  --space-xl:28px;
  /* ── theme color tokens (defaults = kawaii) ── */
  --bg-base:#FFF4F7;
  --bg-surface:#ffffff;
  --bg-surface-alt:#FFF8FA;
  --bg-nav:rgba(255,255,255,0.85);
  --bg-nav-btn:rgba(255,240,245,0.35);
  --accent-dark:#FF6B95;
  --accent:#FF85A2;
  --accent-light:#FFB7C5;
  --accent-soft:#FFE8F0;
  --accent-softer:#FFF0F5;
  --accent-blush:#FFE0EC;
  --accent-border:#FFD6E0;
  --accent-heading:#E8779A;
  --accent-rgb:232,119,153;
  --accent-dark-rgb:255,107,149;
  --text-dark:#3D2C5E;
  --text-muted:#8B7DA0;
  --text-soft:#D4A0B0;
  --text-placeholder:#E8C4B8;
  --text-done:#C4B5D4;
  --text-streak:#FFB07C;
  --green-1:#6BAF8D;
  --green-2:#8FD4B4;
  --green-3:#A0C8B0;
  --green-done-1:#8FD4B4;
  --green-done-2:#7CC4A0;
  --green-glow:rgba(107,175,141,0.35);
  --challenge-1:#FF9AA2;
  --challenge-2:#FFB7C5;
  --challenge-glow:rgba(255,154,162,0.35);
  --overlay-rgb:62,35,55;
  --gold:#FFD700;
  --sticker-bg-1:#FFF8FA;
  --sticker-bg-2:#FFE8F0;
  --sticker-green-1:#F0FFF4;
  --sticker-green-2:#E8FAF0;
  --sticker-purple-1:#FFF0F5;
  --sticker-purple-2:#F8E8FF;
  --sticker-neko-1:#FFF8FA;
  --sticker-neko-2:#F0E6FF;
  --cat-body:#ffffff;
  --cat-outline:#FFB7C5;
  --cat-blush:#FFE0EC;
  --cat-eyes:#3D2C5E;
  --cat-mouth:#FFB7C5;
  --cat-whiskers:#E8C4B8;
  --cat-ear-inner:#FFE0EC;
  --cat-tear:#8ED4F0;
  --lavender-btn-1:#FFB7C5;
  --lavender-btn-2:#CDB4DB;
  --accent-softer-rgb:255,240,245;
  --green-text-soft:#A0C8B0;
  /* ── legacy aliases ── */
  --pink-primary:var(--accent);
  --pink-blush:var(--accent-light);
  --lavender:#CDB4DB;
  --blue-soft:#BDE0FE;
  --green-soft:#A8E6CF;
  --warn-soft:#FFD6A5;
  --text-primary:var(--text-dark);
  --bg-warm:var(--bg-base);
  --white-soft:var(--bg-nav);
  --text-on-accent:#fff;
  --gold:#FFD700;
}
*{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{
  height:100%;margin:0;padding:0;
  background:var(--bg-base);
  overflow-x:hidden;
}
#root{
  width:100% !important;max-width:100% !important;
  border:none !important;text-align:left !important;
  display:block !important;
}
body{
  font-family:'Quicksand',sans-serif;
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
  overscroll-behavior:none;
  -webkit-tap-highlight-color:transparent;
}
.kw-body::-webkit-scrollbar{display:none;}
.kw-body{scrollbar-width:none;}
@supports(padding-bottom:env(safe-area-inset-bottom)){
  .kw-body{padding-bottom:calc(90px + env(safe-area-inset-bottom,0px)) !important;}
  .kw-nav{margin-bottom:calc(14px + env(safe-area-inset-bottom,0px)) !important;}
}

/* ── app shell ── */
.kw-app{
  max-width:420px;height:100vh;margin:0 auto;
  display:flex;flex-direction:column;position:relative;
  overflow:hidden;
}

/* ── header ── */
.kw-header{
  padding:24px 16px 12px;
  display:flex;align-items:center;justify-content:space-between;
  position:relative;
}
.kw-title{
  font-family:'Fredoka',sans-serif;
  font-size:28px;font-weight:700;
  color:var(--accent-heading);
  letter-spacing:.5px;
}
.kw-date{
  font-size:13px;color:var(--text-soft);font-weight:600;margin-top:2px;
}
.theme-picker{
  display:flex;gap:4px;align-items:center;
}
.theme-btn{
  background:var(--bg-card);border:2px solid var(--border-light);
  border-radius:var(--r-full);width:32px;height:32px;
  font-size:14px;cursor:pointer;transition:all .2s var(--ease-bounce);
  display:flex;align-items:center;justify-content:center;padding:0;
}
.theme-btn:hover{transform:scale(1.15);border-color:var(--accent);}
.theme-btn.active{
  border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-pale);
  transform:scale(1.1);
}
.cat-mascot{
  width:52px;height:52px;
  animation:catBounce 3s ease-in-out infinite;
  filter:drop-shadow(0 4px 8px rgba(var(--accent-rgb),0.2));
  transition:filter .5s ease;
}
@keyframes catBounce{
  0%,100%{transform:translateY(0) rotate(-3deg)}
  50%{transform:translateY(-8px) rotate(3deg)}
}

/* ── body ── */
.kw-body{
  flex:1;overflow-y:auto;padding:8px 16px 90px;
  -webkit-overflow-scrolling:touch;
  min-height:0;
}

/* ── tab content animation ── */
.tab-content{
  animation:fadeSlideIn .35s cubic-bezier(.16,1,.3,1) both;
}
@keyframes fadeSlideIn{
  from{opacity:0;transform:translateY(12px)}
  to{opacity:1;transform:translateY(0)}
}

/* ── bottom nav ── */
.kw-nav{
  position:fixed;bottom:0;
  left:0;right:0;
  width:calc(100% - 32px);max-width:388px;
  height:68px;
  background:var(--bg-nav);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  border-radius:var(--radius-nav);
  box-shadow:0 4px 28px rgba(var(--accent-rgb),0.15);
  padding:0 8px;
  display:flex;align-items:center;
  z-index:1000;
  margin:0 auto 14px;
  box-sizing:border-box;
  transition:transform .25s var(--ease-smooth), opacity .25s var(--ease-smooth);
}
.kw-nav button{
  flex:1 1 0%;border:none;
  background:var(--bg-nav-btn);
  min-width:0;width:0;overflow:hidden;
  height:52px;
  padding:0 4px;border-radius:22px;
  cursor:pointer;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:3px;
  font-family:'Quicksand',sans-serif;
  font-size:10px;font-weight:700;
  color:var(--text-placeholder);
  transition:background .3s cubic-bezier(.16,1,.3,1), color .3s;
  position:relative;
}
.kw-nav button.active{
  background:linear-gradient(135deg,var(--accent-softer),var(--accent-blush));
  color:var(--accent);
}
.kw-nav button .ico{
  font-size:22px;line-height:1;
  height:24px;display:flex;align-items:center;
}

/* ── cards ── */
.card{
  background:var(--bg-surface);
  border-radius:30px;
  padding:18px 16px;
  margin-bottom:14px;
  box-shadow:0 4px 24px rgba(var(--accent-rgb),0.10);
  transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s;
}
.card:hover{
  transform:translateY(-2px);
  box-shadow:0 8px 32px rgba(var(--accent-rgb),0.16);
}
.card-sm{
  background:var(--bg-surface);
  border-radius:26px;
  padding:14px 16px;
  margin-bottom:10px;
  box-shadow:0 3px 18px rgba(var(--accent-rgb),0.08);
  transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s;
}
.card-sm:hover{
  transform:translateY(-1px);
  box-shadow:0 6px 24px rgba(var(--accent-rgb),0.14);
}

/* ── sticker card (progress) ── */
.sticker-card{
  background:linear-gradient(145deg,var(--sticker-bg-1),var(--sticker-bg-2));
  border-radius:30px;
  padding:20px 16px;
  margin-bottom:16px;
  box-shadow:0 6px 28px rgba(var(--accent-rgb),0.14),inset 0 1px 0 rgba(255,255,255,0.8);
  position:relative;
  overflow:hidden;
}
.sticker-card::after{
  content:'';position:absolute;
  top:8px;left:18px;right:18px;height:30%;
  background:linear-gradient(180deg,rgba(255,255,255,0.5),transparent);
  border-radius:20px;pointer-events:none;
}
.sparkle{
  position:absolute;
  font-size:18px;
  animation:sparkleFloat 2.5s ease-in-out infinite;
}
@keyframes sparkleFloat{
  0%,100%{transform:translateY(0) scale(1);opacity:1}
  50%{transform:translateY(-10px) scale(1.2);opacity:.7}
}

/* ── progress bar ── */
.prog-bar{
  height:12px;
  background:var(--accent-soft);
  border-radius:12px;
  overflow:hidden;
  margin-top:10px;
}
.prog-fill{
  height:100%;border-radius:12px;
  transition:width .5s cubic-bezier(.16,1,.3,1);
  background:linear-gradient(90deg,var(--accent),var(--accent-light));
  box-shadow:0 2px 8px rgba(var(--accent-rgb),0.3);
}

/* ── habit row ── */
.habit-row{display:flex;align-items:center;gap:14px;}
.habit-check{
  width:42px;height:42px;
  border-radius:50%;border:3px solid var(--accent-border);
  cursor:pointer;font-size:18px;
  display:flex;align-items:center;justify-content:center;
  transition:all .3s cubic-bezier(.16,1,.3,1);
  flex-shrink:0;background:var(--bg-surface-alt);
}
.habit-check:hover{transform:scale(1.12);border-color:var(--accent-light);}
.habit-check.checked{
  border-color:transparent;
  animation:checkPop .4s cubic-bezier(.16,1,.3,1);
}
@keyframes checkPop{
  0%{transform:scale(0.8)}
  50%{transform:scale(1.2)}
  100%{transform:scale(1)}
}
.habit-info{flex:1;}
.habit-name{
  font-size:15px;font-weight:700;color:var(--text-dark);
  transition:opacity .3s;
}
.habit-name.done{opacity:.5;text-decoration:line-through;}
.habit-streak{
  font-size:12px;color:var(--text-streak);font-weight:700;margin-top:2px;
}

/* ── section ── */
.section-head{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:12px;margin-top:4px;
}
.section-title{
  font-family:'Fredoka',sans-serif;
  font-size:20px;font-weight:600;color:var(--accent-heading);
}

/* ── FAB ── */
.fab{
  width:54px;height:54px;
  border-radius:50%;border:none;
  background:linear-gradient(135deg,var(--accent-dark),var(--accent));
  color:var(--text-on-accent);font-size:28px;font-weight:300;
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 6px 28px rgba(var(--accent-dark-rgb),0.45);
  transition:all .3s cubic-bezier(.16,1,.3,1);
}
.fab:hover{
  transform:scale(1.12);
  box-shadow:0 8px 36px rgba(var(--accent-dark-rgb),0.55);
}
.fab:active{transform:scale(0.95);}

/* ── todo ── */
.todo-row{
  display:flex;align-items:center;gap:12px;
  padding:12px 0;
  border-bottom:1.5px solid rgba(255,244,247,0.6);
  transition:opacity .3s;
}
.todo-row:last-child{border:none;}
.todo-check{
  width:24px;height:24px;
  border-radius:50%;
  border:2.5px solid var(--accent-light);
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
  transition:all .3s cubic-bezier(.16,1,.3,1);
  background:var(--bg-surface-alt);
}
.todo-check:hover{transform:scale(1.15);border-color:var(--accent);}
.todo-check.done{
  background:linear-gradient(135deg,var(--green-done-1),var(--green-done-2));
  border-color:transparent;
  animation:checkPop .4s cubic-bezier(.16,1,.3,1);
}
.todo-name{flex:1;font-size:15px;font-weight:700;color:var(--text-dark);}
.todo-name.done{text-decoration:line-through;color:var(--text-done);opacity:.6;}
.todo-cat{
  font-size:10px;padding:3px 10px;border-radius:20px;
  background:var(--accent-soft);color:var(--accent-heading);font-weight:700;
}
.todo-delete{
  background:none;border:none;cursor:pointer;
  font-size:18px;color:var(--accent-light);
  transition:all .2s;
  opacity:.6;
}
.todo-delete:hover{opacity:1;transform:scale(1.2);color:var(--accent-dark);}

/* ── challenge ── */
.chal-card{
  border-radius:28px;padding:18px 16px;
  margin-bottom:14px;position:relative;overflow:hidden;
  box-shadow:0 4px 20px rgba(0,0,0,0.06);
  transition:transform .25s cubic-bezier(.16,1,.3,1);
}
.chal-card:hover{transform:translateY(-2px);}
.chal-title{
  font-family:'Fredoka',sans-serif;
  font-size:18px;font-weight:600;margin-bottom:2px;
}
.chal-sub{font-size:12px;opacity:.65;font-weight:600;}
.chal-btn{
  border:none;padding:8px 16px;border-radius:22px;
  cursor:pointer;font-family:'Quicksand',sans-serif;
  font-weight:700;font-size:13px;
  transition:all .3s cubic-bezier(.16,1,.3,1);
}
.chal-btn:hover{transform:scale(1.05);}
.chal-stat{text-align:center;}
.chal-stat-num{font-size:26px;font-weight:800;color:var(--text-dark);}
.chal-stat-label{font-size:11px;color:var(--text-muted);font-weight:700;}

/* ── ai / neko chat (self-contained layout) ── */
.neko-container{
  display:flex;flex-direction:column;
  height:100%;
  min-height:0;
}
.chat-scroll{
  flex:1;overflow-y:auto;
  -webkit-overflow-scrolling:touch;
  padding-bottom:8px;
}
.chat-wrap{
  display:flex;flex-direction:column;gap:12px;
}
.bubble{
  max-width:82%;padding:14px 18px;
  border-radius:22px;font-size:14px;
  line-height:1.6;font-weight:600;
  animation:bubblePop .3s cubic-bezier(.16,1,.3,1) both;
  white-space:pre-line;
}
@keyframes bubblePop{
  from{opacity:0;transform:scale(0.9) translateY(8px)}
  to{opacity:1;transform:scale(1) translateY(0)}
}
.bubble.user{
  align-self:flex-end;
  background:linear-gradient(135deg,var(--accent),var(--accent-light));
  color:var(--text-on-accent);border-bottom-right-radius:6px;
  box-shadow:0 3px 16px rgba(var(--accent-rgb),0.2);
}
.bubble.ai{
  align-self:flex-start;
  background:var(--bg-surface);color:var(--text-dark);
  box-shadow:0 3px 16px rgba(var(--accent-rgb),0.1);
  border-bottom-left-radius:6px;
}
.chat-input-bar{
  flex-shrink:0;
  padding:10px 0 0;
}
.chat-input-inner{
  display:flex;gap:10px;
  background:var(--bg-surface);border-radius:30px;
  padding:6px 6px 6px 18px;
  box-shadow:0 4px 20px rgba(var(--accent-rgb),0.12);
}
.chat-input-inner input{
  flex:1;border:none;outline:none;
  font-family:'Quicksand',sans-serif;
  font-size:14px;font-weight:600;color:var(--text-dark);
  background:none;
}
.chat-input-inner input::placeholder{color:var(--text-placeholder);}
.chat-send{
  width:40px;height:40px;border-radius:50%;border:none;
  background:linear-gradient(135deg,var(--accent-dark),var(--accent));
  cursor:pointer;font-size:16px;color:var(--text-on-accent);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 16px rgba(var(--accent-dark-rgb),0.35);
  transition:all .3s cubic-bezier(.16,1,.3,1);
}
.chat-send:hover{transform:scale(1.1);}
.chat-send:active{transform:scale(0.95);}

/* ── typing indicator ── */
.typing{display:flex;gap:5px;align-items:center;padding:8px 0;}
.dot{
  width:8px;height:8px;border-radius:50%;
  background:var(--accent-light);
  animation:dotBounce .6s ease infinite alternate;
}
.dot:nth-child(2){animation-delay:.15s;}
.dot:nth-child(3){animation-delay:.3s;}
@keyframes dotBounce{
  from{transform:translateY(0);opacity:.4}
  to{transform:translateY(-6px);opacity:1}
}

/* ── modal ── */
.modal-overlay{
  position:fixed;inset:0;
  background:rgba(var(--overlay-rgb),0.35);
  backdrop-filter:blur(4px);
  z-index:1500;display:flex;
  align-items:flex-end;justify-content:center;
  animation:overlayIn .2s ease;
}
@keyframes overlayIn{from{opacity:0}to{opacity:1}}
.modal{
  background:var(--bg-surface);border-radius:34px 34px 0 0;
  padding:28px 22px 30px;
  width:100%;max-width:420px;
  animation:modalSlideUp .35s cubic-bezier(.16,1,.3,1);
}
@keyframes modalSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.modal h3{
  font-family:'Fredoka',sans-serif;
  font-size:22px;font-weight:600;color:var(--accent-heading);
  margin-bottom:18px;
}
.modal input,.modal select{
  width:100%;
  border:2.5px solid var(--accent-blush);
  border-radius:18px;
  padding:12px 16px;
  font-family:'Quicksand',sans-serif;
  font-size:15px;font-weight:600;color:var(--text-dark);
  outline:none;margin-bottom:12px;
  background:var(--bg-surface-alt);
  transition:border-color .25s;
}
.modal input:focus,.modal select:focus{border-color:var(--accent);}
.modal input::placeholder{color:var(--text-placeholder);}
.emoji-grid{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:8px;}
.emoji-btn{
  width:40px;height:40px;border-radius:14px;
  border:2.5px solid var(--accent-blush);background:var(--bg-surface-alt);
  font-size:18px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:all .2s cubic-bezier(.16,1,.3,1);
}
.emoji-btn:hover{transform:scale(1.1);border-color:var(--accent-light);}
.emoji-btn.sel{border-color:var(--accent);background:var(--accent-soft);transform:scale(1.1);}
.custom-emoji-row{
  display:flex;gap:8px;align-items:center;margin-bottom:14px;
}
.custom-emoji-input{
  flex:1;
  border:2.5px dashed var(--accent-blush);border-radius:14px;
  padding:8px 14px;
  font-size:22px;text-align:center;
  font-family:'Quicksand',sans-serif;
  outline:none;background:var(--bg-surface-alt);
  transition:border-color .25s;
  width:60px;max-width:60px;
}
.custom-emoji-input:focus{border-color:var(--accent);}
.custom-emoji-hint{
  font-size:11px;color:var(--text-soft);font-weight:600;
  flex:1;
}
.color-grid{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;}
.color-dot{
  width:32px;height:32px;border-radius:50%;cursor:pointer;
  border:3.5px solid transparent;
  transition:all .2s cubic-bezier(.16,1,.3,1);
  box-shadow:0 2px 8px rgba(0,0,0,0.08);
}
.color-dot:hover{transform:scale(1.15);}
.color-dot.sel{border-color:var(--text-dark);transform:scale(1.15);}
.btn-pri{
  width:100%;padding:14px;
  border-radius:22px;border:none;
  background:linear-gradient(135deg,var(--accent-dark),var(--accent));
  color:var(--text-on-accent);
  font-family:'Fredoka',sans-serif;
  font-size:18px;font-weight:600;
  cursor:pointer;letter-spacing:.5px;
  box-shadow:0 6px 24px rgba(var(--accent-dark-rgb),0.35);
  transition:all .3s cubic-bezier(.16,1,.3,1);
}
.btn-pri:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(var(--accent-dark-rgb),0.45);}
.btn-pri:active{transform:translateY(0);}
.label-text{
  font-size:13px;font-weight:700;color:var(--text-soft);margin-bottom:8px;
}

/* ── empty state ── */
.empty-state{
  text-align:center;padding:32px 0;
  color:var(--text-placeholder);font-size:15px;font-weight:700;
}

/* ── Neko world section ── */
.neko-world{
  border-radius:30px;
  padding:24px 16px 18px;
  margin-bottom:16px;
  text-align:center;
  position:relative;
  background:var(--bg-surface-alt);
  box-shadow:0 6px 28px rgba(var(--accent-rgb),0.10);
  overflow:hidden;
}
.neko-world-inner{
  display:flex;flex-direction:column;
  align-items:center;gap:8px;
  position:relative;z-index:1;
}
.neko-speech{margin-top:6px;}
.speech-bubble{
  background:var(--bg-surface);
  border-radius:20px;
  padding:10px 18px;
  font-size:13px;font-weight:600;color:var(--text-dark);
  max-width:260px;margin:0 auto;
  box-shadow:0 2px 12px rgba(var(--accent-rgb),0.1);
  position:relative;line-height:1.5;
  animation:fadeSlideIn .5s cubic-bezier(.16,1,.3,1) both;
}
.speech-bubble::before{
  content:'';position:absolute;
  top:-5px;left:50%;
  width:10px;height:10px;
  background:var(--bg-surface);border-radius:2px;
  transform:translateX(-50%) rotate(45deg);
  box-shadow:-1px -1px 3px rgba(var(--accent-rgb),0.05);
}
.world-status{
  display:flex;align-items:center;
  justify-content:center;gap:20px;
  margin-top:14px;position:relative;z-index:1;
}
.world-status-item{
  display:flex;flex-direction:column;align-items:center;
}
.world-stat-num{
  font-family:'Fredoka',sans-serif;
  font-size:22px;font-weight:700;color:var(--accent-heading);
}
.world-stat-label{
  font-size:11px;color:var(--text-soft);font-weight:600;
}
.world-status-divider{
  width:1.5px;height:28px;
  background:var(--accent-blush);border-radius:1px;
}

/* ── streak visual dots ── */
.streak-visual{
  display:flex;align-items:center;gap:4px;margin-top:4px;
}
.streak-dot{
  width:7px;height:7px;
  border-radius:50%;display:inline-block;
  animation:streakPulse 2s ease-in-out infinite;
}
@keyframes streakPulse{
  0%,100%{transform:scale(1);opacity:0.6}
  50%{transform:scale(1.25);opacity:1}
}
.streak-plus{
  font-size:10px;font-weight:700;color:var(--text-soft);margin-left:2px;
}

/* (mood glow transition for cat-mascot is in main .cat-mascot rule) */

/* ── floating world particles ── */
.world-particles{
  position:absolute;inset:0;
  pointer-events:none;overflow:hidden;
  z-index:0;
}
.world-particle{
  position:absolute;
  font-size:14px;
  opacity:0;
  animation:particleDrift 4s ease-in-out infinite;
}
@keyframes particleDrift{
  0%{opacity:0;transform:translateY(20px) scale(0.6)}
  20%{opacity:.7}
  80%{opacity:.5}
  100%{opacity:0;transform:translateY(-60px) scale(1) rotate(25deg)}
}

/* ── micro-burst on task complete ── */
.burst-container{
  position:absolute;pointer-events:none;
  top:50%;left:50%;z-index:10;
}
.burst-particle{
  position:absolute;
  font-size:16px;
  animation:burstOut .6s cubic-bezier(.16,1,.3,1) forwards;
}
@keyframes burstOut{
  0%{opacity:1;transform:translate(0,0) scale(1)}
  100%{opacity:0;transform:translate(var(--bx),var(--by)) scale(0.3)}
}

/* ── neko reaction hop ── */
@keyframes nekoHop{
  0%{transform:translateY(0)}
  30%{transform:translateY(-14px) scale(1.06)}
  50%{transform:translateY(-8px)}
  100%{transform:translateY(0) scale(1)}
}
.neko-hop{
  animation:nekoHop .5s cubic-bezier(.16,1,.3,1);
}

/* ── anticipation strip ── */
.anticipation-strip{
  margin-top:16px;margin-bottom:6px;
  padding:14px 16px;
  border-radius:22px;
  background:linear-gradient(135deg,rgba(var(--accent-softer-rgb),0.8),rgba(243,229,245,0.6));
  box-shadow:0 2px 12px rgba(var(--accent-rgb),0.06);
  display:flex;align-items:center;gap:12px;
  animation:fadeSlideIn .5s cubic-bezier(.16,1,.3,1) both;
}
.anticipation-icon{
  font-size:24px;
  filter:blur(1.5px);
  animation:sparkleFloat 3s ease-in-out infinite;
}
.anticipation-text{
  font-size:13px;font-weight:600;color:var(--text-soft);
  line-height:1.4;
}

/* ── environment shelf (ownership objects) ── */
.env-shelf{
  display:flex;justify-content:center;gap:16px;
  margin-bottom:10px;position:relative;z-index:1;
}
.env-obj{
  display:flex;flex-direction:column;align-items:center;
  transition:opacity .8s ease, transform .5s ease;
}
.env-emoji{
  font-size:22px;
  animation:envBob 3s ease-in-out infinite;
}
.env-wilted .env-emoji{
  filter:grayscale(60%);
  animation:envWilt 4s ease-in-out infinite;
}
@keyframes envBob{
  0%,100%{transform:translateY(0)}
  50%{transform:translateY(-4px)}
}
@keyframes envWilt{
  0%,100%{transform:translateY(0) rotate(0deg)}
  50%{transform:translateY(2px) rotate(-5deg)}
}

/* ── env reveal animation ── */
.env-reveal .env-emoji{
  animation:envRevealPop .6s cubic-bezier(.16,1,.3,1) !important;
}
@keyframes envRevealPop{
  0%{transform:scale(1)}
  30%{transform:scale(1.5)}
  50%{transform:scale(1.35)}
  100%{transform:scale(1)}
}

/* ── reveal toast ── */
.reveal-toast{
  display:flex;align-items:center;gap:10px;
  justify-content:center;
  margin-top:8px;padding:10px 16px;
  background:rgba(255,255,255,0.85);
  border-radius:20px;
  box-shadow:0 4px 20px rgba(255,215,0,0.15);
  animation:revealSlide .5s cubic-bezier(.16,1,.3,1) both;
  position:relative;z-index:2;
}
.reveal-emoji{
  font-size:24px;
  animation:envRevealPop .6s cubic-bezier(.16,1,.3,1);
}
.reveal-msg{
  font-size:13px;font-weight:700;color:var(--accent-heading);
}
@keyframes revealSlide{
  from{opacity:0;transform:translateY(8px) scale(0.95)}
  to{opacity:1;transform:translateY(0) scale(1)}
}

/* ── milestone toast ── */
.milestone-toast{
  display:flex;align-items:center;gap:12px;
  justify-content:center;
  margin-top:8px;padding:14px 18px;
  background:linear-gradient(135deg,rgba(255,240,245,0.95),rgba(255,215,0,0.08));
  border-radius:22px;border:1.5px solid rgba(255,215,0,0.2);
  box-shadow:0 6px 28px rgba(255,215,0,0.12);
  animation:milestoneIn .6s cubic-bezier(.16,1,.3,1) both;
  position:relative;z-index:2;
}
.milestone-emoji{
  font-size:28px;
  animation:envRevealPop .8s cubic-bezier(.16,1,.3,1);
}
.milestone-msg{
  font-size:13px;font-weight:700;color:var(--text-dark);
  line-height:1.4;
}
@keyframes milestoneIn{
  from{opacity:0;transform:translateY(10px) scale(0.9)}
  to{opacity:1;transform:translateY(0) scale(1)}
}

/* ── memory drop toast ── */
.memory-toast{
  display:flex;align-items:center;gap:10px;
  justify-content:center;
  margin-top:8px;padding:12px 16px;
  background:linear-gradient(135deg,rgba(205,180,219,0.15),rgba(189,224,254,0.12));
  border-radius:var(--radius-lg);border:1.5px solid rgba(205,180,219,0.25);
  box-shadow:0 4px 20px rgba(205,180,219,0.1);
  animation:milestoneIn .6s cubic-bezier(.16,1,.3,1) both;
  position:relative;z-index:2;
}

/* ── next unlock preview ── */
.next-unlock{
  display:flex;align-items:center;gap:10px;
  justify-content:center;
  margin-top:10px;padding:6px 0;
  position:relative;z-index:1;
}
.next-unlock-emoji{
  font-size:18px;
  filter:blur(2px);
  opacity:0.5;
  animation:unlockWiggle 2.5s ease-in-out infinite;
}
.next-unlock-text{
  font-size:12px;font-weight:600;color:var(--text-soft);
}
@keyframes unlockWiggle{
  0%,100%{transform:rotate(0deg)}
  25%{transform:rotate(-6deg)}
  75%{transform:rotate(6deg)}
}

/* ── onboarding flow ── */
.onboard-overlay{
  position:fixed;inset:0;z-index:3000;
  background:linear-gradient(180deg,var(--bg-surface-alt) 0%,var(--accent-soft) 50%,var(--accent-softer) 100%);
  display:flex;align-items:center;justify-content:center;
}
.onboard-content{
  text-align:center;padding:32px 24px;
  opacity:0;transform:translateY(16px);
  transition:opacity .4s ease,transform .4s ease;
}
.onboard-content.onboard-visible{
  opacity:1;transform:translateY(0);
}
.onboard-screen{
  display:flex;flex-direction:column;align-items:center;gap:12px;
}
.onboard-neko{
  margin-bottom:16px;
}
.onboard-text{
  font-family:'Fredoka',sans-serif;
  font-size:26px;font-weight:700;
  color:var(--accent-heading);line-height:1.3;
}
.onboard-subtext{
  font-family:'Quicksand',sans-serif;
  font-size:15px;font-weight:600;
  color:var(--text-soft);line-height:1.5;
  margin-bottom:8px;
}
.onboard-input{
  width:200px;padding:12px 16px;
  border:2px solid var(--accent-border);
  border-radius:20px;
  background:var(--bg-surface);
  font-family:'Quicksand',sans-serif;
  font-size:16px;font-weight:600;
  color:var(--accent-heading);text-align:center;
  outline:none;
  transition:border-color .3s ease;
}
.onboard-input:focus{
  border-color:var(--accent);
}
.onboard-input::placeholder{
  color:var(--text-placeholder);font-weight:500;
}
.onboard-btn{
  padding:12px 28px;
  border:none;border-radius:20px;
  background:linear-gradient(135deg,var(--accent),var(--accent-light));
  color:var(--text-on-accent);
  font-family:'Fredoka',sans-serif;
  font-size:16px;font-weight:700;
  cursor:pointer;
  transition:transform .2s ease,box-shadow .2s ease;
  box-shadow:0 4px 16px rgba(var(--accent-rgb),0.3);
}
.onboard-btn:hover{
  transform:translateY(-2px);
  box-shadow:0 6px 24px rgba(var(--accent-rgb),0.4);
}
.onboard-btn:active{
  transform:translateY(0);
}
.onboard-btn:disabled{
  opacity:0.4;cursor:default;
  transform:none;
}
.onboard-btn.onboard-skip{
  background:transparent;
  color:var(--text-soft);
  box-shadow:none;
  font-size:14px;
}
.onboard-btn.onboard-skip:hover{
  box-shadow:none;
  color:var(--accent-heading);
}

/* ── post-onboard soft entry ── */
.post-onboard .kw-body{
  animation:softEntry .8s ease both;
}
@keyframes softEntry{
  from{opacity:0;transform:translateY(20px)}
  to{opacity:1;transform:translateY(0)}
}
.post-onboard-bridge{
  text-align:center;
  padding:18px 16px 6px;
  font-family:'Quicksand',sans-serif;
  font-size:14px;font-weight:700;
  color:var(--text-soft);
  animation:bridgeFade 3s ease both;
}
@keyframes bridgeFade{
  0%{opacity:0;transform:translateY(8px)}
  20%{opacity:1;transform:translateY(0)}
  80%{opacity:1}
  100%{opacity:0}
}

/* ── return overlay ── */
.return-overlay{
  position:fixed;inset:0;z-index:2000;
  background:rgba(var(--overlay-rgb),0.55);
  backdrop-filter:blur(8px);
  display:flex;align-items:center;justify-content:center;
  animation:overlayIn .4s ease both;
  cursor:pointer;
}
.return-card{
  background:var(--bg-surface);border-radius:32px;
  padding:40px 32px;max-width:320px;width:90%;
  text-align:center;
  box-shadow:0 20px 60px rgba(var(--accent-rgb),0.25);
  animation:modalSlideUp .5s cubic-bezier(.16,1,.3,1) both;
}
.return-title{
  font-family:'Fredoka',sans-serif;
  font-size:20px;font-weight:700;color:var(--accent-heading);
  margin-bottom:8px;line-height:1.4;
}
.return-subtitle{
  font-size:14px;font-weight:600;color:var(--text-soft);
  line-height:1.5;margin-bottom:16px;
}
.return-hint{
  font-size:12px;color:var(--text-placeholder);font-weight:600;
  animation:hintPulse 2s ease-in-out infinite;
}
@keyframes hintPulse{
  0%,100%{opacity:.4}
  50%{opacity:1}
}

/* ── background pulse on task complete ── */
@keyframes appPulse{
  0%{box-shadow:inset 0 0 0 rgba(var(--accent-rgb),0)}
  40%{box-shadow:inset 0 0 80px rgba(var(--accent-rgb),0.08)}
  100%{box-shadow:inset 0 0 0 rgba(var(--accent-rgb),0)}
}
.app-pulse{
  animation:appPulse .6s cubic-bezier(.16,1,.3,1);
}

/* ── silence design (sad/lonely) ── */
.world-silent .world-particle{
  animation-duration:7s !important;
  opacity:0.3 !important;
}
.world-silent .cat-mascot{
  animation-duration:6s !important;
}
.speech-silent{
  opacity:0.7;
  animation-delay:1.5s !important;
  animation-duration:1s !important;
}
.world-silent .env-shelf{
  opacity:0.5;
}

/* ── full reveal system (100% completion) ── */
.reveal-overlay{
  position:fixed;inset:0;z-index:1800;
  background:rgba(var(--overlay-rgb),0);
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  pointer-events:none;
  transition:background 1s var(--ease-smooth);
}
.reveal-overlay.active{
  background:rgba(var(--overlay-rgb),0.45);
  pointer-events:auto;
}
.reveal-stage{
  opacity:0;transform:translateY(20px) scale(0.9);
  transition:opacity .6s var(--ease-spring), transform .6s var(--ease-spring);
}
.reveal-stage.visible{
  opacity:1;transform:translateY(0) scale(1);
}
.reveal-neko{
  margin-bottom:16px;
  animation:revealBounce 1.2s var(--ease-spring) infinite;
}
@keyframes revealBounce{
  0%,100%{transform:translateY(0) scale(1)}
  30%{transform:translateY(-18px) scale(1.08)}
  60%{transform:translateY(-6px) scale(1.02)}
}
.reveal-env-row{
  display:flex;gap:18px;margin-bottom:20px;
}
.reveal-env-item{
  font-size:32px;
  opacity:0;transform:scale(0);
  animation:revealGrow .5s var(--ease-spring) forwards;
}
@keyframes revealGrow{
  0%{opacity:0;transform:scale(0) rotate(-10deg)}
  60%{transform:scale(1.3) rotate(5deg)}
  100%{opacity:1;transform:scale(1) rotate(0deg)}
}
.reveal-text{
  text-align:center;max-width:280px;
  opacity:0;transform:translateY(12px);
  animation:revealTextIn .8s var(--ease-spring) forwards;
}
@keyframes revealTextIn{
  from{opacity:0;transform:translateY(12px)}
  to{opacity:1;transform:translateY(0)}
}
.reveal-title{
  font-family:'Fredoka',sans-serif;
  font-size:22px;font-weight:700;color:var(--text-on-accent);
  margin-bottom:8px;text-shadow:0 2px 12px rgba(0,0,0,0.2);
}
.reveal-subtitle{
  font-size:14px;font-weight:600;color:rgba(255,255,255,0.85);
  line-height:1.5;
}
.reveal-sparkles{
  position:absolute;inset:0;pointer-events:none;overflow:hidden;
}
.reveal-sparkle{
  position:absolute;font-size:18px;
  opacity:0;
  animation:revealSparkleFloat 2s ease-in-out infinite;
}
@keyframes revealSparkleFloat{
  0%{opacity:0;transform:translateY(30px) scale(0.5)}
  30%{opacity:1}
  70%{opacity:0.6}
  100%{opacity:0;transform:translateY(-80px) scale(1.2) rotate(20deg)}
}
.reveal-dismiss{
  font-size:12px;color:rgba(255,255,255,0.5);
  font-weight:600;margin-top:24px;
  animation:hintPulse 2s ease-in-out infinite;
}

/* ── Neko breathing (idle pulse) ── */
@keyframes nekoBreathe{
  0%,100%{transform:scale(1)}
  50%{transform:scale(1.03)}
}
.neko-breathe{
  animation:nekoBreathe 3.5s ease-in-out infinite;
}

/* ── checkbox micro-interaction ── */
.habit-check{
  transition:all .3s var(--ease-spring) !important;
}
.habit-check:active{
  transform:scale(0.85) !important;
}
.todo-check{
  transition:all .3s var(--ease-spring) !important;
}
.todo-check:active{
  transform:scale(0.85) !important;
}

/* ── quick action chips (Neko tab) ── */
.quick-actions{
  display:flex;gap:8px;flex-wrap:wrap;
  margin-bottom:10px;
}
.quick-chip{
  padding:8px 14px;
  border-radius:20px;border:2px solid var(--accent-blush);
  background:var(--bg-surface-alt);cursor:pointer;
  font-family:'Quicksand',sans-serif;
  font-size:12px;font-weight:700;color:var(--accent-heading);
  transition:all .25s var(--ease-spring);
}
.quick-chip:hover{
  background:var(--accent-soft);transform:scale(1.05);
  border-color:var(--accent-light);
}
.quick-chip:active{transform:scale(0.95);}

/* ── relationship level badge ── */
.rel-badge{
  display:inline-flex;align-items:center;gap:var(--space-xs);
  padding:4px 12px;
  border-radius:20px;
  background:rgba(255,255,255,0.6);
  backdrop-filter:blur(6px);
  font-size:11px;font-weight:700;color:var(--text-soft);
  margin-top:var(--space-xs);
  animation:fadeSlideIn .5s var(--ease-spring) both;
}
.rel-badge .rel-fill{
  height:3px;width:48px;
  border-radius:3px;
  background:rgba(255,143,171,0.2);
  overflow:hidden;
}
.rel-badge .rel-fill-inner{
  height:100%;border-radius:3px;
  background:linear-gradient(90deg,var(--pink-primary),var(--gold));
  transition:width .8s var(--ease-spring);
}

/* ── world name display ── */
.world-name{
  font-family:'Fredoka',sans-serif;
  font-size:14px;font-weight:600;
  color:var(--text-soft);
  text-align:center;
  margin-bottom:var(--space-sm);
  opacity:0.85;
  animation:fadeSlideIn .6s var(--ease-spring) both;
}

/* ── world name modal ── */
.world-name-prompt{
  text-align:center;
  padding:var(--space-xl) var(--space-lg);
}
.world-name-prompt input{
  text-align:center;
  font-family:'Fredoka',sans-serif;
  font-size:18px;
  border:2.5px dashed var(--pink-blush);
  border-radius:var(--radius-lg);
  padding:var(--space-sm) var(--space-md);
  background:rgba(255,255,255,0.5);
  color:var(--text-primary);
  outline:none;
  width:80%;
  transition:border-color .25s;
}
.world-name-prompt input:focus{
  border-color:var(--pink-primary);
  border-style:solid;
}

/* ── memory drops ── */
.memory-strip{
  margin-top:var(--space-md);
  padding:var(--space-sm) var(--space-md);
  background:rgba(255,255,255,0.5);
  backdrop-filter:blur(6px);
  border-radius:var(--radius-lg);
  animation:fadeSlideIn .5s var(--ease-spring) both;
}
.memory-item{
  display:flex;align-items:center;gap:var(--space-sm);
  padding:var(--space-xs) 0;
  font-size:12px;font-weight:600;color:var(--text-soft);
  line-height:1.4;
}
.memory-emoji{font-size:16px;}
.memory-date{
  font-size:10px;opacity:0.6;
  margin-left:auto;white-space:nowrap;
}

/* ── anticipation tease bar (visual upgrade) ── */
.ant-tease{
  display:flex;align-items:center;gap:var(--space-sm);
  margin-top:var(--space-sm);
  position:relative;
}
.ant-tease-preview{
  font-size:22px;
  filter:blur(2.5px);
  opacity:0.4;
  animation:nekoBreathe 3s ease-in-out infinite;
}
.ant-tease-bar{
  flex:1;height:6px;
  border-radius:6px;
  background:rgba(255,143,171,0.12);
  overflow:hidden;
}
.ant-tease-fill{
  height:100%;border-radius:6px;
  background:linear-gradient(90deg,var(--pink-blush),var(--pink-primary));
  transition:width .6s var(--ease-spring);
}
.ant-tease-label{
  font-size:11px;font-weight:700;color:var(--text-soft);
  white-space:nowrap;
}

/* ── memory tier visual styles ── */
.memory-tier-common{
  opacity:0.85;
}
.memory-tier-rare{
  border-left:2px solid var(--pink-blush);
  padding-left:var(--space-sm);
  background:rgba(255,194,209,0.06);
}
.memory-tier-epic{
  border-left:2px solid var(--lavender);
  padding-left:var(--space-sm);
  background:rgba(205,180,219,0.08);
  animation:epicGlow 3s ease-in-out infinite;
}
.memory-tier-legendary{
  border-left:2px solid var(--gold);
  padding-left:var(--space-sm);
  background:linear-gradient(135deg,rgba(255,215,0,0.06),rgba(255,143,171,0.04));
  animation:legendaryShine 2.5s ease-in-out infinite;
  box-shadow:0 0 12px rgba(255,215,0,0.08);
}
@keyframes epicGlow{
  0%,100%{box-shadow:0 0 0 rgba(205,180,219,0)}
  50%{box-shadow:0 0 12px rgba(205,180,219,0.15)}
}
@keyframes legendaryShine{
  0%,100%{box-shadow:0 0 8px rgba(255,215,0,0.08)}
  50%{box-shadow:0 0 20px rgba(255,215,0,0.2)}
}

/* ── memory toast tier overrides ── */
.memory-toast.memory-tier-epic{
  border-color:var(--lavender);
  background:linear-gradient(135deg,rgba(205,180,219,0.2),rgba(189,224,254,0.15));
}
.memory-toast.memory-tier-legendary{
  border-color:rgba(255,215,0,0.3);
  background:linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,143,171,0.08));
  box-shadow:0 6px 28px rgba(255,215,0,0.12);
}

/* ── Neko nudge (initiation bubble) ── */
.neko-nudge{
  background:linear-gradient(135deg,var(--accent-softer),var(--accent-soft)) !important;
  border:1.5px solid rgba(var(--accent-rgb),0.2);
  animation:nudgePop .5s var(--ease-spring) both !important;
}
@keyframes nudgePop{
  0%{opacity:0;transform:scale(0.85) translateY(6px)}
  60%{transform:scale(1.04) translateY(-2px)}
  100%{opacity:1;transform:scale(1) translateY(0)}
}

/* ── soft monetization teaser ── */
.locked-tease{
  display:flex;align-items:center;gap:var(--space-sm);
  margin-top:var(--space-sm);
  padding:var(--space-sm) var(--space-md);
  border-radius:var(--radius-md);
  background:rgba(205,180,219,0.06);
  border:1.5px dashed rgba(205,180,219,0.2);
  cursor:default;
}
.locked-tease-emoji{
  font-size:18px;
  filter:blur(3px) grayscale(40%);
  opacity:0.4;
}
.locked-tease-text{
  font-size:11px;font-weight:600;color:var(--text-muted);
  font-style:italic;
}

/* ── prefers-reduced-motion ── */
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:0.01ms !important;
    animation-iteration-count:1 !important;
    transition-duration:0.01ms !important;
  }
}
`;

/* ─── Cat Mascot SVG (mood-aware) ────────────────────────── */
function CatMascot({ mood = 'content', size = 52 }) {
  const m = NEKO_MOODS[mood] || NEKO_MOODS.content;

  let eyes;
  switch(m.eyes) {
    case 'star':
      eyes = <>
        <text x="32" y="43" fontSize="8" textAnchor="middle" fill="var(--gold)">★</text>
        <text x="48" y="43" fontSize="8" textAnchor="middle" fill="var(--gold)">★</text>
      </>;
      break;
    case 'sparkle':
      eyes = <>
        <circle cx="32" cy="40" r="3.5" fill="var(--cat-eyes)"/>
        <circle cx="48" cy="40" r="3.5" fill="var(--cat-eyes)"/>
        <circle cx="33.5" cy="38.5" r="1.8" fill="var(--cat-body)"/>
        <circle cx="49.5" cy="38.5" r="1.8" fill="var(--cat-body)"/>
      </>;
      break;
    case 'closed':
      eyes = <>
        <path d="M28 40 Q32 43 36 40" stroke="var(--cat-eyes)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M44 40 Q48 43 52 40" stroke="var(--cat-eyes)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </>;
      break;
    case 'teary':
      eyes = <>
        <circle cx="32" cy="41" r="3.5" fill="var(--cat-eyes)"/>
        <circle cx="48" cy="41" r="3.5" fill="var(--cat-eyes)"/>
        <circle cx="33.5" cy="39.5" r="1.2" fill="var(--cat-body)"/>
        <circle cx="49.5" cy="39.5" r="1.2" fill="var(--cat-body)"/>
        <ellipse cx="35" cy="48" rx="2" ry="1.5" fill="var(--cat-tear)" opacity=".6"/>
      </>;
      break;
    default:
      eyes = <>
        <circle cx="32" cy="40" r="3.5" fill="var(--cat-eyes)"/>
        <circle cx="48" cy="40" r="3.5" fill="var(--cat-eyes)"/>
        <circle cx="33.5" cy="38.5" r="1.2" fill="var(--cat-body)"/>
        <circle cx="49.5" cy="38.5" r="1.2" fill="var(--cat-body)"/>
      </>;
  }

  let mouth;
  switch(m.mouth) {
    case 'big-smile':
      mouth = <path d="M34 49 Q40 56 46 49" stroke="var(--cat-mouth)" strokeWidth="2" fill="none" strokeLinecap="round"/>;
      break;
    case 'yawn':
      mouth = <ellipse cx="40" cy="50" rx="3" ry="4" fill="var(--cat-mouth)" opacity=".5"/>;
      break;
    case 'pout':
      mouth = <path d="M37 51 Q40 48 43 51" stroke="var(--cat-mouth)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>;
      break;
    default:
      mouth = <>
        <ellipse cx="40" cy="47" rx="2" ry="1.5" fill="var(--cat-mouth)"/>
        <path d="M36 50 Q40 54 44 50" stroke="var(--cat-mouth)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </>;
  }

  return (
    <svg className="cat-mascot" viewBox="0 0 80 80" fill="none" style={{width:size,height:size,filter:`drop-shadow(0 4px 12px ${m.glow})`}}>
      <circle cx="40" cy="42" r="32" fill={m.glow} opacity=".35"/>
      {/* ears */}
      <path d="M18 28 L10 8 L30 22Z" fill="var(--cat-body)" stroke="var(--cat-outline)" strokeWidth="2"/>
      <path d="M62 28 L70 8 L50 22Z" fill="var(--cat-body)" stroke="var(--cat-outline)" strokeWidth="2"/>
      <path d="M20 26 L14 12 L28 22Z" fill="var(--cat-ear-inner)"/>
      <path d="M60 26 L66 12 L52 22Z" fill="var(--cat-ear-inner)"/>
      {/* head */}
      <circle cx="40" cy="42" r="26" fill="var(--cat-body)" stroke="var(--cat-outline)" strokeWidth="2.5"/>
      {/* blush */}
      <circle cx="22" cy="48" r="6" fill="var(--cat-blush)" opacity={m.blush}/>
      <circle cx="58" cy="48" r="6" fill="var(--cat-blush)" opacity={m.blush}/>
      {/* eyes */}
      {eyes}
      {/* nose & mouth */}
      {mouth}
      {/* whiskers */}
      <line x1="8" y1="42" x2="26" y2="44" stroke="var(--cat-whiskers)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="8" y1="48" x2="26" y2="48" stroke="var(--cat-whiskers)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="54" y1="44" x2="72" y2="42" stroke="var(--cat-whiskers)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="54" y1="48" x2="72" y2="48" stroke="var(--cat-whiskers)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── Onboarding Flow ─────────────────────────────────────── */
function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [fadeIn, setFadeIn] = useState(false); // start hidden for initial delay
  const [nameInput, setNameInput] = useState('');
  const [showContent, setShowContent] = useState(false);

  // Delay before first text appears — gives illusion Neko noticed you
  useEffect(() => {
    const t = setTimeout(() => { setShowContent(true); setFadeIn(true); }, 450);
    return () => clearTimeout(t);
  }, []);

  function nextStep() {
    setFadeIn(false);
    setTimeout(() => { setStep(s => s + 1); setFadeIn(true); }, 400);
  }

  function finishOnboarding() {
    if (nameInput.trim()) {
      const name = nameInput.trim().charAt(0).toUpperCase() + nameInput.trim().slice(1);
      nekoMemory.userName = name;
      saveNekoMemory();
    }
    setFadeIn(false);
    setTimeout(() => {
      saveState(STORAGE_KEYS.onboarded, true);
      onComplete();
    }, 400);
  }

  // Randomized text variants — prevents scripted feel
  const hookVariants = [
    "I've been waiting for someone like you…",
    "You finally came…",
    "I was hoping you'd find me…",
  ];
  const hookText = hookVariants[Math.floor(Date.now() / 86400000) % hookVariants.length];

  const steps = [
    // Step 0: Neko appears — minimal, just presence
    <div className="onboard-screen" key={0}>
      <div className="onboard-neko neko-breathe">
        <CatMascot mood="content" size={100} />
      </div>
      <div className="onboard-text">Oh…</div>
      <div className="onboard-subtext">someone's here.</div>
      <button className="onboard-btn" onClick={nextStep}>…hello? 🐱</button>
    </div>,
    // Step 1: Emotional hook — randomized
    <div className="onboard-screen" key={1}>
      <div className="onboard-neko neko-breathe">
        <CatMascot mood="happy" size={100} />
      </div>
      <div className="onboard-text">{hookText}</div>
      <div className="onboard-subtext">
        I'm Neko. I live in a little world that grows<br/>
        when you take care of yourself. 🌸
      </div>
      <button className="onboard-btn" onClick={nextStep}>That sounds nice~ ✨</button>
    </div>,
    // Step 2: Name prompt — optional, low friction
    <div className="onboard-screen" key={2}>
      <div className="onboard-neko neko-breathe">
        <CatMascot mood="happy" size={100} />
      </div>
      <div className="onboard-text">What should I call you?</div>
      <div className="onboard-subtext">
        You don't have to tell me… but I'd like to remember you 💕
      </div>
      <input
        className="onboard-input"
        placeholder="Your name~"
        value={nameInput}
        onChange={e => setNameInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && nextStep()}
        autoFocus
      />
      <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:8}}>
        <button className="onboard-btn onboard-skip" onClick={nextStep}>Maybe later</button>
        <button className="onboard-btn" onClick={nextStep} disabled={!nameInput.trim()}>That's me! 🌸</button>
      </div>
    </div>,
    // Step 3: Soft reveal — bridge to app
    <div className="onboard-screen" key={3}>
      <div className="onboard-neko neko-breathe">
        <CatMascot mood="blissful" size={100} />
      </div>
      <div className="onboard-text">
        {nameInput.trim() ? `${nameInput.trim()}~ welcome home 💖` : 'Welcome home~ 💖'}
      </div>
      <div className="onboard-subtext">
        Let's take care of something small together…
      </div>
      <button className="onboard-btn" onClick={finishOnboarding}>I'm ready~ 🌸</button>
    </div>,
  ];

  return (
    <div className="onboard-overlay">
      {showContent && (
        <div className={`onboard-content${fadeIn ? ' onboard-visible' : ''}`}>
          {steps[step]}
        </div>
      )}
    </div>
  );
}

/* ─── Main App ────────────────────────────────────────────── */
export default function App() {
  const [tab, setTab] = useState("home");
  const [habits, setHabits] = useState(() => loadState(STORAGE_KEYS.habits, seedHabits));
  const [todos, setTodos] = useState(() => loadState(STORAGE_KEYS.todos, seedTodos));
  const [challenges, setChallenges] = useState(() => loadState(STORAGE_KEYS.challenges, seedChallenges));
  const [modal, setModal] = useState(null);
  const [tabKey, setTabKey] = useState(0);
  const [personality, setPersonality] = useState(() => loadPersonality());
  const [showReturnOverlay, setShowReturnOverlay] = useState(false);
  const [appPulse, setAppPulse] = useState(false);
  const [worldName, setWorldName] = useState(() => loadState(STORAGE_KEYS.worldName, ''));
  const [theme, setTheme] = useState(() => loadState(STORAGE_KEYS.theme, 'kawaii'));
  const [showOnboarding, setShowOnboarding] = useState(() => !loadState(STORAGE_KEYS.onboarded, false));
  const [postOnboard, setPostOnboard] = useState(false);
  const [nekoMessages, setNekoMessages] = useState(() => loadState(STORAGE_KEYS.nekoMessages, [
    {role:"assistant",content:"Nyaa~ I'm Neko-chan, your kawaii habit companion! 🐱🌸 Ask me to plan your day, motivate you, or check your progress! ✨\n\nTry telling me your name so I can remember you~ 💕"}
  ]));

  const missedDays = calcMissedDays();

  /* stamp last active on mount + track routine */
  useEffect(() => { touchLastActive(); trackOpenHour(); }, []);

  /* apply theme on change */
  useEffect(() => { applyTheme(theme); saveState(STORAGE_KEYS.theme, theme); }, [theme]);

  /* return overlay — show when user comes back after missed days */
  useEffect(() => {
    if (missedDays >= 1) {
      setShowReturnOverlay(true);
      if (missedDays >= 2) saveMemory('comeback', { days: missedDays });
      // relationship friction: higher bond = higher stakes
      setPersonality(prev => {
        const trustPenalty = prev.trust > 70 && missedDays > 1
          ? missedDays * 10  // sharper drop at high bond
          : missedDays * 5;
        const sadnessInc = prev.sadness > 60
          ? Math.floor(missedDays * 12 * 0.5) // sadness cap: halve rate when already high
          : missedDays * 12;
        const next = {
          ...prev,
          sadness: Math.min(100, prev.sadness + sadnessInc),
          trust: Math.max(0, prev.trust - trustPenalty),
        };
        savePersonality(next);
        return next;
      });
    }
  }, []); // only on mount

  /* persist to localStorage on every change */
  const habitsInitRef = useRef(true);
  useEffect(() => {
    // skip the initial mount — loading from localStorage isn't user activity
    if (habitsInitRef.current) {
      habitsInitRef.current = false;
      saveState(STORAGE_KEYS.habits, habits);
      return;
    }
    saveState(STORAGE_KEYS.habits, habits);
    touchLastActive();
    // boost trust + reduce sadness on activity
    setPersonality(prev => {
      const next = {
        ...prev,
        trust: Math.min(100, prev.trust + 2),
        sadness: Math.max(0, prev.sadness - 3),
        totalDaysActive: prev.lastTrustUpdate !== today()
          ? prev.totalDaysActive + 1
          : prev.totalDaysActive,
        lastTrustUpdate: today(),
      };
      savePersonality(next);
      return next;
    });
  }, [habits]);
  useEffect(() => { saveState(STORAGE_KEYS.todos, todos); }, [todos]);
  useEffect(() => { saveState(STORAGE_KEYS.challenges, challenges); }, [challenges]);
  useEffect(() => { saveState(STORAGE_KEYS.nekoMessages, nekoMessages.slice(-50)); }, [nekoMessages]);

  /* dialogue rotation timer — re-render with jitter so bubble updates */
  const [, setDialogueTick] = useState(0);
  useEffect(() => {
    const jitter = 42000 + Math.random() * 8000; // 42-50s
    const iv = setInterval(() => setDialogueTick(t => t + 1), jitter);
    return () => clearInterval(iv);
  }, []);

  const todayStr = today();
  const dow = new Date().toLocaleDateString("en-US",{weekday:"long"});
  const dateStr = new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});
  const mood = getNekoMood(habits, todayStr, missedDays);
  const timeOfDay = getTimeOfDay();

  /* sync body background to time gradient so no white shows outside app */
  useEffect(() => {
    document.body.style.background = TIME_GRADIENTS[timeOfDay];
    document.documentElement.style.background = TIME_GRADIENTS[timeOfDay];
  }, [timeOfDay]);

  function switchTab(t) {
    if (t !== tab) {
      setTab(t);
      setTabKey(k => k + 1);
    }
  }

  function triggerPulse() {
    setAppPulse(true);
    setTimeout(() => setAppPulse(false), 600);
  }

  function updateWorldName(name) {
    setWorldName(name);
    saveState(STORAGE_KEYS.worldName, name);
  }

  const NAV_ITEMS = [
    ["home","🏠","Home"],
    ["todo","✅","Tasks"],
    ["challenges","🌱","Growth"],
    ["ai","🐱","Neko"],
  ];

  return (
    <>
      <style>{STYLE}</style>
      {showOnboarding && <OnboardingFlow onComplete={() => { setShowOnboarding(false); setPostOnboard(true); setTimeout(() => setPostOnboard(false), 3000); }} />}
      <div className={`kw-app${appPulse ? ' app-pulse' : ''}${postOnboard ? ' post-onboard' : ''}`} style={{background: TIME_GRADIENTS[timeOfDay], display: showOnboarding ? 'none' : undefined}}>

        {/* post-onboarding bridge */}
        {postOnboard && (
          <div className="post-onboard-bridge">
            <span>Your world is waking up… 🌸</span>
          </div>
        )}

        {/* return overlay */}
        {showReturnOverlay && (
          <div className="return-overlay" onClick={() => setShowReturnOverlay(false)}>
            <div className="return-card">
              <div style={{fontSize:48,marginBottom:12}}>🐱</div>
              <div className="return-title">
                {missedDays >= 3
                  ? `You were gone for ${missedDays} days…`
                  : missedDays >= 2
                  ? "It's been a couple of days…"
                  : "You missed yesterday…"
                }
              </div>
              <div className="return-subtitle">
                {missedDays >= 3
                  ? "But I kept your spot warm 💕"
                  : missedDays >= 2
                  ? "I waited by the window for you~ 🌸"
                  : "But you're here now, and that's what matters 💖"
                }
              </div>
              <div className="return-hint">tap anywhere to continue~</div>
            </div>
          </div>
        )}

        {/* header */}
        <div className="kw-header">
          <div>
            <div className="kw-title">{worldName ? `✿ ${worldName}` : '✿ Kawaii Habits'}</div>
            <div className="kw-date">{dow}, {dateStr} 🌸</div>
          </div>
          <div className="theme-picker">
            {Object.entries(THEMES).map(([k,t])=>(
              <button key={k} className={"theme-btn"+(theme===k?" active":"")} onClick={()=>setTheme(k)} title={t.label}>{t.label.split(' ')[0]}</button>
            ))}
          </div>
          <CatMascot mood={mood} />
        </div>

        {/* body */}
        <div className="kw-body">
          <div className="tab-content" key={tabKey}>
            {tab==="home"       && <WorldHome habits={habits} setHabits={setHabits} setModal={setModal} todayStr={todayStr} mood={mood} missedDays={missedDays} timeOfDay={timeOfDay} personality={personality} onPulse={triggerPulse} worldName={worldName} setWorldName={updateWorldName}/>}
            {tab==="todo"       && <TodoTab todos={todos} setTodos={setTodos} setModal={setModal}/>}
            {tab==="challenges" && <ChallengesTab challenges={challenges} setChallenges={setChallenges} setModal={setModal} todayStr={todayStr}/>}
            {tab==="ai"         && <NekoChanTab habits={habits} todos={todos} challenges={challenges} messages={nekoMessages} setMessages={setNekoMessages}/>}
          </div>
        </div>

        {/* nav */}
        <div className="kw-nav">
          {NAV_ITEMS.map(([key,ico,lbl])=>(
            <button key={key} className={tab===key?"active":""} onClick={()=>switchTab(key)}>
              <span className="ico">{ico}</span>{lbl}
            </button>
          ))}
        </div>

        {/* modals */}
        {modal==="habit"     && <AddHabitModal onAdd={h=>{setHabits(p=>[...p,{...h,id:Date.now(),completedDates:[]}]);setModal(null)}} onClose={()=>setModal(null)}/>}
        {modal==="todo"      && <AddTodoModal  onAdd={t=>{setTodos(p=>[...p,{...t,id:Date.now(),done:false}]);setModal(null)}} onClose={()=>setModal(null)}/>}
        {modal==="challenge" && <AddChalModal  onAdd={c=>{setChallenges(p=>[...p,{...c,id:Date.now(),completedDates:[]}]);setModal(null)}} onClose={()=>setModal(null)}/>}
        {modal==="worldName" && <WorldNameModal currentName={worldName} onSave={name=>{updateWorldName(name);setModal(null)}} onClose={()=>setModal(null)}/>}
      </div>
    </>
  );
}

/* ─── Floating Particles Component ────────────────────────── */
const PARTICLE_SETS = {
  blissful: ['✨','🌟','💖','⭐','🏆'],
  happy:    ['✨','🌸','💕','⭐'],
  content:  ['🌸','✨','🍀'],
  sleepy:   ['💤','☁️','🌙'],
  sad:      ['🍂','💧'],
  lonely:   ['🍂','🌙','💫'],
};

function WorldParticles({ mood }) {
  const set = PARTICLE_SETS[mood] || PARTICLE_SETS.content;
  const count = mood === 'blissful' ? 8 : mood === 'happy' ? 6 : mood === 'sad' || mood === 'lonely' ? 2 : 4;
  return (
    <div className="world-particles">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="world-particle" style={{
          left: `${10 + (i * 73 + 17) % 80}%`,
          top: `${20 + (i * 41 + 11) % 55}%`,
          animationDelay: `${(i * 0.7) % 3.5}s`,
          animationDuration: `${3 + (i % 3)}s`,
          fontSize: `${11 + (i % 3) * 3}px`,
        }}>{set[i % set.length]}</span>
      ))}
    </div>
  );
}

/* ─── Burst Effect Component ─────────────────────────────── */
function CompletionBurst({ emoji, onDone }) {
  const particles = ['✨','💖','⭐','🌸'];
  useEffect(() => { const t = setTimeout(onDone, 700); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="burst-container">
      {particles.map((p, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const dist = 28 + Math.random() * 14;
        return (
          <span key={i} className="burst-particle" style={{
            '--bx': `${Math.cos(angle) * dist}px`,
            '--by': `${Math.sin(angle) * dist}px`,
            animationDelay: `${i * 0.05}s`,
          }}>{p}</span>
        );
      })}
    </div>
  );
}

/* ─── World Home (world-first with Neko + care tasks) ────── */
function WorldHome({habits,setHabits,setModal,todayStr,mood,missedDays,timeOfDay,personality,onPulse,worldName,setWorldName}) {
  const done = habits.filter(h=>h.completedDates.includes(todayStr)).length;
  const total = habits.length;
  const pct = total ? Math.round(done/total*100) : 0;
  const moodData = NEKO_MOODS[mood] || NEKO_MOODS.content;
  const dlgStateRef = useRef({ mood: null, index: 0, lastRotation: 0, interval: 45000 });
  const personalityMsg = getPersonalityMsg(mood, personality);
  const routineMsg = detectRoutine();
  // Priority: personality > routine (first load only) > idle rotation
  const idleMsg = personalityMsg || routineMsg || getIdleMsg(mood, dlgStateRef.current);
  const [burstId, setBurstId] = useState(null);
  const [nekoHop, setNekoHop] = useState(false);
  const isSilent = mood === 'sad' || mood === 'lonely';
  const relLevel = getRelationshipLevel(personality.trust);
  const [teaseTapped, setTeaseTapped] = useState(false);

  // ── Neko initiation system (pulls user, not pushes) ──
  const [nekoNudge, setNekoNudge] = useState(null);
  const nudgeTimerRef = useRef(null);
  useEffect(() => {
    // only nudge if user has tasks and hasn't finished
    if (total === 0 || pct === 100 || isSilent) return;
    // clear any existing nudge timer
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    // idle nudge: after 20s without completing a task, Neko initiates
    const delay = (pct >= 75 ? 12000 : 20000) + Math.random() * 5000; // jitter for alive feel
    nudgeTimerRef.current = setTimeout(() => {
      const nearFinish = total - done <= 1;
      const nudges = nearFinish
        ? [
            "We're so close… just one more? 🌸",
            "Almost there~ should we finish together? 💕",
            "One more and our world blooms! ✨",
          ]
        : pct >= 50
        ? [
            "Should we do one more thing? 🐱",
            "We're on a roll~ keep going? 💕",
            "I can feel the world getting warmer~ ✨",
          ]
        : [
            "Hey~ wanna start with something small? 🌱",
            "I'm here if you want to try one~ 🐱",
            "Even one task would make me smile~ 💕",
          ];
      setNekoNudge(nudges[Math.floor(Math.random() * nudges.length)]);
    }, delay);
    return () => clearTimeout(nudgeTimerRef.current);
  }, [done, total, pct, isSilent]);

  // auto-dismiss nudge with jitter (5-8s)
  useEffect(() => {
    if (nekoNudge) {
      const t = setTimeout(() => setNekoNudge(null), 5000 + Math.random() * 3000);
      return () => clearTimeout(t);
    }
  }, [nekoNudge]);

  // ── reveal system state ──
  const [revealToast, setRevealToast] = useState(null);
  const prevPctRef = useRef(pct);
  const [milestoneToast, setMilestoneToast] = useState(null);
  const [memoryDrop, setMemoryDrop] = useState(null);

  // ── UI clarity: decide which secondary elements to show (max 2-3) ──
  const showMemoryRecall = !revealToast && !milestoneToast && !memoryDrop;
  const showAnticipation = !revealToast && !milestoneToast;

  // ── full reveal (100% completion) ──
  const [showFullReveal, setShowFullReveal] = useState(false);
  const [revealPhase, setRevealPhase] = useState(0);
  const revealTriggeredRef = useRef(false);

  // ── prompt world name on first use ──
  const worldNamePromptedRef = useRef(false);
  useEffect(() => {
    if (!worldName && !worldNamePromptedRef.current && total > 0) {
      worldNamePromptedRef.current = true;
      // delay so it doesn't flash on first render
      const t = setTimeout(() => setModal('worldName'), 2000);
      return () => clearTimeout(t);
    }
  }, [worldName, total]);

  // ── memory drops: track perfect days + first task ──
  useEffect(() => {
    if (pct === 100 && total > 0) {
      const mem = saveMemory('perfect_day');
      if (mem) setMemoryDrop(mem);
    }
    if (done === 1 && total > 0) {
      const memories = loadMemories();
      if (!memories.some(m => m.type === 'first_task')) {
        const mem = saveMemory('first_task');
        if (mem) setMemoryDrop(mem);
      }
    }
  }, [done, total]);

  // ── memory drop: trust max ──
  useEffect(() => {
    if (personality.trust >= 95) {
      const memories = loadMemories();
      if (!memories.some(m => m.type === 'trust_max')) {
        saveMemory('trust_max');
      }
    }
  }, [personality.trust]);

  // ── memory drop: streak week ──
  useEffect(() => {
    if (personality.totalDaysActive === 7) {
      const memories = loadMemories();
      if (!memories.some(m => m.type === 'streak_week')) {
        saveMemory('streak_week');
      }
    }
  }, [personality.totalDaysActive]);

  // auto-dismiss memory drop toast
  useEffect(() => {
    if (memoryDrop) {
      const t = setTimeout(() => setMemoryDrop(null), 3500);
      return () => clearTimeout(t);
    }
  }, [memoryDrop]);

  // detect env object upgrades on pct change
  const prevPctForEnvRef = useRef(pct);
  useEffect(() => {
    const oldPct = prevPctForEnvRef.current;
    prevPctForEnvRef.current = pct;
    if (pct <= oldPct || missedDays >= 2) return;
    for (const obj of ENV_OBJECTS) {
      const oldStage = getEnvStage(obj, oldPct, 0).stage;
      const newStage = getEnvStage(obj, pct, 0).stage;
      if (newStage > oldStage) {
        const msgs = ENV_REVEAL_MSGS[obj.id];
        setRevealToast({ emoji: newStage === 2 ? obj.full : obj.grown, msg: msgs[newStage - 1], id: obj.id });
        setTimeout(() => setRevealToast(null), 3000);
        break; // only show one reveal at a time
      }
    }
  }, [pct, missedDays]);

  // detect milestone unlocks
  useEffect(() => {
    const unlocked = loadState(STORAGE_KEYS.milestones, []);
    for (const m of MILESTONES) {
      if (unlocked.includes(m.id)) continue;
      if (m.check(personality, habits, todayStr)) {
        unlocked.push(m.id);
        saveState(STORAGE_KEYS.milestones, unlocked);
        setMilestoneToast({ emoji: m.emoji, msg: m.msg });
        setTimeout(() => setMilestoneToast(null), 4500);
        break;
      }
    }
  }, [pct, personality.totalDaysActive, personality.trust]);

  // ── full reveal trigger: 100% completion (with reward spacing) ──
  useEffect(() => {
    const oldPct = prevPctRef.current;
    prevPctRef.current = pct;
    if (pct === 100 && oldPct < 100 && total > 0 && !revealTriggeredRef.current) {
      revealTriggeredRef.current = true;
      if (canShowBigReward()) {
        markRewardShown();
        setShowFullReveal(true);
        setRevealPhase(0);
        setTimeout(() => setRevealPhase(1), 400);
        setTimeout(() => setRevealPhase(2), 1200);
        setTimeout(() => setRevealPhase(3), 2000);
        setTimeout(() => { setShowFullReveal(false); setRevealPhase(0); }, 7000);
      }
    }
  }, [pct, total]);

  // next unlock preview
  const nextUnlock = getNextUnlock(pct, missedDays);

  function toggle(id) {
    const h = habits.find(x => x.id === id);
    const wasChecked = h && h.completedDates.includes(todayStr);

    setHabits(prev=>prev.map(h=>{
      if(h.id!==id) return h;
      const has = h.completedDates.includes(todayStr);
      return {...h, completedDates: has ? h.completedDates.filter(d=>d!==todayStr) : [...h.completedDates,todayStr]};
    }));

    // fire micro-burst only on check (not uncheck)
    if (!wasChecked) {
      setBurstId(id);
      setNekoHop(true);
      if (onPulse) onPulse(); // background pulse
      setTimeout(() => setNekoHop(false), isSilent ? 900 : 550);
    }
  }

  // emotional status text based on dependency + completion
  let statusText;
  if (missedDays >= 3) statusText = `You were away for ${missedDays} days… but you're here now 💕`;
  else if (missedDays >= 1) statusText = "I missed you yesterday… let's make up for it~ 🌸";
  else if (pct === 100) statusText = "You cared for everything today~ 🎉";
  else if (done > 0) statusText = `You cared for ${done} thing${done>1?'s':''} today 🌸`;
  else statusText = "Your world is waiting for you~ ✨";

  // anticipation messages — with randomness to prevent predictability
  const anticipationMsgs = [
    {icon:'🌱',text:"Something new is growing… come back tomorrow to see~"},
    {icon:'🎁',text:"Keep this up and something special might happen~"},
    {icon:'🌸',text:"Your world is slowly blooming… can you feel it?"},
    {icon:'🔮',text:"Tomorrow holds a little surprise…"},
    {icon:'✨',text:"Something feels close…"},
    {icon:'🌙',text:"There's a change in the air~"},
  ];
  const mysteryMsgs = [
    {icon:'❓',text:"…"},
    {icon:'✨',text:"Something is happening…"},
    {icon:'🌫️',text:"Can you feel that?"},
  ];
  // 20% chance to show a mystery message instead of regular anticipation
  const antSeed = Math.floor(Date.now() / (1000*60*60*6)); // changes every 6h
  const showMystery = (antSeed % 5) === 0;
  const antPool = showMystery ? mysteryMsgs : anticipationMsgs;
  const antIdx = antSeed % antPool.length;
  const antMsg = antPool[antIdx];

  const REVEAL_MSGS = [
    "You took care of everything today…",
    "Every little thing you did mattered 💕",
    "Your world is glowing because of you~",
    "You showed up, and that's everything 🌸",
  ];
  const revealMsg = REVEAL_MSGS[Math.floor(Date.now() / 86400000) % REVEAL_MSGS.length];

  return (
    <>
      {/* ── Full Reveal Overlay (100% completion) ── */}
      {showFullReveal && (
        <div className={`reveal-overlay${revealPhase >= 0 ? ' active' : ''}`} onClick={() => { setShowFullReveal(false); setRevealPhase(0); }}>
          <div className="reveal-sparkles">
            {['✨','💖','⭐','🌸','💕','🌟','🏆','💫'].map((s, i) => (
              <span key={i} className="reveal-sparkle" style={{
                left: `${8 + (i * 23) % 85}%`,
                top: `${10 + (i * 31) % 70}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${1.5 + (i % 3) * 0.5}s`,
              }}>{s}</span>
            ))}
          </div>
          <div className={`reveal-stage${revealPhase >= 1 ? ' visible' : ''}`}>
            <div className="reveal-neko">
              <CatMascot mood="blissful" size={100} />
            </div>
          </div>
          <div className={`reveal-stage${revealPhase >= 2 ? ' visible' : ''}`} style={{transitionDelay: '0.1s'}}>
            <div className="reveal-env-row">
              {ENV_OBJECTS.map((obj, i) => {
                const st = getEnvStage(obj, 100, 0);
                return (
                  <span key={obj.id} className="reveal-env-item" style={{ animationDelay: `${i * 0.15}s` }}>{st.emoji}</span>
                );
              })}
            </div>
          </div>
          <div className={`reveal-stage${revealPhase >= 3 ? ' visible' : ''}`} style={{transitionDelay: '0.2s'}}>
            <div className="reveal-text">
              <div className="reveal-title">{revealMsg}</div>
              <div className="reveal-subtitle">Your whole world bloomed today. Neko is so proud of you~ 🐱💕</div>
            </div>
          </div>
          {revealPhase >= 3 && <div className="reveal-dismiss">tap anywhere to continue~</div>}
        </div>
      )}

      {/* ── World Name Display ── */}
      {worldName && (
        <div className="world-name" onClick={() => setModal('worldName')}>
          ✿ {worldName}
        </div>
      )}

      {/* ── Neko World Section ── */}
      <div className={`neko-world${isSilent ? ' world-silent' : ''}`} style={{background:`radial-gradient(ellipse at center, ${moodData.glow}, transparent 70%)`}}>
        <WorldParticles mood={mood} />

        {/* ── Environment Objects ── */}
        <div className="env-shelf">
          {ENV_OBJECTS.map(obj => {
            const stage = getEnvStage(obj, pct, missedDays);
            const isRevealing = revealToast && revealToast.id === obj.id;
            return (
              <div key={obj.id} className={`env-obj${stage.wilted ? ' env-wilted' : ''}${isRevealing ? ' env-reveal' : ''}`} style={{ opacity: stage.opacity }} title={obj.label}>
                <span className="env-emoji">{stage.emoji}</span>
              </div>
            );
          })}
        </div>

        {/* ── Reveal Toast ── */}
        {revealToast && (
          <div className="reveal-toast">
            <span className="reveal-emoji">{revealToast.emoji}</span>
            <span className="reveal-msg">{revealToast.msg}</span>
          </div>
        )}

        {/* ── Milestone Toast ── */}
        {milestoneToast && (
          <div className="milestone-toast">
            <span className="milestone-emoji">{milestoneToast.emoji}</span>
            <span className="milestone-msg">{milestoneToast.msg}</span>
          </div>
        )}

        {/* ── Memory Drop Toast ── */}
        {memoryDrop && (
          <div className={`memory-toast ${MEMORY_TIER_STYLES[memoryDrop.tier] || ''}`}>
            <span style={{fontSize:20}}>{memoryDrop.emoji}</span>
            <span style={{fontSize:12,color:'var(--text-soft)',fontWeight:600}}>{memoryDrop.text}</span>
          </div>
        )}

        <div className="neko-world-inner">
          <div className={`${nekoHop ? 'neko-hop' : 'neko-breathe'}`} style={isSilent ? {animationDuration: '0.8s'} : undefined}>
            <CatMascot mood={mood} size={88} />
          </div>
          {/* ── Relationship Badge (sometimes feels instead of metrics) ── */}
          <div className="rel-badge">
            <span>{relLevel.emoji}</span>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text-muted)'}}>{relLevel.label}</span>
            {/* Sometimes hide trust bar and show feeling text instead */}
            {(() => {
              const showFeelings = Math.floor(Date.now() / (1000*60*20)) % 3 === 0; // 1/3 of 20min windows
              if (showFeelings && personality.trust > 30) {
                const feelTexts = personality.trust >= 80
                  ? ['We feel really close lately… 💖', 'I trust you with my whole heart~ 🐱', 'You\'re my person 🌸']
                  : personality.trust >= 50
                  ? ['We\'re getting closer… 🌸', 'It feels warm being with you~ 💕', 'I feel comfortable around you 🐱']
                  : ['I\'m starting to trust you… ✨', 'Maybe this will be okay~ 🌸'];
                return <div style={{fontSize:10,color:'var(--text-soft)',fontStyle:'italic',marginTop:2}}>{feelTexts[Math.floor(Date.now()/(1000*60*60))%feelTexts.length]}</div>;
              }
              return (
                <div className="rel-fill">
                  <div className="rel-fill-inner" style={{width:`${personality.trust}%`}}/>
                </div>
              );
            })()}
          </div>
          <div className="neko-speech">
            {nekoNudge ? (
              <div className="speech-bubble neko-nudge">{nekoNudge}</div>
            ) : (
              <div className={`speech-bubble${isSilent ? ' speech-silent' : ''}`}>{idleMsg}</div>
            )}
          </div>
        </div>
        <div className="world-status">
          <div className="world-status-item">
            <span className="world-stat-num">{done}/{total}</span>
            <span className="world-stat-label">done today</span>
          </div>
          <div className="world-status-divider"/>
          <div className="world-status-item">
            <span className="world-stat-num">{pct===100?"🎉":`${pct}%`}</span>
            <span className="world-stat-label">{pct===100?"all done~":"complete"}</span>
          </div>
        </div>
        <div className="prog-bar" style={{marginTop:12}}>
          <div className="prog-fill" style={{width:`${pct}%`}}/>
        </div>

        {/* ── Next Unlock Preview ── */}
        {nextUnlock && (
          <div className="next-unlock">
            <span className="next-unlock-emoji">{nextUnlock.emoji}</span>
            <span className="next-unlock-text">
              {nextUnlock.gap <= 10
                ? `Almost there~ ${nextUnlock.obj.label} is about to change! ✨`
                : `${nextUnlock.gap}% more care and something will bloom 🌱`
              }
            </span>
          </div>
        )}
      </div>

      {/* ── Emotional status strip ── */}
      <div style={{textAlign:'center',fontSize:13,color:'var(--text-soft)',fontWeight:600,margin:'2px 0 10px',lineHeight:1.4}}>
        {statusText}
      </div>

      {/* ── Care Tasks ── */}
      <div className="section-head" style={{marginTop:2}}>
        <div className="section-title">Today's Care Tasks 🌸</div>
        <button className="fab" onClick={()=>setModal("habit")} style={{width:44,height:44,fontSize:22}}>+</button>
      </div>

      {habits.length === 0 && <div className="empty-state">Add your first care task~ ✨</div>}

      {habits.map(h=>{
        const checked = h.completedDates.includes(todayStr);
        const streak = calcStreak(h.completedDates);
        const glowIntensity = Math.min(streak / 14, 1);
        const glowColor = h.color || 'var(--accent-light)';
        return (
          <div key={h.id} className="card-sm" style={{
            position:'relative',
            boxShadow: streak > 0
              ? `inset 3px 0 0 ${glowColor}, 0 3px 18px rgba(232,119,153,0.08), 0 0 ${8 + glowIntensity * 16}px ${glowColor}${Math.round(glowIntensity * 50 + 15).toString(16).padStart(2,'0')}`
              : undefined,
          }}>
            {burstId === h.id && <CompletionBurst emoji={h.emoji} onDone={() => setBurstId(null)} />}
            <div className="habit-row">
              <div
                className={`habit-check${checked?" checked":""}`}
                style={{
                  background: checked ? (h.color || "var(--green-done-1)") : "var(--bg-surface-alt)",
                  borderColor: checked ? "transparent" : "var(--accent-border)"
                }}
                onClick={()=>toggle(h.id)}
              >
                {checked
                  ? <span style={{color:"var(--text-on-accent)",fontSize:18,fontWeight:900}}>✓</span>
                  : <span style={{opacity:.4,fontSize:16}}>{h.emoji}</span>
                }
              </div>
              <div className="habit-info">
                <div className={`habit-name${checked?" done":""}`}>{h.emoji} {h.name}</div>
                {streak > 0 && (
                  <div className="streak-visual">
                    {Array.from({length: Math.min(streak, 7)}, (_,i) => (
                      <span key={i} className="streak-dot" style={{
                        animationDelay: `${i * 0.12}s`,
                        background: glowColor,
                        opacity: 0.4 + (i / 7) * 0.6,
                      }}/>
                    ))}
                    {streak > 7 && <span className="streak-plus">+{streak - 7}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Anticipation Tease ── */}
      {total > 0 && showAnticipation && (
        <div className="ant-tease">
          <div className="ant-tease-preview">{nextUnlock ? nextUnlock.emoji : antMsg.icon}</div>
          <div style={{flex:1}}>
            {!showMystery && <div className="ant-tease-bar"><div className="ant-tease-fill" style={{width:`${pct}%`}}/></div>}
            <div className="ant-tease-label">{antMsg.text}</div>
          </div>
        </div>
      )}

      {/* ── Memory Recall ── */}
      {showMemoryRecall && (() => {
        const memories = loadMemories();
        if (memories.length === 0) return null;
        // ~30% chance to show emotional dialogue instead of list
        const useDialogue = Math.floor(Date.now() / (1000*60*30)) % 3 === 0; // changes every 30min
        if (useDialogue && memories.length > 0) {
          const mem = memories[Math.floor(Date.now() / (1000*60*60)) % memories.length];
          const dialogueLines = [
            `Do you remember ${mem.text.toLowerCase()}? That made me really happy… 💖`,
            `I still think about that time… ${mem.emoji} it meant a lot to me~`,
            `Hey… remember when we did that? ${mem.emoji} *happy sigh* 🐱`,
            `Sometimes I think back to ${mem.text.toLowerCase()}… and I smile 🌸`,
          ];
          const line = dialogueLines[Math.floor(Date.now() / (1000*60*60*3)) % dialogueLines.length];
          return (
            <div className="memory-strip">
              <div className="memory-item memory-dialogue">
                <span>🐱</span>
                <span style={{flex:1,fontStyle:'italic',color:'var(--text-soft)'}}>{line}</span>
              </div>
            </div>
          );
        }
        const recent = memories.slice(-2).reverse();
        return (
          <div className="memory-strip">
            {recent.map((m, i) => (
              <div key={i} className={`memory-item ${MEMORY_TIER_STYLES[m.tier] || ''}`}>
                <span>{m.emoji}</span>
                <span style={{flex:1}}>{m.text}</span>
                <span style={{fontSize:10,color:'var(--text-muted)',whiteSpace:'nowrap'}}>{m.date}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Soft Monetization Seed (locked variant tease) ── */}
      {personality.totalDaysActive >= 5 && pct >= 50 && (
        <div className="locked-tease" onClick={() => setTeaseTapped(true)} style={{cursor:'pointer'}}>
          <span className="locked-tease-emoji">🌺</span>
          <span className="locked-tease-text">
            {teaseTapped ? 'This would look really nice here… someday 💭' : 'Someday we can make this even cozier…'}
          </span>
        </div>
      )}
    </>
  );
}

/* ─── Todo Tab ───────────────────────────────────────────── */
function TodoTab({todos,setTodos,setModal}) {
  const left = todos.filter(t=>!t.done).length;

  function toggle(id) {
    setTodos(prev=>prev.map(t=>t.id===id?{...t,done:!t.done}:t));
  }
  function remove(id) {
    setTodos(prev=>prev.filter(t=>t.id!==id));
  }

  const doneCount = todos.filter(t=>t.done).length;
  const totalCount = todos.length;
  const emotionalSummary = totalCount === 0
    ? null
    : left === 0
    ? "You cleared everything~ nothing left to worry about 🌟"
    : doneCount > 0
    ? `${doneCount} done, ${left} to go… you're doing great 💕`
    : "A fresh start~ one task at a time 🌸";

  return (
    <>
      <div className="sticker-card" style={{background:"linear-gradient(145deg,var(--sticker-green-1),var(--sticker-green-2))"}}>
        <span className="sparkle" style={{top:10,right:24}}>🍀</span>
        <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,fontWeight:700,color:"var(--green-1)"}}>
          {left===0?"All done! 🎉":`${left} task${left!==1?"s":""} left`}
        </div>
        <div style={{fontSize:13,color:"var(--green-text-soft)",fontWeight:600,marginTop:4}}>
          {emotionalSummary || "Tick them off one by one~ 🍀"}
        </div>
      </div>

      <div className="section-head">
        <div className="section-title" style={{color:"var(--green-1)"}}>To-do List ✅</div>
        <button className="fab" onClick={()=>setModal("todo")} style={{width:48,height:48,fontSize:24,background:"linear-gradient(135deg,var(--green-1),var(--green-2))"}}>+</button>
      </div>

      <div className="card">
        {todos.length===0 && <div className="empty-state">No tasks yet! Add one ✨</div>}
        {todos.map(t=>(
          <div key={t.id} className="todo-row">
            <div className={`todo-check${t.done?" done":""}`} onClick={()=>toggle(t.id)}>
              {t.done && <span style={{color:"var(--text-on-accent)",fontSize:12,fontWeight:900}}>✓</span>}
            </div>
            <div style={{flex:1}}>
              <div className={`todo-name${t.done?" done":""}`}>{t.emoji} {t.name}</div>
              <span className="todo-cat" style={{marginTop:4,display:"inline-block"}}>{t.category}</span>
            </div>
            <button className="todo-delete" onClick={()=>remove(t.id)}>×</button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Challenges Tab ─────────────────────────────────────── */
function ChallengesTab({challenges,setChallenges,setModal,todayStr}) {
  function toggleDay(id) {
    setChallenges(prev=>prev.map(c=>{
      if(c.id!==id) return c;
      const has = c.completedDates.includes(todayStr);
      return {...c, completedDates: has ? c.completedDates.filter(d=>d!==todayStr) : [...c.completedDates,todayStr]};
    }));
  }

  // emotional reframe for summary
  const totalDone = challenges.reduce((s,c) => s + c.completedDates.length, 0);
  const totalTarget = challenges.reduce((s,c) => s + c.targetDays, 0);
  const emotionalText = challenges.length === 0
    ? null
    : totalDone >= totalTarget
    ? "You've conquered every challenge~ 🏆"
    : totalDone > 0
    ? `You've shown up ${totalDone} time${totalDone>1?'s':''}… that takes real strength 🌸`
    : "Every big journey starts with one step~ 💕";

  return (
    <>
      {emotionalText && (
        <div className="sticker-card" style={{background:"linear-gradient(145deg,var(--sticker-purple-1),var(--sticker-purple-2))",textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:6}}>🌱</div>
          <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,fontWeight:700,color:"var(--accent-heading)",lineHeight:1.4}}>{emotionalText}</div>
        </div>
      )}

      <div className="section-head">
        <div className="section-title">Your Growth Journey 🌱</div>
        <button className="fab" onClick={()=>setModal("challenge")} style={{width:48,height:48,fontSize:24,background:"linear-gradient(135deg,var(--challenge-1),var(--challenge-2))"}}>+</button>
      </div>

      {challenges.length===0 && (
        <div className="card"><div className="empty-state">Start your first challenge! 💪</div></div>
      )}

      {challenges.map((c,i)=>{
        const bg = PAL[i%PAL.length];
        const streak = calcStreak(c.completedDates);
        const elapsed = daysBetween(c.startDate, todayStr)+1;
        const progress = Math.min(Math.round(c.completedDates.length/c.targetDays*100),100);
        const checkedToday = c.completedDates.includes(todayStr);
        return (
          <div key={c.id} className="chal-card" style={{background:`linear-gradient(145deg,${bg},${bg}dd)`}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
              <div>
                <div className="chal-title" style={{color:"var(--text-dark)"}}>{c.emoji} {c.name}</div>
                <div className="chal-sub">{c.targetDays}-day challenge • Day {elapsed}</div>
              </div>
              <button
                className="chal-btn"
                style={{
                  background:checkedToday?"var(--bg-surface)":"rgba(255,255,255,.55)",
                  color:checkedToday?"var(--accent-heading)":"var(--text-dark)"
                }}
                onClick={()=>toggleDay(c.id)}
              >
                {checkedToday?"✓ Done":"Check in"}
              </button>
            </div>
            <div style={{display:"flex",gap:24,marginTop:14}}>
              <div className="chal-stat">
                <div className="chal-stat-num">{streak}</div>
                <div className="chal-stat-label">{streak > 0 ? 'days strong 🔥' : 'streak 🔥'}</div>
              </div>
              <div className="chal-stat">
                <div className="chal-stat-num">{c.completedDates.length}</div>
                <div className="chal-stat-label">{c.targetDays - c.completedDates.length > 0 ? `${c.targetDays - c.completedDates.length} to go` : 'done! 🎉'}</div>
              </div>
              <div className="chal-stat">
                <div className="chal-stat-num">{progress}%</div>
                <div className="chal-stat-label">{progress >= 80 ? 'almost there!' : 'complete'}</div>
              </div>
            </div>
            <div className="prog-bar" style={{marginTop:12,background:"rgba(255,255,255,.4)"}}>
              <div style={{height:"100%",width:`${progress}%`,background: progress >= 80 ? "linear-gradient(90deg,rgba(255,255,255,.75),var(--gold))" : "rgba(255,255,255,.75)",borderRadius:12,transition:"width .5s cubic-bezier(.16,1,.3,1)",boxShadow: progress >= 80 ? "0 0 12px rgba(255,215,0,0.3)" : "none"}}/>
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ─── Neko-chan Tab ───────────────────────────────────────── */
function NekoChanTab({habits,todos,challenges,messages,setMessages}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(()=>{
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  },[messages,loading]);

  async function send(overrideMsg) {
    const msg = overrideMsg || input.trim();
    if(!msg||loading) return;
    if (!overrideMsg) setInput("");
    const newMsgs = [...messages,{role:"user",content:msg}];
    setMessages(newMsgs);
    setLoading(true);

    // Detect name in message for local memory
    const lower = msg.toLowerCase();
    const nameMatch = lower.match(/(?:my name is|i'm|im|i am|call me|name's|names)\s+([a-zA-Z]{2,20})/);
    if (nameMatch) {
      nekoMemory.userName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
      saveNekoMemory();
    }

    try {
      const todayStr = today();
      const doneCount = habits.filter(h=>h.completedDates.includes(todayStr)).length;
      const context = {
        doneCount,
        totalHabits: habits.length,
        pendingTodos: todos.filter(t=>!t.done).length,
        activeChallenges: challenges.map(c => ({
          emoji: c.emoji, name: c.name,
          elapsed: daysBetween(c.startDate, todayStr)+1,
          targetDays: c.targetDays
        })),
        userName: nekoMemory.userName
      };

      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs, context })
      });

      if (!resp.ok) throw new Error("api");
      const data = await resp.json();
      if (!data.reply) throw new Error("empty");
      setMessages(p=>[...p,{role:"assistant",content:data.reply}]);
    } catch {
      // Offline fallback — use local pattern matching
      const reply = getNekoResponse(msg, habits, todos, challenges);
      setMessages(p=>[...p,{role:"assistant",content:reply}]);
    } finally {
      setLoading(false);
    }
  }

  const QUICK_ACTIONS = [
    {label:"Plan my day 📋", msg:"Plan my day"},
    {label:"Motivate me 💪", msg:"Motivate me"},
    {label:"Check progress 📊", msg:"Check my progress"},
    {label:"How are you? 🐱", msg:"How are you?"},
  ];

  return (
    <div className="neko-container">
      <div className="sticker-card" style={{background:"linear-gradient(145deg,var(--sticker-neko-1),var(--sticker-neko-2))",textAlign:"center",flexShrink:0}}>
        <div className="neko-breathe" style={{display:'inline-block'}}>
          <CatMascot mood="happy" size={56} />
        </div>
        <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:20,fontWeight:700,color:"var(--accent-heading)"}}>Neko-chan ✨</div>
        <div style={{fontSize:13,color:"var(--text-soft)",fontWeight:600,marginTop:4}}>Your kawaii habit companion~</div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="quick-actions">
        {QUICK_ACTIONS.map(qa => (
          <button key={qa.msg} className="quick-chip" onClick={() => send(qa.msg)}>{qa.label}</button>
        ))}
      </div>

      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-wrap">
          {messages.map((m,i)=>(
            <div key={i} className={`bubble ${m.role==="user"?"user":"ai"}`}>{m.content}</div>
          ))}
          {loading && (
            <div className="bubble ai"><div className="typing"><div className="dot"/><div className="dot"/><div className="dot"/></div></div>
          )}
        </div>
      </div>

      <div className="chat-input-bar">
        <div className="chat-input-inner">
          <input
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder="Talk to Neko-chan~ 🐱"
          />
          <button className="chat-send" onClick={()=>send()}>➤</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Care Task Modal ─────────────────────────────────── */
function AddHabitModal({onAdd,onClose}) {
  const [name,setName] = useState("");
  const [emoji,setEmoji] = useState("🌸");
  const [color,setColor] = useState(PAL[0]);
  const [customEmoji,setCustomEmoji] = useState("");
  function handleCustomEmoji(val) {
    // Extract only emoji characters (or last entered char for mobile keyboard)
    const cleaned = [...val].slice(-1).join("");
    if (cleaned) { setCustomEmoji(cleaned); setEmoji(cleaned); }
    else setCustomEmoji("");
  }
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <h3>New Care Task 🌸</h3>
        <input placeholder="What do you want to take care of?" value={name} onChange={e=>setName(e.target.value)}/>
        <div className="label-text">Pick an emoji</div>
        <div className="emoji-grid">{EMOJIS.map(e=>(
          <button key={e} className={`emoji-btn${emoji===e&&!customEmoji?" sel":""}`} onClick={()=>{setEmoji(e);setCustomEmoji("")}}>{e}</button>
        ))}</div>
        <div className="custom-emoji-row">
          <input className="custom-emoji-input" value={customEmoji} onChange={e=>handleCustomEmoji(e.target.value)} placeholder="😊" maxLength={2}/>
          <span className="custom-emoji-hint">Or type your own emoji from your keyboard~</span>
        </div>
        <div className="label-text">Pick a color</div>
        <div className="color-grid">{PAL.map(c=>(
          <div key={c} className={`color-dot${color===c?" sel":""}`} style={{background:c}} onClick={()=>setColor(c)}/>
        ))}</div>
        <button className="btn-pri" onClick={()=>name.trim()&&onAdd({name:name.trim(),emoji,color})}>Add Care Task ✨</button>
      </div>
    </div>
  );
}

/* ─── Add Todo Modal ─────────────────────────────────────── */
function AddTodoModal({onAdd,onClose}) {
  const [name,setName] = useState("");
  const [emoji,setEmoji] = useState("✅");
  const [cat,setCat] = useState("Personal");
  const [customEmoji,setCustomEmoji] = useState("");
  function handleCustomEmoji(val) {
    const cleaned = [...val].slice(-1).join("");
    if (cleaned) { setCustomEmoji(cleaned); setEmoji(cleaned); }
    else setCustomEmoji("");
  }
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <h3>New Task ✅</h3>
        <input placeholder="What do you need to do?" value={name} onChange={e=>setName(e.target.value)}/>
        <div className="label-text">Pick an emoji</div>
        <div className="emoji-grid">{EMOJIS.map(e=>(
          <button key={e} className={`emoji-btn${emoji===e&&!customEmoji?" sel":""}`} onClick={()=>{setEmoji(e);setCustomEmoji("")}}>{e}</button>
        ))}</div>
        <div className="custom-emoji-row">
          <input className="custom-emoji-input" value={customEmoji} onChange={e=>handleCustomEmoji(e.target.value)} placeholder="😊" maxLength={2}/>
          <span className="custom-emoji-hint">Or type your own emoji~</span>
        </div>
        <div className="label-text">Category</div>
        <select value={cat} onChange={e=>setCat(e.target.value)}>
          {["Personal","Work","Health","Family","Shopping","Other"].map(c=><option key={c}>{c}</option>)}
        </select>
        <button className="btn-pri" style={{background:"linear-gradient(135deg,var(--green-1),var(--green-2))",boxShadow:"0 6px 24px var(--green-glow)"}} onClick={()=>name.trim()&&onAdd({name:name.trim(),emoji,category:cat})}>Add Task ✨</button>
      </div>
    </div>
  );
}

/* ─── Add Challenge Modal ────────────────────────────────── */
function AddChalModal({onAdd,onClose}) {
  const [name,setName] = useState("");
  const [emoji,setEmoji] = useState("🔥");
  const [days,setDays] = useState(30);
  const [customEmoji,setCustomEmoji] = useState("");
  function handleCustomEmoji(val) {
    const cleaned = [...val].slice(-1).join("");
    if (cleaned) { setCustomEmoji(cleaned); setEmoji(cleaned); }
    else setCustomEmoji("");
  }
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <h3>New Challenge 🔥</h3>
        <input placeholder="What's your challenge?" value={name} onChange={e=>setName(e.target.value)}/>
        <div className="label-text">Pick an emoji</div>
        <div className="emoji-grid">{EMOJIS.map(e=>(
          <button key={e} className={`emoji-btn${emoji===e&&!customEmoji?" sel":""}`} onClick={()=>{setEmoji(e);setCustomEmoji("")}}>{e}</button>
        ))}</div>
        <div className="custom-emoji-row">
          <input className="custom-emoji-input" value={customEmoji} onChange={e=>handleCustomEmoji(e.target.value)} placeholder="😊" maxLength={2}/>
          <span className="custom-emoji-hint">Or type your own emoji~</span>
        </div>
        <div className="label-text">How many days?</div>
        <input type="number" placeholder="30" value={days} min={1} max={365} onChange={e=>setDays(Number(e.target.value))}/>
        <button className="btn-pri" style={{background:"linear-gradient(135deg,var(--challenge-1),var(--challenge-2))",boxShadow:"0 6px 24px var(--challenge-glow)"}} onClick={()=>name.trim()&&onAdd({name:name.trim(),emoji,targetDays:days,startDate:today()})}>Start Challenge 🚀</button>
      </div>
    </div>
  );
}

/* ─── World Name Modal ───────────────────────────────────── */
function WorldNameModal({currentName, onSave, onClose}) {
  const [name, setName] = useState(currentName || '');
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal world-name-prompt">
        <div style={{fontSize:38,marginBottom:8}}>🏡</div>
        <h3 style={{margin:'0 0 6px',fontSize:17}}>Name Your Little World</h3>
        <p style={{fontSize:13,color:'var(--text-muted)',margin:'0 0 16px',lineHeight:1.5}}>Give your world a name and make it truly yours~</p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Blossom Garden, Neko Haven…"
          maxLength={24}
          autoFocus
          style={{textAlign:'center',fontSize:15,borderStyle:'dashed'}}
        />
        <button
          className="btn-pri"
          style={{marginTop:12,background:'linear-gradient(135deg,var(--lavender-btn-1),var(--lavender-btn-2))',width:'100%'}}
          onClick={() => name.trim() && onSave(name.trim())}
        >
          {currentName ? 'Rename World ✨' : 'Create My World 🌸'}
        </button>
      </div>
    </div>
  );
}
