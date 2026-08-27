'use client'

import { useEffect, useRef, useState } from 'react'
import { answerQuery, matchSection, NAV_LABELS, SECTION_HINTS } from './answers'

export const fmt = (n) => n.toLocaleString('ru-RU')

/* подсветка избранного клиента */
export const HL_NAME = 'Анетта Аракелян'
export function ClientName({ name }) {
  return <span className={name === HL_NAME ? 'name-hl' : undefined}>{name}</span>
}

/* ── мини-иконки (stroke 24×24) ── */
export function Ic({ children, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export const icons = {
  home: <Ic><path d="M3 10.8 12 3.5l9 7.3" /><path d="M5.5 9.5V20.5h13V9.5" /></Ic>,
  crm: <Ic><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><path d="m17.5 5.5 1 1.8 2 .3-1.5 1.5.4 2-1.9-1-1.9 1 .4-2-1.5-1.5 2-.3z" /></Ic>,
  orders: <Ic><rect x="5" y="3.5" width="14" height="17" rx="2.5" /><path d="M9 8.5h6M9 12h6M9 15.5h3.5" /></Ic>,
  clients: <Ic><circle cx="9" cy="8.5" r="3" /><path d="M3.8 19.5c.5-2.9 2.6-4.6 5.2-4.6s4.7 1.7 5.2 4.6" /><circle cx="16.8" cy="9.5" r="2.4" /><path d="M16 14.9c2.2.1 3.9 1.6 4.3 4" /></Ic>,
  segments: <Ic><circle cx="7" cy="7" r="3" /><circle cx="17" cy="7" r="3" /><circle cx="7" cy="17" r="3" /><circle cx="17" cy="17" r="3" /></Ic>,
  comms: <Ic><path d="M4 5.5h16v10.5H9.5L5.5 19.5v-3.5H4z" /></Ic>,
  analytics: <Ic><path d="M4.5 20V11M10.5 20V4.5M16.5 20v-7M20.5 20h-17" /></Ic>,
  megaphone: <Ic><path d="M4 10v4l3 .5V9.5z" /><path d="M7 9.5 18.5 4.5v14L7 14.5" /><path d="M9 15.5v3.5h3v-3" /></Ic>,
  accounts: <Ic><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="M3.5 10h17M7 14.5h4" /></Ic>,
  acquiring: <Ic><rect x="3.5" y="6" width="17" height="12" rx="2.5" /><path d="M7 15h3M14 15h3" /><path d="M3.5 9.8h17" /></Ic>,
  credits: <Ic><circle cx="12" cy="12" r="8.5" /><path d="M9 15.5 15 8.5M9.5 9.5h.01M14.5 14.5h.01" /></Ic>,
  deposits: <Ic><rect x="4" y="4.5" width="16" height="15" rx="2.5" /><circle cx="12" cy="12" r="3.2" /><path d="M12 10.5v3M20 9h-2M20 15h-2" /></Ic>,
  guarantees: <Ic><path d="M12 3.5 19 6v5.5c0 4.5-2.8 7.6-7 9-4.2-1.4-7-4.5-7-9V6z" /><path d="m9 12 2 2 4-4.5" /></Ic>,
  accounting: <Ic><rect x="5" y="3.5" width="14" height="17" rx="2.5" /><path d="M8.5 7.5h7" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01" /></Ic>,
  documents: <Ic><path d="M6 3.5h8l4 4v13H6z" /><path d="M14 3.5v4h4" /></Ic>,
  settings: <Ic><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.5h4l.4-2.5a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" /></Ic>,
  search: <Ic size={17}><circle cx="11" cy="11" r="7" /><path d="m20.5 20.5-4.5-4.5" /></Ic>,
  bell: <Ic size={20}><path d="M6 16.5v-6a6 6 0 0 1 12 0v6l1.5 2.5h-15z" /><path d="M10 19a2 2 0 0 0 4 0" /></Ic>,
  chat: <Ic size={20}><path d="M12 3.5a8.5 8.5 0 1 0 4.6 15.6l3.9 1-1-3.9A8.5 8.5 0 0 0 12 3.5z" /></Ic>,
  sun: <Ic size={16}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" /></Ic>,
  moon: <Ic size={16}><path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5z" /></Ic>,
  burger: <Ic size={20}><path d="M4 6.5h16M4 12h16M4 17.5h16" /></Ic>,
  close: <Ic size={18}><path d="m6 6 12 12M18 6 6 18" /></Ic>,
  send: <Ic size={17}><path d="M4 12 20 4l-4 16-4.5-6.5z" /><path d="M11.5 13.5 20 4" /></Ic>,
  download: <Ic size={17}><path d="M12 4v11M7 10.5 12 15.5l5-5" /><path d="M4.5 19.5h15" /></Ic>,
  plus: <Ic size={17}><path d="M12 5v14M5 12h14" /></Ic>,
  spark: <Ic size={19}><path d="M12 3.5 13.8 9 19 10.8 13.8 12.6 12 18 10.2 12.6 5 10.8 10.2 9z" /><path d="M19 16.5 19.7 18.5 21.7 19.2 19.7 19.9 19 21.9 18.3 19.9 16.3 19.2 18.3 18.5z" /></Ic>,
  mic: <Ic size={19}><rect x="9" y="3.5" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" /></Ic>,
  arrowUp: <Ic size={18}><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" /></Ic>,
  target: <Ic size={22}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></Ic>,
  phone: <Ic size={22}><path d="M5 4.5h4l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v4c-8.5.5-15-6-14.5-14.5z" /></Ic>,
  people: <Ic size={22}><circle cx="9" cy="8.5" r="3" /><path d="M3.8 19.5c.5-2.9 2.6-4.6 5.2-4.6s4.7 1.7 5.2 4.6" /><circle cx="16.8" cy="9.5" r="2.4" /><path d="M16 14.9c2.2.1 3.9 1.6 4.3 4" /></Ic>,
  person: <Ic size={22}><circle cx="12" cy="8" r="3.4" /><path d="M5.5 20c.7-3.4 3.2-5.4 6.5-5.4s5.8 2 6.5 5.4" /></Ic>,
  mail: <Ic><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7.5 7.5 6 7.5-6" /></Ic>,
  calendar: <Ic><rect x="4" y="5.5" width="16" height="15" rx="2.5" /><path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></Ic>,
}

/* ── график со значением по наведению ── */
export const JULY = Array.from({ length: 31 }, (_, i) => `${i + 1} июля`)

/* реалистичный ряд: авторегрессионное блуждание с плато и коррекцией к финальному значению */
export function mkSeries(start, end, n, amp, seed) {
  const rnd = (i) => {
    const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453
    return (x - Math.floor(x)) * 2 - 1
  }
  const drift = (end - start) / (n - 1)
  const pts = [start]
  let m = 0
  for (let i = 1; i < n; i++) {
    m = 0.62 * m + rnd(i) * amp
    const plateau = Math.abs(rnd(i + 137)) < 0.16
    pts.push(pts[i - 1] + drift + (plateau ? m * 0.08 : m * 0.55))
  }
  const err = end - pts[n - 1]
  return pts.map((v, i) => Math.max(0, Math.round(v + (err * i) / (n - 1))))
}

/* светлый оттенок для начала линии (бирюзовый заход, как на бирже) */
const LIGHT = { '#26a95c': '#2fd0bd', '#7857e6': '#a58af5', '#f0862a': '#f7b56b', '#2f8bed': '#6cb6f7', '#8F8FFF': '#D8D8FF' }

export function Spark({ series, color, unit, height = 88, detailed = false, labels }) {
  const wrapRef = useRef(null)
  const [idx, setIdx] = useState(null)
  const n = series.length
  const W = 600, H = 150
  const PT = 26, PB = 10
  const min = Math.min(...series), max = Math.max(...series)
  const range = max - min || 1
  const avg = Math.round(series.reduce((a, b) => a + b, 0) / n)
  const X = (i) => (i * W) / (n - 1)
  const Y = (v) => PT + (H - PT - PB) * (1 - (v - min) / range)
  const line = series.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')
  const uid = `${color.replace('#', '')}-${height}-${detailed ? 'd' : 's'}`
  const iMax = series.indexOf(max)
  const iMin = series.indexOf(min)

  /* кольца на локальных пиках (только в детальном режиме) */
  const rings = []
  if (detailed) {
    for (let i = 2; i < n - 2 && rings.length < 3; i++) {
      if (i !== iMax && series[i] > series[i - 1] && series[i] >= series[i + 1] &&
        series[i] > avg && Math.abs(i - iMax) > n * 0.08 &&
        rings.every((r) => Math.abs(r - i) > n * 0.12)) rings.push(i)
    }
  }

  const xP = (i) => (X(i) / W) * 100
  const yP = (v) => (Y(v) / H) * 100
  const L = labels && labels.length ? labels : JULY
  const dateAt = (i) => L[Math.round((i * (L.length - 1)) / (n - 1))]

  const onMove = (e) => {
    const rect = wrapRef.current.getBoundingClientRect()
    const r = (e.clientX - rect.left) / rect.width
    setIdx(Math.min(n - 1, Math.max(0, Math.round(r * (n - 1)))))
  }

  return (
    <div className="spark-wrap" ref={wrapRef} style={{ height }} onMouseMove={onMove} onMouseLeave={() => setIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id={`sl-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={LIGHT[color] || color} />
            <stop offset="16%" stopColor={color} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <linearGradient id={`sa-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".16" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#sa-${uid})`} />
        <path d={line} fill="none" stroke={`url(#sl-${uid})`} strokeWidth="2.6"
          strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>

      {/* пунктир среднего уровня с плашкой */}
      <div className="spark-ref" style={{ top: `${yP(avg)}%` }} />
      <div className="spark-ref-pill" style={{ top: `${yP(avg)}%` }}>{fmt(avg)}{unit}</div>

      {/* максимум */}
      <div className="spark-mark" style={{ left: `${xP(iMax)}%`, top: `${yP(max)}%` }} />
      <div className={`spark-mark-label${xP(iMax) > 66 ? ' flip' : ''}`}
        style={{ left: `${xP(iMax)}%`, top: `${yP(max)}%` }}>{fmt(max)}{unit}</div>

      {detailed && (
        <>
          <div className="spark-mark" style={{ left: `${xP(iMin)}%`, top: `${yP(min)}%` }} />
          <div className={`spark-mark-label${xP(iMin) > 66 ? ' flip' : ''}`}
            style={{ left: `${xP(iMin)}%`, top: `${yP(min)}%` }}>{fmt(min)}{unit}</div>
          {rings.map((i) => (
            <div key={i} className="spark-ring" style={{ left: `${xP(i)}%`, top: `${yP(series[i])}%`, borderColor: color }} />
          ))}
        </>
      )}

      {idx != null && (
        <>
          <div className="spark-guide" style={{ left: `${xP(idx)}%` }} />
          <div className="spark-dot" style={{ left: `${xP(idx)}%`, top: `${yP(series[idx])}%`, background: color }} />
          <div className="spark-tip" style={{ left: `clamp(56px, ${xP(idx)}%, calc(100% - 56px))` }}>
            <div className="tip-val">{fmt(series[idx])}{unit}</div>
            <div className="tip-date">{dateAt(idx)}</div>
          </div>
        </>
      )}
    </div>
  )
}

/* ── поле текстового запроса: главный способ работы с кабинетом ── */
export function QueryBar({ hint = {}, hero = false, apiRef, onNavigate }) {
  const [thread, setThread] = useState([])
  const [typing, setTyping] = useState(false)
  const [val, setVal] = useState('')
  const [ph, setPh] = useState(0)
  const bodyRef = useRef(null)
  const phs = hint.phs || (hint.ph ? [hint.ph] : ['Спросите о вашем бизнесе своими словами…'])

  useEffect(() => {
    if (phs.length < 2) return
    const t = setInterval(() => setPh((i) => i + 1), 3600)
    return () => clearInterval(t)
  }, [phs.length])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [thread, typing])

  /* голосовой ввод: надиктовать вопрос через Web Speech API */
  const [rec, setRec] = useState(false)
  const [micNote, setMicNote] = useState(null)
  const recRef = useRef(null)
  const toggleMic = () => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
    if (!SR) {
      setMicNote('Голосовой ввод не поддерживается в этом браузере')
      setTimeout(() => setMicNote(null), 3000)
      return
    }
    if (rec) { recRef.current?.stop(); setRec(false); return }
    const r = new SR()
    r.lang = 'ru-RU'
    r.interimResults = true
    r.onresult = (e) => setVal(Array.from(e.results).map((x) => x[0].transcript).join(' '))
    r.onend = () => setRec(false)
    r.onerror = () => setRec(false)
    recRef.current = r
    setRec(true)
    r.start()
  }

  const ask = (raw, forceTo) => {
    const text = (raw ?? val).trim()
    if (!text || typing) return
    setVal('')
    setThread((t) => [...t, { q: text, a: null }])
    setTyping(true)
    const nav = forceTo && onNavigate
      ? { id: forceTo, label: NAV_LABELS[forceTo] || '' }
      : onNavigate ? matchSection(text) : null
    if (nav) {
      setTimeout(() => {
        setTyping(false)
        setThread((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, a: { text: `Открываю раздел «${nav.label}»…`, cta: null } } : x)))
        setTimeout(() => onNavigate(nav.id), 600)
      }, 900)
      return
    }
    setTimeout(() => {
      setTyping(false)
      setThread((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, a: answerQuery(text) } : x)))
    }, 1300)
  }
  if (apiRef) apiRef.current = ask

  const chipClick = (c) => {
    const chip = typeof c === 'string' ? { label: c } : c
    ask(chip.label, chip.to)
  }

  const answerBody = (a) => (
    <>
      {a.text}
      {a.cta && onNavigate && (
        <div><button className="qa-cta" onClick={() => onNavigate(a.cta.to)}>{a.cta.label}</button></div>
      )}
    </>
  )

  const inputRow = (
    <div className={`query-input-row${hero ? '' : ' compact'}`}>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && ask()}
        placeholder={phs[ph % phs.length]}
      />
      {hero
        ? (
          <span className="hero-actions">
            <button className={`mic-btn${rec ? ' rec' : ''}`} onClick={toggleMic} aria-label="Надиктовать вопрос">{icons.mic}</button>
            <button className="send-btn" onClick={() => ask()} aria-label="Отправить вопрос">{icons.arrowUp}</button>
          </span>
        )
        : <button className="btn-send" onClick={() => ask()} aria-label="Спросить">{icons.send}</button>}
    </div>
  )

  /* на главной после первого вопроса ассистент превращается в чат-диалог */
  const chatMode = hero && (thread.length > 0 || typing)

  return (
    <div className={hero ? `query-hero${chatMode ? ' chat-mode' : ''}` : 'query-bar'}>
      {chatMode && (
        <div className="qd-dialog" ref={bodyRef}>
          {thread.map((x, i) => (
            <div key={i} className="qd-pair">
              <div className="qd-msg me">{x.q}</div>
              {x.a && <div className="qd-msg ai">{answerBody(x.a)}</div>}
            </div>
          ))}
          {typing && <div className="qa-typing">Анализирую данные вашего бизнеса<i>.</i><i>.</i><i>.</i></div>}
        </div>
      )}
      {hero && !chatMode && hint.chipsTop?.length > 0 && (
        <div className="query-chips top">
          {hint.chipsTop.map((c) => {
            const label = typeof c === 'string' ? c : c.label
            return <button key={label} className="query-chip" onClick={() => chipClick(c)}>{label}</button>
          })}
        </div>
      )}
      {hero ? (
        <div className="query-glow">
          <span className="glow-blob b1" aria-hidden="true" />
          <span className="glow-blob b2" aria-hidden="true" />
          <span className="glow-blob b3" aria-hidden="true" />
          <span className="glow-blob b4" aria-hidden="true" />
          {inputRow}
        </div>
      ) : inputRow}
      {hero && micNote && <div className="mic-note">{micNote}</div>}
      {hero && rec && <div className="mic-note rec">Слушаю… говорите, я записываю вопрос</div>}
      {!chatMode && hint.chips?.length > 0 && (
        <div className="query-chips">
          {hint.chips.map((c) => {
            const label = typeof c === 'string' ? c : c.label
            return <button key={label} className="query-chip" onClick={() => chipClick(c)}>{label}</button>
          })}
        </div>
      )}
      {!chatMode && hint.offer && thread.length === 0 && !typing && (
        <div className="query-offer qa-a">
          {hint.offer.text}
          <div className="offer-opts">
            {hint.offer.options.map((o) => (
              <button key={o} className="query-chip" onClick={() => ask(o)}>{o}</button>
            ))}
          </div>
        </div>
      )}
      {!hero && (thread.length > 0 || typing) && (
        <div className="query-thread" ref={bodyRef}>
          {thread.map((x, i) => (
            <div key={i} className="qa-item">
              <div className="qa-q">{x.q}</div>
              {x.a && <div className="qa-a">{answerBody(x.a)}</div>}
            </div>
          ))}
          {typing && <div className="qa-typing">Анализирую данные вашего бизнеса<i>.</i><i>.</i><i>.</i></div>}
        </div>
      )}
    </div>
  )
}

/* ── каркас раздела ── */
export function SectionShell({ title, sub, actions, ctx, children }) {
  return (
    <div>
      <a className="back-link" onClick={() => ctx.go('home')}>← Главная</a>
      <div className="section-head">
        <div>
          <h1>{title}</h1>
          {sub && <p>{sub}</p>}
        </div>
        {actions && <div className="section-actions">{actions}</div>}
      </div>
      <QueryBar hint={SECTION_HINTS[title] || {}} onNavigate={ctx.go} />
      {children}
    </div>
  )
}

/* ── строка мини-метрик с графиками: рост — зелёный, падение — красный ──
   labels — подписи дат для тултипов (месяцы года / дни выбранного периода) */
export function StatRow({ stats, labels }) {
  return (
    <div className="stat-row">
      {stats.map(([label, val, sub, trend]) => {
        const down = trend === 'down'
        let n = parseFloat(String(val).replace(/[^\d.,-]/g, '').replace(',', '.'))
        if (!isFinite(n) || n <= 0) n = 100
        if (n < 50) n *= 10
        const end = Math.round(n)
        const start = Math.round(down ? end * 1.22 : end * 0.8)
        const seed = [...label].reduce((a, c) => a + c.charCodeAt(0), 0) % 97
        const series = mkSeries(start, end, 40, Math.max(2, end * 0.045), seed)
        return (
          <div key={label} className="stat">
            <div className="s-label">{label}</div>
            <div className="s-val">{val}</div>
            {sub && <div className={`s-sub${down ? ' neg' : ''}`}>{sub}</div>}
            <Spark series={series} labels={labels} color={down ? '#e30611' : '#26a95c'} unit="" height={46} />
          </div>
        )
      })}
    </div>
  )
}

/* ── таблица ── */
export function T({ head, rows, onRow }) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} onClick={onRow ? () => onRow(i) : undefined} style={onRow ? undefined : { cursor: 'default' }}>
              {r.map((c, j) => <td key={j}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── модальная форма-заявка ── */
export function FormModal({ title, sub, fields, submitLabel = 'Отправить', successText = 'Заявка отправлена! Менеджер свяжется с вами в течение часа.', onClose, ping }) {
  const [sent, setSent] = useState(false)
  const submit = () => {
    setSent(true)
    ping && ping('Заявка отправлена (демо)')
    setTimeout(onClose, 1600)
  }
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {sent ? (
          <div className="form-success">
            <div className="big">✓</div>
            <h3>Готово!</h3>
            <p>{successText}</p>
          </div>
        ) : (
          <>
            <div className="modal-head">
              <div>
                <div className="modal-title">{title}</div>
                {sub && <div className="modal-sub">{sub}</div>}
              </div>
              <button className="icon-btn modal-close" onClick={onClose} aria-label="Закрыть">{icons.close}</button>
            </div>
            <div className="form-grid">
              {fields.map((f) => (
                <div key={f.label} className="field">
                  <label>{f.label}</label>
                  {f.type === 'select' ? (
                    <select className="select" style={{ width: '100%' }} defaultValue={f.options[0]}>
                      {f.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea placeholder={f.placeholder || ''} defaultValue={f.value || ''} />
                  ) : (
                    <input placeholder={f.placeholder || ''} defaultValue={f.value || ''} />
                  )}
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-red" style={{ marginTop: 0 }} onClick={submit}>{submitLabel}</button>
              <button className="btn-gray" style={{ width: 'auto' }} onClick={onClose}>Отмена</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
