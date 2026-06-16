import type { ChangeMaker } from "@/lib/content-store";

interface Props {
  items: ChangeMaker[];
}

export function ChangeMakerSpotlight({ items }: Props) {
  if (items.length === 0) return null;

  const [current, ...past] = items;

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8" id="changemakers">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">Weekly spotlight</p>
          <h2 className="display-font mt-2 text-4xl font-bold text-[#1f2d39] sm:text-5xl">Change Makers</h2>
          <p className="mt-2 text-sm text-[#60717b] max-w-xl">
            One person per week who changed the world — stories of courage, vision, and impact.
          </p>
        </div>

        {/* This week's spotlight */}
        <div className="rounded-3xl border border-[#d8c8b0] bg-gradient-to-br from-[#fffaf3] to-[#f0f8f8] overflow-hidden shadow-sm mb-8">
          <div className="flex flex-col md:flex-row">
            {/* Photo */}
            <div className="md:w-64 shrink-0">
              {current.imageUrl ? (
                <img
                  src={current.imageUrl}
                  alt={current.name}
                  className="w-full h-64 md:h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 md:h-full bg-gradient-to-br from-[#2a6670] to-[#1f4a52] flex items-center justify-center">
                  <span className="text-7xl select-none">✨</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-7 md:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="rounded-full bg-[#2a6670] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  This week
                </span>
                <span className="text-xs text-[#8fa3ad]">
                  Week of {new Date(current.weekOf + "T00:00:00Z").toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
                  })}
                </span>
              </div>

              <h3 className="display-font text-3xl font-bold text-[#1f2d39] sm:text-4xl">{current.name}</h3>
              <p className="mt-2 text-base font-semibold text-[#2a6670]">{current.tagline}</p>

              <p className="mt-4 text-sm leading-relaxed text-[#4f5f69] line-clamp-6 whitespace-pre-line">
                {current.story}
              </p>

              {current.link && (
                <a
                  href={current.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#1f6973] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#185860] transition"
                >
                  Read more →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Past change makers */}
        {past.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8fa3ad] mb-4">Past spotlights</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((person) => (
                <div
                  key={person._id}
                  className="rounded-2xl border border-[#e0d4c0] bg-[#fffaf3] p-5 hover:shadow-sm transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {person.imageUrl ? (
                      <img src={person.imageUrl} alt={person.name} className="h-11 w-11 rounded-full object-cover shrink-0 border border-[#d8c8b0]" />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#2a6670] to-[#1f4a52] flex items-center justify-center shrink-0">
                        <span className="text-lg">✨</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-[#1f2d39] truncate text-sm">{person.name}</p>
                      <p className="text-[11px] text-[#8fa3ad]">
                        {new Date(person.weekOf + "T00:00:00Z").toLocaleDateString("en-IN", {
                          month: "short", year: "numeric", timeZone: "UTC"
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[#2a6670] font-semibold mb-1">{person.tagline}</p>
                  <p className="text-xs text-[#60717b] line-clamp-3 leading-relaxed">{person.story}</p>
                  {person.link && (
                    <a href={person.link} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-bold text-[#1f6973] hover:underline">
                      Read more →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
