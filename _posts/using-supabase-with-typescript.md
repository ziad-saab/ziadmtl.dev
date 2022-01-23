---
title: Using Supabase with TypeScript
description: In this article, we'll learn how to use automatic TypeScript types generation for a Supabase project, and how to use these types in an app
cover: /blog-images/using-supabase-with-typescript/joshua-aragon-EaB4Ml7C7fE-unsplash.jpg
date: "2022-01-22"
---

Supabase's value proposition is to "give superpowers to your (SQL) database". When working with Supabase – and thereby SQL –, we go to great lengths to create a structured data model with tables and relations. It would be a shame then, that once we use this structured data in our JavaScript app, we lose all that structure and are left to deal with `any` types.

In this tutorial, we're going to learn how to use TypeScript to make our Supabase app more robust, and easier to code. This tutorial is framework-agnostic: whether you're using React, Vue, or vanilla JavaScript (that is, TypeScript), you'll be able to use the examples and methods outlined. I will assume that you already have some rudimentary knowledge of both SQL and TypeScript, and are comfortable executing simple commands in your terminal.

## TypeScript in the Supabase JavaScript client
When interacting with a Supabase app using the `@supabase/supabase-js` client, database calls usually start with:

```js
supabaseClient.from('table') //...
```

The `from` method of the Supabase client is generic in one type variable `T` which defaults to `any`. The signature of the `from` method is:

```js
from<T = any>(table: string): SupabaseQueryBuilder<T>
```

This type parameter is passed down to the query builder, and goes on to be used when you call `select`, `insert`, and all other database methods you're already used to using with Supabase. For example, in the case of a `select`, `await`ing the result of the operation will get you back an object of type `PostgrestResponseSuccess<T>`, which is defined as:

```js
interface PostgrestResponseSuccess<T> extends PostgrestResponseBase {
  error: null
  data: T[]
  body: T[]
  count: number | null
}
```

The gist of it is that calling `select<any>` on a Supabase project will get you back an array of `any` as the `data` property of the response. If you were able to pass your own type when calling `from('table')`, then you'd get back a response where the `data` property would be an array of that type. You can certainly create these types manually, but that is error prone. The Supabase team is currently working on a solution to generate the types automatically from your database schema, but meanwhile they have a [temporary solution](https://supabase.com/docs/reference/javascript/generating-types), which consists in using the `openapi-typescript` NPM package to introspect the OpenAPI specification generated from your database schema. In this tutorial we're going to explore the solution provided by the Supabase team, and expand on it to make it more easily usable.

## Defining a schema
For the purposes of this tutorial, we'll be defining the following tables:

```sql
create table public.posts (
	id uuid primary key default uuid_generate_v4(),
	user_id uuid not null references auth.users,
	title text not null,
	content text
);

create table public.comments (
	id uuid primary key default uuid_generate_v4(),
	user_id uuid not null references auth.users,
	post_id uuid not null references public.posts,
	content text
);
```

If you want to follow along, you can create a new Supabase project and execute the above SQL in the SQL Editor. Note that since our goal is to explore the types, we're not dealing with Row-Level security and associated policies here: they don't affect the generated types.

## Generating the types
With this schema created, we can now generate the types using `openapi-typescript`. To do this, we need to have the URL of our Supabase project, as well as the anon-key. These can be found under the Settings > API section of Supabase Studio. Armed with these two values, execute the following command in your terminal:

```sh
npx openapi-typescript https://<YOUR URL>.supabase.co/rest/v1/?apikey=<YOUR anon-key> --output generated-types.ts
```

After a few seconds, you'll have a new file called `generated-types.ts` in the directory where you executed the command. If you open this file, you'll find that the types generated contain more than what we need for the purposes of this tutorial. They contain types for API paths, parameters, and others. The types of interest to us are defined under the `definitions` interface, and they look like this:

```js
export interface definitions {
  comments: {
    /**
     * Format: uuid
     * @description Note:
     * This is a Primary Key.<pk/>
     * @default extensions.uuid_generate_v4()
     */
    id: string;
    /** Format: uuid */
    user_id: string;
    /**
     * Format: uuid
     * @description Note:
     * This is a Foreign Key to `posts.id`.<fk table='posts' column='id'/>
     */
    post_id: string;
    /** Format: text */
    content?: string;
  };
  posts: {
    /**
     * Format: uuid
     * @description Note:
     * This is a Primary Key.<pk/>
     * @default extensions.uuid_generate_v4()
     */
    id: string;
    /** Format: uuid */
    user_id: string;
    /** Format: text */
    title: string;
    /** Format: text */
    content?: string;
  };
}
```

Notice that the `definitons` interface has one entry for `posts`, and another one for `comments`. The fields marked as `NOT NULL` in the schema are mandatory in the corresponding TypeScript type, and those that are not, like the `content`, are optional. You'll also note that despite our `id`s being defined as `uuid` in the database, the corresponding TypeScript type is `string`: there's no native UUID type in TypeScript, so that's the best the automated tool can do.

## Using the generated types
The easiest way to use these generated types is to pass them directly to the type parameter of the `from` method of the Supabase client. For example, to fetch typed posts, you can do:

```js
const result = await supabaseClient.from<definitions['posts']>('posts').select('*');
console.log(result.data[0].title)
```

And you'll get the full benefits of TypeScript's type checking, as can be seen in the following screenshot from a VS Code session:

![TypeScript suggestions from supabase query](typescript-suggestions-supabase-select-query.png)

In addition to the suggestions you get from TypeScript, you'll notice that `result.data` is underlined with a red squiggle: TypeScript is warning us that `result.data` could be `null` here. To comply, we can either wrap the `console.log` in an `if (result.data)` block, or use `result.data?.[0].title` depending on our needs.

## Making the generated types easier to use
Having to type `from<definitions['posts']>` every time we want to query a post is verbose. To help with this, we can define our own types. Rather than work in the `generated-types.ts` file, let's create our own `types.ts` module. This way, as we change our schema and re-generate the types, our own code won't be overwritten.

```js
import type { definitions } from './generated-types';

export type Post = definitions['posts'];
export type Comments = definitions['comments'];
```

Then, when we want to query these entities, we can import the aliased types instead:

```js
import type { Post } from './types';

await supabaseClient.from<Post>('posts').select('*') //...
```

Even that can get a little verbose over time. We can still make mistakes by using the wrong type and table name combination, mistype the table name, etc. We can define some helper functions to alleviate this. Let's do that in a module called `db.ts`:

```js
import type { Post, Comment } from './types';

export const db = {
	posts: () => supabaseClient.from<Post>('posts'),
	comments: () => supabaseClient.from<Comment>('comments'),
};
```

Then, in our application code, we can simply do:

```js
import { db } from './db';

await db.posts().select('*')//...
```

We don't need to explicitly type the `db` variable, TypeScript will automatically infer its type based on the return values of the functions defined there.

## Types for nested relations
Our example schema defines entities Post and Comment in such a way that a post can have multiple comments. Supabase allows us to retrieve posts with their comments using the following `select` syntax:

```js
supabaseClient.from('posts').select(`
*,
comments(*)
`)
```

What would be the return type of such a query? We'd still get posts, but each post would have an array of comments associated to it. We can easily compose the types we have so far and create a `PostWithComments` type like this:

```js
type PostWithcomments = Post & {
	comments: Comment[];
}
```

## Types for partial selections
When fetching large quantities of rows, we sometimes want to project only a portion of the available data. For example, if we have a page where we're listing all posts in our database, we only need the `id` and the `title` of these posts. Fetching the `content`, arguably the heaviest field in the dataset, would be counter-productive. For this reason, both SQL and Supabase allow us to select a limited set of fields from our tables. For example, to fetch the post `id`s and `title`s only, we can do:

```js
supabaseClient.from('posts').select('id, title')//...
```

If we were to use our `Post` type here, TypeScript wouldn't complain. After all, TypeScript has absolutely no idea what kind of data we're getting back, since that data is completely dynamic and is coming from a JSON API. Somewhere in the depths of the libraries we're using, there's a `JSON.parse` in there which turns the API response from PostgREST into JavaScript objects, and the library is simply telling TypeScript that these are of a certain type.

What more, nothing is preventing us from selecting columns that don't exist in the database. As our schema is changing and our app is getting larger, it would be nice if the newly generated types could warn us of these things.

Here's an example of a utility function that allows us to select only certain fields from posts in a type-safe way, both for the columns we're selecting and for the data type being returned:

```js
function selectFromPosts<F extends keyof Post>(columns: F[]) {
	return supabaseClient.from<Pick<Post, F>>('posts').select(columns.join(', '));
}

// Example usage
const postsForHomepage = await selectFromPosts(['id', 'title']);
```

There's a lot going on here so let's look at it part by part:

* First, you'll note that this function has a generic type `F extends keyof Post`. `keyof` is a TypeScript type operator which returns a union type of all the keys of the type we call it on. In this case, `keyof Post` is the union type `'id' | 'user_id' | 'title' | 'content'`.
* The function defines a single parameter `columns` which is an array of `F`, that is, an array of strings that are keys of `Post`.
* The function calls `from` with the type `Pick<Post, F>`. `Pick` is a utility type that is the TypeScript "equivalent" of lodash's `_.pick` function: it takes a type, and keys from that type, and returns a new type composed of only those keys. In this case, if `F` turns out to be `'title' | 'content'`, then `Pick<Post, F>` will be the type `{ title: string; content?: string }`.
* Finally, and most importantly, you'll note that when calling `selectFromPosts` in the example above, we don't pass a type parameter. This is where all the magic happens, by virtue of TypeScript's inference. When calling `selectFromPosts`, TypeScript is able to see, at compile-time, that we're passing an array with `'id'` and `'title'`. From this, it's able to _infer_ that `F` is `'id' | 'title'` without us having to explicitly state that. This inferred `F` is then used as a type parameter in `Pick`, and since we're returning the result of that `select`, TypeScript is able to infer that this call to `selectFromPosts` will return a response whose `data` property will be an array of `{ id: string; title: string }` :fire:

## Conclusion
I hope you found the methods described above to be useful to you. If anything, the examples I've used should inspire you to build your own types and functions on top of the Supabase client to make your application more robust, type-safe, and easier to write and read.

In a future blog post, I'll be expanding on these examples by looking at an interesting technique called "flavoring". This technique will allow us to distinguish between values that _should_ have different types, but are all typed as `string`, such as the UUID `id`s of the entities above. Meanwhile, let's go ship some type-safe Supabase code! :rocket: