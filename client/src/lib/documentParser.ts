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
  let normalizedContent = content.replace(/\r\n/g, "\n");
  
  // Extract document title (level0) if present
  const titleMatch = normalizedContent.match(/{{level0}}(.*?){{-level0}}/s);
  const documentTitle = titleMatch && titleMatch[1] ? titleMatch[1].trim() : "Untitled Document";
  
  // Extract all footnotes first
  const footnotes: Footnote[] = [];
  const processedFootnoteIds = new Set<string>();
  
  // Procurar por notas de rodapé no formato {{footnoteN}}N{{-footnoteN}}
  const footnoteFullRegex = /{{footnote(\d+)}}(.*?){{-footnote\1}}/gs;
  let footnoteFullMatch;
  while ((footnoteFullMatch = footnoteFullRegex.exec(normalizedContent)) !== null) {
    if (footnoteFullMatch && footnoteFullMatch[1] && footnoteFullMatch[2]) {
      const footnoteNumber = footnoteFullMatch[1];
      
      // Verificar se já temos esta nota
      if (!processedFootnoteIds.has(footnoteNumber)) {
        processedFootnoteIds.add(footnoteNumber);
        
        const footnoteContent = footnoteFullMatch[2].trim();
        footnotes.push({
          id: footnoteNumber,
          content: footnoteContent
        });
      }
    }
  }
  
  // Para compatibilidade, manter também o formato antigo
  const footnoteRegex = /{{footnote}}(.*?){{-footnote}}/gs;
  let footnoteMatch;
  while ((footnoteMatch = footnoteRegex.exec(normalizedContent)) !== null) {
    if (footnoteMatch && footnoteMatch[1]) {
      const footnoteContent = footnoteMatch[1].trim();
      
      // Try to extract footnote number from content
      const numberMatch = footnoteContent.match(/^(\d+)[\.:\)]\s*(.*)/);
      if (numberMatch && numberMatch[1] && numberMatch[2]) {
        const footnoteId = numberMatch[1];
        
        // Verificar se já temos esta nota
        if (!processedFootnoteIds.has(footnoteId)) {
          processedFootnoteIds.add(footnoteId);
          
          footnotes.push({
            id: footnoteId,
            content: numberMatch[2].trim()
          });
        }
      } else {
        // If no number found, use a placeholder
        const footnoteId = `fn-${footnotes.length + 1}`;
        
        if (!processedFootnoteIds.has(footnoteId)) {
          processedFootnoteIds.add(footnoteId);
          
          footnotes.push({
            id: footnoteId,
            content: footnoteContent
          });
        }
      }
    }
  }
  
  // PRÉ-PROCESSAMENTO: Primeiro, substituir todas as tags de nota de rodapé por marcadores especiais
  // Isso é crítico para evitar duplicações no documento final
  
  // Substituir {{footnotenumberN}}N{{-footnotenumberN}} por marcadores especiais (N) 
  // onde N é o número da nota
  normalizedContent = normalizedContent.replace(
    /{{footnotenumber(\d+)}}(\d+){{-footnotenumber\1}}/g, 
    "FOOTNOTE_MARKER_$1"
  );
  
  // Interface para definir os tipos de tokens
  interface Token {
    level: number;
    content: string;
    isText: boolean;
    start: number;
    end: number;
  }
  
  // Definir os padrões de nível
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
  
  const tokens: Token[] = [];
  
  // Processar tags de nível - esta é a parte principal
  levelTags.forEach(({ regex, level }) => {
    let match;
    while ((match = regex.exec(normalizedContent)) !== null) {
      if (match && match[1]) { 
        // Obter o conteúdo já com marcadores de notas de rodapé
        let content = match[1].trim();
        
        // Tokens são adicionados exatamente como aparecem no documento
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
  
  // Processar níveis aninhados em text_level
  const nestedLevelRegex = /{{text_level}}([\s\S]*?){{-text_level}}/g;
  let nestedLevelMatch: RegExpExecArray | null;
  
  while ((nestedLevelMatch = nestedLevelRegex.exec(normalizedContent)) !== null) {
    if (!nestedLevelMatch || !nestedLevelMatch[1]) continue;
    
    const nestedContent = nestedLevelMatch[1];
    
    // Procurar por tags de nível dentro do text_level
    for (const { regex, level } of levelTags) {
      if (level < 2) continue; // Só interessa level2 e superiores
      
      const levelRegexInner = new RegExp(`{{level${level}}}(.*?){{-level${level}}}`, 'gs');
      let innerMatch: RegExpExecArray | null;
      
      while ((innerMatch = levelRegexInner.exec(nestedContent)) !== null) {
        if (innerMatch && innerMatch[1]) {
          tokens.push({
            level,
            content: innerMatch[1].trim(),
            isText: false,
            start: nestedLevelMatch.index + innerMatch.index,
            end: nestedLevelMatch.index + innerMatch.index + innerMatch[0].length
          });
        }
      }
    }
  }
  
  // Processar text_level como texto
  const textRegex = /{{text_level}}(.*?){{-text_level}}/gs;
  let textMatch: RegExpExecArray | null;
  
  while ((textMatch = textRegex.exec(normalizedContent)) !== null) {
    if (!textMatch || !textMatch[1]) continue;
    
    const textContent = textMatch[1];
    
    // Verificar se este conteúdo já tem tags de nível que foram processadas anteriormente
    let shouldProcessAsText = true;
    for (const { level } of levelTags) {
      if (level < 2) continue;
      
      const levelRegexCheck = new RegExp(`{{level${level}}}.*?{{-level${level}}}`, 'gs');
      if (levelRegexCheck.test(textContent)) {
        shouldProcessAsText = false;
        break;
      }
    }
    
    if (!shouldProcessAsText) continue;
    
    // Todo o conteúdo como um único bloco de texto
    tokens.push({
      level: 9, // Alto nível para texto não estruturado
      content: textContent.trim(),
      isText: true,
      start: textMatch.index,
      end: textMatch.index + textMatch[0].length
    });
  }
  
  // Ordenar tokens por posição
  tokens.sort((a, b) => a.start - b.start);
  
  // Remover duplicatas próximas
  const removeDuplicates = () => {
    const uniqueTokens: Token[] = [];
    const MIN_DISTANCE = 200; // Distância mínima para considerar tokens distintos
    
    // Agrupar por conteúdo e nível
    const tokenGroups: {[key: string]: Token[]} = {};
    
    tokens.forEach(token => {
      const key = `${token.level}:${token.content}`;
      
      if (!tokenGroups[key]) {
        tokenGroups[key] = [];
      }
      
      tokenGroups[key].push(token);
    });
    
    // Para cada grupo, selecionar tokens suficientemente distantes
    for (const key in tokenGroups) {
      const group = tokenGroups[key];
      
      if (group.length === 1) {
        uniqueTokens.push(group[0]);
      } else {
        group.sort((a, b) => a.start - b.start);
        
        let lastAdded = group[0];
        uniqueTokens.push(lastAdded);
        
        for (let i = 1; i < group.length; i++) {
          const current = group[i];
          
          if (current.start - lastAdded.start > MIN_DISTANCE) {
            uniqueTokens.push(current);
            lastAdded = current;
          }
        }
      }
    }
    
    return uniqueTokens.sort((a, b) => a.start - b.start);
  };
  
  const uniqueTokens = removeDuplicates();
  
  // Converter os marcadores de rodapé de volta para o formato que será processado no componente
  const processFootnoteMarkers = (tokens: Token[]): Token[] => {
    return tokens.map(token => {
      // Substituir FOOTNOTE_MARKER_N pelo formato que o componente espera
      const content = token.content.replace(
        /FOOTNOTE_MARKER_(\d+)/g, 
        "(FOOTNOTE_$1_$1)"
      );
      
      return {
        ...token,
        content
      };
    });
  };
  
  const processedTokens = processFootnoteMarkers(uniqueTokens);
  
  // Construir a árvore hierárquica
  const buildTree = (): DocumentNode[] => {
    if (processedTokens.length === 0) return [];
    
    const rootNodes: DocumentNode[] = [];
    let currentLevelNodes: DocumentNode[][] = [[]]; // Array para cada nível
    
    processedTokens.forEach((token, index) => {
      const node: DocumentNode = {
        id: `node-${index}`,
        level: token.level,
        content: token.content,
        isText: token.isText,
        children: []
      };
      
      // Garantir que temos arrays para todos os níveis
      while (currentLevelNodes.length <= token.level) {
        currentLevelNodes.push([]);
      }
      
      // Adicionar nó ao seu nível
      currentLevelNodes[token.level].push(node);
      
      // Nível 0 vai para a raiz
      if (token.level === 0) {
        rootNodes.push(node);
      } else {
        // Encontrar o pai no nível acima
        const parentLevel = token.level - 1;
        
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
          rootNodes.push(node);
        }
      }
    });
    
    return rootNodes;
  };
  
  const nodes = buildTree();
  
  // Se não temos nós mas temos um título, criar um nó raiz
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
