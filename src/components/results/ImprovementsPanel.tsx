import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

interface Improvement {
  category: string;
  items: string[];
}

interface ImprovementsPanelProps {
  improvements: Improvement[];
}

// Function to clean category names
const cleanCategoryName = (category: string): string => {
  // Remove "Key changes made to the CV:" prefix if it exists
  let cleaned = category.replace(/^Key changes made to the CV:\s*/i, "");
  
  // If there's a colon at the end of the category, remove it
  cleaned = cleaned.replace(/:\s*$/, "");
  
  return cleaned;
};

// Function to extract embedded section headers from item text
const extractSectionHeaders = (improvements: Improvement[]): Improvement[] => {
  const sectionHeaderRegex = /(Employment History|Areas of Expertise|Skills|Education|Work Experience|Professional Experience|Technical Skills|Certifications|Projects):\s*/i;
  const result: Improvement[] = [];
  
  improvements.forEach(improvement => {
    const newItems: string[] = [];
    const extractedSections: Record<string, string[]> = {};
    
    // Process each item to extract potential section headers
    improvement.items.forEach(item => {
      if (sectionHeaderRegex.test(item)) {
        // Split on the section header
        const match = item.match(sectionHeaderRegex);
        
        if (match) {
          const headerName = match[1];
          const parts = item.split(match[0]);
          
          // If there's content before the header, add it to the current category
          if (parts[0].trim()) {
            newItems.push(parts[0].trim());
          }
          
          // Add content after the header to a new section
          if (!extractedSections[headerName]) {
            extractedSections[headerName] = [];
          }
          
          if (parts[1] && parts[1].trim()) {
            extractedSections[headerName].push(parts[1].trim());
          }
        }
      } else {
        // No section header, keep the item as is
        newItems.push(item);
      }
    });
    
    // Add the original category with its remaining items
    if (newItems.length > 0) {
      result.push({
        category: improvement.category,
        items: newItems
      });
    }
    
    // Add all extracted sections as new categories
    Object.keys(extractedSections).forEach(sectionName => {
      result.push({
        category: sectionName,
        items: extractedSections[sectionName]
      });
    });
  });
  
  return result;
};

const ImprovementsPanel = ({ improvements }: ImprovementsPanelProps) => {
  // Process improvements to extract embedded section headers
  const processedImprovements = extractSectionHeaders(improvements);
  
  return (
    <Card className="border-[#E2DCF8] shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-[#3F2A51] text-xl">Improvements</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <div className="bg-white p-3 rounded-md max-h-[280px] overflow-y-auto text-left content-panel">
          {processedImprovements.map((improvement, index) => (
            <div key={index} className="mb-4">
              <h3 className="flex items-center text-[#3F2A51] font-semibold mb-1">
                <Star className="h-4 w-4 mr-2 text-[#AF93C8]" />
                {cleanCategoryName(improvement.category)}
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                {improvement.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-sm text-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovementsPanel;
