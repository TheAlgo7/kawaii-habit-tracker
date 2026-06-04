import { offsetDate } from "./date";
import { DECOR } from "./world";

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

const points = (n) => `${n} care point${n === 1 ? "" : "s"}`;

function weeklyTrend(habits, todayStr) {
  const out = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = offsetDate(todayStr, -i);
    let count = 0;
    for (const h of habits) {
      if (h.completedDates.includes(day) || h.tinyDates.includes(day)) count += 1;
    }
    const [y, m, d] = day.split("-").map(Number);
    out.push({ day, count, label: WEEKDAY[new Date(y, m - 1, d).getDay()] });
  }
  return out;
}

export function WorldPanel({ world, worldName, habits, challenges, onAddChallenge, onToggleChallenge, onArchiveChallenge, todayStr }) {
  const trend = weeklyTrend(habits, todayStr);
  const peak = Math.max(1, ...trend.map((t) => t.count));
  const unlockedIds = new Set(world.unlocked.map((u) => u.id));

  const active = challenges.filter((c) => !c.archivedAt);
  const archived = challenges.filter((c) => c.archivedAt);

  // The hero shows a little garden that literally grows: the most-recent unlocks
  // sit in a scene, the newest one glows, and today's care is called out.
  const sceneItems = world.unlocked.slice(-8);
  const newestId = world.unlocked.length ? world.unlocked[world.unlocked.length - 1].id : null;
  const todayPoints = habits.reduce(
    (sum, h) => sum + (h.completedDates.includes(todayStr) ? 2 : 0) + (h.tinyDates.includes(todayStr) ? 1 : 0),
    0,
  );

  return (
    <>
      <section className="world-hero" style={{ "--warmth": world.warmth / 100 }}>
        <div className="world-glow" aria-hidden="true" />
        <p className="world-eyebrow">{worldName}</p>
        <h1>
          Lv {world.level} · {world.levelTitle}
        </h1>
        <div className="trust-bar" aria-label={`${world.levelProgress}% to next level`}>
          <span style={{ width: `${world.levelProgress}%` }} />
        </div>
        <p className="world-next">
          {world.nextLevelTitle
            ? `${points(world.trustToNextLevel)} to ${world.nextLevelTitle}`
            : "Your world is fully grown. Keep it warm 🌸"}
        </p>
        <div className="world-scene" aria-hidden="true">
          {sceneItems.map((item) => (
            <span key={item.id} className={`scene-item${item.id === newestId ? " newest" : ""}`}>
              {item.emoji}
            </span>
          ))}
        </div>
        {todayPoints > 0 ? (
          <p className="world-today">✨ Today brightened your world by {points(todayPoints)}.</p>
        ) : (
          <p className="world-today rest">Your world is resting. One tiny thing will stir it awake 🌙</p>
        )}
      </section>

      <PanelTitle title="Your world shelf" />
      <section className="decor-shelf">
        {DECOR.map((item) => {
          const unlocked = unlockedIds.has(item.id);
          return (
            <div key={item.id} className={`decor-cell${unlocked ? " unlocked" : ""}`} title={unlocked ? item.name : `Unlocks at ${item.unlockAt} points`}>
              <span aria-hidden="true">{unlocked ? item.emoji : "❔"}</span>
              <small>{unlocked ? item.name : `${item.unlockAt}pt`}</small>
            </div>
          );
        })}
      </section>
      {world.nextDecor && (
        <p className="decor-hint">Next: {world.nextDecor.emoji} {world.nextDecor.name} in {points(world.trustToNextDecor)} ✨</p>
      )}

      <PanelTitle title="This week" />
      <section className="trend-card">
        <div className="trend-row">
          {trend.map((t) => (
            <div className="trend-col" key={t.day}>
              <div className="trend-bar" style={{ height: `${(t.count / peak) * 100}%` }} aria-hidden="true" />
              <small className={t.day === todayStr ? "is-today" : ""}>{t.label}</small>
            </div>
          ))}
        </div>
        <p className="trend-caption">
          {(() => {
            const total = trend.reduce((s, t) => s + t.count, 0);
            return `${total} gentle win${total === 1 ? "" : "s"} in the last 7 days`;
          })()}
        </p>
      </section>

      <PanelTitle title="Growth challenges" actionLabel="+" onAction={onAddChallenge} />
      <div className="list-stack">
        {active.length === 0 && (
          <p className="empty-line">No challenges yet. Plant a longer goal whenever you're ready 🌱</p>
        )}
        {active.map((challenge) => {
          // Progress is the number of days actually checked in, not calendar
          // time. A 30-day challenge completes after 30 real check-ins.
          const doneDays = challenge.completedDates.length;
          const isComplete = doneDays >= challenge.targetDays;
          const checked = challenge.completedDates.includes(todayStr);
          const pct = Math.min(100, Math.round((doneDays / challenge.targetDays) * 100));
          return (
            <article className="growth-card" key={challenge.id}>
              <button onClick={() => onToggleChallenge(challenge.id)} type="button">
                <span className={`round-check${checked ? " checked" : ""}`}>{checked ? "✓" : ""}</span>
                <span>
                  {challenge.emoji} {challenge.name}
                  <small>{isComplete ? `Complete! ${challenge.targetDays} days 🎉` : `${doneDays}/${challenge.targetDays} days done`}</small>
                </span>
              </button>
              <div className="progress-track mini">
                <span style={{ width: `${pct}%` }} />
              </div>
              {isComplete && (
                <button type="button" className="claim-btn" onClick={() => onArchiveChallenge(challenge.id)}>
                  Claim & archive 🏆
                </button>
              )}
            </article>
          );
        })}
      </div>

      {archived.length > 0 && (
        <>
          <PanelTitle title="Completed" />
          <div className="list-stack">
            {archived.map((challenge) => (
              <div className="archived-row" key={challenge.id}>
                <span aria-hidden="true">{challenge.emoji}</span> {challenge.name}
                <em>🏆 {challenge.targetDays}d</em>
              </div>
            ))}
          </div>
        </>
      )}
    </>
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
