export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export const SignLords = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter"
};

export const DashaOrder = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];

export const DashaYears = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17
};

export const YOGAS = [
  "Vishkumbha", "Preeti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
];

export const KARANAS = [
  "Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti",
  "Shakuni", "Chatushpada", "Naga", "Kimstughna"
];

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

export const VARNA_MAP = {
  Cancer: "Brahmin", Scorpio: "Brahmin", Pisces: "Brahmin",
  Aries: "Kshatriya", Leo: "Kshatriya", Sagittarius: "Kshatriya",
  Taurus: "Vaishya", Virgo: "Vaishya", Capricorn: "Vaishya",
  Gemini: "Shudra", Libra: "Shudra", Aquarius: "Shudra"
};

export const VASHYA_MAP = {
  Aries: "Chatushpad", Taurus: "Chatushpad", Sagittarius: "Chatushpad", // partial for Sag
  Leo: "Vanchar",
  Cancer: "Jalchar", Pisces: "Jalchar", Capricorn: "Jalchar", // partial for Makara
  Gemini: "Nara", Virgo: "Nara", Libra: "Nara", Aquarius: "Nara",
  Scorpio: "Keeta"
};

export const GANA_MAP = {
  Ashwini: "Deva", Bharani: "Manushya", Krittika: "Rakshasa", Rohini: "Manushya", Mrigashira: "Deva",
  Ardra: "Manushya", Punarvasu: "Deva", Pushya: "Deva", Ashlesha: "Rakshasa", Magha: "Rakshasa",
  "Purva Phalguni": "Manushya", "Uttara Phalguni": "Manushya", Hasta: "Deva", Chitra: "Rakshasa", Swati: "Deva",
  Vishakha: "Rakshasa", Anuradha: "Deva", Jyeshtha: "Rakshasa", Mula: "Rakshasa", "Purva Ashadha": "Manushya",
  "Uttara Ashadha": "Manushya", Shravana: "Deva", Dhanishta: "Rakshasa", Shatabhisha: "Rakshasa",
  "Purva Bhadrapada": "Manushya", "Uttara Bhadrapada": "Manushya", Revati: "Deva"
};

export const NADI_MAP = {
  Ashwini: "Aadi", Bharani: "Madhya", Krittika: "Antya", Rohini: "Antya", Mrigashira: "Madhya",
  Ardra: "Aadi", Punarvasu: "Aadi", Pushya: "Madhya", Ashlesha: "Antya", Magha: "Antya",
  "Purva Phalguni": "Madhya", "Uttara Phalguni": "Aadi", Hasta: "Aadi", Chitra: "Madhya", Swati: "Madhya",
  Vishakha: "Antya", Anuradha: "Antya", Jyeshtha: "Madhya", Mula: "Aadi", "Purva Ashadha": "Aadi",
  "Uttara Ashadha": "Madhya", Shravana: "Antya", Dhanishta: "Antya", Shatabhisha: "Madhya",
  "Purva Bhadrapada": "Aadi", "Uttara Bhadrapada": "Aadi", Revati: "Madhya"
};

export const YONI_MAP = {
  Ashwini: "Horse", Bharani: "Elephant", Krittika: "Sheep", Rohini: "Serpent", Mrigashira: "Serpent",
  Ardra: "Dog", Punarvasu: "Cat", Pushya: "Goat", Ashlesha: "Cat", Magha: "Rat",
  "Purva Phalguni": "Rat", "Uttara Phalguni": "Cow", Hasta: "Buffalo", Chitra: "Tiger", Swati: "Buffalo",
  Vishakha: "Tiger", Anuradha: "Deer", Jyeshtha: "Deer", Mula: "Dog", "Purva Ashadha": "Monkey",
  "Uttara Ashadha": "Mongoose", Shravana: "Monkey", Dhanishta: "Lion", Shatabhisha: "Horse",
  "Purva Bhadrapada": "Lion", "Uttara Bhadrapada": "Cow", Revati: "Elephant"
};

export const TATVA_MAP = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water"
};

export const PAYA_MAP = {
  Aries: "Gold", Leo: "Gold", Sagittarius: "Gold",
  Taurus: "Copper", Virgo: "Copper", Capricorn: "Copper",
  Gemini: "Iron", Libra: "Iron", Aquarius: "Iron",
  Cancer: "Silver", Scorpio: "Silver", Pisces: "Silver"
};

export const NAME_ALPHABET_TABLE = {
  Ashwini:             ["Chu", "Che", "Cho", "La"],
  Bharani:             ["Li",  "Lu",  "Le",  "Lo"],
  Krittika:            ["A",   "I",   "U",   "E"],
  Rohini:              ["O",   "Va",  "Vi",  "Vu"],
  Mrigashira:          ["Ve",  "Vo",  "Ka",  "Ki"],
  Ardra:               ["Ku",  "Gha", "Ang", "Chha"],
  Punarvasu:           ["Ke",  "Ko",  "Ha",  "Hi"],
  Pushya:              ["Hu",  "He",  "Ho",  "Da"],
  Ashlesha:            ["Di",  "Du",  "De",  "Do"],
  Magha:               ["Ma",  "Mi",  "Mu",  "Me"],
  "Purva Phalguni":    ["Mo",  "Ta",  "Ti",  "Tu"],
  "Uttara Phalguni":   ["Te",  "To",  "Pa",  "Pi"],
  Hasta:               ["Pu",  "Sha", "Na",  "Tha"],
  Chitra:              ["Pe",  "Po",  "Ra",  "Ri"],
  Swati:               ["Ru",  "Re",  "Ro",  "Ta"],
  Vishakha:            ["Ti",  "Tu",  "Te",  "To"],
  Anuradha:            ["Na",  "Ni",  "Nu",  "Ne"],
  Jyeshtha:            ["No",  "Ya",  "Yi",  "Yu"],
  Mula:                ["Ye",  "Yo",  "Bha", "Bhi"],
  "Purva Ashadha":     ["Bhu", "Dha", "Pha", "Dha"],
  "Uttara Ashadha":    ["Bhe", "Bho", "Ja",  "Ji"],
  Shravana:            ["Khi", "Khu", "Khe", "Kho"],
  Dhanishta:           ["Ga",  "Gi",  "Gu",  "Ge"],
  Shatabhisha:         ["Go",  "Sa",  "Si",  "Su"],
  "Purva Bhadrapada":  ["Se",  "So",  "Da",  "Di"],
  "Uttara Bhadrapada": ["Du",  "Tha", "Jha", "Da"],
  Revati:              ["De",  "Do",  "Cha", "Chi"]
};

export function yunjaFromNakshatraIndex(nakshatraIdx) {
  if (nakshatraIdx <= 8) return "Poorva";
  if (nakshatraIdx <= 17) return "Madhya";
  return "Parbhaga";
}

export const GHAT_CHAKRA_MAP = {
  Aries: { month: "Kartik", tithi: "1, 6, 11", day: "Sunday", nakshatra: "Magha", yog: "Vishkumbha", karan: "Bava", prahar: 1, moon: 1 },
  Taurus: { month: "Agrahayan", tithi: "5, 10, 15", day: "Saturday", nakshatra: "Rohini", yog: "Sukarma", karan: "Shakuni", prahar: 2, moon: 5 },
  Gemini: { month: "Paush", tithi: "2, 7, 12", day: "Monday", nakshatra: "Swati", yog: "Parigha", karan: "Kaulava", prahar: 3, moon: 9 },
  Cancer: { month: "Magh", tithi: "2, 7, 12", day: "Wednesday", nakshatra: "Anuradha", yog: "Atiganda", karan: "Naga", prahar: 4, moon: 2 },
  Leo: { month: "Phalgun", tithi: "3, 8, 13", day: "Saturday", nakshatra: "Bharani", yog: "Shoola", karan: "Vishti", prahar: 1, moon: 6 },
  Virgo: { month: "Bhadrapada", tithi: "5, 10, 15", day: "Saturday", nakshatra: "Shravana", yog: "Vajra", karan: "Shakuni", prahar: 2, moon: 10 },
  Libra: { month: "Ashwin", tithi: "4, 9, 14", day: "Thursday", nakshatra: "Chitra", yog: "Vyatipata", karan: "Bava", prahar: 3, moon: 3 },
  Scorpio: { month: "Kartik", tithi: "1, 6, 11", day: "Friday", nakshatra: "Revati", yog: "Vajra", karan: "Taitila", prahar: 4, moon: 7 },
  Sagittarius: { month: "Paush", tithi: "3, 8, 13", day: "Friday", nakshatra: "Uttara Phalguni", yog: "Dhriti", karan: "Vanija", prahar: 1, moon: 11 },
  Capricorn: { month: "Magh", tithi: "4, 9, 14", day: "Tuesday", nakshatra: "Rohini", yog: "Vyatipata", karan: "Shakuni", prahar: 2, moon: 1 },
  Aquarius: { month: "Chaitra", tithi: "3, 8, 13", day: "Thursday", nakshatra: "Ardra", yog: "Vajra", karan: "Kimstughna", prahar: 3, moon: 5 },
  Pisces: { month: "Paush", tithi: "2, 7, 12", day: "Friday", nakshatra: "Ashlesha", yog: "Ganda", karan: "Kaulava", prahar: 4, moon: 9 }
};
