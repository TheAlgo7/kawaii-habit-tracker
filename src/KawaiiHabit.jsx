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

/* ─── streak calc ─────────────────────────────────────────── */
function calcStreak(dates) {
  if (!dates.length) return 0;
  const sorted = [...dates].sort().reverse();
  let streak = 0, cur = today();
  for (const d of sorted) {
    if (d === cur) { streak++; cur = offsetDate(cur, -1); }
    else if (d === offsetDate(cur, 1) && streak === 0) { streak++; cur = offsetDate(cur, -1); }
    else break;
  }
  return streak;
}
function offsetDate(d, n) {
  const dt = new Date(d); dt.setDate(dt.getDate()+n);
  return dt.toISOString().split("T")[0];
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

// Memory store persists across messages within session
const nekoMemory = { userName: null };

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

*{box-sizing:border-box;margin:0;padding:0;}
body{
  background:#FFF4F7;
  font-family:'Quicksand',sans-serif;
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
}
::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:#FFD1DC;border-radius:10px;}

/* ── app shell ── */
.kw-app{
  max-width:420px;height:100vh;margin:auto;
  background:#FFF4F7;
  display:flex;flex-direction:column;position:relative;
  overflow:hidden;
}

/* ── header ── */
.kw-header{
  padding:24px 22px 12px;
  display:flex;align-items:center;justify-content:space-between;
  position:relative;
}
.kw-title{
  font-family:'Fredoka',sans-serif;
  font-size:28px;font-weight:700;
  color:#E8779A;
  letter-spacing:.5px;
}
.kw-date{
  font-size:13px;color:#D4A0B0;font-weight:600;margin-top:2px;
}
.cat-mascot{
  width:52px;height:52px;
  animation:catBounce 3s ease-in-out infinite;
  filter:drop-shadow(0 4px 8px rgba(232,119,153,0.2));
}
@keyframes catBounce{
  0%,100%{transform:translateY(0) rotate(-3deg)}
  50%{transform:translateY(-8px) rotate(3deg)}
}

/* ── body ── */
.kw-body{
  flex:1;overflow-y:auto;padding:8px 18px 14px;
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
  position:sticky;bottom:0;
  margin:0 16px 14px;
  background:#fff;
  border-radius:28px;
  box-shadow:0 4px 28px rgba(232,119,153,0.15);
  padding:6px 8px;
  display:flex;
  z-index:50;
  flex-shrink:0;
}
.kw-nav button{
  flex:1 1 0%;border:none;
  background:rgba(255,240,245,0.35);
  min-width:0;width:0;overflow:hidden;
  padding:10px 4px 8px;border-radius:22px;
  cursor:pointer;display:flex;flex-direction:column;
  align-items:center;gap:3px;
  font-family:'Quicksand',sans-serif;
  font-size:10px;font-weight:700;
  color:#E8C4B8;
  transition:background .3s cubic-bezier(.16,1,.3,1), color .3s;
  position:relative;
}
.kw-nav button.active{
  background:linear-gradient(135deg,#FFF0F5,#FFE0EC);
  color:#FF85A2;
}
.kw-nav button .ico{
  font-size:22px;
}
.kw-nav button.active .ico{
  /* no scale – keeps nav pill stable */
}

/* ── cards ── */
.card{
  background:#fff;
  border-radius:30px;
  padding:18px 20px;
  margin-bottom:14px;
  box-shadow:0 4px 24px rgba(232,119,153,0.10);
  transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s;
}
.card:hover{
  transform:translateY(-2px);
  box-shadow:0 8px 32px rgba(232,119,153,0.16);
}
.card-sm{
  background:#fff;
  border-radius:26px;
  padding:14px 18px;
  margin-bottom:10px;
  box-shadow:0 3px 18px rgba(232,119,153,0.08);
  transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s;
}
.card-sm:hover{
  transform:translateY(-1px);
  box-shadow:0 6px 24px rgba(232,119,153,0.14);
}

/* ── sticker card (progress) ── */
.sticker-card{
  background:linear-gradient(145deg,#FFF8FA,#FFE8F0);
  border-radius:30px;
  padding:20px 22px;
  margin-bottom:16px;
  box-shadow:0 6px 28px rgba(232,119,153,0.14),inset 0 1px 0 rgba(255,255,255,0.8);
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
  background:#FFE8F0;
  border-radius:12px;
  overflow:hidden;
  margin-top:10px;
}
.prog-fill{
  height:100%;border-radius:12px;
  transition:width .5s cubic-bezier(.16,1,.3,1);
  background:linear-gradient(90deg,#FF85A2,#FFB7C5);
  box-shadow:0 2px 8px rgba(255,133,162,0.3);
}

/* ── habit row ── */
.habit-row{display:flex;align-items:center;gap:14px;}
.habit-check{
  width:42px;height:42px;
  border-radius:50%;border:3px solid #FFD6E0;
  cursor:pointer;font-size:18px;
  display:flex;align-items:center;justify-content:center;
  transition:all .3s cubic-bezier(.16,1,.3,1);
  flex-shrink:0;background:#FFF8FA;
}
.habit-check:hover{transform:scale(1.12);border-color:#FFB7C5;}
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
  font-size:15px;font-weight:700;color:#3D2C5E;
  transition:opacity .3s;
}
.habit-name.done{opacity:.5;text-decoration:line-through;}
.habit-streak{
  font-size:12px;color:#FFB07C;font-weight:700;margin-top:2px;
}

/* ── section ── */
.section-head{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:12px;margin-top:4px;
}
.section-title{
  font-family:'Fredoka',sans-serif;
  font-size:20px;font-weight:600;color:#E8779A;
}

/* ── FAB ── */
.fab{
  width:54px;height:54px;
  border-radius:50%;border:none;
  background:linear-gradient(135deg,#FF6B95,#FF85A2);
  color:#fff;font-size:28px;font-weight:300;
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 6px 28px rgba(255,107,149,0.45);
  transition:all .3s cubic-bezier(.16,1,.3,1);
}
.fab:hover{
  transform:scale(1.12);
  box-shadow:0 8px 36px rgba(255,107,149,0.55);
}
.fab:active{transform:scale(0.95);}

/* ── todo ── */
.todo-row{
  display:flex;align-items:center;gap:12px;
  padding:12px 0;
  border-bottom:1.5px solid #FFF4F7;
  transition:opacity .3s;
}
.todo-row:last-child{border:none;}
.todo-check{
  width:24px;height:24px;
  border-radius:50%;
  border:2.5px solid #FFB7C5;
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
  transition:all .3s cubic-bezier(.16,1,.3,1);
  background:#FFF8FA;
}
.todo-check:hover{transform:scale(1.15);border-color:#FF85A2;}
.todo-check.done{
  background:linear-gradient(135deg,#8FD4B4,#7CC4A0);
  border-color:transparent;
  animation:checkPop .4s cubic-bezier(.16,1,.3,1);
}
.todo-name{flex:1;font-size:15px;font-weight:700;color:#3D2C5E;}
.todo-name.done{text-decoration:line-through;color:#C4B5D4;opacity:.6;}
.todo-cat{
  font-size:10px;padding:3px 10px;border-radius:20px;
  background:#FFE8F0;color:#E8779A;font-weight:700;
}
.todo-delete{
  background:none;border:none;cursor:pointer;
  font-size:18px;color:#FFB7C5;
  transition:all .2s;
  opacity:.6;
}
.todo-delete:hover{opacity:1;transform:scale(1.2);color:#FF6B95;}

/* ── challenge ── */
.chal-card{
  border-radius:28px;padding:18px 20px;
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
.chal-stat-num{font-size:26px;font-weight:800;color:#3D2C5E;}
.chal-stat-label{font-size:11px;color:#8B7DA0;font-weight:700;}

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
  background:linear-gradient(135deg,#FF85A2,#FFB7C5);
  color:#fff;border-bottom-right-radius:6px;
  box-shadow:0 3px 16px rgba(255,133,162,0.2);
}
.bubble.ai{
  align-self:flex-start;
  background:#fff;color:#3D2C5E;
  box-shadow:0 3px 16px rgba(232,119,153,0.1);
  border-bottom-left-radius:6px;
}
.chat-input-bar{
  flex-shrink:0;
  padding:10px 0 0;
}
.chat-input-inner{
  display:flex;gap:10px;
  background:#fff;border-radius:30px;
  padding:6px 6px 6px 18px;
  box-shadow:0 4px 20px rgba(232,119,153,0.12);
}
.chat-input-inner input{
  flex:1;border:none;outline:none;
  font-family:'Quicksand',sans-serif;
  font-size:14px;font-weight:600;color:#3D2C5E;
  background:none;
}
.chat-input-inner input::placeholder{color:#E8C4B8;}
.chat-send{
  width:40px;height:40px;border-radius:50%;border:none;
  background:linear-gradient(135deg,#FF6B95,#FF85A2);
  cursor:pointer;font-size:16px;color:#fff;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 16px rgba(255,107,149,0.35);
  transition:all .3s cubic-bezier(.16,1,.3,1);
}
.chat-send:hover{transform:scale(1.1);}
.chat-send:active{transform:scale(0.95);}

/* ── typing indicator ── */
.typing{display:flex;gap:5px;align-items:center;padding:8px 0;}
.dot{
  width:8px;height:8px;border-radius:50%;
  background:#FFB7C5;
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
  background:rgba(62,35,55,0.35);
  backdrop-filter:blur(4px);
  z-index:99;display:flex;
  align-items:flex-end;justify-content:center;
  animation:overlayIn .2s ease;
}
@keyframes overlayIn{from{opacity:0}to{opacity:1}}
.modal{
  background:#fff;border-radius:34px 34px 0 0;
  padding:28px 22px 30px;
  width:100%;max-width:420px;
  animation:modalSlideUp .35s cubic-bezier(.16,1,.3,1);
}
@keyframes modalSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.modal h3{
  font-family:'Fredoka',sans-serif;
  font-size:22px;font-weight:600;color:#E8779A;
  margin-bottom:18px;
}
.modal input,.modal select{
  width:100%;
  border:2.5px solid #FFE0EC;
  border-radius:18px;
  padding:12px 16px;
  font-family:'Quicksand',sans-serif;
  font-size:15px;font-weight:600;color:#3D2C5E;
  outline:none;margin-bottom:12px;
  background:#FFF8FA;
  transition:border-color .25s;
}
.modal input:focus,.modal select:focus{border-color:#FF85A2;}
.modal input::placeholder{color:#E8C4B8;}
.emoji-grid{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:8px;}
.emoji-btn{
  width:40px;height:40px;border-radius:14px;
  border:2.5px solid #FFE0EC;background:#FFF8FA;
  font-size:18px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:all .2s cubic-bezier(.16,1,.3,1);
}
.emoji-btn:hover{transform:scale(1.1);border-color:#FFB7C5;}
.emoji-btn.sel{border-color:#FF85A2;background:#FFE8F0;transform:scale(1.1);}
.custom-emoji-row{
  display:flex;gap:8px;align-items:center;margin-bottom:14px;
}
.custom-emoji-input{
  flex:1;
  border:2.5px dashed #FFE0EC;border-radius:14px;
  padding:8px 14px;
  font-size:22px;text-align:center;
  font-family:'Quicksand',sans-serif;
  outline:none;background:#FFF8FA;
  transition:border-color .25s;
  width:60px;max-width:60px;
}
.custom-emoji-input:focus{border-color:#FF85A2;}
.custom-emoji-hint{
  font-size:11px;color:#D4A0B0;font-weight:600;
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
.color-dot.sel{border-color:#3D2C5E;transform:scale(1.15);}
.btn-pri{
  width:100%;padding:14px;
  border-radius:22px;border:none;
  background:linear-gradient(135deg,#FF6B95,#FF85A2);
  color:#fff;
  font-family:'Fredoka',sans-serif;
  font-size:18px;font-weight:600;
  cursor:pointer;letter-spacing:.5px;
  box-shadow:0 6px 24px rgba(255,107,149,0.35);
  transition:all .3s cubic-bezier(.16,1,.3,1);
}
.btn-pri:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(255,107,149,0.45);}
.btn-pri:active{transform:translateY(0);}
.label-text{
  font-size:13px;font-weight:700;color:#D4A0B0;margin-bottom:8px;
}

/* ── empty state ── */
.empty-state{
  text-align:center;padding:32px 0;
  color:#E8C4B8;font-size:15px;font-weight:700;
}
`;

/* ─── Cat Mascot SVG ─────────────────────────────────────── */
function CatMascot() {
  return (
    <svg className="cat-mascot" viewBox="0 0 80 80" fill="none">
      {/* ears */}
      <path d="M18 28 L10 8 L30 22Z" fill="#FFF" stroke="#FFB7C5" strokeWidth="2"/>
      <path d="M62 28 L70 8 L50 22Z" fill="#FFF" stroke="#FFB7C5" strokeWidth="2"/>
      <path d="M20 26 L14 12 L28 22Z" fill="#FFE0EC"/>
      <path d="M60 26 L66 12 L52 22Z" fill="#FFE0EC"/>
      {/* head */}
      <circle cx="40" cy="42" r="26" fill="#FFF" stroke="#FFB7C5" strokeWidth="2.5"/>
      {/* blush */}
      <circle cx="22" cy="48" r="6" fill="#FFE0EC" opacity=".7"/>
      <circle cx="58" cy="48" r="6" fill="#FFE0EC" opacity=".7"/>
      {/* eyes */}
      <circle cx="32" cy="40" r="3.5" fill="#3D2C5E"/>
      <circle cx="48" cy="40" r="3.5" fill="#3D2C5E"/>
      <circle cx="33.5" cy="38.5" r="1.2" fill="#FFF"/>
      <circle cx="49.5" cy="38.5" r="1.2" fill="#FFF"/>
      {/* nose & mouth */}
      <ellipse cx="40" cy="47" rx="2" ry="1.5" fill="#FFB7C5"/>
      <path d="M36 50 Q40 54 44 50" stroke="#FFB7C5" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* whiskers */}
      <line x1="8" y1="42" x2="26" y2="44" stroke="#E8C4B8" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="8" y1="48" x2="26" y2="48" stroke="#E8C4B8" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="54" y1="44" x2="72" y2="42" stroke="#E8C4B8" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="54" y1="48" x2="72" y2="48" stroke="#E8C4B8" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── Main App ────────────────────────────────────────────── */
export default function App() {
  const [tab, setTab] = useState("habits");
  const [habits, setHabits] = useState(seedHabits);
  const [todos, setTodos] = useState(seedTodos);
  const [challenges, setChallenges] = useState(seedChallenges);
  const [modal, setModal] = useState(null);
  const [tabKey, setTabKey] = useState(0);

  const todayStr = today();
  const dow = new Date().toLocaleDateString("en-US",{weekday:"long"});
  const dateStr = new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});

  function switchTab(t) {
    if (t !== tab) {
      setTab(t);
      setTabKey(k => k + 1);
    }
  }

  const NAV_ITEMS = [
    ["habits","🌸","Habits"],
    ["todo","✅","To-do"],
    ["challenges","🔥","Challenges"],
    ["ai","🐱","Neko-chan"],
  ];

  return (
    <>
      <style>{STYLE}</style>
      <div className="kw-app">
        {/* header */}
        <div className="kw-header">
          <div>
            <div className="kw-title">✿ Kawaii Habits</div>
            <div className="kw-date">{dow}, {dateStr} 🌸</div>
          </div>
          <CatMascot />
        </div>

        {/* body */}
        <div className="kw-body">
          <div className="tab-content" key={tabKey}>
            {tab==="habits"     && <HabitsTab habits={habits} setHabits={setHabits} setModal={setModal} todayStr={todayStr}/>}
            {tab==="todo"       && <TodoTab todos={todos} setTodos={setTodos} setModal={setModal}/>}
            {tab==="challenges" && <ChallengesTab challenges={challenges} setChallenges={setChallenges} setModal={setModal} todayStr={todayStr}/>}
            {tab==="ai"         && <NekoChanTab habits={habits} todos={todos} challenges={challenges}/>}
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
      </div>
    </>
  );
}

/* ─── Habits Tab ─────────────────────────────────────────── */
function HabitsTab({habits,setHabits,setModal,todayStr}) {
  const done = habits.filter(h=>h.completedDates.includes(todayStr)).length;
  const pct = habits.length ? Math.round(done/habits.length*100) : 0;

  function toggle(id) {
    setHabits(prev=>prev.map(h=>{
      if(h.id!==id) return h;
      const has = h.completedDates.includes(todayStr);
      return {...h, completedDates: has ? h.completedDates.filter(d=>d!==todayStr) : [...h.completedDates,todayStr]};
    }));
  }

  return (
    <>
      {/* sticker progress card */}
      <div className="sticker-card">
        <span className="sparkle" style={{top:8,right:20}}>✨</span>
        <span className="sparkle" style={{top:22,right:52,animationDelay:".8s",fontSize:14}}>✨</span>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:1}}>
          <div>
            <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,fontWeight:700,color:"#E8779A"}}>
              {pct===100?"All done! 🎉":`${done}/${habits.length} done`}
            </div>
            <div style={{fontSize:13,color:"#D4A0B0",fontWeight:600,marginTop:4}}>
              {pct===100?"You're a superstar today~":"Keep going, you've got this! ✨"}
            </div>
          </div>
          <div style={{fontSize:44,filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.1))"}}>
            {pct===100?"🏆":pct>50?"⭐":"🌱"}
          </div>
        </div>
        <div className="prog-bar" style={{marginTop:14,position:"relative",zIndex:1}}>
          <div className="prog-fill" style={{width:`${pct}%`}}/>
        </div>
      </div>

      <div className="section-head">
        <div className="section-title">Today's Habits 🌸</div>
        <button className="fab" onClick={()=>setModal("habit")} style={{width:48,height:48,fontSize:24}}>+</button>
      </div>

      {habits.length === 0 && <div className="empty-state">Add your first habit~ ✨</div>}

      {habits.map(h=>{
        const checked = h.completedDates.includes(todayStr);
        const streak = calcStreak(h.completedDates);
        return (
          <div key={h.id} className="card-sm">
            <div className="habit-row">
              <div
                className={`habit-check${checked?" checked":""}`}
                style={{
                  background: checked ? (h.color || "#8FD4B4") : "#FFF8FA",
                  borderColor: checked ? "transparent" : "#FFD6E0"
                }}
                onClick={()=>toggle(h.id)}
              >
                {checked
                  ? <span style={{color:"#fff",fontSize:18,fontWeight:900}}>✓</span>
                  : <span style={{opacity:.4,fontSize:16}}>{h.emoji}</span>
                }
              </div>
              <div className="habit-info">
                <div className={`habit-name${checked?" done":""}`}>{h.emoji} {h.name}</div>
                <div className="habit-streak">🔥 {streak} day streak</div>
              </div>
            </div>
          </div>
        );
      })}
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

  return (
    <>
      <div className="sticker-card" style={{background:"linear-gradient(145deg,#F0FFF4,#E8FAF0)"}}>
        <span className="sparkle" style={{top:10,right:24}}>🍀</span>
        <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,fontWeight:700,color:"#6BAF8D"}}>
          {left===0?"All done! 🎉":`${left} task${left!==1?"s":""} left`}
        </div>
        <div style={{fontSize:13,color:"#A0C8B0",fontWeight:600,marginTop:4}}>Tick them off one by one~ 🍀</div>
      </div>

      <div className="section-head">
        <div className="section-title" style={{color:"#6BAF8D"}}>To-do List ✅</div>
        <button className="fab" onClick={()=>setModal("todo")} style={{width:48,height:48,fontSize:24,background:"linear-gradient(135deg,#6BAF8D,#8FD4B4)"}}>+</button>
      </div>

      <div className="card">
        {todos.length===0 && <div className="empty-state">No tasks yet! Add one ✨</div>}
        {todos.map(t=>(
          <div key={t.id} className="todo-row">
            <div className={`todo-check${t.done?" done":""}`} onClick={()=>toggle(t.id)}>
              {t.done && <span style={{color:"#fff",fontSize:12,fontWeight:900}}>✓</span>}
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

  return (
    <>
      <div className="section-head">
        <div className="section-title">Challenges 🔥</div>
        <button className="fab" onClick={()=>setModal("challenge")} style={{width:48,height:48,fontSize:24,background:"linear-gradient(135deg,#FF9AA2,#FFB7C5)"}}>+</button>
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
                <div className="chal-title" style={{color:"#3D2C5E"}}>{c.emoji} {c.name}</div>
                <div className="chal-sub">{c.targetDays}-day challenge • Day {elapsed}</div>
              </div>
              <button
                className="chal-btn"
                style={{
                  background:checkedToday?"#fff":"rgba(255,255,255,.55)",
                  color:checkedToday?"#E8779A":"#3D2C5E"
                }}
                onClick={()=>toggleDay(c.id)}
              >
                {checkedToday?"✓ Done":"Check in"}
              </button>
            </div>
            <div style={{display:"flex",gap:24,marginTop:14}}>
              <div className="chal-stat">
                <div className="chal-stat-num">{streak}</div>
                <div className="chal-stat-label">streak 🔥</div>
              </div>
              <div className="chal-stat">
                <div className="chal-stat-num">{c.completedDates.length}</div>
                <div className="chal-stat-label">/ {c.targetDays} days</div>
              </div>
              <div className="chal-stat">
                <div className="chal-stat-num">{progress}%</div>
                <div className="chal-stat-label">complete</div>
              </div>
            </div>
            <div className="prog-bar" style={{marginTop:12,background:"rgba(255,255,255,.4)"}}>
              <div style={{height:"100%",width:`${progress}%`,background:"rgba(255,255,255,.75)",borderRadius:12,transition:"width .5s cubic-bezier(.16,1,.3,1)"}}/>
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ─── Neko-chan Tab ───────────────────────────────────────── */
function NekoChanTab({habits,todos,challenges}) {
  const [messages, setMessages] = useState([
    {role:"assistant",content:"Nyaa~ I'm Neko-chan, your kawaii habit companion! 🐱🌸 Ask me to plan your day, motivate you, or check your progress! ✨\n\nTry telling me your name so I can remember you~ 💕"}
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(()=>{
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  },[messages,loading]);

  function send() {
    if(!input.trim()||loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...messages,{role:"user",content:userMsg}];
    setMessages(newMsgs);
    setLoading(true);

    setTimeout(()=>{
      const reply = getNekoResponse(userMsg, habits, todos, challenges);
      setMessages(p=>[...p,{role:"assistant",content:reply}]);
      setLoading(false);
    }, 600 + Math.random()*800);
  }

  return (
    <div className="neko-container">
      <div className="sticker-card" style={{background:"linear-gradient(145deg,#FFF8FA,#F0E6FF)",textAlign:"center",flexShrink:0}}>
        <div style={{fontSize:40,marginBottom:4}}>🐱</div>
        <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:20,fontWeight:700,color:"#E8779A"}}>Neko-chan ✨</div>
        <div style={{fontSize:13,color:"#D4A0B0",fontWeight:600,marginTop:4}}>Your kawaii habit companion~</div>
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
          <button className="chat-send" onClick={send}>➤</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Habit Modal ────────────────────────────────────── */
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
        <h3>New Habit 🌸</h3>
        <input placeholder="What habit do you want to build?" value={name} onChange={e=>setName(e.target.value)}/>
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
        <button className="btn-pri" onClick={()=>name.trim()&&onAdd({name:name.trim(),emoji,color})}>Add Habit ✨</button>
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
        <button className="btn-pri" style={{background:"linear-gradient(135deg,#6BAF8D,#8FD4B4)",boxShadow:"0 6px 24px rgba(107,175,141,0.35)"}} onClick={()=>name.trim()&&onAdd({name:name.trim(),emoji,category:cat})}>Add Task ✨</button>
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
        <button className="btn-pri" style={{background:"linear-gradient(135deg,#FF9AA2,#FFB7C5)",boxShadow:"0 6px 24px rgba(255,154,162,0.35)"}} onClick={()=>name.trim()&&onAdd({name:name.trim(),emoji,targetDays:days,startDate:today()})}>Start Challenge 🚀</button>
      </div>
    </div>
  );
}
