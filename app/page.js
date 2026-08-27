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
  const assistRef = useRef(null)
  const [assistVisible, setAssistVisible] = useState(false)

  useEffect(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem('theme')
    if (saved === 'dark') setTheme('dark')
  }, [])

  /* плашка «Отвечу на любой вопрос…» скрывается, когда ассистент на экране */
  useEffect(() => {
    if (active !== 'home') return
    const el = assistRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setAssistVisible(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [active])

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
      {/* ── Шапка: только меню, логотип, подписка и профиль ── */}
      <header className="header">
        <button className="burger" onClick={() => setSideOpen((v) => !v)} aria-label="Меню">
          {icons.burger}
          {!notifRead && <span className="dot" />}
        </button>
        <a className="logo" onClick={() => go('home')}>
          <span className="logo-text"><span className="mts">МТС</span><span className="bank">БИЗНЕС</span></span>
        </a>
        <button className="sub-badge" onClick={() => go('premium')}>
          <span className="sub-star" aria-hidden="true">✦</span>
          <span className="sub-text">Премиум подписка</span>
          <span className="sub-chip">Активна</span>
        </button>
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
          {/* инструменты: уведомления, поддержка и тема — здесь, а не в шапке */}
          <div className="side-tools">
            <button className="side-item" onClick={() => { setNotifOpen(true); setSideOpen(false) }}>
              {icons.bell}
              Уведомления
              {!notifRead && <span className="badge">4</span>}
            </button>
            <button className="side-item" onClick={() => { openChat(); setSideOpen(false) }}>
              {icons.chat}
              Чат с поддержкой
            </button>
          </div>
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
          {/* тема — в самом низу меню, под «Прочее» */}
          <div className="side-bottom">
            <button className="side-item" onClick={toggleTheme}>
              {icons.moon}
              Тёмная тема
              <span className={`toggle${theme === 'dark' ? ' on' : ''}`} style={{ marginLeft: 'auto', transform: 'scale(.82)' }} aria-hidden="true" />
            </button>
          </div>
        </aside>

        {/* ── Контент ── */}
        <main className={`main${active === 'home' ? ' main-home' : ''}`}>
          {active !== 'home' ? (
            <Section id={active} ctx={ctx} />
          ) : (
            <div className="home-panel">
              {/* дашборды — на самом верху, одинаково на десктопе и мобильном */}
              <section className="home-dash">
                <h2>Что с моим бизнесом сегодня?</h2>
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

              {/* ассистент — внизу */}
              <section className="home-assist" ref={assistRef}>
                <div className="welcome">
                  <h1>Добро пожаловать, Виталий!</h1>
                  <p>Спросите о вашем бизнесе своими словами — отвечу и сразу предложу действие.</p>
                </div>
                <div className="home-query">
                  <QueryBar hero hint={HOME_HINT} apiRef={heroAsk} onNavigate={go} />
                </div>
              </section>

              {/* плашка-путь к ассистенту: видна, пока ассистент вне экрана и меню закрыто */}
              {!assistVisible && !sideOpen && (
                <button className="assist-pill"
                  onClick={() => assistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                  Отвечу на любой вопрос о вашем бизнесе <span aria-hidden="true">↓</span>
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Уведомления (открываются из меню) ── */}
      {notifOpen && (
        <>
          <div className="pop-backdrop" onClick={() => setNotifOpen(false)} />
          <div className="notif-panel menu-notif">
            <div className="notif-head">
              <h3>Уведомления</h3>
              <button onClick={() => { setNotifRead(true); ping('Все уведомления прочитаны') }}>Прочитать все</button>
            </div>
            <div className="notif-list">
              {NOTIFS.map((nt, i) => (
                <div key={i} className="notif-item" onClick={() => { setNotifOpen(false); go(nt.to) }}>
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
