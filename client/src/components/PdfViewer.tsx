import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

// Configurar worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  pdfUrl: string;
}

export default function PdfViewer({ pdfUrl }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      if (numPages !== null) {
        return Math.min(Math.max(1, newPageNumber), numPages);
      }
      return prevPageNumber;
    });
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale(prevScale => Math.min(prevScale + 0.1, 2.0));
  }

  function zoomOut() {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  }

  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-50 p-4 mb-4 rounded-lg border border-gray-200 w-full overflow-auto">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          }
          error={
            <div className="text-center py-10">
              <p className="text-red-500 font-medium">Erro ao carregar o documento</p>
              <p className="text-sm text-gray-500 mt-2">
                Verifique se o formato do arquivo é suportado ou tente novamente.
              </p>
            </div>
          }
          className="pdf-document"
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="pdf-page"
          />
        </Document>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            className="rounded-r-none border-r-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="px-3 py-1 border border-gray-200 bg-white text-sm">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            className="rounded-l-none border-l-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className="rounded-r-none border-r-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 py-1 border border-gray-200 bg-white text-sm">
            {pageNumber} / {numPages || '--'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={numPages !== null && pageNumber >= numPages}
            className="rounded-l-none border-l-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}