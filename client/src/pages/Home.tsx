import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import DocumentViewer from "@/components/DocumentViewer";
import { type ParsedDocument } from "@/lib/types";

export default function Home() {
  const [parsedDocument, setParsedDocument] = useState<ParsedDocument | null>(null);
  const [originalContent, setOriginalContent] = useState<string>("");
  
  // Função para receber tanto o documento parseado quanto o conteúdo original
  const handleDocumentParsed = (document: ParsedDocument, content: string) => {
    setParsedDocument(document);
    setOriginalContent(content);
  };
  
  const handleReset = () => {
    setParsedDocument(null);
    setOriginalContent("");
  };
  
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-[color:hsl(var(--primary))] text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">Legal Document Viewer</h1>
          <div className="hidden md:block">
            <span className="text-sm">Offline Document Parsing Tool</span>
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
