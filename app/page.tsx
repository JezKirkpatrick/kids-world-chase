import Link from 'next/link'

const STATS = [{ label: '🌍 Players in 47 countries' }, { label: '🏆 12,400+ young explorers' }, { label: '🗺️ 240 amazing places discovered' }]

const LEVELS = [
  { label: 'EXPLORER', rounds: 'ROUNDS 1–5', subtitle: 'START YOUR JOURNEY', desc: 'The world\'s most famous landmarks. Eiffel Tower, Great Wall, Taj Mahal — you\'ve got this!', pts: '500', color: 'border-success/40 bg-success/5', labelColor: 'text-success' },
  { label: 'ADVENTURER', rounds: 'ROUNDS 6–10', subtitle: 'GETTING EXCITING', desc: 'Capital cities, natural wonders and amazing places from every continent.', pts: '1,000', color: 'border-electric/40 bg-electric/5', labelColor: 'text-electric' },
  { label: 'NAVIGATOR', rounds: 'ROUNDS 11–15', subtitle: 'REAL GEOGRAPHY', desc: 'Rivers, mountains, national parks — test what you\'ve learned in school!', pts: '2,500', color: 'border-warning/40 bg-warning/5', labelColor: 'text-warning' },
  { label: 'CHAMPION', rounds: 'ROUNDS 16–20', subtitle: 'THE ULTIMATE CHALLENGE', desc: 'Only the sharpest young geographers crack these. Can you be a World Chase Champion?', pts: '5,000', color: 'border-danger/40 bg-danger/5', labelColor: 'text-danger' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'READ THE CLUE', desc: "Each round gives you a fun riddle describing a real place somewhere on Earth. No country names — just exciting clues to help you figure it out!" },
  { step: '02', title: 'EXPLORE THE MAP', desc: "Jump into Google Maps and go exploring! Walk the streets in Street View, zoom in from satellite, follow rivers and mountains." },
  { step: '03', title: 'HUNT FOR TOKENS', desc: "Hidden treasure tokens are scattered across the map region. Activate your radar and navigate close enough to collect them!" },
  { step: '04', title: 'SOLVE & LEARN', desc: "Submit your answer. Discover a fascinating fact about each place you find. Climb the leaderboard before the week ends!" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy text-text">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-navy/90 backdrop-blur border-b border-white/8 flex items-center justify-between px-4 sm:px-6">
        <span className="font-head font-bold text-gold text-base sm:text-lg tracking-widest">🌍 KIDS WORLD CHASE</span>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/how-to-play" className="hidden sm:block text-sm font-head text-text-muted hover:text-white transition-colors">HOW TO PLAY</Link>
          <Link href="/leaderboard" className="hidden sm:block text-sm font-head text-text-muted hover:text-white transition-colors">LEADERBOARD</Link>
          <Link href="/auth/login" className="text-sm font-head text-text-muted hover:text-white transition-colors">SIGN IN</Link>
          <Link href="/auth/signup" className="px-3 sm:px-4 py-2 bg-gold text-navy font-head font-bold text-sm tracking-wider hover:bg-gold-dim transition-colors whitespace-nowrap">JOIN FREE</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="relative max-w-3xl mx-auto">
          <div className="text-xs font-head font-bold tracking-[0.4em] text-gold mb-4">THE WEEKLY GEOGRAPHY ADVENTURE</div>
          <h1 className="font-head font-bold text-4xl sm:text-5xl md:text-7xl text-white mb-6 leading-tight">
            Explore the World.<br/>
            <span className="text-gold">Become a Champion!</span>
          </h1>
          <p className="text-text-muted font-head text-base sm:text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Twenty exciting riddles. Twenty amazing places to discover. Learn geography, explore Google Maps, and race friends to the top of the global leaderboard. New adventure every week!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link href="/auth/signup" className="px-8 sm:px-10 py-4 bg-gold text-navy font-head font-bold text-base sm:text-lg tracking-widest hover:bg-gold-dim transition-all gold-glow">
              Start Exploring — It's Free!
            </Link>
            <Link href="/how-to-play" className="px-6 sm:px-8 py-4 border border-white/20 text-text font-head font-bold text-sm tracking-wider hover:border-gold/40 transition-all">
              HOW IT WORKS
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-head text-text-muted">
            {STATS.map(s => <span key={s.label}>{s.label}</span>)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs text-gold font-head tracking-[0.4em] mb-3">HOW IT WORKS</div>
            <h2 className="font-head font-bold text-3xl text-white">Four Steps to Adventure</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map(h => (
              <div key={h.step} className="border border-white/8 p-6 bracket-box">
                <div className="font-mono text-gold/50 text-xs mb-2">{h.step}</div>
                <h3 className="font-head font-bold text-gold tracking-wider text-sm mb-3">{h.title}</h3>
                <p className="text-text-muted font-head leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="py-20 px-6 bg-navy-light border-y border-white/8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-head font-bold text-3xl text-white mb-3">Twenty Rounds. Four Levels of Adventure.</h2>
            <p className="text-text-muted font-head">Start easy and work your way up — every round teaches you something new about our amazing world.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LEVELS.map(d => (
              <div key={d.label} className={`border p-5 ${d.color}`}>
                <div className={`font-mono font-bold text-sm tracking-widest mb-1 ${d.labelColor}`}>{d.label}</div>
                <div className="text-xs text-text-muted font-head mb-1">{d.rounds}</div>
                <div className="text-xs font-head font-bold text-white/60 tracking-wider mb-3">"{d.subtitle}"</div>
                <p className="text-text-muted font-head text-sm leading-relaxed mb-3">{d.desc}</p>
                <div className="font-mono text-xs text-text-muted">Up to <span className={`font-bold ${d.labelColor}`}>{d.pts}</span> pts</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Educational benefit */}
      <section className="py-20 px-6 border-b border-white/8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs text-gold font-head tracking-[0.4em] mb-3">LEARN WHILE YOU PLAY</div>
            <h2 className="font-head font-bold text-3xl text-white mb-4">Geography That Sticks</h2>
            <p className="text-text-muted font-head text-lg max-w-2xl mx-auto">
              Every round teaches something real. After you solve a location, you get a fascinating fact — the kind of thing you'll want to tell your friends and teachers.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: '🗺️', title: 'Real Google Maps', desc: 'Explore the actual world using real satellite and street view imagery — the same tools explorers and scientists use.' },
              { icon: '🏆', title: 'Weekly Leaderboard', desc: 'Compete with young explorers from around the world. New locations every Monday — fresh adventure every week!' },
              { icon: '🧠', title: 'Fun Facts Every Round', desc: 'Discover why the Eiffel Tower grows taller in summer, why the Dead Sea is a lake, and hundreds more amazing facts.' },
            ].map(f => (
              <div key={f.title} className="border border-white/8 p-6 text-center">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-head font-bold text-gold text-sm tracking-wider mb-3">{f.title}</h3>
                <p className="text-text-muted font-head text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-head font-bold text-3xl text-white mb-4">This Week's Adventure Has Started!</h2>
          <p className="text-text-muted font-head text-lg mb-8">
            Young explorers are already solving riddles and climbing the leaderboard. Your first tokens are free. Your first adventure is waiting!
          </p>
          <Link href="/auth/signup" className="inline-block px-12 py-4 bg-gold text-navy font-head font-bold text-lg tracking-widest hover:bg-gold-dim transition-all gold-glow">
            Join Free — Start Exploring!
          </Link>
          <p className="text-text-muted/50 font-head text-xs mt-4">No credit card required. New adventure every week. Safe for ages 8+.</p>
        </div>
      </section>

      <footer className="border-t border-white/8 py-8 px-6 text-center text-text-muted/50 font-head text-xs tracking-wider">
        © 2025 KIDS WORLD CHASE — EXPLORE THE WORLD
      </footer>
    </div>
  )
}
