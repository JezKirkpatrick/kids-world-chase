import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NARRATIVE_STYLES } from '@/lib/eventThemes'
import type { EventTheme } from '@/lib/eventThemes'

export const dynamic = 'force-dynamic'

const STREET_VIEW_ROUNDS = [1, 6, 11, 16]

// Kid-friendly difficulty labels for display (DB still uses easy/medium/hard/extreme)
export const KIDS_DIFFICULTY_LABELS: Record<string, string> = {
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

  return `You are the friendly game master for "Kids World Chase" — an educational geography game designed for children aged 8–13.
${themeSection}
Generate ONE Street View Observation challenge for Round ${roundNumber} (${diffLabel} level).

Pick a REAL, famous, visually interesting street or landmark that has OFFICIAL Google Street View car coverage (blue lines on Google Maps). The location must be well-known enough that it appears in children's geography books or school curricula. NOT user-contributed photos — must have navigable road arrows.

The observation question must be answerable by looking carefully at the Street View imagery. Keep it fun and age-appropriate.

LEVEL GUIDE for observation questions:
- EXPLORER (easy): Count something large and obvious (flags, statues, vehicles) at a world-famous location. Answer must be a simple number 1–9 or an obvious visible object.
- ADVENTURER (medium): Identify something specific (colour of a building, a symbol, an animal) at a well-known landmark.
- NAVIGATOR (hard): Spot something that requires careful looking at a recognisable but less-famous location.
- CHAMPION (extreme): Find a specific detail at a famous location that takes real concentration to spot.

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

  return `You are the friendly game master for "Kids World Chase" — an educational geography adventure game for children aged 8–13.
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

      const profile = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
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
    const challengeData = JSON.parse(cleaned)

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
    }).select().single()

    if (error) throw error

    const tokenCount = 2 + Math.floor(Math.random() * 3)
    await fetch(`${req.nextUrl.origin}/api/admin/generate-hidden-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
