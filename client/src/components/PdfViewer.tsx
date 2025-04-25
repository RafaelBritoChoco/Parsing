import React from 'react';
import { FileText } from 'lucide-react';

interface PdfViewerProps {
  pdfUrl: string;
}

export default function PdfViewer({ pdfUrl }: PdfViewerProps) {

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full p-8 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center text-center">
        <FileText className="w-16 h-16 text-purple-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Documento carregado com sucesso</h3>
        <p className="text-gray-500 mb-4">
          O documento foi carregado e está pronto para visualização. 
          Você pode usar o link abaixo para abrir o documento em uma nova janela.
        </p>
        <a 
          href={pdfUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Abrir documento original
        </a>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800 max-w-xl">
        <p>
          <strong>Dica:</strong> Para comparar melhor, posicione o documento original em uma janela 
          separada ao lado desta aplicação. Isso facilitará a verificação detalhada das diferenças.
        </p>
      </div>
    </div>
  );
}