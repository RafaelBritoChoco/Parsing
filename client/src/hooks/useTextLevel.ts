import { useState, useEffect } from 'react';
import { DocumentNode } from '@/lib/types';

/**
 * Hook para identificar nós que devem ter estilo text_level (fundo amarelo)
 * baseado em uma análise do conteúdo original
 */
export function useTextLevel(
  rawContent: string | null = null,
  nodes: DocumentNode[]
): Record<string, boolean> {
  const [textLevelNodes, setTextLevelNodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!rawContent) {
      console.log("useTextLevel: rawContent está vazio ou null");
      return;
    }

    console.log("useTextLevel: processando rawContent de tamanho:", rawContent.length);
    const textLevelMap: Record<string, boolean> = {};
    
    // Encontra todos os trechos entre {{text_level}} e {{-text_level}}
    const textLevelRegex = /{{text_level}}([\s\S]*?){{-text_level}}/g;
    const textLevelMatches: string[] = [];
    
    let match;
    while ((match = textLevelRegex.exec(rawContent)) !== null) {
      if (match[1]) {
        // Pegar o conteúdo exato incluindo espaços e quebras de linha
        textLevelMatches.push(match[1]);
      }
    }
    
    console.log(`useTextLevel: encontrados ${textLevelMatches.length} blocos text_level`);
    // console.log("TextLevel matches:", textLevelMatches);
    
    // Para cada nó, verifica se seu conteúdo está em algum dos trechos de text_level
    const checkNodeInTextLevel = (node: DocumentNode) => {
      // Se o nó já é marcado como isText, já sabemos que está em text_level
      if (node.isText) {
        textLevelMap[node.id] = true;
        return;
      }
      
      // Abordagem mais direta para verificar se o nó está dentro de text_level
      const nodeContent = node.content.trim();
      
      // Primeiro, verificamos se este nó tem uma tag de level diretamente no rawContent
      // que esteja dentro de um bloco text_level
      const levelTagPattern = new RegExp(`{{level${node.level}}}${nodeContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}{{-level${node.level}}}`, 'i');
      
      // Verifica se o conteúdo do nó está nos trechos de text_level
      let isInTextLevel = false;
      
      for (const textLevelContent of textLevelMatches) {
        // Verifica se o conteúdo exato do nó está no trecho de text_level
        if (textLevelContent.includes(nodeContent)) {
          isInTextLevel = true;
          break;
        }
        
        // Ou verifica se uma tag completa com esse conteúdo está no trecho de text_level
        if (levelTagPattern.test(textLevelContent)) {
          isInTextLevel = true;
          break;
        }
      }
      
      // Se já houver text_level marcado para este nó (caso ele seja
      // um nó filho de outro nó em text_level), mantemos o status
      textLevelMap[node.id] = isInTextLevel || (node.id in textLevelMap ? textLevelMap[node.id] : false);
      
      // Verifica também os filhos
      node.children.forEach(checkNodeInTextLevel);
    };
    
    nodes.forEach(checkNodeInTextLevel);
    setTextLevelNodes(textLevelMap);
  }, [rawContent, nodes]);

  return textLevelNodes;
}