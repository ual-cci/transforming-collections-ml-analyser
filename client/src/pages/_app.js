import '@/styles/globals.css';
import RootLayout from '@/_components/layout';
import { UserProvider } from '@auth0/nextjs-auth0/client';

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <RootLayout>
        <Component {...pageProps} />
      </RootLayout>
    </UserProvider>
  )
}
