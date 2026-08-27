'use client'

import { useEffect, useRef, useState } from 'react'
import { icons, fmt, Ic, FormModal, ClientName, QueryBar, Spark } from './ui'
import { Section } from './sections'
import { HOME_HINT } from './answers'
import {
  NAV, CLIENTS, ORDERS, SEG_LABEL, TASKS_FULL,
  NOTIFS, PROFILE, SUPPORT_GREETING, SUPPORT_REPLIES, HOME_DASH,
} from './data'

/* подписи времени для дашбордов «сегодня»: 8:00 → 20:30 */
const DAY_LABELS = Array.from({ length: 26 }, (_, i) => `${8 + Math.floor(i / 2)}:${i % 2 ? '30' : '00'}`)
const DASH_COLOR = { up: '#26a95c', down: '#e30611', warn: '#8F8FFF' }

export default function Page() {
  const [theme, setTheme] = useState('light')
  const [active, setActive] = useState('home')
  const [sideOpen, setSideOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const [tasks, setTasks] = useState(TASKS_FULL.map((t) => ({ ...t, done: false })))
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifRead, setNotifRead] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [clientOpen, setClientOpen] = useState(null)
  const [orderOpen, setOrderOpen] = useState(null)
  const [cardForm, setCardForm] = useState(false)

  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsgs, setChatMsgs] = useState([])
  const [chatTyping, setChatTyping] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const chatStarted = useRef(false)
  const chatReplyIdx = useRef(0)
  const chatBodyRef = useRef(null)

  const heroAsk = useRef(null)

  useEffect(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem('theme')
    if (saved === 'dark') setTheme('dark')
  }, [])

  // push-уведомление о кешбэке — на 15-й секунде просмотра
  const [pushOpen, setPushOpen] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setPushOpen(true), 15000)
    return () => clearTimeout(t)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    if (next === 'dark') document.documentElement.dataset.theme = 'dark'
    else delete document.documentElement.dataset.theme
    try { localStorage.setItem('theme', next) } catch { }
  }

  useEffect(() => {
    if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
  }, [chatMsgs, chatTyping])

  const ping = (msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }

  const go = (id) => {
    if (id === 'card-form') { setCardForm(true); return }
    setActive(id)
    setSideOpen(false)
    setNotifOpen(false)
    window.scrollTo({ top: 0 })
  }

  const toggleTask = (i) => setTasks((ts) => ts.map((t, j) => (j === i ? { ...t, done: !t.done } : t)))
  const addTask = (text) => { setTasks((ts) => [{ text, time: 'Сегодня', done: false }, ...ts]); ping('Задача добавлена') }

  const openChat = () => {
    setChatOpen(true)
    setNotifOpen(false)
    if (!chatStarted.current) {
      chatStarted.current = true
      setChatTyping(true)
      setTimeout(() => {
        setChatTyping(false)
        setChatMsgs([{ from: 'them', text: SUPPORT_GREETING }])
      }, 1800)
    }
  }

  const sendChat = () => {
    const text = chatInput.trim()
    if (!text || chatTyping) return
    setChatInput('')
    setChatMsgs((m) => [...m, { from: 'me', text }])
    setChatTyping(true)
    setTimeout(() => {
      setChatTyping(false)
      setChatMsgs((m) => [...m, { from: 'them', text: SUPPORT_REPLIES[chatReplyIdx.current++ % SUPPORT_REPLIES.length] }])
    }, 1600)
  }

  const ctx = {
    go, ping, theme, toggleTheme,
    openClient: setClientOpen, openOrder: setOrderOpen, openProfile: () => setProfileOpen(true),
    tasks, toggleTask, addTask,
  }

  const clientOrders = clientOpen ? ORDERS.filter((o) => o.client === clientOpen.name).slice(0, 3) : []

  return (
    <>
      {/* ── Шапка ── */}
      <header className="header">
        <button className="burger" onClick={() => setSideOpen((v) => !v)} aria-label="Меню">{icons.burger}</button>
        <a className="logo" onClick={() => go('home')}>
          <span className="logo-text"><span className="mts">МТС</span><span className="bank">БИЗНЕС</span></span>
        </a>
        <button className="sub-badge" onClick={() => go('premium')}>
          <span className="sub-star" aria-hidden="true">✦</span>
          <span className="sub-text">Премиум подписка</span>
          <span className="sub-chip">Активна</span>
        </button>
        <div className="header-icons">
          <button className="theme-switch" onClick={toggleTheme} aria-label="Переключить тему">
            <span className={theme === 'light' ? 'on' : ''}>{icons.sun}</span>
            <span className={`moon${theme === 'dark' ? ' on' : ''}`}>{icons.moon}</span>
          </button>
          <button className="icon-btn" onClick={openChat} aria-label="Чат поддержки">{icons.chat}<span className="dot" /></button>
          <div className="notif-wrap">
            <button className="icon-btn" onClick={() => setNotifOpen((v) => !v)} aria-label="Уведомления">
              {icons.bell}
              {!notifRead && <span className="dot" />}
            </button>
            {notifOpen && (
              <>
                <div className="pop-backdrop" onClick={() => setNotifOpen(false)} />
                <div className="notif-panel">
                  <div className="notif-head">
                    <h3>Уведомления</h3>
                    <button onClick={() => { setNotifRead(true); ping('Все уведомления прочитаны') }}>Прочитать все</button>
                  </div>
                  <div className="notif-list">
                    {NOTIFS.map((nt, i) => (
                      <div key={i} className="notif-item" onClick={() => go(nt.to)}>
                        <span className="notif-emoji">{nt.emoji}</span>
                        <div>
                          <div className="notif-text">{nt.text}</div>
                          <div className="notif-time">{nt.time}</div>
                        </div>
                        {!notifRead && i < 4 && <span className="notif-unread" />}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="account" onClick={() => setProfileOpen(true)}>
          <div className="avatar">ИА</div>
          <div className="account-texts">
            <div className="account-name">Пекарня «Хлеб да Соль»</div>
            <div className="account-sub">ИП Сиванев В.А.</div>
          </div>
          <span className="chevron"><Ic size={16}><path d="m6 9 6 6 6-6" /></Ic></span>
        </div>
      </header>

      <div className={`shell${active === 'home' ? ' shell-home' : ''}`}>
        {/* ── Сайдбар ── */}
        {sideOpen && <div className="side-backdrop" onClick={() => setSideOpen(false)} />}
        <aside className={`sidebar${sideOpen ? ' open' : ''}`}>
          {NAV.map((group, gi) => (
            <div key={gi}>
              {group.section && <div className="side-label">{group.section}</div>}
              {group.items.map((item) => (
                <button key={item.id} className={`side-item${active === item.id ? ' active' : ''}`} onClick={() => go(item.id)}>
                  {icons[item.icon]}
                  {item.label}
                  {item.badge && <span className={`badge${item.badgeClass ? ' ' + item.badgeClass : ''}`}>{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* ── Контент ── */}
        <main className={`main${active === 'home' ? ' main-home' : ''}`}>
          {active !== 'home' ? (
            <Section id={active} ctx={ctx} />
          ) : (
            <div className="home-panel">
              <section className="home-hero">
                <div className="welcome">
                  <h1>Задайте любой вопрос</h1>
                  <p>Виталий, я знаю всё о вашей пекарне — спросите своими словами.</p>
                </div>
                <div className="home-query">
                  <QueryBar hero hint={HOME_HINT} apiRef={heroAsk} onNavigate={go} />
                </div>
                <button className="hero-scroll"
                  onClick={() => document.querySelector('.home-dash')?.scrollIntoView({ behavior: 'smooth' })}>
                  Что с моим бизнесом сегодня? <span aria-hidden="true">↓</span>
                </button>
              </section>
              <section className="home-dash">
                <h2>Что с моим бизнесом сегодня?</h2>
                <p className="home-dash-sub">Шесть главных ответов — и понятное действие к каждому.</p>
                <div className="dash-grid">
                  {HOME_DASH.map((d) => (
                    <div key={d.title} className="card dash-card">
                      <div className="dash-top">
                        <span className="dash-title">{d.title}</span>
                        <span className={`dash-delta ${d.trend}`}>{d.delta}</span>
                      </div>
                      <div className="dash-value">{d.value}</div>
                      <Spark series={d.series} labels={DAY_LABELS} color={DASH_COLOR[d.trend]} unit={d.unit} height={54} />
                      <p className="dash-note">{d.note}</p>
                      <button className="dash-cta" onClick={() => go(d.cta.to)}>{d.cta.label} →</button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* ── Чат поддержки ── */}
      {chatOpen && (
        <div className="chat-panel">
          <div className="chat-head">
            <div className="avatar">ИС</div>
            <div>
              <div className="chat-title">Поддержка · Иван</div>
              <div className="chat-status">онлайн</div>
            </div>
            <button className="icon-btn chat-close" onClick={() => setChatOpen(false)} aria-label="Закрыть чат">{icons.close}</button>
          </div>
          <div className="chat-body" ref={chatBodyRef}>
            {chatMsgs.map((m, i) => (
              <div key={i} className={`msg ${m.from}`}>{m.text}</div>
            ))}
            {chatTyping && (
              <div className="typing-bubble"><i /><i /><i /></div>
            )}
          </div>
          <div className="chat-input-row">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Напишите сообщение…"
            />
            <button className="btn-send" onClick={sendChat} aria-label="Отправить">{icons.send}</button>
          </div>
        </div>
      )}

      {/* ── Профиль ИП ── */}
      {profileOpen && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setProfileOpen(false)}>
          <div className="modal">
            <div className="modal-head">
              <div className="avatar">ИА</div>
              <div>
                <div className="modal-title">ИП Сиванев Виталий Александрович</div>
                <div className="modal-sub">Пекарня «Хлеб да Соль» · <span className="chip green" style={{ padding: '2px 8px' }}>Действующий</span></div>
              </div>
              <button className="icon-btn modal-close" onClick={() => setProfileOpen(false)} aria-label="Закрыть">{icons.close}</button>
            </div>
            <div className="profile-grid">
              {PROFILE.map(([k, v]) => (
                <div key={k} className="profile-row">
                  <span className="k">{k}</span>
                  <span className="v">{v}</span>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-red" style={{ marginTop: 0 }} onClick={() => ping('Реквизиты скачаны (демо)')}>Скачать реквизиты</button>
              <button className="btn-gray" style={{ width: 'auto' }} onClick={() => { setProfileOpen(false); go('settings') }}>Настройки профиля</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Карточка клиента ── */}
      {clientOpen && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setClientOpen(null)}>
          <div className="modal">
            <div className="modal-head">
              <div className="avatar">{clientOpen.name.split(' ').map((w) => w[0]).join('')}</div>
              <div>
                <div className="modal-title"><ClientName name={clientOpen.name} /></div>
                <div className="modal-sub">{clientOpen.phone}</div>
              </div>
              <button className="icon-btn modal-close" onClick={() => setClientOpen(null)} aria-label="Закрыть">{icons.close}</button>
            </div>
            <div className="tags" style={{ marginTop: 14 }}>
              {clientOpen.seg.map((s) => <span key={s} className={`chip ${SEG_LABEL[s][1]}`}>{SEG_LABEL[s][0]}</span>)}
            </div>
            <div className="profile-grid">
              <div className="profile-row"><span className="k">Заказов всего</span><span className="v">{clientOpen.orders}</span></div>
              <div className="profile-row"><span className="k">Сумма покупок</span><span className="v">{fmt(clientOpen.spent)} ₽</span></div>
              <div className="profile-row"><span className="k">Последний заказ</span><span className="v">{clientOpen.last}</span></div>
              {clientOrders.length > 0 && (
                <div className="profile-row">
                  <span className="k">Недавние заказы</span>
                  <span className="v">
                    {clientOrders.map((o) => (
                      <a key={o.no} className="link-inline" style={{ display: 'block', marginBottom: 4 }}
                        onClick={() => { setClientOpen(null); setOrderOpen(o) }}>
                        {o.no} · {o.date} · {fmt(o.sum)} ₽
                      </a>
                    ))}
                  </span>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-red" style={{ marginTop: 0 }} onClick={() => { setClientOpen(null); go('comms'); ping(`Создайте рассылку для «${clientOpen.name}»`) }}>Написать</button>
              <button className="btn-gray" style={{ width: 'auto' }} onClick={() => { setClientOpen(null); go('orders') }}>Все заказы</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Карточка заказа ── */}
      {orderOpen && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setOrderOpen(null)}>
          <div className="modal">
            <div className="modal-head">
              <div>
                <div className="modal-title">Заказ {orderOpen.no}</div>
                <div className="modal-sub">{orderOpen.date} · {orderOpen.time} · <ClientName name={orderOpen.client} /></div>
              </div>
              <button className="icon-btn modal-close" onClick={() => setOrderOpen(null)} aria-label="Закрыть">{icons.close}</button>
            </div>
            <div className="tags" style={{ marginTop: 14 }}>
              <span className={`chip ${orderOpen.status[1]}`}>{orderOpen.status[0]}</span>
            </div>
            <div className="profile-grid">
              {orderOpen.items.map(([name, qty, price]) => (
                <div key={name} className="profile-row">
                  <span className="k">{name} × {qty}</span>
                  <span className="v" style={{ textAlign: 'right' }}>{fmt(price)} ₽</span>
                </div>
              ))}
              <div className="profile-row">
                <span className="k"><b>Итого</b></span>
                <span className="v" style={{ textAlign: 'right' }}><b>{fmt(orderOpen.sum)} ₽</b></span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-red" style={{ marginTop: 0 }} onClick={() => { setOrderOpen(null); ping('Заказ продублирован со статусом «Новый» (демо)') }}>Повторить заказ</button>
              <button className="btn-gray" style={{ width: 'auto' }} onClick={() => {
                const c = CLIENTS.find((x) => x.name === orderOpen.client)
                setOrderOpen(null)
                c ? setClientOpen(c) : ping('Клиент не найден')
              }}>Профиль клиента</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Заявка на бизнес-карту ── */}
      {cardForm && (
        <FormModal title="Заказ бизнес-карты" sub="Кэшбэк до 3%, привязана к деньгам бизнеса"
          fields={[
            { label: 'Имя на карте', value: 'VITALIY SIVANEV' },
            { label: 'Тип карты', type: 'select', options: ['Виртуальная (мгновенно)', 'Пластиковая (доставка 2–3 дня)'] },
          ]}
          submitLabel="Заказать" successText="Карта выпущена! Виртуальная карта уже доступна в разделе «Бизнес-карта»."
          onClose={() => setCardForm(false)} ping={ping} />
      )}

      {/* ── push: кешбэк за рекламу ── */}
      {pushOpen && (
        <div className="push-note" onClick={() => { setPushOpen(false); go('growth') }}>
          <span className="pn-emoji" aria-hidden="true">🎁</span>
          <div>
            <b>Кешбэк за рекламу — 20%</b>
            <p>Получайте баллы и тратьте на новые запуски. Можно покрыть до 100% стоимости новой кампании.</p>
          </div>
          <button className="icon-btn pn-close" onClick={(e) => { e.stopPropagation(); setPushOpen(false) }} aria-label="Закрыть">{icons.close}</button>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
