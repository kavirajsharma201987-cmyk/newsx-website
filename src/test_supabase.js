import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kgrezgkxsaxsasjssqar.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncmV6Z2t4c2F4c2FzanNzcWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTg4ODgsImV4cCI6MjA5MjI3NDg4OH0.ZOGuGUkoJrgdcXcy7KxUECBSAWhDrUje7wVwR5e6mpo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const languages = [
  { id: 1, name: "English", code: "en" },
  { id: 4, name: "हिन्दी", code: "hi" },
  { id: 3, name: "ગુજરાતી", code: "gu" },
  { id: 5, name: "ಕನ್ನಡ", code: "kn" },
  { id: 6, name: "മലയാളം", code: "ml" },
  { id: 7, name: "मराठी", code: "mr" },
  { id: 9, name: "ਪੰਜਾਬੀ", code: "pa" },
  { id: 10, name: "தமிழ்", code: "ta" },
  { id: 11, name: "తెలుగు", code: "te" },
  { id: 12, name: "اردو", code: "ur" },
  { id: 14, name: "বাংলা", code: "bn" }
];

async function run() {
  console.log("Starting diagnostic test on Supabase connection...");
  for (const lang of languages) {
    const tableName = `news_${lang.code}`;
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('feed_promoted', true)
        .limit(2);
      
      if (error) {
        console.error(`❌ Table ${tableName} failed:`, error.message);
      } else {
        console.log(`✅ Table ${tableName} connected successfully. Found: ${data.length} records.`);
      }
    } catch (e) {
      console.error(`❌ Error querying table ${tableName}:`, e.message);
    }
  }

  // Check radios
  try {
    const { data, error } = await supabase.from('radios').select('*').limit(2);
    if (error) console.error("❌ Radios query failed:", error.message);
    else console.log(`✅ Radios query successful. Found: ${data.length} records.`);
  } catch (e) {
    console.error("❌ Radios catch error:", e.message);
  }
}

run();
