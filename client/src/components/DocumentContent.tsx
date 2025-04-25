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
      // Adicionamos um id único para cada aparência da nota de rodapé, para poder referenciar de volta
      const specialMarkerRegex = /\(FOOTNOTE_(\d+)_(\d+)\)/g;
      let footnoteRefCount = 0;
      let processedContent = content.replace(specialMarkerRegex, (_, id, number) => {
        footnoteRefCount++;
        const refId = `footnote-ref-${id}-${footnoteRefCount}`;
        return `<a href="#footnote-${id}" id="${refId}" class="footnote-ref-circle" data-footnote-id="${id}" data-ref-id="${refId}">(${number})</a>`;
      });
      
      // Compatibilidade com outros formatos anteriores por segurança
      processedContent = processedContent.replace(/FOOTNOTE_REF_(\d+)_(\d+)/g, (_, id, number) => {
        footnoteRefCount++;
        const refId = `footnote-ref-${id}-${footnoteRefCount}`;
        return `<a href="#footnote-${id}" id="${refId}" class="footnote-ref-circle" data-footnote-id="${id}" data-ref-id="${refId}">(${number})</a>`;
      });

      // Processa referências de notas de rodapé no formato {{footnotenumberN}}N{{-footnotenumberN}}
      // Importante: este é um backup caso o processamento anterior não tenha feito a substituição
      const footnoteRegex = /{{footnotenumber(\d+)}}(\d+){{-footnotenumber\1}}/g;
      processedContent = processedContent.replace(footnoteRegex, (_, id, number) => {
        footnoteRefCount++;
        const refId = `footnote-ref-${id}-${footnoteRefCount}`;
        return `<a href="#footnote-${id}" id="${refId}" class="footnote-ref-circle" data-footnote-id="${id}" data-ref-id="${refId}">(${number})</a>`;
      });
      
      // Compatibilidade com o formato antigo
      const oldFootnoteRegex = /{{footnotenumber}}(.*?){{-footnotenumber}}/g;
      processedContent = processedContent.replace(oldFootnoteRegex, (_, number) => {
        footnoteRefCount++;
        const refId = `footnote-ref-${number}-${footnoteRefCount}`;
        return `<a href="#footnote-${number}" id="${refId}" class="footnote-ref-circle" data-footnote-id="${number}" data-ref-id="${refId}">(${number})</a>`;
      });
      
      return processedContent;
    };

    const getHeadingSize = (level: number, isTextLevel: boolean = false): string => {
      if (isTextLevel) {
        // Dentro de text_level, sem negrito e com fonte normal
        switch (level) {
          case 0: return "text-xl font-normal mb-2";
          case 1: return "text-lg font-normal mb-1.5";
          case 2: return "text-base font-normal mb-1";
          case 3: return "text-sm font-normal mb-1";
          case 4: return "text-xs font-normal mb-0.5";
          default: return "text-xs font-normal mb-0.5";
        }
      } else {
        // Fora de text_level, com negrito, maior e mais destaque
        switch (level) {
          case 0: return "text-3xl font-bold mb-4";
          case 1: return "text-2xl font-bold mb-3";
          case 2: return "text-xl font-bold mb-2";
          case 3: return "text-lg font-bold mb-1.5";
          case 4: return "text-base font-bold mb-1";
          default: return "text-sm font-bold mb-0.5";
        }
      }
    };

    // Sistema de cores atualizado conforme solicitação
    const getLevelColor = (level: number): string => {
      switch(level) {
        case 1: return "text-red-600"; // Vermelho para level1
        case 2: return "text-orange-500"; // Laranja para level2
        case 3: return "text-amber-500"; // Âmbar (mais claro) para level3
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
          className={`mb-3 ${
            isInsideTextLevel 
              ? 'text-base font-normal text-gray-700 leading-relaxed' 
              : 'text-base font-semibold bg-gradient-to-r from-blue-50 to-white px-4 py-3 rounded shadow-sm'
          }`}
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
      // Se o nível for 3 ou superior, ou se já estiver marcado como dentro de text_level
      const isInTextLevel = isInsideTextLevel || false;
      
      // Cabeçalhos fora de text_level devem ter um estilo mais destacado
      const headingStyle = isInTextLevel 
        ? "py-2 px-3" 
        : "py-3 px-4 bg-gradient-to-r from-slate-50 to-white rounded-lg shadow-sm mb-2";
      
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
      
      // Cor específica para level3 (ficará com uma cor mais clara para o texto)
      const levelColor = node.level === 3 
        ? "text-amber-600" // Laranja mais claro/amber para level3
        : getLevelColor(node.level);
        
      return (
        <section key={node.id} className={isRoot ? "" : "mb-3"}>
          <h2 className={`${getHeadingSize(node.level, isInTextLevel)} ${levelColor} ${headingStyle}`}>
            {processedHeadingContent}
          </h2>
          
          <div className={isInTextLevel ? "pl-4" : "px-2 py-1"}>
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
