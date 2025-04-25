import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseDocument } from "@/lib/documentParser";
import { type ParsedDocument } from "@/lib/types";

/**
 * Função que adiciona quebras de linha antes de cada {{levelx}} (onde x é qualquer número)
 * Não adiciona quebras antes de {{-levelx}}
 * Garante que {{text_level}} sempre esteja sozinho em sua própria linha
 */
function formatWithLineBreaks(content: string): string {
  let processedContent = content;
  
  // Passo 1: Adicionar quebra de linha antes de qualquer {{level seguido de número
  // Isso resolve tanto os casos no início da linha quanto no meio
  const levelRegex = /(^|[^\n])({{level\d+}})/g;
  processedContent = processedContent.replace(levelRegex, "$1\n$2");
  
  // Passo 2: Adicionar quebra de linha antes de qualquer {{text_level}}
  const textLevelOpenRegex = /(^|[^\n])({{text_level}})/g;
  processedContent = processedContent.replace(textLevelOpenRegex, "$1\n$2\n");
  
  // Passo 3: Adicionar quebra de linha antes de qualquer {{-text_level}}
  const textLevelCloseRegex = /(^|[^\n])({{-text_level}})/g;
  processedContent = processedContent.replace(textLevelCloseRegex, "$1\n$2");
  
  // Passo 4: Verificar caso especial onde {{text_level}} possa estar junto com outros conteúdos
  // Garantir que {{text_level}} esteja sozinho na linha
  const isolateTextLevelRegex = /(.+)({{text_level}})/g;
  processedContent = processedContent.replace(isolateTextLevelRegex, "$1\n$2");
  
  const isolateTextLevelCloseRegex = /({{-text_level}})(.+)/g;
  processedContent = processedContent.replace(isolateTextLevelCloseRegex, "$1\n$2");
  
  // Passo 5: Remover linhas em branco duplicadas
  processedContent = processedContent.replace(/\n\s*\n\s*\n/g, "\n\n");
  
  return processedContent;
}

interface FileUploadProps {
  onDocumentParsed: (document: ParsedDocument, originalContent: string) => void;
}

export default function FileUpload({ onDocumentParsed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.txt')) {
      toast({
        title: "Invalid file format",
        description: "Please upload a TXT file",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let content = await file.text();
      
      // Preprocessamento para adicionar quebras de linha antes de cada {{levelx}}
      content = formatWithLineBreaks(content);
      
      const parsedDoc = parseDocument(content);
      
      if (parsedDoc.nodes.length === 0) {
        throw new Error("No valid document structure found in the file");
      }
      
      // Passamos tanto o documento parseado quanto o conteúdo formatado
      onDocumentParsed(parsedDoc, content);
    } catch (error) {
      toast({
        title: "Error parsing document",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <Card className="w-full max-w-md mx-auto shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-6">
            <div className="text-center h-10 mb-2 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-xl">Digital Policy Alert</div>
            <h2 className="text-2xl font-semibold text-center text-[color:hsl(var(--primary))]">
              Parsing Check
            </h2>
            <p className="text-sm text-center mt-1 text-gray-600">
              Developed by: André Puntel, Artur Dias and Rafael Brito
            </p>
          </div>
          
          <div 
            className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 shadow-sm ${
              isDragging 
                ? 'bg-blue-50 border-blue-300 shadow-md scale-[1.02]' 
                : 'border-[color:hsl(var(--muted))] hover:bg-gray-50 hover:border-gray-300 hover:shadow-md hover:scale-[1.01]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-500"></div>
                <p className="mt-3 text-sm font-medium text-gray-700">Parsing document...</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-2">
                  <Upload className="h-8 w-8 text-blue-500" />
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700">Drag and drop your TXT file here</p>
                <p className="text-xs mt-1 text-gray-500">or</p>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="mt-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium px-4 py-2 rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Browse files
                </Button>
                <input 
                  id="file-upload" 
                  type="file" 
                  accept=".txt" 
                  className="sr-only" 
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
                />
              </>
            )}
          </div>
          
          <div className="text-sm mt-8 bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="font-medium text-gray-700 mb-3">Steps:</p>
            <ol className="space-y-3">
              <li className="flex items-start">
                <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">1</div>
                <div>
                  <span className="font-medium text-gray-700">Upload your parsed TXT</span>
                  <p className="text-xs text-gray-500 mt-1">Drag and drop or use the Browse files button</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">2</div>
                <div>
                  <span className="font-medium text-gray-700">Check for mistakes and errors</span>
                  <p className="text-xs text-gray-500 mt-1">Review the document structure and content</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">3</div>
                <div>
                  <span className="font-medium text-gray-700">Correct at Edit Mode</span>
                  <p className="text-xs text-gray-500 mt-1">Edit, save and download your corrected file</p>
                </div>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
