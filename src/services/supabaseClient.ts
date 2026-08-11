import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kgrezgkxsaxsasjssqar.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncmV6Z2t4c2F4c2FzanNzcWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTg4ODgsImV4cCI6MjA5MjI3NDg4OH0.ZOGuGUkoJrgdcXcy7KxUECBSAWhDrUje7wVwR5e6mpo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
