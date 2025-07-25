import "./globals.css";
import Head from "next/head";
import ClientLayout from "../components/client-layout";

export const metadata = {
  title: "Expair",
  description: "Fair skill exchange platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter&display=swap"
        />
      </Head>
      <ClientLayout>{children}</ClientLayout>
    </html>
  );
}