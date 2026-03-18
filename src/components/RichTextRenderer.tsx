import type { ReactNode } from "react";

interface RichTextRendererProps {
  blocks: string[];
}

function parseLink(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return null;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const tokenRegex =
    /(<u>([\s\S]+?)<\/u>)|(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let lastIndex = 0;
  let matchIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    const start = match.index;
    const end = tokenRegex.lastIndex;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    if (match[1]) {
      nodes.push(
        <u key={`${keyPrefix}-underline-${matchIndex}`}>
          {renderInline(match[2], `${keyPrefix}-u${matchIndex}`)}
        </u>,
      );
    } else if (match[3]) {
      const label = match[4];
      const href = parseLink(match[5]);
      if (href) {
        nodes.push(
          <a
            key={`${keyPrefix}-link-${matchIndex}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#1f5f76] underline underline-offset-2 hover:text-[#17495b]"
          >
            {label}
          </a>,
        );
      } else {
        nodes.push(match[3]);
      }
    } else if (match[6]) {
      nodes.push(
        <strong key={`${keyPrefix}-strong-${matchIndex}`}>
          {renderInline(match[7], `${keyPrefix}-s${matchIndex}`)}
        </strong>,
      );
    } else if (match[8]) {
      nodes.push(
        <em key={`${keyPrefix}-em-${matchIndex}`}>
          {renderInline(match[9], `${keyPrefix}-e${matchIndex}`)}
        </em>,
      );
    } else if (match[10]) {
      nodes.push(
        <code
          key={`${keyPrefix}-code-${matchIndex}`}
          className="rounded bg-[#efe3d2] px-1 py-0.5 text-[0.92em]"
        >
          {match[11]}
        </code>,
      );
    }

    lastIndex = end;
    matchIndex += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderParagraphWithBreaks(block: string, keyPrefix: string): ReactNode {
  const lines = block.split("\n");
  return (
    <p className="text-base leading-relaxed text-[#42555f]">
      {lines.map((line, lineIndex) => (
        <span key={`${keyPrefix}-line-${lineIndex}`}>
          {lineIndex > 0 ? <br /> : null}
          {renderInline(line, `${keyPrefix}-${lineIndex}`)}
        </span>
      ))}
    </p>
  );
}

function renderBlock(block: string, index: number): ReactNode {
  const trimmed = block.trim();
  const key = `block-${index}`;
  if (!trimmed) {
    return null;
  }

  const imageMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(trimmed);
  if (imageMatch) {
    const alt = imageMatch[1].trim() || "Article image";
    const src = imageMatch[2].trim();
    return (
      <figure key={key} className="space-y-3">
        <img src={src} alt={alt} className="w-full rounded-3xl border border-[#d8c8b0] object-cover" />
        {imageMatch[1].trim() ? (
          <figcaption className="text-sm italic text-[#60717b]">{imageMatch[1].trim()}</figcaption>
        ) : null}
      </figure>
    );
  }

  const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const text = headingMatch[2];
    if (level === 1) {
      return (
        <h2 key={key} className="display-font text-4xl font-bold text-[#1f2d39]">
          {renderInline(text, `${key}-h1`)}
        </h2>
      );
    }
    if (level === 2) {
      return (
        <h3 key={key} className="display-font text-3xl font-bold text-[#1f2d39]">
          {renderInline(text, `${key}-h2`)}
        </h3>
      );
    }
    return (
      <h4 key={key} className="display-font text-2xl font-semibold text-[#1f2d39]">
        {renderInline(text, `${key}-h3`)}
      </h4>
    );
  }

  if (trimmed.startsWith("> ")) {
    return (
      <blockquote
        key={key}
        className="border-l-4 border-[#c8ad86] bg-[#f8f1e4] px-4 py-3 italic text-[#4a5b64]"
      >
        {renderInline(trimmed.slice(2), `${key}-quote`)}
      </blockquote>
    );
  }

  const lines = trimmed.split("\n").map((line) => line.trim());
  const isList = lines.length > 0 && lines.every((line) => line.startsWith("- "));
  if (isList) {
    return (
      <ul key={key} className="list-inside list-disc space-y-1 text-base leading-relaxed text-[#42555f]">
        {lines.map((line, lineIndex) => (
          <li key={`${key}-item-${lineIndex}`}>{renderInline(line.slice(2), `${key}-${lineIndex}`)}</li>
        ))}
      </ul>
    );
  }

  const orderedListPattern = /^\d+\.\s+/;
  const isOrderedList = lines.length > 0 && lines.every((line) => orderedListPattern.test(line));
  if (isOrderedList) {
    return (
      <ol key={key} className="list-inside list-decimal space-y-1 text-base leading-relaxed text-[#42555f]">
        {lines.map((line, lineIndex) => (
          <li key={`${key}-ordered-item-${lineIndex}`}>
            {renderInline(line.replace(orderedListPattern, ""), `${key}-ordered-${lineIndex}`)}
          </li>
        ))}
      </ol>
    );
  }

  return <div key={key}>{renderParagraphWithBreaks(trimmed, key)}</div>;
}

export function RichTextRenderer({ blocks }: RichTextRendererProps) {
  return <div className="space-y-5">{blocks.map((block, index) => renderBlock(block, index))}</div>;
}
