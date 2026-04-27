import './globals.css';

export const metadata = {
  title: 'Telugu Titans',
  description: 'Beyond the Pitch, We Unite',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
