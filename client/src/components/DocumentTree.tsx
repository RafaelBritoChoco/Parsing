import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { type DocumentNode } from "@/lib/types";

interface DocumentTreeProps {
  nodes: DocumentNode[];
  selectedNodeId: string;
  onNodeSelect: (nodeId: string) => void;
}

export default function DocumentTree({ nodes, selectedNodeId, onNodeSelect }: DocumentTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };
  
  const getLevelColor = (level: number): string => {
    return `text-[color:hsl(var(--level${level}))]`;
  };

  const renderNode = (node: DocumentNode) => {
    const isExpanded = expandedNodes[node.id] || false;
    const hasChildren = node.children.length > 0;
    const isSelected = node.id === selectedNodeId;
    
    return (
      <li key={node.id} className="mb-1">
        <div 
          className={`flex items-start py-1 px-1 rounded-md cursor-pointer hover:bg-[color:hsl(var(--secondary))] ${
            isSelected ? 'bg-[color:hsl(var(--secondary))] font-medium' : ''
          }`}
        >
          {/* Expand/collapse icon for nodes with children */}
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.id)}
              className="mr-1 p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="w-5" /> // Spacer for alignment
          )}
          
          {/* Node label */}
          <span 
            className={`${getLevelColor(node.level)} text-sm ${node.isText ? 'italic' : 'font-medium'}`}
            onClick={() => onNodeSelect(node.id)}
          >
            {node.content}
          </span>
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <ul className="pl-4 border-l border-[color:hsl(var(--muted))]">
            {node.children.map(child => renderNode(child))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="document-tree">
      <ul className="space-y-1">
        {nodes.map(node => renderNode(node))}
      </ul>
    </div>
  );
}
