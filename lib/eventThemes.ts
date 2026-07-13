export interface EventTheme {
  id: string
  label: string
  description: string
  regionFocus: string
  avoidRegions: string
}

export const EVENT_THEMES: EventTheme[] = [
  {
    id: 'world_wonders',
    label: 'World Wonders',
    description: 'Famous landmarks and wonders that every explorer should know',
    regionFocus: 'Iconic world landmarks: Eiffel Tower, Great Wall, Taj Mahal, Pyramids, Colosseum, Machu Picchu, Sydney Opera House, Statue of Liberty, Big Ben, Mount Fuji, Niagara Falls, Amazon Rainforest — spread across all continents',
    avoidRegions: 'Avoid very obscure or hard-to-find locations — every place should be famous and exciting for young learners',
  },
  {
    id: 'animal_habitats',
    label: 'Animal Habitats',
    description: 'Places famous for incredible wildlife and nature',
    regionFocus: 'Locations known for amazing wildlife: Serengeti (Africa), Amazon Rainforest (South America), Great Barrier Reef (Australia), Galápagos Islands (Ecuador), Yellowstone (USA), Borneo rainforests (Malaysia/Indonesia), Arctic (polar bears), Antarctic (penguins), Sundarbans (tigers), Madagascar (lemurs)',
    avoidRegions: 'Avoid locations with no famous wildlife connection',
  },
  {
    id: 'capital_cities',
    label: 'Capital Cities',
    description: 'Learn capital cities from every continent',
    regionFocus: 'Capital cities from all continents: Paris, London, Rome, Tokyo, Beijing, New Delhi, Canberra, Nairobi, Cairo, Brasília, Ottawa, Mexico City, Moscow, Ankara, Bangkok, Jakarta, Seoul, Buenos Aires, Pretoria, Abuja — spread across all regions',
    avoidRegions: 'Use actual capital cities only — one capital per country',
  },
  {
    id: 'rivers_mountains',
    label: 'Rivers & Mountains',
    description: 'The world\'s great rivers, mountains and geographic features',
    regionFocus: 'Famous geographic features: Nile, Amazon, Yangtze rivers; Everest, K2, Kilimanjaro, Andes, Rockies mountains; Grand Canyon, Victoria Falls, Angel Falls, Great Rift Valley, Mississippi River, Rhine, Ganges',
    avoidRegions: 'Focus on natural geographic features — not cities',
  },
  {
    id: 'ancient_history',
    label: 'Ancient History',
    description: 'Amazing ancient civilisations and archaeological sites kids love',
    regionFocus: 'Kid-friendly ancient history: Egyptian Pyramids, Roman Colosseum, Greek Parthenon, Machu Picchu (Inca), Chichen Itza (Maya), Angkor Wat (Khmer), Great Wall of China, Stonehenge, Pompeii, Valley of the Kings, Petra, Troy — famous sites taught in schools',
    avoidRegions: 'Use only well-known ancient sites that appear in school curricula',
  },
  {
    id: 'islands_oceans',
    label: 'Islands & Oceans',
    description: 'Amazing islands and ocean places around the world',
    regionFocus: 'Famous islands and ocean locations: Hawaii, Galápagos, Iceland, Madagascar, Sri Lanka, New Zealand, Maldives, Fiji, Bali, Japan, Philippines, Cuba, Sardinia, Great Barrier Reef, Caribbean islands — use islands kids might have heard of',
    avoidRegions: 'Avoid very tiny unknown islands — use well-known islands with clear identities',
  },
  {
    id: 'sports_events',
    label: 'Sports & Olympics',
    description: 'Famous sports venues and Olympic host cities',
    regionFocus: 'Olympic host cities and famous sports venues: Athens (ancient & modern Olympics), Paris, London, Tokyo, Sydney, Beijing, Rio de Janeiro, Barcelona; Wembley (UK), Wimbledon, Monaco (Formula 1), Le Mans, Augusta National, Yankee Stadium, Maracanã',
    avoidRegions: 'Stick to well-known venues that hosted major international events',
  },
  {
    id: 'national_parks',
    label: 'National Parks',
    description: 'Stunning national parks and protected wild places',
    regionFocus: 'Famous national parks worldwide — spread across ALL continents. Africa: Masai Mara (Kenya), Amboseli (Kenya), Bwindi Impenetrable (Uganda), Volcanoes NP (Rwanda), Etosha (Namibia), Okavango Delta (Botswana), Simien Mountains (Ethiopia), Gorongosa (Mozambique). Americas: Iguaçu NP (Brazil), Amazon NP (Brazil), Los Glaciares/Patagonia (Argentina), Galápagos Islands (Ecuador), Manu NP (Peru), Corcovado (Costa Rica). Europe: Lake District (UK), Białowieża (Poland), Swiss National Park (Switzerland), Black Forest (Germany), Camargue (France), Pindus/Vikos (Greece), Rila (Bulgaria), Jotunheimen (Norway), Vatnajökull (Iceland). Asia: Jiuzhaigou (China), Zhangjiajie (China), Sagarmatha/Everest (Nepal), Chitwan (Nepal), Khao Yai (Thailand), Komodo (Indonesia), Taman Negara (Malaysia), Sundarbans (Bangladesh). Check the BANNED COUNTRIES list and never pick from those countries.',
    avoidRegions: 'Stick to internationally recognised parks that appear in geography textbooks — avoid tiny unknown reserves',
  },
  {
    id: 'food_culture',
    label: 'Food & Culture',
    description: 'Cities and places famous for food, festivals and culture',
    regionFocus: 'Places famous for food and culture: Paris (croissants, Louvre), Tokyo (sushi, anime), New York (pizza, Broadway), Mexico City (tacos, Day of Dead), New Orleans (jazz, Mardi Gras), Venice (gondolas, carnival), Mumbai (Bollywood, spices), Rio (carnival, samba), Barcelona (Gaudí, tapas)',
    avoidRegions: 'Focus on places with exciting cultural identities that kids find fascinating',
  },
  {
    id: 'global_explorer',
    label: 'Global Explorer',
    description: 'A world tour hitting the most exciting places on every continent',
    regionFocus: 'One exciting, well-known landmark or place from each region: 4 from Europe, 4 from Asia, 3 from Americas, 3 from Africa, 3 from Oceania, 3 from Middle East — mix cities, nature, and historic sites kids will recognise',
    avoidRegions: 'Every location must be recognisable and appear in school geography textbooks',
  },
]

// 8 kid-friendly narrative styles — rotate by (roundNumber - 1) % 8
export const NARRATIVE_STYLES = [
  'Young explorer\'s adventure journal — excited, enthusiastic, like a kid sharing their most exciting discovery',
  'Friendly talking animal narrator — a curious parrot or wise owl describing their home country with fun facts',
  'Time capsule letter — written by a child from that country to their pen pal overseas, sharing what makes their home special',
  'Children\'s travel documentary — enthusiastic, wonder-filled, like a fun TV show for kids',
  'Geography teacher\'s exciting lesson — enthusiastic, packed with cool facts, making learning irresistible',
  'Postcard from a young adventurer — warm, personal, brimming with excitement about what they saw',
  'Storybook narrator — warm, imaginative, painting a vivid picture that invites young readers to visit',
  'World record announcer — enthusiastic superlatives about what makes this place the biggest, smallest, oldest, or most amazing',
]
