import { useState, useCallback } from "react";
import { parseDocument } from "@/lib/documentParser";
import { type ParsedDocument } from "@/lib/types";

export function useDocumentParser() {
  const [document, setDocument] = useState<ParsedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parseFile = useCallback(async (file: File): Promise<void> => {
    if (!file.name.endsWith('.txt')) {
      setError("Please upload a TXT file");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const parsedDocument = parseDocument(content);
      
      if (parsedDocument.nodes.length === 0) {
        throw new Error("No valid document structure found in the file");
      }
      
      setDocument(parsedDocument);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setDocument(null);
    setError(null);
  }, []);

  return {
    document,
    isLoading,
    error,
    parseFile,
    reset
  };
}
