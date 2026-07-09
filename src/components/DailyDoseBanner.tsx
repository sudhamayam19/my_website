import { getDosePool } from "@/lib/content-store";

const ROTATE_DAYS = 4;

export async function DailyDoseBanner() {
  const doses = await getDosePool();
  if (doses.length === 0) return null;

  // Advance to the next quote every 4 days, cycling through all uploaded quotes (IST).
  const istDay = Math.floor((Date.now() + 5.5 * 60 * 60 * 1000) / 86_400_000);
  const dose = doses[Math.floor(istDay / ROTATE_DAYS) % doses.length];
  const body = dose.author ? `${dose.text} — ${dose.author}` : dose.text;

  if (dose.style === "flash") {
    return (
      <div className="daily-dose-wrap">
        <div className="daily-dose-flash">
          <span className="daily-dose-badge">Daily Dose</span>
          <p className="daily-dose-copy">{body}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-dose-wrap">
      <div className="daily-dose-marquee" aria-label="Daily Dose">
        <div className="daily-dose-track">
          <span className="daily-dose-badge">Daily Dose</span>
          <span className="daily-dose-copy">{body}</span>
          <span className="daily-dose-sep">•</span>
          <span className="daily-dose-badge">Daily Dose</span>
          <span className="daily-dose-copy">{body}</span>
        </div>
      </div>
    </div>
  );
}
