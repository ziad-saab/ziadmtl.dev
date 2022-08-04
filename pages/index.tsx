import type { GetStaticProps, NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Layout } from '~/components/layout';
import { getAllPosts, PostData } from '~/lib/api';
import profilePic from '../assets/ziad-saab.jpg';

const MAX_POST_COUNT = 10;

interface HomeProps {
  posts: PostData[];
}

const Home: NextPage<HomeProps> = ({ posts }) => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <section className="sm:flex mb-6">
          <figure className="sm:flex-1 sm:mr-2">
            <Image
              src={profilePic}
              alt="Ziad Saab at Code In The Dark Montreal"
              placeholder="blur"
            />
          </figure>
          <figcaption className="mt-2 sm:mt-0 sm:flex-1 sm:ml-2 prose dark:prose-invert">
            <h2 className="mb-1">Ziad Saab</h2>
            <p role="doc-subtitle">Fullstack Dev & Teacher 🔥</p>
            <p className="my-4">
              I&apos;m a fullstack dev and teacher from Montreal,
              Canada 🇨🇦
              <br />I have lots of experience, and so much to learn 🤓
            </p>
            <p className="my-4">
              I co-founded Montreal&apos;s first fullstack web development
              bootcamp,{' '}
              <a
                className="font-semibold underline"
                target="_blank"
                rel="noreferrer"
                href="https://www.decodemtl.com"
              >
                DecodeMTL.
              </a>
              {' '}I also worked with Udacity to produce a highly rated{' '}
              <a
                className="font-semibold underline"
                target="_blank"
                rel="noreferrer"
                href="https://www.udacity.com/course/learn-sql--nd072"
              >
                SQL course based on Postgres
              </a>.
            </p>
            <p className="my-4">
              I often get asked which technologies I work with. While I&apos;ve
              spent the last few years specializing in NodeJS, Postgres, React,
              TypeScript, Firebase, and more recently Web3, I&apos;ll use any
              technologies necessary to achieve your goals.
            </p>
            <p className="my-4">
              Looking forward to working together 🚀
            </p>
          </figcaption>
        </section>
        <section className="prose dark:prose-invert max-w-none">
          <h2>Check out my latest posts</h2>
          <ul className="list-none">
            {
              posts.map(post => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`}>
                    <a>{post.title}</a>
                  </Link>
                  {' '}- <span className="text-gray-400 whitespace-nowrap">{post.date}</span>
                </li>
              ))
            }
          </ul>
        </section>
      </div>
    </Layout>
  );
};

export default Home;

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const posts = getAllPosts().slice(0, MAX_POST_COUNT);
  
  return {
    props: {
      posts,
    },
  };
};