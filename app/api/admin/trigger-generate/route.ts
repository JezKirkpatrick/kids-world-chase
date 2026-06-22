import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { EVENT_THEMES } from '@/lib/eventThemes'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const DIFFICULTY_FOR_ROUND = (round: number): string =>
  round <= 10 ? 'easy' : round <= 18 ? 'medium' : round <= 22 ? 'hard' : 'extreme'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const origin = req.headers.get('origin') ?? 'https://www.kidsworldchase.net'

  const { data: activeEvents } = await supabase
    .from('monthly_events')
    .select('id, name')
    .eq('status', 'active')

  const eventsToGenerate: { id: string; name: string }[] = []
  for (const event of activeEvents ?? []) {
    const { count } = await supabase
      .from('challenges')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
    if ((count ?? 0) === 0) eventsToGenerate.push(event)
  }

  if (eventsToGenerate.length === 0)
    return NextResponse.json({ success: true, message: 'No events need generation' })

  const { data: recentEvents } = await supabase
    .from('monthly_events')
    .select('id')
    .eq('status', 'completed')
    .order('ends_at', { ascending: false })
    .limit(2)

  const recentExclusions: string[] = []
  for (const re of recentEvents ?? []) {
    const { data: oldChallenges } = await supabase
      .from('challenges')
      .select('location_name, country')
      .eq('event_id', re.id)
    for (const c of oldChallenges ?? []) {
      if (c.location_name) recentExclusions.push(c.location_name)
      if (c.country) recentExclusions.push(c.country)
    }
  }

  const results: Record<string, { generated: number; failed: number[] }> = {}

  for (const event of eventsToGenerate) {
    const themeId = event.name.toLowerCase().includes('animal') ? 'animal_habitats'
      : event.name.toLowerCase().includes('wonder') ? 'world_wonders'
      : event.name.toLowerCase().includes('capital') ? 'capital_cities'
      : event.name.toLowerCase().includes('island') ? 'islands_oceans'
      : 'global_explorer'

    const theme = EVENT_THEMES.find(t => t.id === themeId) ?? EVENT_THEMES[0]
    const existingLocations = [...recentExclusions]
    const failedRounds: number[] = []
    let generatedCount = 0

    for (let round = 1; round <= 25; round++) {
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
          const data = await res.json()
          if (data.location) existingLocations.push(data.location)
          generatedCount++
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
