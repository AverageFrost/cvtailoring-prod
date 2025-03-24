
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://kuldrlyjjimvoiedwjmf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1bGRybHlqamltdm9pZWR3am1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4MjExMjQsImV4cCI6MjA1NzM5NzEyNH0.IFIIgTWdFu5A2s5Ke5Uvy4l-6NW4gFNVx8sE_3Da-zI";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
