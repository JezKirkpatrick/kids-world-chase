import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { EVENT_THEMES } from '@/lib/eventThemes'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const DIFFICULTY_FOR_ROUND = (round: number): string =>
  round <= 10 ? 'easy' : round <= 18 ? 'medium' : round <= 22 ? 'hard' : 'extreme'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const origin = req.headers.get('origin') ?? 'https://www.kidsworldchase.net'

  const { data: activeEvents } = await supabase
    .from('monthly_events')
    .select('id, name')
    .eq('status', 'active')

  const eventsToGenerate: { id: string; name: string; missingRounds: number[] }[] = []
  for (const event of activeEvents ?? []) {
    const { data: existing } = await supabase
      .from('challenges')
      .select('round_number')
      .eq('event_id', event.id)
    const existingRounds = new Set((existing ?? []).map(c => c.round_number))
    const missingRounds = []
    for (let r = 1; r <= 25; r++) {
      if (!existingRounds.has(r)) missingRounds.push(r)
    }
    if (missingRounds.length > 0) eventsToGenerate.push({ ...event, missingRounds })
  }

  if (eventsToGenerate.length === 0)
    return NextResponse.json({ success: true, message: 'All events complete' })

  const { data: recentEvents } = await supabase
    .from('monthly_events')
    .select('id')
    .eq('status', 'completed')
    .order('ends_at', { ascending: false })
    .limit(2)

  const recentEventIds = (recentEvents ?? []).map(e => e.id)
  let recentExclusions: string[] = []

  if (recentEventIds.length > 0) {
    const { data: recentChallenges } = await supabase
      .from('challenges')
      .select('location_name, location_country')
      .in('event_id', recentEventIds)

    recentExclusions = (recentChallenges ?? [])
      .filter(c => c.location_name)
      .map(c => c.location_country ? `${c.location_name}, ${c.location_country}` : c.location_name)
  }

  const results: Record<string, { generated: number; failed: number[] }> = {}

  for (const event of eventsToGenerate) {
    const themeId = event.name.toLowerCase().includes('animal') ? 'animal_habitats'
      : event.name.toLowerCase().includes('wonder') ? 'world_wonders'
      : event.name.toLowerCase().includes('capital') ? 'capital_cities'
      : event.name.toLowerCase().includes('island') ? 'islands_oceans'
      : 'global_explorer'

    const theme = EVENT_THEMES.find(t => t.id === themeId) ?? EVENT_THEMES[0]

    const { data: existingChallenges } = await supabase
      .from('challenges')
      .select('location_name, location_country')
      .eq('event_id', event.id)

    const existingLocations = [
      ...recentExclusions,
      ...(existingChallenges ?? [])
        .filter(c => c.location_name)
        .map(c => c.location_country ? `${c.location_name}, ${c.location_country}` : c.location_name),
    ]
    const failedRounds: number[] = []
    let generatedCount = 0

    for (const round of event.missingRounds) {
      try {
        const res = await fetch(`${origin}/api/admin/generate-challenge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-secret': process.env.CRON_SECRET ?? '',
          },
          body: JSON.stringify({
            roundNumber: round,
            difficulty: DIFFICULTY_FOR_ROUND(round),
            eventId: event.id,
            existingLocations,
            eventTheme: theme,
            eventName: event.name,
          }),
        })

        if (res.ok) {
          const result = await res.json()
          if (result.challenge?.location_name) {
            const loc = result.challenge.location_country
              ? `${result.challenge.location_name}, ${result.challenge.location_country}`
              : result.challenge.location_name
            existingLocations.push(loc)
            generatedCount++
          } else {
            failedRounds.push(round)
          }
        } else {
          failedRounds.push(round)
        }
      } catch {
        failedRounds.push(round)
      }
    }

    results[event.name] = { generated: generatedCount, failed: failedRounds }
  }

  return NextResponse.json({ success: true, results })
}
