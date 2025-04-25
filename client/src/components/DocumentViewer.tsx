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

// Função personalizada para colorir tags e conteúdo no texto com classes CSS
const highlightWithColors = (code: string) => {
  let formattedCode = code;

  // Colorir usando classes CSS em vez de estilos inline - isso resolve o problema de seleção
  // Tratamento simplificado apenas para as tags {{levelX}} e {{-levelX}}
  // Isso evita o problema de caracteres estranhos após as tags
  
  // Nível 1 - Vermelho
  formattedCode = formattedCode.replace(/\{\{level1\}\}/g, '<span class="level1">{{level1}}</span>');
  formattedCode = formattedCode.replace(/\{\{-level1\}\}/g, '<span class="level1">{{-level1}}</span>');
  
  // Nível 2 - Laranja
  formattedCode = formattedCode.replace(/\{\{level2\}\}/g, '<span class="level2">{{level2}}</span>');
  formattedCode = formattedCode.replace(/\{\{-level2\}\}/g, '<span class="level2">{{-level2}}</span>');
  
  // Nível 3 - Azul
  formattedCode = formattedCode.replace(/\{\{level3\}\}/g, '<span class="level3">{{level3}}</span>');
  formattedCode = formattedCode.replace(/\{\{-level3\}\}/g, '<span class="level3">{{-level3}}</span>');
  
  // Nível 4 - Verde
  formattedCode = formattedCode.replace(/\{\{level4\}\}/g, '<span class="level4">{{level4}}</span>');
  formattedCode = formattedCode.replace(/\{\{-level4\}\}/g, '<span class="level4">{{-level4}}</span>');
  
  // Nível 5 - Rosa
  formattedCode = formattedCode.replace(/\{\{level5\}\}/g, '<span class="level5">{{level5}}</span>');
  formattedCode = formattedCode.replace(/\{\{-level5\}\}/g, '<span class="level5">{{-level5}}</span>');
  
  // Nível 6 - Mostarda
  formattedCode = formattedCode.replace(/\{\{level6\}\}/g, '<span class="level6">{{level6}}</span>');
  formattedCode = formattedCode.replace(/\{\{-level6\}\}/g, '<span class="level6">{{-level6}}</span>');
  
  // Níveis 7-9 com o mesmo padrão simplificado para evitar caracteres estranhos
  formattedCode = formattedCode.replace(/\{\{level7\}\}/g, '<span class="level7">{{level7}}</span>');
  formattedCode = formattedCode.replace(/\{\{-level7\}\}/g, '<span class="level7">{{-level7}}</span>');
  
  formattedCode = formattedCode.replace(/\{\{level8\}\}/g, '<span class="level8">{{level8}}</span>');
  formattedCode = formattedCode.replace(/\{\{-level8\}\}/g, '<span class="level8">{{-level8}}</span>');
  
  formattedCode = formattedCode.replace(/\{\{level9\}\}/g, '<span class="level9">{{level9}}</span>');
  formattedCode = formattedCode.replace(/\{\{-level9\}\}/g, '<span class="level9">{{-level9}}</span>');
  
  // Tratamento simplificado apenas para as tags text_level
  formattedCode = formattedCode.replace(/\{\{text_level\}\}/g, '<span class="text-level">{{text_level}}</span>');
  formattedCode = formattedCode.replace(/\{\{-text_level\}\}/g, '<span class="text-level">{{-text_level}}</span>');
  
  // Footnotes - processamos cada uma individualmente para evitar problemas com captura de grupos
  formattedCode = formattedCode.replace(/\{\{footnote1\}\}/g, '<span class="footnote">{{footnote1}}</span>');
  formattedCode = formattedCode.replace(/\{\{-footnote1\}\}/g, '<span class="footnote">{{-footnote1}}</span>');
  
  formattedCode = formattedCode.replace(/\{\{footnote2\}\}/g, '<span class="footnote">{{footnote2}}</span>');
  formattedCode = formattedCode.replace(/\{\{-footnote2\}\}/g, '<span class="footnote">{{-footnote2}}</span>');
  
  formattedCode = formattedCode.replace(/\{\{footnote3\}\}/g, '<span class="footnote">{{footnote3}}</span>');
  formattedCode = formattedCode.replace(/\{\{-footnote3\}\}/g, '<span class="footnote">{{-footnote3}}</span>');
  
  formattedCode = formattedCode.replace(/\{\{footnote4\}\}/g, '<span class="footnote">{{footnote4}}</span>');
  formattedCode = formattedCode.replace(/\{\{-footnote4\}\}/g, '<span class="footnote">{{-footnote4}}</span>');
  
  formattedCode = formattedCode.replace(/\{\{footnote5\}\}/g, '<span class="footnote">{{footnote5}}</span>');
  formattedCode = formattedCode.replace(/\{\{-footnote5\}\}/g, '<span class="footnote">{{-footnote5}}</span>');
  
  // Footnote numbers - também tratados individualmente
  formattedCode = formattedCode.replace(/\{\{footnotenumber1\}\}/g, '<span class="footnumber">{{footnotenumber1}}</span>');
  formattedCode = formattedCode.replace(/\{\{-footnotenumber1\}\}/g, '<span class="footnumber">{{-footnotenumber1}}</span>');
  
  formattedCode = formattedCode.replace(/\{\{footnotenumber2\}\}/g, '<span class="footnumber">{{footnotenumber2}}</span>');
  formattedCode = formattedCode.replace(/\{\{-footnotenumber2\}\}/g, '<span class="footnumber">{{-footnotenumber2}}</span>');
  
  formattedCode = formattedCode.replace(/\{\{footnotenumber3\}\}/g, '<span class="footnumber">{{footnotenumber3}}</span>');
  formattedCode = formattedCode.replace(/\{\{-footnotenumber3\}\}/g, '<span class="footnumber">{{-footnotenumber3}}</span>');
  
  formattedCode = formattedCode.replace(/\{\{footnotenumber4\}\}/g, '<span class="footnumber">{{footnotenumber4}}</span>');
  formattedCode = formattedCode.replace(/\{\{-footnotenumber4\}\}/g, '<span class="footnumber">{{-footnotenumber4}}</span>');
  
  formattedCode = formattedCode.replace(/\{\{footnotenumber5\}\}/g, '<span class="footnumber">{{footnotenumber5}}</span>');
  formattedCode = formattedCode.replace(/\{\{-footnotenumber5\}\}/g, '<span class="footnumber">{{-footnotenumber5}}</span>');
  
  return formattedCode;
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
  const [hasEdits, setHasEdits] = useState(false); // Rastreia se existem edições não salvas
  const [comparisonMode, setComparisonMode] = useState(false); // Novo modo de comparação

  // Efeito para processar o documento quando for salvo ou ao alternar entre modos
  useEffect(() => {
    if ((documentSaved && savedContent) || (!editMode && hasEdits)) {
      try {
        // Reanalisamos o documento para atualizar a visualização
        // Se estiver no modo de edição, usamos rawContent diretamente
        // Se não estiver no modo de edição, usamos o conteúdo mais recente (rawContent se houver edições)
        const contentToProcess = editMode ? rawContent : (hasEdits ? rawContent : savedContent);
        
        if (contentToProcess) {
          const parsedDocument = parseDocument(contentToProcess);
          setDocumentData(parsedDocument);
  
          // Atualizamos o ID selecionado para o primeiro nó do novo documento
          if (parsedDocument.nodes.length > 0) {
            setSelectedNodeId(parsedDocument.nodes[0].id);
          }
        }
      } catch (error) {
        console.error("Erro ao analisar o documento:", error);
        // Só exibimos o alerta se o usuário estiver tentando salvar
        if (documentSaved) {
          window.alert("Houve um erro ao processar o documento. Verifique se a formatação está correta.");
        }
      }
    }
  }, [savedContent, documentSaved, editMode, rawContent, hasEdits]);

  // Função para converter o documento em texto bruto para edição
  const getDocumentRawText = () => {
    // Uma função recursiva para reconstruir o documento com o formato exato solicitado
    const buildRawText = (nodes: DocumentNode[], depth = 0, isInTextLevel = false): string => {
      let result = "";
      
      // Em vez de usar textLevelContent, vamos reformular para processar cada nó individualmente
      // e formatá-los com exatidão
      
      if (isInTextLevel) {
        // Se já estamos em um text_level, processamos cada nó individualmente
        for (const node of nodes) {
          if (!node.isText) {
            // Formatação com quebra de linha antes e depois de cada tag
            result += `\n\n{{level${node.level}}}\n${node.content}\n{{-level${node.level}}}\n\n`;
            
            // Processar filhos recursivamente
            if (node.children.length > 0) {
              result += buildRawText(node.children, depth + 1, true);
            }
          } else {
            // Para nós de texto
            result += `\n${node.content}\n`;
          }
        }
      } else {
        // Processamento normal de nós fora de text_level
        
        // Primeiro, agrupamos os nós por tipo (inTextLevel ou não)
        const textLevelNodes: DocumentNode[] = [];
        const regularNodes: DocumentNode[] = [];
        
        for (const node of nodes) {
          if (node.inTextLevel) {
            textLevelNodes.push(node);
          } else {
            regularNodes.push(node);
          }
        }
        
        // Processamos os nós regulares
        for (const node of regularNodes) {
          if (!node.isText) {
            // Formato sem quebra de linha após {{levelX}} para juntar com o conteúdo
            result += `\n\n{{level${node.level}}}${node.content} {{-level${node.level}}}\n\n`;
            
            // Processar filhos
            if (node.children.length > 0) {
              result += buildRawText(node.children, depth + 1, false);
            }
          } else if (node.isText) {
            // Para text_level direto
            result += `\n\n{{text_level}}\n\n${node.content}\n\n{{-text_level}}\n\n`;
          }
        }
        
        // Agora processamos os nós de text_level como um grupo
        if (textLevelNodes.length > 0) {
          // Tag de abertura do text_level SEMPRE sozinha em sua própria linha
          result += `\n\n{{text_level}}\n\n`;
          
          // Processar cada nó dentro do text_level
          for (const node of textLevelNodes) {
            // Formato sem quebra de linha após {{levelX}} para juntar com o conteúdo
            result += `{{level${node.level}}}${node.content} {{-level${node.level}}}\n\n`;
            
            // Processar filhos se houver
            if (node.children.length > 0) {
              result += buildRawText(node.children, depth + 1, true);
            }
          }
          
          // Tag de fechamento do text_level SEMPRE sozinha em sua própria linha
          result += `{{-text_level}}\n\n`;
        }
      }
      
      return result;
    };

    // Adiciona as notas de rodapé no final
    const buildFootnotes = (): string => {
      let result = "\n\n";

      for (const footnote of documentData.footnotes) {
        // Formato com tag de fechamento no final da mesma linha que o conteúdo
        result += `\n\n{{footnote${footnote.id}}}\n${footnote.content} {{-footnote${footnote.id}}}\n\n`;
      }

      return result;
    };

    const rawText = buildRawText(documentData.nodes) + buildFootnotes();
    return rawText;
  };

  // Função para alternar o modo de comparação
  const toggleComparisonMode = () => {
    // Se estamos saindo do modo de edição, precisamos desativar o modo de comparação
    if (editMode) {
      setEditMode(false);
    }
    
    // Alternar o modo de comparação
    setComparisonMode(!comparisonMode);
  };

  const toggleEditMode = () => {
    if (!editMode) {
      // Entrando no modo de edição
      // Na primeira vez que entramos no modo de edição
      if (!rawContent && originalContent) {
        setRawContent(originalContent);
        setSavedContent(originalContent);
      } else if (!rawContent) {
        const rawText = getDocumentRawText();
        setRawContent(rawText);
        setSavedContent(rawText);
      }
      // Não alteramos o conteúdo atual se já temos um
      // Isso mantém as alterações que o usuário fez
      
      setDocumentSaved(documentSaved);
    } else {
      // Voltando para o modo de visualização
      // Se houver edições, queremos processar o documento com essas edições
      if (hasEdits) {
        try {
          // Tentamos processar o documento com as alterações para garantir
          // que ele estará disponível no modo de visualização
          parseDocument(rawContent);
          // Não salvamos aqui, só verificamos se o parse foi bem-sucedido
        } catch (error) {
          console.error("Erro ao pré-processar documento para visualização:", error);
          // Não exibimos alerta, apenas registramos o erro
        }
      }
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
                onValueChange={(newValue) => {
                  setRawContent(newValue);
                  setHasEdits(true); // Marca que existem edições
                  // Isso fará com que as edições sejam preservadas
                }}
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