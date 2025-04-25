import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfViewerProps {
  pdfUrl: string;
}

export default function PdfViewer({ pdfUrl }: PdfViewerProps) {
  // Verificando se é um PDF com base na extensão ou tipo MIME
  const isPdf = pdfUrl.toLowerCase().endsWith('.pdf') || 
                pdfUrl.toLowerCase().includes('application/pdf');

  return (
    <div className="flex flex-col w-full h-full">
      {/* Cabeçalho com informações */}
      <div className="bg-gray-50 p-2 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">Documento Original</h3>
      </div>
      
      {/* Visualizador de PDF incorporado */}
      <div className="flex-1 w-full h-full overflow-auto bg-gray-50 relative">
        {isPdf ? (
          <iframe 
            src={`${pdfUrl}#toolbar=0&navpanes=0`}
            className="w-full h-full border-0 min-h-[500px]"
            title="Documento PDF"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <p className="text-gray-500 mb-4">
              Este documento não é um PDF e não pode ser visualizado diretamente no navegador.
            </p>
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Abrir em nova janela
            </a>
          </div>
        )}
      </div>
    </div>
  );
}