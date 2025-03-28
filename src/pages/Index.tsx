import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Upload, X, Loader } from "lucide-react";
import FileUploadArea from "@/components/FileUploadArea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import mammoth from "mammoth";
import { callAnthropicAPI } from '@/lib/api';

interface FileData {
  file: File | null;
  content?: string;
  filePath?: string;
  isExistingFile?: boolean;
}

const Index = () => {
  const [cvFile, setCvFile] = useState<FileData>({ file: null });
  const [jobDescription, setJobDescription] = useState<FileData>({ file: null, content: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCvUploading, setIsCvUploading] = useState(false);
  const [isJobUploading, setIsJobUploading] = useState(false);
  const [estimatedSecondsRemaining, setEstimatedSecondsRemaining] = useState(0);
  const [cvContent, setCvContent] = useState<string>("");
  const [jobDescContent, setJobDescContent] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const isUploading = isCvUploading || isJobUploading;
  
  useEffect(() => {
    const loadPreviousCV = async () => {
      if (user) {
        try {
          const { data, error } = await supabase.storage
            .from('user_files')
            .list(`${user.id}/cv`, {
              limit: 1,
              sortBy: { column: 'created_at', order: 'desc' }
            });
            
          if (error) {
            throw error;
          }
          
          if (data && data.length > 0) {
            const latestFile = data[0];
            const filePath = `${user.id}/cv/${latestFile.name}`;
            
            const { data: fileData, error: fileError } = await supabase.storage
              .from('user_files')
              .download(filePath);
              
            if (fileError) {
              throw fileError;
            }
            
            const file = new File(
              [fileData], 
              latestFile.name, 
              { type: fileData.type }
            );
            
            setCvFile({ file, filePath, isExistingFile: true });
          }
        } catch (error: any) {
          console.error("Error loading previous CV:", error.message);
        }
      }
    };
    
    loadPreviousCV();
  }, [user]);

  const handleCvUpload = async (file: File) => {
    const fileExtension = `.${file.name.split(".").pop()}`.toLowerCase();
    if (![".docx", ".txt"].includes(fileExtension)) {
      toast({
        title: "Invalid file format",
        description: "Please upload a DOCX or TXT file for your CV",
        variant: "destructive",
      });
      return;
    }
    
    setIsCvUploading(true);
    
    try {
      let content = "";
      try {
        content = await readFileContent(file);
        console.log("CV content extracted:", content.substring(0, 100) + "...");
      } catch (error) {
        console.error("Error extracting CV content:", error);
        content = "Failed to extract content from file. Please try with a different file format.";
      }
      
      setCvContent(content);
      
      if (user) {
        try {
          const filePath = `${user.id}/cv/${Date.now()}_${file.name}`;
          const { error } = await supabase.storage
            .from('user_files')
            .upload(filePath, file);
            
          if (error) {
            throw error;
          }
          
          setCvFile({ file, filePath, isExistingFile: false, content });
        } catch (error: any) {
          toast({
            title: "Upload failed",
            description: error.message || "Failed to upload your CV",
            variant: "destructive",
          });
          setCvFile({ file, content });
        }
      } else {
        setCvFile({ file, content });
      }
    } catch (error: any) {
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process your CV",
        variant: "destructive",
      });
      setCvFile({ file: null });
    } finally {
      setIsCvUploading(false);
    }
  };

  const handleJobFileUpload = async (file: File) => {
    const fileExtension = `.${file.name.split(".").pop()}`.toLowerCase();
    if (![".docx", ".txt"].includes(fileExtension)) {
      toast({
        title: "Invalid file format",
        description: "Please upload a DOCX or TXT file for the job description",
        variant: "destructive",
      });
      return;
    }
    
    setIsJobUploading(true);
    
    try {
      let content = "";
      try {
        content = await readFileContent(file);
        console.log("Job description content extracted:", content.substring(0, 100) + "...");
      } catch (error) {
        console.error("Error extracting job description content:", error);
        content = "Failed to extract content from file. Please try with a different file format.";
      }
      
      setJobDescContent(content);
      
      if (user) {
        try {
          const filePath = `${user.id}/job/${Date.now()}_${file.name}`;
          const { error } = await supabase.storage
            .from('user_files')
            .upload(filePath, file);
            
          if (error) {
            throw error;
          }
          
          const textFileName = `${Date.now()}_content.txt`;
          const textFilePath = `${user.id}/job/${textFileName}`;
          const textBlob = new Blob([content], { type: 'text/plain' });
          
          const { error: textError } = await supabase.storage
            .from('user_files')
            .upload(textFilePath, textBlob);
            
          if (textError) {
            console.error("Error saving job description text:", textError);
          }
          
          setJobDescription({ file, filePath, content });
        } catch (error: any) {
          toast({
            title: "Upload failed",
            description: error.message || "Failed to upload your job description",
            variant: "destructive",
          });
          setJobDescription({ file, content });
        }
      } else {
        setJobDescription({ file, content });
      }
    } catch (error: any) {
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process your job description",
        variant: "destructive",
      });
      setJobDescription({ file: null, content: "" });
    } finally {
      setIsJobUploading(false);
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    try {
      if (file.type === "text/plain") {
        return await file.text();
      }
      
      if (file.type.includes("word") || file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        console.log("Extracted text from DOCX:", result.value.substring(0, 100) + "...");
        return result.value;
      }
      
      return await file.text();
    } catch (error) {
      console.error("Error extracting file content:", error);
      return `Failed to extract content from ${file.name}. Error: ${error.message}`;
    }
  };

  const handleJobTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJobDescription({ file: null, content: e.target.value });
    setJobDescContent(e.target.value);
  };

  const handleRemoveCv = async () => {
    if (!isProcessing && !isCvUploading) {
      if (user && cvFile.filePath && !cvFile.isExistingFile) {
        try {
          const { error } = await supabase.storage
            .from('user_files')
            .remove([cvFile.filePath]);
            
          if (error) {
            throw error;
          }
        } catch (error: any) {
          console.error("Error removing file:", error.message);
        }
      }
      
      setCvFile({ file: null });
      setCvContent("");
    }
  };

  const handleRemoveJobFile = async () => {
    if (!isProcessing && !isJobUploading) {
      if (user && jobDescription.filePath) {
        try {
          const { error } = await supabase.storage
            .from('user_files')
            .remove([jobDescription.filePath]);
            
          if (error) {
            throw error;
          }
        } catch (error: any) {
          console.error("Error removing file:", error.message);
        }
      }
      
      setJobDescription({ file: null, content: "" });
      setJobDescContent("");
    }
  };

  const handleClearJobText = () => {
    if (!isProcessing && !isJobUploading) {
      setJobDescription({ file: null, content: "" });
      setJobDescContent("");
    }
  };

  const handleTailorCv = async () => {
    const hasCv = cvFile.file !== null;
    const hasJobDescription = jobDescription.file !== null || (jobDescription.content && jobDescription.content.trim() !== "");
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (!hasCv) {
      toast({
        title: "CV required",
        description: "Please upload your CV to continue",
        variant: "destructive",
      });
      return;
    }
    
    if (!hasJobDescription) {
      toast({
        title: "Job description required",
        description: "Please provide a job description to continue",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    
    try {
      const startTime = new Date().getTime();
      
      let cvContentToUse = cvContent;
      if (!cvContentToUse && cvFile.file) {
        cvContentToUse = await readFileContent(cvFile.file);
        setCvContent(cvContentToUse);
      }
      
      let jobDescContentToUse = jobDescContent;
      if (!jobDescContentToUse) {
        if (jobDescription.file) {
          jobDescContentToUse = await readFileContent(jobDescription.file);
          setJobDescContent(jobDescContentToUse);
        } else if (jobDescription.content) {
          jobDescContentToUse = jobDescription.content;
          setJobDescContent(jobDescContentToUse);
        }
      }
      
      if (user && jobDescContentToUse && !jobDescription.file) {
        try {
          const textFileName = `${Date.now()}_manual_content.txt`;
          const textFilePath = `${user.id}/job/${textFileName}`;
          const textBlob = new Blob([jobDescContentToUse], { type: 'text/plain' });
          
          const { error: textError } = await supabase.storage
            .from('user_files')
            .upload(textFilePath, textBlob);
            
          if (textError) {
            console.error("Error saving manual job description text:", textError);
          }
        } catch (error) {
          console.error("Error saving manual job description:", error);
        }
      }
      
      const extractionTime = (new Date().getTime() - startTime) / 1000;
      
      const cvLength = cvContentToUse?.length || 0;
      const jobLength = jobDescContentToUse?.length || 0;
      const totalLength = cvLength + jobLength;
      
      const baseTime = 10;
      const scalingFactor = 0.001;
      const bufferTime = 3;
      
      const estimatedTotalTime = baseTime + (totalLength * scalingFactor) + extractionTime + bufferTime;
      setEstimatedSecondsRemaining(Math.ceil(estimatedTotalTime));
      
      console.log("Sending request to API with: ", {
        cvLength: cvContentToUse?.length || 0,
        jobDescLength: jobDescContentToUse?.length || 0
      });
      
      countdownIntervalRef.current = setInterval(() => {
        setEstimatedSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      try {
        const apiResponse = await callAnthropicAPI({
          cv: cvContentToUse || "No CV content provided.",
          jobDescription: jobDescContentToUse || "No job description provided.",
          prompt: "Tailor this CV to the job description",
          userId: user?.id || null
        });
        
        sessionStorage.setItem('tailoringResults', JSON.stringify({
          originalCV: cvContentToUse,
          jobDescription: jobDescContentToUse,
          tailoredCV: apiResponse.tailoredCV,
          improvements: apiResponse.improvements,
          summary: apiResponse.summary
        }));
        
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        
        navigate('/results');
      } catch (error) {
        console.error('API error:', error);
        setError(error instanceof Error ? error.message : String(error));
        setIsProcessing(false);
        
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }
    } catch (error) {
      console.error('Processing error:', error);
      setError('An unexpected error occurred while processing your request.');
      setIsProcessing(false);
    }
  };
  
  const handleCancelProcessing = () => {
    setIsProcessing(false);
    setEstimatedSecondsRemaining(0);
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    toast({
      title: "Processing cancelled",
      description: "Your CV tailoring has been cancelled",
    });
  };

  const isFormComplete = cvFile.file && (jobDescription.file || (jobDescription.content && jobDescription.content.trim() !== ""));
  const hasJobText = !!jobDescription.content && jobDescription.content.trim() !== "";

  return (
    <div className="min-h-screen bg-[#F8F6FE] flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-[#3F2A51] mb-2">Your personal CV tailor</h1>
          <p className="text-lg text-[#AF93C8]">Let's optimize your CV for specific job descriptions</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="border-[#E2DCF8] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#3F2A51]">Upload Your CV</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploadArea 
                onFileUpload={handleCvUpload}
                onRemoveFile={handleRemoveCv}
                file={cvFile.file}
                acceptedTypes=".docx,.txt"
                uploadText="Drag and drop your CV file"
                acceptedTypesText="Accepted file types: DOCX, TXT"
                icon={<Upload className="h-12 w-12 text-[#AF93C8]" />}
                height="h-[350px]"
                isProcessing={isProcessing}
                isUploading={isCvUploading}
                isExistingFile={!!cvFile.isExistingFile}
              />
            </CardContent>
          </Card>

          <Card className="border-[#E2DCF8] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#3F2A51]">Upload Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              {jobDescription.file ? (
                <FileUploadArea 
                  onFileUpload={handleJobFileUpload}
                  onRemoveFile={handleRemoveJobFile}
                  file={jobDescription.file}
                  acceptedTypes=".docx,.txt"
                  uploadText="Drag and drop a job description file"
                  acceptedTypesText="Accepted file types: DOCX, TXT"
                  icon={<Upload className="h-12 w-12 text-[#AF93C8]" />}
                  height="h-[350px]"
                  isProcessing={isProcessing}
                  isUploading={isJobUploading}
                />
              ) : hasJobText ? (
                <div className="flex flex-col h-[350px]">
                  <div className="p-4 bg-[#F8F6FE] rounded-md flex justify-between items-center mb-2">
                    <span className="text-[#3F2A51] font-medium">Pasted Text</span>
                    <Button
                      onClick={handleClearJobText}
                      variant="ghost"
                      size="sm"
                      className="text-[#AF93C8] hover:text-[#3F2A51] hover:bg-[#E2DCF8] p-1 h-auto"
                      aria-label="Clear text"
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4 mr-1" /> Clear
                    </Button>
                  </div>
                  <div className="h-[316px] flex flex-col border-2 border-[#AF93C8] rounded-md overflow-hidden">
                    <Textarea 
                      placeholder="Paste job description here..."
                      className="w-full flex-grow border-0 focus-visible:ring-0 resize-none overflow-auto"
                      value={jobDescription.content || ""}
                      onChange={handleJobTextChange}
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <FileUploadArea 
                    onFileUpload={handleJobFileUpload}
                    onRemoveFile={handleRemoveJobFile}
                    file={jobDescription.file}
                    acceptedTypes=".docx,.txt"
                    uploadText="Drag and drop a job description file"
                    acceptedTypesText="Accepted file types: DOCX, TXT"
                    icon={<Upload className="h-12 w-12 text-[#AF93C8]" />}
                    height="h-[150px]"
                    isProcessing={isProcessing}
                    isUploading={isJobUploading}
                  />
                  
                  <div className="mt-4">
                    <p className="text-[#AF93C8] mb-2">Or paste text directly:</p>
                    <div className="relative">
                      <Textarea 
                        placeholder="Paste job description here..."
                        className={cn(
                          "min-h-[150px] border-2 focus-visible:ring-0 focus-visible:border-[#AF93C8]",
                          hasJobText ? "border-[#AF93C8]" : "border-[#E2DCF8]"
                        )}
                        value={jobDescription.content || ""}
                        onChange={handleJobTextChange}
                        disabled={isProcessing}
                      />
                      {jobDescription.content && (
                        <button
                          onClick={handleClearJobText}
                          className="absolute right-2 top-2 p-1 rounded-full bg-[#F8F6FE] hover:bg-[#E2DCF8] transition-colors"
                          aria-label="Clear text"
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4 text-[#AF93C8]" />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center">
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <div className="bg-[#AF93C8] bg-opacity-30 text-[#3F2A51] px-8 py-4 rounded-full mb-4 flex items-center min-w-[240px] justify-center">
                <Loader className="h-6 w-6 text-[#3F2A51] animate-spin mr-3" />
                <span className="text-lg font-medium">Tailoring your CV...</span>
              </div>
              
              <p className="text-[#AF93C8] mb-4">
                Please wait while we tailor your CV to the job description... (~{estimatedSecondsRemaining} seconds remaining)
              </p>
              
              <Button 
                onClick={handleCancelProcessing}
                variant="outline"
                className="border-[#E2DCF8] text-[#3F2A51] hover:bg-[#F8F6FE] transition-colors rounded-full px-6"
              >
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </div>
          ) : (
            <>
              <Button 
                onClick={handleTailorCv}
                disabled={!isFormComplete || isUploading}
                className="bg-[#3F2A51] hover:bg-[#2A1C36] text-white transition-colors px-8 py-6 rounded-full text-lg min-w-[240px]"
              >
                {isUploading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    Tailor CV <ArrowRight className="ml-2" />
                  </>
                )}
              </Button>
              
              <p className="text-[#AF93C8] mt-4 text-center">
                {!user && isFormComplete ? 
                  "Sign in to save your CV and job descriptions" : 
                  isFormComplete ? "Click to tailor your CV to this job description" :
                  "Please upload your CV and provide a job description to continue"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
