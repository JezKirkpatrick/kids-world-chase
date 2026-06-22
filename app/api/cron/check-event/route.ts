import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { EVENT_THEMES } from '@/lib/eventThemes'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const DIFFICULTY_FOR_ROUND = (round: number): string =>
  round <= 10 ? 'easy' : round <= 18 ? 'medium' : round <= 22 ? 'hard' : 'extreme'

function inferThemeId(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('animal')) return 'animal_habitats'
  if (n.includes('wonder')) return 'world_wonders'
  if (n.includes('capital')) return 'capital_cities'
  if (n.includes('island')) return 'islands_oceans'
  return 'global_explorer'
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const isValid = auth === `Bearer ${process.env.CRON_SECRET}` || auth === `Bearer ${process.env.ADMIN_SECRET}`
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: activeEvents } = await supabase
    .from('monthly_events')
    .select('id, name')
    .eq('status', 'active')

  if (!activeEvents || activeEvents.length === 0) {
    return NextResponse.json({ success: true, message: 'No active events' })
  }

  const eventsNeedingFill: { id: string; name: string; existing: number[] }[] = []

  for (const event of activeEvents) {
    const { data: existing } = await supabase
      .from('challenges')
      .select('round_number')
      .eq('event_id', event.id)

    const existingRounds = new Set((existing ?? []).map(c => c.round_number))
    const missingRounds = []
    for (let r = 1; r <= 25; r++) {
      if (!existingRounds.has(r)) missingRounds.push(r)
    }

    if (missingRounds.length > 0) {
      eventsNeedingFill.push({ id: event.id, name: event.name, existing: missingRounds })
    }
  }

  if (eventsNeedingFill.length === 0) {
    return NextResponse.json({ success: true, message: 'All events complete' })
  }

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

  const origin = req.nextUrl.origin
  const results = []

  for (const event of eventsNeedingFill) {
    const themeId = inferThemeId(event.name)
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

    for (const round of event.existing) {
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

    results.push({ eventId: event.id, eventName: event.name, filled: generatedCount, failed: failedRounds })
  }

  return NextResponse.json({ success: true, results })
}
