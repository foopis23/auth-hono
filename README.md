# auth-hono

Auth Hono is the unofficial Hono integration for Auth.js. It providers a simple way to add authentication to your Hono app in a few lines of code.

## Instal

### npm

```bash
npm install @foopis23/auth-hono
```

### yarn

```bash
yarn add @foopis23/auth-hono
```

### pnpm

```bash
pnpm add @foopis23/auth-hono
```

### bun

```bash
bun install @foopis23/auth-hono
```

## Usage

```ts
// #src/index.ts
import { Hono } from "hono";
import {
  HonoAuth,
  getSession,
  GetSessionResult,
  AuthConfig,
} from "@foopis23/auth-hono";
import { RequestContext } from "./types";

type RequestContext = {
  Variables: {
    session?: GetSessionResult;
  };
};

const app = new Hono<RequestContext>();

const authConfig: AuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
};
app.all("/api/auth/*", HonoAuth(authConfig));

// setup up your routes here...
```

Don't forget to set the AUTH_SECRET environment variable. This should be a minimum of 32 characters, random string. On UNIX systems you can use openssl rand -hex 32 or check out https://generate-secret.vercel.app/32.

You will also need to load the environment variables into your runtime environment. For example in Node.js with a package like dotenv.

### Provider Configuration

The callback URL used by the [providers](https://authjs.dev/reference/core/providers) must be set to the following, unless you mount the ExpressAuth handler on a different path:

### Signing in and signing out

Once your application is mounted you can sign in or out by making requests to the following [REST API endpoints](https://authjs.dev/reference/core/types#authaction) from your client-side code. NB: Make sure to include the csrfToken in the request body for all sign-in and sign-out requests.

## Managing the session

If you are using Hono html/jsx, you can make the session data available to all routes via middleware as follows

```ts
app.use("*", async (c, next) => {
  const session = await getSession(c, authConfig);
  c.set("session", session);
  return await next();
});

// Now in your route
app.get("/", (c) => {
  const session = c.get("session");

  c.html(
    <html>
      <body>
        <p>Hello ${session?.user?.name}</p>
      </body>
    </html>
  );
});
```

## Authorization

You can protect routes by checking for the presence of a session and then redirect to a login page if the session is not present. This can be done either at group level or by path as follows:

```ts
// #src/middleware.ts

export authenticatedUser : MiddlewareHandler<RequestContext> = function (c, next) {
  const session = c.get("session");
  if (!session) {
    c.redirect("/login");
    return;
  }
  return next();
};
```

### Per Group

```ts
// #src/protected.routes.ts

import { authenticatedUser } from "./middleware";
import { RequestContext } from "./types";

const protectedRouter = new Hono<RequestContext>();

protectedRouter.use(authenticatedUser); // all routes after this will be protected

protectedRouter.get("/", (c) => {
  c.text("protected");
});

export default protectedRouter;
```

### By Path

```ts
// #src/index.ts

import { authenticatedUser } from "./middleware";
import { RequestContext } from "./types";

const app = new Hono<RequestContext>();

app.use("/protected/*", authenticatedUser); // all routes that have protected/* will be protected after this

app.get("/", (c) => {
  c.text("public");
});

app.get("/protected", (c) => {
  c.text("protected");
});
```

## See Also

- [Auth.js](https://authjs.dev)
- [Hono](https://hono.dev)

## Credits

This was based on the [Express Auth](https://authjs.dev/reference/express) package by Rexford Essilfie.
