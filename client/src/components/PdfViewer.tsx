import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfViewerProps {
  pdfUrl: string;
}

export default function PdfViewer({ pdfUrl }: PdfViewerProps) {
  // Sempre tentamos visualizar como PDF, mesmo que não seja detectado como um
  // Isso melhora a compatibilidade em casos onde o MIME type não é detectado corretamente

  return (
    <div className="flex flex-col w-full h-full">
      {/* Cabeçalho com informações */}
      <div className="bg-gray-50 p-2 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">Documento Original</h3>
      </div>
      
      {/* Visualizador de PDF incorporado */}
      <div className="flex-1 w-full h-full overflow-auto bg-gray-50 relative">
        <iframe 
          src={`${pdfUrl}#toolbar=0&navpanes=0`}
          className="w-full h-full border-0 min-h-[500px]"
          title="Documento Original"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}