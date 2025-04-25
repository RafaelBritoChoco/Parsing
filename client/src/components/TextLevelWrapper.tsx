import React from 'react';

interface TextLevelWrapperProps {
  children: React.ReactNode;
}

/**
 * Um componente que envolve conteúdo dentro de {{text_level}} e aplica o estilo de fundo amarelo
 */
export default function TextLevelWrapper({ children }: TextLevelWrapperProps) {
  return (
    <div className="bg-yellow-200/70 py-1 px-2 rounded-md my-1 overflow-hidden">
      {children}
    </div>
  );
}