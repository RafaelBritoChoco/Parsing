import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Eye, Info } from 'lucide-react';

interface PdfComparisonProps {
  onPdfLoad: (pdfUrl: string) => void;
}

export default function PdfComparison({ onPdfLoad }: PdfComparisonProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Verifica se é um PDF ou outro tipo de arquivo de documento
      if (file.type === 'application/pdf' || 
          file.type === 'application/msword' || 
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type === 'text/plain') {
        
        setSelectedFile(file);
        
        // Cria uma URL para o arquivo
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        onPdfLoad(objectUrl);
        
      } else {
        alert('Por favor, selecione um arquivo PDF, DOC, DOCX ou TXT');
        e.target.value = '';
      }
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
      />
      
      {!selectedFile ? (
        <>
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Carregar documento original</h3>
            <p className="text-sm text-gray-500 text-center mt-2 mb-4">
              Arraste ou selecione um arquivo PDF, DOC, DOCX ou TXT para comparar com o documento processado
            </p>
          </div>
          
          <Button
            onClick={handleBrowseClick}
            className="gap-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white"
          >
            <Upload className="h-4 w-4" />
            Selecionar arquivo
          </Button>
        </>
      ) : (
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mr-3">
                <Eye className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800">{selectedFile.name}</h4>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <Button
              onClick={handleBrowseClick}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Trocar
            </Button>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Agora você pode comparar seu documento original com a versão processada. 
              Use a rolagem sincronizada para navegar por ambos os documentos simultaneamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}