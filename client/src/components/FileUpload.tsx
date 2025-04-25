import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseDocument } from "@/lib/documentParser";
import { type ParsedDocument } from "@/lib/types";

interface FileUploadProps {
  onDocumentParsed: (document: ParsedDocument) => void;
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
      const content = await file.text();
      const parsedDoc = parseDocument(content);
      
      if (parsedDoc.nodes.length === 0) {
        throw new Error("No valid document structure found in the file");
      }
      
      onDocumentParsed(parsedDoc);
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
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-6">
            <div className="text-center h-10 mb-2 font-bold text-primary text-lg">Digital Policy Alert</div>
            <h2 className="text-2xl font-semibold text-center text-[color:hsl(var(--primary))]">
              Parsing Check
            </h2>
            <p className="text-sm text-center mt-1 text-gray-600">
              Developed by: André Puntel, Artur Dias and Rafael Brito
            </p>
          </div>
          
          <div 
            className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging ? 'bg-[color:hsl(var(--secondary))] border-[color:hsl(var(--primary))]' : 'border-[color:hsl(var(--muted))] hover:bg-[color:hsl(var(--secondary))]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:hsl(var(--primary))]"></div>
                <p className="mt-2 text-sm">Parsing document...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-[color:hsl(var(--primary))]" />
                <p className="mt-2 text-sm">Drag and drop your TXT file here</p>
                <p className="text-xs mt-1">or</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="mt-2"
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
          
          <div className="text-sm mt-4">
            <p className="font-medium">Steps:</p>
            <ol className="list-decimal list-inside mt-1 space-y-2">
              <li>
                <span className="font-medium">Upload your parsed TXT</span>
              </li>
              <li>
                <span className="font-medium">Check for mistakes and errors</span>
              </li>
              <li>
                <span className="font-medium">Correct at Edit Mode, save and Download your file corrected</span>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
