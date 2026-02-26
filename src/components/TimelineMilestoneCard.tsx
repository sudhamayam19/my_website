import type { LucideIcon } from "lucide-react";
import { Languages, Mic, Podcast, Radio, Sparkles } from "lucide-react";
import type { TimelineEvent } from "@/lib/site-data";

interface TimelineMilestoneCardProps {
  event: TimelineEvent;
}

const iconMap: Record<TimelineEvent["icon"], LucideIcon> = {
  radio: Radio,
  mic: Mic,
  languages: Languages,
  podcast: Podcast,
  sparkles: Sparkles,
};

export function TimelineMilestoneCard({ event }: TimelineMilestoneCardProps) {
  const Icon = iconMap[event.icon];

  return (
    <article
      className={`editorial-card rounded-2xl border-l-4 ${event.accentClass} p-5 md:grid md:grid-cols-[220px_1fr] md:items-center md:gap-5 md:p-6`}
    >
      <div
        className={`mb-4 flex aspect-[4/3] items-center justify-center rounded-2xl border-2 border-dashed border-[#cab396] bg-gradient-to-br ${event.placeholderGradient} text-[#264953] md:mb-0`}
      >
        <div className="px-3 text-center">
          <Icon className="mx-auto h-8 w-8" aria-hidden="true" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide">{event.year}</p>
          <p className="mt-1 text-xs">{event.placeholderLabel}</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2a6670]">
          {event.year}
        </p>
        <h3 className="display-font mt-2 text-2xl font-bold text-[#202d39]">{event.title}</h3>
        <p className="mt-2 text-[#4d5c66]">{event.description}</p>
      </div>
    </article>
  );
}
