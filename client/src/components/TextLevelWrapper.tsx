import React from 'react';

interface TextLevelWrapperProps {
  children: React.ReactNode;
}

/**
 * Um componente que envolve conteúdo dentro de {{text_level}} e aplica o estilo de fundo amarelo
 */
export default function TextLevelWrapper({ children }: TextLevelWrapperProps) {
  return (
    <div className="py-2 px-3 rounded-md my-1 overflow-hidden" style={{
      backgroundColor: '#FFEB98',
      border: '1px solid #FFD700',
      boxShadow: '0 1px 2px rgba(255, 215, 0, 0.1)'
    }}>
      {children}
    </div>
  );
}