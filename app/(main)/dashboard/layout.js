import MainNavbar from '@/components/mainnavbar';
import Footer from '@/components/footer';

export const metadata = {
  title: 'Expair',
  description: 'main',
};

export default function AppLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0B0521] text-white flex flex-col min-h-screen">
        <MainNavbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}