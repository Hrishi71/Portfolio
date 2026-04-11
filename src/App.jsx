import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

/* ═══════ HOOKS ═══════ */
function useReveal(threshold = 0.1) {
  const ref = useRef(null), [vis, setVis] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, vis]
}

function useCounter(target, duration = 2000, active = true) {
  const [count, setCount] = useState(0), started = useRef(false)
  useEffect(() => {
    if (!active || started.current) return
    started.current = true
    const start = performance.now()
    const step = now => {
      const progress = Math.min((now - start) / duration, 1)
      setCount(Math.floor((1 - Math.pow(1 - progress, 3)) * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, active])
  return count
}

function useTyping(strings, typeSpeed = 80, deleteSpeed = 40, pause = 2500) {
  const [text, setText] = useState('')
  const [index, setIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    const current = strings[index]
    let timer
    if (!deleting) {
      if (text.length < current.length) timer = setTimeout(() => setText(current.slice(0, text.length + 1)), typeSpeed)
      else timer = setTimeout(() => setDeleting(true), pause)
    } else {
      if (text.length > 0) timer = setTimeout(() => setText(current.slice(0, text.length - 1)), deleteSpeed)
      else { setDeleting(false); setIndex((index + 1) % strings.length) }
    }
    return () => clearTimeout(timer)
  }, [text, deleting, index, strings, typeSpeed, deleteSpeed, pause])
  return text
}

/* ═══════ ANIMATION WRAPPERS ═══════ */
function Reveal({ children, className = '', delay = 0 }) {
  const [ref, vis] = useReveal()
  return <div ref={ref} className={`reveal ${vis ? 'visible' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>
}
function Fade({ children, index = 0 }) {
  const [ref, vis] = useReveal()
  return <div ref={ref} className={`fade-item ${vis ? 'visible' : ''}`} style={{ transitionDelay: `${index * 80}ms` }}>{children}</div>
}

/* ═══════ SMALL COMPONENTS ═══════ */
function ScrollProgress() {
  const [w, setW] = useState(0)
  useEffect(() => {
    const fn = () => { const h = document.documentElement.scrollHeight - window.innerHeight; setW(h > 0 ? (window.scrollY / h) * 100 : 0) }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return <div className="scroll-progress" style={{ width: `${w}%` }}/>
}

function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => { const fn = () => setShow(window.scrollY > 600); window.addEventListener('scroll', fn, { passive: true }); return () => window.removeEventListener('scroll', fn) }, [])
  return (
    <button className={`back-to-top ${show ? 'visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
    </button>
  )
}

function Toast({ msg, show, onClose }) {
  useEffect(() => { if (show) { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) } }, [show, onClose])
  return <div className={`toast ${show ? 'show' : ''}`}><span>✓</span> {msg}<button onClick={onClose}>×</button></div>
}

/* ═══════ TECH ICONS (SVG) ═══════ */
const TechIcons = {
  React: <svg viewBox="0 0 32 32" width="20" height="20"><circle cx="16" cy="15.97" r="2.5" fill="#61DAFB"/><ellipse cx="16" cy="15.97" rx="11" ry="4.2" fill="none" stroke="#61DAFB" strokeWidth="1"/><ellipse cx="16" cy="15.97" rx="11" ry="4.2" fill="none" stroke="#61DAFB" strokeWidth="1" transform="rotate(60 16 15.97)"/><ellipse cx="16" cy="15.97" rx="11" ry="4.2" fill="none" stroke="#61DAFB" strokeWidth="1" transform="rotate(120 16 15.97)"/></svg>,
  Python: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M15.9 3c-3.8 0-3.4 1.6-3.4 1.6v1.7h3.5v.5H9.7S7 6.5 7 10.4s2.4 3.7 2.4 3.7h1.4v-1.8s-.1-2.4 2.3-2.4h4s2.3 0 2.3-2.2V5.2S19.7 3 15.9 3zm-2 1.3a.7.7 0 110 1.4.7.7 0 010-1.4z" fill="#3776AB"/><path d="M16.1 29c3.8 0 3.4-1.6 3.4-1.6v-1.7h-3.5v-.5h6.3S25 25.5 25 21.6s-2.4-3.7-2.4-3.7h-1.4v1.8s.1 2.4-2.3 2.4h-4s-2.3 0-2.3 2.2v2.5S12.3 29 16.1 29zm2-1.3a.7.7 0 110-1.4.7.7 0 010 1.4z" fill="#FFD43B"/></svg>,
  TypeScript: <svg viewBox="0 0 32 32" width="20" height="20"><rect width="28" height="28" x="2" y="2" rx="2" fill="#3178C6"/><path d="M18.5 22.5v2.8c.5.2 1 .4 1.6.5.6.1 1.2.2 1.8.2s1.2-.1 1.7-.2c.5-.2 1-.4 1.4-.7.4-.3.7-.7.9-1.2.2-.5.3-1 .3-1.6s-.1-1-.3-1.4c-.2-.4-.5-.7-.8-1-.3-.3-.7-.5-1.1-.7-.4-.2-.8-.4-1.3-.6-.3-.1-.6-.3-.8-.4-.2-.1-.4-.3-.5-.4-.1-.1-.2-.3-.3-.4 0-.2-.1-.3-.1-.5s0-.3.1-.5c.1-.1.2-.3.3-.4.1-.1.3-.2.5-.2.2-.1.4-.1.7-.1.2 0 .4 0 .6.1.2 0 .4.1.6.2.2.1.4.2.5.3.2.1.3.3.4.4v-2.6c-.4-.2-.9-.3-1.4-.4-.5-.1-1.1-.1-1.6-.1-.6 0-1.2.1-1.7.3-.5.2-1 .4-1.3.7-.4.3-.7.7-.9 1.1-.2.5-.3 1-.3 1.6 0 .8.2 1.5.7 2 .5.6 1.2 1 2.1 1.4.4.1.7.3 1 .4.3.2.5.3.7.5.2.2.3.3.4.5.1.2.1.3.1.5s0 .3-.1.5c-.1.1-.2.3-.3.4-.1.1-.3.2-.6.2-.2.1-.5.1-.8.1-.5 0-1.1-.1-1.6-.4-.5-.3-.9-.6-1.2-1.1zM13.5 15.3h3v-2.1H8v2.1h3v9.2h2.5v-9.2z" fill="#fff"/></svg>,
  NodeJS: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M16 3.3L5.2 9.5v12.4L16 28.1l10.8-6.2V9.5L16 3.3z" fill="#539E43"/><path d="M16 3.3v24.8l10.8-6.2V9.5L16 3.3z" fill="#417E38"/><path d="M16 16l-5 2.9v-5.8L16 10l5 2.9v5.8L16 22z" fill="#fff" opacity=".15"/></svg>,
  JavaScript: <svg viewBox="0 0 32 32" width="20" height="20"><rect width="28" height="28" x="2" y="2" rx="1" fill="#F7DF1E"/><path d="M9.3 24.8l2.2-1.3c.4.8 .8 1.4 1.7 1.4.9 0 1.4-.3 1.4-1.6v-8.6h2.7v8.7c0 2.6-1.5 3.8-3.8 3.8-2 0-3.2-1-3.8-2.3zm9 .3l2.2-1.3c.5.9 1.2 1.5 2.4 1.5 1 0 1.6-.5 1.6-1.2 0-.8-.7-1.1-1.8-1.6l-.6-.3c-1.8-.8-3-1.7-3-3.8 0-1.9 1.4-3.3 3.7-3.3 1.6 0 2.7.6 3.5 2l-1.9 1.2c-.4-.8-.9-1-1.6-1-.7 0-1.2.5-1.2 1 0 .7.5 1 1.5 1.4l.6.3c2.1.9 3.3 1.8 3.3 3.9 0 2.2-1.7 3.4-4.1 3.4-2.3 0-3.7-1.1-4.4-2.5z" fill="#000" opacity=".7"/></svg>,
  MongoDB: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M16.6 3.1c-.3-.6-.6-1-.7-1.1-.1.1-.4.5-.7 1.1C13.1 7.5 9 12.8 12.6 18c1.2 1.7 2.6 2.8 3.4 3.3v4.4s.2.3.3.3h.5c.1 0 .3-.2.3-.3v-4.4c.8-.5 2.2-1.6 3.4-3.3C24.1 12.8 19 7.5 16.6 3.1z" fill="#4FAA41"/><path d="M16.4 21.3s.2-2 .2-2.6c0-.4-.2-.7-.5-1-.3.3-.5.6-.5 1 0 .6.2 2.6.2 2.6h.6z" fill="#3F9637" opacity=".5"/></svg>,
  PostgreSQL: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M22.8 25.7c-1.6.2-2.2-.4-2.2-.4 1.6-2.5 2.3-5.7 2.6-7.5.1-1-.3-1.6-.3-1.6 1.5-2 2.3-4.5 2.5-5.8.2-1.4 0-2.3 0-2.3-1.3-4.3-5.2-4.9-6.5-4.9h-.5c-.8 0-2.1.2-3.4.7C14 3.5 13 3.2 11.7 3.2c-2.1.1-3.5 1-4.2 1.9-1.8-.2-3 .3-3.8 1.2-.9 1.2-.8 3-.7 3.7-.1.1-.4.5-.6 1.4-.3 1.3-.2 2.6.3 4.2.7 2.1 2.3 3.8 3.1 4.3-.1.7 0 1.4.2 2.2.5 1.5 1.8 2.4 3.3 2.4.4 0 .8-.1 1.2-.2.2.4.4.8.8 1.1.8.8 1.8 1 2.5 1 .3 0 .5 0 .7-.1 1.3-.3 2.2-1.2 3-2.3 1-.2 2.3-.6 3.2-1.4 1.1-.9 1.4-1.8 1.3-2.3-.1-.2-.3-.5-.7-.5h-.3z" fill="#336791"/></svg>,
  Docker: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M18.4 13.5h3.3v3h1.6c.7 0 1.5-.2 2.2-.5.3-.2.7-.4 1-.7-.4-.6-.7-1.3-.7-2.1 0-1.6.9-2.9 2.2-3.6l.8-.4-.5-.7c-1-1.3-2.5-2.1-4.1-2.2h-.4c-1.2 0-2.4.4-3.3 1.2-.7-.3-1.5-.5-2.3-.5H17v3h-3v-3h-3v3H8v-3H5v3H2.5v3H5v3h3v-3h3v3h3v-3h3v3h1.4v-3z" fill="#2496ED"/><rect x="5" y="13.5" width="3" height="3" fill="#2496ED"/><rect x="8" y="13.5" width="3" height="3" fill="#2496ED"/><rect x="11" y="13.5" width="3" height="3" fill="#2496ED"/><rect x="14" y="13.5" width="3" height="3" fill="#2496ED"/></svg>,
  AWS: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M8.5 16.2l-1.7 5.4h1.1l.3-1.2h1.8l.4 1.2h1.1l-1.7-5.4H8.5zm.2 3.5l.6-2.3.7 2.3H8.7z" fill="#FF9900"/><path d="M12.8 16.2l-1 3.8-1.1-3.8H9.5l1.7 5.4h1.2l1-3.7 1 3.7h1.2l1.7-5.4h-1.1l-1.1 3.8-1-3.8h-1.3zM19.6 17c-.7-.2-.9-.4-.9-.7 0-.4.3-.6.8-.6.4 0 .8.1 1.2.4l.6-.8c-.5-.4-1.1-.5-1.7-.5-1.2 0-2 .7-2 1.6 0 1 .6 1.4 1.5 1.7.7.2 .9.4.9.7 0 .4-.4.6-.9.6-.5 0-1-.2-1.5-.6l-.6.8c.6.5 1.3.7 2 .7 1.2 0 2.1-.6 2.1-1.7 0-.9-.5-1.3-1.5-1.6z" fill="#FF9900"/><path d="M26 20.8c-3.3 2.2-8 3.4-12.1 3.4-5.7 0-10.9-1.9-14.8-5.1-.3-.3 0-.6.3-.4 4.2 2.2 9.4 3.5 14.8 3.5 3.6 0 7.6-.7 11.3-2.1.6-.2 1 .3.5.7z" fill="#FF9900"/></svg>,
  TensorFlow: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M16 3L4 9.5V22l4 2.3V13.8L16 9.5l8 4.3v10.5l4-2.3V9.5L16 3z" fill="#FF6F00"/><path d="M16 28.5l-4-2.3V15.7l4-2.2 4 2.2v10.5L16 28.5z" fill="#FF6F00"/><path d="M16 9.5v4.3l8 4.3V13.8L16 9.5z" fill="#FFA000" opacity=".7"/></svg>,
  OpenAI: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M27.2 13.8c.5-1.6.3-3.4-.6-4.8a6.2 6.2 0 00-6.7-2.8A6.2 6.2 0 0015.2 3a6.2 6.2 0 00-5.9 4.2 6.2 6.2 0 00-4.1 3 6.2 6.2 0 00.8 7.1 6.2 6.2 0 00.6 4.8 6.2 6.2 0 006.7 2.8A6.2 6.2 0 0016.8 29a6.2 6.2 0 005.9-4.2 6.2 6.2 0 004.1-3 6.2 6.2 0 00-.8-7.1z" fill="none" stroke="#10a37f" strokeWidth="1.5"/></svg>,
  NextJS: <svg viewBox="0 0 32 32" width="20" height="20"><circle cx="16" cy="16" r="13" fill="#000" stroke="#fff" strokeWidth="1"/><path d="M13 11v10M13 11l8 10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/><circle cx="21" cy="11" r="1.2" fill="#fff"/></svg>,
  Redis: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M28 14.2c0 1.6-5.4 2.9-12 2.9S4 15.8 4 14.2c0-1.6 5.4-2.9 12-2.9s12 1.3 12 2.9z" fill="#D82C20"/><path d="M28 18.2c0 1.6-5.4 2.9-12 2.9S4 19.8 4 18.2V14.2c0 1.6 5.4 2.9 12 2.9s12-1.3 12-2.9v4z" fill="#A41916"/><path d="M28 22.2c0 1.6-5.4 2.9-12 2.9S4 23.8 4 22.2V18.2c0 1.6 5.4 2.9 12 2.9s12-1.3 12-2.9v4z" fill="#D82C20"/></svg>,
  Git: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M29.3 15.1L16.9 2.7c-.5-.5-1.3-.5-1.8 0L12.6 5.2l2.3 2.3c.5-.2 1.1-.1 1.6.3.5.5.5 1.1.3 1.6l2.2 2.2c.5-.2 1.1-.1 1.6.3.6.6.6 1.6 0 2.2-.6.6-1.6.6-2.2 0-.5-.5-.6-1.2-.3-1.7l-2-2v5.4c.1.1.3.2.4.3.6.6.6 1.6 0 2.2-.6.6-1.6.6-2.2 0-.6-.6-.6-1.6 0-2.2.2-.2.4-.3.6-.4v-5.4c-.2-.1-.4-.2-.6-.4-.5-.5-.6-1.2-.3-1.7l-2.3-2.3-6.1 6.1c-.5.5-.5 1.3 0 1.8l12.4 12.4c.5.5 1.3.5 1.8 0L29.3 16.9c.5-.5.5-1.3 0-1.8z" fill="#F05033"/></svg>,
  Tailwind: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M16 6c-4.3 0-6.9 2.1-8 6.4 1.6-2.1 3.5-2.9 5.6-2.4 1.2.3 2 1.1 3 2.1 1.5 1.6 3.2 3.5 7 3.5 4.3 0 6.9-2.1 8-6.4-1.6 2.1-3.5 2.9-5.6 2.4-1.2-.3-2-1.1-3-2.1C21.5 7.9 19.7 6 16 6zM8 16.4c-4.3 0-6.9 2.1-8 6.4 1.6-2.1 3.5-2.9 5.6-2.4 1.2.3 2 1.1 3 2.1 1.5 1.6 3.2 3.5 7 3.5 4.3 0 6.9-2.1 8-6.4-1.6 2.1-3.5 2.9-5.6 2.4-1.2-.3-2-1.1-3-2.1-1.5-1.6-3.3-3.5-7-3.5z" fill="#06B6D4"/></svg>,
  FastAPI: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M16 3C8.8 3 3 8.8 3 16s5.8 13 13 13 13-5.8 13-13S23.2 3 16 3zm0 2.2l5.8 10.3H17v11.3L11.2 16.5H15V5.2z" fill="#009688"/></svg>,
  LangChain: <svg viewBox="0 0 32 32" width="20" height="20"><circle cx="16" cy="8" r="3" fill="none" stroke="#1C3C3C" strokeWidth="1.5"/><circle cx="8" cy="20" r="3" fill="none" stroke="#1C3C3C" strokeWidth="1.5"/><circle cx="24" cy="20" r="3" fill="none" stroke="#1C3C3C" strokeWidth="1.5"/><line x1="14" y1="10.5" x2="10" y2="17.5" stroke="#1C3C3C" strokeWidth="1.5"/><line x1="18" y1="10.5" x2="22" y2="17.5" stroke="#1C3C3C" strokeWidth="1.5"/><line x1="11" y1="20" x2="21" y2="20" stroke="#1C3C3C" strokeWidth="1.5"/></svg>,
  Figma: <svg viewBox="0 0 32 32" width="20" height="20"><circle cx="19" cy="16" r="4" fill="#1ABCFE"/><path d="M12 28a4 4 0 004-4v-4h-4a4 4 0 000 8z" fill="#0ACF83"/><path d="M8 16a4 4 0 014-4h4v8h-4a4 4 0 01-4-4z" fill="#A259FF"/><path d="M8 8a4 4 0 014-4h4v8h-4a4 4 0 01-4-4z" fill="#F24E1E"/><path d="M16 4h4a4 4 0 010 8h-4V4z" fill="#FF7262"/></svg>,
  Linux: <svg viewBox="0 0 32 32" width="20" height="20"><path d="M16 3c-2.8 0-4.5 3.5-4.5 7.5 0 2.5.7 4.7 1.8 6.2-2.7 1.2-5.3 3.3-5.3 5.3 0 2.2 3 4.7 8 4.7s8-2.5 8-4.7c0-2-2.6-4.1-5.3-5.3 1.1-1.5 1.8-3.7 1.8-6.2C20.5 6.5 18.8 3 16 3z" fill="#333"/><circle cx="14.5" cy="10" r="1" fill="#fff"/><circle cx="17.5" cy="10" r="1" fill="#fff"/></svg>,
}

/* ═══════ TECH MARQUEE ═══════ */
function TechMarquee() {
  const techs = [
    { name: 'React', icon: TechIcons.React, color: '#61DAFB' },
    { name: 'Python', icon: TechIcons.Python, color: '#3776AB' },
    { name: 'TypeScript', icon: TechIcons.TypeScript, color: '#3178C6' },
    { name: 'Node.js', icon: TechIcons.NodeJS, color: '#539E43' },
    { name: 'JavaScript', icon: TechIcons.JavaScript, color: '#F7DF1E' },
    { name: 'MongoDB', icon: TechIcons.MongoDB, color: '#4FAA41' },
    { name: 'PostgreSQL', icon: TechIcons.PostgreSQL, color: '#336791' },
    { name: 'Docker', icon: TechIcons.Docker, color: '#2496ED' },
    { name: 'AWS', icon: TechIcons.AWS, color: '#FF9900' },
    { name: 'TensorFlow', icon: TechIcons.TensorFlow, color: '#FF6F00' },
    { name: 'Next.js', icon: TechIcons.NextJS, color: '#ffffff' },
    { name: 'Redis', icon: TechIcons.Redis, color: '#D82C20' },
    { name: 'FastAPI', icon: TechIcons.FastAPI, color: '#009688' },
    { name: 'OpenAI', icon: TechIcons.OpenAI, color: '#10a37f' },
    { name: 'Git', icon: TechIcons.Git, color: '#F05033' },
    { name: 'Tailwind', icon: TechIcons.Tailwind, color: '#06B6D4' },
  ]

  return (
    <div className="marquee-section">
      <div className="marquee-row">
        <div className="marquee-track">
          {[...techs, ...techs].map((t, i) => (
            <div key={i} className="marquee-chip">
              <span className="marquee-icon">{t.icon}</span>
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="marquee-row reverse">
        <div className="marquee-track">
          {[...techs.slice().reverse(), ...techs.slice().reverse()].map((t, i) => (
            <div key={i} className="marquee-chip">
              <span className="marquee-icon">{t.icon}</span>
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════ PROJECT CAROUSEL (STACKED CARDS) ═══════ */
function ProjectCarousel({ projects }) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0) // -1 left, 1 right
  const [isPaused, setIsPaused] = useState(false)
  const total = projects.length
  const touchStart = useRef(null)

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => { setDirection(1); setCurrent(c => (c + 1) % total) }, 6000)
    return () => clearInterval(timer)
  }, [isPaused, total])

  const go = (dir) => {
    setDirection(dir)
    setCurrent(c => (c + dir + total) % total)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 10000)
  }

  // Keyboard nav
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Touch swipe
  const onTouchStart = e => { touchStart.current = e.touches[0].clientX }
  const onTouchEnd = e => {
    if (!touchStart.current) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1)
    touchStart.current = null
  }

  const getCardClass = (index) => {
    const diff = ((index - current) + total) % total
    if (diff === 0) return 'card-active'
    if (diff === 1 || (diff === total - 1 && total > 2)) return diff === 1 ? 'card-next' : 'card-prev'
    if (diff === total - 1) return 'card-prev'
    return 'card-hidden'
  }

  const p = projects[current]

  return (
    <div className="project-carousel" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}
         onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* Main card display */}
      <div className="carousel-stage">
        <div className="carousel-card active" key={current}>
          <div className="carousel-card-visual" style={{ background: p.gradient }}>
            <span className="carousel-card-emoji">{p.emoji}</span>
            <span className="carousel-card-label">{p.label}</span>

            {/* Progress bar */}
            <div className="carousel-progress">
              {projects.map((_, i) => (
                <div key={i} className={`progress-segment ${i === current ? 'active' : ''} ${i < current ? 'done' : ''}`}>
                  <div className="progress-fill"/>
                </div>
              ))}
            </div>
          </div>

          <div className="carousel-card-body">
            <div className="carousel-card-number">{String(current + 1).padStart(2, '0')}</div>
            <h3>{p.title}</h3>
            <p>{p.description}</p>

            {p.metrics && (
              <div className="carousel-metrics">
                {p.metrics.map(m => (
                  <div key={m.label} className="c-metric">
                    <span className="c-metric-val">{m.value}</span>
                    <span className="c-metric-lbl">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
            {p.impactLine && <div className="carousel-impact">{p.impactLine}</div>}

            <div className="carousel-tech">
              {p.tech.map(t => <span key={t} className="c-tech-tag">{t}</span>)}
            </div>

            <div className="carousel-links">
              <a href="#" className="c-link c-link-primary">Live Demo <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>
              <a href="#" className="c-link">Source <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="carousel-nav">
        <button className="carousel-arrow" onClick={() => go(-1)} aria-label="Previous">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="carousel-dots">
          {projects.map((proj, i) => (
            <button key={i} className={`carousel-dot ${i === current ? 'active' : ''}`}
              onClick={() => { setCurrent(i); setIsPaused(true); setTimeout(() => setIsPaused(false), 10000) }}>
              <span className="dot-label">{proj.title.split(' ').slice(0, 2).join(' ')}</span>
            </button>
          ))}
        </div>
        <button className="carousel-arrow" onClick={() => go(1)} aria-label="Next">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 6 15 12 9 18"/></svg>
        </button>
      </div>
    </div>
  )
}

/* ═══════ ICONS ═══════ */
const Icon = {
  github: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>,
  linkedin: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  mail: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  location: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
}

/* ═══════ DATA ═══════ */
const ME = {
  name: 'Hrishikesh',
  full: 'Hrishikesh Deshpande',
  role: 'Full Stack Developer',
  email: 'hrishideshpande150@gmail.com',
  location: 'India',
  github: 'https://github.com/Hrishi71',
  linkedin: 'https://www.linkedin.com/in/hrishid150',
}

const SKILLS = [
  { category: 'Languages', icon: '⌨️', items: ['JavaScript', 'TypeScript', 'Python', 'HTML/CSS', 'SQL'] },
  { category: 'Frontend', icon: '🎨', items: ['React.js', 'Next.js', 'Tailwind CSS', 'Redux'] },
  { category: 'Backend', icon: '⚙️', items: ['Node.js', 'Express', 'FastAPI', 'REST APIs', 'GraphQL'] },
  { category: 'AI / ML', icon: '🧠', items: ['TensorFlow', 'LangChain', 'OpenAI API', 'Hugging Face', 'NLP'] },
  { category: 'Database', icon: '🗄️', items: ['MongoDB', 'PostgreSQL', 'Redis', 'Firebase'] },
  { category: 'DevOps', icon: '🚀', items: ['Docker', 'AWS', 'Git', 'CI/CD', 'Linux'] },
]

const PROJECTS = [
  {
    title: 'AI-Powered LMS Platform',
    label: 'Flagship',
    description: 'A full-stack Learning Management System with AI-driven course recommendations, GPT-powered quiz generation, intelligent progress tracking, and personalized learning paths.',
    tech: ['React', 'Node.js', 'MongoDB', 'OpenAI', 'TensorFlow', 'Docker'],
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
    emoji: '🎓',
    metrics: [{ value: '10K+', label: 'Users' }, { value: '50%', label: 'Faster' }, { value: '95%', label: 'Uptime' }, { value: '4.8★', label: 'Rating' }],
  },
  {
    title: 'Smart Document Analyzer',
    label: 'AI / NLP',
    description: 'Intelligent document processing pipeline using RAG architecture. Upload PDFs for instant summaries, contextual Q&A, and key insights extraction with vector embeddings.',
    tech: ['Python', 'LangChain', 'FastAPI', 'Pinecone', 'React'],
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    emoji: '📄',
    impactLine: '3× faster document review',
  },
  {
    title: 'Real-Time Analytics Dashboard',
    label: 'Full-Stack',
    description: 'Interactive BI dashboard with live WebSocket streaming, drag-and-drop chart builders, automated PDF reports, and role-based access control.',
    tech: ['React', 'D3.js', 'Python', 'PostgreSQL', 'WebSocket'],
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    emoji: '📊',
    impactLine: '40% better decision-making',
  },
  {
    title: 'AI Chatbot Framework',
    label: 'Conversational AI',
    description: 'Production-ready chatbot framework with multi-model support (GPT-4, Claude, Gemini), persistent memory, function calling, and webhook integrations.',
    tech: ['Python', 'OpenAI', 'LangChain', 'Redis', 'Docker'],
    gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    emoji: '💬',
    impactLine: '80% automated resolution',
  },
]

const EXPERIENCE = [
  { period: '2024 — Present', title: 'Full Stack AI Engineer', company: 'Building Intelligent Products', description: 'Leading development of AI-powered applications. Integrating LLMs, RAG pipelines, and modern web frameworks into production systems.', tags: ['AI/ML', 'System Design', 'Leadership'] },
  { period: '2023 — 2024', title: 'Full Stack Developer', company: 'Growth Phase', description: 'Built and shipped 10+ production applications using React, Node.js, and cloud infrastructure.', tags: ['10+ Apps', 'Cloud', 'APIs'] },
  { period: '2022 — 2023', title: 'Frontend Developer', company: 'Foundation', description: 'Developed strong web fundamentals. Solved 100+ algorithmic problems. Contributed to open-source.', tags: ['100+ Problems', 'Open Source', 'Self-Taught'] },
]

/* ═══════ APP ═══════ */
function App() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [toastVisible, setToastVisible] = useState(false)

  const typed = useTyping(['Full Stack Developer', 'AI Engineer', 'Problem Solver', 'React & Python Dev'])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50)
      for (const id of ['contact', 'experience', 'projects', 'skills', 'about', 'home']) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 200) { setActiveSection(id); break }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = useCallback((e, id) => { e.preventDefault(); setMobileMenu(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }, [])

  const handleSubmit = e => { e.preventDefault(); setToastVisible(true); e.target.reset(); setTimeout(() => setToastVisible(false), 4000) }

  const [statsRef, statsVis] = useReveal()
  const cP = useCounter(15, 2000, statsVis), cT = useCounter(25, 1800, statsVis), cS = useCounter(100, 2200, statsVis)

  return (
    <div className="app">
      <ScrollProgress/>
      <BackToTop/>
      <Toast msg="Message sent! I'll get back to you soon." show={toastVisible} onClose={() => setToastVisible(false)}/>

      {/* NAV */}
      <nav className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-container">
          <a href="#home" className="logo" onClick={e => scrollTo(e, 'home')}>HD</a>
          <ul className={`nav-menu ${mobileMenu ? 'open' : ''}`}>
            {['Home', 'About', 'Skills', 'Projects', 'Experience', 'Contact'].map(x => (
              <li key={x}><a href={`#${x.toLowerCase()}`} className={activeSection === x.toLowerCase() ? 'active' : ''} onClick={e => scrollTo(e, x.toLowerCase())}>{x}</a></li>
            ))}
          </ul>
          <div className="nav-actions">
            <a href="#contact" className="nav-cta" onClick={e => scrollTo(e, 'contact')}>Get in Touch</a>
            <button className={`hamburger ${mobileMenu ? 'open' : ''}`} onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu"><span/><span/><span/></button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" className="hero">
        <div className="hero-inner">
          <div className="hero-badge"><span className="status-dot"/>Open to opportunities</div>
          <p className="hero-typing"><span className="typing-pre">&gt;</span> {typed}<span className="typing-cursor">|</span></p>
          <h1 className="hero-h1">Hi, I'm <span className="hero-name">{ME.name}</span><br/>I build <span className="hero-gradient">software that matters</span></h1>
          <p className="hero-desc">Full Stack Developer & AI Engineer — I design and ship production-ready applications with modern web technologies and intelligent features.</p>
          <div className="hero-btns">
            <a href="#projects" className="btn-primary" onClick={e => scrollTo(e, 'projects')}>View Projects {Icon.arrow}</a>
            <a href="#contact" className="btn-secondary" onClick={e => scrollTo(e, 'contact')}>Get in Touch</a>
            <a href="#" className="btn-ghost">{Icon.download} Resume</a>
          </div>
          <div className="hero-stats" ref={statsRef}>
            <div className="h-stat"><span className="h-stat-num">{cP}+</span><span className="h-stat-lbl">Projects</span></div>
            <div className="h-stat-sep"/><div className="h-stat"><span className="h-stat-num">{cT}+</span><span className="h-stat-lbl">Technologies</span></div>
            <div className="h-stat-sep"/><div className="h-stat"><span className="h-stat-num">{cS}+</span><span className="h-stat-lbl">Problems Solved</span></div>
          </div>
          <div className="hero-socials">
            {[{ h: ME.github, i: Icon.github, t: 'GitHub' }, { h: ME.linkedin, i: Icon.linkedin, t: 'LinkedIn' }, { h: `mailto:${ME.email}`, i: Icon.mail, t: 'Email' }].map(s => (
              <a key={s.t} href={s.h} target={s.h.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer" className="hero-soc" title={s.t}>{s.i}</a>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section">
        <div className="container">
          <Reveal><span className="sec-label">About</span><h2 className="sec-heading">A bit about me</h2></Reveal>
          <div className="about-grid">
            <Reveal delay={100}>
              <div className="about-photo-area">
                <div className="about-photo-frame"><img src="/images/profile.png" alt={ME.full}/></div>
                <div className="about-loc">{Icon.location} <span>{ME.location}</span></div>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="about-body">
                <p className="about-lead">I'm <strong>{ME.full}</strong>, a Full Stack Developer with a strong focus on AI/ML integration.</p>
                <p>I build end-to-end applications — from database design to polished UIs — using React, Node.js, Python, and modern AI tools like LangChain and OpenAI. I care deeply about writing clean, maintainable code that scales.</p>
                <p>Currently building an <strong>AI-powered Learning Management System</strong> and exploring generative AI, RAG architectures, and conversational systems.</p>
                <div className="about-nums">
                  <div><strong>15+</strong> <span>projects shipped</span></div>
                  <div><strong>100+</strong> <span>problems solved</span></div>
                  <div><strong>25+</strong> <span>technologies used</span></div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* TECH MARQUEE */}
      <Reveal><TechMarquee/></Reveal>

      {/* SKILLS */}
      <section id="skills" className="section section-alt">
        <div className="container">
          <Reveal><span className="sec-label">Skills</span><h2 className="sec-heading">Technologies I work with</h2></Reveal>
          <div className="skills-grid">
            {SKILLS.map((g, i) => (
              <Fade key={g.category} index={i}>
                <div className="skill-card">
                  <div className="skill-card-icon">{g.icon}</div>
                  <h3>{g.category}</h3>
                  <div className="skill-pills">{g.items.map(s => <span key={s} className="skill-pill">{s}</span>)}</div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="section">
        <div className="container">
          <Reveal><span className="sec-label">Projects</span><h2 className="sec-heading">Things I've built</h2><p className="sec-sub">Real applications I've designed, developed, and shipped.</p></Reveal>
          <Reveal delay={150}><ProjectCarousel projects={PROJECTS}/></Reveal>
          <Reveal delay={250}><div className="projects-footer"><a href={ME.github} className="btn-secondary" target="_blank" rel="noopener noreferrer">More on GitHub {Icon.github}</a></div></Reveal>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section id="experience" className="section section-alt">
        <div className="container">
          <Reveal><span className="sec-label">Experience</span><h2 className="sec-heading">My journey so far</h2></Reveal>
          <div className="timeline">
            {EXPERIENCE.map((x, i) => (
              <Fade key={i} index={i}>
                <div className="tl-item">
                  <div className="tl-marker"/>
                  <div className="tl-date">{x.period}</div>
                  <div className="tl-card">
                    <h4>{x.title}</h4>
                    <div className="tl-company">{x.company}</div>
                    <p>{x.description}</p>
                    <div className="tl-tags">{x.tags.map(t => <span key={t} className="tl-tag">{t}</span>)}</div>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="cta-card">
              <h2>Ready to build something great?</h2>
              <p>I'm open to full-time roles, collaborations, and exciting engineering challenges.</p>
              <div className="cta-btns">
                <a href="#contact" className="btn-primary" onClick={e => scrollTo(e, 'contact')}>Let's Talk {Icon.arrow}</a>
                <a href={`mailto:${ME.email}`} className="btn-secondary">Email Me {Icon.mail}</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section section-alt">
        <div className="container">
          <Reveal><span className="sec-label">Contact</span><h2 className="sec-heading">Let's connect</h2></Reveal>
          <div className="contact-grid">
            <Reveal delay={100}>
              <div className="contact-info">
                <p>I'm always open to discussing new opportunities, interesting projects, or just having a good tech conversation.</p>
                <div className="contact-links">
                  {[{ h: `mailto:${ME.email}`, i: Icon.mail, l: 'Email', v: ME.email }, { h: ME.linkedin, i: Icon.linkedin, l: 'LinkedIn', v: 'in/hrishid150' }, { h: ME.github, i: Icon.github, l: 'GitHub', v: 'Hrishi71' }].map(c => (
                    <a key={c.l} href={c.h} target={c.h.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer" className="contact-ch">
                      <div className="contact-ch-icon">{c.i}</div>
                      <div><div className="contact-ch-label">{c.l}</div><div className="contact-ch-val">{c.v}</div></div>
                    </a>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-field"><label>Name</label><input type="text" placeholder="Your name" required/></div>
                  <div className="form-field"><label>Email</label><input type="email" placeholder="you@example.com" required/></div>
                </div>
                <div className="form-field"><label>Subject</label><input type="text" placeholder="What's this about?" required/></div>
                <div className="form-field"><label>Message</label><textarea placeholder="Tell me more..." rows="5" required/></div>
                <button type="submit" className="btn-primary form-submit">Send Message {Icon.arrow}</button>
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-left"><span className="logo">HD</span><p>© {new Date().getFullYear()} {ME.full}</p></div>
          <div className="footer-right">
            {[{ h: ME.github, i: Icon.github }, { h: ME.linkedin, i: Icon.linkedin }, { h: `mailto:${ME.email}`, i: Icon.mail }].map((s, i) => (
              <a key={i} href={s.h} target={s.h.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer" className="footer-soc">{s.i}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App