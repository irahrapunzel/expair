import LandingNavbar from '@/components/landingnavbar'
import Footer from '@/components/footer'

export const metadata = {
  title: 'Expair',
  description: 'landing',
}

export default function LandingLayout({ children }) {
  return (
    <>
      <LandingNavbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  )
}