import { useState } from "react";
import DocumentTree from "@/components/DocumentTree";
import DocumentContent from "@/components/DocumentContent";
import FootnoteSection from "@/components/FootnoteSection";
import { Button } from "@/components/ui/button";
import { ChevronLeft, X, AlignLeft, Bookmark } from "lucide-react";
import { type ParsedDocument, type DocumentNode } from "@/lib/types";

interface DocumentViewerProps {
  document: ParsedDocument;
  onReset: () => void;
}

export default function DocumentViewer({ document, onReset }: DocumentViewerProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(document.nodes[0]?.id || "");
  const [showSidebar, setShowSidebar] = useState(true);
  const [highlightedFootnoteId, setHighlightedFootnoteId] = useState<string | null>(null);
  
  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    // On mobile, hide sidebar after selection
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleFootnoteClick = (footnoteId: string) => {
    setHighlightedFootnoteId(footnoteId);
    
    // Scroll to footnote
    const footnoteElement = document.getElementById(`footnote-${footnoteId}`);
    if (footnoteElement) {
      footnoteElement.scrollIntoView({ behavior: "smooth" });
      
      // Clear the highlight after a delay
      setTimeout(() => {
        setHighlightedFootnoteId(null);
      }, 3000);
    }
  };

  // Filter out nodes relevant to the current selection for display
  const getContentNodes = (): DocumentNode[] => {
    if (!selectedNodeId) return [];
    
    // Find the selected node
    const findNode = (nodes: DocumentNode[], id: string): DocumentNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        
        if (node.children.length > 0) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const selectedNode = findNode(document.nodes, selectedNodeId);
    if (!selectedNode) return [];
    
    // For level0 (document title), show the full document
    if (selectedNode.level === 0) {
      return document.nodes;
    }
    
    // Otherwise, show the node and its children
    return [selectedNode];
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar toggle for mobile */}
      {!showSidebar && (
        <button 
          className="fixed z-10 top-20 left-4 bg-white rounded-full p-2 shadow-md md:hidden"
          onClick={() => setShowSidebar(true)}
        >
          <AlignLeft className="h-5 w-5 text-[color:hsl(var(--primary))]" />
        </button>
      )}
      
      {/* Sidebar Navigation */}
      <div 
        className={`${
          showSidebar ? 'flex' : 'hidden'
        } w-full md:w-1/4 bg-white shadow-md overflow-y-auto flex-col z-20 absolute md:relative inset-0 md:inset-auto`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[color:hsl(var(--muted))]">
          <h2 className="font-semibold text-[color:hsl(var(--primary))]">Document Structure</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onReset}
              title="Close document and upload new"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="md:hidden"
              onClick={() => setShowSidebar(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <DocumentTree 
            nodes={document.nodes} 
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect} 
          />
        </div>
        
        {document.footnotes.length > 0 && (
          <div className="p-4 border-t border-[color:hsl(var(--muted))]">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Bookmark className="h-4 w-4 text-[color:hsl(var(--accent))]" />
              <span>Footnotes</span>
            </div>
            <div className="text-xs">
              {document.footnotes.length} footnote{document.footnotes.length !== 1 ? 's' : ''} in this document
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-white flex flex-col">
        <DocumentContent 
          nodes={getContentNodes()}
          onFootnoteClick={handleFootnoteClick}
        />
        
        {document.footnotes.length > 0 && (
          <FootnoteSection 
            footnotes={document.footnotes} 
            highlightedFootnoteId={highlightedFootnoteId}
          />
        )}
      </div>
    </div>
  );
}
