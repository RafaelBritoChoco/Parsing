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
      description: "Ajusta o layout do texto para melhor legibilidade, combinando elementos estruturais.",
      code: "",
      icon: <FileText className="w-5 h-5 text-blue-500" />,
      category: "Formatting"
    },
    {
      id: "level-correction",
      name: "Level Correction",
      description: "Corrige os níveis hierárquicos de tags {{levelX}} para seguir uma estrutura adequada.",
      code: "",
      icon: <Code className="w-5 h-5 text-orange-500" />,
      category: "Structure"
    },
    {
      id: "level-in-one-line",
      name: "Level in One Line",
      description: "Coloca tags de nível e seu conteúdo em uma única linha para melhor consistência.",
      code: "",
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      category: "Formatting"
    },
    {
      id: "fix-footnote-sequence",
      name: "Fix Footnote Sequence",
      description: "Corrige a sequência de notas de rodapé para garantir numeração contínua.",
      code: "",
      icon: <FileText className="w-5 h-5 text-green-500" />,
      category: "Content"
    },
    {
      id: "break-levelx",
      name: "Break LevelX",
      description: "Identifica e quebra tags {{levelX}} que contêm múltiplas linhas.",
      code: "",
      icon: <Code className="w-5 h-5 text-red-500" />,
      category: "Structure"
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

  // Funções de processamento para cada script (implementaremos mais tarde)
  const processTextAligner = (text: string): string => {
    // Implementação real seria baseada no script Text Aligner.py
    return text.replace(/(\{\{level\d+\}\})(\s*\n\s*)([^\n]+)/g, "$1$3")
               .replace(/([^\n]+)(\s*\n\s*)(\{\{-level\d+\}\})/g, "$1$3");
  };

  const processLevelCorrection = (text: string): string => {
    // Implementação real seria baseada no script LVL CORRECTION.py
    return text;
  };

  const processLevelInOneLine = (text: string): string => {
    // Implementação real seria baseada no script LEVEL IN 1 LINE.py
    return text.replace(/(\{\{level\d+\}\})(\s*\n\s*)(?=\S)/g, "$1")
               .replace(/(\S)(\s*\n\s*)(\{\{-level\d+\}\})/g, "$1$3");
  };

  const processFixFootnoteSequence = (text: string): string => {
    // Implementação real seria baseada no script FIX FOOTNOTE SEQUENCE.py
    return text;
  };

  const processBreakLevelx = (text: string): string => {
    // Implementação real seria baseada no script Break-LevelX.py
    return text;
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

  // Voltar para o editor principal
  const goToEditor = () => {
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