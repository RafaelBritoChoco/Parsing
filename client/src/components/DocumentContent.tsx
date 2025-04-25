import { type DocumentNode } from "@/lib/types";
import TextLevelWrapper from "./TextLevelWrapper";
import { useTextLevel } from "@/hooks/useTextLevel";

interface DocumentContentProps {
  nodes: DocumentNode[];
  onFootnoteClick: (footnoteId: string) => void;
  rawContent?: string | null;
}

export default function DocumentContent({ nodes, onFootnoteClick, rawContent }: DocumentContentProps) {
  // Use o hook para identificar nós dentro de {{text_level}}
  const textLevelNodesMap = useTextLevel(rawContent || null, nodes);
  // O parâmetro isInsideTextLevel indica se este nó está dentro de {{text_level}}
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
        // Dentro de text_level TODOS OS NÍVEIS têm o mesmo tamanho de fonte
        // Apenas vamos manter a formatação em negrito para as hierarquias
        return "text-sm font-medium mb-0.5"; // Tamanho único para TODOS os níveis dentro de text_level
      } else {
        // Fora de text_level, mantemos a hierarquia de tamanhos
        switch (level) {
          case 0: return "text-xl font-bold mb-2"; // Reduzido de 3xl para xl
          case 1: return "text-lg font-bold mb-1.5"; // Reduzido de 2xl para lg
          case 2: return "text-base font-bold mb-1"; // Reduzido de xl para base
          case 3: return "text-sm font-bold mb-1"; // Reduzido de lg para sm
          case 4: return "text-xs font-bold mb-0.5"; // Reduzido de base para xs
          default: return "text-xs font-semibold mb-0.5"; // Mantido xs
        }
      }
    };

    // Sistema de cores fixas para cada nível, conforme solicitação
    const getLevelColor = (level: number): string => {
      switch(level) {
        case 1: return "text-red-600"; // Vermelho para level1
        case 2: return "text-orange-500"; // Laranja para level2
        case 3: return "text-blue-600"; // Azul para level3
        case 4: return "text-green-600"; // Verde para level4
        case 5: return "text-pink-600"; // Rosa para level5
        case 6: return "text-yellow-700"; // Mostarda para level6
        case 7: return "text-purple-600"; // Roxo para level7
        case 8: return "text-teal-600"; // Teal para level8
        case 9: return "text-indigo-600"; // Índigo para level9
        default: return "text-gray-800"; // Padrão para level0 ou outros
      }
    };

    if (node.isText) {
      // Todo nó com isText=true é considerado dentro de text_level
      return (
        <div 
          key={node.id}
          className="mb-2 text-sm px-3 py-2 rounded shadow-sm"
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
      // Verifica se o nó tem a propriedade inTextLevel ou se usa a flag passada pelo pai
      // Este valor é passado recursivamente para todas as renderizações de nós filhos
      const isInTextLevel = node.inTextLevel || isInsideTextLevel;
      
      // Definir o estilo com base em text_level, mas não aplicaremos o fundo aqui
      // porque já é feito pelo TextLevelWrapper quando necessário
      const headingStyle = isInTextLevel 
        ? "py-0.5 px-3 mb-0.5" // Espaçamento mínimo para dentro de text_level
        : "py-1 px-3 bg-gray-200 rounded shadow-sm mb-0.5"; // Espaçamento reduzido para fora de text_level
      
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
      
      // Usar o sistema de cores fixo para todos os níveis
      const levelColor = getLevelColor(node.level);
        
      return (
        <section key={node.id} className={isRoot ? "" : "mb-0.5"}>
          <h2 className={`${getHeadingSize(node.level, isInTextLevel)} ${levelColor} ${headingStyle}`}>
            {processedHeadingContent}
          </h2>
          
          <div className={`${levelColor} ${isInTextLevel 
            ? "pl-3 py-0.5 mt-0.5" // Espaçamento vertical menor
            : "px-2 py-0.5 mt-0.5"}`}>
            {node.children.map(child => renderContent(child, false, isInTextLevel))}
          </div>
        </section>
      );
    }
  };

  return (
    <div className="p-4 flex-1">
      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Select a section from the sidebar to view content</p>
        </div>
      ) : (
        <div>
          {nodes.map(node => {
            // Se o nó for marcado como isText: true, inTextLevel: true ou identificado pelo hook como parte de text_level
            const isTextLevelNode = node.isText || node.inTextLevel || textLevelNodesMap[node.id] === true;
            
            if (isTextLevelNode) {
              return (
                <TextLevelWrapper key={node.id}>
                  {renderContent(node, true, true)}
                </TextLevelWrapper>
              );
            } else {
              return renderContent(node, true, false);
            }
          })}
          
          {/* Para debugar, mostramos quais nós foram marcados como text_level */}
          {/* <div className="mt-8 p-4 border border-gray-200 rounded-lg bg-gray-50 text-xs">
            <h3 className="font-bold mb-2">Debug: TextLevel Nodes</h3>
            <pre>{JSON.stringify(textLevelNodesMap, null, 2)}</pre>
          </div> */}
        </div>
      )}
    </div>
  );
}
