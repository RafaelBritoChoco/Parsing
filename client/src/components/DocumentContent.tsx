import { type DocumentNode } from "@/lib/types";

interface DocumentContentProps {
  nodes: DocumentNode[];
  onFootnoteClick: (footnoteId: string) => void;
}

export default function DocumentContent({ nodes, onFootnoteClick }: DocumentContentProps) {
  const renderContent = (node: DocumentNode, isRoot = false) => {
    // Process content to render footnote references
    const processFootnoteRefs = (content: string) => {
      if (!content.includes('{{footnotenumber}}')) return content;
      
      let processedContent = content;
      const footnoteRegex = /{{footnotenumber}}(.*?){{-footnotenumber}}/g;
      
      return processedContent.replace(footnoteRegex, (_, number) => {
        return `<span class="footnote-ref" data-footnote-id="${number}">${number}</span>`;
      });
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

    const getLevelColor = (level: number): string => {
      return `text-[color:hsl(var(--level${level}))]`;
    };

    if (node.isText) {
      return (
        <div 
          key={node.id}
          className={`mb-3 text-gray-700`}
          dangerouslySetInnerHTML={{ 
            __html: processFootnoteRefs(node.content) 
          }}
          onClick={(e) => {
            // Handle footnote reference clicks
            const target = e.target as HTMLElement;
            if (target.classList.contains('footnote-ref')) {
              const footnoteId = target.getAttribute('data-footnote-id');
              if (footnoteId) {
                onFootnoteClick(footnoteId);
              }
            }
          }}
        />
      );
    } else {
      return (
        <section key={node.id} className={isRoot ? "" : "mb-8"}>
          <h2 className={`${getHeadingSize(node.level)} ${getLevelColor(node.level)}`}>
            {node.content}
          </h2>
          
          <div className={`level-content level${node.level}-content`}>
            {node.children.map(child => renderContent(child))}
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
