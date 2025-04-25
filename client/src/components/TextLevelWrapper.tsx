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
        backgroundColor: '#FFF8E0', // Amarelo mais claro e suave
        border: '1px solid #FFE082', // Borda mais sutil
        boxShadow: '0 2px 4px rgba(255, 215, 0, 0.15)' // Sombra mais suave
      }}
    >
      {/* Barra de destaque à esquerda */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-l"></div>
      
      {/* Badge para indicar que é um text_level */}
      <div className="absolute right-0 top-0 bg-yellow-400 text-white text-xs px-2 py-1 rounded-bl font-bold">
        TEXT
      </div>
      
      <div className="pl-4 pt-4 relative">
        {children}
      </div>
    </div>
  );
}