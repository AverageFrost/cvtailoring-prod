
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

// Function to process item text and extract sub-headers
const processItemText = (text: string): React.ReactNode => {
  // Look for known section headers with colons
  const headerRegex = /(Employment History:|Areas of Expertise:|Key Skills:|Education:|Professional Qualifications:|Technical Skills:|Achievements:|Projects:)(.+)/i;
  
  const match = text.match(headerRegex);
  if (match) {
    // Split into header and remaining content
    const [_, header, content] = match;
    
    return (
      <>
        <span className="text-[#3F2A51] font-medium">{header}</span>
        {content}
      </>
    );
  }
  
  return text;
};

const ImprovementsPanel = ({ improvements }: ImprovementsPanelProps) => {
  return (
    <Card className="border-[#E2DCF8] shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-[#3F2A51] text-xl">Improvements</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <div className="bg-white p-3 rounded-md max-h-[280px] overflow-y-auto text-left content-panel">
          {improvements.map((improvement, index) => (
            <div key={index} className="mb-4">
              <h3 className="flex items-center text-[#3F2A51] font-semibold mb-1">
                <Star className="h-4 w-4 mr-2 text-[#AF93C8]" />
                {cleanCategoryName(improvement.category)}
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                {improvement.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-sm text-gray-700">
                    {processItemText(item)}
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
