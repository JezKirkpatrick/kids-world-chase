import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// KWC difficulty: rounds 1-10 easy, 11-18 medium, 19-22 hard, 23-25 extreme
// Avg per round: easy≈700, medium≈1000, hard≈1800, extreme≈3000
// Cumulative: 10 easy=7000, +8 med=15000, +4 hard=22200, +3 extreme=31200
const FAKE_PLAYERS = [
  { id: 'f0000002-f002-4000-a002-000000000001', username: 'GeoBee_Star',    country: 'United Kingdom', country_code: 'gb', equipped_avatar: '⭐', completedRounds: 25, baseScore: 31200 },
  { id: 'f0000002-f002-4000-a002-000000000002', username: 'StarMapper',     country: 'United States',  country_code: 'us', equipped_avatar: '🌟', completedRounds: 25, baseScore: 30100 },
  { id: 'f0000002-f002-4000-a002-000000000003', username: 'AtlasKid',       country: 'Australia',      country_code: 'au', equipped_avatar: '📚', completedRounds: 25, baseScore: 29200 },
  { id: 'f0000002-f002-4000-a002-000000000004', username: 'WorldKid_Pro',   country: 'Canada',         country_code: 'ca', equipped_avatar: '🌏', completedRounds: 24, baseScore: 28200 },
  { id: 'f0000002-f002-4000-a002-000000000005', username: 'GlobeRacer',     country: 'Japan',          country_code: 'jp', equipped_avatar: '🏃', completedRounds: 24, baseScore: 27500 },
  { id: 'f0000002-f002-4000-a002-000000000006', username: 'GeoChamp',       country: 'Germany',        country_code: 'de', equipped_avatar: '🏆', completedRounds: 23, baseScore: 25200 },
  { id: 'f0000002-f002-4000-a002-000000000007', username: 'TerraPal',       country: 'New Zealand',    country_code: 'nz', equipped_avatar: '🌿', completedRounds: 23, baseScore: 24400 },
  { id: 'f0000002-f002-4000-a002-000000000008', username: 'MapExplorer7',   country: 'Singapore',      country_code: 'sg', equipped_avatar: '🗺️', completedRounds: 22, baseScore: 22200 },
  { id: 'f0000002-f002-4000-a002-000000000009', username: 'WorldSmith',     country: 'Brazil',         country_code: 'br', equipped_avatar: '🌍', completedRounds: 22, baseScore: 21500 },
  { id: 'f0000002-f002-4000-a002-000000000010', username: 'KidHero',        country: 'France',         country_code: 'fr', equipped_avatar: '🦸', completedRounds: 21, baseScore: 20400 },
  { id: 'f0000002-f002-4000-a002-000000000011', username: 'MapBuddy',       country: 'South Korea',    country_code: 'kr', equipped_avatar: '🗺️', completedRounds: 21, baseScore: 19700 },
  { id: 'f0000002-f002-4000-a002-000000000012', username: 'AdventureAli',   country: 'Sweden',         country_code: 'se', equipped_avatar: '🦁', completedRounds: 20, baseScore: 18600 },
  { id: 'f0000002-f002-4000-a002-000000000013', username: 'GlobeHunter',    country: 'Netherlands',    country_code: 'nl', equipped_avatar: '🌐', completedRounds: 20, baseScore: 17900 },
  { id: 'f0000002-f002-4000-a002-000000000014', username: 'NatureKid',      country: 'Spain',          country_code: 'es', equipped_avatar: '🌿', completedRounds: 19, baseScore: 17000 },
  { id: 'f0000002-f002-4000-a002-000000000015', username: 'ExploreKid2',    country: 'India',          country_code: 'in', equipped_avatar: '🔍', completedRounds: 19, baseScore: 16300 },
  { id: 'f0000002-f002-4000-a002-000000000016', username: 'CuriousCat',     country: 'South Africa',   country_code: 'za', equipped_avatar: '🔭', completedRounds: 18, baseScore: 15000 },
  { id: 'f0000002-f002-4000-a002-000000000017', username: 'MapAddict',      country: 'Mexico',         country_code: 'mx', equipped_avatar: '🗺️', completedRounds: 18, baseScore: 14400 },
  { id: 'f0000002-f002-4000-a002-000000000018', username: 'WorldPro',       country: 'Argentina',      country_code: 'ar', equipped_avatar: '🌍', completedRounds: 17, baseScore: 13400 },
  { id: 'f0000002-f002-4000-a002-000000000019', username: 'KidHunter',      country: 'Norway',         country_code: 'no', equipped_avatar: '🎯', completedRounds: 17, baseScore: 12800 },
  { id: 'f0000002-f002-4000-a002-000000000020', username: 'GeoFanatic',     country: 'Poland',         country_code: 'pl', equipped_avatar: '🎯', completedRounds: 16, baseScore: 12000 },
  { id: 'f0000002-f002-4000-a002-000000000021', username: 'GlobalKid',   country: 'Portugal',       country_code: 'pt', equipped_avatar: '🌐', completedRounds: 16, baseScore: 11500 },
  { id: 'f0000002-f002-4000-a002-000000000022', username: 'WorldChamp',     country: 'Turkey',         country_code: 'tr', equipped_avatar: '🏆', completedRounds: 15, baseScore: 11000 },
  { id: 'f0000002-f002-4000-a002-000000000023', username: 'MapStar',        country: 'Egypt',          country_code: 'eg', equipped_avatar: '⭐', completedRounds: 15, baseScore: 10500 },
  { id: 'f0000002-f002-4000-a002-000000000024', username: 'TrekKid',        country: 'Nigeria',        country_code: 'ng', equipped_avatar: '🧭', completedRounds: 14, baseScore:  9800 },
  { id: 'f0000002-f002-4000-a002-000000000025', username: 'GlobeRunner',    country: 'Kenya',          country_code: 'ke', equipped_avatar: '🏃', completedRounds: 14, baseScore:  9200 },
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
