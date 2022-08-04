import Head from 'next/head';
import Link from 'next/link';
import { ReactNode } from 'react';
import { PostData } from '~/lib/api';
import styles from './layout.module.css';

interface LayoutProps {
  children: ReactNode;
  meta?: Partial<PostData>;
}

export const Layout = ({ children, meta }: LayoutProps) => {
  const metadata = {
    title: meta?.title || 'Ziad Saab - Fullstack Dev & Teacher',
    image: meta?.cover || '/ziad-saab.jpg',
    author: 'Ziad Saab',
    description: meta?.description || "I'm a fullstack dev and teacher with lots of experience and lots to learn. Looking forward to working together!",
    type: meta ? 'article' : 'profile',
  };
  return (
    <>
      <Head>
        <meta name="description" content={metadata.title} />
        <meta name="image" content={metadata.image} />
        <meta name="author" content={metadata.author} />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:type" content={metadata.type} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:url" content="https://www.ziadmtl.dev/" />
        <meta property="og:site_name" content="Ziad Saab - Fullstack Dev & Teacher" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={metadata.image} />
        <meta property="og:image:alt" content={metadata.title} />
        <title>{metadata.title}</title>
      </Head>
      <div className={styles.wrapper}>
        <header className="p-4 mb-4">
          <Link href="/">
            <a>
              <h1>
                <span className="text-6xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">
                  ziadmtl.dev
                </span>
              </h1>
            </a>
          </Link>
        </header>
        <main className="px-4">
          {children}
        </main>
      </div>
      <footer className={`py-20 px-2 ${styles.footer} mt-8`}>
        <h3>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">
            ziadmtl.dev
          </span>
          {' '}by Ziad Saab
        </h3>
        <ul className="list-none md:flex md:flex-row md:flex-wrap mt-4">
          <li><a target="_blank" href="https://github.com/ziad-saab" rel="noreferrer">github</a></li>
          <li><a target="_blank" href="https://codementor.io/@ziad-saab" rel="noreferrer">codementor</a></li>
          <li><a target="_blank" href="https://stackoverflow.com/users/1420728/ziad-saab" rel="noreferrer">stackoverflow</a></li>
          <li><a target="_blank" href="https://www.linkedin.com/in/ziad-saab/" rel="noreferrer">linkedin</a></li>
          <li><a href="mailto:ziad.saab@gmail.com">email</a></li>
          <li><a target="_blank" href="https://instagram.com/ziadmtl" rel="noreferrer">instagram</a></li>
        </ul>
      </footer>
    </>
  );
};