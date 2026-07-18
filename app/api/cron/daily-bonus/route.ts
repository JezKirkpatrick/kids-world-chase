import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Daily cron (08:00 UTC) — awards 5 tokens to players who haven't logged in
// for exactly 3 days, to encourage them to come back and explore.
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const today = new Date().toISOString().split('T')[0]
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString().split('T')[0]

    // Find players who last logged in exactly 3 days ago and aren't banned
    const { data: players } = await supabase
      .from('profiles')
      .select('id')
      .eq('last_login_date', threeDaysAgo)
      .eq('is_banned', false)

    if (!players || players.length === 0) {
      return NextResponse.json({ success: true, bonusesAwarded: 0, date: today })
    }

    let awarded = 0
    for (const player of players) {
      const [txResult] = await Promise.all([
        supabase.from('token_transactions').insert({
          user_id: player.id,
          type: 'bonus',
          amount: 5,
          description: 'Come back bonus — we missed you! 🌍',
        }),
        supabase.rpc('adjust_tokens', { p_user_id: player.id, p_amount: 5 }),
      ])
      if (!txResult.error) awarded++
    }

    return NextResponse.json({ success: true, bonusesAwarded: awarded, date: today })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
