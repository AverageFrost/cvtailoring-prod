
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface TailoredCVPanelProps {
  content: string;
  onDownload: () => void;
  isDownloading?: boolean;
}

const TailoredCVPanel = ({ content, onDownload, isDownloading = false }: TailoredCVPanelProps) => {
  // Make sure we display actual content or a fallback message
  const displayContent = content && content.trim() !== "" && !content.startsWith("[Updated CV") 
    ? content
    : "No tailored CV content available. Please try again.";

  return (
    <Card className="border-[#E2DCF8] shadow-sm h-full">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-[#3F2A51] text-lg">Tailored CV</CardTitle>
        <Button 
          onClick={onDownload}
          className="bg-[#3F2A51] hover:bg-[#2A1C36] text-white"
          size="sm"
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <div className="bg-white p-3 rounded-md h-[520px] overflow-y-auto whitespace-pre-line text-left text-sm content-panel">
          {displayContent}
        </div>
      </CardContent>
    </Card>
  );
};

export default TailoredCVPanel;
