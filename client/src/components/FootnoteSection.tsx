import { type Footnote } from "@/lib/types";

interface FootnoteSectionProps {
  footnotes: Footnote[];
  highlightedFootnoteId: string | null;
}

export default function FootnoteSection({ footnotes, highlightedFootnoteId }: FootnoteSectionProps) {
  if (footnotes.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 pt-6 border-t-2 border-[color:hsl(var(--muted))] p-6">
      <h3 className="text-lg font-medium mb-4">Footnotes</h3>
      <div>
        {footnotes.map(footnote => (
          <div 
            key={footnote.id}
            id={`footnote-${footnote.id}`}
            className={`mb-3 ${
              highlightedFootnoteId === footnote.id ? 'highlight-footnote' : ''
            }`}
          >
            <span className="font-semibold text-[color:hsl(var(--accent))]">{footnote.id}.</span>{' '}
            <span>{footnote.content}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
