
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const anthropicApiUrl = "https://api.anthropic.com/v1/messages";
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Make sure CORS headers are correctly set
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  console.log("--- New request received ---");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  // Check if API key exists
  if (!anthropicApiKey) {
    console.error("Missing Anthropic API key");
    return new Response(
      JSON.stringify({ error: 'Missing Anthropic API key' }),
      { 
        status: 500, 
        headers: corsHeaders
      }
    );
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse request JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format', 
          details: 'Could not parse request body as JSON' 
        }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }
    
    const { prompt, cv, jobDescription, userId } = requestBody;
    
    if (!cv || !jobDescription) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          details: 'Both CV and job description are required' 
        }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }
    
    console.log("Received request for CV tailoring");
    console.log("CV length:", cv?.length || 'No CV provided');
    console.log("Job description length:", jobDescription?.length || 'No job description provided');
    console.log("User ID:", userId || 'No user ID provided');

    // Initialize Supabase client if environment variables are present
    const supabase = supabaseUrl && supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null;

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

    // Create messages array with initial assistant message
    const messages = [
      {
        role: "user",
        content: userPrompt
      },
      {
        role: "assistant",
        content: [
          {
            type: "text",
            text: "<cv_tailoring_analysis>"
          }
        ]
      }
    ];

    console.log("Sending request to Anthropic API");
    
    try {
      // Make the request to Anthropic API
      const anthropicResponse = await fetch(anthropicApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307", // Use the available model we have
          max_tokens: 4000,
          system: systemPrompt,
          messages: messages
        })
      });

      // Check if the response is ok (status 200-299)
      if (!anthropicResponse.ok) {
        console.error("Anthropic API error status:", anthropicResponse.status);
        
        // Try to get the response as text for better error reporting
        const errorText = await anthropicResponse.text();
        console.error("Anthropic API error response:", errorText);
        
        // Try to parse as JSON if possible, otherwise return the raw text
        let errorDetails;
        try {
          errorDetails = JSON.parse(errorText);
        } catch (jsonError) {
          console.error("Could not parse error response as JSON");
          // Not valid JSON, return text with appropriate status
          return new Response(
            JSON.stringify({ 
              error: `Error calling Anthropic API: ${anthropicResponse.status}`,
              details: errorText.substring(0, 500) // Limit length of error text
            }),
            { 
              status: anthropicResponse.status || 500, 
              headers: corsHeaders
            }
          );
        }
        
        // Return formatted JSON error
        return new Response(
          JSON.stringify({ 
            error: `Error calling Anthropic API: ${anthropicResponse.status}`,
            details: errorDetails.error?.message || JSON.stringify(errorDetails) 
          }),
          { 
            status: anthropicResponse.status || 500, 
            headers: corsHeaders
          }
        );
      }

      // Check content type to ensure we're dealing with JSON
      const contentType = anthropicResponse.headers.get('content-type');
      console.log("Anthropic API response content type:", contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await anthropicResponse.text();
        console.error("Unexpected content type from Anthropic API:", contentType);
        console.error("Response body sample:", textResponse.substring(0, 200));
        
        return new Response(
          JSON.stringify({ 
            error: "Invalid response from Anthropic API", 
            details: `Expected JSON but got ${contentType || 'unknown content type'}. Response starts with: ${textResponse.substring(0, 100)}...` 
          }),
          { 
            status: 500, 
            headers: corsHeaders
          }
        );
      }
      
      // Parse the JSON response
      let data;
      try {
        data = await anthropicResponse.json();
        console.log("Successfully parsed Anthropic API response");
      } catch (jsonError) {
        console.error("Failed to parse Anthropic API response as JSON:", jsonError);
        const textResponse = await anthropicResponse.text();
        return new Response(
          JSON.stringify({ 
            error: "Failed to parse Anthropic API response", 
            details: `Response starts with: ${textResponse.substring(0, 200)}...` 
          }),
          { 
            status: 500, 
            headers: corsHeaders
          }
        );
      }
      
      // Check if there's an error in the response
      if (data.error) {
        console.error("Anthropic API error:", data.error);
        return new Response(
          JSON.stringify({ 
            error: "Error from Anthropic API", 
            details: data.error.message || JSON.stringify(data.error) 
          }),
          { 
            status: 500, 
            headers: corsHeaders
          }
        );
      }

      // Extract the content from Anthropic's response
      const aiResponse = data.content && data.content[0] && data.content[0].text 
        ? data.content[0].text 
        : "Sorry, I couldn't generate a response.";

      // Process the response to extract the three parts
      const processedResults = processAnthropicResponse(aiResponse);
      
      // If we have a Supabase client and user ID, save the tailored CV as a file and store in database
      if (supabase && userId && processedResults.tailoredCV) {
        try {
          // Create a blob and upload to Supabase storage
          const buffer = new TextEncoder().encode(processedResults.tailoredCV);
          const filePath = `${userId}/${Date.now()}_tailored_cv.docx`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('tailored_cv')
            .upload(filePath, buffer, {
              contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              upsert: true
            });
            
          if (uploadError) {
            console.error("Error uploading file to storage:", uploadError);
          } else {
            console.log("File uploaded successfully:", uploadData?.path);
            
            // Add the file path to the processed results
            processedResults.tailoredCVFilePath = filePath;
            
            // Save the results to the database
            const { error: insertError } = await supabase
              .from('tailoring_results')
              .insert({
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
      console.error("Error calling Anthropic API:", anthropicError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to communicate with Anthropic API",
          details: anthropicError instanceof Error ? anthropicError.message : "Unknown error" 
        }),
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }
  } catch (mainError) {
    console.error("Unhandled error in anthropic-chat function:", mainError);
    return new Response(
      JSON.stringify({ 
        error: "Server error processing your request",
        details: mainError instanceof Error ? mainError.message : "An unknown error occurred" 
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});

function processAnthropicResponse(response) {
  // This is a simple implementation - you may need to adjust based on actual responses
  const sections = response.split(/(?=\n#+\s)/);
  
  let tailoredCV = "";
  let improvements = [];
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
      improvements: [{ category: "General Improvements", items: ["See the full response for details."] }],
      summary: "Please review the tailored CV for improvements."
    };
  }
  
  return {
    tailoredCV,
    improvements,
    summary
  };
}

function extractContent(section) {
  // Remove the header (if any) and return the content
  const lines = section.split('\n');
  if (lines[0].startsWith('#')) {
    return lines.slice(1).join('\n').trim();
  }
  return section.trim();
}

function extractSummary(text) {
  // Extract a summary from the explanation
  const lines = text.split('\n');
  // Get the first paragraph as summary or first few sentences
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
      return trimmed;
    }
  }
  return "CV has been tailored to match the job description requirements.";
}

function parseImprovements(improvementsText) {
  // Parse the improvements section into categories and items
  const categories = [];
  let currentCategory = null;
  let currentItems = [];
  
  // Split by lines and process
  const lines = improvementsText.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) continue;
    
    // Check if this is a category header (bold text, starts with *, etc.)
    if (trimmedLine.match(/^[#*]|^\*\*|^-\s*\*\*/) || 
        (trimmedLine.match(/^[A-Z]/) && !currentCategory)) {
      // If we have a previous category, save it
      if (currentCategory && currentItems.length) {
        categories.push({
          category: currentCategory,
          items: [...currentItems]
        });
      }
      
      // Start a new category
      currentCategory = trimmedLine.replace(/^[#*-\s]*|\*\*/g, '').trim();
      currentItems = [];
    } 
    // Check if this is a list item
    else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || 
             trimmedLine.match(/^\d+\./)) {
      // Add to current items
      const item = trimmedLine.replace(/^[-•\d.\s]+/, '').trim();
      if (item) currentItems.push(item);
    }
    // Otherwise, it might be part of the category description or a continuation
    else if (currentCategory) {
      // If no items yet, this might be part of the category name
      if (currentItems.length === 0) {
        currentCategory += ' ' + trimmedLine;
      } 
      // Otherwise, it might be a continuation of the last item
      else if (currentItems.length > 0) {
        currentItems[currentItems.length - 1] += ' ' + trimmedLine;
      }
    }
  }
  
  // Add the last category if there is one
  if (currentCategory && currentItems.length) {
    categories.push({
      category: currentCategory,
      items: [...currentItems]
    });
  }
  
  // If no structured categories were found, create a general one
  if (categories.length === 0 && improvementsText) {
    return [{
      category: "General Improvements",
      items: [improvementsText]
    }];
  }
  
  return categories;
}
