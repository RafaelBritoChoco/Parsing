import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfViewerProps {
  pdfUrl: string;
}

export default function PdfViewer({ pdfUrl }: PdfViewerProps) {
  return (
    <div className="flex flex-col w-full h-full">
      {/* Cabeçalho com informações */}
      <div className="bg-gray-50 p-2 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Documento Original</h3>
        <a 
          href={pdfUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
        >
          <ExternalLink className="h-3 w-3" />
          Abrir em nova janela
        </a>
      </div>
      
      {/* Visualizador de PDF incorporado com múltiplos fallbacks */}
      <div className="flex-1 w-full overflow-auto bg-gray-50 relative">
        {/* Primeira tentativa: Usando object tag */}
        <object
          data={pdfUrl}
          type="application/pdf"
          className="w-full h-[600px] border-0"
        >
          {/* Segunda tentativa: Usando embed tag como fallback */}
          <embed 
            src={pdfUrl} 
            type="application/pdf"
            className="w-full h-[600px] border-0" 
          />
          
          {/* Terceira tentativa: Usando iframe como outro fallback */}
          <iframe 
            src={pdfUrl}
            className="w-full h-[600px] border-0"
            title="Documento PDF"
          >
            {/* Mensagem final de fallback se nada funcionar */}
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">
                Não foi possível visualizar o documento diretamente.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Seu navegador pode não suportar a visualização embutida deste tipo de arquivo.
              </p>
              <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Abrir documento em nova janela
              </a>
            </div>
          </iframe>
        </object>
      </div>
    </div>
  );
}