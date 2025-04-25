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
  const footnoteRegex = /{{footnote}}(.*?){{-footnote}}/gs;
  const footnoteNumberRegex = /{{footnotenumber}}(.*?){{-footnotenumber}}/g;
  
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
        tokens.push({
          level,
          content: match[1].trim(),
          isText: false,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }
  });
  
  // Process text level tags
  const textRegex = /{{text_level}}(.*?){{-text_level}}/gs;
  let textMatch: RegExpExecArray | null;
  while ((textMatch = textRegex.exec(normalizedContent)) !== null) {
    if (!textMatch || !textMatch[1]) continue;
    
    // Further process the text to identify and categorize by level
    const textContent = textMatch[1];
    const lines = textContent.split("\n");
    
    // Process each line in the text section
    let currentTextLevel = -1;
    let currentTextContent = "";
    
    lines.forEach((line, index) => {
      if (line === undefined) return;
      
      // Check if line contains a level tag
      let lineLevel = -1;
      let lineContent = line;
      
      for (const { regex, level } of levelTags) {
        const levelMatch = line.match(regex);
        if (levelMatch && levelMatch[1]) {
          lineLevel = level;
          lineContent = levelMatch[1].trim();
          break;
        }
      }
      
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
    
    // If no structured content was found, add the whole text as one block
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
  
  // Build the hierarchical tree
  const buildTree = (): DocumentNode[] => {
    if (tokens.length === 0) return [];
    
    // Create root nodes (level 0) or use a placeholder
    const rootNodes: DocumentNode[] = [];
    let currentLevelNodes: DocumentNode[][] = [[]]; // Array of node lists for each level
    
    tokens.forEach((token, index) => {
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
