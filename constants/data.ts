// constants/data.ts

export const SCORE_KEYS = ["chemistry","attraction","communication","emotionalSafety","consistency","score6","score7"];

export const SCORE_EMOJIS_GIRL: Record<string,string> = {
  chemistry:"⚡",attraction:"🔥",communication:"💬",
  emotionalSafety:"🫶",consistency:"📅",score6:"🔭",score7:"🏋️"
};
export const SCORE_EMOJIS_GUY: Record<string,string> = {
  chemistry:"⚡",attraction:"🔥",communication:"💬",
  emotionalSafety:"🫶",consistency:"📅",score6:"🦋",score7:"💼"
};

export const SCORE_LABELS_GIRL: Record<string,string> = {
  chemistry:"Chemistry",attraction:"Attraction",communication:"Communication",
  emotionalSafety:"Emotional Safety",consistency:"Consistency",
  score6:"Future Potential",score7:"Effort"
};
export const SCORE_LABELS_GUY: Record<string,string> = {
  chemistry:"Chemistry",attraction:"Attraction",communication:"Communication",
  emotionalSafety:"Emotional Safety",consistency:"Consistency",
  score6:"Independence",score7:"Ambition"
};

export const DEFAULT_REQUIREMENTS_GIRL = [
  {id:"affectionate",label:"Affectionate 🥰"},
  {id:"respectful",label:"Respectful 🙏"},
  {id:"hardworking",label:"Hardworking 💼"},
  {id:"funny",label:"Funny 😂"},
  {id:"gentleman",label:"Gentleman 🎩"},
  {id:"initiative",label:"Takes Initiative 🎯"},
  {id:"fit",label:"Fit 💪"},
  {id:"hygiene",label:"Good Hygiene 🧴"},
  {id:"emotionallyMature",label:"Emotionally Mature 🧠"},
  {id:"boundaries",label:"Knows Boundaries 🚧"},
  {id:"massages",label:"Gives Massages 💆"},
  {id:"cooks",label:"Can Cook 👨‍🍳"},
  {id:"traveler",label:"Likes Traveling ✈️"},
];

export const DEFAULT_REQUIREMENTS_GUY = [
  {id:"ambitious",label:"Ambitious 💼"},
  {id:"independent",label:"Independent 🦋"},
  {id:"emotionallyAvail",label:"Emotionally Available 🫶"},
  {id:"funny",label:"Funny 😂"},
  {id:"confident",label:"Confident 😎"},
  {id:"initiative",label:"Takes Initiative 🎯"},
  {id:"fit",label:"Fit 💪"},
  {id:"hygiene",label:"Good Hygiene 🧴"},
  {id:"emotionallyMature",label:"Emotionally Mature 🧠"},
  {id:"boundaries",label:"Knows Boundaries 🚧"},
  {id:"affectionate",label:"Affectionate 🥰"},
  {id:"cooks",label:"Can Cook 👨‍🍳"},
  {id:"traveler",label:"Likes Traveling ✈️"},
];

export const DEFAULT_NON_NEGS = [
  {id:"liar",label:"Liar 🤥",trigger:"Lies to you"},
  {id:"disrespectful",label:"Disrespectful 😤",trigger:"Disrespects you"},
  {id:"notHardworking",label:"Not Hardworking 🛋️",trigger:"Lazy / no ambition"},
  {id:"poorComm",label:"Poor Communicator 📵",trigger:"Ghosts / stonewalls"},
  {id:"taken",label:"Married / Taken 💍",trigger:"Already committed"},
];

export const FLAGS_GIRL = [
  "✅ Opened doors","✅ Remembered details","✅ Met your friends",
  "✅ Called (not just texted)","✅ Planned a real date",
  "✅ Consistent texting","✅ Emotionally available",
  "🚩 Canceled last minute","🚩 Love bombing","🚩 Inconsistent",
  "🚩 Talks about ex","🚩 Avoids labels",
  "🚩 Only texts late night","🚩 You always initiate",
];

export const FLAGS_GUY = [
  "✅ Made you feel safe","✅ Remembered details","✅ Met your friends",
  "✅ Called first","✅ Planned a real date",
  "✅ Texted consistently","✅ Respected your space",
  "🚩 Clingy / no life outside you","🚩 Love bombing","🚩 Inconsistent",
  "🚩 Talks about ex","🚩 Avoids commitment",
  "🚩 Only texts late night","🚩 Doesn't respect boundaries",
];

export const PHRASES = [
  "Know your worth. Measure everyone else.",
  "Standards: documented.",
  "Your peace is a non-negotiable.",
  "Protect your energy. Track the rest.",
  "Chemistry is vibes. Compatibility is math.",
  "Because you deserve data, not delusion.",
  "Your heart deserves a due diligence process.",
  "Soft life starts with high standards.",
  "You're not being picky. You're being precise.",
  "The audacity of some people. Documented.",
  "Main character energy. Spreadsheet included.",
  "They have to earn their spot.",
  "Unbothered. Moisturized. Tracking applicants.",
  "Your time is the luxury. Spend it wisely.",
  "You're everything. The bar was just underground.",
];

export const scoreColor = (v: number): string => {
  if (v === 0) return "#4a3f62";
  if (v >= 8) return "#4ade80";
  if (v >= 6) return "#60a5fa";
  if (v >= 4) return "#fbbf24";
  return "#f87171";
};

export const uid = () => Math.random().toString(36).slice(2, 8);

export const emptyCandidate = () => ({
  id: Date.now().toString(),
  name: "",
  scores: Object.fromEntries(SCORE_KEYS.map(k => [k, 0])),
  requirements: {} as Record<string,boolean>,
  nonNegotiables: {} as Record<string,boolean>,
  flags: [] as string[],
  notes: "",
  moodAfter: 3,
  dates: 0,
  addedDate: new Date().toLocaleDateString(),
});
