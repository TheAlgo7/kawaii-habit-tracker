import { useEffect, useMemo, useRef, useState } from "react";
import { formatToday, today } from "./date";
import { getLocalReply, getMood, moodAssets, moodLayout, moodMessages } from "./neko";
import {
  habitStatus,
  habitStreak,
  isDoneOn,
  isScheduledOn,
  normalizeHabit,
  setNote,
  setSkip,
  toggleComplete,
  toggleTiny,
} from "./habits";
import { computeTrust, computeWorld, daysSinceLastCare, nextDecor } from "./world";
import { useAppState } from "./useAppState";
import { Onboarding } from "./Onboarding";
import { HabitEditor, HabitMenu, NotePrompt, SkipSheet } from "./HabitEditor";
import { WorldPanel } from "./WorldPanel";
import { Settings } from "./Settings";
import { Modal } from "./Modal";

const navItems = [
  ["home", "🏠", "Home"],
  ["tasks", "☑️", "To-Dos"],
  ["world", "🌱", "World"],
  ["neko", "🐱", "Neko"],
];

const PRAISE = [
  "Done! The world feels a little warmer 🌸",
  "Lovely. That counted, however small ✨",
  "Nyaa~ that's the loop. One kind thing at a time 💗",
  "A gentle win. Neko noticed 🐱",
];

function nextId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function statusOrder(status) {
  return { due: 0, tiny: 1, done: 2, skipped: 3, off: 4 }[status] ?? 5;
}

export function KawaiiApp() {
  const [state, { update }] = useAppState();
  const todayStr = today();
  const date = formatToday();

  const [activeTab, setActiveTab] = useState("home");
  const [modal, setModal] = useState(null); // { type, habit }
  const [feedback, setFeedback] = useState("");
  const feedbackTimer = useRef(null);

  const { nekoName, worldName } = state.profile;
  const allHabits = state.habits;
  const activeHabits = useMemo(() => allHabits.filter((h) => !h.archivedAt), [allHabits]);
  const world = useMemo(() => computeWorld(allHabits, todayStr), [allHabits, todayStr]);
  const mood = getMood(activeHabits, todayStr);

  const scheduled = activeHabits.filter((h) => isScheduledOn(h, todayStr));
  const completed = scheduled.filter((h) => isDoneOn(h, todayStr)).length;
  const progress = scheduled.length ? Math.round((completed / scheduled.length) * 100) : 0;
  const bestStreak = activeHabits.reduce((max, h) => Math.max(max, habitStreak(h, todayStr)), 0);
  const gap = daysSinceLastCare(activeHabits, todayStr);
  const showRecovery = activeHabits.length > 0 && completed === 0 && gap !== null && gap >= 2;

  useEffect(() => () => clearTimeout(feedbackTimer.current), []);

  function flash(message) {
    if (!message) return;
    setFeedback(message);
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(""), 4000);
  }

  // Apply a pure habit mutation and surface a world-growth message if a
  // completion just crossed a decor unlock threshold.
  function applyHabit(id, mutator, message) {
    const before = computeTrust(allHabits);
    const after = computeTrust(allHabits.map((h) => (h.id === id ? mutator(h) : h)));
    const upcoming = nextDecor(before);
    update((s) => ({ ...s, habits: s.habits.map((h) => (h.id === id ? mutator(h) : h)) }));
    if (upcoming && after > before && after >= upcoming.unlockAt) {
      flash(`${upcoming.emoji} You unlocked ${upcoming.name}! Your world grew.`);
    } else {
      flash(message);
    }
  }

  function completeHabit(h) {
    const wasDone = h.completedDates.includes(todayStr);
    applyHabit(h.id, (hh) => toggleComplete(hh, todayStr), wasDone ? null : PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  }
  function tinyHabit(h) {
    const wasTiny = h.tinyDates.includes(todayStr);
    applyHabit(h.id, (hh) => toggleTiny(hh, todayStr), wasTiny ? null : "Tiny still counts 🌱 Neko's proud.");
    setModal(null);
  }
  function skipHabit(h, reason) {
    applyHabit(h.id, (hh) => setSkip(hh, todayStr, reason), "Rest is care too 💗 Your streak is safe.");
    setModal(null);
  }
  function noteHabit(h, text) {
    update((s) => ({ ...s, habits: s.habits.map((x) => (x.id === h.id ? setNote(x, todayStr, text) : x)) }));
    setModal(null);
  }
  function resetToday(h) {
    update((s) => ({
      ...s,
      habits: s.habits.map((x) => {
        if (x.id !== h.id) return x;
        const skips = { ...x.skipsByDate };
        delete skips[todayStr];
        return {
          ...x,
          completedDates: x.completedDates.filter((d) => d !== todayStr),
          tinyDates: x.tinyDates.filter((d) => d !== todayStr),
          skipsByDate: skips,
        };
      }),
    }));
    setModal(null);
  }
  function archiveHabit(h) {
    update((s) => ({ ...s, habits: s.habits.map((x) => (x.id === h.id ? { ...x, archivedAt: new Date().toISOString() } : x)) }));
    setModal(null);
    flash(`${h.name} archived. You can always start it again 🌿`);
  }
  function saveHabit(partial) {
    if (modal?.habit) {
      update((s) => ({ ...s, habits: s.habits.map((x) => (x.id === modal.habit.id ? { ...x, ...partial } : x)) }));
    } else {
      update((s) => ({ ...s, habits: [...s.habits, normalizeHabit({ ...partial, id: nextId(), order: s.habits.length })] }));
    }
    setModal(null);
  }

  function addTask(task) {
    update((s) => ({ ...s, tasks: [...s.tasks, { ...task, id: nextId(), done: false }] }));
    setModal(null);
  }
  function toggleTask(id) {
    update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
  }
  function deleteTask(id) {
    update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  }

  function addChallenge(challenge) {
    update((s) => ({ ...s, challenges: [...s.challenges, { ...challenge, id: nextId(), startDate: todayStr, completedDates: [], archivedAt: null }] }));
    setModal(null);
  }
  function toggleChallenge(id) {
    update((s) => ({
      ...s,
      challenges: s.challenges.map((c) => {
        if (c.id !== id) return c;
        const checked = c.completedDates.includes(todayStr);
        return { ...c, completedDates: checked ? c.completedDates.filter((d) => d !== todayStr) : [...c.completedDates, todayStr] };
      }),
    }));
  }
  function archiveChallenge(id) {
    update((s) => ({ ...s, challenges: s.challenges.map((c) => (c.id === id ? { ...c, archivedAt: new Date().toISOString() } : c)) }));
    flash("Challenge complete, beautifully done 🏆");
  }

  function finishOnboarding(result) {
    update((s) => ({
      ...s,
      profile: { ...s.profile, ...result.profile },
      preferences: { ...s.preferences, ...result.preferences },
      habits: result.habits,
    }));
  }

  if (!state.profile.onboardedAt) {
    return <Onboarding onFinish={finishOnboarding} />;
  }

  return (
    <main className="kw-shell">
      <div className="sakura sakura-a" />
      <div className="sakura sakura-b" />
      <section className="phone-frame" aria-label="Kawaii Habit Tracker">
        <Header date={date} mood={mood} worldName={worldName} onOpenSettings={() => setModal({ type: "settings" })} />

        <div className="screen-scroll">
          {activeTab === "home" && (
            <HomePanel
              nekoName={nekoName}
              mood={mood}
              habits={scheduled.concat(activeHabits.filter((h) => !isScheduledOn(h, todayStr)))}
              todayStr={todayStr}
              completed={completed}
              total={scheduled.length}
              progress={progress}
              bestStreak={bestStreak}
              feedback={feedback}
              showRecovery={showRecovery}
              onRecovery={() => flash("It's okay to start the smallest version today 💗")}
              onComplete={completeHabit}
              onMenu={(h) => setModal({ type: "menu", habit: h })}
              onAdd={() => setModal({ type: "habit" })}
            />
          )}
          {activeTab === "tasks" && <TasksPanel tasks={state.tasks} onAdd={() => setModal({ type: "task" })} onToggle={toggleTask} onDelete={(task) => setModal({ type: "taskDelete", task })} />}
          {activeTab === "world" && (
            <WorldPanel
              world={world}
              worldName={worldName}
              habits={activeHabits}
              challenges={state.challenges}
              onAddChallenge={() => setModal({ type: "challenge" })}
              onToggleChallenge={toggleChallenge}
              onArchiveChallenge={archiveChallenge}
              todayStr={todayStr}
            />
          )}
          {activeTab === "neko" && (
            <NekoPanel
              nekoName={nekoName}
              userName={state.profile.userName}
              habits={activeHabits}
              tasks={state.tasks}
              challenges={state.challenges}
              messages={state.chat}
              setMessages={(updater) => update((s) => ({ ...s, chat: (typeof updater === "function" ? updater(s.chat) : updater).slice(-40) }))}
            />
          )}
        </div>

        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </section>

      {modal?.type === "habit" && <HabitEditor habit={null} onClose={() => setModal(null)} onSave={saveHabit} />}
      {modal?.type === "edit" && <HabitEditor habit={modal.habit} onClose={() => setModal(null)} onSave={saveHabit} />}
      {modal?.type === "menu" && (
        <HabitMenu
          habit={modal.habit}
          todayStr={todayStr}
          onClose={() => setModal(null)}
          onComplete={() => {
            completeHabit(modal.habit);
            setModal(null);
          }}
          onTiny={() => tinyHabit(modal.habit)}
          onSkip={() => setModal({ type: "skip", habit: modal.habit })}
          onNote={() => setModal({ type: "note", habit: modal.habit })}
          onEdit={() => setModal({ type: "edit", habit: modal.habit })}
          onArchive={() => archiveHabit(modal.habit)}
          onResetToday={() => resetToday(modal.habit)}
        />
      )}
      {modal?.type === "skip" && <SkipSheet habit={modal.habit} onClose={() => setModal(null)} onSkip={(reason) => skipHabit(modal.habit, reason)} />}
      {modal?.type === "note" && <NotePrompt habit={modal.habit} todayStr={todayStr} onClose={() => setModal(null)} onSave={(text) => noteHabit(modal.habit, text)} />}
      {modal?.type === "task" && (
        <EntryModal
          title="New to-do"
          fields={[
            ["name", "To-do", "Reply to emails"],
            ["emoji", "Emoji", "✓"],
            ["category", "Category", "Personal"],
          ]}
          transform={(d) => ({ name: d.name, emoji: d.emoji || "✓", category: d.category || "Personal" })}
          onClose={() => setModal(null)}
          onSave={addTask}
        />
      )}
      {modal?.type === "challenge" && (
        <EntryModal
          title="New growth challenge"
          fields={[
            ["name", "Challenge", "No junk food"],
            ["emoji", "Emoji", "🌱"],
            ["targetDays", "Days", "30"],
          ]}
          transform={(d) => ({ name: d.name, emoji: d.emoji || "🌱", targetDays: Math.max(1, Number(d.targetDays) || 30) })}
          onClose={() => setModal(null)}
          onSave={addChallenge}
        />
      )}
      {modal?.type === "taskDelete" && (
        <Modal title="Remove to-do" onClose={() => setModal(null)} className="entry-modal action-sheet">
          <h2>Remove this to-do?</h2>
          <p className="sheet-tiny">“{modal.task.name}” will be removed from your list.</p>
          <div className="modal-actions">
            <button type="button" onClick={() => setModal(null)}>
              Keep it
            </button>
            <button
              type="button"
              className="sheet-danger"
              onClick={() => {
                deleteTask(modal.task.id);
                setModal(null);
              }}
            >
              Remove
            </button>
          </div>
        </Modal>
      )}
      {modal?.type === "settings" && <Settings state={state} onUpdate={update} onClose={() => setModal(null)} />}
    </main>
  );
}

function Header({ date, mood, onOpenSettings, worldName }) {
  return (
    <header className="app-header">
      <div className="title-block">
        <span className="title-world">{worldName || "Kawaii"}</span>
        <small>
          {date.weekday}, {date.date} 🌸
        </small>
      </div>
      <button className="settings-gear" onClick={onOpenSettings} type="button" aria-label="Open settings">
        ⚙
      </button>
      <img className="avatar" src={moodAssets[mood]} alt="" />
    </header>
  );
}

function HomePanel({ bestStreak, completed, feedback, habits, mood, nekoName, onAdd, onComplete, onMenu, onRecovery, progress, showRecovery, todayStr, total }) {
  return (
    <>
      <section className="hero-card">
        <img className="hero-bg" src="/background-transparent-sky.webp" alt="" />
        <div className="hero-scene" aria-hidden="true">
          <span className="tree left" />
          <span className="tree right" />
          <span className="petal p1">🌸</span>
          <span className="petal p2">✦</span>
          <span className="petal p3">🌸</span>
          <span className="petal p4">✧</span>
          <span className="petal p5">🌸</span>
        </div>
        <div className="companion-copy">
          <h1>{nekoName || "Neko-chan"} ✨</h1>
          <p>Your kawaii habit companion~</p>
        </div>
        <div className="neko-stage" style={moodLayout[mood]}>
          <NekoImage mood={mood} />
        </div>
        <div className="speech-card">{moodMessages[mood]} 🌸</div>
        <div className="stats-row">
          <strong>
            {completed}/{total || 0}
            <span>done today</span>
          </strong>
          <strong>
            {progress}%
            <span>complete</span>
          </strong>
        </div>
        <div className="progress-track" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="streak-line">⭐ Best streak: {bestStreak || 0} day{bestStreak === 1 ? "" : "s"}. Gently does it 🔥</p>
      </section>

      <p className="sr-feedback" role="status" aria-live="polite">
        {feedback}
      </p>
      {feedback && (
        <div className="feedback-toast" aria-hidden="true">
          {feedback}
        </div>
      )}

      {showRecovery && (
        <button type="button" className="recovery-chip" onClick={onRecovery}>
          💗 Need a softer day? Start tiny.
        </button>
      )}

      <PanelTitle title="Today's care" actionLabel="+" onAction={onAdd} />
      {habits.length === 0 ? (
        <EmptyState emoji="🌱" text="No rituals yet. Tap + to plant your first tiny habit." />
      ) : (
        <div className="list-stack">
          {[...habits]
            .sort((a, b) => statusOrder(habitStatus(a, todayStr)) - statusOrder(habitStatus(b, todayStr)))
            .map((habit) => (
              <HabitRow key={habit.id} habit={habit} todayStr={todayStr} onComplete={() => onComplete(habit)} onMenu={() => onMenu(habit)} />
            ))}
        </div>
      )}
    </>
  );
}

function HabitRow({ habit, onComplete, onMenu, todayStr }) {
  const status = habitStatus(habit, todayStr);
  const streak = habitStreak(habit, todayStr);
  const mark = status === "done" ? "✓" : status === "tiny" ? "🌱" : status === "skipped" ? "🛌" : "";
  const label =
    status === "off" ? "Not today" : status === "skipped" ? "Resting" : streak > 0 ? `🔥 ${streak}` : habit.emoji;
  return (
    <div className={`habit-row status-${status}`}>
      <button className="habit-main" type="button" onClick={onComplete} disabled={status === "off"} aria-label={`Mark ${habit.name} done`}>
        <span className="round-check" style={{ "--row-color": habit.color }} aria-hidden="true">
          {mark}
        </span>
        <span className="habit-text">
          <span className="habit-name">{habit.name}</span>
          {habit.tinyVersion && <small className="habit-tiny">🌱 {habit.tinyVersion}</small>}
        </span>
        <em className="habit-flag" aria-hidden="true">
          {label}
        </em>
      </button>
      <button className="habit-menu" type="button" onClick={onMenu} aria-label={`Options for ${habit.name}`}>
        ⋯
      </button>
    </div>
  );
}

function TasksPanel({ onAdd, onDelete, onToggle, tasks }) {
  const pending = tasks.filter((t) => !t.done).length;
  return (
    <>
      <section className="quiet-card">
        <h1>To-Dos</h1>
        <p>{pending ? `${pending} thing${pending === 1 ? " needs" : "s need"} attention.` : "All clear. Your list can breathe."}</p>
      </section>
      <PanelTitle title="To-do list" actionLabel="+" onAction={onAdd} />
      {tasks.length === 0 ? (
        <EmptyState emoji="☑️" text="Nothing here. To-dos are separate from your daily care rituals." />
      ) : (
        <div className="list-stack">
          {tasks.map((task) => (
            <div className={`habit-row${task.done ? " status-done" : ""}`} key={task.id}>
              <button className="habit-main" type="button" onClick={() => onToggle(task.id)} aria-label={`Toggle ${task.name}`}>
                <span className="round-check" aria-hidden="true">{task.done ? "✓" : ""}</span>
                <span className="habit-text">
                  <span className="habit-name">{task.name}</span>
                </span>
                <em className="habit-flag" aria-hidden="true">{task.emoji}</em>
              </button>
              <button className="habit-menu" type="button" onClick={() => onDelete(task)} aria-label={`Delete ${task.name}`}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function NekoPanel({ challenges, habits, messages, nekoName, setMessages, tasks, userName }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const quickActions = ["Plan my tiny day", "Make today easier", "I missed a few days", "Celebrate my wins"];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function send(text = input.trim()) {
    if (!text || loading) return;
    setInput("");
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const todayStr = today();
      const context = {
        doneCount: habits.filter((h) => isDoneOn(h, todayStr)).length,
        totalHabits: habits.length,
        pendingTodos: tasks.filter((t) => !t.done).length,
        // Progress is real check-ins, matching the World screen, never
        // calendar time. A challenge is "12/30 days done", not "Day 12/30".
        activeChallenges: challenges
          .filter((c) => !c.archivedAt)
          .map((c) => ({
            name: c.name,
            emoji: c.emoji,
            targetDays: c.targetDays,
            doneDays: c.completedDates.length,
          })),
        userName,
      };
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, context }),
      });
      if (!response.ok) throw new Error("chat");
      const data = await response.json();
      if (!data.reply) throw new Error("empty");
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: getLocalReply(text, habits, tasks, challenges, userName) }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="chat-panel">
      <div className="chat-intro">
        <img src={moodAssets.happy} alt="" width="48" height="48" loading="lazy" />
        <span>
          <strong>{nekoName || "Neko-chan"}</strong>
          <small>Your soft little coach</small>
        </span>
      </div>
      <div className="quick-actions">
        {quickActions.map((action) => (
          <button key={action} onClick={() => send(action)} type="button">
            {action}
          </button>
        ))}
      </div>
      <div className="chat-log" ref={scrollRef}>
        {messages.map((message, index) => (
          <div className={`bubble ${message.role}`} key={`${message.role}-${index}`}>
            {message.content}
          </div>
        ))}
        {loading && <div className="bubble assistant">{nekoName || "Neko"} is thinking...</div>}
      </div>
      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <input aria-label={`Message ${nekoName || "Neko"}`} onChange={(event) => setInput(event.target.value)} placeholder={`Talk to ${nekoName || "Neko-chan"}...`} value={input} />
        <button type="submit" aria-label="Send message">➤</button>
      </form>
    </section>
  );
}

function NekoImage({ mood }) {
  return (
    <img
      className={`neko-hero mood-${mood}`}
      key={mood}
      src={moodAssets[mood] || moodAssets.content}
      alt="Neko companion"
      width="240"
      height="240"
    />
  );
}

function EmptyState({ emoji, text }) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">{emoji}</span>
      <p>{text}</p>
    </div>
  );
}

function PanelTitle({ actionLabel, onAction, title }) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      {onAction && (
        <button aria-label={`Add ${title}`} onClick={onAction} type="button">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function BottomNav({ activeTab, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {navItems.map(([key, icon, label]) => (
        <button
          className={activeTab === key ? "active" : ""}
          key={key}
          onClick={() => onChange(key)}
          type="button"
          aria-label={label}
          aria-current={activeTab === key ? "page" : undefined}
        >
          <span aria-hidden="true">{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}

function EntryModal({ fields, onClose, onSave, title, transform }) {
  const initial = useMemo(
    () =>
      fields.reduce((data, [key, , placeholder]) => {
        data[key] = key === "name" ? "" : placeholder;
        return data;
      }, {}),
    [fields],
  );
  const [form, setForm] = useState(initial);

  function submit(event) {
    event.preventDefault();
    if (!form.name?.trim()) return;
    onSave(transform({ ...form, name: form.name.trim() }));
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit}>
        <h2>{title}</h2>
        {fields.map(([key, label, placeholder]) => (
          <label key={key}>
            {label}
            <input
              onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              placeholder={placeholder}
              type={key === "targetDays" ? "number" : "text"}
              value={form[key]}
            />
          </label>
        ))}
        <div className="modal-actions">
          <button onClick={onClose} type="button">
            Cancel
          </button>
          <button type="submit">Save</button>
        </div>
      </form>
    </Modal>
  );
}
