/**
 * PreOne — Time Theme Helpers
 * Generates time-aware greetings, emojis, and day adjectives
 * for the Living Universe design system.
 */

/**
 * getGreeting — Returns a time-of-day greeting string
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good Night';
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

/**
 * getTimeEmoji — Returns an emoji matching the current time of day
 */
export function getTimeEmoji(): string {
  const hour = new Date().getHours();
  if (hour < 5) return '🌙';
  if (hour < 8) return '🌅';
  if (hour < 12) return '☀️';
  if (hour < 17) return '🌤️';
  if (hour < 21) return '🌆';
  return '🌙';
}

/**
 * getDayAdjective — Returns an emotional adjective based on the day's data
 * @param options - Optional context about the child's day
 */
export function getDayAdjective(options?: {
  hasUpdate?: boolean;
  moodMorning?: string | null;
  moodAfternoon?: string | null;
  highlights?: string | null;
  attendancePresent?: boolean;
}): string {
  // If no update yet, it's a quiet day
  if (!options?.hasUpdate) return 'quiet';

  const mood = (options.moodMorning || options.moodAfternoon || '').toLowerCase();
  const highlights = (options.highlights || '').toLowerCase();

  // Check for very positive signals
  const isVeryHappy =
    mood.includes('excited') || mood.includes('great') ||
    highlights.includes('amazing') || highlights.includes('fantastic') ||
    highlights.includes('won') || highlights.includes('achieved');
  if (isVeryHappy) return 'amazing';

  // Check for positive signals
  const isHappy =
    mood.includes('happy') || mood.includes('good') || mood.includes('great') ||
    highlights.includes('creative') || highlights.includes('art') ||
    highlights.includes('played') || highlights.includes('fun') ||
    highlights.includes('enjoy') || highlights.includes('love');
  if (isHappy) return 'wonderful';

  // Check for calm/peaceful signals
  const isCalm =
    mood.includes('calm') || mood.includes('peaceful') || mood.includes('relaxed');
  if (isCalm) return 'peaceful';

  // Check for tired/sleepy signals
  const isTired =
    mood.includes('tired') || mood.includes('sleepy') || mood.includes('low');
  if (isTired) return 'cozy';

  // Check for sad/upset signals
  const isSad =
    mood.includes('sad') || mood.includes('upset') || mood.includes('cry');
  if (isSad) return 'tender';

  // Default for a normal day with updates
  return 'lovely';
}

/**
 * getDayAdjectiveEmoji — Returns an emoji matching the day adjective
 */
export function getDayAdjectiveEmoji(adjective: string): string {
  const map: Record<string, string> = {
    amazing: '🌈',
    wonderful: '✨',
    peaceful: '🍃',
    cozy: '🧸',
    tender: '💛',
    lovely: '🌸',
    quiet: '🌙',
  };
  return map[adjective] || '⭐';
}

/**
 * getDayMessage — Returns a full emotional message for the hero card
 */
export function getDayMessage(childName: string, adjective: string): string {
  const messages: Record<string, string> = {
    amazing: `${childName} had an amazing day! 🌈`,
    wonderful: `${childName} had a wonderful day! ✨`,
    peaceful: `${childName} had a peaceful day! 🍃`,
    cozy: `${childName} had a cozy day! 🧸`,
    tender: `${childName} needs some extra love today 💛`,
    lovely: `${childName} had a lovely day! 🌸`,
    quiet: `It's been a quiet day for ${childName} 🌙`,
  };
  return messages[adjective] || `${childName}'s day at a glance ⭐`;
}

/**
 * getAiInsight — Generates an AI companion message based on day data
 */
export function getAiInsight(options: {
  childName: string;
  moodMorning?: string | null;
  moodAfternoon?: string | null;
  highlights?: string | null;
  breakfast?: string | null;
  lunch?: string | null;
  creativity?: number | null;
  communication?: number | null;
  social?: number | null;
}): string {
  const { childName, moodMorning, moodAfternoon, highlights, breakfast, lunch, creativity } = options;

  // Creative highlights
  if (highlights?.toLowerCase().includes('creative') || highlights?.toLowerCase().includes('art')) {
    return `${childName} was very creative today! 🎨`;
  }

  // Happy mood
  const mood = (moodMorning || moodAfternoon || '').toLowerCase();
  if (mood.includes('happy') || mood.includes('excited')) {
    return `${childName} was full of joy today! 😄`;
  }

  // Good eating
  const bf = (breakfast || '').toLowerCase();
  const ln = (lunch || '').toLowerCase();
  if (bf.includes('full') || bf.includes('eaten') || ln.includes('full') || ln.includes('eaten')) {
    return `${childName} enjoyed lunch today! 🍱`;
  }

  // High creativity score
  if (creativity && creativity >= 80) {
    return `${childName}'s creativity is blossoming! 🌟`;
  }

  // Default insights
  const defaults = [
    `${childName} is growing every day! 🌱`,
    `${childName} had a great time exploring! 🔍`,
    `${childName} made new friends today! 🤝`,
  ];

  // Pick a deterministic one based on the child name
  const idx = childName.length % defaults.length;
  return defaults[idx];
}
