import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Basic profanity filter — catches common substitutions (3→e, @→a, 1→i, 0→o)
const BAD_WORDS = [
  'fuck', 'shit', 'cunt', 'bitch', 'cock', 'dick', 'pussy', 'ass',
  'bastard', 'nigger', 'nigga', 'faggot', 'fag', 'whore', 'slut',
  'rape', 'piss', 'twat', 'wank', 'shag', 'bollocks', 'arse',
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/3/g, 'e').replace(/@/g, 'a').replace(/1/g, 'i')
    .replace(/0/g, 'o').replace(/\$/g, 's').replace(/5/g, 's')
    .replace(/[^a-z\s]/g, '')
}

function containsProfanity(text: string): boolean {
  const normalized = normalize(text)
  const words = normalized.split(/\s+/)
  return BAD_WORDS.some(bad => words.includes(bad))
}

export async function POST(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  const message = content.trim().slice(0, 300)

  if (containsProfanity(message)) {
    return NextResponse.json({ error: 'Message contains inappropriate language' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('chat_messages')
    .insert({ user_id: user.id, content: message })

  if (error) {
    console.error('chat insert error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
