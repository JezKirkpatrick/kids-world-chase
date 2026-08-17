# KidsWorldChase — Claude Session Rules

## DO THIS FIRST, EVERY SINGLE SESSION
```
git status
```
Run this on BOTH repos before touching anything. If there are uncommitted changes, commit and push them BEFORE starting any new work. This has caused Pulsar and other fixes to silently not deploy multiple times.

Also check WorldChase:
```
cd C:\Users\kiwis\OneDrive\Desktop\Claude\WorldChase && git status
```

## DEFINITION OF DONE
A fix is NOT done when the file is saved. A fix is done when it is **pushed to git**. Vercel deploys from git, not from disk. Always: edit → `git add` → `git commit` → `git push`.

## PROJECT
- **Live at:** https://www.kidsworldchase.net
- **Local path:** `C:\Users\kiwis\OneDrive\Desktop\Claude\KidsWorldChase`
- **GitHub:** https://github.com/JezKirkpatrick/kids-world-chase
- **Stack:** Next.js 14 App Router, Supabase (Postgres + Auth + RLS), Vercel
- **Owner:** Jez (non-technical) — email kiwis.2017@yahoo.com
- **Supabase project ref:** `vsreviouahdaokxvuzsa`
- **Target audience:** Children aged 8–13
- **Sister site:** WorldChase at `C:\Users\kiwis\OneDrive\Desktop\Claude\WorldChase`

## SUPABASE
- **SQL:** Use management API via curl, do NOT ask user to paste SQL into dashboard
- **Raw SQL endpoint:** `POST https://api.supabase.com/v1/projects/vsreviouahdaokxvuzsa/database/query`
- **Client rules:** Use `createServiceClient()` (service role) for any DB writes/RPCs. `createClient()` (anon) is for auth only.

## RECURRING BUGS — ALREADY FIXED, DON'T REINTRODUCE
- `.single()` on queries that might return 0 rows → always use `.maybeSingle()`
- `createClient()` for `adjust_tokens` RPC → must use service role client
- Avatar borders not rendering in nav → GlobalNav uses `<Avatar>` component, never render manually
- Pulsar CSS and Avatar.tsx dot colours must be cyan (#00ffff), not white
- Street View rounds showing the wrong thing is a RECURRING symptom with THREE distinct root causes found so far — don't assume a new report is a regression of an old fix, check which one it actually is:
  1. (2026-07-30) Bad Street View coverage classification.
  2. (2026-08-03) AI echoed back the wrong `round_number`/`difficulty`/`street_view_only` in its JSON — fixed by forcing these three fields from the caller's known values right after `JSON.parse`, never trusting the model's copy. Still in place in `generateChallengeInline.ts`.
  3. (2026-08-18) Two-part fix, same underlying cause — the AI can pick coordinates that "pass" verification while showing the wrong scene: (a) `MapPanel.tsx`'s `loadOutdoorPanorama()` now checks `data.links.length > 0` before accepting a panorama, not just `status === 'OK'` — Google's `source: outdoor` tag is uploader-supplied and can mistag an indoor photo sphere (e.g. a museum gallery) near a real street as outdoor. (b) `generateChallengeInline.ts`'s `verifyStreetView()` now also checks the matched panorama's own distance from the requested coordinates (must be ≤75m) — a location like a pedestrian-only bridge (no car access) can return `status: OK` from a wide-radius search while the actual match is an unrelated street blocks away. Panoramas are resolved fresh from `location_lat`/`location_lng` on every page load (never cached/stored as a pano_id), so both checks are the only gate. Found on Round 1 of a live KWC event ("bridge over the Seine" briefing showing an indoor Louvre gallery, then after the links fix, a real-but-wrong nearby street) — manually corrected that live row to Pont Alexandre III (verified genuine car-level coverage, confirmed Eiffel Tower view).

## AVATAR / BORDERS
- All avatar rendering must go through `components/ui/Avatar.tsx`
- Never build a manual avatar renderer
- When adding `equipped_avatar` to any query, ALWAYS add `equipped_border` too

## KIDS-SPECIFIC
- Difficulty labels: Explorer / Adventurer / Navigator / Champion (NOT Easy/Medium/Hard/Extreme)
- Age-appropriate content only — no dark/violent/obscure locations
- Round time limit: 40 minutes (2400s)
- Daily quiz uses kid-friendly questions

## COMMUNICATION
- Call the user "mate"
- Plain English — no jargon without explanation
- After a fix: one sentence on what broke, one sentence on what was done
- Don't apologise repeatedly for the same class of bug
