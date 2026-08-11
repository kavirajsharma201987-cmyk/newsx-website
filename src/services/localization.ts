export const translations: { [key: number]: { [key: string]: string } } = {
  // English (lid: 1)
  1: {
    tab_news: "Article News",
    tab_ai_news: "AI News Briefs",
    tab_hourly_top: "Hourly Top",
    tab_radio: "Radio Live",
    title_news: "Latest News Articles",
    title_ai_news: "Hourly AI Briefs",
    title_hourly_top: "Hourly Top Headlines",
    title_radio: "Live Radio Broadcasts",
    btn_refresh: "Refresh",
    btn_contact: "Contact Us",
    btn_report: "Report Link",
    report_title: "Report Article Link",
    report_prompt: "Choose a reason to report this link:",
    reason_spam: "Spam / False Information",
    reason_broken: "Broken Link / Not Loading",
    reason_inappropriate: "Inappropriate Content",
    reason_copyright: "Copyright / Intellectual Property",
    btn_cancel: "Cancel",
    btn_submit: "Submit",
    report_success: "Report submitted successfully!",
    report_fail: "Failed to submit report. Please try again.",
    news_source: "Source",
    end_of_list: "You've reached the end of the list.",
    failed_load: "Failed to load articles",
    no_news: "No articles found",
    no_briefs: "No briefs available",
    no_briefs_sub: "No updates published for this hour yet.",
    conn_error: "Please check your internet connection or try again.",
    change_filter: "Try changing the category or language selection.",
    contact_title: "Contact & Support",
    contact_email: "Email Support",
    contact_phone: "Phone Support",
    contact_hours: "Support Hours: 24/7"
  },
  // Hindi (lid: 4)
  4: {
    tab_news: "समाचार",
    tab_ai_news: "एआई ब्रीफ",
    tab_hourly_top: "टॉप सुर्खियां",
    tab_radio: "लाइव रेडियो",
    title_news: "ताजा समाचार लेख",
    title_ai_news: "प्रति घंटा एआई संक्षिप्त समाचार",
    title_hourly_top: "प्रति घंटा टॉप सुर्खियां",
    title_radio: "लाइव रेडियो प्रसारण",
    btn_refresh: "रिफ्रेश",
    btn_contact: "संपर्क करें",
    btn_report: "रिपोर्ट करें",
    report_title: "लेख लिंक की रिपोर्ट करें",
    report_prompt: "इस लिंक की रिपोर्ट करने का कारण चुनें:",
    reason_spam: "स्पैम / गलत जानकारी",
    reason_broken: "टूटा हुआ लिंक / लोड नहीं हो रहा",
    reason_inappropriate: "अनुचित सामग्री",
    reason_copyright: "कॉपीराइट / बौद्धिक संपदा",
    btn_cancel: "रद्द करें",
    btn_submit: "सबमिट करें",
    report_success: "रिपोर्ट सफलतापूर्वक सबमिट की गई!",
    report_fail: "रिपोर्ट सबमिट करने में विफल। फिर प्रयास करें।",
    news_source: "स्रोत",
    end_of_list: "आप सूची के अंत तक पहुँच चुके हैं।",
    failed_load: "लेख लोड करने में विफल",
    no_news: "कोई लेख नहीं मिला",
    no_briefs: "कोई ब्रीफ उपलब्ध नहीं है",
    no_briefs_sub: "इस घंटे के लिए अभी कोई अपडेट प्रकाशित नहीं हुआ है।",
    conn_error: "कृपया अपना इंटरनेट कनेक्शन जांचें या पुनः प्रयास करें।",
    change_filter: "श्रेणी या भाषा चयन बदलने का प्रयास करें।",
    contact_title: "संपर्क और सहायता",
    contact_email: "ईमेल सहायता",
    contact_phone: "फ़ोन सहायता",
    contact_hours: "सहायता समय: 24/7"
  }
};

// Category translations
export const categoryTranslations: { [key: number]: { [key: string]: string } } = {
  1: {
    all: "All",
    india: "India",
    world: "World",
    business: "Business",
    sports: "Sports",
    entertainment: "Entertainment"
  },
  4: {
    all: "सभी",
    india: "भारत",
    world: "विश्व",
    business: "व्यापार",
    sports: "खेल",
    entertainment: "मनोरंजन"
  }
};

// Global translation helper
export function t(languageId: number, key: string): string {
  const lang = translations[languageId] || translations[1];
  return lang[key] || translations[1][key] || key;
}

export function tCategory(languageId: number, categoryId: string): string {
  const lang = categoryTranslations[languageId] || categoryTranslations[1];
  return lang[categoryId] || categoryTranslations[1][categoryId] || categoryId;
}
