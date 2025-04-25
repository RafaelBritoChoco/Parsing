import { useState, useEffect } from "react";
import DocumentTree from "@/components/DocumentTree";
import DocumentContent from "@/components/DocumentContent";
import FootnoteSection from "@/components/FootnoteSection";
import { Button } from "@/components/ui/button";
import { ChevronLeft, X, AlignLeft, Bookmark, Edit, Download, Eye, Save } from "lucide-react";
import { type ParsedDocument, type DocumentNode } from "@/lib/types";
import { parseDocument } from "@/lib/documentParser";

interface DocumentViewerProps {
  document: ParsedDocument;
  onReset: () => void;
}

export default function DocumentViewer({ document: initialDocument, onReset }: DocumentViewerProps) {
  const [documentData, setDocumentData] = useState<ParsedDocument>(initialDocument);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(documentData.nodes[0]?.id || "");
  const [showSidebar, setShowSidebar] = useState(true);
  const [highlightedFootnoteId, setHighlightedFootnoteId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [rawContent, setRawContent] = useState<string>("");
  const [savedContent, setSavedContent] = useState<string>("");
  const [documentSaved, setDocumentSaved] = useState(false);
  
  // Efeito para processar o documento quando for salvo
  useEffect(() => {
    if (documentSaved && savedContent) {
      try {
        // Reanalisamos o documento salvo para atualizar a visualização
        const parsedDocument = parseDocument(savedContent);
        setDocumentData(parsedDocument);
        
        // Atualizamos o ID selecionado para o primeiro nó do novo documento
        if (parsedDocument.nodes.length > 0) {
          setSelectedNodeId(parsedDocument.nodes[0].id);
        }
      } catch (error) {
        console.error("Erro ao analisar o documento:", error);
        window.alert("Houve um erro ao processar o documento. Verifique se a formatação está correta.");
      }
    }
  }, [savedContent, documentSaved]);
  
  // Função para converter o documento em texto bruto para edição
  const getDocumentRawText = () => {
    // Uma função recursiva para reconstruir o documento
    const buildRawText = (nodes: DocumentNode[], depth = 0): string => {
      let result = "";
      
      for (const node of nodes) {
        // Adiciona as tags de nível e o conteúdo - com quebra de linha dupla após cada tag de nível
        if (!node.isText) {
          result += `{{level${node.level}}}${node.content}{{-level${node.level}}}\n\n`;
          // Processa recursivamente os filhos
          if (node.children.length > 0) {
            result += buildRawText(node.children, depth + 1);
          }
        } else {
          // Para nós de texto, apenas adicionamos o conteúdo bruto
          if (node.level > 0) {
            result += `{{text_level}}${node.content}{{-text_level}}\n\n`;
          } else {
            result += `${node.content}\n\n`;
          }
        }
      }
      
      return result;
    };
    
    // Adiciona as notas de rodapé no final
    const buildFootnotes = (): string => {
      let result = "\n\n";
      
      for (const footnote of documentData.footnotes) {
        result += `{{footnote${footnote.id}}}${footnote.content}{{-footnote${footnote.id}}}\n`;
      }
      
      return result;
    };
    
    const rawText = buildRawText(documentData.nodes) + buildFootnotes();
    return rawText;
  };

  const toggleEditMode = () => {
    if (!editMode) {
      // Entrando no modo de edição
      const rawText = getDocumentRawText();
      setRawContent(rawText);
      setSavedContent(rawText);
      setDocumentSaved(true);
    } else if (documentSaved) {
      // Voltando para o modo de visualização com alterações salvas
      // Se houver conteúdo salvo, utilizamos ele
      setRawContent(savedContent);
    }
    setEditMode(!editMode);
  };
  
  const handleSave = () => {
    try {
      // Tenta processar o documento para ver se a sintaxe está correta
      const parsedDocument = parseDocument(rawContent);
      
      // Se chegou aqui, o documento é válido
      setSavedContent(rawContent);
      setDocumentData(parsedDocument);
      setDocumentSaved(true);
      
      // Atualizamos o ID selecionado para o primeiro nó do novo documento
      if (parsedDocument.nodes.length > 0) {
        setSelectedNodeId(parsedDocument.nodes[0].id);
      }
      
      // Mensagem para o usuário confirmando o salvamento
      window.alert("Documento salvo com sucesso. Você pode visualizá-lo clicando em 'Preview'.");
    } catch (error) {
      // Se houver um erro no processamento, notificar o usuário
      console.error("Erro ao processar o documento:", error);
      window.alert("Houve um erro ao processar o documento. Verifique se a formatação está correta.");
    }
  };
  
  const handleDownload = () => {
    // Cria um blob com o conteúdo bruto
    const blob = new Blob([rawContent], { type: 'text/plain' });
    
    // Cria um URL temporário para o download
    const url = URL.createObjectURL(blob);
    
    // Cria um elemento de âncora para o download
    const a = window.document.createElement('a');
    a.href = url;
    // Usa o título do documento ParsedDocument ou um nome padrão
    a.download = documentData.title ? `${documentData.title}.txt` : 'document.txt';
    
    // Adiciona o elemento ao documento, clica nele e o remove
    window.document.body.appendChild(a);
    a.click();
    
    // Limpa o URL e remove o elemento
    setTimeout(() => {
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    // On mobile, hide sidebar after selection
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleFootnoteClick = (footnoteId: string) => {
    setHighlightedFootnoteId(footnoteId);
    
    // Scroll to footnote - Usando window.document para garantir que estamos acessando o DOM do navegador
    setTimeout(() => {
      const footnoteElement = window.document.getElementById(`footnote-${footnoteId}`);
      if (footnoteElement) {
        footnoteElement.scrollIntoView({ behavior: "smooth", block: "center" });
        
        // Adicionar um destaque temporário ao elemento
        footnoteElement.classList.add("footnote-highlight-animation");
        
        // Remover o destaque após animação
        setTimeout(() => {
          footnoteElement.classList.remove("footnote-highlight-animation");
          setHighlightedFootnoteId(null);
        }, 3000);
      }
    }, 100); // Pequeno atraso para garantir que o DOM foi atualizado
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
    
    const selectedNode = findNode(documentData.nodes, selectedNodeId);
    if (!selectedNode) return [];
    
    // For level0 (document title), show the full document
    if (selectedNode.level === 0) {
      return documentData.nodes;
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
            nodes={documentData.nodes} 
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect} 
          />
        </div>
        
        {documentData.footnotes.length > 0 && (
          <div className="p-4 border-t border-[color:hsl(var(--muted))]">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Bookmark className="h-4 w-4 text-[color:hsl(var(--accent))]" />
              <span>Footnotes</span>
            </div>
            <div className="text-xs">
              {documentData.footnotes.length} footnote{documentData.footnotes.length !== 1 ? 's' : ''} in this document
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-white flex flex-col">
        {/* Barra de ferramentas para alternância entre modos de visualização e edição */}
        <div className="sticky top-0 z-10 bg-white shadow-sm p-2 border-b flex justify-between items-center">
          <div className="text-sm font-medium text-gray-600">
            {editMode ? 'Editing Mode - Raw Text Format' : 'Preview Mode'}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleEditMode}
              className="gap-1"
            >
              {editMode ? (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Preview</span>
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </>
              )}
            </Button>
            
            {editMode && (
              <>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  className="gap-1"
                >
                  <Save className="h-4 w-4" />
                  <span>Salvar</span>
                </Button>
                <Button 
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
              </>
            )}
          </div>
        </div>
      
        {editMode ? (
          <div className="p-4 flex-1 flex flex-col">
            <textarea
              className="flex-1 font-mono text-sm p-4 border rounded-md min-h-[400px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="Edit your document here..."
            />
            <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm">
              <h3 className="text-sm font-medium mb-2">Editing Tips:</h3>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                <li>Use <code className="bg-gray-100 px-1 rounded">{'{{levelX}}...{{-levelX}}'}</code> to define document structure (X = 0-9)</li>
                <li>Use <code className="bg-gray-100 px-1 rounded">{'{{text_level}}...{{-text_level}}'}</code> for content inside sections</li>
                <li>Use <code className="bg-gray-100 px-1 rounded">{'{{footnotenumberX}}X{{-footnotenumberX}}'}</code> for footnote references</li>
                <li>Use <code className="bg-gray-100 px-1 rounded">{'{{footnoteX}}...{{-footnoteX}}'}</code> to define footnotes</li>
                <li>Clique em <strong>Salvar</strong> para salvar o documento antes de visualizá-lo</li>
                <li>Use o botão <strong>Download</strong> para baixar o documento editado</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <DocumentContent 
              nodes={getContentNodes()}
              onFootnoteClick={handleFootnoteClick}
            />
            
            {documentData.footnotes.length > 0 && (
              <FootnoteSection 
                footnotes={documentData.footnotes} 
                highlightedFootnoteId={highlightedFootnoteId}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
