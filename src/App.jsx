import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

/* ═══════ HOOKS ═══════ */
function useReveal(threshold = 0.12) {
  const ref = useRef(null), [vis, setVis] = useState(false)
  useEffect(() => { const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold }); if (ref.current) obs.observe(ref.current); return () => obs.disconnect() }, [threshold])
  return [ref, vis]
}
function useCounter(target, dur = 2000, active = true) {
  const [c, setC] = useState(0), s = useRef(false)
  useEffect(() => { if (!active || s.current) return; s.current = true; const t0 = performance.now(); const step = t => { const p = Math.min((t - t0) / dur, 1); setC(Math.floor((1 - Math.pow(1 - p, 3)) * target)); if (p < 1) requestAnimationFrame(step) }; requestAnimationFrame(step) }, [target, dur, active]); return c
}
function useTyping(strings, ts = 80, ds = 40, pause = 2500) {
  const [text, setText] = useState(''); const [idx, setIdx] = useState(0); const [del, setDel] = useState(false)
  useEffect(() => { const cur = strings[idx]; let t; if (!del) { if (text.length < cur.length) t = setTimeout(() => setText(cur.slice(0, text.length + 1)), ts); else t = setTimeout(() => setDel(true), pause) } else { if (text.length > 0) t = setTimeout(() => setText(cur.slice(0, text.length - 1)), ds); else { setDel(false); setIdx((idx + 1) % strings.length) } }; return () => clearTimeout(t) }, [text, del, idx, strings, ts, ds, pause]); return text
}

/* ═══════ COMPONENTS ═══════ */
function Reveal({ children, className = '', delay = 0 }) { const [ref, vis] = useReveal(); return <div ref={ref} className={`reveal ${vis ? 'visible' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div> }
function ScrollProgress() { const [w, setW] = useState(0); useEffect(() => { const fn = () => { const h = document.documentElement.scrollHeight - window.innerHeight; setW(h > 0 ? (window.scrollY / h) * 100 : 0) }; window.addEventListener('scroll', fn, { passive: true }); return () => window.removeEventListener('scroll', fn) }, []); return <div className="scroll-progress" style={{ width: `${w}%` }} /> }
function BackToTop() { const [s, setS] = useState(false); useEffect(() => { const fn = () => setS(window.scrollY > 600); window.addEventListener('scroll', fn, { passive: true }); return () => window.removeEventListener('scroll', fn) }, []); return <button className={`back-to-top ${s ? 'visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button> }

/* Preloader */
function Preloader({ onDone }) {
  const [progress, setProgress] = useState(0), [hide, setHide] = useState(false)
  useEffect(() => { const t = setInterval(() => setProgress(p => { if (p >= 100) { clearInterval(t); setTimeout(() => setHide(true), 300); setTimeout(onDone, 600); return 100 }; return p + Math.random() * 15 + 5 }), 80); return () => clearInterval(t) }, [onDone])
  return (
    <div className={`preloader ${hide ? 'hide' : ''}`}>
      <div className="preloader-content">
        <div className="preloader-logo-container">
          <div className="preloader-logo">HD</div>
        </div>
        <div className="preloader-bar">
          <div className="preloader-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <div className="preloader-text">loading_assets ({Math.floor(progress)}%)</div>
      </div>
    </div>
  )
}

/* Cursor Glow */
function CursorGlow() { const ref = useRef(null); useEffect(() => { const m = e => { if (ref.current) { ref.current.style.left = e.clientX + 'px'; ref.current.style.top = e.clientY + 'px' } }; window.addEventListener('mousemove', m, { passive: true }); return () => window.removeEventListener('mousemove', m) }, []); return <div ref={ref} className="cursor-glow" /> }

/* Interactive Particles Canvas */
function InteractiveParticles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let particles = []
    const particleCount = 40
    let mouse = { x: null, y: null, radius: 120 }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.vx = (Math.random() - 0.5) * 0.4
        this.vy = (Math.random() - 0.5) * 0.4
        this.size = Math.random() * 2 + 1
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(99, 102, 241, 0.25)'
        ctx.fill()
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1

        // Mouse collision
        if (mouse.x !== null && mouse.y !== null) {
          const dx = this.x - mouse.x
          const dy = this.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius
            const angle = Math.atan2(dy, dx)
            this.x += Math.cos(angle) * force * 1.5
            this.y += Math.sin(angle) * force * 1.5
          }
        }
      }
    }

    const init = () => {
      particles = []
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle())
      }
    }

    const drawLines = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 * (1 - dist / 100)})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }
    }

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.update()
        p.draw()
      })
      drawLines()
      animationFrameId = requestAnimationFrame(loop)
    }

    window.addEventListener('resize', resize)
    const handleMouseMove = e => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const handleMouseLeave = () => {
      mouse.x = null
      mouse.y = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    resize()
    init()
    loop()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="canvas-bg" />
}

/* Command Palette */
function CommandPalette({ onNavigate }) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState(''), inputRef = useRef(null)
  const items = [
    { label: 'Go to Home', section: 'home', icon: '🏠' }, { label: 'Go to About', section: 'about', icon: '👤' },
    { label: 'Go to Skills', section: 'skills', icon: '⚡' }, { label: 'Go to Projects', section: 'projects', icon: '📂' },
    { label: 'Go to Experience', section: 'experience', icon: '📋' }, { label: 'Go to Contact', section: 'contact', icon: '✉️' },
    { label: 'View GitHub', section: '_github', icon: '🔗' }, { label: 'View LinkedIn', section: '_linkedin', icon: '🔗' },
  ]
  const filtered = items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
  useEffect(() => { const k = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o); setQuery('') }; if (e.key === 'Escape') setOpen(false) }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [])
  useEffect(() => { if (open && inputRef.current) setTimeout(() => inputRef.current.focus(), 100) }, [open])
  const select = item => { setOpen(false); if (item.section === '_github') window.open(ME.github, '_blank'); else if (item.section === '_linkedin') window.open(ME.linkedin, '_blank'); else onNavigate(item.section) }
  if (!open) return null
  return (
    <div className="cmd-overlay" onClick={() => setOpen(false)}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-row"><span className="cmd-icon">⌘</span><input ref={inputRef} className="cmd-input" placeholder="Type a command..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && filtered.length > 0) select(filtered[0]) }} /><kbd className="cmd-kbd">ESC</kbd></div>
        <div className="cmd-list">{filtered.map(i => <button key={i.label} className="cmd-item" onClick={() => select(i)}><span>{i.icon}</span><span>{i.label}</span>{i.section.startsWith('_') ? <span className="cmd-external">↗</span> : null}</button>)}{filtered.length === 0 && <div className="cmd-empty">No results found</div>}</div>
        <div className="cmd-footer"><span>Navigate</span><span>⏎ Select</span><span>ESC Close</span></div>
      </div>
    </div>
  )
}

/* Konami */
function useKonami(cb) {
  const seq = useRef([]); const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
  useEffect(() => { const k = e => { seq.current.push(e.key); if (seq.current.length > code.length) seq.current.shift(); if (seq.current.join(',') === code.join(',')) { cb(); seq.current = [] } }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [cb])
}
function KonamiOverlay({ show, onClose }) {
  if (!show) return null
  return <div className="konami-overlay" onClick={onClose}><div className="konami-content"><div className="konami-emoji">🎉</div><h3>You found the easter egg!</h3><p>You clearly know your way around a keyboard. Let's build something amazing together!</p><div className="konami-code">↑↑↓↓←→←→BA</div><button className="btn-primary" onClick={onClose}>Nice!</button></div></div>
}

/* ═══════ TECH ICONS ═══════ */
const TI = {
  React: <svg viewBox="0 0 32 32" width="20" height="20"><circle cx="16" cy="16" r="2.5" fill="#61DAFB" /><ellipse cx="16" cy="16" rx="11" ry="4.2" fill="none" stroke="#61DAFB" strokeWidth="1" /><ellipse cx="16" cy="16" rx="11" ry="4.2" fill="none" stroke="#61DAFB" strokeWidth="1" transform="rotate(60 16 16)" /><ellipse cx="16" cy="16" rx="11" ry="4.2" fill="none" stroke="#61DAFB" strokeWidth="1" transform="rotate(120 16 16)" /></svg>,
  Python: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M15.9 3c-3.8 0-3.4 1.6-3.4 1.6v1.7h3.5v.5H9.7S7 6.5 7 10.4s2.4 3.7 2.4 3.7h1.4v-1.8s-.1-2.4 2.3-2.4h4s2.3 0 2.3-2.2V5.2S19.7 3 15.9 3zm-2 1.3a.7.7 0 110 1.4.7.7 0 010-1.4z" fill="#3776AB" /><path d="M16.1 29c3.8 0 3.4-1.6 3.4-1.6v-1.7h-3.5v-.5h6.3S25 25.5 25 21.6s-2.4-3.7-2.4-3.7h-1.4v1.8s.1 2.4-2.3 2.4h-4s-2.3 0-2.3 2.2v2.5S12.3 29 16.1 29zm2-1.3a.7.7 0 110-1.4.7.7 0 010 1.4z" fill="#FFD43B" /></svg>,
  NodeJS: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M16 3.3L5.2 9.5v12.4L16 28.1l10.8-6.2V9.5L16 3.3z" fill="#539E43" /></svg>,
  JavaScript: <svg viewBox="0 0 32 32" width="20" height="20"><rect width="28" height="28" x="2" y="2" rx="1" fill="#F7DF1E" /></svg>,
  MongoDB: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M16.6 3.1c-.3-.6-.6-1-.7-1.1-.1.1-.4.5-.7 1.1C13.1 7.5 9 12.8 12.6 18c1.2 1.7 2.6 2.8 3.4 3.3v4.4s.2.3.3.3h.5c.1 0 .3-.2.3-.3v-4.4c.8-.5 2.2-1.6 3.4-3.3C24.1 12.8 19 7.5 16.6 3.1z" fill="#4FAA41" /></svg>,
  Docker: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M18.4 13.5h3.3v3h1.6c.7 0 1.5-.2 2.2-.5.3-.2.7-.4 1-.7-.4-.6-.7-1.3-.7-2.1 0-1.6.9-2.9 2.2-3.6l.8-.4-.5-.7c-1-1.3-2.5-2.1-4.1-2.2h-.4c-1.2 0-2.4.4-3.3 1.2-.7-.3-1.5-.5-2.3-.5H17v3h-3v-3h-3v3H8v-3H5v3H2.5v3H5v3h3v-3h3v3h3v-3h3v3h1.4v-3z" fill="#2496ED" /></svg>,
  Git: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M29.3 15.1L16.9 2.7c-.5-.5-1.3-.5-1.8 0L12.6 5.2l2.3 2.3c.5-.2 1.1-.1 1.6.3.5.5.5 1.1.3 1.6l2.2 2.2c.5-.2 1.1-.1 1.6.3.6.6.6 1.6 0 2.2-.6.6-1.6.6-2.2 0-.5-.5-.6-1.2-.3-1.7l-2-2v5.4c.1.1.3.2.4.3.6.6.6 1.6 0 2.2-.6.6-1.6.6-2.2 0-.6-.6-.6-1.6 0-2.2.2-.2.4-.3.6-.4v-5.4c-.2-.1-.4-.2-.6-.4-.5-.5-.6-1.2-.3-1.7l-2.3-2.3-6.1 6.1c-.5.5-.5 1.3 0 1.8l12.4 12.4c.5.5 1.3.5 1.8 0L29.3 16.9c.5-.5.5-1.3 0-1.8z" fill="#F05033" /></svg>,
  MySQL: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M16 3C8.8 3 3 8.8 3 16s5.8 13 13 13 13-5.8 13-13S23.2 3 16 3z" fill="none" stroke="#00758F" strokeWidth="2" /><text x="16" y="20" textAnchor="middle" fill="#00758F" fontSize="10" fontWeight="bold">S</text></svg>,
  Java: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M12.3 23.5s-1.3.8.9 1c2.7.3 4-.2 6.9-1 0 0 .8.5 1.8.9-6.3 2.7-14.2-.2-9.6-1zM11.5 20.3s-1.5 1.1.8 1.3c2.9.3 5 .3 8.9-1 0 0 .5.5 1.3.8-7.6 2.2-16.1.2-11-1.1z" fill="#E76F00" /><path d="M18 15.2c1.5 1.7-.4 3.3-.4 3.3s3.8-2 2.1-4.4c-1.7-2.3-2.9-3.4 4-7.4 0 0-10.9 2.7-5.7 8.5z" fill="#E76F00" /></svg>,
  Express: <svg viewBox="0 0 32 32" width="20" height="20"><text x="16" y="20" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="monospace">Ex</text></svg>,
  HTML: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M5 3l2.3 26L16 32l8.7-3L27 3H5z" fill="#E44D26" /><path d="M16 29.5l7-1.9L25 6H16v23.5z" fill="#F16529" /></svg>,
  CSS: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M5 3l2.3 26L16 32l8.7-3L27 3H5z" fill="#264DE4" /><path d="M16 29.5l7-1.9L25 6H16v23.5z" fill="#2965F1" /></svg>,
  Postman: <svg viewBox="0 0 32 32" width="20" height="20"><circle cx="16" cy="16" r="12" fill="#FF6C37" /><path d="M12 16l4-4 4 4-4 4z" fill="#fff" /></svg>,
}

/* ═══════ TECH MARQUEE ═══════ */
function TechMarquee() {
  const techs = [
    { name: 'React', icon: TI.React }, { name: 'Node.js', icon: TI.NodeJS }, { name: 'JavaScript', icon: TI.JavaScript },
    { name: 'Python', icon: TI.Python }, { name: 'Java', icon: TI.Java }, { name: 'MongoDB', icon: TI.MongoDB },
    { name: 'MySQL', icon: TI.MySQL }, { name: 'Express', icon: TI.Express }, { name: 'Git', icon: TI.Git },
    { name: 'HTML', icon: TI.HTML }, { name: 'CSS', icon: TI.CSS }, { name: 'Docker', icon: TI.Docker },
    { name: 'Postman', icon: TI.Postman }, { name: 'REST APIs', icon: '🔌' }, { name: 'JWT', icon: '🔐' }, { name: 'ACA-Py', icon: '🔗' },
  ]
  return (
    <div className="marquee-section">
      <div className="marquee-row"><div className="marquee-track">{[...techs, ...techs].map((t, i) => <div key={i} className="marquee-chip"><span className="marquee-icon">{typeof t.icon === 'string' ? t.icon : t.icon}</span><span>{t.name}</span></div>)}</div></div>
      <div className="marquee-row reverse"><div className="marquee-track">{[...techs.reverse(), ...techs].map((t, i) => <div key={i} className="marquee-chip"><span className="marquee-icon">{typeof t.icon === 'string' ? t.icon : t.icon}</span><span>{t.name}</span></div>)}</div></div>
    </div>
  )
}

/* ═══════ SKILL PORTFOLIO ═══════ */
const SKILL_TABS = [
  {
    id: 'languages', name: 'Languages', color: '#F7DF1E', skills: [
      { name: 'JavaScript', level: 5, icon: TI.JavaScript }, { name: 'Java', level: 4, icon: TI.Java },
      { name: 'C++', level: 4, icon: null }, { name: 'Python', level: 4, icon: TI.Python },
      { name: 'HTML/CSS', level: 5, icon: TI.HTML },
    ]
  },
  {
    id: 'ai_ml', name: 'AI & ML', color: '#ec4899', skills: [
      { name: 'Gemini / OpenAI API', level: 5, icon: '🤖' },
      { name: 'LangChain', level: 4, icon: '🦜' },
      { name: 'ChromaDB / Vector Search', level: 4, icon: '🗂️' },
      { name: 'RAG Systems', level: 4, icon: '🧠' },
      { name: 'Prompt Engineering', level: 5, icon: '⚡' },
    ]
  },
  {
    id: 'frameworks', name: 'Frameworks', color: '#61DAFB', skills: [
      { name: 'Node.js', level: 5, icon: TI.NodeJS }, { name: 'Express.js', level: 5, icon: TI.Express },
      { name: 'React.js', level: 4, icon: TI.React },
      { name: 'Bootstrap', level: 4, icon: null },
    ]
  },
  {
    id: 'database', name: 'Databases', color: '#4FAA41', skills: [
      { name: 'MongoDB', level: 5, icon: TI.MongoDB }, { name: 'MySQL', level: 4, icon: TI.MySQL },
    ]
  },
  {
    id: 'tools', name: 'Tools & Security', color: '#F05033', skills: [
      { name: 'Post-Quantum Cryptography', level: 4, icon: '🔐', levelColor: '#a855f7' },
      { name: 'Git & GitHub', level: 5, icon: TI.Git }, { name: 'Postman', level: 4, icon: TI.Postman },
      { name: 'VS Code', level: 5, icon: null }, { name: 'GitHub Copilot', level: 4, icon: null },
      { name: 'REST APIs', level: 5, icon: null }, { name: 'JWT', level: 4, icon: null },
    ]
  },
]

function SkillTerminal() {
  const [tab, setTab] = useState(0), [show, setShow] = useState(true), [search, setSearch] = useState('')
  const t = SKILL_TABS[tab]
  const sw = i => { if (i === tab) return; setShow(false); setSearch(''); setTimeout(() => { setTab(i); setShow(true) }, 150) }
  const filteredSkills = t.skills.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="modern-skills-card">
      <div className="skills-nav-tabs">
        {SKILL_TABS.map((s, i) => (
          <button 
            key={s.id} 
            className={`skills-tab-btn ${i === tab ? 'active' : ''}`} 
            onClick={() => sw(i)}
            style={i === tab ? { '--active-color': s.color } : {}}
          >
            <span className="skills-tab-dot" style={{ background: s.color }} />
            {s.name}
          </button>
        ))}
      </div>
      <div className="skills-panel-body">
        <div className="skills-panel-header">
          <div className="skills-panel-title">Proficiency in {t.name}</div>
          <div className="skills-search-box">
            <input
              type="text"
              className="skills-search-input"
              placeholder="Search skill..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="skills-search-icon">🔍</span>
          </div>
        </div>
        
        <div className={`skills-list-grid ${show ? 'visible' : ''}`}>
          {filteredSkills.map((s, i) => (
            <div key={s.name} className="skills-list-item" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="skills-item-info">
                <span className="skills-item-icon">{s.icon || '📦'}</span>
                <span className="skills-item-name">{s.name}</span>
              </div>
              <div className="skills-item-progress">
                <div className="skills-dots-indicator">
                  {[...Array(5)].map((_, d) => (
                    <span 
                      key={d} 
                      className={`skills-dot ${d < s.level ? 'filled' : ''}`} 
                      style={d < s.level ? { background: s.levelColor || t.color, boxShadow: `0 0 10px ${(s.levelColor || t.color)}80` } : {}} 
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
          {filteredSkills.length === 0 && (
            <div className="skills-empty-state">No matching skills found.</div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════ PROJECT DATA ═══════ */
const PROJECTS = [
  {
    title: 'AI Career Co-Pilot',
    subtitle: 'Intelligent Resume & Interview Agent',
    category: 'AI & Data Science',
    tech: ['Gemini API', 'LangChain', 'Python', 'ChromaDB', 'FastAPI'],
    color: '#ec4899',
    emoji: '🤖',
    role: 'AI workflow engineering',
    outcome: 'Resume scoring, JD matching, and mock interview practice in one guided flow',
    scope: 'RAG pipeline, vector search, agent orchestration',
    impact: 'Built an end-to-end career assistant that parses resumes, compares job descriptions, and generates interview prep from grounded context.',
    highlights: [
      'Built a RAG pipeline for custom resume parsing, semantic matching, and scoring',
      'Developed an automated mock interviewer chatbot using Gemini API and tool-calling agent chains',
      'Integrated vector embeddings using Chroma DB to query local job description datasets',
    ],
    github: 'https://github.com/Hrishi71',
    demo: '#',
  },
  {
    title: 'PQC Cryptographic Gateway',
    subtitle: 'Post-Quantum Cryptography Migration Suite',
    category: 'Security & Systems',
    tech: ['React.js', 'Node.js', 'WebCrypto', 'Kyber (ML-KEM)', 'Dilithium (ML-DSA)', 'Python'],
    color: '#8b5cf6',
    emoji: '🔐',
    role: 'Cryptographic systems & frontend build',
    outcome: 'Quantum-resistant microservices and cipher compliance monitoring dashboard',
    scope: 'Kyber key exchange, Dilithium digital signatures, compliance UI',
    impact: 'Engineered a security suite enabling enterprise migration to post-quantum cryptography, complete with real-time cipher health tracking and fallback tunnels.',
    highlights: [
      'Designed and integrated Kyber (ML-KEM) and Dilithium (ML-DSA) algorithms in secure backend API gateways',
      'Developed a highly responsive React dashboard to audit cryptographic compliance and alert on legacy cipher use',
      'Implemented automated script libraries to tunnel legacy HTTP/SSH connections through quantum-resistant channels',
    ],
    github: 'https://github.com/Hrishi71',
    demo: '#',
  },
  {
    title: 'Learning Management System',
    subtitle: 'Full-Stack MERN Application',
    category: 'Full-Stack',
    tech: ['MongoDB', 'Express.js', 'React.js', 'Node.js'],
    color: '#6366f1',
    emoji: '🎓',
    role: 'Full-stack product build',
    outcome: 'Role-based LMS workflows for students, instructors, and admins',
    scope: 'Auth, REST APIs, dashboards, CRUD modules',
    impact: 'Designed and built a MERN learning platform with secure access, course operations, and dashboards for different user roles.',
    highlights: [
      'Built full-featured LMS with secure JWT login & role-based access',
      'Created REST APIs for managing users, assignments, and courses',
      'Implemented dashboards for students and instructors',
    ],
    github: 'https://github.com/Hrishi71',
    demo: '#',
  },
  {
    title: 'Library Management System',
    subtitle: 'QR Code Integration',
    category: 'Full-Stack',
    tech: ['Node.js', 'MySQL', 'JavaScript', 'HTML', 'Bootstrap'],
    color: '#10b981',
    emoji: '📚',
    role: 'Operational web tooling',
    outcome: 'QR-assisted book tracking and inventory workflows',
    scope: 'Backend modules, MySQL schema, reporting UI',
    impact: 'Created a library operations system that improves check-in/out speed and gives administrators cleaner inventory visibility.',
    highlights: [
      'Integrated QR code scanning for seamless book management',
      'Developed frontend and backend modules for user check-in/out',
      'Built inventory tracking and reporting features',
    ],
    github: 'https://github.com/Hrishi71',
    demo: '#',
  },
  {
    title: 'News Website',
    subtitle: 'Real-Time News Portal',
    category: 'Frontend & UI',
    tech: ['HTML', 'CSS', 'Bootstrap', 'JavaScript', 'NewsAPI'],
    color: '#f59e0b',
    emoji: '📰',
    role: 'Frontend interface build',
    outcome: 'Real-time searchable news experience with category filtering',
    scope: 'API integration, async states, responsive UI',
    impact: 'Built a responsive news portal that fetches live stories, supports search/category discovery, and handles dynamic loading states.',
    highlights: [
      'Fetched real-time news using News API with async calls',
      'Implemented search and category-based filtering in UI',
      'Responsive design with dynamic loading states',
    ],
    github: 'https://github.com/Hrishi71',
    demo: '#',
  },
]

/* ═══════ PROJECT CAROUSEL SHOWCASE ═══════ */
function ProjectCarousel() {
  const [filter, setFilter] = useState('All')
  const [activeIdx, setActiveIdx] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const dragStartX = useRef(0)
  const autoPlayRef = useRef(null)
  const containerRef = useRef(null)

  const categories = [
    { value: 'All', label: 'All', icon: '◈' },
    { value: 'AI & Data Science', label: 'AI & ML', icon: '⚡' },
    { value: 'Full-Stack', label: 'Full-Stack', icon: '⬡' },
    { value: 'Security & Systems', label: 'Security', icon: '◆' },
    { value: 'Frontend & UI', label: 'Frontend', icon: '◇' },
  ]

  const filtered = filter === 'All' ? PROJECTS : PROJECTS.filter(p => p.category === filter)
  const project = filtered[activeIdx] || filtered[0]

  // Reset index when filter changes
  useEffect(() => { setActiveIdx(0); setExpanded(false) }, [filter])

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || filtered.length <= 1) return
    autoPlayRef.current = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % filtered.length)
    }, 4500)
    return () => clearInterval(autoPlayRef.current)
  }, [isAutoPlaying, filtered.length, filter])

  // Keyboard nav
  useEffect(() => {
    const handler = e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const goNext = () => { setActiveIdx(prev => (prev + 1) % filtered.length); setExpanded(false) }
  const goPrev = () => { setActiveIdx(prev => (prev - 1 + filtered.length) % filtered.length); setExpanded(false) }
  const goTo = (i) => { setActiveIdx(i); setExpanded(false) }

  // Drag / swipe
  const onDragStart = (e) => {
    setIsDragging(true)
    setIsAutoPlaying(false)
    dragStartX.current = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
  }
  const onDragMove = (e) => {
    if (!isDragging) return
    const x = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
    setDragOffset(x - dragStartX.current)
  }
  const onDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (Math.abs(dragOffset) > 60) {
      if (dragOffset < 0) goNext()
      else goPrev()
    }
    setDragOffset(0)
    setTimeout(() => setIsAutoPlaying(true), 3000)
  }

  const getCardStyle = (i) => {
    const total = filtered.length
    let diff = i - activeIdx
    // Wrap around for circular feel
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total

    const absD = Math.abs(diff)
    const offsetX = diff * 320 + (isDragging ? dragOffset * 0.4 : 0)
    const scale = absD === 0 ? 1 : absD === 1 ? 0.85 : 0.7
    const opacity = absD === 0 ? 1 : absD === 1 ? 0.6 : absD === 2 ? 0.3 : 0
    const rotateY = diff * -8
    const z = absD === 0 ? 40 : absD === 1 ? 20 : 0
    const blur = absD === 0 ? 0 : absD * 2

    return {
      transform: `translateX(${offsetX}px) scale(${scale}) rotateY(${rotateY}deg) translateZ(${z}px)`,
      opacity,
      filter: blur > 0 ? `blur(${blur}px)` : 'none',
      zIndex: 10 - absD,
      pointerEvents: absD === 0 ? 'auto' : 'none',
      transition: isDragging ? 'none' : 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    }
  }

  return (
    <div className="proj-showcase" ref={containerRef}>
      {/* Filter bar */}
      <div className="proj-filter-bar">
        {categories.map(cat => (
          <button
            key={cat.value}
            className={`proj-filter-chip ${filter === cat.value ? 'active' : ''}`}
            onClick={() => setFilter(cat.value)}
          >
            <span className="proj-filter-icon">{cat.icon}</span>
            <span>{cat.label}</span>
            <span className="proj-filter-count">
              {cat.value === 'All' ? PROJECTS.length : PROJECTS.filter(p => p.category === cat.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* 3D Carousel */}
      <div
        className="proj-carousel-stage"
        onMouseDown={onDragStart}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => { onDragEnd(); setIsAutoPlaying(true) }}
      >
        {/* Nav arrows */}
        <button className="proj-nav-arrow proj-nav-prev" onClick={(e) => { e.stopPropagation(); goPrev() }} aria-label="Previous project">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>

        <div className="proj-carousel-perspective">
          {filtered.map((p, i) => (
            <div
              key={`${filter}-${i}`}
              className={`proj-carousel-card ${i === activeIdx ? 'active' : ''}`}
              style={{ ...getCardStyle(i), '--card-color': p.color }}
              onClick={() => i === activeIdx ? setExpanded(!expanded) : goTo(i)}
            >
              {/* Top accent line */}
              <div className="proj-card-accent" />

              {/* Ambient glow */}
              <div className="proj-card-glow-orb" />

              {/* Header */}
              <div className="proj-card-head">
                <div className="proj-card-number">{String(PROJECTS.indexOf(p) + 1).padStart(2, '0')}</div>
                <div className="proj-card-cat-badge">{p.category}</div>
                <span className="proj-card-emoji-float">{p.emoji}</span>
              </div>

              {/* Title block */}
              <div className="proj-card-body">
                <h3 className="proj-card-title">{p.title}</h3>
                <p className="proj-card-sub">{p.subtitle}</p>
                <p className="proj-card-desc">{p.impact}</p>
              </div>

              {/* Tech stack */}
              <div className="proj-card-tech-row">
                {p.tech.map(t => <span key={t} className="proj-tech-tag">{t}</span>)}
              </div>

              {/* Footer */}
              <div className="proj-card-foot">
                <div className="proj-card-links-row">
                  <a href={p.github} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="proj-link-btn" title="GitHub">
                    {Icon.github}
                  </a>
                  <a href={p.demo} onClick={e => e.stopPropagation()} className="proj-link-btn" title="Demo">
                    {Icon.arrow}
                  </a>
                </div>
                <button className="proj-expand-hint" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}>
                  {expanded && i === activeIdx ? 'Collapse' : 'Details'} <span>{expanded && i === activeIdx ? '↑' : '↓'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="proj-nav-arrow proj-nav-next" onClick={(e) => { e.stopPropagation(); goNext() }} aria-label="Next project">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Progress indicators */}
      <div className="proj-indicators">
        {filtered.map((_, i) => (
          <button
            key={i}
            className={`proj-indicator ${i === activeIdx ? 'active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to project ${i + 1}`}
          >
            {i === activeIdx && isAutoPlaying && <div className="proj-indicator-fill" />}
          </button>
        ))}
      </div>

      {/* Counter */}
      <div className="proj-counter">
        <span className="proj-counter-current">{String(activeIdx + 1).padStart(2, '0')}</span>
        <span className="proj-counter-sep">/</span>
        <span className="proj-counter-total">{String(filtered.length).padStart(2, '0')}</span>
      </div>

      {/* Expanded detail panel */}
      <div className={`proj-detail-panel ${expanded ? 'open' : ''}`} style={{ '--card-color': project?.color }}>
        {project && (
          <>
            <div className="proj-detail-header">
              <div>
                <span className="proj-detail-role">{project.role}</span>
                <h3>{project.title}</h3>
              </div>
              <button className="proj-detail-close" onClick={() => setExpanded(false)}>✕</button>
            </div>

            <div className="proj-detail-grid">
              <div className="proj-detail-col">
                <div className="proj-detail-block">
                  <span className="proj-detail-label">Outcome</span>
                  <p>{project.outcome}</p>
                </div>
                <div className="proj-detail-block">
                  <span className="proj-detail-label">Scope</span>
                  <p>{project.scope}</p>
                </div>
              </div>

              <div className="proj-detail-col">
                <span className="proj-detail-label">Key Highlights</span>
                <ul className="proj-detail-highlights">
                  {project.highlights.map((h, i) => (
                    <li key={i}>
                      <span className="proj-highlight-marker">▸</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ═══════ METRO MAP EXPERIENCE ═══════ */
const EXPERIENCE = [
  {
    hash: 'a3f7e2d', date: 'Feb 2025 — Present', branch: 'HEAD → main', title: 'Systems Engineer', company: 'Tata Consultancy Services (TCS)', location: 'India',
    desc: 'Developing Post-Quantum Cryptography (PQC) migration solutions for enterprise security frameworks. Designing secure backend microservices using Node.js and Python to manage quantum-resistant key exchanges (ML-KEM) and signature schemes (ML-DSA). Engineering responsive dashboards using React for real-time cryptographic audit compliance.',
    tags: ['PQC', 'React', 'Node.js', 'Post-Quantum', 'Cryptography'], additions: 1142, deletions: 89
  },
  {
    hash: 'b8c1f4a', date: 'Jun 2023 — Aug 2023', branch: 'feature/internship', title: 'Full Stack Web Developer Intern', company: 'ThinkTechno Systems Pvt. Ltd.', location: 'Bangalore, India',
    desc: 'Developed a startup website using HTML, CSS, and JavaScript. Created RESTful APIs with Node.js and Express. Integrated secure JWT login with role-based access control.',
    tags: ['Node.js', 'Express', 'JWT', 'REST APIs'], additions: 2340, deletions: 456
  },
]

function GitLogTimeline() {
  return (
    <div className="metro-container">
      {EXPERIENCE.map((exp, i) => (
        <Reveal key={i} delay={i * 120}>
          <div className="metro-station">
            <div className="metro-line-wrapper">
              <div className="metro-node">
                <div className="metro-pulse" />
              </div>
              {i < EXPERIENCE.length - 1 && <div className="metro-line" />}
            </div>
            <div className="metro-info">
              <div className="metro-time">{exp.date}</div>
              <div className="metro-card">
                <div className="metro-card-header">
                  <div className="git-commit-meta">
                    <span className="git-commit-hash">commit {exp.hash}</span>
                    <span className="git-branch-tag">{exp.branch}</span>
                    <span className="git-diff-stats">
                      <span className="diff-add">+{exp.additions}</span>
                      <span className="diff-del">-{exp.deletions}</span>
                    </span>
                  </div>
                  <h4>{exp.title}</h4>
                  <div className="metro-company">{exp.company}</div>
                </div>
                <p>{exp.desc}</p>
                <div className="metro-tags">
                  {exp.tags.map(t => <span key={t} className="metro-tag">{t}</span>)}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

/* ═══════ MODERN CONTACT FORM ═══════ */
function TerminalContact() {
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [msg, setMsg] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [status, setStatus] = useState(null)

  const handleSubmit = e => {
    e.preventDefault()
    if (isSending) return
    setIsSending(true)
    setStatus('sending')

    setTimeout(() => {
      setStatus('success')
      setIsSending(false)
      setName('')
      setEmail('')
      setMsg('')
    }, 1200)
  }

  return (
    <div className="modern-contact-card">
      <div className="contact-card-header">
        <h3 className="contact-card-title">Send a Message</h3>
        <p className="contact-card-sub">Or email me directly at <a href={`mailto:${ME.email}`} className="contact-email-link">{ME.email}</a></p>
      </div>
      <form onSubmit={handleSubmit} className="modern-contact-form">
        <div className="form-group">
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder=" "
            id="contact-name"
            disabled={isSending}
            required
          />
          <label htmlFor="contact-name" className="form-label">Full Name</label>
        </div>
        <div className="form-group">
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder=" "
            id="contact-email"
            disabled={isSending}
            required
          />
          <label htmlFor="contact-email" className="form-label">Email Address</label>
        </div>
        <div className="form-group">
          <textarea
            className="form-input form-textarea"
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder=" "
            id="contact-msg"
            rows="4"
            disabled={isSending}
            required
          />
          <label htmlFor="contact-msg" className="form-label">Message Details</label>
        </div>

        <button type="submit" className="form-submit-btn" disabled={isSending}>
          {isSending ? (
            <span className="btn-loading">Sending payload...</span>
          ) : (
            <span className="btn-text">
              Send Message <span className="btn-arrow">→</span>
            </span>
          )}
        </button>

        {status === 'success' && (
          <div className="contact-status-msg success">
            <span className="status-icon">✓</span>
            <div>
              <strong>Message delivered successfully!</strong>
              <p>Thank you. I'll reach out to you at {email} shortly.</p>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

/* ═══════ ICONS ═══════ */
const Icon = {
  github: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>,
  linkedin: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>,
  mail: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  location: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
}

/* ═══════ DATA ═══════ */
const ME = {
  name: 'Hrishikesh', full: 'Hrishikesh Anant Deshpande',
  email: 'hrishideshpande150@gmail.com', location: 'Pune, MH — India',
  github: 'https://github.com/Hrishi71', linkedin: 'https://www.linkedin.com/in/hrishid150',
}

const ACHIEVEMENTS = [
  { icon: '⭐', text: '5★ Problem Solving — HackerRank' },
  { icon: '⭐', text: '4★ C Programming — HackerRank' },
  { icon: '🥈', text: '2nd Place — "Mind Your Code!" Coding Contest' },
  { icon: '🥉', text: '3rd Place — BGMIT Coding Competition' },
  { icon: '🥈', text: '2nd Place — TECHNOPHILIA by RISE' },
]

const CERTS = [
  'Intro to Programming with C++ — NPTEL',
  'Learning Python — LinkedIn',
  'Communication Skills — TCS-iON Digital',
]

const ACTIVITIES = [
  'Secretary — RISE Association',
  'Lead Volunteer — BEC-IEEE',
  'Organizer — TECHNOPHILIA 2.0',
  'Secretary — SIGHT at BEC-IEEE',
]

/* ═══════ PQC SECURITY VISUAL ═══════ */
function PQCSecurityVisual() {
  const [entropy, setEntropy] = useState('0x00000000')
  const [latency, setLatency] = useState(1.4)

  useEffect(() => {
    const t = setInterval(() => {
      setEntropy('0x' + Math.random().toString(16).slice(2, 10).toUpperCase())
      setLatency(parseFloat((1.2 + Math.random() * 0.4).toFixed(2)))
    }, 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="pqc-security-card">
      <div className="pqc-card-header">
        <div className="pqc-indicator">
          <span className="pqc-pulse-dot" />
          <span className="pqc-status-text">SECURE FALLBACK (PQC-KEM)</span>
        </div>
        <div className="pqc-cipher-badge">ML-KEM-768</div>
      </div>
      <div className="pqc-card-body">
        <div className="pqc-metric-row">
          <span className="pqc-metric-label">Resistance Status:</span>
          <span className="pqc-metric-val secure">Post-Quantum Active</span>
        </div>
        <div className="pqc-metric-row">
          <span className="pqc-metric-label">Lattice Cipher:</span>
          <span className="pqc-metric-val">Kyber-768 (ML-KEM)</span>
        </div>
        <div className="pqc-metric-row">
          <span className="pqc-metric-label">Key Exchange Entropy:</span>
          <span className="pqc-metric-val code">{entropy}</span>
        </div>
        <div className="pqc-metric-row">
          <span className="pqc-metric-label">Migration Overhead:</span>
          <span className="pqc-metric-val">+{latency}ms</span>
        </div>

        <div className="pqc-visual-art">
          <svg viewBox="0 0 200 100" className="pqc-svg">
            <defs>
              <linearGradient id="latticeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {[...Array(5)].map((_, i) =>
              [...Array(3)].map((_, j) => {
                const cx = 20 + i * 40
                const cy = 20 + j * 30
                return (
                  <g key={`${i}-${j}`}>
                    <circle cx={cx} cy={cy} r="2" fill="#8b5cf6" className="lattice-point" />
                    {i < 4 && (
                      <line x1={cx} y1={cy} x2={cx + 40} y2={cy} stroke="rgba(139, 92, 246, 0.15)" strokeWidth="1" className="lattice-line" />
                    )}
                    {j < 2 && (
                      <line x1={cx} y1={cy} x2={cx} y2={cy + 30} stroke="rgba(139, 92, 246, 0.15)" strokeWidth="1" className="lattice-line" />
                    )}
                    {i < 4 && j < 2 && (
                      <line x1={cx} y1={cy} x2={cx + 40} y2={cy + 30} stroke="rgba(6, 182, 212, 0.1)" strokeWidth="0.5" />
                    )}
                  </g>
                )
              })
            )}
            <path d="M 20,20 Q 100,80 180,20" fill="none" stroke="url(#latticeGrad)" strokeWidth="2" strokeDasharray="5,5" className="kem-pulse-path" />
            <circle r="4" fill="#a78bfa" className="kem-particle">
              <animateMotion dur="4s" repeatCount="indefinite" path="M 20,20 Q 100,80 180,20" />
            </circle>
          </svg>
        </div>
      </div>
    </div>
  )
}

/* ═══════ APP ═══════ */
function App() {
  const [loaded, setLoaded] = useState(false), [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false), [activeSection, setActiveSection] = useState('home')
  const [konamiShow, setKonamiShow] = useState(false), [aboutTab, setAboutTab] = useState('about')
  const typed = useTyping(['Systems Engineer @ TCS', 'Full Stack Developer', 'Problem Solver', 'JavaScript & Node.js Dev'])
  useKonami(useCallback(() => setKonamiShow(true), []))
  const heroMeshRef = useRef(null)

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 50)
      for (const id of ['contact', 'experience', 'projects', 'skills', 'about', 'home']) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 200) {
          setActiveSection(id)
          break
        }
      }
      if (heroMeshRef.current) {
        const yVal = window.scrollY * 0.4
        heroMeshRef.current.style.transform = `translate3d(0, ${yVal}px, 0)`
      }
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const scrollTo = useCallback(id => { setMobileMenu(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }, [])
  const scrollToE = useCallback((e, id) => { e.preventDefault(); scrollTo(id) }, [scrollTo])
  /* Stats counter — always trigger on load (hero is always visible) */
  const cP = useCounter(6, 1500, loaded), cT = useCounter(15, 1800, loaded), cS = useCounter(100, 2200, loaded)

  if (!loaded) return <Preloader onDone={() => setLoaded(true)} />
  return (
    <div className="app">
      <InteractiveParticles />
      <CursorGlow /><ScrollProgress /><BackToTop />
      <CommandPalette onNavigate={scrollTo} />
      <KonamiOverlay show={konamiShow} onClose={() => setKonamiShow(false)} />

      {/* NAV */}
      <nav className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-container">
          <a href="#home" className="logo" onClick={e => scrollToE(e, 'home')}>HD</a>
          <ul className={`nav-menu ${mobileMenu ? 'open' : ''}`}>
            {['Home', 'About', 'Skills', 'Projects', 'Experience', 'Contact'].map(x => <li key={x}><a href={`#${x.toLowerCase()}`} className={activeSection === x.toLowerCase() ? 'active' : ''} onClick={e => scrollToE(e, x.toLowerCase())}>{x}</a></li>)}
          </ul>
          <div className="nav-actions">
            <button className="nav-cmd-btn" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))} title="Ctrl+K"><span>⌘K</span></button>
            <a href="#contact" className="nav-cta" onClick={e => scrollToE(e, 'contact')}>Get in Touch</a>
            <button className={`hamburger ${mobileMenu ? 'open' : ''}`} onClick={() => setMobileMenu(!mobileMenu)}><span /><span /><span /></button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" className="hero">
        <div ref={heroMeshRef} className="hero-mesh-glow" />
        <div className="hero-container-modern">
          <div className="hero-left">
            <div className="hero-badge"><span className="status-dot" />Systems Engineer @ TCS</div>
            <p className="hero-typing"><span className="typing-pre">&gt;</span> {typed}<span className="typing-cursor">|</span></p>
            <h1 className="hero-h1">Hi, I'm <span className="hero-name">{ME.name}</span><br />I build <span className="hero-gradient">secure & scalable apps</span></h1>
            <p className="hero-desc">Software developer skilled in Node.js, React, JavaScript, and Java. Currently working on Post-Quantum Cryptography (PQC) integration, API security, and dashboard monitoring at TCS.</p>
            <div className="hero-btns">
              <a href="#projects" className="btn-primary" onClick={e => scrollToE(e, 'projects')}>View Projects {Icon.arrow}</a>
              <a href="#contact" className="btn-secondary" onClick={e => scrollToE(e, 'contact')}>Get in Touch</a>
              <a href="#" className="btn-ghost">{Icon.download} Resume</a>
            </div>
            <div className="hero-stats">
              <div className="h-stat-card"><span className="h-stat-num">{cP}+</span><span className="h-stat-lbl">Projects Shipped</span></div>
              <div className="h-stat-card"><span className="h-stat-num">{cT}+</span><span className="h-stat-lbl">Technologies</span></div>
              <div className="h-stat-card"><span className="h-stat-num">{cS}+</span><span className="h-stat-lbl">Problems Solved</span></div>
            </div>
            <div className="hero-socials">
              {[{ h: ME.github, i: Icon.github, t: 'GitHub' }, { h: ME.linkedin, i: Icon.linkedin, t: 'LinkedIn' }, { h: `mailto:${ME.email}`, i: Icon.mail, t: 'Email' }].map(s => (
                <a key={s.t} href={s.h} target={s.h.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer" className="hero-soc" title={s.t}>{s.i}</a>
              ))}
            </div>
          </div>
          <div className="hero-right">
            <PQCSecurityVisual />
          </div>
        </div>
      </section>

      {/* ABOUT — Interactive Dev Profile */}
      <section id="about" className="section">
        <div className="container">
          <Reveal><span className="sec-label">About</span><h2 className="sec-heading">Who I am</h2></Reveal>
          <Reveal delay={100}>
            <div className="about-card">
              <div className="about-card-left">
                <div className="about-photo-frame"><img src="/images/profile.png" alt={ME.full} /></div>
                <h3 className="about-card-name">{ME.full}</h3>
                <p className="about-card-role">Systems Engineer @ TCS</p>
                <div className="about-card-loc">{Icon.location} {ME.location}</div>
                <div className="about-card-links">
                  <a href={ME.github} target="_blank" rel="noopener noreferrer">{Icon.github}</a>
                  <a href={ME.linkedin} target="_blank" rel="noopener noreferrer">{Icon.linkedin}</a>
                  <a href={`mailto:${ME.email}`}>{Icon.mail}</a>
                </div>
              </div>
              <div className="about-card-right">
                <div className="about-tabs">
                  {[{ id: 'about', label: 'About' }, { id: 'achievements', label: 'Achievements' }, { id: 'certs', label: 'Certifications' }, { id: 'activities', label: 'Activities' }].map(t => (
                    <button key={t.id} className={`about-tab ${aboutTab === t.id ? 'active' : ''}`} onClick={() => setAboutTab(t.id)}>{t.label}</button>
                  ))}
                </div>
                <div className="about-tab-content">
                  {aboutTab === 'about' && (
                    <div className="about-text">
                      <p>Enthusiastic software developer currently working at <strong>Tata Consultancy Services</strong> on Hyperledger Aries Cloud Agent Python (ACA-Py) for decentralized digital identity solutions.</p>
                      <p>Passionate about building secure, scalable applications using Node.js, React, and modern web technologies. Completed my B.E. in Information Science from <strong>Basaveshwara Engineering College</strong>, Bagalkote (2020–2024).</p>
                      <div className="about-edu">
                        <div className="about-edu-icon">🎓</div>
                        <div>
                          <div className="about-edu-title">B.E. Information Science & Engineering</div>
                          <div className="about-edu-school">Basaveshwara Engineering College, Bagalkote</div>
                          <div className="about-edu-year">2020 — 2024</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {aboutTab === 'achievements' && (
                    <div className="about-achievements">{ACHIEVEMENTS.map((a, i) => <div key={i} className="achievement-item"><span>{a.icon}</span><span>{a.text}</span></div>)}</div>
                  )}
                  {aboutTab === 'certs' && (
                    <div className="about-certs">{CERTS.map((c, i) => <div key={i} className="cert-item"><span className="cert-badge">📜</span><span>{c}</span></div>)}</div>
                  )}
                  {aboutTab === 'activities' && (
                    <div className="about-activities">{ACTIVITIES.map((a, i) => <div key={i} className="activity-item"><span className="activity-dot" /><span>{a}</span></div>)}</div>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Reveal><TechMarquee /></Reveal>

      {/* SKILLS */}
      <section id="skills" className="section section-alt">
        <div className="container">
          <Reveal><span className="sec-label">Skills</span><h2 className="sec-heading">My toolkit</h2><p className="sec-sub">Click the tabs to explore my tech stack</p></Reveal>
          <Reveal delay={150}><SkillTerminal /></Reveal>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="section">
        <div className="container">
          <Reveal><span className="sec-label">Projects</span><h2 className="sec-heading">Proof of work</h2><p className="sec-sub">Selected builds showcasing architecture, ownership, and measurable outcomes.</p></Reveal>
          <Reveal delay={150}><ProjectCarousel /></Reveal>
          <Reveal delay={250}><div className="projects-footer"><a href={ME.github} className="btn-secondary" target="_blank" rel="noopener noreferrer">More on GitHub {Icon.github}</a></div></Reveal>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section id="experience" className="section section-alt">
        <div className="container">
          <Reveal><span className="sec-label">Experience</span><h2 className="sec-heading">My journey so far</h2></Reveal>
          <Reveal delay={100}><GitLogTimeline /></Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container"><Reveal>
          <div className="cta-card"><h2>Let's build something great together</h2><p>I'm always looking for exciting challenges and collaborations.</p>
            <div className="cta-btns"><a href="#contact" className="btn-primary" onClick={e => scrollToE(e, 'contact')}>Let's Talk {Icon.arrow}</a><a href={`mailto:${ME.email}`} className="btn-secondary">Email Me {Icon.mail}</a></div>
          </div>
        </Reveal></div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section section-alt">
        <div className="container">
          <Reveal><span className="sec-label">Contact</span><h2 className="sec-heading">Let's connect</h2></Reveal>
          <div className="contact-grid">
            <Reveal delay={100}>
              <div className="contact-info">
                <p>I'm always open to new opportunities and interesting projects.</p>
                <div className="contact-links">
                  {[{ h: `mailto:${ME.email}`, i: Icon.mail, l: 'Email', v: ME.email }, { h: ME.linkedin, i: Icon.linkedin, l: 'LinkedIn', v: 'in/hrishid150' }, { h: ME.github, i: Icon.github, l: 'GitHub', v: 'Hrishi71' }].map(c => (
                    <a key={c.l} href={c.h} target={c.h.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer" className="contact-ch"><div className="contact-ch-icon">{c.i}</div><div><div className="contact-ch-label">{c.l}</div><div className="contact-ch-val">{c.v}</div></div></a>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={200}><TerminalContact /></Reveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-left"><span className="logo">HD</span><p>© {new Date().getFullYear()} {ME.full}</p></div>
          <div className="footer-center"><div className="built-with">Built with <span className="built-icon">{TI.React}</span> React + Vite</div></div>
          <div className="footer-right">{[{ h: ME.github, i: Icon.github }, { h: ME.linkedin, i: Icon.linkedin }, { h: `mailto:${ME.email}`, i: Icon.mail }].map((s, i) => <a key={i} href={s.h} target={s.h.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer" className="footer-soc">{s.i}</a>)}</div>
        </div>
      </footer>
    </div>
  )
}

export default App
