import { useEffect, useMemo, useRef, useState } from "react";
import { KawaiiIcon } from "../components/KawaiiIcon";
import { TodayPanel } from "./TodayPanel";
import { RhythmPanel } from "./RhythmPanel";
import { formatToday, today } from "./date";
import { getLocalReply, getMood, isCrisisMessage, moodAssets, moodMessages } from "./neko";
import {
  habitStatus,
  isDoneOn,
  normalizeHabit,
  setNote,
  setSkip,
  toggleComplete,
  toggleTiny,
} from "./habits";
import { computeTrust, computeWorld, nextDecor } from "./world";
import { useAppState } from "./useAppState";
import { Onboarding } from "./Onboarding";
import { HabitEditor, HabitMenu, NotePrompt, SkipSheet } from "./HabitEditor";
import { WorldPanel } from "./WorldPanel";
import { Settings } from "./Settings";
import { Modal } from "./Modal";

const NAV_ITEMS = [
  ["today", "today", "Today"],
  ["rhythm", "rhythm", "Rhythm"],
  ["garden", "garden", "Garden"],
  ["neko", "neko", "Neko"],
];

function nextId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export function KawaiiApp() {
  const [state, { update }] = useAppState();
  const [todayStr, setTodayStr] = useState(today);
  const date = formatToday();
  const [activeTab, setActiveTab] = useState("today");
  const [modal, setModal] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const feedbackTimer = useRef(null);
  const appScrollRef = useRef(null);

  const allHabits = state.habits;
  const activeHabits = useMemo(() => allHabits.filter((habit) => !habit.archivedAt), [allHabits]);
  const world = useMemo(() => computeWorld(allHabits, todayStr), [allHabits, todayStr]);

  useEffect(() => () => clearTimeout(feedbackTimer.current), []);

  useEffect(() => {
    if (appScrollRef.current) appScrollRef.current.scrollTop = 0;
  }, [activeTab]);

  useEffect(() => {
    let midnightTimer;

    function refreshDate() {
      setTodayStr(today());
    }

    function scheduleMidnightRefresh() {
      clearTimeout(midnightTimer);
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      midnightTimer = setTimeout(() => {
        refreshDate();
        scheduleMidnightRefresh();
      }, nextMidnight.getTime() - now.getTime());
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") refreshDate();
    }

    scheduleMidnightRefresh();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearTimeout(midnightTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  function flash(message, options = {}) {
    clearTimeout(feedbackTimer.current);
    if (!message) {
      setFeedback(null);
      return;
    }
    setFeedback({ message, ...options });
    feedbackTimer.current = setTimeout(() => setFeedback(null), options.persist ? 8000 : 5200);
  }

  function undoFeedback() {
    if (!feedback?.restore) return;
    update((current) => ({ ...current, ...feedback.restore }));
    clearTimeout(feedbackTimer.current);
    setFeedback(null);
  }

  function applyHabit(id, mutator, message) {
    const previousHabits = allHabits;
    const nextHabits = allHabits.map((habit) => (habit.id === id ? mutator(habit) : habit));
    const before = computeTrust(previousHabits);
    const after = computeTrust(nextHabits);
    const upcoming = nextDecor(before);
    update((current) => ({ ...current, habits: nextHabits }));

    if (upcoming && after > before && after >= upcoming.unlockAt) {
      flash(`You unlocked ${upcoming.name}. Your garden grew.`, {
        habitId: id,
        restore: { habits: previousHabits },
      });
    } else if (message) {
      flash(message, { habitId: id, restore: { habits: previousHabits } });
    } else {
      setFeedback(null);
    }
  }

  function completeHabit(habit) {
    const status = habitStatus(habit, todayStr);
    applyHabit(
      habit.id,
      (current) => toggleComplete(current, todayStr),
      status === "done"
        ? "Completion reopened."
        : status === "tiny"
          ? "The full version is cared for."
          : "Lovely. One gentle thing is cared for.",
    );
  }

  function toggleHabitFromToday(habit) {
    const status = habitStatus(habit, todayStr);
    if (status !== "done" && status !== "tiny") {
      completeHabit(habit);
      return;
    }

    applyHabit(
      habit.id,
      (current) => {
        const skips = { ...current.skipsByDate };
        delete skips[todayStr];
        return {
          ...current,
          completedDates: current.completedDates.filter((dateKey) => dateKey !== todayStr),
          tinyDates: current.tinyDates.filter((dateKey) => dateKey !== todayStr),
          skipsByDate: skips,
        };
      },
      "Completion reopened.",
    );
  }

  function tinyHabit(habit) {
    applyHabit(habit.id, (current) => toggleTiny(current, todayStr), "Tiny still counts. Neko noticed.");
    setModal(null);
  }

  function skipHabit(habit, reason) {
    applyHabit(habit.id, (current) => setSkip(current, todayStr, reason), "Rest is part of the rhythm.");
    setModal(null);
  }

  function noteHabit(habit, text) {
    const previousHabits = allHabits;
    const nextHabits = allHabits.map((item) => (item.id === habit.id ? setNote(item, todayStr, text) : item));
    update((current) => ({ ...current, habits: nextHabits }));
    setModal(null);
    flash("Today’s note is saved.", { habitId: habit.id, restore: { habits: previousHabits } });
  }

  function resetToday(habit) {
    const previousHabits = allHabits;
    const nextHabits = allHabits.map((item) => {
      if (item.id !== habit.id) return item;
      const skips = { ...item.skipsByDate };
      delete skips[todayStr];
      return {
        ...item,
        completedDates: item.completedDates.filter((dateKey) => dateKey !== todayStr),
        tinyDates: item.tinyDates.filter((dateKey) => dateKey !== todayStr),
        skipsByDate: skips,
      };
    });
    update((current) => ({ ...current, habits: nextHabits }));
    setModal(null);
    flash("Today is open again.", { habitId: habit.id, restore: { habits: previousHabits } });
  }

  function archiveHabit(habit) {
    const previousHabits = allHabits;
    update((current) => ({
      ...current,
      habits: current.habits.map((item) =>
        item.id === habit.id ? { ...item, archivedAt: new Date().toISOString() } : item,
      ),
    }));
    setModal(null);
    flash(`${habit.name} moved to the archive.`, { restore: { habits: previousHabits } });
  }

  function saveHabit(partial) {
    if (modal?.habit) {
      update((current) => ({
        ...current,
        habits: current.habits.map((item) => (item.id === modal.habit.id ? normalizeHabit({ ...item, ...partial }) : item)),
      }));
      flash("Ritual updated.");
    } else {
      update((current) => ({
        ...current,
        habits: [
          ...current.habits,
          normalizeHabit({ ...partial, id: nextId(), order: current.habits.length }),
        ],
      }));
      flash("A new ritual is ready for you.");
    }
    setModal(null);
  }

  function addTask(task) {
    update((current) => ({
      ...current,
      tasks: [...current.tasks, { ...task, id: nextId(), icon: task.icon || "task", done: false }],
    }));
    setModal(null);
    flash("To-do added.");
  }

  function toggleTask(id) {
    const previousTasks = state.tasks;
    update((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    }));
    flash("To-do updated.", { restore: { tasks: previousTasks } });
  }

  function deleteTask(task) {
    const previousTasks = state.tasks;
    update((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== task.id) }));
    flash(`${task.name} deleted.`, { restore: { tasks: previousTasks } });
  }

  function addChallenge(challenge) {
    update((current) => ({
      ...current,
      challenges: [
        ...current.challenges,
        { ...challenge, id: nextId(), icon: challenge.icon || "plant", startDate: todayStr, completedDates: [], archivedAt: null },
      ],
    }));
    setModal(null);
    flash("A longer goal was planted.");
  }

  function toggleChallenge(id) {
    update((current) => ({
      ...current,
      challenges: current.challenges.map((challenge) => {
        if (challenge.id !== id) return challenge;
        const checked = challenge.completedDates.includes(todayStr);
        return {
          ...challenge,
          completedDates: checked
            ? challenge.completedDates.filter((dateKey) => dateKey !== todayStr)
            : [...challenge.completedDates, todayStr],
        };
      }),
    }));
  }

  function archiveChallenge(id) {
    update((current) => ({
      ...current,
      challenges: current.challenges.map((challenge) =>
        challenge.id === id ? { ...challenge, archivedAt: new Date().toISOString() } : challenge,
      ),
    }));
    flash("Challenge completed and archived.");
  }

  function finishOnboarding(result) {
    update((current) => ({
      ...current,
      profile: { ...current.profile, ...result.profile },
      preferences: { ...current.preferences, ...result.preferences },
      habits: result.habits,
    }));
  }

  if (!state.profile.onboardedAt) {
    return <Onboarding onFinish={finishOnboarding} />;
  }

  return (
    <main className="app-root" data-theme={state.preferences.theme}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <section className="app-frame" aria-label="Kawaii Habit Tracker">
        <div className="app-scroll" id="main-content" ref={appScrollRef} tabIndex="-1">
          {activeTab === "today" && (
            <TodayPanel
              habits={activeHabits}
              tasks={state.tasks}
              todayStr={todayStr}
              theme={state.preferences.theme}
              userName={state.profile.userName}
              worldName={state.profile.worldName}
              feedback={feedback}
              onUndo={undoFeedback}
              onComplete={toggleHabitFromToday}
              onMenu={(habit) => setModal({ type: "menu", habit })}
              onAddHabit={() => setModal({ type: "habit" })}
              onToggleTask={toggleTask}
              onAddTask={() => setModal({ type: "task" })}
              onDeleteTask={deleteTask}
              onOpenSettings={() => setModal({ type: "settings" })}
            />
          )}

          {activeTab === "rhythm" && (
            <>
              <InteriorHeader
                title="Your rhythm"
                subtitle={`${date.weekday}, ${date.date}`}
                icon="rhythm"
                onOpenSettings={() => setModal({ type: "settings" })}
              />
              <RhythmPanel habits={allHabits} todayStr={todayStr} onEditHabit={(habit) => setModal({ type: "edit", habit })} />
            </>
          )}

          {activeTab === "garden" && (
            <>
              <InteriorHeader
                title={state.profile.worldName || "Your garden"}
                subtitle="A world grown from ordinary care"
                icon="garden"
                onOpenSettings={() => setModal({ type: "settings" })}
              />
              <WorldPanel
                world={world}
                worldName={state.profile.worldName}
                habits={activeHabits}
                challenges={state.challenges}
                theme={state.preferences.theme}
                onAddChallenge={() => setModal({ type: "challenge" })}
                onToggleChallenge={toggleChallenge}
                onArchiveChallenge={archiveChallenge}
                todayStr={todayStr}
              />
            </>
          )}

          {activeTab === "neko" && (
            <>
              <InteriorHeader
                title={state.profile.nekoName || "Neko"}
                subtitle="A gentle companion, never a judge"
                icon="neko"
                onOpenSettings={() => setModal({ type: "settings" })}
              />
              <NekoPanel
                nekoName={state.profile.nekoName}
                userName={state.profile.userName}
                habits={activeHabits}
                tasks={state.tasks}
                challenges={state.challenges}
                messages={state.chat}
                setMessages={(updater) =>
                  update((current) => ({
                    ...current,
                    chat: (typeof updater === "function" ? updater(current.chat) : updater).slice(-40),
                  }))
                }
              />
            </>
          )}
        </div>

        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </section>

      {feedback && !feedback.habitId && (
        <div className="global-toast" role="status">
          <KawaiiIcon name="leaf" size={18} />
          <span>{feedback.message}</span>
          {feedback.restore && <button type="button" onClick={undoFeedback}>Undo</button>}
        </div>
      )}

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
      {modal?.type === "skip" && (
        <SkipSheet habit={modal.habit} onClose={() => setModal(null)} onSkip={(reason) => skipHabit(modal.habit, reason)} />
      )}
      {modal?.type === "note" && (
        <NotePrompt habit={modal.habit} todayStr={todayStr} onClose={() => setModal(null)} onSave={(text) => noteHabit(modal.habit, text)} />
      )}
      {modal?.type === "task" && (
        <EntryModal
          title="Create to-do"
          fields={[
            ["name", "To-do", "Reply to a message"],
            ["category", "Area", "Personal"],
          ]}
          transform={(data) => ({ name: data.name, icon: "task", category: data.category || "Personal" })}
          onClose={() => setModal(null)}
          onSave={addTask}
        />
      )}
      {modal?.type === "challenge" && (
        <EntryModal
          title="Plant a longer goal"
          fields={[
            ["name", "Goal", "Eat something fresh"],
            ["targetDays", "Care days", "30"],
          ]}
          transform={(data) => ({ name: data.name, icon: "plant", targetDays: Math.max(1, Number(data.targetDays) || 30) })}
          onClose={() => setModal(null)}
          onSave={addChallenge}
        />
      )}
      {modal?.type === "settings" && <Settings state={state} onUpdate={update} onClose={() => setModal(null)} />}
    </main>
  );
}

function InteriorHeader({ title, subtitle, icon, onOpenSettings }) {
  return (
    <header className="interior-header">
      <div className="interior-title">
        <span aria-hidden="true"><KawaiiIcon name={icon} /></span>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <button className="icon-button" type="button" onClick={onOpenSettings} aria-label="Open settings">
        <KawaiiIcon name="settings" />
      </button>
    </header>
  );
}

function BottomNav({ activeTab, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {NAV_ITEMS.map(([key, icon, label]) => (
        <button
          className={activeTab === key ? "is-active" : ""}
          key={key}
          onClick={() => onChange(key)}
          type="button"
          aria-current={activeTab === key ? "page" : undefined}
        >
          <KawaiiIcon name={icon} size={24} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function NekoPanel({ challenges, habits, messages, nekoName, setMessages, tasks, userName }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const mood = getMood(habits, today());
  const moodAlt = {
    blissful: "Neko sitting happily",
    happy: "Neko sitting happily",
    recovered: "Neko sitting happily",
    sleepy: "Neko resting sleepily",
    sad: "Neko sitting quietly",
    lonely: "Neko sitting quietly",
    content: "Neko sitting calmly",
    welcome: "Neko sitting calmly",
  }[mood];
  const quickActions = [
    ["sun", "Plan one tiny day"],
    ["leaf", "Make today easier"],
    ["heart", "Help me come back"],
    ["sparkles", "Reflect on my wins"],
  ];

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
      const context = {
        doneCount: habits.filter((habit) => isDoneOn(habit, today())).length,
        totalHabits: habits.length,
        pendingTodos: tasks.filter((task) => !task.done).length,
        activeChallenges: challenges
          .filter((challenge) => !challenge.archivedAt)
          .map((challenge) => ({
            name: challenge.name,
            targetDays: challenge.targetDays,
            doneDays: (challenge.completedDates || []).length,
          })),
        userName,
      };
      if (isCrisisMessage(text)) throw new Error("local-safety");
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
        { role: "assistant", content: getLocalReply(text, habits, tasks, challenges, userName) },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="companion-panel">
      <div className="companion-scene">
        <img src={moodAssets[mood]} alt={moodAlt} width="240" height="240" />
        <div>
          <p className="section-kicker">A quiet place to pause</p>
          <h2>What would feel kind right now?</h2>
          <p>{moodMessages[mood]}</p>
        </div>
      </div>

      <div className="companion-quick-actions" aria-label="Conversation starters">
        {quickActions.map(([icon, action]) => (
          <button key={action} onClick={() => send(action)} type="button" disabled={loading}>
            <KawaiiIcon name={icon} size={20} />
            {action}
          </button>
        ))}
      </div>

      <div className="chat-log" ref={scrollRef} aria-live="polite" aria-busy={loading}>
        {messages.map((message, index) => (
          <div className={`bubble ${message.role}`} key={`${message.role}-${index}`}>
            {message.content}
          </div>
        ))}
        {loading && <div className="bubble assistant">{nekoName || "Neko"} is thinking about one gentle next step.</div>}
      </div>

      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <label className="sr-only" htmlFor="neko-message">Message {nekoName || "Neko"}</label>
        <input
          id="neko-message"
          onChange={(event) => setInput(event.target.value)}
          placeholder={`Talk to ${nekoName || "Neko"}`}
          value={input}
          maxLength="500"
        />
        <button type="submit" aria-label="Send message" disabled={!input.trim() || loading}>
          <KawaiiIcon name="send" size={20} />
        </button>
      </form>
    </section>
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
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!form.name?.trim()) {
      setError("Please enter a name.");
      return;
    }
    onSave(transform({ ...form, name: form.name.trim() }));
  }

  return (
    <Modal title={title} onClose={onClose} className="entry-modal">
      <form onSubmit={submit}>
        <header className="modal-heading">
          <div>
            <p className="section-kicker">Keep it small and specific</p>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={`Close ${title}`}>
            <KawaiiIcon name="close" />
          </button>
        </header>
        {fields.map(([key, label, placeholder]) => (
          <label key={key}>
            {label}
            <input
              aria-describedby={key === "name" && error ? "entry-name-error" : undefined}
              onBlur={() => key === "name" && !form.name.trim() && setError("Please enter a name.")}
              onChange={(event) => {
                setForm((current) => ({ ...current, [key]: event.target.value }));
                if (key === "name") setError("");
              }}
              placeholder={placeholder}
              type={key === "targetDays" ? "number" : "text"}
              value={form[key]}
            />
            {key === "name" && error && <small className="field-error" id="entry-name-error">{error}</small>}
          </label>
        ))}
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">Keep browsing</button>
          <button className="primary-button" type="submit">{title}</button>
        </div>
      </form>
    </Modal>
  );
}
