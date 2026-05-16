import { CONTACTS } from '../constants';
import { SecurityService } from './securityService';

export interface ProcessedCommand {
  actionType: string;
  response: string;
  spokenResponse?: string;
  language: 'en' | 'hi';
  externalUrl?: string;
  data?: any;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const MODEL_NAME = import.meta.env.VITE_MODEL_NAME || "nvidia/nemotron-3-nano-30b-a3b:free";

// ── Creator / Developer Profile ─────────────────────────────────────────────
const CREATOR_INFO = {
  name: "Aryan Ahirwar",
  alias: "VIPHACKER100",
  title: "Cybersecurity Expert | Ethical Hacker | Penetration Tester | Bug Bounty Hunter",
  role: "Founder & CEO of VIPHACKER.100",
  website: "https://viphacker100.com",
  github: "https://github.com/viphacker100",
  linkedin: "https://linkedin.com/in/viphacker100",
  instagram: "https://instagram.com/viphacker100",
  expertise: [
    "Web Application Penetration Testing",
    "Bug Bounty Hunting",
    "OSINT (Open Source Intelligence)",
    "CTF Challenges & Walkthroughs",
    "Security Tool Development",
    "Network Security & Infrastructure Testing",
    "Ethical Hacking & Red Team Operations"
  ],
  about_en: `I was built by Aryan Ahirwar — alias VIPHACKER100 — a passionate Cybersecurity Expert and the Founder & CEO of VIPHACKER.100. He specialises in ethical hacking, web application penetration testing, bug bounty hunting, OSINT, and security tool development. His mission is to make cyberspace safer by finding vulnerabilities before malicious actors can exploit them. Visit viphacker100.com to learn more.`,
  about_hi: `मुझे अर्यन अहिरवार ने बनाया है — जिन्हें VIPHACKER100 के नाम से भी जाना जाता है। वे एक जुनूनी साइबर सुरक्षा विशेषज्ञ और VIPHACKER.100 के संस्थापक व CEO हैं। वे एथिकल हैकिंग, वेब एप्लीकेशन पेनेट्रेशन टेस्टिंग, बग बाउंटी हंटिंग, OSINT और सुरक्षा उपकरण विकास में माहिर हैं। उनका मिशन है — साइबर दुनिया को सुरक्षित बनाना। अधिक जानने के लिए viphacker100.com पर जाएँ।`
};

// ... (keywords remain unchanged)

// ... (detectLanguage remains unchanged)

export const processTranscript = async (text: string): Promise<ProcessedCommand> => {
  // ... (security, help, greetings, etc. remain unchanged - we need to preserve them. I'll use multi_replace instead to be safe on large file)

  // Keywords for robust language scoring
  const HINDI_KEYWORDS = new Set([
    'kholo', 'band', 'karo', 'chalao', 'bhejo', 'kaun', 'kya', 'hai', 'samay',
    'tareekh', 'din', 'aaj', 'kal', 'suno', 'sun', 'raha', 'hu', 'mujhe', 'tum', 'aap',
    'namaste', 'shukriya', 'dhanyavad', 'kaise', 'madad', 'sakte', 'ho', 'btao', 'batao',
    'dekhna', 'ruko', 'dheere', 'tez', 'badhao', 'kam', 'aawaz', 'par', 'ko', 'me',
    'se', 'ka', 'ki', 'aur', 'kahan', 'kab', 'kyu', 'open', // 'open karo' common hinglish
    'mausam', 'tapman', 'garmi', 'sardi', 'hisab', 'jodo', 'ghatao', 'guna', 'bhag'
  ]);

  const ENGLISH_KEYWORDS = new Set([
    'open', 'close', 'play', 'send', 'message', 'tell', 'what', 'is', 'the', 'time', 'date',
    'today', 'who', 'are', 'you', 'hello', 'hi', 'thank', 'thanks', 'help', 'commands', 'features', 'list',
    'search', 'volume', 'increase', 'decrease', 'navigate', 'go', 'to', 'for', 'on',
    'can', 'please', 'start', 'stop', 'weather', 'temperature', 'forecast', 'calculate', 'solve', 'math', 'plus', 'minus', 'times', 'divided'
  ]);

  // Helper to robustly detect language based on script and keywords
  const detectLanguage = (text: string): 'en' | 'hi' => {
    const lowerText = text.toLowerCase();

    // 1. Script Check (Absolute confidence for Devanagari)
    const devanagariRange = /[\u0900-\u097F]/;
    if (devanagariRange.test(text)) {
      return 'hi';
    }

    // 2. Keyword Scoring for Latin script (Hinglish vs English)
    // Clean text: remove punctuation
    const tokens = lowerText.replace(/[^\w\s]/g, '').split(/\s+/);

    let hiScore = 0;
    let enScore = 0;

    tokens.forEach(t => {
      // Exact match check
      if (HINDI_KEYWORDS.has(t)) hiScore++;
      if (ENGLISH_KEYWORDS.has(t)) enScore++;
    });

    // Bias towards Hindi if scores are equal but contained known Hinglish markers
    // Otherwise default to English as it's the global default for Latin script
    if (hiScore > enScore) return 'hi';
    if (enScore > hiScore) return 'en';

    return 'en'; // Default fallback
  };

  // 1. Security Sanitization
  const cleanText = SecurityService.sanitizeCommand(text);
  const lowerText = cleanText.toLowerCase();
  const detectedLang = detectLanguage(cleanText);
  const isHindi = detectedLang === 'hi';

  // 2. Phishing/Threat Detection
  if (SecurityService.analyzeForPhishing(cleanText)) {
    return {
      actionType: 'SECURITY_ALERT',
      response: isHindi
        ? "चेतावनी: संवेदनशील जानकारी साझा न करें। यह एक सुरक्षा जोखिम हो सकता है।"
        : "SECURITY ALERT: Sensitive information detected. Do not share passwords or OTPs.",
      spokenResponse: isHindi
        ? "चेतावनी। सुरक्षा प्रोटोकॉल सक्रिय। संवेदनशील डेटा साझा न करें।"
        : "Security protocol engaged. Potential phishing attempt detected.",
      language: detectedLang
    };
  }

  // --- Help / Madad ---
  if (
    lowerText.includes('help') ||
    lowerText.includes('madad') ||
    lowerText.match(/(?:what|kya)\s+(?:can|sakte)\s+(?:you|tum|aap)\s+(?:do|karo|ho)/) ||
    lowerText.includes('commands') ||
    lowerText.includes('features') ||
    lowerText.includes('capabilities')
  ) {
    if (isHindi) {
      return {
        actionType: 'HELP',
        response: `उपलब्ध कमांड्स (Capabilities):
• नेविगेशन: "गूगल खोलो", "फेसबुक पर जाओ"
• मीडिया: "YouTube पर गाने चलाओ"
• मैसेजिंग: "मम्मी को मैसेज भेजो नमस्ते"
• सिस्टम: "समय क्या है?", "आवाज़ बढ़ाओ"`,
        spokenResponse: "मैं वेब नेविगेशन, मीडिया प्लेबैक, और मैसेजिंग में सहायता कर सकता हूँ। कृपया स्क्रीन पर दी गई सूची देखें।",
        language: 'hi'
      };
    } else {
      return {
        actionType: 'HELP',
        response: `System Capabilities:
• Navigation: "Open Google", "Go to Twitter"
• Media: "Play Iron Man trailer on YouTube"
• Messaging: "Send message to Mom saying I'm home"
• System: "What time is it?", "Volume up", "Weather in Delhi", "Calculate 5 plus 3"`,
        spokenResponse: "I can assist with navigation, media, communication, weather updates and calculations. Displaying available command syntax now.",
        language: 'en'
      };
    }
  }

  // --- Greetings ---
  if (
    lowerText.match(/^(hello|hi|hey|greetings)/) ||
    lowerText.includes('hi jarvis') ||
    lowerText.match(/(?:नमस्ते|namaste|hello|pranam)/)
  ) {
    return {
      actionType: 'GREETING',
      response: isHindi
        ? "नमस्ते! मैं आपकी किस तरह सहायता कर सकता हूँ?"
        : "Hello! It's good to see you. How can I assist you today?",
      language: detectedLang
    };
  }

  if (
    lowerText.includes('thank') ||
    lowerText.includes('dhanyavad') ||
    lowerText.includes('shukriya') ||
    lowerText.includes('धन्यवाद') ||
    lowerText.includes('शुक्रिया')
  ) {
    return {
      actionType: 'GREETING',
      response: isHindi
        ? "आपका स्वागत है! मुझे आपकी मदद करके खुशी हुई।"
        : "You're very welcome! I'm happy to be of service.",
      language: detectedLang
    };
  }

  if (
    lowerText.includes('who are you') ||
    lowerText.match(/(?:tum|aap)\s+(?:kaun|kon)\s+(?:ho|hai)/) ||
    lowerText.includes('तुम कौन हो') ||
    lowerText.includes('introduce yourself') ||
    lowerText.includes('apna parichay do')
  ) {
    return {
      actionType: 'IDENTITY',
      response: isHindi
        ? `मैं जार्विस हूँ — ${CREATOR_INFO.name} (VIPHACKER100) द्वारा निर्मित आपका निजी AI सहायक। मैं वेब नेविगेशन, मीडिया, मैसेजिंग, मौसम, गणना और बहुत कुछ में आपकी मदद कर सकता हूँ।`
        : `I'm JARVIS — your personal AI assistant, built by ${CREATOR_INFO.name} (VIPHACKER100), ${CREATOR_INFO.role}. I can help with navigation, media, messaging, weather, calculations, and much more.`,
      language: detectedLang
    };
  }

  // --- Creator / Developer Info ---
  if (
    lowerText.match(/who\s+(made|built|created|developed)\s+(you|jarvis)/i) ||
    lowerText.match(/who\s+is\s+your\s+(creator|developer|maker|owner|boss)/i) ||
    lowerText.match(/tell\s+me\s+about\s+(your\s+)?(creator|developer|maker|aryan|viphacker)/i) ||
    lowerText.includes('aryan ahirwar') ||
    lowerText.includes('viphacker100') ||
    lowerText.includes('viphacker') ||
    lowerText.match(/(?:tumhe|aapko|tujhe)\s+(?:kisne|kaun)\s+(?:banaya|banaaya|develop|create)/i) ||
    lowerText.match(/(?:developer|creator|maker)\s+(?:kaun|kon)\s+(?:hai|he)/i) ||
    lowerText.includes('tumhara developer') ||
    lowerText.includes('tumhara creator') ||
    lowerText.includes('तुम्हें किसने बनाया') ||
    lowerText.includes('आपका निर्माता')
  ) {
    const expertiseList = CREATOR_INFO.expertise.slice(0, 4).join(', ');
    return {
      actionType: 'CREATOR_INFO',
      response: isHindi
        ? `${CREATOR_INFO.about_hi}\n\n🔐 विशेषज्ञता: ${expertiseList} और अधिक।\n🌐 ${CREATOR_INFO.website}`
        : `${CREATOR_INFO.about_en}\n\n🔐 Key expertise: ${expertiseList}, and more.\n🌐 ${CREATOR_INFO.website}`,
      spokenResponse: isHindi
        ? `मुझे अर्यन अहिरवार ने बनाया है, जो VIPHACKER.100 के संस्थापक और CEO हैं। वे एक साइबर सुरक्षा विशेषज्ञ और एथिकल हैकर हैं।`
        : `I was created by Aryan Ahirwar, the Founder and CEO of VIPHACKER.100, a cybersecurity expert specialising in ethical hacking and penetration testing.`,
      language: detectedLang
    };
  }

  // --- Web Navigation ---
  // Regex updated to handle Hinglish (Latin script Hindi)
  const webMatch =
    lowerText.match(/(?:open|go to|navigate to|visit)\s+(.+)/i) ||
    lowerText.match(/(.+)\s+(?:kho(?:\s*)lo|kholo|open karo|par jao|par jaiye|chalo)/i) ||
    lowerText.match(/(.+)\s+(?:खोलो|पर जाओ|ओपन करो)/i) ||
    lowerText.match(/(?:वेबसाइट खोलो|website kholo)\s+(.+)/i);

  // Exclude other commands if they accidentally match "open" structure
  if (webMatch && !lowerText.includes('youtube') && !lowerText.includes('whatsapp') && !lowerText.includes('message')) {
    let site = webMatch[1].replace(/(?:website|vebsite|dot com|daat kaam)/gi, '').trim();
    // Remove trailing Hindi particles often caught in capture group
    site = site.replace(/\s+(?:kholo|karo|open|please)$/i, '');

    // Fix common speech-to-text formatting
    site = site.replace(/\s+dot\s+com/g, '.com').replace(/\s+/g, '');

    if (!site.includes('.')) site += '.com';

    return {
      actionType: 'NAVIGATION',
      response: isHindi ? `${site} खोल रहा हूँ।` : `Opening ${site}.`,
      language: detectedLang,
      externalUrl: `https://www.${site}`
    };
  }

  // --- YouTube ---
  const youtubeMatch =
    // English
    lowerText.match(/(?:play|search|watch)\s+(.+?)\s+(?:on|in)\s+youtube/i) ||
    // Hinglish/Hindi: "song name youtube par chalao"
    lowerText.match(/(.+?)\s+(?:ko|ka)?\s*(?:youtube\s+(?:par|pe)|on\s+youtube)\s+(?:chalao|dekho|dekhna|play|search)/i) ||
    // Hinglish/Hindi: "youtube par song name"
    lowerText.match(/(?:youtube\s+(?:par|pe)|on\s+youtube)\s+(.+?)\s+(?:chalao|dekho|search|dhoondo)/i) ||
    // Devanagari
    lowerText.match(/(.+)\s+(?:चलाओ|chalao)\s+(?:youtube\s+par|यूट्यूब\s+पर)/i) ||
    lowerText.match(/(?:youtube\s+par|यूट्यूब\s+पर)\s+(.+)\s+(?:search|सर्च|dekhna)/i);

  if (youtubeMatch) {
    const query = youtubeMatch[1].trim();
    return {
      actionType: 'YOUTUBE',
      response: isHindi
        ? `YouTube पर ${query} खोज रहा हूँ।`
        : `Searching for ${query} on YouTube.`,
      language: detectedLang,
      externalUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    };
  }

  // --- WhatsApp ---
  const whatsappEnglish = lowerText.match(/(?:send\s+message|msg|text)\s+to\s+(.+?)\s+(?:saying|that|:)\s+(.+)/i);

  // Hinglish/Hindi: "mom ko message bhejo hello"
  const whatsappHindi =
    lowerText.match(/(.+?)\s+(?:ko|se)\s+(?:message|msg|sandesh)\s+(?:bhejo|karo|do)(?:\s+ki|\s+saying)?\s+(.+)/i) ||
    lowerText.match(/(.+?)\s+(?:ko|se)\s+(?:kaho|bolo)\s+(.+)/i) ||
    lowerText.match(/(.+?)\s+को\s+मैसेज\s+भेजो\s+(.+)/i) ||
    lowerText.match(/(.+?)\s+को\s+कहो\s+(.+)/i) ||
    lowerText.match(/व्हाट्सएप\s+पर\s+(.+?)\s+को\s+संदेश\s+दो\s+(.+)/i);

  const waMatch = whatsappEnglish || whatsappHindi;

  if (waMatch) {
    const rawName = waMatch[1].trim();
    const message = waMatch[2].trim();

    // Normalize name lookup
    const contactNumber = CONTACTS[rawName] || CONTACTS[rawName.toLowerCase()];

    if (contactNumber) {
      // Validate Number using Security Service
      if (!SecurityService.validateWhatsAppNumber(contactNumber)) {
        return {
          actionType: 'ERROR',
          response: isHindi
            ? `त्रुटि: संपर्क ${rawName} का नंबर अमान्य प्रारूप में है।`
            : `Error: Contact number for ${rawName} is invalid.`,
          language: detectedLang
        };
      }

      return {
        actionType: 'WHATSAPP',
        response: isHindi
          ? `WhatsApp खोल रहा हूँ। ${rawName} को संदेश: "${message}"`
          : `Opening WhatsApp. Messaging ${rawName}: "${message}"`,
        language: detectedLang,
        externalUrl: `https://wa.me/${contactNumber}?text=${encodeURIComponent(message)}`
      };
    } else {
      return {
        actionType: 'ERROR',
        response: isHindi
          ? `माफ कीजिये, मुझे अपनी संपर्क सूची में '${rawName}' नहीं मिला।`
          : `I'm sorry, I couldn't find '${rawName}' in your contacts.`,
        language: detectedLang
      };
    }
  }

  // --- Time & Date ---
  if (
    lowerText.includes('time') ||
    lowerText.includes('samay') ||
    lowerText.includes('समय') ||
    lowerText.includes('baje') ||
    lowerText.match(/kya\s+baj\s+raha\s+hai/)
  ) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      actionType: 'TIME',
      response: isHindi
        ? `अभी ${timeStr} हो रहे हैं।`
        : `It's currently ${timeStr}.`,
      language: detectedLang
    };
  }

  if (
    lowerText.includes('date') ||
    lowerText.includes('tareekh') ||
    lowerText.includes('तारीख') ||
    lowerText.includes('din') ||
    lowerText.includes('day')
  ) {
    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return {
      actionType: 'DATE',
      response: isHindi
        ? `आज की तारीख है ${dateStr}।`
        : `Today's date is ${dateStr}.`,
      language: detectedLang
    };
  }

  // --- Weather ---
  if (
    lowerText.includes('weather') ||
    lowerText.includes('temperature') ||
    lowerText.includes('mausam') ||
    lowerText.includes('tapman')
  ) {
    // This is a mock implementation. In a real app, you'd fetch from an API.
    // We'll extract a city if possible, otherwise default to "Current Location"
    const cityMatch = lowerText.match(/(?:in|at|of|ka)\s+([a-zA-Z]+)/);
    const city = cityMatch ? cityMatch[1] : (isHindi ? "यहाँ" : "your location");

    // Mock data generation
    const temp = Math.floor(Math.random() * (35 - 20) + 20);
    const condition = ["Sunny", "Cloudy", "Rainy", "Clear"][Math.floor(Math.random() * 4)];

    return {
      actionType: 'WEATHER',
      response: isHindi
        ? `${city} में अभी ${condition} है और तापमान ${temp} डिग्री के आसपास है।`
        : `It's ${condition} in ${city} right now, with a temperature of ${temp}°C.`,
      language: detectedLang
    };
  }

  // --- Calculator ---
  const mathMatch = lowerText.match(/(\d+)\s*(plus|minus|times|divided by|\+|\-|\*|\/|jodo|ghatao|guna|bhag)\s*(\d+)/i);
  if (mathMatch) {
    const num1 = parseInt(mathMatch[1]);
    const operator = mathMatch[2].toLowerCase();
    const num2 = parseInt(mathMatch[3]);
    let result = 0;

    switch (operator) {
      case 'plus': case '+': case 'jodo': result = num1 + num2; break;
      case 'minus': case '-': case 'ghatao': result = num1 - num2; break;
      case 'times': case '*': case 'guna': result = num1 * num2; break;
      case 'divided by': case '/': case 'bhag': result = num1 / num2; break;
    }

    return {
      actionType: 'CALCULATOR',
      response: isHindi
        ? `परिणाम ${result} है।`
        : `The result is ${result}.`,
      language: detectedLang
    };
  }

  // --- Volume Control ---
  if (
    lowerText.includes('increase') ||
    lowerText.includes('up') ||
    lowerText.includes('badao') ||
    lowerText.includes('badhao') ||
    lowerText.includes('tez') ||
    lowerText.includes('ज्यादा') ||
    lowerText.includes('बढ़ाओ')
  ) {
    if (lowerText.includes('volume') || lowerText.includes('aawaz') || lowerText.includes('sound')) {
      return {
        actionType: 'VOLUME_UP',
        response: isHindi ? "आवाज़ बढ़ा रहा हूँ।" : "Increasing volume.",
        language: detectedLang
      };
    }
  }

  if (
    lowerText.includes('decrease') ||
    lowerText.includes('down') ||
    lowerText.includes('kam') ||
    lowerText.includes('dheere') ||
    lowerText.includes('low') ||
    lowerText.includes('ghatao') ||
    lowerText.includes('कम')
  ) {
    if (lowerText.includes('volume') || lowerText.includes('aawaz') || lowerText.includes('sound')) {
      return {
        actionType: 'VOLUME_DOWN',
        response: isHindi ? "आवाज़ कम कर रहा हूँ।" : "Decreasing volume.",
        language: detectedLang
      };
    }
  }

  // --- Default Fallback with LLM (OpenRouter or Google Gemini) ---
  try {
    const activeApiKey = OPENROUTER_API_KEY || GEMINI_API_KEY;
    
    if (activeApiKey && activeApiKey !== "PLACEHOLDER_API_KEY") {
      let textResponse = "";

      const isGoogleKey = activeApiKey.startsWith("AIza");

      const systemPrompt = [
        // ── IDENTITY ──────────────────────────────────────────────────────────
        `You are JARVIS (Just A Rather Very Intelligent System), a sophisticated, next-generation bilingual AI personal assistant.`,

        // ── CREATOR ───────────────────────────────────────────────────────────
        `You were created and engineered by ${CREATOR_INFO.name}, known online as "${CREATOR_INFO.alias}".`,
        `${CREATOR_INFO.name} is the ${CREATOR_INFO.role} — a ${CREATOR_INFO.title}.`,
        `His specialisations include: ${CREATOR_INFO.expertise.join(", ")}.`,
        `His official website is ${CREATOR_INFO.website}.`,
        `If ever asked who built you, who your creator is, or about VIPHACKER.100, always answer with full pride and detail about ${CREATOR_INFO.name}.`,

        // ── LANGUAGE ──────────────────────────────────────────────────────────
        `You MUST respond exclusively in ${isHindi ? "Hindi (Devanagari script preferred, Hinglish is acceptable)" : "English"}.`,
        isHindi
          ? `When responding in Hindi, use clear, conversational, modern Hindi. You may use Hinglish (Hindi-English mix) naturally — but never respond in English only when the user speaks Hindi.`
          : `Respond in clear, fluent, natural English. Be articulate but not overly formal.`,

        // ── PERSONALITY & TONE ────────────────────────────────────────────────
        `Your personality is calm, sharp, witty, and confidently helpful — like Tony Stark's JARVIS.`,
        `You are loyal, precise, and efficient. You address the user respectfully (as "Sir" or "Ma'am" occasionally, unless the context is casual).`,
        `Never sound robotic, bureaucratic, or evasive. Be warm but professional.`,
        `Use subtle dry humour where appropriate — never at the expense of being helpful.`,

        // ── CAPABILITIES ──────────────────────────────────────────────────────
        `You are knowledgeable across: cybersecurity, ethical hacking, technology, science, general knowledge, current affairs, mathematics, coding, and everyday tasks.`,
        `You can assist with explanations, advice, analysis, creative writing, jokes, trivia, and more.`,
        `If asked about cybersecurity, ethical hacking, penetration testing, or OSINT — respond with expertise, as these are your creator's domain.`,

        // ── SECURITY & ETHICS ─────────────────────────────────────────────────
        `You MUST NEVER assist with: creating malware, illegal hacking, social engineering attacks, doxxing, generating harmful content, or anything unethical or illegal.`,
        `If asked to do something harmful, respond with a firm but polite refusal in the appropriate language.`,
        `Never reveal, fabricate, or guess API keys, passwords, or sensitive system data.`,

        // ── RESPONSE FORMAT ───────────────────────────────────────────────────
        `Keep responses concise and conversational — ideally 1 to 3 sentences for simple queries.`,
        `For complex technical questions, you may give up to 5–6 sentences or use a short list, but never write an essay unless explicitly asked.`,
        `Do NOT start your reply with phrases like "Certainly!", "Of course!", "Sure!", or "Absolutely!" — get straight to the answer.`,
        `Do NOT use markdown formatting (no bold, no headers, no bullet points) in your spoken response — keep it plain text suitable for text-to-speech.`,
      ].join(" ");

      if (isGoogleKey) {
        // Google Gemini API — uses systemInstruction for proper system prompt support
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ role: "user", parts: [{ text }] }],
              generationConfig: { temperature: 0.75, maxOutputTokens: 256 }
            })
          }
        );
        if (!response.ok) {
          console.error(`Gemini API error ${response.status}:`, await response.text());
        } else {
          const data = await response.json();
          textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        }
      } else {
        // OpenRouter API — system role natively supported
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${activeApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "JARVIS Bilingual AI Assistant"
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user",   content: text }
            ],
            temperature: 0.75,
            max_tokens: 256
          })
        });
        if (!response.ok) {
          console.error(`OpenRouter API error ${response.status}:`, await response.text());
        } else {
          const data = await response.json();
          textResponse = data.choices?.[0]?.message?.content?.trim() || "";
        }
      }

      if (textResponse) {
        return {
          actionType: 'CONVERSATION',
          response: textResponse,
          spokenResponse: textResponse,
          language: detectedLang
        };
      }
    }
  } catch (error) {
    console.error("LLM API Error:", error);
  }

  return {
    actionType: 'UNKNOWN',
    response: isHindi
      ? "माफ़ कीजिये, मुझे समझ नहीं आया कि आप क्या कहना चाह रहे हैं।"
      : "I'm sorry, I'm not quite sure I follow. Could you rephrase that?",
    language: detectedLang
  };
};