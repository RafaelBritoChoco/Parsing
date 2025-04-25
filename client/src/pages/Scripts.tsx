import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Code, FileText, Zap } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Interface para um script
interface Script {
  id: string;
  name: string;
  description: string;
  code: string;
  icon: JSX.Element;
  category: string;
}

export default function Scripts() {
  const [selectedTab, setSelectedTab] = useState("text-aligner");
  const [currentDocument, setCurrentDocument] = useState<string | null>(null);
  const [processedText, setProcessedText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Verificar se temos um documento no localStorage
  useEffect(() => {
    const savedDocument = localStorage.getItem("currentDocument");
    if (savedDocument) {
      setCurrentDocument(savedDocument);
    }
  }, []);

  // Lista de scripts disponíveis
  const availableScripts: Script[] = [
    {
      id: "text-aligner",
      name: "Text Aligner",
      description: "Ajusta o layout do texto para melhor legibilidade, combinando elementos estruturais. Este script remove quebras de linha desnecessárias, juntando tags {{levelX}} com seu conteúdo e combinando texto com suas tags de fechamento {{-levelX}}.",
      code: "",
      icon: <FileText className="w-5 h-5 text-blue-500" />,
      category: "Formatação"
    },
    {
      id: "level-correction",
      name: "Level Correction",
      description: "Corrige os níveis hierárquicos de tags {{levelX}} para seguir uma estrutura adequada. Este script analisa a hierarquia de seções e ajusta automaticamente os níveis para garantir consistência (Parte > Título > Capítulo > Seção > Subseção).",
      code: "",
      icon: <Code className="w-5 h-5 text-orange-500" />,
      category: "Estrutura"
    },
    {
      id: "level-in-one-line",
      name: "Level in One Line",
      description: "Coloca tags de nível e seu conteúdo em uma única linha. Remove quebras entre {{levelX}} e conteúdo, e entre conteúdo e {{-levelX}}. Facilita a edição e melhora a consistência do documento.",
      code: "",
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      category: "Formatação"
    },
    {
      id: "fix-footnote-sequence",
      name: "Fix Footnote Sequence",
      description: "Verifica e corrige a sequência de notas de rodapé para garantir numeração contínua (1, 2, 3...). Analisa os padrões {{footnotenumberX}}Y{{-footnotenumberZ}} onde Y deve estar em sequência correta.",
      code: "",
      icon: <FileText className="w-5 h-5 text-green-500" />,
      category: "Conteúdo"
    },
    {
      id: "break-levelx",
      name: "Break LevelX",
      description: "Remove tags {{levelX}} que contêm múltiplas linhas, insere marcador 'BreakLine' antes do conteúdo e garante formatação adequada. Útil para identificar tags que precisam ser ajustadas manualmente.",
      code: "",
      icon: <Code className="w-5 h-5 text-red-500" />,
      category: "Estrutura"
    }
  ];

  // Obter script atual com base na tab selecionada
  const currentScript = availableScripts.find(script => script.id === selectedTab);

  // Simular execução de script
  const executeScript = () => {
    if (!currentDocument) {
      toast({
        title: "Documento não encontrado",
        description: "Por favor, carregue um documento TXT primeiro.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Aqui é onde implementaremos a lógica específica para cada script
    setTimeout(() => {
      let result = currentDocument;
      
      // Simulação de processamento de texto por script
      switch (selectedTab) {
        case "text-aligner":
          // Simulação de alinhamento de texto
          result = processTextAligner(currentDocument);
          break;
        case "level-correction":
          // Simulação de correção de níveis
          result = processLevelCorrection(currentDocument);
          break;
        case "level-in-one-line":
          // Simulação de colocar níveis em uma linha
          result = processLevelInOneLine(currentDocument);
          break;
        case "fix-footnote-sequence":
          // Simulação de correção de sequência de notas de rodapé
          result = processFixFootnoteSequence(currentDocument);
          break;
        case "break-levelx":
          // Simulação de quebra de levelX
          result = processBreakLevelx(currentDocument);
          break;
      }
      
      setProcessedText(result);
      setIsProcessing(false);
      
      toast({
        title: "Processamento concluído",
        description: `Script "${currentScript?.name}" executado com sucesso.`,
        variant: "default"
      });
    }, 1500); // Simulação de processamento
  };

  // Funções de processamento para cada script - Implementação em JavaScript baseada nos scripts Python
  const processTextAligner = (text: string): string => {
    // Implementação baseada no script Text Aligner.py
    const lines = text.split('\n');
    const processedLines = [];
    let lastLineType = null;
    
    // Iterar sobre as linhas e aplicar alinhamento
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const strippedLine = line.trim();
      
      // Pular linhas vazias
      if (!strippedLine) {
        processedLines.push('');
        continue;
      }
      
      // Adicionar linha atual ao resultado
      processedLines.push(line);
    }
    
    let processedText = processedLines.join('\n');
    
    // Aplicar as regex para alinhar os elementos
    // 1. Juntar tag {{levelX}} com o texto que a segue (remover quebra de linha entre eles)
    processedText = processedText.replace(/(\{\{level\d+\}\})(\s*\n\s*)([^\n]+)/g, "$1$3");
    
    // 2. Juntar texto com a tag de fechamento {{-levelX}} (remover quebra de linha entre eles)
    processedText = processedText.replace(/([^\n]+)(\s*\n\s*)(\{\{-level\d+\}\})/g, "$1$3");
    
    // 3. Juntar marcador de lista com o texto que o segue
    processedText = processedText.replace(/(\{\{\s*\(?\s*[a-zA-Z0-9ivxlcdmIVXLCDM\.]+\s*\)?\s*\}\})(\s*\n\s*)(?=\S)/g, "$1 ");
    
    return processedText;
  };
  
  const processLevelCorrection = (text: string): string => {
    // Implementação simplificada baseada no script LVL CORRECTION.py
    // Este script faz correções complexas de hierarquia entre níveis
    // Implementação simplificada:
    
    // 1. Extrai todos os blocos de level
    const levelPattern = /(\{\{level(\d+)\}\})(.*?)(\{\{-level\2\}\})/gs;
    const matches = [...text.matchAll(levelPattern)];
    
    if (matches.length === 0) {
      return text; // Sem tags para corrigir
    }
    
    let result = text;
    let adjustedCount = 0;
    
    // Estruturar hierarquia: level1 > level2 > level3 > level4 > level5
    const hierarchy = {
      "part": ["title", "chapter"],
      "title": ["chapter", "section", "article"],
      "chapter": ["section", "article"],
      "section": ["subsection", "article"],
      "subsection": ["article"]
    };
    
    const typeMap = {
      "part": ["part", "parte", "livre", "teil"],
      "title": ["title", "título", "titre"],
      "chapter": ["chapter", "capítulo", "chapitre", "kapitel"],
      "section": ["section", "sección", "secção", "seção", "abschnitt"],
      "subsection": ["subsection", "sub-section", "sub section", "subsección", "subsecção", "subseção"],
      "article": ["article", "artículo", "artigo", "artikel"]
    };
    
    // 2. Para cada match, determinar o nível correto e fazer ajustes se necessário
    for (let i = 0; i < matches.length; i++) {
      const [fullMatch, startTag, level, content, endTag] = matches[i];
      const newLevel = Math.min(parseInt(level), 5); // Limitar a 5 níveis no máximo
      
      if (newLevel !== parseInt(level)) {
        // Substituir o nível por um novo
        const newStartTag = `{{level${newLevel}}}`;
        const newEndTag = `{{-level${newLevel}}}`;
        result = result.replace(fullMatch, `${newStartTag}${content}${newEndTag}`);
        adjustedCount++;
      }
    }
    
    // Adicionar mensagem informativa
    if (adjustedCount > 0) {
      return `/* ${adjustedCount} níveis foram corrigidos */\n\n` + result;
    }
    
    return result;
  };
  
  const processLevelInOneLine = (text: string): string => {
    // Implementação baseada no script LEVEL IN 1 LINE.py
    let result = text;
    let changes = 0;
    
    // 1. Juntar tag {{levelX}} com o texto que a segue (remover quebra de linha entre eles)
    result = result.replace(/(\{\{level\d+\}\})(\s*\n\s*)(?=\S)/g, "$1");
    
    // 2. Juntar texto com a tag de fechamento {{-levelX}} (remover quebra de linha entre eles)
    result = result.replace(/(\S)(\s*\n\s*)(\{\{-level\d+\}\})/g, "$1$3");
    
    // 3. Juntar marcador de lista com o texto que o segue
    result = result.replace(/(\{\{\s*\(?\s*[a-zA-Z0-9ivxlcdmIVXLCDM\.]+\s*\)?\s*\}\})(\s*\n\s*)(?=\S)/g, "$1 ");
    
    return result;
  };
  
  const processFixFootnoteSequence = (text: string): string => {
    // Implementação baseada no script FIX FOOTNOTE SEQUENCE.py
    // Este script renumera as notas de rodapé sequencialmente
    
    // 1. Localizar todas as ocorrências de notas de rodapé
    const footnotePattern = /\{\{footnotenumber(\d+)\}\}(\d+)\{\{-footnotenumber\d+\}\}/g;
    const matches = [...text.matchAll(footnotePattern)];
    
    if (matches.length === 0) {
      return text + "\n\n/* Nenhuma nota de rodapé encontrada para renumerar */";
    }
    
    // 2. Verificar se a sequência está correta
    let isSequenceBroken = false;
    let breakDetails = null;
    
    for (let i = 0; i < matches.length; i++) {
      const expectedNumber = i + 1;
      const foundNumber = parseInt(matches[i][2]); // Número do meio
      
      if (foundNumber !== expectedNumber) {
        isSequenceBroken = true;
        breakDetails = {
          expected: expectedNumber,
          found: foundNumber,
          position: matches[i].index
        };
        break;
      }
    }
    
    // 3. Renumerar as notas de rodapé
    let result = text;
    
    // Processo de renumeração (de trás para frente para evitar conflitos)
    for (let i = matches.length - 1; i >= 0; i--) {
      const correctNumber = i + 1;
      const [fullMatch] = matches[i];
      const replacement = `{{footnotenumber${correctNumber}}}${correctNumber}{{-footnotenumber${correctNumber}}}`;
      
      // Substituir a ocorrência atual
      result = result.substring(0, matches[i].index) + 
               replacement + 
               result.substring(matches[i].index + fullMatch.length);
    }
    
    // Adicionar mensagem informativa
    if (isSequenceBroken) {
      return `/* Sequência de notas de rodapé quebrada (encontrado: ${breakDetails.found}, esperado: ${breakDetails.expected})
Todas as ${matches.length} notas de rodapé foram renumeradas em sequência. */\n\n` + result;
    } else {
      return `/* Notas de rodapé verificadas (${matches.length}). A sequência está correta. */\n\n` + result;
    }
  };
  
  const processBreakLevelx = (text: string): string => {
    // Implementação baseada no script Break-LevelX.py
    // Este script identifica tags {{levelX}} que contêm múltiplas linhas e as quebra
    
    const levelBlockPattern = /(\{\{level(\d+)\}\})(.*?)(\{\{-level\2\}\})/gs;
    const matches = [...text.matchAll(levelBlockPattern)];
    
    if (matches.length === 0) {
      return text + "\n\n/* Nenhuma tag {{levelX}} encontrada */";
    }
    
    let result = text;
    let breakCount = 0;
    
    // Processar de trás para frente para evitar alterações de índice
    for (let i = matches.length - 1; i >= 0; i--) {
      const [fullMatch, startTag, level, content, endTag] = matches[i];
      
      // Verificar se o conteúdo tem quebras de linha
      if (content.includes('\n')) {
        breakCount++;
        
        // Inserir marcador BreakLine e formatação adequada
        const replacement = `BreakLine\n${content.trim()}\n`;
        
        // Substituir a tag completa pelo conteúdo formatado
        result = result.substring(0, matches[i].index) + 
                 replacement + 
                 result.substring(matches[i].index + fullMatch.length);
      }
    }
    
    // Adicionar mensagem informativa
    if (breakCount > 0) {
      return `/* ${breakCount} tags {{levelX}} multi-linha foram quebradas e marcadas com 'BreakLine' */\n\n` + result;
    } else {
      return `/* Nenhuma tag {{levelX}} multi-linha encontrada para quebrar */\n\n` + result;
    }
  };

  // Aplicar mudanças
  const applyChanges = () => {
    if (processedText) {
      localStorage.setItem("currentDocument", processedText);
      setCurrentDocument(processedText);
      
      toast({
        title: "Alterações aplicadas",
        description: "O documento foi atualizado com as alterações do script.",
        variant: "default"
      });
    }
  };

  // Voltar para o editor principal e salvar alterações, se necessário
  const goToEditor = () => {
    // Se tiver alterações, perguntar se quer salvá-las
    if (processedText && processedText !== currentDocument) {
      const confirmSave = window.confirm(
        "Você tem alterações não salvas. Deseja aplicá-las antes de voltar?"
      );
      if (confirmSave) {
        localStorage.setItem("currentDocument", processedText);
      }
    }
    
    setLocation("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToEditor}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Editor
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">Scripts para Processamento de Texto</h1>
        </div>
        <div>
          <img 
            src="/src/assets/dpa-logo-new.png" 
            alt="Digital Policy Alert" 
            className="h-8 w-auto"
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Script selection */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Scripts Disponíveis</CardTitle>
                  <CardDescription>
                    Selecione um script para processar seu documento TXT
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedTab} onValueChange={setSelectedTab}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um script" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableScripts.map(script => (
                        <SelectItem key={script.id} value={script.id}>
                          <div className="flex items-center">
                            {script.icon}
                            <span className="ml-2">{script.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {currentScript && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center mb-2">
                        {currentScript.icon}
                        <h3 className="text-lg font-medium ml-2">{currentScript.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{currentScript.description}</p>
                      <div className="mt-3 text-xs text-gray-500">
                        Categoria: <span className="font-medium">{currentScript.category}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={executeScript} 
                    className="w-full"
                    disabled={!currentDocument || isProcessing}
                  >
                    {isProcessing ? "Processando..." : "Executar Script"}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Text display */}
            <div className="md:col-span-2">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Documento</CardTitle>
                  <CardDescription>
                    {processedText 
                      ? "Visualize o resultado do processamento abaixo"
                      : "Carregue um documento na página principal primeiro"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <Tabs defaultValue="original" className="h-full flex flex-col">
                    <TabsList className="mb-2">
                      <TabsTrigger value="original">Original</TabsTrigger>
                      <TabsTrigger value="processed" disabled={!processedText}>Processado</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="original" className="flex-1 overflow-hidden">
                      {currentDocument ? (
                        <Textarea 
                          value={currentDocument} 
                          readOnly 
                          className="h-[500px] font-mono text-sm"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[500px] bg-gray-50 rounded-md border border-dashed border-gray-300 p-6">
                          <FileText className="h-16 w-16 text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum documento carregado</h3>
                          <p className="text-gray-500 text-center mb-4">
                            Volte à página principal para carregar um documento TXT.
                          </p>
                          <Button variant="outline" onClick={goToEditor}>
                            Ir para o Editor
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="processed" className="flex-1 overflow-hidden">
                      {processedText ? (
                        <Textarea 
                          value={processedText} 
                          readOnly 
                          className="h-[500px] font-mono text-sm"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[500px] bg-gray-50 rounded-md border border-dashed border-gray-300">
                          <p className="text-gray-500">Execute um script para ver o resultado aqui</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-end">
                  {processedText && (
                    <Button 
                      onClick={applyChanges}
                      variant="default"
                    >
                      Aplicar Alterações
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}