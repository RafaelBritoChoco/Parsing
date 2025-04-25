import React from 'react';

interface TextLevelWrapperProps {
  children: React.ReactNode;
}

/**
 * Um componente que envolve conteúdo dentro de {{text_level}} e aplica o estilo de fundo amarelo
 */
export default function TextLevelWrapper({ children }: TextLevelWrapperProps) {
  return (
    <div className="bg-yellow-50 p-3 rounded-md border-l-4 border-yellow-200 my-2 overflow-hidden">
      {children}
    </div>
  );
}