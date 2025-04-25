import React from 'react';

interface TextLevelWrapperProps {
  children: React.ReactNode;
}

/**
 * Um componente que envolve conteúdo dentro de {{text_level}} e aplica o estilo de fundo amarelo
 */
export default function TextLevelWrapper({ children }: TextLevelWrapperProps) {
  // Aplicamos o estilo diretamente no componente para garantir a aplicação
  return (
    <div className="py-3 px-4 rounded-md my-3 overflow-hidden text-level-wrapper relative"
      style={{
        backgroundColor: '#FFEB98',
        border: '2px solid #FFD700',
        boxShadow: '0 4px 8px rgba(255, 215, 0, 0.3)'
      }}
    >
      {/* Barra de destaque à esquerda */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-yellow-500 rounded-l"></div>
      
      {/* Badge para indicar que é um text_level */}
      <div className="absolute right-0 top-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded-bl font-bold">
        TEXT
      </div>
      
      <div className="pl-4 pt-4 relative">
        {children}
      </div>
    </div>
  );
}