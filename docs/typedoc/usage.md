# Typescript Usage

This page describes how to use Enmap from a typescript perspective, if you want strong types for data stored in Enmap.

Let's not rehash what's described in the [basics](../usage/README.md) for the Enmap Options, and instead concentrate on the typescript part of this.

Other than Generics, just consider that methods *should* return the proper value according to the interface provided in your generics.

## Basic Example

Let's get down to brass tacks: Enmap accepts Generics. Here's an example:

```ts
import Enmap from 'enmap';

interface Something {
  a: string;
  num: number;
}

const example = new Enmap<Something>({ name: "something" });
```

## Full Example

Here's a complete example from a blog platform scaffold I'm working on, with several types and Enmap instances: 

```ts
import Enmap from 'enmap';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'author' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  authorId: string;
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  featuredImage?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

// Initialize database tables
export const users = new Enmap<User>({ name: 'users' });
export const posts = new Enmap<Post>({ name: 'posts' });
export const comments = new Enmap<Comment>({ name: 'comments' });
export const sessions = new Enmap<Session>({ name: 'sessions' });
```

## Serialized Value

Enmap accepts a second generic, which is the "Serialized Value". As see in [Serializing Values](../usage/serialize.md), you can define a function that runs on data before actually saving it to the database - this is useful when you have data that can't just be sent through json serialization (class instances, etc). If you're using such a method, you're going to have to actually define the serialized value shape. 

Here's a basic example: 

```ts
import Enmap from 'enmap';

class GoodGreeter {
  name: string;
 
  constructor() {
    this.name = "hello";
  }
}

interface BaseGreeter {
  greeter: GoodGreeter;
}

interface SerializedGreeter {
  greeter: {
    name: string;
  }
}

const example = new Enmap<BaseGreeter, SerializedGreeter>({
  name: 'greeter',
  serializer: (data: BaseGreeter): SerializedGreeter => data.name;
  deserializer: (data: SerializedGreeter): BaseGreeter => new GoodGreeter(data);
});
```

