import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import '@/styles.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

