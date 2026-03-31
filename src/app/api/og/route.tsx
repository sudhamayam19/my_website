import { ImageResponse } from "next/og";

export const runtime = "edge";

function safe(value: string | null, fallback: string): string {
  const text = value?.trim();
  return text && text.length > 0 ? text : fallback;
}

function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 3)}...` : value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = truncate(safe(searchParams.get("title"), "Sudha Devarakonda"), 90);
  const category = truncate(
    safe(searchParams.get("category"), "RJ | Translator | Voice Artist"),
    40,
  );
  const excerpt = truncate(
    safe(
      searchParams.get("excerpt"),
      "Stories, blog posts, voice work, and thoughtful media updates.",
    ),
    140,
  );

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #153f54 0%, #1f6973 38%, #d1844d 100%)",
          color: "#fff8ef",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            opacity: 0.9,
          }}
        >
          <div
            style={{
              display: "flex",
              width: "18px",
              height: "18px",
              borderRadius: "999px",
              background: "#fff8ef",
            }}
          />
          {category}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "26px",
            maxWidth: "900px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 72,
              lineHeight: 1.05,
              fontWeight: 800,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              lineHeight: 1.35,
              color: "#f8ecdf",
              opacity: 0.92,
            }}
          >
            {excerpt}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          <div style={{ display: "flex" }}>Sudha Devarakonda</div>
          <div style={{ display: "flex", opacity: 0.88 }}>sudhamayam.vercel.app</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
