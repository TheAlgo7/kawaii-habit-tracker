import { KawaiiIcon } from "../components/KawaiiIcon";
import { offsetDate } from "./date";
import { DECOR } from "./world";

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

function points(value) {
  return `${value} care point${value === 1 ? "" : "s"}`;
}

function weeklyTrend(habits, todayStr) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = offsetDate(todayStr, index - 6);
    const count = habits.filter((habit) => habit.completedDates.includes(day) || habit.tinyDates.includes(day)).length;
    const [year, month, date] = day.split("-").map(Number);
    return { day, count, label: WEEKDAY[new Date(year, month - 1, date).getDay()] };
  });
}

export function WorldPanel({ world, worldName, habits, challenges, theme, onAddChallenge, onToggleChallenge, onArchiveChallenge, todayStr }) {
  const trend = weeklyTrend(habits, todayStr);
  const peak = Math.max(1, ...trend.map((item) => item.count));
  const unlockedIds = new Set(world.unlocked.map((item) => item.id));
  const active = challenges.filter((challenge) => !challenge.archivedAt);
  const archived = challenges.filter((challenge) => challenge.archivedAt);
  const todayPoints = habits.reduce(
    (sum, habit) => sum + (habit.completedDates.includes(todayStr) ? 2 : 0) + (habit.tinyDates.includes(todayStr) ? 1 : 0),
    0,
  );

  return (
    <div className="garden-panel">
      <section className="garden-overview" aria-labelledby="garden-level-title">
        <img
          className="garden-overview-art"
          src={theme === "garden-night" ? "/scene-garden-night.webp" : "/scene-garden-day.webp"}
          alt=""
          width="1280"
          height="853"
          loading="lazy"
        />
        <div className="garden-overview-shade" aria-hidden="true" />
        <div className="garden-level-copy">
          <p className="section-kicker">{worldName || "Your garden"}</p>
          <h2 id="garden-level-title">{world.levelTitle} garden</h2>
          <p>Level {world.level}. {world.nextLevelTitle ? `${points(world.trustToNextLevel)} until ${world.nextLevelTitle.toLowerCase()}.` : "Every corner is awake."}</p>
          <div className="garden-level-track" role="progressbar" aria-label="Garden level progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={world.levelProgress}>
            <span style={{ "--progress": world.levelProgress / 100 }} />
          </div>
        </div>
        <div className={`garden-today-note${todayPoints ? " has-care" : ""}`}>
          <KawaiiIcon name={todayPoints ? "sparkles" : "moon"} size={20} />
          <span>{todayPoints ? `Today added ${points(todayPoints)}.` : "The garden is resting. One tiny habit can wake it."}</span>
        </div>
      </section>

      <section className="garden-section" aria-labelledby="collection-title">
        <header className="section-heading compact-heading">
          <span className="section-mark" aria-hidden="true"><KawaiiIcon name="plant" /></span>
          <div><p className="section-kicker">Keepsakes earned through care</p><h2 id="collection-title">Garden collection</h2></div>
          <span className="collection-count">{world.unlocked.length} / {DECOR.length}</span>
        </header>
        <div className="decor-grid">
          {DECOR.map((item) => {
            const unlocked = unlockedIds.has(item.id);
            return (
              <div className={`decor-item${unlocked ? " is-unlocked" : ""}`} key={item.id}>
                <span aria-hidden="true"><KawaiiIcon name={unlocked ? item.icon : "lock"} size={26} /></span>
                <strong>{unlocked ? item.name : `${item.unlockAt} points`}</strong>
                <small>{unlocked ? "Collected" : "Still growing"}</small>
              </div>
            );
          })}
        </div>
        {world.nextDecor && (
          <p className="next-unlock"><KawaiiIcon name={world.nextDecor.icon} size={20} /> Next: {world.nextDecor.name} in {points(world.trustToNextDecor)}.</p>
        )}
      </section>

      <section className="garden-section rhythm-preview" aria-labelledby="garden-week-title">
        <header className="section-heading compact-heading">
          <span className="section-mark muted" aria-hidden="true"><KawaiiIcon name="rhythm" /></span>
          <div><p className="section-kicker">Care from the last seven days</p><h2 id="garden-week-title">This week</h2></div>
        </header>
        <div className="garden-week-chart">
          {trend.map((item) => (
            <div key={item.day} className={item.day === todayStr ? "is-today" : ""}>
              <span role="img" aria-label={`${item.day}: ${item.count} completed habit${item.count === 1 ? "" : "s"}`}><i style={{ "--bar": Math.max(0.08, item.count / peak) }} /></span>
              <small>{item.label}</small>
            </div>
          ))}
        </div>
        <p>{trend.reduce((sum, item) => sum + item.count, 0)} gentle win{trend.reduce((sum, item) => sum + item.count, 0) === 1 ? "" : "s"} this week.</p>
      </section>

      <section className="garden-section" aria-labelledby="goals-title">
        <header className="section-heading compact-heading">
          <span className="section-mark muted" aria-hidden="true"><KawaiiIcon name="challenge" /></span>
          <div><p className="section-kicker">Longer rhythms, without a countdown</p><h2 id="goals-title">Growing goals</h2></div>
          <button className="text-button" type="button" onClick={onAddChallenge}><KawaiiIcon name="plus" size={18} /> Plant goal</button>
        </header>

        {active.length ? (
          <div className="challenge-list">
            {active.map((challenge) => {
              const doneDays = (challenge.completedDates || []).length;
              const complete = doneDays >= challenge.targetDays;
              const checked = (challenge.completedDates || []).includes(todayStr);
              const percent = Math.min(100, Math.round((doneDays / challenge.targetDays) * 100));
              return (
                <article className="challenge-row" key={challenge.id}>
                  <span className="challenge-icon" aria-hidden="true"><KawaiiIcon name={challenge.icon || "plant"} /></span>
                  <div><h3>{challenge.name}</h3><p>{complete ? "Ready to tuck into the archive." : `${doneDays} of ${challenge.targetDays} care days`}</p><div className="mini-track" aria-hidden="true"><span style={{ "--progress": percent / 100 }} /></div></div>
                  {complete ? (
                    <button type="button" className="secondary-button" onClick={() => onArchiveChallenge(challenge.id)}>Archive</button>
                  ) : (
                    <button type="button" className={`challenge-check${checked ? " is-checked" : ""}`} onClick={() => onToggleChallenge(challenge.id)} aria-pressed={checked} aria-label={`${checked ? "Reopen" : "Complete"} ${challenge.name} for today`}>
                      {checked && <KawaiiIcon name="check" size={20} />}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="quiet-empty illustrated-inline-empty"><KawaiiIcon name="seedling" size={28} /><span><strong>No longer goals yet.</strong> Plant one when a rhythm deserves more time.</span></div>
        )}
      </section>

      {archived.length > 0 && (
        <section className="garden-section archived-goals" aria-labelledby="archived-title">
          <h2 id="archived-title">Finished growing</h2>
          {archived.map((challenge) => <p key={challenge.id}><KawaiiIcon name="check" size={17} /> {challenge.name}<span>{challenge.targetDays} care days</span></p>)}
        </section>
      )}
    </div>
  );
}
