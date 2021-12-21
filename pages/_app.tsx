import '~/styles/globals.css';
import 'highlight.js/styles/rainbow.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useGtagTracking } from '~/lib/useGtagTracking';

function MyApp({ Component, pageProps }: AppProps) {
  useGtagTracking();
  
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
