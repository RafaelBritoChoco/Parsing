import { ParsedDocument, DocumentNode, Footnote } from "./types";

/**
 * Parse a document with custom tags into a structured format
 */
export function parseDocument(content: string): ParsedDocument {
  // Check if content is empty or undefined
  if (!content) {
    return {
      title: "Untitled Document",
      nodes: [],
      footnotes: []
    };
  }

  // Normalize line endings
  const normalizedContent = content.replace(/\r\n/g, "\n");
  
  // Extract document title (level0) if present
  const titleMatch = normalizedContent.match(/{{level0}}(.*?){{-level0}}/s);
  const documentTitle = titleMatch && titleMatch[1] ? titleMatch[1].trim() : "Untitled Document";
  
  // Extract all footnotes
  const footnotes: Footnote[] = [];
  
  // Procurar por notas de rodapé no formato {{footnoteN}}N{{-footnoteN}}
  const footnoteFullRegex = /{{footnote(\d+)}}(.*?){{-footnote\1}}/gs;
  let footnoteFullMatch;
  while ((footnoteFullMatch = footnoteFullRegex.exec(normalizedContent)) !== null) {
    if (footnoteFullMatch && footnoteFullMatch[1] && footnoteFullMatch[2]) {
      const footnoteNumber = footnoteFullMatch[1];
      const footnoteContent = footnoteFullMatch[2].trim();
      
      footnotes.push({
        id: footnoteNumber,
        content: footnoteContent
      });
    }
  }
  
  // Procurar por referências de notas de rodapé no formato {{footnotenumberN}}N{{-footnotenumberN}}
  const footnoteNumberRegex = /{{footnotenumber(\d+)}}(\d+){{-footnotenumber\1}}/g;
  
  // Para compatibilidade, manter também o formato antigo
  const footnoteRegex = /{{footnote}}(.*?){{-footnote}}/gs;
  let footnoteMatch;
  while ((footnoteMatch = footnoteRegex.exec(normalizedContent)) !== null) {
    if (footnoteMatch && footnoteMatch[1]) {
      const footnoteContent = footnoteMatch[1].trim();
      
      // Try to extract footnote number from content
      const numberMatch = footnoteContent.match(/^(\d+)[\.:\)]\s*(.*)/);
      if (numberMatch && numberMatch[1] && numberMatch[2]) {
        footnotes.push({
          id: numberMatch[1],
          content: numberMatch[2].trim()
        });
      } else {
        // If no number found, use a placeholder
        footnotes.push({
          id: `fn-${footnotes.length + 1}`,
          content: footnoteContent
        });
      }
    }
  }
  
  // Processar as notas de rodapé dentro do conteúdo de nível
  const processFootnoteRef = (content: string): string => {
    // Processar notas de rodapé no formato {{footnotenumberN}}N{{-footnotenumberN}}
    const footnoteRegex = /{{footnotenumber(\d+)}}(\d+){{-footnotenumber\1}}/g;
    return content.replace(footnoteRegex, (_, id, number) => {
      return `(${number})`;
    });
  };

  // Process all level tags
  const levelTags: {
    regex: RegExp;
    level: number;
  }[] = [
    { regex: /{{level0}}(.*?){{-level0}}/gs, level: 0 },
    { regex: /{{level1}}(.*?){{-level1}}/gs, level: 1 },
    { regex: /{{level2}}(.*?){{-level2}}/gs, level: 2 },
    { regex: /{{level3}}(.*?){{-level3}}/gs, level: 3 },
    { regex: /{{level4}}(.*?){{-level4}}/gs, level: 4 },
    { regex: /{{level5}}(.*?){{-level5}}/gs, level: 5 },
    { regex: /{{level6}}(.*?){{-level6}}/gs, level: 6 },
    { regex: /{{level7}}(.*?){{-level7}}/gs, level: 7 },
    { regex: /{{level8}}(.*?){{-level8}}/gs, level: 8 },
    { regex: /{{level9}}(.*?){{-level9}}/gs, level: 9 },
  ];
  
  // Track positions of all tokens for hierarchical construction
  interface Token {
    level: number;
    content: string;
    isText: boolean;
    start: number;
    end: number;
  }
  
  const tokens: Token[] = [];
  
  // Process level tags
  levelTags.forEach(({ regex, level }) => {
    let match;
    while ((match = regex.exec(normalizedContent)) !== null) {
      if (match && match[1]) { 
        // Aplicar processamento de footnotes no conteúdo
        let content = match[1].trim();
        
        // Processar notas de rodapé no formato {{footnotenumberN}}N{{-footnotenumberN}}
        const footnoteRegex = /{{footnotenumber(\d+)}}(\d+){{-footnotenumber\1}}/g;
        if (footnoteRegex.test(content)) {
          content = content.replace(footnoteRegex, (_, id, number) => {
            return `FOOTNOTE_REF_${id}_${number}`;
          });
        }
        
        tokens.push({
          level,
          content: content,
          isText: false,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }
  });
  
  // Pré-processamento: procura tags de nível dentro de text_level
  // Isso é necessário porque no seu formato, os níveis 2, 3, 4, etc. estão dentro de text_level
  const nestedLevelRegex = /{{text_level}}([\s\S]*?){{-text_level}}/g;
  let nestedLevelMatch: RegExpExecArray | null;
  
  while ((nestedLevelMatch = nestedLevelRegex.exec(normalizedContent)) !== null) {
    if (!nestedLevelMatch || !nestedLevelMatch[1]) continue;
    
    const nestedContent = nestedLevelMatch[1];
    
    // Procura por tags de nível dentro do conteúdo text_level
    for (const { regex, level } of levelTags) {
      if (level < 2) continue; // Agora processa level2 (preâmbulo) e superiores
      
      const levelRegexInner = new RegExp(`{{level${level}}}(.*?){{-level${level}}}`, 'gs');
      let innerMatch: RegExpExecArray | null;
      
      while ((innerMatch = levelRegexInner.exec(nestedContent)) !== null) {
        if (innerMatch && innerMatch[1]) {
          // Adiciona o nó diretamente aos tokens
          tokens.push({
            level,
            content: innerMatch[1].trim(),
            isText: false, // Isso é importante - marcamos como não sendo texto
            start: nestedLevelMatch.index + innerMatch.index,
            end: nestedLevelMatch.index + innerMatch.index + innerMatch[0].length
          });
        }
      }
    }
  }
  
  // Processa text_level tags como texto comum
  const textRegex = /{{text_level}}(.*?){{-text_level}}/gs;
  let textMatch: RegExpExecArray | null;
  while ((textMatch = textRegex.exec(normalizedContent)) !== null) {
    if (!textMatch || !textMatch[1]) continue;
    
    // Further process the text to identify and categorize by level
    const textContent = textMatch[1];
    
    // Precisamos ignorar os trechos com tags de nível que já processamos
    let shouldProcessAsText = true;
    for (const { level } of levelTags) {
      if (level < 2) continue; // Agora verificamos a partir do level2 (preâmbulo)
      
      const levelRegexCheck = new RegExp(`{{level${level}}}.*?{{-level${level}}}`, 'gs');
      if (levelRegexCheck.test(textContent)) {
        shouldProcessAsText = false;
        break;
      }
    }
    
    if (!shouldProcessAsText) continue;
    
    // Se chegamos aqui, é realmente conteúdo de texto sem tags de nível
    const lines = textContent.split("\n");
    
    // Process each line in the text section
    let currentTextLevel = -1;
    let currentTextContent = "";
    
    lines.forEach((line, index) => {
      if (line === undefined) return;
      
      // Check if line contains a level tag - isso é para compatibilidade
      let lineLevel = -1;
      let lineContent = line;
      
      if (lineLevel >= 0) {
        // If we have accumulated text from previous lines, add it
        if (currentTextContent && currentTextContent.trim()) {
          tokens.push({
            level: currentTextLevel >= 0 ? currentTextLevel : 9, // Default to high level
            content: currentTextContent.trim(),
            isText: true,
            start: textMatch.index,
            end: textMatch.index
          });
          currentTextContent = "";
        }
        
        // Update current level and start accumulating text
        currentTextLevel = lineLevel;
        currentTextContent = lineContent;
      } else if (line.trim()) {
        // Continue accumulating text
        currentTextContent += (currentTextContent ? "\n" : "") + line;
      } else if (currentTextContent && currentTextContent.trim()) {
        // Empty line and we have content, add a paragraph break
        currentTextContent += "\n\n";
      }
      
      // If this is the last line and we have content, add it
      if (index === lines.length - 1 && currentTextContent && currentTextContent.trim()) {
        tokens.push({
          level: currentTextLevel >= 0 ? currentTextLevel : 9, // Default to high level
          content: currentTextContent.trim(),
          isText: true,
          start: textMatch.index,
          end: textMatch.index
        });
      }
    });
    
    // If no tokens were added for this text section, add the whole text as one block
    if (tokens.length === 0 || tokens.every(t => !t.isText)) {
      tokens.push({
        level: 9, // High level for unstructured text
        content: textContent.trim(),
        isText: true,
        start: textMatch.index,
        end: textMatch.index
      });
    }
  }
  
  // Sort tokens by their position in the document
  tokens.sort((a, b) => a.start - b.start);
  
  // Remover duplicatas antes de construir a árvore
  const removeDuplicates = () => {
    // Primeiro ordenamos os tokens por posição
    tokens.sort((a, b) => a.start - b.start);
    
    // Em seguida, remover entradas duplicadas (mesmo conteúdo e nível)
    const uniqueTokens: Token[] = [];
    const contentMap = new Map<string, boolean>();
    
    // Esta estrutura armazena a distância mínima para considerar dois tokens com o mesmo conteúdo
    // como sendo efetivamente distintos em vez de duplicatas
    const MIN_DISTANCE = 200; // Se dois tokens iguais estiverem a menos de 200 caracteres um do outro, consideramos duplicata
    
    // Primeiro passo: agrupar tokens por conteúdo e nível
    const tokenGroups: {[key: string]: Token[]} = {};
    
    tokens.forEach(token => {
      // Cria uma chave única baseada no nível e conteúdo
      const key = `${token.level}:${token.content}`;
      
      if (!tokenGroups[key]) {
        tokenGroups[key] = [];
      }
      
      tokenGroups[key].push(token);
    });
    
    // Segundo passo: para cada grupo, selecionar apenas tokens que estão suficientemente distantes
    for (const key in tokenGroups) {
      const group = tokenGroups[key];
      
      if (group.length === 1) {
        // Se só há um token no grupo, não há duplicata
        uniqueTokens.push(group[0]);
      } else {
        // Ordena por posição
        group.sort((a, b) => a.start - b.start);
        
        // Adiciona o primeiro token
        let lastAdded = group[0];
        uniqueTokens.push(lastAdded);
        
        // Para os demais, verificar a distância
        for (let i = 1; i < group.length; i++) {
          const current = group[i];
          
          // Se estiver longe o suficiente do último adicionado, não é duplicata
          if (current.start - lastAdded.start > MIN_DISTANCE) {
            uniqueTokens.push(current);
            lastAdded = current;
          }
        }
      }
    }
    
    // Reclassificar por posição para manter a ordem original
    uniqueTokens.sort((a, b) => a.start - b.start);
    
    return uniqueTokens;
  };
  
  // Ordenar tokens e remover duplicatas
  const uniqueTokens = removeDuplicates();

  // Build the hierarchical tree
  const buildTree = (): DocumentNode[] => {
    if (uniqueTokens.length === 0) return [];
    
    // Create root nodes (level 0) or use a placeholder
    const rootNodes: DocumentNode[] = [];
    let currentLevelNodes: DocumentNode[][] = [[]]; // Array of node lists for each level
    
    uniqueTokens.forEach((token, index) => {
      const node: DocumentNode = {
        id: `node-${index}`,
        level: token.level,
        content: token.content,
        isText: token.isText,
        children: []
      };
      
      // Ensure we have arrays for all levels up to current
      while (currentLevelNodes.length <= token.level) {
        currentLevelNodes.push([]);
      }
      
      // Add node to its level array
      currentLevelNodes[token.level].push(node);
      
      // If this is a level 0 node, add to root
      if (token.level === 0) {
        rootNodes.push(node);
      } else {
        // Find parent node - the last node at the level above
        const parentLevel = token.level - 1;
        
        // Find the most recent parent at the level above
        let parent: DocumentNode | undefined;
        for (let i = parentLevel; i >= 0; i--) {
          if (currentLevelNodes[i].length > 0) {
            parent = currentLevelNodes[i][currentLevelNodes[i].length - 1];
            break;
          }
        }
        
        if (parent) {
          parent.children.push(node);
        } else {
          // If no parent found, add to root (shouldn't happen in well-formed docs)
          rootNodes.push(node);
        }
      }
    });
    
    return rootNodes;
  };
  
  const nodes = buildTree();
  
  // If no nodes were created but we have a title, create a root node
  if (nodes.length === 0 && documentTitle !== "Untitled Document") {
    nodes.push({
      id: "node-root",
      level: 0,
      content: documentTitle,
      isText: false,
      children: []
    });
  }

  return {
    title: documentTitle,
    nodes,
    footnotes
  };
}
