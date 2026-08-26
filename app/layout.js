import './globals.css'

export const metadata = {
  title: 'МТС Бизнес',
  description: 'Личный кабинет бизнеса — прототип',
}

/* maximumScale: 1 отключает автоматический зум iOS при фокусе на поле ввода
   (щипковый зум пользователем при этом остаётся доступен) */
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1 }

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('theme')==='dark')document.documentElement.dataset.theme='dark'}catch(e){}` }} />
        {children}
      </body>
    </html>
  )
}
