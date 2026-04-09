import { getDailyDose } from "@/lib/content-store";

export async function DailyDoseBanner() {
  const dose = await getDailyDose();

  if (!dose.active || !dose.text.trim()) {
    return null;
  }

  const body = dose.author?.trim()
    ? `${dose.text.trim()} — ${dose.author.trim()}`
    : dose.text.trim();

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
