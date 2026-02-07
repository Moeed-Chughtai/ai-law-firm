/**
 * Advanced chunking strategies for legal documents
 */

export interface ChunkMetadata {
  section?: string;
  clause?: string;
  docType?: string;
  page?: number;
  heading?: string;
  [key: string]: any;
}

export interface DocumentChunk {
  content: string;
  metadata: ChunkMetadata;
  chunkIndex: number;
}

/**
 * Hierarchical chunking: Section-level + clause-level
 * This allows retrieval at different granularities
 */
export function chunkLegalDocument(
  content: string,
  metadata: ChunkMetadata = {}
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  // Strategy 1: Split by major sections (## headings)
  const sectionRegex = /^##\s+(.+)$/gm;
  const sections: Array<{ title: string; start: number; end: number }> = [];
  let match;

  while ((match = sectionRegex.exec(content)) !== null) {
    const start = match.index;
    const title = match[1].trim();
    sections.push({ title, start, end: content.length });
  }

  // Update end positions
  for (let i = 0; i < sections.length - 1; i++) {
    sections[i].end = sections[i + 1].start;
  }

  // Create section-level chunks
  sections.forEach((section, idx) => {
    const sectionContent = content
      .substring(section.start, section.end)
      .trim();
    
    if (sectionContent.length > 100) {
      chunks.push({
        content: sectionContent,
        metadata: {
          ...metadata,
          section: section.title,
          heading: section.title,
          chunkType: 'section',
        },
        chunkIndex: idx,
      });
    }
  });

  // Strategy 2: Split by clauses within sections (numbered lists, bullet points)
  const clauseRegex = /(?:^|\n)(?:\d+\.|\-|\*)\s+(.+?)(?=\n(?:##|\d+\.|\-|\*)|$)/gs;
  let clauseIndex = chunks.length;

  while ((match = clauseRegex.exec(content)) !== null) {
    const clauseText = match[1].trim();
    if (clauseText.length > 50 && clauseText.length < 2000) {
      // Find which section this clause belongs to
      const section = sections.find(
        (s) => match.index! >= s.start && match.index! < s.end
      );

      chunks.push({
        content: clauseText,
        metadata: {
          ...metadata,
          section: section?.title,
          clause: clauseText.substring(0, 50),
          chunkType: 'clause',
        },
        chunkIndex: clauseIndex++,
      });
    }
  }

  // Strategy 3: If no structure found, use semantic chunking (by sentence count)
  if (chunks.length === 0) {
    const sentences = content.split(/[.!?]+\s+/);
    const sentencesPerChunk = 5;
    
    for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
      const chunkContent = sentences
        .slice(i, i + sentencesPerChunk)
        .join('. ')
        .trim();
      
      if (chunkContent.length > 100) {
        chunks.push({
          content: chunkContent,
          metadata: {
            ...metadata,
            chunkType: 'semantic',
          },
          chunkIndex: Math.floor(i / sentencesPerChunk),
        });
      }
    }
  }

  return chunks;
}

/**
 * Smart chunking with overlap for better context preservation
 */
export function chunkWithOverlap(
  content: string,
  chunkSize: number = 1000,
  overlap: number = 200,
  metadata: ChunkMetadata = {}
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let index = 0;
  let chunkIndex = 0;

  while (index < content.length) {
    const end = Math.min(index + chunkSize, content.length);
    let chunkContent = content.substring(index, end);

    // Try to break at sentence boundaries
    if (end < content.length) {
      const lastPeriod = chunkContent.lastIndexOf('.');
      const lastNewline = chunkContent.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > chunkSize * 0.7) {
        chunkContent = chunkContent.substring(0, breakPoint + 1);
        index = index + breakPoint + 1 - overlap;
      } else {
        index = end - overlap;
      }
    } else {
      index = end;
    }

    if (chunkContent.trim().length > 50) {
      chunks.push({
        content: chunkContent.trim(),
        metadata: {
          ...metadata,
          chunkType: 'overlap',
          startChar: index,
        },
        chunkIndex: chunkIndex++,
      });
    }
  }

  return chunks;
}
