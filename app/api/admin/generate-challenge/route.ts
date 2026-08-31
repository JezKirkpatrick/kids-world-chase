import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NARRATIVE_STYLES } from '@/lib/eventThemes'
import type { EventTheme } from '@/lib/eventThemes'

export const dynamic = 'force-dynamic'
// No default here meant Vercel's plan default (well under 300s) — the new Street View
// content-verification step (image fetch + vision call) adds real per-attempt latency,
// so make the ceiling explicit rather than risk a slow single attempt timing out.
export const maxDuration = 300

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
    for (const radius of [50, 150, 500]) {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=${radius}&source=outdoor&key=${key}`,
        { headers: { Referer: 'https://kidsworldchase.net' } }
      )
      const data = await res.json()
      if (data.status === 'OK' && data.location) {
        const matchedDistance = distanceMetres(lat, lng, data.location.lat, data.location.lng)
        if (matchedDistance <= 75) return true
      }
      if (radius === 500 && data.status === 'ZERO_RESULTS') return false
    }
    return false
  } catch {
    return true // network error — fail open so generation isn't blocked
  }
}

// Verify the panorama actually SHOWS what the riddle/question describes, not just that
// coverage exists nearby — geometry checks above pass locations where the matched pano
// is real, close, and navigable, but simply doesn't frame the scene the AI wrote about.
async function verifyStreetViewContent(
  lat: number, lng: number, heading: number, pitch: number,
  question: string, riddleText: string
): Promise<boolean> {
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!mapsKey) return true
  try {
    const imgRes = await fetch(
      `https://maps.googleapis.com/maps/api/streetview?size=640x400&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&fov=90&key=${mapsKey}`
    )
    if (!imgRes.ok) return true
    const buf = Buffer.from(await imgRes.arrayBuffer())
    const base64 = buf.toString('base64')

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: `This is the exact Google Street View frame a player will see for a geography game round. The player must answer this by looking at ONLY this image: "${question}"\nScene the game claims this is: "${riddleText}"\nIs the described object/scene actually visible and answerable from this exact frame — not "probably nearby" or "would be visible if rotated", but literally in this image? Reply with ONLY JSON, no markdown: {"visible": true or false, "reason": "one short sentence"}` }
        ]
      }] as any,
    })
    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned)
    return parsed.visible === true
  } catch {
    return true // vision check itself failing shouldn't block generation — fail open
  }
}

// Kid-friendly difficulty labels for display (DB still uses easy/medium/hard/extreme)
const KIDS_DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Explorer',
  medium: 'Adventurer',
  hard: 'Navigator',
  extreme: 'Champion',
}

function buildStreetViewPrompt(roundNumber: number, difficulty: string, existingLocations: string[], eventTheme?: EventTheme): string {
  const pointsMap: Record<string, number> = { easy: 500, medium: 1000, hard: 2500, extreme: 5000 }
  const narrativeStyle = NARRATIVE_STYLES[(roundNumber - 1) % NARRATIVE_STYLES.length]
  const diffLabel = KIDS_DIFFICULTY_LABELS[difficulty] ?? difficulty
  const themeSection = eventTheme
    ? `\nTHEME: "${eventTheme.label}" — ${eventTheme.description}
FOCUS ON: ${eventTheme.regionFocus}
AVOID: ${eventTheme.avoidRegions}\n`
    : ''

  return `You are the friendly game master for "Kids World Chase" — an educational geography game designed for children aged 8–16.
${themeSection}
Generate ONE Street View Observation challenge for Round ${roundNumber} (${diffLabel} level).

CRITICAL — STREET VIEW COVERAGE REQUIREMENT:
The location MUST have official Google Street View car coverage (blue road lines on Google Maps). Players are dropped into live Street View — if coverage doesn't exist the round completely breaks.
SAFE REGIONS with reliable Street View: Western Europe, North America, Japan, South Korea, Australia, New Zealand, major cities in Brazil, South Africa, Southeast Asia.
NEVER pick for EXPLORER/ADVENTURER: Pacific islands (Fiji, Samoa, Cook Islands, Tonga, Vanuatu, Solomon Islands), most rural Africa, Central Asia, or any remote island. These almost never have car Street View.
For NAVIGATOR/CHAMPION levels: still must be on a road with confirmed blue car Street View coverage — not just a photo sphere from a tourist.

Pick a well-known location that appears in children's geography books or school curricula. NOT user-contributed photos — must have navigable road arrows.

The observation question must be answerable by looking carefully at the Street View imagery. Keep it fun and age-appropriate.

CRITICAL — NO VAGUE QUESTIONS: street_view_question must target ONE specific, nameable detail — an exact count, an exact word/colour/symbol/animal. NEVER a broad, open-ended question like "What covers the buildings?" or "What do you see around you?" — a vague question gives the kid no idea what format of answer is even expected, and there is no single correct answer to grade against. If the question is a count, the underlying object must be countable at a glance without ambiguity — avoid counting things where the real number varies wildly depending on how far the player looks. The final clue MUST literally state the exact correct answer in plain words, not just hint at it — the kid should never finish reading the last clue still unsure what to type.

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

function buildPrompt(roundNumber: number, difficulty: string, existingLocations: string[], eventTheme?: EventTheme): string {
  const pointsMap: Record<string, number> = { easy: 500, medium: 1000, hard: 2500, extreme: 5000 }
  const narrativeStyle = NARRATIVE_STYLES[(roundNumber - 1) % NARRATIVE_STYLES.length]
  const diffLabel = KIDS_DIFFICULTY_LABELS[difficulty] ?? difficulty
  const themeSection = eventTheme
    ? `\nTHEME: "${eventTheme.label}" — ${eventTheme.description}
FOCUS ON: ${eventTheme.regionFocus}
AVOID: ${eventTheme.avoidRegions}\n`
    : ''

  return `You are the friendly game master for "Kids World Chase" — an educational geography adventure game for children aged 8–16.
${themeSection}
Generate ONE exciting, educational challenge for Round ${roundNumber} (${diffLabel} level).

GEOGRAPHIC DIVERSITY RULE: Pick a location in a DIFFERENT country than any place in the existing list below.

LEVEL GUIDE:
- EXPLORER (easy): The most famous, iconic landmarks in the world — the Eiffel Tower, Great Wall, Taj Mahal, etc. Every child should know or be able to guess these with a couple of clues. These should feel exciting and rewarding.
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

export async function POST(req: NextRequest) {
  try {
    // Allow internal cron calls via x-cron-secret header
    const cronSecret = process.env.CRON_SECRET
    const isCronCall = cronSecret && req.headers.get('x-cron-secret') === cronSecret

    if (!isCronCall) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const profile = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
      if (!profile.data?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { roundNumber, difficulty, eventId, existingLocations = [], eventTheme, eventName } = await req.json()

    if (!['easy', 'medium', 'hard', 'extreme'].includes(difficulty))
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
    if (!roundNumber || !eventId)
      return NextResponse.json({ error: 'Missing roundNumber or eventId' }, { status: 400 })

    const isStreetViewRound = STREET_VIEW_ROUNDS.includes(roundNumber)
    const prompt = isStreetViewRound
      ? buildStreetViewPrompt(roundNumber, difficulty, existingLocations, eventTheme)
      : buildPrompt(roundNumber, difficulty, existingLocations, eventTheme)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let challengeData: any
    try {
      challengeData = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON — regenerate' }, { status: 422 })
    }

    // round_number/difficulty/street_view_only are deterministic from the request —
    // never trust the AI's copy of them, it sometimes gets street_view_only wrong
    // even when the generated question/riddle content is correctly street-view-style.
    challengeData.round_number = roundNumber
    challengeData.difficulty = difficulty
    challengeData.street_view_only = isStreetViewRound

    // Reject placeholder 0,0 coordinates
    if (
      Math.abs(challengeData.location_lat ?? 0) < 0.001 &&
      Math.abs(challengeData.location_lng ?? 0) < 0.001
    ) {
      return NextResponse.json({ error: 'AI returned zero coordinates — regenerate' }, { status: 422 })
    }

    // For Street View rounds, verify coverage exists before saving
    if (isStreetViewRound) {
      const hasCoverage = await verifyStreetView(challengeData.location_lat, challengeData.location_lng)
      if (!hasCoverage) {
        return NextResponse.json({ error: 'No Street View coverage at AI coordinates — regenerate' }, { status: 422 })
      }

      const contentMatches = await verifyStreetViewContent(
        challengeData.location_lat, challengeData.location_lng,
        challengeData.street_view_heading ?? 0, challengeData.street_view_pitch ?? 0,
        challengeData.street_view_question ?? '', challengeData.riddle_text ?? ''
      )
      if (!contentMatches) {
        return NextResponse.json({ error: 'AI scene does not match what is actually visible at these coordinates — regenerate' }, { status: 422 })
      }
    }

    if (Array.isArray(challengeData.clues)) {
      const texts = challengeData.clues.map((c: any) => (c.text ?? '').trim().toLowerCase())
      const unique = new Set(texts)
      if (unique.size < texts.length) {
        return NextResponse.json({ error: 'AI returned duplicate clue texts — regenerate this challenge.' }, { status: 422 })
      }
      if (challengeData.clues.length < 2) {
        return NextResponse.json({ error: 'AI returned too few clues — regenerate this challenge.' }, { status: 422 })
      }
      challengeData.clues = challengeData.clues.map((c: any, idx: number) => ({ ...c, order: idx + 1 }))
    }

    const service = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await service.from('challenges').insert({
      ...challengeData, event_id: eventId, time_limit_seconds: 2400,
    }).select().maybeSingle()

    if (error) throw error

    const tokenCount = 2 + Math.floor(Math.random() * 3)
    await fetch(`${req.nextUrl.origin}/api/admin/generate-hidden-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.CRON_SECRET ?? '' },
      body: JSON.stringify({
        challengeId: data.id,
        centerLat: challengeData.location_lat,
        centerLng: challengeData.location_lng,
        count: tokenCount,
      }),
    })

    return NextResponse.json({ challenge: data })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message ?? 'Internal error', detail: String(err) }, { status: 500 })
  }
}
