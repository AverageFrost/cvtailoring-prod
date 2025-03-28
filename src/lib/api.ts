// Remove unused supabase import, which could be causing issues
// import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://kuldrlyjjimvoiedwjmf.supabase.co";
const ANTHROPIC_API_ENDPOINT = 'anthropic-chat';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1bGRybHlqamltdm9pZWR3am1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4MjExMjQsImV4cCI6MjA1NzM5NzEyNH0.IFIIgTWdFu5A2s5Ke5Uvy4l-6NW4gFNVx8sE_3Da-zI';

// Interface for API request input
export interface AnthropicChatRequest {
  cv: string;
  jobDescription: string;
  prompt?: string;
  userId?: string | null;
}

// Interface for API response
export interface AnthropicChatResponse {
  tailoredCV: string;
  improvements: Array<{
    category: string;
    items: string[];
  }>;
  summary: string;
  tailoredCVFilePath?: string;
}

/**
 * Call the Anthropic chat API to tailor a CV to a job description
 * Uses direct URL in production, proxy in development
 */
export const callAnthropicAPI = async (
  params: AnthropicChatRequest
): Promise<AnthropicChatResponse> => {
  // Determine if we're in production by checking location protocol
  // In a browser, window.location.hostname will be 'localhost' in development
  // and your actual domain in production
  const isProduction = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';
  
  // Choose API URL based on environment
  // In production, use the direct Supabase function URL
  // In development, use the proxy configured in vite.config.ts
  const API_URL = isProduction
    ? `${SUPABASE_URL}/functions/v1/${ANTHROPIC_API_ENDPOINT}`
    : `/api/${ANTHROPIC_API_ENDPOINT}`;
    
  console.log(`Calling Anthropic API at ${API_URL}`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(params)
    });
    
    // Check for successful response
    if (!response.ok) {
      let errorMessage = `Request failed with status: ${response.status}`;
      
      // Get the content type for better error diagnostics
      const contentType = response.headers.get('content-type') || 'unknown';
      
      try {
        // Handle different response types based on content type
        if (contentType.includes('application/json')) {
          // Try to get error details from JSON response
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } else {
          // If not JSON, try to get text (limited to prevent large HTML errors)
          const errorText = await response.text();
          const truncatedText = errorText.substring(0, 150) + '...';
          errorMessage = `${errorMessage} - Non-JSON response (${contentType}): ${truncatedText}`;
        }
      } catch (readError) {
        console.error("Couldn't extract error details:", readError);
        errorMessage = `${errorMessage} - Unable to parse error response`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Verify the content type is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}. Response: ${responseText.substring(0, 150)}...`);
    }
    
    // Parse and return JSON data
    const data = await response.json();
    
    // Check for API error in the response itself
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}; 