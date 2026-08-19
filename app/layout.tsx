import './globals.css';

export const metadata = {
  title: 'Quiet RSVP',
  description: 'Private party RSVPs on Midnight',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
