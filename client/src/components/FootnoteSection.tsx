import { type Footnote } from "@/lib/types";

interface FootnoteSectionProps {
  footnotes: Footnote[];
  highlightedFootnoteId: string | null;
}

export default function FootnoteSection({ footnotes, highlightedFootnoteId }: FootnoteSectionProps) {
  if (footnotes.length === 0) {
    return null;
  }

  // Função para obter a cor da nota de rodapé com base no ID
  const getFootnoteColor = (id: string) => {
    const colorMapping: { [key: string]: { bg: string, border: string, text: string } } = {
      "1": { bg: "bg-red-100", border: "border-red-500", text: "text-red-700" },
      "2": { bg: "bg-orange-100", border: "border-orange-500", text: "text-orange-700" },
      "3": { bg: "bg-lime-100", border: "border-lime-500", text: "text-lime-700" },
      "4": { bg: "bg-cyan-100", border: "border-cyan-500", text: "text-cyan-700" },
      "5": { bg: "bg-violet-100", border: "border-violet-500", text: "text-violet-700" },
      "6": { bg: "bg-pink-100", border: "border-pink-500", text: "text-pink-700" },
      "7": { bg: "bg-amber-100", border: "border-amber-500", text: "text-amber-700" },
      "8": { bg: "bg-emerald-100", border: "border-emerald-500", text: "text-emerald-700" },
      "9": { bg: "bg-indigo-100", border: "border-indigo-500", text: "text-indigo-700" },
      "10": { bg: "bg-purple-100", border: "border-purple-500", text: "text-purple-700" },
    };
    
    return colorMapping[id] || { bg: "bg-gray-100", border: "border-gray-500", text: "text-gray-700" };
  };
  
  // Função para rolar de volta para a referência da nota de rodapé
  const scrollToFootnoteRef = (footnoteId: string) => {
    // Primeiro, tentamos encontrar a primeira referência a esta nota no documento
    // usando o padrão de ID que criamos (footnote-ref-ID-X)
    const possibleRefs = Array.from(
      window.document.querySelectorAll(`[id^='footnote-ref-${footnoteId}-']`)
    );
    
    if (possibleRefs.length > 0) {
      // Vamos para a primeira ocorrência
      const firstRef = possibleRefs[0] as HTMLElement;
      firstRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Destacamos visualmente
      firstRef.classList.add('footnote-ref-highlight');
      
      // Remover o destaque após um tempo
      setTimeout(() => {
        firstRef.classList.remove('footnote-ref-highlight');
      }, 3000);
      
      return;
    }
    
    // Fallback para links mais antigos sem o formato específico
    const oldRefs = Array.from(
      window.document.querySelectorAll(`[data-footnote-id='${footnoteId}']`)
    );
    
    if (oldRefs.length > 0) {
      const firstRef = oldRefs[0] as HTMLElement;
      firstRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      firstRef.classList.add('footnote-ref-highlight');
      setTimeout(() => {
        firstRef.classList.remove('footnote-ref-highlight');
      }, 3000);
    }
  };

  return (
    <section className="mt-8 border-t border-gray-200 pt-8 pb-6">
      <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-md border border-blue-100">
        <h3 className="text-lg font-bold mb-6 flex items-center text-blue-700">
          <div className="bg-blue-100 p-2 rounded-full mr-3 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          Footnotes ({footnotes.length})
        </h3>
        <div className="space-y-4">
          {footnotes.map(footnote => {
            const colors = getFootnoteColor(footnote.id);
            const isHighlighted = highlightedFootnoteId === footnote.id;
            
            return (
              <div 
                key={footnote.id}
                id={`footnote-${footnote.id}`}
                className={`p-5 rounded-lg border ${
                  isHighlighted 
                    ? `${colors.border.replace('border-', 'border-')} bg-white shadow-lg transform scale-[1.02] transition-all duration-300 ease-in-out` 
                    : 'border-gray-200 bg-white hover:border-blue-200 shadow-sm hover:shadow transition-all duration-200'
                }`}
                onClick={() => scrollToFootnoteRef(footnote.id)}
                title="Clique para voltar à referência no texto"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${colors.bg} text-sm font-bold ${colors.text} shadow-sm border ${colors.border.replace('border-', 'border-')}`}>
                    {footnote.id}
                  </div>
                  <span className="text-gray-700 text-sm leading-relaxed">{footnote.content}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
