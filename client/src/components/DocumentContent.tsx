import { type DocumentNode } from "@/lib/types";

interface DocumentContentProps {
  nodes: DocumentNode[];
  onFootnoteClick: (footnoteId: string) => void;
}

export default function DocumentContent({ nodes, onFootnoteClick }: DocumentContentProps) {
  const renderContent = (node: DocumentNode, isRoot = false, isInsideTextLevel = false) => {
    // Process content to render footnote references
    const processFootnoteRefs = (content: string) => {
      // Primeiro, processa nossos marcadores especiais (FOOTNOTE_N_N)
      const specialMarkerRegex = /\(FOOTNOTE_(\d+)_(\d+)\)/g;
      let processedContent = content.replace(specialMarkerRegex, (_, id, number) => {
        return `<a href="#footnote-${id}" class="footnote-ref-circle" data-footnote-id="${id}">(${number})</a>`;
      });
      
      // Compatibilidade com outros formatos anteriores por segurança
      processedContent = processedContent.replace(/FOOTNOTE_REF_(\d+)_(\d+)/g, (_, id, number) => {
        return `<a href="#footnote-${id}" class="footnote-ref-circle" data-footnote-id="${id}">(${number})</a>`;
      });

      // Processa referências de notas de rodapé no formato {{footnotenumberN}}N{{-footnotenumberN}}
      // Importante: este é um backup caso o processamento anterior não tenha feito a substituição
      const footnoteRegex = /{{footnotenumber(\d+)}}(\d+){{-footnotenumber\1}}/g;
      processedContent = processedContent.replace(footnoteRegex, (_, id, number) => {
        return `<a href="#footnote-${id}" class="footnote-ref-circle" data-footnote-id="${id}">(${number})</a>`;
      });
      
      // Compatibilidade com o formato antigo
      const oldFootnoteRegex = /{{footnotenumber}}(.*?){{-footnotenumber}}/g;
      processedContent = processedContent.replace(oldFootnoteRegex, (_, number) => {
        return `<a href="#footnote-${number}" class="footnote-ref-circle" data-footnote-id="${number}">(${number})</a>`;
      });
      
      return processedContent;
    };

    const getHeadingSize = (level: number): string => {
      switch (level) {
        case 0: return "text-3xl font-bold mb-6";
        case 1: return "text-2xl font-semibold mb-4";
        case 2: return "text-xl font-medium mb-3";
        case 3: return "text-lg font-medium mb-2";
        case 4: return "text-base font-medium mb-1";
        default: return "text-sm font-medium mb-1";
      }
    };

    // Sistema de cores conforme solicitado
    const getLevelColor = (level: number): string => {
      switch(level) {
        case 1: return "text-red-600"; // Vermelho para level1
        case 2: return "text-orange-500"; // Laranja para level2
        case 3: return "text-blue-600"; // Azul para level3
        case 4: return "text-green-600"; // Verde para level4
        case 5: return "text-purple-600"; // Roxo para level5
        case 6: return "text-pink-600"; // Rosa para level6
        case 7: return "text-yellow-600"; // Amarelo para level7
        case 8: return "text-emerald-600"; // Esmeralda para level8
        case 9: return "text-cyan-600"; // Ciano para level9
        default: return "text-gray-800"; // Padrão para level0 ou outros
      }
    };

    if (node.isText) {
      return (
        <div 
          key={node.id}
          className={`mb-3 ${isInsideTextLevel ? 'underline decoration-gray-300 underline-offset-4' : ''}`}
          dangerouslySetInnerHTML={{ 
            __html: processFootnoteRefs(node.content) 
          }}
          onClick={(e) => {
            // Handle footnote reference clicks
            const target = e.target as HTMLElement;
            if (target.classList.contains('footnote-ref') || target.classList.contains('footnote-ref-circle')) {
              e.preventDefault();
              const footnoteId = target.getAttribute('data-footnote-id');
              if (footnoteId) {
                // Usamos a callback fornecida para garantir consistência com o componente pai
                onFootnoteClick(footnoteId);
              }
            }
          }}
        />
      );
    } else {
      // Determina se este nó está dentro de text_level
      // Para fins de demonstração, marcamos que os níveis 2+ geralmente estão dentro de text_level
      const isInTextLevel = node.level >= 2;
      
      const processedHeadingContent = node.content.includes("FOOTNOTE") || 
        node.content.includes("{{footnotenumber") ? 
        <div dangerouslySetInnerHTML={{ __html: processFootnoteRefs(node.content) }} 
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('footnote-ref-circle')) {
              e.preventDefault();
              const footnoteId = target.getAttribute('data-footnote-id');
              if (footnoteId) {
                // Delegamos a navegação para o componente pai usando a callback
                onFootnoteClick(footnoteId);
              }
            }
          }} /> 
        : <>{node.content}</>;
        
      return (
        <section key={node.id} className={isRoot ? "" : "mb-8"}>
          <h2 className={`${getHeadingSize(node.level)} ${getLevelColor(node.level)} 
            ${isInTextLevel ? 'underline decoration-gray-300 underline-offset-4' : ''}`}>
            {processedHeadingContent}
          </h2>
          
          <div className={`level-content level${node.level}-content`}>
            {node.children.map(child => renderContent(child, false, isInTextLevel))}
          </div>
        </section>
      );
    }
  };

  return (
    <div className="p-6 flex-1">
      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Select a section from the sidebar to view content</p>
        </div>
      ) : (
        <div>
          {nodes.map(node => renderContent(node, true))}
        </div>
      )}
    </div>
  );
}
