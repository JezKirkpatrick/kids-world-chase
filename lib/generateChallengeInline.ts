import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NARRATIVE_STYLES, EVENT_THEMES } from '@/lib/eventThemes'
import type { EventTheme } from '@/lib/eventThemes'

const STREET_VIEW_ROUNDS = [1, 6, 11, 16]

// Haversine distance in metres — used to check the matched panorama is actually
// close to the requested spot, not just "some outdoor coverage exists somewhere nearby".
function distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Verify Street View coverage via Google's free Metadata API before saving the challenge.
// Returns true if coverage exists close enough to actually represent the intended spot
// (or if the check itself fails — fail open). A location like a pedestrian-only bridge
// can return "OK" from a wide-radius search while the real matched panorama sits on an
// unrelated street blocks away — status OK alone isn't proof the location is right, the
// matched pano's own distance from the requested coordinates is.
async function verifyStreetView(lat: number, lng: number): Promise<boolean> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) return true
  try {
    // Tight radius first — if coverage exists this close, it's genuinely at the spot.
    for (const radius of [50, 150, 500]) {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=${radius}&source=outdoor&key=${key}`,
        { headers: { Referer: 'https://kidsworldchase.net' } }
      )
      const data = await res.json()
      if (data.status === 'OK' && data.location) {
        const matchedDistance = distanceMetres(lat, lng, data.location.lat, data.location.lng)
        // Only accept if the matched panorama is close enough that it will actually
        // show the intended landmark, not just "the nearest drivable street".
        if (matchedDistance <= 75) return true
      }
      if (radius === 500 && data.status === 'ZERO_RESULTS') return false
    }
    return false
  } catch {
    return true // network error — fail open so generation isn't blocked
  }
}

// KWC has no 'pro' difficulty — max is extreme (round 21-25)
export const DIFFICULTY_FOR_ROUND = (round: number): string =>
  round <= 5 ? 'easy' : round <= 10 ? 'medium' : round <= 15 ? 'hard' : 'extreme'

export function inferThemeId(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('wonder')) return 'world_wonders'
  if (n.includes('animal') || n.includes('habitat')) return 'animal_habitats'
  if (n.includes('capital')) return 'capital_cities'
  if (n.includes('river') || n.includes('mountain')) return 'rivers_mountains'
  if (n.includes('ancient') || n.includes('history')) return 'ancient_history'
  if (n.includes('island') || n.includes('ocean')) return 'islands_oceans'
  if (n.includes('sport') || n.includes('olympic')) return 'sports_events'
  if (n.includes('national') || n.includes('park')) return 'national_parks'
  if (n.includes('food') || n.includes('culture')) return 'food_culture'
  return 'global_explorer'
}

const KIDS_DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Explorer',
  medium: 'Adventurer',
  hard: 'Navigator',
  extreme: 'Champion',
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function randomOffset(km: number) {
  const angle = Math.random() * 2 * Math.PI
  const dist = (0.5 + Math.random() * 0.5) * km
  return { dLat: (dist * Math.cos(angle)) / 111.32, dLng: (dist * Math.sin(angle)) / 111.32 }
}

function buildStreetViewPrompt(roundNumber: number, difficulty: string, existingLocations: string[], eventTheme?: EventTheme, currentEventLocations?: string[]): string {
  const pointsMap: Record<string, number> = { easy: 500, medium: 1000, hard: 2500, extreme: 5000 }
  const narrativeStyle = NARRATIVE_STYLES[(roundNumber - 1) % NARRATIVE_STYLES.length]
  const diffLabel = KIDS_DIFFICULTY_LABELS[difficulty] ?? difficulty
  const themeSection = eventTheme
    ? `\nTHEME: "${eventTheme.label}" — ${eventTheme.description}
FOCUS ON: ${eventTheme.regionFocus}
AVOID: ${eventTheme.avoidRegions}\n`
    : ''
  const banSource = currentEventLocations ?? existingLocations
  const usedCountries = [...new Set(banSource.map(loc => (loc.split(',').pop() ?? '').trim()).filter(c => c))]
  const countryBan = usedCountries.length > 0 ? `\nBANNED COUNTRIES (already used this event — pick a different country): ${usedCountries.join(', ')}\n` : ''

  return `You are the friendly game master for "Kids World Chase" — an educational geography game designed for children aged 8–16.
${themeSection}${countryBan}
Generate ONE Street View Observation challenge for Round ${roundNumber} (${diffLabel} level).

CRITICAL — STREET VIEW COVERAGE REQUIREMENT:
The location MUST have official Google Street View car coverage (blue road lines on Google Maps). Players are dropped into live Street View — if coverage doesn't exist the round completely breaks.
SAFE REGIONS with reliable Street View: Western Europe, North America, Japan, South Korea, Australia, New Zealand, major cities in Brazil, South Africa, Southeast Asia.
NEVER pick for EXPLORER/ADVENTURER: Pacific islands (Fiji, Samoa, Cook Islands, Tonga, Vanuatu, Solomon Islands), most rural Africa, Central Asia, or any remote island. These almost never have car Street View.
For NAVIGATOR/CHAMPION levels: still must be on a road with confirmed blue car Street View coverage — not just a photo sphere from a tourist.

Pick a well-known location that appears in children's geography books or school curricula. NOT user-contributed photos — must have navigable road arrows.

LEVEL GUIDE for observation questions:
- EXPLORER (easy): A world-famous street or plaza in a major tourist city (Paris, London, Tokyo, New York, Rome, Sydney, etc.). Count something large and obvious (flags, statues, vehicles). Answer must be a simple number 1–9 or an obvious visible object.
- ADVENTURER (medium): Identify something specific (colour of a building, a symbol, an animal) at a well-known landmark in a well-covered country.
- NAVIGATOR (hard): Spot something that requires careful looking at a recognisable but less-famous location that still has confirmed car Street View.
- CHAMPION (extreme): Find a specific detail at an interesting location — must still have blue car Street View lines, not just photo spheres.

CLUE WRITING RULES:
Players are dropped into Street View with no navigation help. Every clue MUST contain:
1. A DIRECTION — tell them which way to look or walk (e.g. "face the big building ahead", "walk forward to the fountain", "look up to the sky").
2. AN OBSERVATION HINT — what to look for.
Clues go from vague (clue 1) to very clear (clue 4). Clue 4 must make the answer findable without guessing.
Keep language simple, fun, and encouraging — like a helpful friend guiding them.

NARRATIVE STYLE FOR THIS ROUND: ${narrativeStyle}
Write the riddle_text in this style but keep it age-appropriate and exciting for kids. No scary, dark, or violent language.

DO NOT use any of these already-used locations: ${existingLocations.join(', ')}

The fun_fact MUST be an interesting educational fact about this place that kids would love to share with their friends or parents.

Respond with ONLY valid JSON — no markdown:
{
  "round_number": ${roundNumber},
  "difficulty": "${difficulty}",
  "location_name": "official street/place name",
  "location_country": "country",
  "location_lat": 0.0,
  "location_lng": 0.0,
  "map_start_lat": 0.0,
  "map_start_lng": 0.0,
  "street_view_heading": 0,
  "street_view_pitch": 0,
  "street_view_only": true,
  "street_view_question": "The exact observation question players must answer",
  "points_value": ${pointsMap[difficulty] ?? 500},
  "riddle_text": "A one-sentence intro setting the scene in the specified narrative style. Kid-friendly and exciting. Do not give away the answer.",
  "clues": [
    {"order":1,"text":"[Direction: simple] + [Observation: broad hint]"},
    {"order":2,"text":"[Direction: a bit more specific] + [Observation: more helpful hint]"},
    {"order":3,"text":"[Direction: clear, e.g. 'walk forward and look at the big arch'] + [Observation: clear hint]"},
    {"order":4,"text":"[Direction: very clear] + [Observation: nearly gives it away]"}
  ],
  "answer_keywords": ["exact answer", "alternate phrasing"],
  "fun_fact": "One fascinating, age-appropriate educational fact about this location that kids will love to know."
}`
}

function buildPrompt(roundNumber: number, difficulty: string, existingLocations: string[], eventTheme?: EventTheme, currentEventLocations?: string[]): string {
  const pointsMap: Record<string, number> = { easy: 500, medium: 1000, hard: 2500, extreme: 5000 }
  const narrativeStyle = NARRATIVE_STYLES[(roundNumber - 1) % NARRATIVE_STYLES.length]
  const diffLabel = KIDS_DIFFICULTY_LABELS[difficulty] ?? difficulty
  const themeSection = eventTheme
    ? `\nTHEME: "${eventTheme.label}" — ${eventTheme.description}
FOCUS ON: ${eventTheme.regionFocus}
AVOID: ${eventTheme.avoidRegions}\n`
    : ''

  const banSource = currentEventLocations ?? existingLocations
  const usedCountries = [...new Set(banSource
    .map(loc => (loc.split(',').pop() ?? '').trim())
    .filter(c => c))]
  const countryBan = usedCountries.length > 0
    ? `\nBANNED COUNTRIES (already used this event — pick a different country): ${usedCountries.join(', ')}\n`
    : ''

  return `You are the friendly game master for "Kids World Chase" — an educational geography adventure game for children aged 8–16.
${themeSection}${countryBan}
Generate ONE exciting, educational challenge for Round ${roundNumber} (${diffLabel} level).

GEOGRAPHIC DIVERSITY RULE: Pick a location in a DIFFERENT country than any place in the existing list below.

LEVEL GUIDE:
- EXPLORER (easy): The most famous, iconic landmarks in the world — the Eiffel Tower, Great Wall, Taj Mahal, Pyramids, Colosseum, Machu Picchu, Sydney Opera House, Statue of Liberty, Big Ben, Mount Fuji, Niagara Falls, Amazon Rainforest, etc. Every child should know or be able to guess these with a couple of clues.
- ADVENTURER (medium): Well-known but slightly less obvious places — major capital cities, famous natural wonders, important historical sites that appear in school geography.
- NAVIGATOR (hard): Interesting places that require some geography knowledge — major rivers, mountain ranges, famous national parks, remarkable cities kids might not immediately recognise.
- CHAMPION (extreme): Challenging but still educational — places that appear in geography books and are genuinely fascinating, but require real knowledge or good clue-reading to find.

NARRATIVE STYLE FOR THIS ROUND: ${narrativeStyle}
Write the riddle_text in this exact style — make it fun, exciting, and age-appropriate. NEVER use scary, dark, violent, or disturbing language. The tone must always be encouraging and adventurous.

WRITING RULES:
- Language must be suitable for ages 8–13. Simple words, exciting tone.
- NEVER name the location, country, or any direct identifier in the riddle or clues (until clue 4 for easy).
- Clues go from hardest (1) to easiest (4).
- For EXPLORER: clue 3 should hint at the country, clue 4 should nearly name the place.
- Map start distance from answer: explorer=1–3km, adventurer=5–20km, navigator=30–100km, champion=100–300km.
- Include an interesting educational fact in fun_fact that a child would want to tell their parents.
- DO NOT use any of these already-used locations: ${existingLocations.join(', ')}

Respond with ONLY valid JSON — no markdown:
{
  "round_number": ${roundNumber},
  "difficulty": "${difficulty}",
  "location_name": "official name",
  "location_country": "country",
  "location_lat": 0.0,
  "location_lng": 0.0,
  "map_start_lat": 0.0,
  "map_start_lng": 0.0,
  "street_view_heading": 0,
  "street_view_pitch": 0,
  "street_view_only": false,
  "street_view_question": null,
  "points_value": ${pointsMap[difficulty] ?? 500},
  "riddle_text": "2–4 sentences written in the specified narrative style — fun and exciting for kids aged 8–13",
  "clues": [
    {"order":1,"text":"broadest clue — a general continent or region"},
    {"order":2,"text":"more helpful clue — narrows it down significantly"},
    {"order":3,"text":"clear clue — hints at the country or famous feature"},
    {"order":4,"text":"easiest clue — nearly names it, a child who pays attention should get it"}
  ],
  "answer_keywords": ["primary name","alternate spelling","local name"],
  "fun_fact": "One fascinating educational fact about this place that a child would love to share — keep it fun, surprising, and age-appropriate."
}`
}

async function tryGenerateOnce(params: {
  roundNumber: number
  difficulty: string
  eventId: string
  existingLocations: string[]
  eventTheme?: EventTheme
}): Promise<string | null> {
  const { roundNumber, difficulty, eventId, existingLocations, eventTheme } = params

  try {
    // Query current event's challenges BEFORE calling AI — used for both prompt ban list and duplicate check
    const supabase = getSupabase()
    const { data: existingEventChallenges } = await supabase
      .from('challenges')
      .select('location_name, location_country')
      .eq('event_id', eventId)
    const currentEventLocations = (existingEventChallenges ?? [])
      .filter(c => c.location_name)
      .map(c => c.location_country ? `${c.location_name}, ${c.location_country}` : c.location_name)

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const isStreetView = STREET_VIEW_ROUNDS.includes(roundNumber)
    const prompt = isStreetView
      ? buildStreetViewPrompt(roundNumber, difficulty, existingLocations, eventTheme, currentEventLocations)
      : buildPrompt(roundNumber, difficulty, existingLocations, eventTheme, currentEventLocations)

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let challengeData: any
    try {
      challengeData = JSON.parse(cleaned)
    } catch {
      return null
    }

    // round_number/difficulty/street_view_only are deterministic from the caller —
    // never trust the AI's copy of them, it sometimes gets street_view_only wrong
    // even when the generated question/riddle content is correctly street-view-style.
    challengeData.round_number = roundNumber
    challengeData.difficulty = difficulty
    challengeData.street_view_only = isStreetView

    if (
      Math.abs(challengeData.location_lat ?? 0) < 0.001 &&
      Math.abs(challengeData.location_lng ?? 0) < 0.001
    ) return null

    // For Street View rounds, verify coverage exists before saving — the AI's
    // claim that a location has coverage is frequently wrong.
    if (isStreetView) {
      const hasCoverage = await verifyStreetView(challengeData.location_lat, challengeData.location_lng)
      if (!hasCoverage) return null
    }

    if (Array.isArray(challengeData.clues)) {
      const texts = challengeData.clues.map((c: any) => (c.text ?? '').trim().toLowerCase())
      const unique = new Set(texts)
      if (unique.size < texts.length || challengeData.clues.length < 2) return null
      challengeData.clues = challengeData.clues.map((c: any, idx: number) => ({ ...c, order: idx + 1 }))
    }

    // Country uniqueness check using pre-fetched event data (no second DB query)
    if (challengeData.location_country) {
      const countryLower = challengeData.location_country.toLowerCase().split('/')[0].trim()
      const isDuplicate = (existingEventChallenges ?? []).some(c => {
        const cLower = (c.location_country ?? '').toLowerCase().split('/')[0].trim()
        return cLower === countryLower || cLower.includes(countryLower) || countryLower.includes(cLower)
      })
      if (isDuplicate) return null
    }
    // Exact-landmark duplicate check — belt-and-braces alongside the country check
    // above. The country check alone failed to stop the same landmark being picked
    // for multiple rounds when two generation crons ran concurrently against the
    // same event, each working from a stale snapshot (same bug class fixed on WorldChase).
    if (challengeData.location_name) {
      const nameLower = String(challengeData.location_name).toLowerCase().trim()
      const isNameDuplicate = (existingEventChallenges ?? []).some(
        c => (c.location_name ?? '').toLowerCase().trim() === nameLower
      )
      if (isNameDuplicate) return null
    }
    const { data, error } = await supabase.from('challenges').insert({
      ...challengeData,
      event_id: eventId,
      time_limit_seconds: 2400,
    }).select('id, location_name, location_country, location_lat, location_lng').maybeSingle()

    if (error || !data) return null

    // Insert hidden tokens inline
    const tokenCount = 2 + Math.floor(Math.random() * 3)
    const hints = [
      'Something sparkles near the water!',
      'Look for a hidden treasure in the shadows.',
      'An explorer\'s reward awaits at the crossroads.',
      'Can you spot the secret near the old path?',
      'A prize hides where adventurers meet.',
    ]
    const tokens = Array.from({ length: tokenCount }, (_, i) => {
      const spread = 1 + Math.random() * 3
      const { dLat, dLng } = randomOffset(spread)
      return {
        challenge_id: data.id,
        lat: challengeData.location_lat + dLat,
        lng: challengeData.location_lng + dLng,
        radius_meters: 50,
        token_value: Math.random() > 0.7 ? 2 : 1,
        hint_text: hints[i % hints.length],
      }
    })
    await supabase.from('hidden_tokens').insert(tokens)

    return data.location_country
      ? `${data.location_name}, ${data.location_country}`
      : data.location_name
  } catch {
    return null
  }
}

// Retries on failure — handles transient AI errors, bad coordinates, banned-country picks,
// and (for Street View rounds) failed coverage verification. Street View rounds get more
// attempts since coverage rejection is a common, expected outcome, not a rare edge case.
export async function generateChallengeInline(params: {
  roundNumber: number
  difficulty: string
  eventId: string
  existingLocations: string[]
  eventTheme?: EventTheme
}): Promise<string | null> {
  const attempts = STREET_VIEW_ROUNDS.includes(params.roundNumber) ? 4 : 2
  for (let i = 0; i < attempts; i++) {
    const result = await tryGenerateOnce(params)
    if (result !== null) return result
  }
  return null
}

export async function getRecentExclusions(supabase: ReturnType<typeof getSupabase>): Promise<string[]> {
  const { data: recentEvents } = await supabase
    .from('monthly_events')
    .select('id')
    .eq('status', 'completed')
    .order('ends_at', { ascending: false })
    .limit(2)

  if (!recentEvents?.length) return []

  const { data: recentChallenges } = await supabase
    .from('challenges')
    .select('location_name, location_country')
    .in('event_id', recentEvents.map(e => e.id))

  return (recentChallenges ?? [])
    .filter(c => c.location_name)
    .map(c => c.location_country ? `${c.location_name}, ${c.location_country}` : c.location_name)
}

export { EVENT_THEMES }
