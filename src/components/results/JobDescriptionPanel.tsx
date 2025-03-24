
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ScrollbarStyles from "./ScrollbarStyles";

interface JobDescriptionPanelProps {
  content: string;
}

const JobDescriptionPanel = ({ content }: JobDescriptionPanelProps) => {
  // Make sure we display actual content or a fallback message
  const displayContent = content && content.trim() !== "" 
    ? content
    : "No job description content available. Please try again.";

  return (
    <Card className="border-[#E2DCF8] shadow-sm h-full">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-[#3F2A51] text-lg">Job Description</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <ScrollArea className="h-[520px] pr-4">
          <div className="bg-white p-3 rounded-md overflow-y-auto whitespace-pre-line text-left text-sm content-panel">
            {displayContent}
          </div>
        </ScrollArea>
      </CardContent>
      <ScrollbarStyles />
    </Card>
  );
};

export default JobDescriptionPanel;
