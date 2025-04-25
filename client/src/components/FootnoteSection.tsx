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
    <section className="mt-8 pt-6 border-t-2 border-gray-300 p-6 bg-gray-50 rounded-lg shadow-sm">
      <h3 className="text-xl font-bold mb-4 text-indigo-700">Notas de Rodapé</h3>
      <div className="space-y-4">
        {footnotes.map(footnote => (
          <div 
            key={footnote.id}
            id={`footnote-${footnote.id}`}
            className={`p-3 rounded ${
              highlightedFootnoteId === footnote.id 
                ? 'bg-amber-100 border-l-4 border-amber-500 transition-all duration-500' 
                : 'border-l-4 border-indigo-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="footnote-ref flex-shrink-0 mt-0.5">{footnote.id}</span>
              <span className="text-gray-700">{footnote.content}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
