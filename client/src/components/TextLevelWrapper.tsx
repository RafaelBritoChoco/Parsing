import React from 'react';

interface TextLevelWrapperProps {
  children: React.ReactNode;
}

/**
 * Um componente que envolve conteúdo dentro de {{text_level}} e aplica o estilo de fundo amarelo
 */
export default function TextLevelWrapper({ children }: TextLevelWrapperProps) {
  return (
    <div className="py-2 px-3 rounded-md my-2 overflow-hidden text-level-wrapper" style={{
      backgroundColor: '#FFEB98',
      border: '1px solid #FFD700',
      boxShadow: '0 2px 4px rgba(255, 215, 0, 0.2)'
    }}>
      {/* Adicionamos uma barra lateral para indicar visualmente que este é um bloco de text_level */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded"></div>
        <div className="pl-3">
          {children}
        </div>
      </div>
    </div>
  );
}