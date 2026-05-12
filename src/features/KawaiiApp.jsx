import { useEffect, useMemo, useRef, useState } from "react";
import { calcStreak, daysBetween, formatToday, today } from "./date";
import { moodAssets, moodLayout, moodMessages, getLocalReply, getMood } from "./neko";
import { HABIT_COLORS, seedChallenges, seedHabits, seedTasks } from "./seed";
import { loadState, saveState, STORAGE_KEYS } from "./storage";

const navItems = [
  ["home", "🏠", "Home"],
  ["tasks", "☑️", "Tasks"],
  ["growth", "🌱", "Growth"],
  ["neko", "🐱", "Neko"],
];

function nextId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function readUserName() {
  const memory = loadState(STORAGE_KEYS.name, { userName: null });
  return memory?.userName || null;
}

export function KawaiiApp() {
  const todayStr = today();
  const date = formatToday();
  const [activeTab, setActiveTab] = useState("home");
  const [habits, setHabits] = useState(() => loadState(STORAGE_KEYS.habits, seedHabits));
  const [tasks, setTasks] = useState(() => loadState(STORAGE_KEYS.tasks, seedTasks));
  const [challenges, setChallenges] = useState(() => loadState(STORAGE_KEYS.challenges, seedChallenges));
  const [worldName, setWorldName] = useState(() => loadState(STORAGE_KEYS.worldName, "Kawaii"));
  const [modal, setModal] = useState(null);
  const [messages, setMessages] = useState(() =>
    loadState(STORAGE_KEYS.chat, [
      { role: "assistant", content: "Nyaa~ I'm here. Tell me what kind of day we're growing today. 🌸" },
    ]),
  );

  const mood = getMood(habits, todayStr);
  const completed = habits.filter((habit) => habit.completedDates.includes(todayStr)).length;
  const progress = habits.length ? Math.round((completed / habits.length) * 100) : 0;
  const bestStreak = habits.reduce((max, habit) => Math.max(max, calcStreak(habit.completedDates)), 0);

  useEffect(() => saveState(STORAGE_KEYS.habits, habits), [habits]);
  useEffect(() => saveState(STORAGE_KEYS.tasks, tasks), [tasks]);
  useEffect(() => saveState(STORAGE_KEYS.challenges, challenges), [challenges]);
  useEffect(() => saveState(STORAGE_KEYS.worldName, worldName), [worldName]);
  useEffect(() => saveState(STORAGE_KEYS.chat, messages.slice(-40)), [messages]);

  function toggleHabit(id) {
    setHabits((current) =>
      current.map((habit) => {
        if (habit.id !== id) return habit;
        const checked = habit.completedDates.includes(todayStr);
        return {
          ...habit,
          completedDates: checked
            ? habit.completedDates.filter((date) => date !== todayStr)
            : [...habit.completedDates, todayStr],
        };
      }),
    );
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );
  }

  function toggleChallenge(id) {
    setChallenges((current) =>
      current.map((challenge) => {
        if (challenge.id !== id) return challenge;
        const checked = challenge.completedDates.includes(todayStr);
        return {
          ...challenge,
          completedDates: checked
            ? challenge.completedDates.filter((date) => date !== todayStr)
            : [...challenge.completedDates, todayStr],
        };
      }),
    );
  }

  return (
    <main className="kw-shell">
      <div className="sakura sakura-a" />
      <div className="sakura sakura-b" />
      <section className="phone-frame" aria-label="Kawaii Habit Tracker">
        <Header
          date={date}
          mood={mood}
          worldName={worldName}
          onRename={() => setModal("world")}
        />

        <div className="screen-scroll">
          {activeTab === "home" && (
            <HomePanel
              bestStreak={bestStreak}
              completed={completed}
              habits={habits}
              mood={mood}
              onAdd={() => setModal("habit")}
              onToggle={toggleHabit}
              progress={progress}
              todayStr={todayStr}
              total={habits.length}
            />
          )}
          {activeTab === "tasks" && (
            <TasksPanel tasks={tasks} onAdd={() => setModal("task")} onToggle={toggleTask} />
          )}
          {activeTab === "growth" && (
            <GrowthPanel
              challenges={challenges}
              onAdd={() => setModal("challenge")}
              onToggle={toggleChallenge}
              todayStr={todayStr}
            />
          )}
          {activeTab === "neko" && (
            <NekoPanel
              challenges={challenges}
              habits={habits}
              messages={messages}
              setMessages={setMessages}
              tasks={tasks}
            />
          )}
        </div>

        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </section>

      {modal === "habit" && (
        <HabitModal
          onClose={() => setModal(null)}
          onSave={(habit) => {
            setHabits((current) => [...current, { ...habit, id: nextId(), completedDates: [] }]);
            setModal(null);
          }}
        />
      )}
      {modal === "task" && (
        <TaskModal
          onClose={() => setModal(null)}
          onSave={(task) => {
            setTasks((current) => [...current, { ...task, id: nextId(), done: false }]);
            setModal(null);
          }}
        />
      )}
      {modal === "challenge" && (
        <ChallengeModal
          onClose={() => setModal(null)}
          onSave={(challenge) => {
            setChallenges((current) => [
              ...current,
              { ...challenge, id: nextId(), startDate: todayStr, completedDates: [] },
            ]);
            setModal(null);
          }}
        />
      )}
      {modal === "world" && (
        <WorldModal
          currentName={worldName}
          onClose={() => setModal(null)}
          onSave={(name) => {
            setWorldName(name);
            setModal(null);
          }}
        />
      )}
    </main>
  );
}

function Header({ date, mood, onRename, worldName }) {
  return (
    <header className="app-header">
      <button className="title-button" onClick={onRename} type="button">
        <span>{worldName || "Kawaii"}</span>
        <small>
          {date.weekday}, {date.date} 🌸
        </small>
      </button>
      <div className="header-icons" aria-hidden="true">
        <span>🌙</span>
        <span>🌸</span>
        <span>🎂</span>
        <span>🌤️</span>
      </div>
      <img className="avatar" src={moodAssets[mood]} alt="" />
    </header>
  );
}

function HomePanel({ bestStreak, completed, habits, mood, onAdd, onToggle, progress, todayStr, total }) {
  return (
    <>
      <section className="hero-card">
        <img className="hero-bg" src="/background-transparent-sky.png" alt="" />
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
          <h1>Neko-chan ✨</h1>
          <p>Your kawaii habit companion~</p>
        </div>
        <div className="world-shelf" aria-hidden="true">
          <span>🌱</span>
          <span>💡</span>
          <span>📖</span>
          <span>💐</span>
          <span>🎵</span>
        </div>
        <div className="neko-stage" style={moodLayout[mood]}>
          <img
            className={`neko-hero mood-${mood}`}
            key={mood}
            src={moodAssets[mood]}
            alt="Neko-chan"
          />
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
        <p className="streak-line">⭐ You're on a {bestStreak || 0}-day streak. Keep it up! 🔥</p>
      </section>

      <PanelTitle title="Today's Care Tasks" actionLabel="+" onAction={onAdd} />
      <div className="list-stack">
        {habits.map((habit) => {
          const checked = habit.completedDates.includes(todayStr);
          return (
            <button
              className={`care-row${checked ? " is-done" : ""}`}
              key={habit.id}
              onClick={() => onToggle(habit.id)}
              type="button"
            >
              <span className="round-check" style={{ "--row-color": habit.color }}>
                {checked ? "✓" : ""}
              </span>
              <span>{habit.name}</span>
              <em>{checked ? "🐱" : habit.emoji}</em>
            </button>
          );
        })}
      </div>
    </>
  );
}

function TasksPanel({ onAdd, onToggle, tasks }) {
  const pending = tasks.filter((task) => !task.done).length;

  return (
    <>
      <section className="quiet-card">
        <h1>Tasks</h1>
        <p>{pending ? `${pending} things need attention.` : "All clear. Your list can breathe."}</p>
      </section>
      <PanelTitle title="Task List" actionLabel="+" onAction={onAdd} />
      <div className="list-stack">
        {tasks.map((task) => (
          <button
            className={`care-row${task.done ? " is-done" : ""}`}
            key={task.id}
            onClick={() => onToggle(task.id)}
            type="button"
          >
            <span className="round-check">{task.done ? "✓" : ""}</span>
            <span>{task.name}</span>
            <em>{task.emoji}</em>
          </button>
        ))}
      </div>
    </>
  );
}

function GrowthPanel({ challenges, onAdd, onToggle, todayStr }) {
  return (
    <>
      <section className="quiet-card">
        <h1>Growth</h1>
        <p>Longer challenges live here, away from today's tiny care loop.</p>
      </section>
      <PanelTitle title="Active Growth" actionLabel="+" onAction={onAdd} />
      <div className="list-stack">
        {challenges.map((challenge) => {
          const elapsed = Math.max(1, daysBetween(challenge.startDate, todayStr) + 1);
          const checked = challenge.completedDates.includes(todayStr);
          const pct = Math.min(100, Math.round((elapsed / challenge.targetDays) * 100));
          return (
            <article className="growth-card" key={challenge.id}>
              <button onClick={() => onToggle(challenge.id)} type="button">
                <span className={`round-check${checked ? " checked" : ""}`}>{checked ? "✓" : ""}</span>
                <span>
                  {challenge.emoji} {challenge.name}
                  <small>
                    Day {elapsed}/{challenge.targetDays}
                  </small>
                </span>
              </button>
              <div className="progress-track mini">
                <span style={{ width: `${pct}%` }} />
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function NekoPanel({ challenges, habits, messages, setMessages, tasks }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const quickActions = ["Plan my day", "Check progress", "Motivate me"];

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
        doneCount: habits.filter((habit) => habit.completedDates.includes(todayStr)).length,
        totalHabits: habits.length,
        pendingTodos: tasks.filter((task) => !task.done).length,
        activeChallenges: challenges,
        userName: readUserName(),
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
      setMessages((current) => [
        ...current,
        { role: "assistant", content: getLocalReply(text, habits, tasks, challenges, readUserName()) },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="chat-panel">
      <div className="chat-intro">
        <img src={moodAssets.happy} alt="" />
        <span>
          <strong>Neko-chan</strong>
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
        {loading && <div className="bubble assistant">Neko is thinking...</div>}
      </div>
      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <input
          aria-label="Message Neko"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Talk to Neko-chan..."
          value={input}
        />
        <button type="submit">➤</button>
      </form>
    </section>
  );
}

function PanelTitle({ actionLabel, onAction, title }) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      <button aria-label={`Add ${title}`} onClick={onAction} type="button">
        {actionLabel}
      </button>
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
        >
          <span>{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}

function HabitModal(props) {
  return (
    <EntryModal
      {...props}
      fields={[
        ["name", "Care task", "Drink water"],
        ["emoji", "Emoji", "💧"],
      ]}
      title="New Care Task"
      transform={(data) => ({
        name: data.name,
        emoji: data.emoji || "🌸",
        color: HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)],
      })}
    />
  );
}

function TaskModal(props) {
  return (
    <EntryModal
      {...props}
      fields={[
        ["name", "Task", "Reply to emails"],
        ["emoji", "Emoji", "✓"],
        ["category", "Category", "Personal"],
      ]}
      title="New Task"
      transform={(data) => ({ name: data.name, emoji: data.emoji || "✓", category: data.category || "Personal" })}
    />
  );
}

function ChallengeModal(props) {
  return (
    <EntryModal
      {...props}
      fields={[
        ["name", "Challenge", "No junk food"],
        ["emoji", "Emoji", "🌱"],
        ["targetDays", "Days", "30"],
      ]}
      title="New Growth Challenge"
      transform={(data) => ({
        name: data.name,
        emoji: data.emoji || "🌱",
        targetDays: Math.max(1, Number(data.targetDays) || 30),
      })}
    />
  );
}

function WorldModal({ currentName, onClose, onSave }) {
  return (
    <EntryModal
      fields={[["name", "World name", currentName || "Kawaii"]]}
      onClose={onClose}
      onSave={(data) => onSave(data.name)}
      title="Name Your Little World"
      transform={(data) => ({ name: data.name })}
    />
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
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="entry-modal" onSubmit={submit}>
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
    </div>
  );
}
