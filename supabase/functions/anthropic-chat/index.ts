import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";
// @ts-ignore: Using relative import with .ts extension for Deno compatibility
import { generateDocx } from "./docx-generator.ts";

// Define interfaces for our response types
interface Improvement {
  category: string;
  items: string[];
}

interface ProcessedResponse {
  tailoredCV: string;
  improvements: Improvement[];
  summary: string;
  tailoredCVFilePath?: string; // Make this property optional
}

// Import Anthropic SDK
// Note: We need to use a Deno-compatible version of the SDK
// import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.14.0";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
// Make sure CORS headers are correctly set
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};
serve(async (req)=>{
  console.log("--- New request received ---");
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Skip authentication in local development if the x-skip-auth header is present
  const skipAuth = req.headers.get('x-skip-auth') === 'true';
  if (skipAuth) {
    console.log("Skipping authentication for local development");
  }
  
  // Check if API key exists
  if (!anthropicApiKey) {
    console.error("Missing Anthropic API key");
    return new Response(JSON.stringify({
      error: 'Missing Anthropic API key'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse request JSON:", parseError);
      return new Response(JSON.stringify({
        error: 'Invalid request format',
        details: 'Could not parse request body as JSON'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    const { prompt, cv, jobDescription, userId } = requestBody;
    if (!cv || !jobDescription) {
      console.error("Missing required fields");
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        details: 'Both CV and job description are required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    console.log("Received request for CV tailoring");
    console.log("CV length:", cv?.length || 'No CV provided');
    console.log("Job description length:", jobDescription?.length || 'No job description provided');
    console.log("User ID:", userId || 'No user ID provided');
    // Initialize Supabase client if environment variables are present
    const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;
    try {
      // Debug the API key (first few and last few characters)
      const maskedKey = anthropicApiKey ? 
        `${anthropicApiKey.substring(0, 6)}...${anthropicApiKey.substring(anthropicApiKey.length - 4)}` : 
        "NOT FOUND";
      console.log(`API Key format: ${maskedKey}`);
      
      // Create the system prompt and user prompt
      const systemPrompt = `You are CVTailor, an AI assistant specialized in analyzing and optimizing resumes to match specific job descriptions. Your purpose is to help job seekers maximize their chances of passing through Applicant Tracking Systems (ATS) and impressing human recruiters.

CAPABILITIES:
- Analyze job descriptions to identify key requirements, skills, and qualifications
- Compare CVs against job descriptions to find matches and gaps
- Suggest tailored modifications to CVs that highlight relevant experience and skills
- Maintain truthfulness and accuracy in all recommendations
- Provide clear explanations for all suggested changes
- Format responses in a structured, easy-to-understand manner

LIMITATIONS:
- Never invent or fabricate experiences, skills, or qualifications
- Do not make assumptions about the candidate's capabilities beyond what's in their CV
- Avoid generic advice that doesn't specifically relate to the provided CV and job description
- Do not modify the core structure or formatting of the original CV unless specifically requested

GUIDELINES:
- Focus on keywords and phrases that may be screened by ATS software
- Prioritize quantifiable achievements and results where possible
- Use industry-specific terminology from the job description where appropriate
- Consider the relative importance of different job requirements
- Balance keyword optimization with natural, human-readable language
- Maintain the candidate's authentic voice and professional tone
- Aim for clarity while maintaining depth in all content modifications

RESPONSE FORMAT:
- Always analyze both the CV and job description thoroughly before making recommendations
- Clearly separate your analysis from actual recommended changes
- Use the specified XML tags to structure your output
- Provide clear rationales for all suggested modifications
- When explaining changes, focus on how they improve alignment with the job description

You must remain factual and honest, helping candidates present their genuine qualifications in the most favorable light without misrepresentation. Your goal is to help qualified candidates get noticed, not to help unqualified candidates mislead employers.`;
      const userPrompt = `You are an AI recruitment assistant specialized in tailoring CVs (Curriculum Vitae) to specific job descriptions. Your task is to optimize a candidate's CV to increase their chances of securing an interview for a particular role.

Here is the candidate's original CV:

<cv>
${cv}
</cv>

Now, examine the job description for the position the CV needs to be tailored to:

<job_description>
${jobDescription}
</job_description>

Your goal is to update the CV content to better align with the job description while maintaining the original CV structure. Follow these steps:

1. Analyze the job description, focusing on:
   - Required skills and qualifications
   - Preferred experiences
   - Key responsibilities
   - Industry-specific terminology or buzzwords

2. Extract and list key requirements from the job description.

3. Map CV sections to job requirements.

4. Identify gaps between the CV and job requirements.

5. Brainstorm ways to address these gaps within the constraints.

6. Compare the content of the CV with the job description, identifying:
   - Matching skills and experiences
   - Relevant accomplishments
   - Areas where the CV falls short of the job requirements

7. Update the CV content:
   - Emphasize relevant skills and experiences by moving them to more prominent positions within each section.
   - Rephrase accomplishments and responsibilities to use similar language as the job description.
   - Add any relevant skills or experiences that are in the CV but not prominently featured.
   - Do not invent or add false information to the CV.
   - Maintain the overall structure, formatting, and sections of the original CV.
   - Ensure the updated CV is ATS (Applicant Tracking System) friendly by using key terms from the job description where appropriate.

8. Elaborate on sections that could benefit from additional detail or context to enhance the candidate's chances of securing an interview. This may include:
   - Expanding on projects or responsibilities that closely align with the job requirements
   - Providing more context for achievements that are particularly relevant to the role
   - Adding industry-specific details that demonstrate deep knowledge in areas crucial to the position

Throughout this process, wrap your analysis in <cv_tailoring_analysis> tags. This will ensure a thorough and methodical approach to tailoring the CV.

After completing your analysis and updates, present your results in the following format:

1. The updated CV, enclosed in <updated_cv> tags
2. An explanation of the changes made, enclosed in <explanation> tags. Include:
   - Key changes in each section of the CV
   - Rationale behind the changes
   - How the changes align with the job description
   - Any areas where you elaborated and why

Remember to maintain professionalism and accuracy throughout the tailoring process. Your goal is to present the candidate's qualifications in the best possible light for this specific role, without misrepresenting their experience or skills.`;
      console.log("Sending request to Anthropic API...");
      
      // REPLACE the SDK approach with direct fetch
      console.log("Making direct API call to Anthropic");
      
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": anthropicApiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: userPrompt
                }
              ]
            }
          ]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Successfully received response from Anthropic API");
      
      const aiResponse = data.content && data.content[0] && data.content[0].text 
        ? data.content[0].text 
        : "Sorry, I couldn't generate a response.";
        
      const processedResults = processAnthropicResponse(aiResponse);
      
      // If we have a Supabase client and user ID, save the tailored CV as a file and store in database
      if (supabase && userId && processedResults.tailoredCV) {
        try {
          console.log("Preparing to save tailored CV...");
          
          // Default to plain text in case DOCX generation fails
          let buffer: Uint8Array = new TextEncoder().encode(processedResults.tailoredCV);
          let contentType: string = 'text/plain';
          let fileExtension: string = 'txt';
          
          // Try to generate a proper DOCX document but don't let it crash the entire function
          try {
            console.log("Attempting to generate DOCX document...");
            const docxBuffer = await generateDocx(processedResults.tailoredCV);
            if (docxBuffer && docxBuffer.length > 0) {
              buffer = docxBuffer;
              contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
              fileExtension = 'docx';
              console.log("DOCX document generated successfully, size:", buffer.length);
            } else {
              console.warn("DOCX generation returned empty buffer, falling back to plain text");
            }
          } catch (docxError) {
            // Log the error but continue with plain text
            console.error("Error generating DOCX document:", docxError);
            console.log("Falling back to plain text format");
          }
          
          const filePath = `${userId}/tailored_cv/${Date.now()}_tailored_cv.${fileExtension}`;
          console.log(`Saving file to ${filePath} with content type ${contentType}`);
          
          // Upload to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage.from('user_files').upload(filePath, buffer, {
            contentType: contentType,
            upsert: true
          });
          
          if (uploadError) {
            console.error("Error uploading file to storage:", uploadError);
          } else {
            console.log("File uploaded successfully:", uploadData?.path);
            
            // Also save the job description if provided and not empty
            if (jobDescription && jobDescription.trim() !== "") {
              const jobBuffer = new TextEncoder().encode(jobDescription);
              const jobFilePath = `${userId}/job/${Date.now()}_job_description.txt`;
              
              const { error: jobUploadError } = await supabase.storage.from('user_files').upload(jobFilePath, jobBuffer, {
                contentType: 'text/plain',
                upsert: true
              });
              
              if (jobUploadError) {
                console.error("Error uploading job description to storage:", jobUploadError);
              } else {
                console.log("Job description uploaded successfully");
              }
            }
            
            // Add the file path to the processed results
            processedResults.tailoredCVFilePath = filePath;
            // Save the results to the database
            const { error: insertError } = await supabase.from('tailoring_results').insert({
              user_id: userId,
              original_cv: cv,
              job_description: jobDescription,
              tailored_cv: processedResults.tailoredCV,
              summary: processedResults.summary,
              improvements: processedResults.improvements,
              tailored_cv_file_path: filePath
            });
            if (insertError) {
              console.error("Error saving results to database:", insertError);
            }
          }
        } catch (storageError) {
          console.error("Error in storage operations:", storageError);
        }
      }
      console.log("Returning successful response to client");
      return new Response(JSON.stringify(processedResults), {
        headers: corsHeaders,
        status: 200
      });
    } catch (anthropicError) {
      console.error("Error from Anthropic API:", anthropicError);
      
      // Enhanced error reporting
      let errorDetails = "Unknown API error";
      if (anthropicError instanceof Error) {
        errorDetails = anthropicError.message;
        
        // Check for specific error patterns
        if (errorDetails.includes("text/html")) {
          errorDetails = "Received HTML instead of JSON. This may indicate a network, proxy, or authentication issue.";
        } else if (errorDetails.includes("not found") || errorDetails.includes("model")) {
          errorDetails = "The requested model may not be available. Try using a different Claude model.";
        } else if (errorDetails.includes("authenticate") || errorDetails.includes("key")) {
          errorDetails = "Authentication failed. Check your API key and permissions.";
        }
      }
      
      return new Response(JSON.stringify({
        error: "Failed to get response from Anthropic",
        details: errorDetails
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  } catch (mainError) {
    console.error("Unhandled error in anthropic-chat function:", mainError);
    return new Response(JSON.stringify({
      error: "Server error processing your request",
      details: mainError instanceof Error ? mainError.message : "An unknown error occurred"
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
function processAnthropicResponse(response: string): ProcessedResponse {
  // This is a simple implementation - you may need to adjust based on actual responses
  const sections = response.split(/(?=\n#+\s)/);
  let tailoredCV = "";
  let improvements: Improvement[] = [];
  let summary = "";
  // Extract content between tags
  const updatedCvMatch = response.match(/<updated_cv>([\s\S]*?)<\/updated_cv>/);
  const explanationMatch = response.match(/<explanation>([\s\S]*?)<\/explanation>/);
  const analysisMatch = response.match(/<cv_tailoring_analysis>([\s\S]*?)(<\/cv_tailoring_analysis>|<updated_cv>)/);
  if (updatedCvMatch) {
    tailoredCV = updatedCvMatch[1].trim();
  }
  if (explanationMatch) {
    const rawExplanation = explanationMatch[1].trim();
    // Parse the explanation into categories and items
    improvements = parseImprovements(rawExplanation);
    summary = extractSummary(rawExplanation);
  } else if (analysisMatch) {
    // If no explanation tag but we have analysis, use that
    const rawAnalysis = analysisMatch[1].trim();
    improvements = parseImprovements(rawAnalysis);
    summary = extractSummary(rawAnalysis);
  }
  // If we couldn't parse the response properly, provide the full text
  if (!tailoredCV && !improvements.length && !summary) {
    return {
      tailoredCV: response,
      improvements: [
        {
          category: "General Improvements",
          items: [
            "See the full response for details."
          ]
        }
      ],
      summary: "Please review the tailored CV for improvements."
    };
  }
  return {
    tailoredCV,
    improvements,
    summary
  };
}
function extractContent(section: string): string {
  // Remove the header (if any) and return the content
  const lines = section.split('\n');
  if (lines[0].startsWith('#')) {
    return lines.slice(1).join('\n').trim();
  }
  return section.trim();
}
function extractSummary(text: string): string {
  // Extract a summary from the explanation
  const lines = text.split('\n');
  // Get the first paragraph as summary or first few sentences
  for (const line of lines){
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
      return trimmed;
    }
  }
  return "CV has been tailored to match the job description requirements.";
}
function parseImprovements(improvementsText: string): Improvement[] {
  // Parse the improvements section into categories and items
  const categories: Improvement[] = [];
  let currentCategory: string | null = null;
  let currentItems: string[] = [];
  // Split by lines and process
  const lines = improvementsText.split('\n');
  for (const line of lines){
    const trimmedLine = line.trim();
    // Skip empty lines
    if (!trimmedLine) continue;
    // Check if this is a category header (bold text, starts with *, etc.)
    if (trimmedLine.match(/^[#*]|^\*\*|^-\s*\*\*/) || trimmedLine.match(/^[A-Z]/) && !currentCategory) {
      // If we have a previous category, save it
      if (currentCategory && currentItems.length) {
        categories.push({
          category: currentCategory,
          items: [
            ...currentItems
          ]
        });
      }
      // Start a new category
      currentCategory = trimmedLine.replace(/^[#*-\s]*|\*\*/g, '').trim();
      currentItems = [];
    } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || trimmedLine.match(/^\d+\./)) {
      // Add to current items
      const item = trimmedLine.replace(/^[-•\d.\s]+/, '').trim();
      if (item) currentItems.push(item);
    } else if (currentCategory) {
      // If no items yet, this might be part of the category name
      if (currentItems.length === 0) {
        currentCategory += ' ' + trimmedLine;
      } else if (currentItems.length > 0) {
        currentItems[currentItems.length - 1] += ' ' + trimmedLine;
      }
    }
  }
  // Add the last category if there is one
  if (currentCategory && currentItems.length) {
    categories.push({
      category: currentCategory,
      items: [
        ...currentItems
      ]
    });
  }
  // If no structured categories were found, create a general one
  if (categories.length === 0 && improvementsText) {
    return [
      {
        category: "General Improvements",
        items: [
          improvementsText
        ]
      }
    ];
  }
  return categories;
}
