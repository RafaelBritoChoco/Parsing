import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import FileUpload from "@/components/FileUpload";
import DocumentViewer from "@/components/DocumentViewer";
import { type ParsedDocument } from "@/lib/types";
import companyLogo from "../assets/logo.png";
import { Button } from "@/components/ui/button";
import { Code } from "lucide-react";

export default function Home() {
  const [parsedDocument, setParsedDocument] = useState<ParsedDocument | null>(null);
  const [originalContent, setOriginalContent] = useState<string>("");
  const [_, setLocation] = useLocation();
  
  // Função para receber tanto o documento parseado quanto o conteúdo original
  const handleDocumentParsed = (document: ParsedDocument, content: string) => {
    setParsedDocument(document);
    setOriginalContent(content);
    
    // Salva o conteúdo no localStorage para uso na página de scripts
    localStorage.setItem("currentDocument", content);
  };
  
  const handleReset = () => {
    setParsedDocument(null);
    setOriginalContent("");
    localStorage.removeItem("currentDocument");
  };
  
  const goToScripts = () => {
    setLocation("/scripts");
  };
  
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-[color:hsl(var(--primary))] text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src={companyLogo}
              alt="Company Logo" 
              className="h-8 w-auto"
            />
            <h1 className="text-xl font-semibold">DPA Parsing Checker</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <span className="text-sm">Tool for checking your parsing before uploading to Clairk</span>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={goToScripts}
              className="flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              <span>Scripts</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!parsedDocument ? (
          <FileUpload onDocumentParsed={handleDocumentParsed} />
        ) : (
          <DocumentViewer 
            document={parsedDocument} 
            originalContent={originalContent} 
            onReset={handleReset} 
          />
        )}
      </div>
    </div>
  );
}
