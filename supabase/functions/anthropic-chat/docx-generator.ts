import { Document, Paragraph, TextRun, HeadingLevel, Packer } from "https://esm.sh/docx@8.2.0";

/**
 * Generates a properly formatted DOCX document from plain text CV content
 * 
 * @param content The CV text content to convert to a DOCX document
 * @returns A Promise that resolves to a Uint8Array containing the DOCX file data
 */
export async function generateDocx(content: string): Promise<Uint8Array> {
  // Parse the CV text structure - assuming sections are separated by newlines
  const sections = content.split('\n\n').filter(Boolean);
  
  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: sections.map(section => {
        const lines = section.split('\n');
        const paragraphs = [];
        
        // First line of each section as a heading
        if (lines.length > 0) {
          // Check if it's likely a section header (all caps, followed by colon, etc.)
          const isHeader = /^[A-Z\s]+(:|\s*$)/.test(lines[0]);
          
          paragraphs.push(
            new Paragraph({
              text: lines[0],
              heading: isHeader ? HeadingLevel.HEADING_2 : undefined,
              spacing: { after: 120 }
            })
          );
          
          // Add remaining lines
          for (let i = 1; i < lines.length; i++) {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun(lines[i])],
                spacing: { after: 80 }
              })
            );
          }
        }
        
        return paragraphs;
      }).flat()
    }]
  });
  
  // Generate Word document as binary
  return await Packer.toBuffer(doc);
} 