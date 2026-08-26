'use client'

import { useState } from 'react'
import { icons, fmt, Spark, SectionShell, StatRow, T, FormModal, ClientName, mkSeries } from './ui'
import {
  CLIENTS, ORDERS, SEG_LABEL, SEGMENTS, CAMPAIGNS, TOP_PRODUCTS, WEEK_LOAD,
  TXS, TERMINALS, GUARANTEES, TAX_EVENTS, DEPOSIT_PRODUCTS, DOCS,
  REVENUE_SERIES, GROWTH_ACTIONS, KPIS, PROMOS, SERVICES,
  CHANNELS, GOALS, CITIES,
} from './data'

const chip = ([label, cls], key) => <span key={key || label} className={`chip ${cls}`}>{label}</span>

/* ═══ Временные фильтры: Сегодня / Год / Месяц / Период ═══
   Сегодня — 21 августа 2026. SC масштабирует месячные значения под период. */
const HOURS = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
function usePeriod(def = 'month') {
  const [mode, setMode] = useState(def)
  const [calOpen, setCalOpen] = useState(false)
  const [range, setRange] = useState(null)
  return { mode, setMode, calOpen, setCalOpen, range, setRange }
}
function periodInfo(p) {
  if (p.mode === 'year') return { k: 9.5, labels: YEAR_LABELS, sub: 'за 12 месяцев' }
  if (p.mode === 'today') return { k: 0.016, labels: HOURS, sub: 'сегодня, 21 августа' }
  if (p.mode === 'range' && p.range) {
    const days = Math.max(1, Math.round((p.range.end - p.range.start) / 86400000) + 1)
    const labels = Array.from({ length: Math.max(days, 2) }, (_, i) => {
      const d = new Date(p.range.start.getTime() + i * 86400000)
      return `${d.getDate()} ${M_FULL[d.getMonth()]}`
    })
    return { k: days / 31, labels, sub: `за ${days} дн.`, days }
  }
  return { k: 1, labels: undefined, sub: 'за месяц' }
}
function SC(n, k) { return fmt(Math.max(1, Math.round(n * k))) }
function TimeFilter({ p, withToday = false }) {
  const items = [...(withToday ? [['today', 'Сегодня']] : []), ['year', 'Год'], ['month', 'Месяц']]
  const periodLabel = p.range
    ? `${p.range.start.getDate()}.${String(p.range.start.getMonth() + 1).padStart(2, '0')} – ${p.range.end.getDate()}.${String(p.range.end.getMonth() + 1).padStart(2, '0')}`
    : 'Период'
  return (
    <div className="chips-row">
      {items.map(([m, label]) => (
        <button key={m} className={`filter-chip${p.mode === m ? ' active' : ''}`}
          onClick={() => { p.setMode(m); p.setCalOpen(false) }}>{label}</button>
      ))}
      <div className="cal-wrap">
        <button className={`filter-chip${p.mode === 'range' ? ' active' : ''}`} onClick={() => p.setCalOpen((v) => !v)}>📅 {periodLabel}</button>
        {p.calOpen && (
          <>
            <div className="pop-backdrop" onClick={() => p.setCalOpen(false)} />
            <Cal onApply={(s, e) => { p.setRange({ start: s, end: e }); p.setMode('range'); p.setCalOpen(false) }} />
          </>
        )}
      </div>
    </div>
  )
}

/* ═══ CRM пекарни ═══ */
function Crm({ ctx }) {
  const [q, setQ] = useState('')
  const [seg, setSeg] = useState('all')
  const [form, setForm] = useState(false)
  const list = CLIENTS.filter((c) =>
    (seg === 'all' || c.seg.includes(seg)) && c.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <SectionShell title="CRM пекарни" sub="Управляйте клиентами и увеличивайте продажи" ctx={ctx}
      actions={<button className="btn-red" style={{ marginTop: 0 }} onClick={() => setForm(true)}>+ Добавить клиента</button>}>
      <StatRow stats={[
        ['Всего клиентов', '1 486', '+3 сегодня'],
        ['Повторные покупки', '42%', 'на сегодня'],
        ['LTV клиента', '6 840 ₽', 'на сегодня'],
        ['NPS', '72', 'на сегодня'],
      ]} />
      <div className="crm-controls">
        <div className="input-search">
          {icons.search}
          <input placeholder="Поиск по имени" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" value={seg} onChange={(e) => setSeg(e.target.value)}>
          <option value="all">Все сегменты</option>
          <option value="regular">Постоянные</option>
          <option value="vip">VIP</option>
          <option value="new">Новые</option>
          <option value="sleep">Спящие</option>
        </select>
      </div>
      <T
        head={['Клиент', 'Сегменты', 'Заказов', 'Сумма покупок', 'Последний заказ']}
        rows={list.map((c) => [
          <><div className="client-name"><ClientName name={c.name} /></div><div className="client-phone">{c.phone}</div></>,
          <div className="tags">{c.seg.map((s) => chip(SEG_LABEL[s], s))}</div>,
          c.orders, `${fmt(c.spent)} ₽`, c.last,
        ])}
        onRow={(i) => ctx.openClient(list[i])}
      />
      {list.length === 0 && <p className="empty-note">Никого не нашли — попробуйте изменить запрос или сегмент.</p>}
      {form && <FormModal title="Новый клиент" sub="Клиент появится в базе CRM"
        fields={[
          { label: 'Имя и фамилия', placeholder: 'Например, Мария Иванова' },
          { label: 'Телефон', placeholder: '+7 (___) ___-__-__' },
          { label: 'Сегмент', type: 'select', options: ['Новый', 'Постоянный', 'VIP'] },
        ]}
        submitLabel="Добавить" successText="Клиент добавлен в базу CRM."
        onClose={() => setForm(false)} ping={ctx.ping} />}
    </SectionShell>
  )
}

/* ═══ Заказы ═══ */
function Orders({ ctx }) {
  const [st, setSt] = useState('all')
  const [form, setForm] = useState(false)
  const [visible, setVisible] = useState(8)
  const p = usePeriod('month')
  const pi = periodInfo(p)
  const TODAY = '21.08.2026'
  const parseD = (s) => { const [d, m, y] = s.split('.').map(Number); return new Date(y, m - 1, d).getTime() }
  const list = ORDERS.filter((o) => {
    if (st !== 'all' && o.status[0] !== st) return false
    if (p.mode === 'today') return o.date === TODAY
    if (p.mode === 'range' && p.range) {
      const t = parseD(o.date)
      return t >= p.range.start.getTime() && t <= p.range.end.getTime()
    }
    return true
  })
  const shown = list.slice(0, visible)
  const statuses = ['all', 'Новый', 'В работе', 'Выполнен', 'Отменён']
  return (
    <SectionShell title="Заказы" sub="Все заказы пекарни" ctx={ctx}
      actions={<button className="btn-red" style={{ marginTop: 0 }} onClick={() => setForm(true)}>+ Новый заказ</button>}>
      <TimeFilter p={p} withToday />
      <StatRow labels={pi.labels} stats={[
        ['Заказы', SC(2940, pi.k), pi.sub],
        ['Выручка', `${SC(1245000, pi.k)} ₽`, pi.sub],
        ['Средний чек', '425 ₽', pi.sub],
        ['Отмены', SC(12, pi.k), 'меньше 1%', 'down'],
      ]} />
      <div className="chips-row" style={{ marginTop: 12 }}>
        {statuses.map((s) => (
          <button key={s} className={`filter-chip${st === s ? ' active' : ''}`} onClick={() => setSt(s)}>
            {s === 'all' ? 'Все' : s}
          </button>
        ))}
      </div>
      <div className="list-tools">
        <button className="btn-gray" style={{ width: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}
          onClick={() => ctx.ping('Заказы выгружены в XLSX (демо)')}>{icons.download} Выгрузить заказы</button>
      </div>
      <T
        head={['Заказ', 'Дата', 'Клиент', 'Сумма', 'Статус']}
        rows={shown.map((o) => [
          <b>{o.no}</b>, `${o.date} · ${o.time}`,
          <a className="link-inline" onClick={(e) => { e.stopPropagation(); const c = CLIENTS.find((x) => x.name === o.client); c ? ctx.openClient(c) : ctx.ping('Клиент не найден') }}><ClientName name={o.client} /></a>,
          <b>{fmt(o.sum)} ₽</b>, chip(o.status),
        ])}
        onRow={(i) => ctx.openOrder(shown[i])}
      />
      {list.length === 0 && <p className="empty-note">Заказов за выбранный период не найдено — измените фильтр.</p>}
      {list.length > visible && (
        <div className="more-row">
          <button className="btn-gray" style={{ width: 'auto' }} onClick={() => setVisible((v) => v + 8)}>
            Ещё {Math.min(8, list.length - visible)} заказов
          </button>
        </div>
      )}
      {form && <FormModal title="Новый заказ" sub="Заказ появится в списке со статусом «Новый»"
        fields={[
          { label: 'Клиент', type: 'select', options: CLIENTS.map((c) => c.name) },
          { label: 'Состав заказа', type: 'textarea', placeholder: 'Например: хлеб бородинский ×2, круассан ×4' },
          { label: 'Сумма, ₽', placeholder: '0' },
        ]}
        submitLabel="Создать" successText="Заказ создан и передан на кухню."
        onClose={() => setForm(false)} ping={ctx.ping} />}
    </SectionShell>
  )
}

/* ═══ Клиенты ═══ */
function Clients({ ctx }) {
  const [q, setQ] = useState('')
  const [visible, setVisible] = useState(10)
  const all = CLIENTS.filter((c) => (c.name + c.phone).toLowerCase().includes(q.toLowerCase()))
  const list = all.slice(0, visible)
  return (
    <SectionShell title="Клиенты" sub={`База клиентов пекарни — ${CLIENTS.length} последних показаны из 1 486`} ctx={ctx}
      actions={<button className="btn-gray" style={{ width: 'auto' }} onClick={() => ctx.go('segments')}>Сегменты →</button>}>
      <div className="crm-controls">
        <div className="input-search">
          {icons.search}
          <input placeholder="Поиск по имени или телефону" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="list-tools">
        <button className="btn-gray" style={{ width: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}
          onClick={() => ctx.ping('База клиентов выгружена в XLSX (демо)')}>{icons.download} Выгрузить клиентов</button>
      </div>
      <T
        head={['Клиент', 'Телефон', 'Сегменты', 'Последний заказ', '']}
        rows={list.map((c) => [
          <b><ClientName name={c.name} /></b>, c.phone,
          <div className="tags">{c.seg.map((s) => chip(SEG_LABEL[s], s))}</div>,
          c.last,
          <button className="btn-gray" style={{ width: 'auto', padding: '7px 12px' }}
            onClick={(e) => { e.stopPropagation(); ctx.go('comms'); ctx.ping(`Создайте рассылку для «${c.name}»`) }}>Написать</button>,
        ])}
        onRow={(i) => ctx.openClient(list[i])}
      />
      {all.length === 0 && <p className="empty-note">Никого не нашли по запросу «{q}».</p>}
      {all.length > visible && (
        <div className="more-row">
          <button className="btn-gray" style={{ width: 'auto' }} onClick={() => setVisible((v) => v + 8)}>
            Ещё {Math.min(8, all.length - visible)} клиентов
          </button>
        </div>
      )}
    </SectionShell>
  )
}

/* ═══ Сегменты ═══ */
function Segments({ ctx }) {
  const [form, setForm] = useState(false)
  return (
    <SectionShell title="Сегменты" sub="Группируйте клиентов и делайте персональные предложения" ctx={ctx}
      actions={<button className="btn-red" style={{ marginTop: 0 }} onClick={() => setForm(true)}>+ Создать сегмент</button>}>
      <div className="seg-grid">
        {SEGMENTS.map((s) => (
          <div key={s.id} className="card seg-card">
            <div className="seg-top">
              <span className={`chip ${s.color}`}>{s.name}</span>
              <b className="seg-count">{s.count}</b>
            </div>
            <p className="seg-desc">{s.desc}</p>
            <p className="seg-rev">Выручка: <b>{s.revenue}</b></p>
            <div className="seg-actions">
              <button className="btn-gray" style={{ width: 'auto' }} onClick={() => ctx.go('clients')}>Список</button>
              <button className="btn-gray" style={{ width: 'auto' }} onClick={() => { ctx.go('comms'); ctx.ping(`Сегмент «${s.name}» выбран для рассылки`) }}>Рассылка</button>
            </div>
          </div>
        ))}
      </div>
      {form && <FormModal title="Новый сегмент" sub="Клиенты попадут в сегмент автоматически по условию"
        fields={[
          { label: 'Название', placeholder: 'Например, «Любители тортов»' },
          { label: 'Условие', type: 'select', options: ['Заказывали торты за 90 дней', 'Средний чек выше 1 000 ₽', 'Нет заказов 30+ дней', 'День рождения в этом месяце'] },
        ]}
        submitLabel="Создать" successText="Сегмент создан — клиенты добавляются автоматически."
        onClose={() => setForm(false)} ping={ctx.ping} />}
    </SectionShell>
  )
}

/* ═══ Коммуникации ═══ */
function Comms({ ctx }) {
  const [form, setForm] = useState(false)
  const p = usePeriod('month')
  const pi = periodInfo(p)
  return (
    <SectionShell title="Коммуникации" sub="SMS, Push и Email-рассылки по сегментам клиентов" ctx={ctx}
      actions={<button className="btn-red" style={{ marginTop: 0 }} onClick={() => setForm(true)}>+ Создать рассылку</button>}>
      <TimeFilter p={p} withToday />
      <StatRow labels={pi.labels} stats={[
        ['Отправлено', SC(764, pi.k), pi.sub],
        ['Средняя конверсия', '14,2%', pi.sub],
        ['Выручка с рассылок', `${SC(96400, pi.k)} ₽`, pi.sub],
        ['Отписки', '0,8%', 'ниже нормы', 'down'],
      ]} />
      <T
        head={['Кампания', 'Канал', 'Статус', 'Охват', 'Конверсия', 'Дата']}
        rows={CAMPAIGNS.map((c) => [<b>{c.name}</b>, c.channel, chip(c.status), c.reach, c.conv, c.date])}
        onRow={() => setForm(true)}
      />
      {form && <FormModal title="Новая рассылка" sub="Сообщение уйдёт выбранному сегменту"
        fields={[
          { label: 'Канал', type: 'select', options: ['SMS', 'Push', 'Email'] },
          { label: 'Сегмент', type: 'select', options: SEGMENTS.map((s) => `${s.name} (${s.count})`) },
          { label: 'Город', type: 'select', options: CITIES },
          { label: 'Пол', type: 'select', options: ['Все', 'Женщины', 'Мужчины'] },
          { label: 'Возраст', type: 'select', options: ['Любой', '18–24', '25–34', '35–44', '45+'] },
          { label: 'Текст сообщения', type: 'textarea', placeholder: 'Например: Только в выходные — скидка 15% на всю выпечку!' },
        ]}
        submitLabel="Запустить" successText="Рассылка запланирована и скоро отправится."
        onClose={() => setForm(false)} ping={ctx.ping} />}
    </SectionShell>
  )
}

/* ═══ Аналитика ═══ */
const M_FULL = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const M_NAME = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const YEAR_LABELS = ['Сен 2025', 'Окт 2025', 'Ноя 2025', 'Дек 2025', 'Янв 2026', 'Фев 2026', 'Мар 2026', 'Апр 2026', 'Май 2026', 'Июн 2026', 'Июл 2026', 'Авг 2026']
const YEAR_SERIES = mkSeries(640000, 1245000, 12, 52000, 13)

/* календарь выбора периода */
const MAX_TS = new Date(2026, 7, 21, 23, 59).getTime() // сегодня — 21 августа 2026, дальше даты неактивны
function Cal({ onApply }) {
  const [ym, setYm] = useState({ y: 2026, m: 7 })
  const [start, setStart] = useState(null)
  const [end, setEnd] = useState(null)
  const startDow = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7
  const dim = new Date(ym.y, ym.m + 1, 0).getDate()
  const cells = [...Array(startDow).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)]
  const ts = (d) => new Date(ym.y, ym.m, d).getTime()
  const off = (d) => ts(d) > MAX_TS
  const pick = (d) => {
    if (off(d)) return
    const t = new Date(ym.y, ym.m, d)
    if (!start || (start && end)) { setStart(t); setEnd(null) }
    else if (t < start) setStart(t)
    else setEnd(t)
  }
  const inRange = (d) => start && end && ts(d) >= start.getTime() && ts(d) <= end.getTime()
  const isEdge = (d) => (start && ts(d) === start.getTime()) || (end && ts(d) === end.getTime())
  return (
    <div className="cal-pop">
      <div className="cal-head">
        <button onClick={() => setYm(({ y, m }) => (m ? { y, m: m - 1 } : { y: y - 1, m: 11 }))} aria-label="Прошлый месяц">‹</button>
        <b>{M_NAME[ym.m]} {ym.y}</b>
        <button onClick={() => setYm(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))} aria-label="Следующий месяц">›</button>
      </div>
      <div className="cal-grid">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => <span key={d} className="cal-dow">{d}</span>)}
        {cells.map((d, i) => (d === null
          ? <span key={`e${i}`} />
          : <button key={i} disabled={off(d)} className={`cal-day${isEdge(d) ? ' edge' : inRange(d) ? ' in' : ''}`} onClick={() => pick(d)}>{d}</button>))}
      </div>
      <div className="cal-foot">
        <span>{start ? `${start.getDate()} ${M_FULL[start.getMonth()]}` : 'Начало'} — {end ? `${end.getDate()} ${M_FULL[end.getMonth()]}` : 'конец'}</span>
        <button className="btn-red" style={{ marginTop: 0, padding: '8px 14px' }} disabled={!start || !end}
          onClick={() => onApply(start, end)}>Применить</button>
      </div>
    </div>
  )
}

function Analytics({ ctx }) {
  const [mode, setMode] = useState('month')
  const [calOpen, setCalOpen] = useState(false)
  const [range, setRange] = useState(null)

  let stats, series, labels, chartSub
  if (mode === 'year') {
    stats = [
      ['Выручка', '11 840 000 ₽', '+31% к прошлому году'],
      ['Заказы', '27 400', '+24% к прошлому году'],
      ['Новые клиенты', '1 034', 'за 12 месяцев'],
      ['Средний чек', '418 ₽', '+6% за год'],
    ]
    series = YEAR_SERIES; labels = YEAR_LABELS; chartSub = 'последние 12 месяцев'
  } else if (mode === 'range' && range) {
    const days = Math.max(1, Math.round((range.end - range.start) / 86400000) + 1)
    const rev = days * 40160
    stats = [
      ['Выручка', `${fmt(rev)} ₽`, `за ${days} дн.`],
      ['Заказы', fmt(days * 95), '≈95 в день'],
      ['Новые клиенты', fmt(Math.round(days * 4.1)), 'за период'],
      ['Средний чек', '423 ₽', 'за период'],
    ]
    const n = Math.max(days, 2)
    series = mkSeries(Math.round((rev / days) * 0.82), Math.round((rev / days) * 1.15), n, Math.round((rev / days) * 0.07), days)
    labels = Array.from({ length: n }, (_, i) => {
      const d = new Date(range.start.getTime() + i * 86400000)
      return `${d.getDate()} ${M_FULL[d.getMonth()]}`
    })
    chartSub = `${range.start.getDate()} ${M_FULL[range.start.getMonth()]} — ${range.end.getDate()} ${M_FULL[range.end.getMonth()]}`
  } else {
    stats = [
      ['Выручка', '1 245 000 ₽', '+12% к июню'],
      ['Заказы', '2 940', '+8% к июню'],
      ['Новые клиенты', '128', '+18% к июню'],
      ['Средний чек', '425 ₽', '+7% к июню'],
    ]
    series = REVENUE_SERIES; labels = undefined; chartSub = 'июль 2026'
  }
  const periodLabel = range
    ? `${range.start.getDate()}.${String(range.start.getMonth() + 1).padStart(2, '0')} – ${range.end.getDate()}.${String(range.end.getMonth() + 1).padStart(2, '0')}`
    : 'Период'

  return (
    <SectionShell title="Аналитика" sub="Продажи и динамика бизнеса" ctx={ctx}
      actions={<button className="btn-gray" style={{ width: 'auto' }} onClick={() => ctx.ping('Отчёт выгружен в PDF (демо)')}>{icons.download} Выгрузить отчёт</button>}>
      <div className="chips-row">
        <button className={`filter-chip${mode === 'year' ? ' active' : ''}`} onClick={() => { setMode('year'); setCalOpen(false) }}>Весь год</button>
        <button className={`filter-chip${mode === 'month' ? ' active' : ''}`} onClick={() => { setMode('month'); setCalOpen(false) }}>Месяц</button>
        <div className="cal-wrap">
          <button className={`filter-chip${mode === 'range' ? ' active' : ''}`} onClick={() => setCalOpen((v) => !v)}>📅 {periodLabel}</button>
          {calOpen && (
            <>
              <div className="pop-backdrop" onClick={() => setCalOpen(false)} />
              <Cal onApply={(s, e) => { setRange({ start: s, end: e }); setMode('range'); setCalOpen(false) }} />
            </>
          )}
        </div>
      </div>
      <StatRow stats={stats} labels={labels} />
      <div className="kpi-row" style={{ marginTop: 18 }}>
        {KPIS.map((k) => (
          <div key={k.title} className="card kpi">
            <div className="kpi-top">
              <div className="kpi-icon" style={{ background: k.iconBg, color: k.iconColor }}>{icons[k.icon]}</div>
              <div>
                <div className="kpi-title">{k.title}</div>
                <div className="kpi-value">{k.value}</div>
              </div>
            </div>
            <div className="kpi-delta green">{k.delta}</div>
            <div className="kpi-bench">
              <div className="kb-row">
                <span className="kb-label">Вы</span>
                <span className="kb-track"><i style={{ width: '100%', background: k.iconColor }} /></span>
              </div>
              <div className="kb-row">
                <span className="kb-label">Конкуренты</span>
                <span className="kb-track"><i className="kb-comp" style={{ width: `${Math.round((k.comp / k.me) * 100)}%` }} /></span>
              </div>
              <div className="kb-note">У конкурентов: {k.compText}</div>
            </div>
            <Spark series={k.series} labels={labels} color="#26a95c" unit={k.unit} height={52} />
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3 className="block-title" style={{ fontSize: 16 }}>{mode === 'year' ? 'Выручка по месяцам' : 'Выручка по дням'}</h3>
        <p className="block-sub">{chartSub} · наведите на график, чтобы увидеть сумму</p>
        <Spark series={series} labels={labels} color="#8F8FFF" unit=" ₽" height={190} detailed />
      </div>
      <div className="two-col">
        <div className="card">
          <h3 className="block-title" style={{ fontSize: 16 }}>Топ-товары</h3>
          <p className="block-sub">Доля в выручке за июль</p>
          <div style={{ marginTop: 12 }}>
            {TOP_PRODUCTS.map(([name, pct]) => (
              <div key={name} className="bar-row">
                <span className="bar-label">{name}</span>
                <span className="bar-track"><i className="bar-fill" style={{ width: `${pct * 4}%` }} /></span>
                <span className="bar-val">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="block-title" style={{ fontSize: 16 }}>Загрузка по дням недели</h3>
          <p className="block-sub">Суббота — самый сильный день</p>
          <div className="weekbars">
            {WEEK_LOAD.map(([d, h]) => (
              <div key={d} className="wb">
                <i style={{ height: `${h}%` }} />
                <span>{d}</span>
              </div>
            ))}
          </div>
          <h3 className="block-title" style={{ fontSize: 16, marginTop: 22 }}>Воронка июля</h3>
          <div className="funnel">
            <div className="f-row"><div className="f-bar" style={{ width: '100%' }}>Посетители — 8 420</div></div>
            <div className="f-row"><div className="f-bar" style={{ width: '62%', opacity: .85 }}>Сделали заказ — 2 940</div></div>
            <div className="f-row"><div className="f-bar" style={{ width: '34%', opacity: .7 }}>Вернулись повторно — 310</div></div>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

/* ═══ Запуск кампании: каналы/цели, город, демография, бюджет, сегмент ═══ */
function CampaignLauncher({ ctx, onClose }) {
  const [tab, setTab] = useState('channels')
  const [chans, setChans] = useState(['sms'])
  const [goal, setGoal] = useState(GOALS[0])
  const [budget, setBudget] = useState(25000)
  const [sent, setSent] = useState(false)
  const msgs = Math.round(budget / 5)
  const toggleChan = (id) => setChans((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  const launch = () => {
    setSent(true)
    ctx.ping('Кампания отправлена на модерацию (демо)')
    setTimeout(onClose, 1700)
  }
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal launcher">
        {sent ? (
          <div className="form-success">
            <div className="big">✓</div>
            <h3>Кампания запущена!</h3>
            <p>Модерация займёт до 1 часа. Статистика появится в «Аналитике кампаний».</p>
          </div>
        ) : (
          <>
            <div className="modal-head">
              <div>
                <div className="modal-title">Запуск кампании</div>
                <div className="modal-sub">Инструменты для кампаний с любым бюджетом · оплата за результат</div>
              </div>
              <button className="icon-btn modal-close" onClick={onClose} aria-label="Закрыть">{icons.close}</button>
            </div>
            <div className="seg-tabs">
              <button className={tab === 'channels' ? 'active' : ''} onClick={() => setTab('channels')}>По каналам</button>
              <button className={tab === 'goals' ? 'active' : ''} onClick={() => setTab('goals')}>По целям</button>
            </div>
            {tab === 'channels' ? (
              <div className="chan-grid">
                {CHANNELS.map((c) => (
                  <button key={c.id} className={`chan${chans.includes(c.id) ? ' on' : ''}`} onClick={() => toggleChan(c.id)}>
                    <span className="chan-ico">{icons[c.icon]}</span>
                    <span><b>{c.name}</b><i>{c.hint}</i></span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="chips-row" style={{ marginTop: 14 }}>
                {GOALS.map((g) => (
                  <button key={g} className={`filter-chip${goal === g ? ' active' : ''}`} onClick={() => setGoal(g)}>{g}</button>
                ))}
              </div>
            )}
            <div className="form-grid" style={{ marginTop: 16 }}>
              <div className="two-col" style={{ marginTop: 0 }}>
                <div className="field">
                  <label>Город</label>
                  <select className="select" style={{ width: '100%' }}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
                </div>
                <div className="field">
                  <label>Сегмент</label>
                  <select className="select" style={{ width: '100%' }}>
                    <option>Все клиенты (1 486)</option>
                    {SEGMENTS.map((s) => <option key={s.id}>{s.name} ({s.count})</option>)}
                  </select>
                </div>
              </div>
              <div className="two-col" style={{ marginTop: 0 }}>
                <div className="field">
                  <label>Пол</label>
                  <select className="select" style={{ width: '100%' }}><option>Все</option><option>Женщины</option><option>Мужчины</option></select>
                </div>
                <div className="field">
                  <label>Возраст</label>
                  <select className="select" style={{ width: '100%' }}><option>Любой</option><option>18–24</option><option>25–34</option><option>35–44</option><option>45+</option></select>
                </div>
              </div>
              <div className="field">
                <label>Ваш бюджет на рекламу</label>
                <input value={`${fmt(budget)} ₽`} readOnly />
                <div className="chips-row" style={{ marginTop: 8 }}>
                  {[5000, 10000, 25000, 50000, 100000].map((b) => (
                    <button key={b} className={`filter-chip${budget === b ? ' active' : ''}`} onClick={() => setBudget(b)}>{fmt(b)} ₽</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Количество сообщений · от 5,0 ₽ за сообщение</label>
                <input value={fmt(msgs)} readOnly />
                <div className="chips-row" style={{ marginTop: 8 }}>
                  {[1000, 2000, 5000, 10000, 20000].map((n) => (
                    <button key={n} className={`filter-chip${msgs === n ? ' active' : ''}`} onClick={() => setBudget(n * 5)}>{fmt(n)}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-red" style={{ marginTop: 0 }} onClick={launch}>Запустить кампанию</button>
              <button className="btn-gray" style={{ width: 'auto' }} onClick={onClose}>Отмена</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ═══ Привлечение клиентов ═══ */
function Growth({ ctx }) {
  const [form, setForm] = useState(false)
  const p = usePeriod('month')
  const pi = periodInfo(p)
  return (
    <SectionShell title="Привлечение клиентов" sub="Целевые действия: где взять новых клиентов и как вернуть старых" ctx={ctx}
      actions={<button className="btn-purple" style={{ marginTop: 0 }} onClick={() => setForm(true)}>Запустить кампанию</button>}>
      <TimeFilter p={p} withToday />
      <StatRow labels={pi.labels} stats={[
        ['Показы', SC(184300, pi.k), pi.sub],
        ['Клики', SC(9215, pi.k), 'CTR 5,0%'],
        ['Новые клиенты', SC(128, pi.k), 'из рекламы'],
        ['Расход', `${SC(24600, pi.k)} ₽`, 'CPL 192 ₽', 'down'],
      ]} />
      <div className="seg-grid">
        {GROWTH_ACTIONS.map((a) => (
          <div key={a.title} className="card seg-card">
            <b>{a.title}</b>
            <p className="seg-desc">{a.desc}</p>
            <p className="seg-rev">Прогноз: <b>{a.effect}</b></p>
            <div className="seg-actions">
              <button className="btn-purple" style={{ marginTop: 0 }}
                onClick={() => (a.to ? ctx.go(a.to) : setForm(true))}>{a.cta}</button>
            </div>
          </div>
        ))}
      </div>
      <T
        head={['Кампания', 'Канал', 'Статус', 'Показы', 'Клиенты', 'Расход']}
        rows={[
          [<b>«Свежая выпечка рядом» · район Пекарской</b>, 'Баннеры + гео', chip(['Активна', 'green']), '112 400', '86', '15 200 ₽'],
          [<b>«Торты на заказ» · поиск</b>, 'Поиск', chip(['Активна', 'green']), '48 700', '31', '7 100 ₽'],
          [<b>«Завтраки у дома» · соцсети</b>, 'Соцсети', chip(['Пауза', 'orange']), '23 200', '11', '2 300 ₽'],
        ]}
        onRow={() => ctx.ping('Детали кампании — статистика в разработке')}
      />
      <div className="card" style={{ marginTop: 18 }}>
        <h3 className="block-title" style={{ fontSize: 16 }}>Рекомендации</h3>
        <ul className="promo-list" style={{ maxWidth: 'none', marginTop: 12 }}>
          <li><span className="check">✓</span>Поднимите ставку по гео-кампании на выходные — суббота даёт 100% загрузки.</li>
          <li><span className="check">✓</span>Запустите ретаргетинг на «спящих» клиентов (214 человек) со скидкой 20%.</li>
          <li><span className="check">✓</span>Добавьте промо «Торт за 24 часа» — по этому запросу растёт спрос в вашем районе.</li>
        </ul>
      </div>
      {form && <CampaignLauncher ctx={ctx} onClose={() => setForm(false)} />}
    </SectionShell>
  )
}

/* ═══ Аналитика кампаний ═══ */
function MktAnalytics({ ctx }) {
  const p = usePeriod('month')
  const pi = periodInfo(p)
  return (
    <SectionShell title="Аналитика кампаний" sub="Сквозная воронка по запущенным кампаниям" ctx={ctx}
      actions={<button className="btn-purple" style={{ marginTop: 0 }} onClick={() => ctx.go('growth')}>Запустить кампанию</button>}>
      <TimeFilter p={p} withToday />
      <StatRow labels={pi.labels} stats={[
        ['Показы', SC(184300, pi.k), pi.sub],
        ['Просмотры', SC(61400, pi.k), 'VTR 33%'],
        ['Клики', SC(9215, pi.k), 'CTR 5,0%'],
        ['Покупки', SC(1108, pi.k), 'конверсия 12%'],
      ]} />
      <StatRow labels={pi.labels} stats={[
        ['CPM', '133 ₽', pi.sub],
        ['CPC', '2,67 ₽', pi.sub],
        ['CPA · покупка', '22,2 ₽', pi.sub],
        ['ROMI', '312%', pi.sub],
      ]} />
      <div className="card" style={{ marginTop: 18 }}>
        <h3 className="block-title" style={{ fontSize: 16 }}>Воронка кампаний</h3>
        <p className="block-sub">Показ → просмотр → клик → покупка · {pi.sub}</p>
        <div className="funnel">
          {[[`Показы — ${SC(184300, pi.k)}`, 100], [`Просмотры — ${SC(61400, pi.k)}`, 68], [`Клики — ${SC(9215, pi.k)}`, 40], [`Покупки — ${SC(1108, pi.k)}`, 20]].map(([t, w], i) => (
            <div key={t} className="f-row"><div className="f-bar" style={{ width: `${w}%`, opacity: 1 - i * 0.13 }}>{t}</div></div>
          ))}
        </div>
      </div>
      <T
        head={['Кампания', 'Канал', 'Показы', 'Клики', 'CTR', 'CPC', 'Покупки', 'Расход']}
        rows={[
          [<b>«Свежая выпечка рядом»</b>, 'Гео-баннеры', '112 400', '5 830', '5,2%', '2,61 ₽', '702', '15 200 ₽'],
          [<b>«Торты на заказ»</b>, 'Поиск', '48 700', '2 610', '5,4%', '2,72 ₽', '318', '7 100 ₽'],
          [<b>«Завтраки у дома»</b>, 'Telegram Ads', '23 200', '775', '3,3%', '2,97 ₽', '88', '2 300 ₽'],
        ]}
        onRow={() => ctx.ping('Детальная статистика кампании — в разработке')}
      />
    </SectionShell>
  )
}

/* ═══ Профиль клиента ═══ */
const OS_DATA = [['iOS', 46], ['Android', 50], ['Другое', 4]]
const SEX_DATA = [['Женщины', 58], ['Мужчины', 42]]
const AGE_DATA = [['18–24', 12], ['25–34', 38], ['35–44', 27], ['45–54', 15], ['55+', 8]]
const ProfileBars = ({ data }) => (
  <div style={{ marginTop: 10 }}>
    {data.map(([name, pct]) => (
      <div key={name} className="bar-row">
        <span className="bar-label" style={{ width: 90, minWidth: 70 }}>{name}</span>
        <span className="bar-track"><i className="bar-fill" style={{ width: `${pct}%` }} /></span>
        <span className="bar-val">{pct}%</span>
      </div>
    ))}
  </div>
)
function Audience({ ctx }) {
  const [geoFilter, setGeoFilter] = useState('all')
  const p = usePeriod('month')
  const pi = periodInfo(p)
  const blobScale = geoFilter === 'all' ? 1 : geoFilter === 'f' ? 0.72 : 0.85
  const openYandexMap = () => window.open('https://yandex.ru/maps/213/moscow/?ll=37.618423%2C55.751244&z=10', '_blank', 'noopener')
  return (
    <SectionShell title="Профиль клиента" sub="Портрет аудитории по данным запущенных кампаний" ctx={ctx}>
      <TimeFilter p={p} withToday />
      <StatRow labels={pi.labels} stats={[
        ['Средний чек из рекламы', '462 ₽', pi.sub],
        ['Клиенты из кампаний', SC(128, pi.k), pi.sub],
        ['Доля женщин', '58%', 'ядро аудитории'],
        ['Средний возраст', '34', '25–44 — 65%'],
      ]} />
      <div className="two-col">
        <div className="card">
          <h3 className="block-title" style={{ fontSize: 16 }}>Операционная система</h3>
          <ProfileBars data={OS_DATA} />
          <h3 className="block-title" style={{ fontSize: 16, marginTop: 20 }}>Пол</h3>
          <ProfileBars data={SEX_DATA} />
        </div>
        <div className="card">
          <h3 className="block-title" style={{ fontSize: 16 }}>Возраст</h3>
          <ProfileBars data={AGE_DATA} />
          <p className="block-sub" style={{ marginTop: 14 }}>Ядро аудитории — женщины 25–44 с iOS и Android поровну. Рекламные креативы с завтраками работают на них лучше всего.</p>
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3 className="block-title" style={{ fontSize: 16 }}>География клиентов</h3>
        <p className="block-sub">Локации клиентов из кампаний — нажмите на карту, чтобы открыть Яндекс Карты</p>
        <div className="geo-filters">
          <button className={`filter-chip${geoFilter === 'f' ? ' active' : ''}`} onClick={() => setGeoFilter('f')}>{icons.people} Женщины</button>
          <button className={`filter-chip${geoFilter === 'm' ? ' active' : ''}`} onClick={() => setGeoFilter('m')}>{icons.person} Мужчины</button>
          <button className={`filter-chip${geoFilter === 'all' ? ' active' : ''}`} onClick={() => setGeoFilter('all')}>Все</button>
        </div>
        <div className="map">
          <iframe
            title="Карта клиентов — Яндекс Карты"
            src="https://yandex.ru/map-widget/v1/?ll=37.618423%2C55.751244&z=8.6&lang=ru_RU"
            loading="lazy"
          />
          <div className="map-blob" style={{ left: '38%', top: '28%', width: 120, height: 120, transform: `translate(-50%,-50%) scale(${blobScale})` }} />
          <div className="map-blob" style={{ left: '55%', top: '52%', width: 74, height: 74, transform: `translate(-50%,-50%) scale(${blobScale})` }} />
          <div className="map-blob" style={{ left: '20%', top: '60%', width: 48, height: 48, transform: `translate(-50%,-50%) scale(${blobScale})` }} />
          <div className="map-blob" style={{ left: '76%', top: '34%', width: 42, height: 42, transform: `translate(-50%,-50%) scale(${blobScale})` }} />
          <button className="map-click" onClick={openYandexMap} aria-label="Открыть Яндекс Карты" />
          <span className="map-hint">Нажмите, чтобы открыть в Яндекс Картах</span>
        </div>
      </div>
    </SectionShell>
  )
}

/* ═══ Премиум подписка ═══ */
function Premium({ ctx }) {
  const [bill, setBill] = useState('month')
  const yearly = (m) => Math.round(m * 0.9)
  const PLANS = [
    { name: 'Старт', m: 299, feats: ['20 бесплатных платежей в месяц', 'Кэшбэк 1% по бизнес-карте', 'Базовая аналитика продаж', '50 запросов ассистенту в месяц'], cta: 'Перейти на Старт' },
    { name: 'Премиум', m: 990, current: true, feats: ['Безлимитные платежи внутри МТС Бизнес', 'Кэшбэк 3% по бизнес-карте', 'Полная аналитика и профиль клиента', 'Ассистент без ограничений', '+1 п.п. к ставке депозитов', 'Приоритетная поддержка 24/7'], cta: 'Ваш тариф' },
    { name: 'Максимум', m: 2990, feats: ['Всё из «Премиум»', 'Персональный менеджер', 'Кэшбэк 5% и скидка 20% на кампании', 'API и интеграции с 1С', 'До 5 сотрудников в кабинете'], cta: 'Перейти на Максимум' },
  ]
  return (
    <SectionShell title="Премиум подписка" sub="Подписка на сервисы МТС Бизнес: платежи, аналитика, ассистент и кэшбэк" ctx={ctx}>
      <div className="offer-banner purple">
        <div>
          <b>Ваша подписка: Премиум <span className="chip green" style={{ marginLeft: 8 }}>Активна</span></b>
          <p>Оплачена до 21 сентября 2026 · продлевается автоматически · отмена в любой момент</p>
        </div>
        <button className="btn-purple" style={{ marginTop: 0 }} onClick={() => ctx.ping('Управление подпиской — в разработке')}>Управлять</button>
      </div>
      <div className="bill-switch" onClick={() => setBill((b) => (b === 'month' ? 'year' : 'month'))}
        role="switch" aria-checked={bill === 'year'} aria-label="Период оплаты">
        <span className={bill === 'month' ? 'on' : ''}>В месяц</span>
        <span className={`toggle bill${bill === 'year' ? ' on' : ''}`} aria-hidden="true" />
        <span className={bill === 'year' ? 'on' : ''}>В год −10%</span>
      </div>
      <div className="seg-grid three">
        {PLANS.map((pl) => (
          <div key={pl.name} className={`card seg-card plan${pl.current ? ' cur' : ''}`}>
            <div className="seg-top">
              <b>{pl.name}</b>
              {pl.current && <span className="chip green">Активна</span>}
            </div>
            <div className="plan-price">
              {bill === 'year' ? (
                <>
                  <s className="old-price">{fmt(pl.m)} ₽</s>
                  <span className="dep-rate" style={{ fontSize: 24, marginTop: 0 }}>{fmt(yearly(pl.m))} ₽</span>
                  <span className="per">/мес при оплате за год</span>
                </>
              ) : (
                <>
                  <span className="dep-rate" style={{ fontSize: 24, marginTop: 0 }}>{fmt(pl.m)} ₽</span>
                  <span className="per">/мес</span>
                </>
              )}
            </div>
            <ul className="promo-list" style={{ maxWidth: 'none', flex: 1 }}>
              {pl.feats.map((f) => <li key={f}><span className="check">✓</span>{f}</li>)}
            </ul>
            <button className={pl.current ? 'btn-gray' : 'btn-red'} style={{ marginTop: 14 }} disabled={pl.current}
              onClick={() => ctx.ping(`Заявка на тариф «${pl.name}» отправлена — сменится со следующего периода (демо)`)}>
              {pl.cta}
            </button>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3 className="block-title" style={{ fontSize: 16 }}>Условия подписки</h3>
        <ul className="promo-list" style={{ maxWidth: 'none' }}>
          <li><span className="check">✓</span>Списание ежемесячно или раз в год с расчётного счёта; при оплате за год — скидка 10%.</li>
          <li><span className="check">✓</span>Сменить тариф можно в любой момент — перерасчёт со следующего платёжного периода.</li>
          <li><span className="check">✓</span>Отмена без штрафов: доступ сохраняется до конца оплаченного периода.</li>
          <li><span className="check">✓</span>Кэшбэк начисляется баллами и тратится на комиссии, кампании и сервисы МТС.</li>
        </ul>
      </div>
    </SectionShell>
  )
}

/* ═══ Акции ═══ */
function Promos({ ctx }) {
  return (
    <SectionShell title="Акции" sub="Специальные условия по продуктам для вашего бизнеса" ctx={ctx}>
      <div className="seg-grid three">
        {PROMOS.map((p) => (
          <div key={p.title} className="card seg-card">
            <div className="seg-top">
              <b>{p.title}</b>
              <span className={`chip ${p.urgent ? 'red' : 'green'}`}>{p.till}</span>
            </div>
            <p className="seg-desc" style={{ flex: 1 }}>{p.desc}</p>
            <button className="btn-purple" style={{ marginTop: 14, alignSelf: 'flex-start' }} onClick={() => ctx.go(p.to)}>{p.cta}</button>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

/* ═══ Сервисы для бизнеса: карточки → полноценная страница сервиса ═══ */
function Services({ ctx }) {
  const [sel, setSel] = useState(null)
  const connect = (name) => ctx.ping(`«${name}» — заявка на подключение отправлена, менеджер свяжется сегодня`)

  if (sel) {
    return (
      <div>
        <a className="back-link" onClick={() => setSel(null)}>← Все сервисы</a>
        <div className="svc-hero">
          <div className="svc-hero-body">
            <h1>{sel.name}</h1>
            <p>{sel.tagline}</p>
            <div className="svc-hero-meta">
              <span className="chip green">{sel.price}</span>
              <span className="chip green">Отмена в любой момент</span>
            </div>
            <button className="btn-red" onClick={() => connect(sel.name)}>Подключить</button>
          </div>
          <div className="svc-hero-art" aria-hidden="true">{sel.emoji}</div>
        </div>
        <div className="stat-row" style={{ marginTop: 18 }}>
          {sel.stats.map(([v, k]) => (
            <div key={k} className="stat">
              <div className="s-val" style={{ marginTop: 0 }}>{v}</div>
              <div className="s-label" style={{ marginTop: 4 }}>{k}</div>
            </div>
          ))}
        </div>
        <div className="two-col">
          <div className="card">
            <h3 className="block-title" style={{ fontSize: 16 }}>О сервисе</h3>
            {sel.long.map((p) => <p key={p.slice(0, 20)} className="svc-para">{p}</p>)}
          </div>
          <div className="card">
            <h3 className="block-title" style={{ fontSize: 16 }}>Возможности</h3>
            <ul className="promo-list" style={{ maxWidth: 'none' }}>
              {sel.bullets.map((b) => <li key={b}><span className="check">✓</span>{b}</li>)}
            </ul>
          </div>
        </div>
        <div className="card" style={{ marginTop: 18 }}>
          <h3 className="block-title" style={{ fontSize: 16 }}>Тарифы</h3>
          <div className="seg-grid three" style={{ marginTop: 14 }}>
            {sel.plans.map(([name, price, feat]) => (
              <div key={name} className="card seg-card">
                <b>{name}</b>
                <div className="dep-rate" style={{ fontSize: 20, marginTop: 8 }}>{price}</div>
                <p className="seg-desc" style={{ flex: 1 }}>{feat}</p>
                <button className="btn-gray" style={{ marginTop: 12 }} onClick={() => connect(`${sel.name} · ${name}`)}>Подключить</button>
              </div>
            ))}
          </div>
        </div>
        <div className="svc-cta-row">
          <div>
            <b>Готовы попробовать {sel.name}?</b>
            <p>Подключение занимает один день, менеджер поможет с настройкой.</p>
          </div>
          <button className="btn-red" style={{ marginTop: 0 }} onClick={() => connect(sel.name)}>Подключить</button>
        </div>
      </div>
    )
  }

  return (
    <SectionShell title="Сервисы для бизнеса" sub="Экосистема МТС: сервисы, которые помогают пекарне расти" ctx={ctx}>
      <div className="seg-grid three">
        {SERVICES.map((s) => (
          <div key={s.name} className="card seg-card svc-card" onClick={() => setSel(s)}>
            <div className="svc-card-emoji" aria-hidden="true">{s.emoji}</div>
            <b>{s.name}</b>
            <p className="seg-desc" style={{ flex: 1 }}>{s.desc}</p>
            <p className="seg-rev" style={{ flex: 'none' }}><b>{s.price}</b></p>
            <button className="btn-gray" style={{ marginTop: 12 }} onClick={(e) => { e.stopPropagation(); setSel(s) }}>Подробнее</button>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

/* ═══ Счета и платежи ═══ */
function Payments({ ctx }) {
  const [form, setForm] = useState(false)
  return (
    <SectionShell title="Счета и платежи" sub="Расчётный счёт и движение средств" ctx={ctx}
      actions={<button className="btn-red" style={{ marginTop: 0 }} onClick={() => setForm(true)}>+ Создать платёж</button>}>
      <div className="balance-card">
        <div>
          <div className="b-label">Расчётный счёт · 40802…3456</div>
          <div className="b-sum">2 456 780 ₽</div>
          <div className="b-sub">+ 129 040 ₽ за неделю</div>
        </div>
        <div className="b-actions">
          <button onClick={() => ctx.openProfile()}>Реквизиты</button>
          <button onClick={() => ctx.go('documents')}>Выписка</button>
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3 className="block-title" style={{ fontSize: 16 }}>Последние операции</h3>
        <div style={{ marginTop: 6 }}>
          {TXS.map((t, i) => (
            <div key={i} className="tx-row" onClick={() => ctx.ping('Платёжное поручение — детали в разработке')}>
              <div>
                <div className="tx-name">{t.name}</div>
                <div className="tx-desc">{t.desc}</div>
              </div>
              <div className="tx-right">
                <div className={`tx-sum ${t.sum > 0 ? 'plus' : 'minus'}`}>{t.sum > 0 ? '+' : '−'}{fmt(Math.abs(t.sum))} ₽</div>
                <div className="tx-date">{t.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {form && <FormModal title="Новый платёж" sub="Рублёвый перевод юрлицу или ИП"
        fields={[
          { label: 'Получатель', placeholder: 'Название организации или ИП' },
          { label: 'ИНН получателя', placeholder: '10 или 12 цифр' },
          { label: 'Сумма, ₽', placeholder: '0,00' },
          { label: 'Назначение платежа', type: 'textarea', placeholder: 'Оплата по счёту №…' },
        ]}
        submitLabel="Отправить платёж" successText="Платёж подписан и отправлен."
        onClose={() => setForm(false)} ping={ctx.ping} />}
    </SectionShell>
  )
}

/* ═══ Карты ═══ */
function Cards({ ctx }) {
  const [shown, setShown] = useState(false)
  const [frozen, setFrozen] = useState(false)
  const [melting, setMelting] = useState(false)
  const toggleFreeze = () => {
    if (melting) return
    if (!frozen) {
      setFrozen(true)
      ctx.ping('Карта заморожена — операции заблокированы')
    } else {
      setMelting(true)
      ctx.ping('Карта разморожена — операции снова доступны')
      setTimeout(() => { setFrozen(false); setMelting(false) }, 1250)
    }
  }
  return (
    <SectionShell title="Карты" sub="Бизнес-карты, привязанные к расчётному счёту" ctx={ctx}
      actions={<button className="btn-red" style={{ marginTop: 0 }} onClick={() => ctx.go('card-form')}>+ Выпустить карту</button>}>
      <div className="cards-layout">
        <div className="bank-card-wrap">
        {frozen && !melting && (
          <>
            <span className="steam s1" aria-hidden="true" />
            <span className="steam s2" aria-hidden="true" />
            <span className="steam s3" aria-hidden="true" />
            <span className="steam s4" aria-hidden="true" />
            <span className="steam s5" aria-hidden="true" />
            <span className="steam s6" aria-hidden="true" />
          </>
        )}
        <div className={`bank-card${frozen ? ' frozen' : ''}${melting ? ' melting' : ''}`}>
          <span className="bc-shine" aria-hidden="true" />
          <div className="bc-top">
            <span className="bc-brand">Supreme</span>
            <span className="bc-chip" aria-hidden="true" />
          </div>
          <div className="bc-number">{shown ? '9999 9999 9999 9999' : '••••  ••••  ••••  9999'}</div>
          <div className="bc-meta">
            <div>
              <div className="bc-cap">Срок</div>
              <div className="bc-val">{shown ? '09/29' : '••/••'}</div>
            </div>
            <div>
              <div className="bc-cap">CVC</div>
              <div className="bc-val">{shown ? '999' : '•••'}</div>
            </div>
            <div className="bc-holder">
              <div className="bc-cap">Держатель</div>
              <div className="bc-val">VITALIY SIVANEV</div>
            </div>
            <span className="bc-mir">МИР</span>
          </div>
          {frozen && (
            <div className={`bc-frost${melting ? ' melt' : ''}`} aria-hidden="true">
              <span className="wf w1">❄</span>
              <span className="wf w2">❅</span>
              <span className="wf w3">❆</span>
              <span className="wf w4">❄</span>
              <span className="wf w5">❅</span>
              <span className="wf w6">❄</span>
              <span className="wf w7">❅</span>
              <span className="wf w8">❆</span>
              <span className="wf w9">❄</span>
              <span className="wf w10">❅</span>
            </div>
          )}
        </div>
        </div>
        <div className="card">
          <div className="list-head">
            <h3 className="block-title" style={{ fontSize: 16 }}>МИР Supreme · бизнес</h3>
            {chip(frozen ? ['Заморожена', 'blue'] : ['Активна', 'green'])}
          </div>
          <div className="profile-grid" style={{ marginTop: 14 }}>
            <div className="profile-row"><span className="k">Привязана к счёту</span><span className="v">40802 810 3 0000 0123456</span></div>
            <div className="profile-row"><span className="k">Лимит на месяц</span><span className="v">500 000 ₽ · потрачено 118 400 ₽</span></div>
            <div className="profile-row"><span className="k">Кэшбэк</span><span className="v">3% на всё · 3 552 ₽ за август</span></div>
          </div>
          <div className="modal-actions">
            <button className="btn-gray" style={{ width: 'auto' }} onClick={() => setShown((v) => !v)}>
              {shown ? 'Скрыть данные' : 'Показать данные'}
            </button>
            <button className={frozen ? 'btn-red' : 'btn-gray'} style={{ width: 'auto', marginTop: 0 }} onClick={toggleFreeze} disabled={melting}>
              {melting
                ? 'Лёд тает…'
                : frozen
                  ? <><span className="sun-ico">{'☀︎'}</span> Разморозить карту</>
                  : <><span className="ice-ico">{'❄︎'}</span> Заморозить</>}
            </button>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

/* ═══ Эквайринг ═══ */
function Acquiring({ ctx }) {
  const [form, setForm] = useState(false)
  const p = usePeriod('month')
  const pi = periodInfo(p)
  return (
    <SectionShell title="Эквайринг" sub="Приём оплат картами и по QR-коду" ctx={ctx}
      actions={<button className="btn-red" style={{ marginTop: 0 }} onClick={() => setForm(true)}>+ Подключить терминал</button>}>
      <TimeFilter p={p} withToday />
      <StatRow labels={pi.labels} stats={[
        ['Оборот', `${SC(890400, pi.k)} ₽`, pi.sub],
        ['Комиссия', '1,1%', 'акция до конца августа'],
        ['Терминалов', '3', '2 онлайн'],
        ['Средний чек по картам', '462 ₽', pi.sub],
      ]} />
      <T
        head={['Терминал', 'Модель', 'Статус', 'Выручка сегодня']}
        rows={TERMINALS.map((t) => [<b>{t.name}</b>, t.model, chip(t.status), t.today])}
        onRow={(i) => ctx.ping(TERMINALS[i].status[0] === 'Офлайн'
          ? 'Терминал офлайн — проверьте питание или вызовите инженера через чат поддержки'
          : 'Статистика терминала — в разработке')}
      />
      <div className="card" style={{ marginTop: 18 }}>
        <h3 className="block-title" style={{ fontSize: 16 }}>Зачисление выручки</h3>
        <p className="block-sub">Деньги от карт приходят на счёт на следующее утро до 08:00. Комиссия списывается автоматически.</p>
        <button className="btn-gray" style={{ width: 'auto', marginTop: 12 }} onClick={() => ctx.go('payments')}>Смотреть зачисления →</button>
      </div>
      {form && <FormModal title="Подключение терминала" sub="Установка за 2 рабочих дня"
        fields={[
          { label: 'Тип', type: 'select', options: ['Стационарный терминал', 'Мобильный терминал', 'QR-оплата без оборудования'] },
          { label: 'Адрес точки', value: 'г. Москва, ул. Пекарская, д. 12, стр. 1' },
        ]}
        submitLabel="Отправить заявку" successText="Заявка принята — инженер свяжется для установки."
        onClose={() => setForm(false)} ping={ctx.ping} />}
    </SectionShell>
  )
}

/* ═══ Кредиты ═══ */
function Credits({ ctx }) {
  const [sum, setSum] = useState(3000000)
  const [months, setMonths] = useState(24)
  const [form, setForm] = useState(false)
  const r = 0.115 / 12
  const pay = Math.round((sum * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1))
  return (
    <SectionShell title="Кредиты" sub="Финансирование для развития пекарни" ctx={ctx}>
      <div className="offer-banner">
        <div>
          <b>Вам одобрена кредитная линия на 3 000 000 ₽</b>
          <p>Ставка от 11,5% годовых · решение уже готово · предложение действует 14 дней</p>
        </div>
        <button className="btn-red" style={{ marginTop: 0 }} onClick={() => setForm(true)}>Получить деньги</button>
      </div>
      <div className="two-col">
        <div className="card">
          <h3 className="block-title" style={{ fontSize: 16 }}>Кредитный калькулятор</h3>
          <div className="calc-row">
            <label>Сумма кредита <b>{fmt(sum)} ₽</b></label>
            <input type="range" min="100000" max="10000000" step="100000" value={sum} onChange={(e) => setSum(+e.target.value)} />
          </div>
          <div className="calc-row">
            <label>Срок <b>{months} мес.</b></label>
            <input type="range" min="6" max="60" step="6" value={months} onChange={(e) => setMonths(+e.target.value)} />
          </div>
          <div className="calc-result">
            <div className="s-label">Ежемесячный платёж при ставке 11,5%</div>
            <div className="s-val">{fmt(pay)} ₽</div>
            <div className="s-sub">Переплата: {fmt(pay * months - sum)} ₽ за весь срок</div>
          </div>
          <button className="btn-red" onClick={() => setForm(true)}>Оформить кредит</button>
        </div>
        <div className="card">
          <h3 className="block-title" style={{ fontSize: 16 }}>Действующие кредиты</h3>
          <p className="block-sub" style={{ marginBottom: 10 }}>У вас 1 активный кредит</p>
          <div className="tx-row" style={{ cursor: 'default' }}>
            <div>
              <div className="tx-name">Кредит на оборудование · печь Miwe</div>
              <div className="tx-desc">Выдан 10.02.2024 · ставка 12,8% · платёж 43 250 ₽/мес</div>
            </div>
            <div className="tx-right">
              <div className="tx-sum">осталось 680 000 ₽</div>
              <div className="tx-date">закрытие 10.02.2027</div>
            </div>
          </div>
          <div className="calc-result" style={{ marginTop: 14 }}>
            <div className="s-label">Следующий платёж</div>
            <div className="s-val">43 250 ₽ · 10 сентября</div>
            <div className="s-sub">Спишется автоматически с расчётного счёта</div>
          </div>
          <button className="btn-gray" onClick={() => ctx.ping('Досрочное погашение — в разработке')}>Погасить досрочно</button>
        </div>
      </div>
      {form && <FormModal title="Заявка на кредит" sub={`Сумма ${fmt(sum)} ₽ на ${months} мес. · платёж ~${fmt(pay)} ₽`}
        fields={[
          { label: 'Цель кредита', type: 'select', options: ['Оборотные средства', 'Оборудование', 'Ремонт и расширение', 'Маркетинг'] },
          { label: 'Телефон для связи', value: '+7 (977) 945-88-90' },
        ]}
        submitLabel="Отправить заявку" successText="Заявка отправлена! Решение придёт в течение 1 рабочего дня."
        onClose={() => setForm(false)} ping={ctx.ping} />}
    </SectionShell>
  )
}

/* ═══ Депозиты ═══ */
function Deposits({ ctx }) {
  const [sum, setSum] = useState(1000000)
  const [months, setMonths] = useState(6)
  const [form, setForm] = useState(null)
  const income = Math.round(sum * 0.18 * (months / 12))
  return (
    <SectionShell title="Депозиты" sub="Свободные деньги бизнеса должны работать" ctx={ctx}>
      <div className="offer-banner purple">
        <div>
          <b>Сегодня +1,5% к ставке срочного депозита</b>
          <p>Разместите средства до конца дня и получите до 19,5% годовых</p>
        </div>
        <button className="btn-purple" style={{ marginTop: 0 }} onClick={() => setForm('Срочный депозит')}>Открыть сегодня</button>
      </div>
      <div className="seg-grid three">
        {DEPOSIT_PRODUCTS.map((d) => (
          <div key={d.name} className={`card seg-card${d.hot ? ' hot' : ''}`}>
            <div className="seg-top">
              <b>{d.name}</b>
              {d.hot && <span className="chip green">+1,5% сегодня</span>}
            </div>
            <div className="dep-rate">до {d.hot ? d.rate + 1.5 : d.rate}%</div>
            <p className="seg-desc">{d.term} · {d.min}</p>
            <p className="seg-desc">{d.feat}</p>
            <button className="btn-gray" onClick={() => setForm(d.name)}>Открыть</button>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3 className="block-title" style={{ fontSize: 16 }}>Калькулятор дохода</h3>
        <div className="calc-row">
          <label>Сумма размещения <b>{fmt(sum)} ₽</b></label>
          <input type="range" min="100000" max="5000000" step="100000" value={sum} onChange={(e) => setSum(+e.target.value)} />
        </div>
        <div className="calc-row">
          <label>Срок <b>{months} мес.</b></label>
          <input type="range" min="3" max="12" step="3" value={months} onChange={(e) => setMonths(+e.target.value)} />
        </div>
        <div className="calc-result">
          <div className="s-label">Доход по ставке 18% годовых</div>
          <div className="s-val">+{fmt(income)} ₽</div>
          <div className="s-sub">Проценты выплачиваются ежемесячно на расчётный счёт</div>
        </div>
      </div>
      {form && <FormModal title={`Открытие: ${form}`} sub="Деньги спишутся с расчётного счёта"
        fields={[
          { label: 'Сумма, ₽', value: fmt(sum) },
          { label: 'Срок', type: 'select', options: ['3 месяца', '6 месяцев', '12 месяцев'] },
        ]}
        submitLabel="Открыть депозит" successText="Депозит открыт! Проценты начнут начисляться с завтрашнего дня."
        onClose={() => setForm(null)} ping={ctx.ping} />}
    </SectionShell>
  )
}

/* ═══ Гарантии ═══ */
function Guarantees({ ctx }) {
  const [form, setForm] = useState(false)
  return (
    <SectionShell title="Гарантии" sub="Банковские гарантии для тендеров и договоров" ctx={ctx}
      actions={<button className="btn-red" style={{ marginTop: 0 }} onClick={() => setForm(true)}>+ Оформить гарантию</button>}>
      <StatRow stats={[
        ['Действующих гарантий', '2', 'на 1 540 000 ₽'],
        ['Ставка', 'от 2,5%', 'годовых'],
        ['Выпуск', 'от 1 дня', 'онлайн'],
        ['Без залога', 'до 10 млн ₽', 'по скорингу'],
      ]} />
      <T
        head={['Номер', 'Назначение', 'Сумма', 'Действует до', 'Статус']}
        rows={GUARANTEES.map((g) => [<b>{g.no}</b>, g.purpose, g.sum, g.till, chip(g.status)])}
        onRow={() => ctx.go('documents')}
      />
      {form && <FormModal title="Заявка на банковскую гарантию" sub="Онлайн-выпуск от 1 рабочего дня"
        fields={[
          { label: 'Тип гарантии', type: 'select', options: ['Участие в тендере (44-ФЗ)', 'Исполнение контракта', 'Обеспечение аренды', 'Возврат аванса'] },
          { label: 'Сумма гарантии, ₽', placeholder: '0' },
          { label: 'Срок действия', type: 'select', options: ['3 месяца', '6 месяцев', '12 месяцев', '24 месяца'] },
        ]}
        submitLabel="Отправить заявку" successText="Заявка на гарантию принята — решение в течение дня."
        onClose={() => setForm(false)} ping={ctx.ping} />}
    </SectionShell>
  )
}

/* ═══ Бухгалтерия ═══ */
function Accounting({ ctx }) {
  const [form, setForm] = useState(false)
  return (
    <SectionShell title="Бухгалтерия" sub="Налоги и отчётность ИП на УСН 6%" ctx={ctx}
      actions={<button className="btn-red" style={{ marginTop: 0 }} onClick={() => setForm(true)}>Оплатить налог</button>}>
      <StatRow stats={[
        ['Доход за 2 квартал', '3 112 500 ₽', 'по данным счёта'],
        ['Налог УСН 6%', '18 675 ₽', 'к оплате до 25.08'],
        ['Взносы «за себя»', '49 500 ₽/год', 'оплачено 50%'],
        ['Отчётность', 'Сдана', 'за 1 полугодие'],
      ]} />
      <div className="card" style={{ marginTop: 18 }}>
        <h3 className="block-title" style={{ fontSize: 16 }}>Налоговый календарь</h3>
        <div style={{ marginTop: 6 }}>
          {TAX_EVENTS.map((t, i) => (
            <div key={i} className="tx-row" onClick={() => setForm(true)}>
              <div>
                <div className="tx-name">{t.name} {t.urgent && <span className="chip red" style={{ marginLeft: 6 }}>скоро</span>}</div>
                <div className="tx-desc">{t.date}</div>
              </div>
              <div className="tx-right"><div className="tx-sum">{t.sum}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="two-col">
        <div className="card">
          <h3 className="block-title" style={{ fontSize: 16 }}>Онлайн-бухгалтерия</h3>
          <p className="block-sub">МТС Бизнес сам считает налог по операциям на счёте, готовит платёжки и напоминает о сроках.</p>
          <button className="btn-gray" style={{ marginTop: 12 }} onClick={() => ctx.ping('Онлайн-бухгалтерия уже подключена на вашем тарифе')}>Подключено ✓</button>
        </div>
        <div className="card">
          <h3 className="block-title" style={{ fontSize: 16 }}>Интеграции</h3>
          <p className="block-sub">Выгрузка операций в учётные системы.</p>
          <div className="seg-actions" style={{ marginTop: 12 }}>
            <button className="btn-gray" style={{ width: 'auto' }} onClick={() => ctx.ping('Интеграция с 1С — в разработке')}>1С</button>
            <button className="btn-gray" style={{ width: 'auto' }} onClick={() => ctx.ping('Интеграция с «Моё дело» — в разработке')}>Моё дело</button>
            <button className="btn-gray" style={{ width: 'auto' }} onClick={() => ctx.ping('Интеграция с «Контур» — в разработке')}>Контур</button>
          </div>
        </div>
      </div>
      {form && <FormModal title="Оплата налога УСН" sub="Авансовый платёж за 2 квартал 2026"
        fields={[
          { label: 'Сумма, ₽', value: '18 675' },
          { label: 'Списать со счёта', type: 'select', options: ['Расчётный счёт · 40802…3456'] },
        ]}
        submitLabel="Оплатить" successText="Платёж в ФНС отправлен. Квитанция появится в «Документах»."
        onClose={() => setForm(false)} ping={ctx.ping} />}
    </SectionShell>
  )
}

/* ═══ Документы ═══ */
function Documents({ ctx }) {
  const [q, setQ] = useState('')
  const [form, setForm] = useState(false)
  const list = DOCS.filter((d) => (d.name + d.type).toLowerCase().includes(q.toLowerCase()))
  return (
    <SectionShell title="Документы" sub="Выписки, договоры и справки по вашему счёту" ctx={ctx}
      actions={<button className="btn-red" style={{ marginTop: 0 }} onClick={() => setForm(true)}>Запросить справку</button>}>
      <div className="crm-controls">
        <div className="input-search">
          {icons.search}
          <input placeholder="Поиск по документам" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <T
        head={['Документ', 'Тип', 'Формат', 'Дата', '']}
        rows={list.map((d) => [
          <b>{d.name}</b>, d.type, d.fmt, d.date,
          <button className="btn-gray" style={{ width: 'auto', padding: '7px 12px', display: 'flex', gap: 6, alignItems: 'center' }}
            onClick={(e) => { e.stopPropagation(); ctx.ping(`«${d.name}» скачан (демо)`) }}>{icons.download} Скачать</button>,
        ])}
        onRow={(i) => ctx.ping(`«${list[i].name}» скачан (демо)`)}
      />
      {list.length === 0 && <p className="empty-note">Документы по запросу «{q}» не найдены.</p>}
      {form && <FormModal title="Запрос справки" sub="Готовим в течение 1 рабочего дня"
        fields={[
          { label: 'Тип справки', type: 'select', options: ['Об оборотах по счёту', 'О наличии счёта', 'Об отсутствии задолженности', 'Для визы'] },
          { label: 'Период', type: 'select', options: ['Последние 3 месяца', 'Последние 6 месяцев', 'Текущий год', '2024 год'] },
        ]}
        submitLabel="Запросить" successText="Справка заказана — появится в списке документов."
        onClose={() => setForm(false)} ping={ctx.ping} />}
    </SectionShell>
  )
}

/* ═══ Настройки ═══ */
function Settings({ ctx }) {
  const [notif, setNotif] = useState({ push: true, sms: true, email: false, marketing: true })
  const [pass, setPass] = useState(false)
  const Toggle = ({ k }) => (
    <button className={`toggle${notif[k] ? ' on' : ''}`} onClick={() => { setNotif((n) => ({ ...n, [k]: !n[k] })); ctx.ping('Настройка сохранена') }} aria-label="Переключить" />
  )
  return (
    <SectionShell title="Настройки" sub="Профиль, уведомления и безопасность" ctx={ctx}>
      <div className="two-col">
        <div className="card">
          <h3 className="block-title" style={{ fontSize: 16 }}>Профиль</h3>
          <div className="form-grid">
            <div className="field"><label>Название бизнеса</label><input defaultValue="Пекарня «Хлеб да Соль»" /></div>
            <div className="field"><label>Телефон</label><input defaultValue="+7 (977) 945-88-90" /></div>
            <div className="field"><label>Email</label><input defaultValue="sivanev@hlebdasol.ru" /></div>
          </div>
          <div className="modal-actions">
            <button className="btn-red" style={{ marginTop: 0 }} onClick={() => ctx.ping('Профиль сохранён')}>Сохранить</button>
            <button className="btn-gray" style={{ width: 'auto' }} onClick={() => ctx.openProfile()}>Реквизиты ИП</button>
          </div>
        </div>
        <div className="card">
          <h3 className="block-title" style={{ fontSize: 16 }}>Внешний вид</h3>
          <div className="settings-row">
            <div>
              <div className="tx-name">Тема оформления</div>
              <div className="tx-desc">Сейчас: {ctx.theme === 'dark' ? 'тёмная' : 'светлая'}</div>
            </div>
            <button className="theme-switch" onClick={ctx.toggleTheme} aria-label="Переключить тему">
              <span className={ctx.theme === 'light' ? 'on' : ''}>{icons.sun}</span>
              <span className={`moon${ctx.theme === 'dark' ? ' on' : ''}`}>{icons.moon}</span>
            </button>
          </div>
          <h3 className="block-title" style={{ fontSize: 16, marginTop: 18 }}>Уведомления</h3>
          <div className="settings-row"><div className="tx-name">Push об операциях</div><Toggle k="push" /></div>
          <div className="settings-row"><div className="tx-name">SMS о поступлениях</div><Toggle k="sms" /></div>
          <div className="settings-row"><div className="tx-name">Email-отчёты по понедельникам</div><Toggle k="email" /></div>
          <div className="settings-row"><div className="tx-name">Акции и предложения МТС Бизнес</div><Toggle k="marketing" /></div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3 className="block-title" style={{ fontSize: 16 }}>Безопасность</h3>
        <div className="settings-row">
          <div>
            <div className="tx-name">Пароль</div>
            <div className="tx-desc">Обновлён 3 месяца назад</div>
          </div>
          <button className="btn-gray" style={{ width: 'auto' }} onClick={() => setPass(true)}>Сменить</button>
        </div>
        <div className="settings-row">
          <div>
            <div className="tx-name">Активные сессии</div>
            <div className="tx-desc">Safari · macOS · Москва (текущая) — и ещё 1 устройство</div>
          </div>
          <button className="btn-gray" style={{ width: 'auto' }} onClick={() => ctx.ping('Остальные сессии завершены')}>Завершить другие</button>
        </div>
      </div>
      {pass && <FormModal title="Смена пароля" sub="Понадобится код из SMS"
        fields={[
          { label: 'Текущий пароль', placeholder: '••••••••' },
          { label: 'Новый пароль', placeholder: 'Минимум 8 символов' },
        ]}
        submitLabel="Сменить" successText="Пароль изменён. Используйте его при следующем входе."
        onClose={() => setPass(false)} ping={ctx.ping} />}
    </SectionShell>
  )
}

/* ═══ Задачи ═══ */
function Tasks({ ctx }) {
  const [text, setText] = useState('')
  const add = () => {
    if (!text.trim()) return
    ctx.addTask(text.trim())
    setText('')
  }
  return (
    <SectionShell title="Задачи" sub="Планы по бизнесу — ничего не потеряется" ctx={ctx}>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="crm-controls" style={{ marginTop: 0 }}>
          <div className="input-search">
            {icons.plus}
            <input placeholder="Новая задача — нажмите Enter" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          </div>
          <button className="btn-red" style={{ marginTop: 0 }} onClick={add}>Добавить</button>
        </div>
        <div style={{ marginTop: 10 }}>
          {ctx.tasks.map((t, i) => (
            <div key={i} className={`task-row${t.done ? ' done' : ''}`} onClick={() => ctx.toggleTask(i)}>
              <span className="task-check">✓</span>
              <span className="task-text">{t.text}</span>
              <span className="task-time">{t.time}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

const REGISTRY = {
  crm: Crm, orders: Orders, clients: Clients, segments: Segments, comms: Comms,
  analytics: Analytics, growth: Growth, promos: Promos, services: Services, premium: Premium,
  mkt: MktAnalytics, audience: Audience,
  payments: Payments, cards: Cards, acquiring: Acquiring,
  credits: Credits, deposits: Deposits, guarantees: Guarantees, accounting: Accounting,
  documents: Documents, settings: Settings, tasks: Tasks,
}

export function Section({ id, ctx }) {
  const C = REGISTRY[id]
  return C ? <C ctx={ctx} /> : null
}
