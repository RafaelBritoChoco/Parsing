import { useState, useEffect } from "react";
import DocumentTree from "@/components/DocumentTree";
import DocumentContent from "@/components/DocumentContent";
import FootnoteSection from "@/components/FootnoteSection";
import { Button } from "@/components/ui/button";
import { ChevronLeft, X, AlignLeft, Bookmark, Edit, Download, Eye, Save } from "lucide-react";
import { type ParsedDocument, type DocumentNode } from "@/lib/types";
import { parseDocument } from "@/lib/documentParser";
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

interface DocumentViewerProps {
  document: ParsedDocument;
  onReset: () => void;
  originalContent?: string; // Conteúdo original do documento
}

// Função personalizada para colorir tags no texto com cores específicas
const highlightWithColors = (code: string) => {
  // Não vamos modificar o texto durante o highlighting
  // As quebras de linha serão tratadas na função getDocumentRawText
  let formattedCode = code;

  // Agora aplicamos as cores específicas
  return formattedCode
    // Cores específicas para cada nível
    .replace(/(\{\{level1\}\})/g, '<span style="color: #e53935; font-weight: bold;">$1</span>') // vermelho
    .replace(/(\{\{-level1\}\})/g, '<span style="color: #e53935; font-weight: bold;">$1</span>')
    .replace(/(\{\{level2\}\})/g, '<span style="color: #ff9800; font-weight: bold;">$1</span>') // laranja
    .replace(/(\{\{-level2\}\})/g, '<span style="color: #ff9800; font-weight: bold;">$1</span>')
    .replace(/(\{\{level3\}\})/g, '<span style="color: #2196f3; font-weight: bold;">$1</span>') // azul
    .replace(/(\{\{-level3\}\})/g, '<span style="color: #2196f3; font-weight: bold;">$1</span>')
    .replace(/(\{\{level4\}\})/g, '<span style="color: #4caf50; font-weight: bold;">$1</span>') // verde
    .replace(/(\{\{-level4\}\})/g, '<span style="color: #4caf50; font-weight: bold;">$1</span>')
    .replace(/(\{\{level5\}\})/g, '<span style="color: #e91e63; font-weight: bold;">$1</span>') // rosa
    .replace(/(\{\{-level5\}\})/g, '<span style="color: #e91e63; font-weight: bold;">$1</span>')
    .replace(/(\{\{level6\}\})/g, '<span style="color: #b7940e; font-weight: bold;">$1</span>') // mostarda
    .replace(/(\{\{-level6\}\})/g, '<span style="color: #b7940e; font-weight: bold;">$1</span>')
    // Para níveis genéricos ou outros não especificados
    .replace(/(\{\{level\d+\}\})/g, '<span style="color: #1e88e5; font-weight: bold;">$1</span>')
    .replace(/(\{\{-level\d+\}\})/g, '<span style="color: #1e88e5; font-weight: bold;">$1</span>')
    // Text level com amarelo forte
    .replace(/(\{\{text_level\}\})/g, '<span style="color: #ffd600; font-weight: bold; background-color: rgba(255, 214, 0, 0.2);">$1</span>')
    .replace(/(\{\{-text_level\}\})/g, '<span style="color: #ffd600; font-weight: bold; background-color: rgba(255, 214, 0, 0.2);">$1</span>')
    // Footnotes e footnote numbers
    .replace(/(\{\{footnote\d+\}\})/g, '<span style="color: #9c27b0; font-weight: bold;">$1</span>')
    .replace(/(\{\{-footnote\d+\}\})/g, '<span style="color: #9c27b0; font-weight: bold;">$1</span>')
    .replace(/(\{\{footnotenumber\d+\}\}\d+\{\{-footnotenumber\d+\}\})/g, 
      (match) => {
        return match
          .replace(/(\{\{footnotenumber\d+\}\})/g, '<span style="color: #ff9800; font-weight: bold;">$1</span>')
          .replace(/(\{\{-footnotenumber\d+\}\})/g, '<span style="color: #ff9800; font-weight: bold;">$1</span>');
      });
};

export default function DocumentViewer({ document: initialDocument, onReset, originalContent }: DocumentViewerProps) {
  const [documentData, setDocumentData] = useState<ParsedDocument>(initialDocument);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(documentData.nodes[0]?.id || "");
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [highlightedFootnoteId, setHighlightedFootnoteId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  // Se temos o conteúdo original, usamos ele; caso contrário, usamos uma string vazia
  const [rawContent, setRawContent] = useState<string>(originalContent || "");
  const [savedContent, setSavedContent] = useState<string>(originalContent || "");
  const [documentSaved, setDocumentSaved] = useState(!!originalContent);

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
    const buildRawText = (nodes: DocumentNode[], depth = 0, isInTextLevel = false): string => {
      let result = "";
      let textLevelContent = "";
      let hasTextLevelContent = false;

      for (const node of nodes) {
        // Se estamos processando nós dentro de um text_level
        if (node.inTextLevel && !isInTextLevel) {
          // Este é um nó dentro de text_level mas não estamos dentro de um bloco text_level ainda
          // Vamos coletar todos os nós inTextLevel e colocá-los dentro de um único bloco text_level
          hasTextLevelContent = true;
          // Formatação correta: quebra linha antes do {{levelx}} mas não no {{-levelx}}
          textLevelContent += `\n{{level${node.level}}}${node.content}{{-level${node.level}}}`;
          
          // Processar filhos, se houver, dentro do mesmo text_level
          if (node.children.length > 0) {
            textLevelContent += buildRawText(node.children, depth + 1, true);
          }
        }
        // Para nós regulares (fora de text_level)
        else if (!node.isText && !node.inTextLevel) {
          // Formatação correta: quebra de linha antes do {{levelx}}
          result += `\n{{level${node.level}}}${node.content}{{-level${node.level}}}\n`;

          // Processar filhos, se houver
          if (node.children.length > 0) {
            result += buildRawText(node.children, depth + 1, false);
          }
        } 
        // Para nós de texto regular (text_level direto)
        else if (node.isText) {
          // Quebra após {{text_level}} e antes de {{-text_level}}
          result += `\n{{text_level}}\n${node.content}\n{{-text_level}}\n`;
        }
        // Nós dentro de um text_level já aberto
        else if (isInTextLevel) {
          // Formatação correta: quebra linha antes do {{levelx}} mas não no {{-levelx}}
          result += `\n{{level${node.level}}}${node.content}{{-level${node.level}}}`;
          
          // Processar filhos, se houver, dentro do mesmo text_level
          if (node.children.length > 0) {
            result += buildRawText(node.children, depth + 1, true);
          }
        }
      }

      // Se coletamos conteúdo de text_level, adicionamos ele com as tags apropriadas
      // Formatação exata conforme solicitado pelo usuário
      if (hasTextLevelContent) {
        result += `\n{{text_level}}\n${textLevelContent}\n{{-text_level}}\n`;
      }

      return result;
    };

    // Adiciona as notas de rodapé no final
    const buildFootnotes = (): string => {
      let result = "\n\n";

      for (const footnote of documentData.footnotes) {
        // Quebras de linha antes de {{footnote}} mas não antes de {{-footnote}}
        result += `\n{{footnote${footnote.id}}}\n${footnote.content}{{-footnote${footnote.id}}}\n`;
      }

      return result;
    };

    const rawText = buildRawText(documentData.nodes) + buildFootnotes();
    return rawText;
  };

  const toggleEditMode = () => {
    if (!editMode) {
      // Entrando no modo de edição
      // Usamos o conteúdo original se disponível, ou recriamos o documento
      if (originalContent) {
        setRawContent(originalContent);
        setSavedContent(originalContent);
      } else {
        const rawText = getDocumentRawText();
        setRawContent(rawText);
        setSavedContent(rawText);
      }
      setDocumentSaved(true);
    } else if (documentSaved) {
      // Voltando para o modo de visualização com alterações salvas
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
        } ${
          sidebarCollapsed ? 'md:w-16' : 'md:w-1/4'
        } w-full bg-white shadow-md overflow-y-auto flex-col z-20 absolute md:relative inset-0 md:inset-auto transition-all duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[color:hsl(var(--muted))]">
          {!sidebarCollapsed && (
            <h2 className="font-semibold text-[color:hsl(var(--primary))]">Document Structure</h2>
          )}
          <div className="flex gap-2 ml-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden md:flex"
            >
              <ChevronLeft className={`h-4 w-4 transform transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </Button>
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
            collapsed={sidebarCollapsed}
          />
        </div>

        {documentData.footnotes.length > 0 && (
          <div className="p-4 border-t border-[color:hsl(var(--muted))]">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Bookmark className="h-4 w-4 text-[color:hsl(var(--accent))]" />
              {!sidebarCollapsed && <span>Footnotes</span>}
            </div>
            {!sidebarCollapsed && (
              <div className="text-xs">
                {documentData.footnotes.length} footnote{documentData.footnotes.length !== 1 ? 's' : ''} in this document
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-white flex flex-col">
        {/* Barra de ferramentas para alternância entre modos de visualização e edição */}
        <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3 border-b flex justify-between items-center">
          <div className="text-sm font-medium bg-blue-50 px-3 py-1 rounded-full text-blue-600 border border-blue-100">
            {editMode ? 'Editing Mode - Raw Text Format' : 'Preview Mode'}
          </div>
          <div className="flex gap-3">
            <Button 
              variant={editMode ? "outline" : "default"}
              size="sm"
              onClick={toggleEditMode}
              className={`gap-1 px-4 rounded-full shadow-sm transition-all ${editMode ? "hover:bg-blue-50 hover:text-blue-600 border-blue-200" : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"}`}
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
                  className="gap-1 px-4 rounded-full border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  <span>Salvar</span>
                </Button>
                <Button 
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-1 px-4 rounded-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {editMode ? (
          <div className="p-6 flex-1 flex flex-col">
            <div className="editor-wrapper flex-1 font-mono text-sm border border-gray-200 rounded-lg min-h-[400px] focus-within:ring-2 focus-within:ring-blue-500 shadow-inner bg-gray-50 overflow-auto">
              <Editor
                value={rawContent}
                onValueChange={setRawContent}
                highlight={(code) => {
                  return `<div>${highlightWithColors(code)}</div>`;
                }}
                padding={20}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 14,
                  minHeight: "400px",
                  lineHeight: 1.5, // Aumentar o espaçamento entre linhas para melhor legibilidade
                  whiteSpace: 'pre-wrap'
                }}
                textareaClassName="editor-textarea"
                className="editor-highlight"
                placeholder="Edit your document here..."
              />
            </div>
            <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm">
              <h3 className="text-sm font-medium mb-3 text-indigo-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Editing Tips
              </h3>
              <ul className="space-y-2 text-xs text-gray-700">
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <div>
                    Use <code className="bg-white px-1.5 py-0.5 rounded-md border border-blue-100 font-bold text-blue-700">{'{{levelX}}...{{-levelX}}'}</code> to define document structure (X = 0-9)
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <div>
                    Use <code className="bg-white px-1.5 py-0.5 rounded-md border border-blue-100 font-bold text-blue-700">{'{{text_level}}...{{-text_level}}'}</code> for content inside sections
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <div>
                    Use <code className="bg-white px-1.5 py-0.5 rounded-md border border-blue-100 font-bold text-blue-700">{'{{footnotenumberX}}X{{-footnotenumberX}}'}</code> for footnote references
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <div>
                    Use <code className="bg-white px-1.5 py-0.5 rounded-md border border-blue-100 font-bold text-blue-700">{'{{footnoteX}}...{{-footnoteX}}'}</code> to define footnotes
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <div>
                    Clique em <span className="font-medium text-green-600">Salvar</span> para salvar o documento antes de visualizá-lo
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <div>
                    Use o botão <span className="font-medium text-green-600">Download</span> para baixar o documento editado
                  </div>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <DocumentContent 
              nodes={getContentNodes()}
              onFootnoteClick={handleFootnoteClick}
              rawContent={originalContent || rawContent || savedContent}
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