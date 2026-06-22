import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// KWC difficulty: rounds 1-10 easy, 11-18 medium, 19-22 hard, 23-25 extreme
// Avg per round: easy≈700, medium≈1000, hard≈1800, extreme≈3000
const FAKE_PLAYERS = [
  { id: 'f0000002-f002-4000-a002-000000000001', username: 'GeoBee_Star',    country: 'United Kingdom', country_code: 'gb', equipped_avatar: '⭐', completedRounds: 22, baseScore: 22200 },
  { id: 'f0000002-f002-4000-a002-000000000002', username: 'WorldKid_Pro',   country: 'Australia',      country_code: 'au', equipped_avatar: '🌏', completedRounds: 20, baseScore: 18600 },
  { id: 'f0000002-f002-4000-a002-000000000003', username: 'MapExplorer7',   country: 'United States',  country_code: 'us', equipped_avatar: '🗺️', completedRounds: 18, baseScore: 15000 },
  { id: 'f0000002-f002-4000-a002-000000000004', username: 'AdventureAli',   country: 'Canada',         country_code: 'ca', equipped_avatar: '🦁', completedRounds: 15, baseScore: 12000 },
  { id: 'f0000002-f002-4000-a002-000000000005', username: 'CuriousCleo',    country: 'New Zealand',    country_code: 'nz', equipped_avatar: '🔭', completedRounds: 13, baseScore: 10000 },
  { id: 'f0000002-f002-4000-a002-000000000006', username: 'GlobalJunior',   country: 'Singapore',      country_code: 'sg', equipped_avatar: '🌐', completedRounds: 11, baseScore:  8000 },
  { id: 'f0000002-f002-4000-a002-000000000007', username: 'TravelTeddy',    country: 'Germany',        country_code: 'de', equipped_avatar: '🧸', completedRounds:  9, baseScore:  6300 },
  { id: 'f0000002-f002-4000-a002-000000000008', username: 'MapMagic',       country: 'Brazil',         country_code: 'br', equipped_avatar: '✨', completedRounds:  7, baseScore:  4900 },
  { id: 'f0000002-f002-4000-a002-000000000009', username: 'GeoFun99',       country: 'South Africa',   country_code: 'za', equipped_avatar: '🎉', completedRounds:  5, baseScore:  3500 },
  { id: 'f0000002-f002-4000-a002-000000000010', username: 'PlanetPal',      country: 'France',         country_code: 'fr', equipped_avatar: '🪐', completedRounds:  3, baseScore:  2100 },
  { id: 'f0000002-f002-4000-a002-000000000011', username: 'WorldWiz',       country: 'Japan',          country_code: 'jp', equipped_avatar: '🧙', completedRounds:  2, baseScore:  1400 },
  { id: 'f0000002-f002-4000-a002-000000000012', username: 'ExploreKid',     country: 'India',          country_code: 'in', equipped_avatar: '🚀', completedRounds:  1, baseScore:   700 },
]

function jitter(base: number): number {
  return Math.round(base * (0.88 + Math.random() * 0.24))
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const isValid = auth === `Bearer ${process.env.CRON_SECRET}` || auth === `Bearer ${process.env.ADMIN_SECRET}`
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from('monthly_events')
    .select('id')
    .eq('status', 'active')
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!event) return NextResponse.json({ success: true, message: 'No active event' })

  // Ensure fake profiles exist (no-op if already created)
  await supabase.from('profiles').upsert(
    FAKE_PLAYERS.map(p => ({
      id: p.id,
      username: p.username,
      display_name: p.username,
      equipped_avatar: p.equipped_avatar,
      equipped_border: 'none',
      country: p.country,
      country_code: p.country_code,
      is_fake: true,
      tokens: 0,
      total_score_alltime: 0,
    })),
    { onConflict: 'id', ignoreDuplicates: true }
  )

  // Check who already has a leaderboard entry for this event
  const { data: existing } = await supabase
    .from('leaderboard')
    .select('user_id')
    .eq('event_id', event.id)
    .in('user_id', FAKE_PLAYERS.map(p => p.id))

  const existingIds = new Set(existing?.map(r => r.user_id) ?? [])
  const toSeed = FAKE_PLAYERS.filter(p => !existingIds.has(p.id))

  if (toSeed.length === 0) {
    return NextResponse.json({ success: true, message: 'Already seeded for this event' })
  }

  const rows = toSeed.map(p => ({
    user_id: p.id,
    event_id: event.id,
    total_score: jitter(p.baseScore),
    challenges_completed: p.completedRounds,
    current_round: Math.min(p.completedRounds + 1, 25),
  }))

  const { error } = await supabase.from('leaderboard').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, seeded: toSeed.length, event: event.id })
}
