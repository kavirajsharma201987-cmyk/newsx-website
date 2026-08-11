import { supabase } from './supabaseClient';

export interface NewsArticle {
  id: number;
  title: string;
  des: string;
  image_url: string;
  source_url: string;
  category: string;
  published_at: string;
  likes_count: number;
  dislikes_count: number;
  dm?: string; // domain override
  myReaction?: number; // 0 = none, 1 = liked, 2 = disliked
}

export interface AiBriefSourceArticle {
  id: number;
  title: string;
  url: string;
  category: string;
  published_at: string;
}

export interface AiNewsBrief {
  id: number;
  language_code: string;
  brief_date: string;
  brief_type: string; // 'hourly_non_ai' or 'hourly_ai_top'
  period_key: string;
  period_start: string;
  period_end: string;
  summary_kind: string;
  title: string;
  about: string;
  news_about: string;
  category: string;
  people: string[];
  organizations: string[];
  countries: string[];
  locations: string[];
  published_date?: string;
  source_name: string;
  source_url: string;
  conclusion: string;
  points: string[];
  source_articles: AiBriefSourceArticle[];
  provider: string;
  model: string;
  created_at: string;
}

export interface LiveRadioStation {
  id: number;
  lid: number;
  name: string;
  url: string;
  frequency?: string;
}

export const languages = [
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

export const newsCategories = [
  { id: "all", label: "All", icon: "LayoutGrid" },
  { id: "india", label: "India", icon: "MapPin" },
  { id: "world", label: "World", icon: "Globe" },
  { id: "business", label: "Business", icon: "Briefcase" },
  { id: "sports", label: "Sports", icon: "Trophy" },
  { id: "entertainment", label: "Entertainment", icon: "Film" }
];

// Helper to get category aliases matching iOS
export function getCategoryAliases(categoryId: string): string[] {
  const canonical = categoryId.trim().toLowerCase();
  if (canonical === 'all') return ['all'];

  const aliasMap: { [key: string]: string[] } = {
    india: [
      "india", "bharat", "national", "local", "delhi", "mumbai",
      "भारत", "ભારત", "ಭಾರತ", "ഇന്ത്യ", "ਭਾਰਤ", "இந்தியா",
      "భారత్", "بھارت", "ভারত"
    ],
    world: [
      "world", "global", "international", "foreign",
      "विश्व", "વિશ્વ", "ವಿಶ್ವ", "ലോകം", "ਜਗਤ", "உலகம்",
      "ప్రపంచం", "دنیا", "বিশ্ব"
    ],
    business: [
      "business", "business-news", "market", "markets", "stock", "stocks",
      "economy", "finance", "startup", "money",
      "व्यापार", "व्यवसाय", "બિઝનેસ", "ವ್ಯಾਪಾರ", "ബിസിനസ്",
      "ਕਾਰੋਬਾਰ", "வணிகம்", "వ్యాపారం", "کاروبار", "ব্যবসা"
    ],
    sports: [
      "sports", "sport", "sports-news", "cricket", "football", "tennis",
      "hockey", "ipl",
      "खेल", "क्रीडा", "રમતગમત", "ಕ್ರೀಡೆ", "ಕಾಯಿകം",
      "ਖੇਡਾਂ", "விளையாட்டு", "క్రీడలు", "کھیل", "খেলাধুলা"
    ],
    entertainment: [
      "entertainment", "entertainment-news", "movie", "movies", "film",
      "films", "bollywood", "ott", "celebrity",
      "मनोरंजन", "મનોરંજન", "ಮನರಂಜನೆ", "വിനോദം", "ਮਨੋਰੰਜਨ",
      "பொழுதுபோக்கு", "వినోదం", "تفریح", "বিনোদন"
    ]
  };

  return aliasMap[canonical] || [canonical];
}

export function getLanguageCode(lid: number): string {
  return languages.find(l => l.id === lid)?.code || "en";
}

// Fetch News Articles matching Swift query
export async function fetchNewsArticles(
  lid: number,
  category: string,
  page: number = 0,
  pageSize: number = 20
): Promise<NewsArticle[]> {
  const code = getLanguageCode(lid);
  const tableName = `news_${code}`;

  let query = supabase
    .from(tableName)
    .select('*')
    .eq('feed_promoted', true);

  const cleanCategory = category.trim().toLowerCase();
  if (cleanCategory !== 'all') {
    const aliases = getCategoryAliases(cleanCategory);
    if (aliases.length === 1) {
      query = query.eq('category', aliases[0]);
    } else {
      query = query.in('category', aliases);
    }
  }

  const fromIndex = page * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  const { data, error } = await query
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .range(fromIndex, toIndex);

  if (error) {
    console.error("Error fetching news articles:", error);
    throw error;
  }

  return data || [];
}

// Fetch AI News Briefs & Hourly Top Headlines
export async function fetchAiBriefs(
  lid: number,
  briefType: 'hourly_non_ai' | 'hourly_ai_top',
  page: number = 0,
  pageSize: number = 20
): Promise<AiNewsBrief[]> {
  const code = getLanguageCode(lid);
  const tableName = briefType === 'hourly_non_ai' ? `hourly_headlines_${code}` : `hourly_ai_top_${code}`;

  const fromIndex = page * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('language_code', code)
    .eq('status', 'published')
    .eq('brief_type', briefType)
    .order('period_start', { ascending: false })
    .order('created_at', { ascending: false })
    .range(fromIndex, toIndex);

  if (error) {
    console.error(`Error fetching briefs (${briefType}):`, error);
    throw error;
  }

  return (data || []).filter(brief => brief.points && brief.points.length > 0);
}

// Fetch Live Radio Stations
export async function fetchRadioStations(lid: number): Promise<LiveRadioStation[]> {
  const { data, error } = await supabase
    .from('radios')
    .select('*')
    .eq('lid', lid);

  if (error) {
    console.error("Error fetching radio stations:", error);
    throw error;
  }

  return data || [];
}

// Post reaction helper to increment/decrement likes/dislikes
export async function postReaction(
  lid: number,
  articleId: number,
  reaction: number, // 0 = none, 1 = liked, 2 = disliked
  newValue: number
): Promise<void> {
  const code = getLanguageCode(lid);
  const tableName = `news_${code}`;
  const column = reaction === 1 ? 'likes_count' : (reaction === 2 ? 'dislikes_count' : '');

  if (!column) return;

  try {
    // Direct table update
    const { error } = await supabase
      .from(tableName)
      .update({ [column]: newValue })
      .eq('id', articleId);

    if (error) {
      console.warn("Direct reaction update failed, attempting RPC fallback:", error);
      // RPC fallback matching Swift rpc("post_reaction", ...)
      const { error: rpcError } = await supabase.rpc('post_reaction', {
        p_article_id: articleId,
        p_reaction_type: reaction
      });

      if (rpcError) throw rpcError;
    }
  } catch (err) {
    console.error("Post reaction failed:", err);
    throw err;
  }
}

// Submit report to Supabase tables
export async function submitReport(
  articleId: number,
  reason: string,
  url: string
): Promise<boolean> {
  const payload = {
    article_id: articleId,
    articleId: articleId,
    reason: reason,
    details: `URL: ${url}`
  };

  const tables = ["news_reports", "reports", "report", "news_report"];
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .insert([payload]);
      if (!error) {
        console.log(`Successfully saved report in Supabase table: ${table}`);
        return true;
      }
      console.warn(`Table ${table} insert failed:`, error);
    } catch (e) {
      console.warn(`Table ${table} insert failed:`, e);
    }
  }
  return false;
}

// Get clean publisher/source name from domain
export function getSourceName(article: NewsArticle): string {
  let domain = article.dm || '';
  if (!domain && article.source_url) {
    try {
      const url = new URL(article.source_url);
      domain = url.hostname;
    } catch (e) {
      domain = article.source_url;
    }
  }
  
  const cleanUrl = domain.trim().toLowerCase();
  if (cleanUrl.includes("navbharattimes")) {
    return "Navbharat";
  } else if (cleanUrl.includes("aajtak")) {
    return "Aajtak";
  } else if (cleanUrl.includes("bhaskar")) {
    return "Dainik Bhaskar";
  } else if (cleanUrl.includes("jagran")) {
    return "Dainik Jagran";
  } else if (cleanUrl.includes("ndtv")) {
    return "NDTV";
  } else if (cleanUrl.includes("amarujala")) {
    return "Amar Ujala";
  } else if (cleanUrl.includes("livehindustan") || cleanUrl.includes("hindustantimes")) {
    return "Hindustan";
  } else if (cleanUrl.includes("news18")) {
    return "News18";
  } else if (cleanUrl.includes("jansatta")) {
    return "Jansatta";
  } else if (cleanUrl.includes("patrika")) {
    return "Patrika";
  } else if (cleanUrl.includes("loktej")) {
    return "Loktej";
  }

  // Fallback: extract the clean hostname first word
  const hostParts = cleanUrl.replace("www.", "").split(".");
  if (hostParts.length > 0 && hostParts[0]) {
    return hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
  }
  return "NewsX";
}

