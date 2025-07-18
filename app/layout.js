import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'Expair',
  description: 'expair',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-[#0B0521] text-white font-inter">
        {children}
      </body>
    </html>
  )
}