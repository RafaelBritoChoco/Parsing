import React from 'react';

interface TextLevelWrapperProps {
  children: React.ReactNode;
}

/**
 * Um componente que envolve conteúdo dentro de {{text_level}} e aplica o estilo de fundo amarelo
 */
export default function TextLevelWrapper({ children }: TextLevelWrapperProps) {
  return (
    <div className="py-2 px-3 rounded-md my-1 overflow-hidden" style={{backgroundColor: '#FFEB98'}}>
      {children}
    </div>
  );
}