import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://tccc.vercel.app'),
  title: 'TCCC',
  description: 'Beyond the Pitch, We Unite',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
