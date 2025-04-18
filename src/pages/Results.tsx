import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SuccessBanner from "@/components/results/SuccessBanner";
import JobDescriptionPanel from "@/components/results/JobDescriptionPanel";
import TailoredCVPanel from "@/components/results/TailoredCVPanel";
import ImprovementsPanel from "@/components/results/ImprovementsPanel";
import { useAuth } from "@/contexts/AuthContext";

interface Improvement {
  category: string;
  items: string[];
}

interface ResultsData {
  originalCV: string;
  jobDescription: string;
  tailoredCV: string;
  improvements: Improvement[];
  summary: string;
  tailoredCVFilePath?: string;
}

const Results = () => {
  const [results, setResults] = useState<ResultsData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Retrieve results from sessionStorage
    const storedResults = sessionStorage.getItem('tailoringResults');
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        console.log("Retrieved results from sessionStorage:", {
          jobDescriptionLength: parsedResults.jobDescription?.length || 0,
          tailoredCVLength: parsedResults.tailoredCV?.length || 0
        });
        
        // Validate retrieved data
        if (!parsedResults.jobDescription || !parsedResults.tailoredCV) {
          throw new Error("Missing required data in stored results");
        }
        
        // Ensure improvements array has the correct format
        const improvements = Array.isArray(parsedResults.improvements) 
          ? parsedResults.improvements.map((imp: any) => ({
              category: imp.category || "Improvement",
              items: Array.isArray(imp.items) ? imp.items : []
            }))
          : [];
        
        setResults({
          ...parsedResults,
          improvements
        });
      } catch (error) {
        console.error("Error parsing results:", error);
        toast({
          title: "Error",
          description: "Could not load your results. Please try again.",
          variant: "destructive",
        });
        navigate('/');
      }
    } else {
      toast({
        title: "No results found",
        description: "Please tailor your CV first",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [navigate, toast]);

  const handleDownload = async () => {
    if (!results) return;
    
    setIsDownloading(true);
    
    try {
      // Check if we have a stored file path and user is authenticated
      if (results.tailoredCVFilePath && user) {
        // Download from Supabase storage
        const { data, error } = await supabase.storage
          .from('user_files')
          .download(results.tailoredCVFilePath);
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Create a URL for the blob and trigger download
          const url = URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'tailored-cv.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else {
        // Fallback to the old method if no file path exists
        const blob = new Blob([results.tailoredCV], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tailored-cv.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      // Removed the success toast here
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Download failed",
        description: "Could not download your tailored CV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!results) {
    return (
      <div className="min-h-screen bg-[#F8F6FE] flex items-center justify-center">
        <Loader className="h-8 w-8 text-[#3F2A51] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6FE] flex flex-col items-center px-4 py-2">
      <div className="w-full max-w-6xl mt-2">
        <SuccessBanner 
          title="Success!"
          description="Your CV has been tailored to match the job description. You can now download it as a text file or start over."
          actionText="Start Over"
          onAction={() => navigate('/')}
        />
        
        <h1 className="text-2xl font-semibold text-[#3F2A51] mb-4 mt-1 text-left">Your Tailored CV</h1>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <JobDescriptionPanel content={results.jobDescription} />
          <TailoredCVPanel 
            content={results.tailoredCV} 
            onDownload={handleDownload} 
            isDownloading={isDownloading}
          />
        </div>
        
        <div className="mb-8">
          <ImprovementsPanel improvements={results.improvements} />
        </div>
      </div>
    </div>
  );
};

export default Results;
