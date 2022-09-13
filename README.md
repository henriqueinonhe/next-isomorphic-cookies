# Next Isomorphic Cookies

Using cookies in NextJS made easy!

Seamless integration with SSG and SSR, while avoiding hydration mismatches.

- Completely avoids [hydration mismatches](https://nextjs.org/docs/messages/react-hydration-error)
- Works seamlessly with SSG, SSR or CSR
- Initializes state from cookies as soon as possible (in the server, when using SSR and immediately after the first render when using SSG)
- Out-of-the-box Typescript support

## Usage

1. Wrap your `App` at `_app`:

```ts
// _app

import type { AppProps } from "next/app";
import { withCookiesAppWrapper } from "next-isomorphic-cookies";

const MyApp = ({ Component, pageProps }: AppProps) => {
  return <Component {...pageProps} />;
};

//                 Wrapper! \/
export default withCookiesAppWrapper(MyApp); // <------ Wrap!
```

2. **(Optional)** Wrap `getServerSideProp` (when using SSR):

```tsx
const Page = () => {
  //...
};

export const getServerSideProps: GetServerSideProps =
  //             Wrapper! \/
  withCookiesGetServerSidePropsWrapper(async (context) => {
    // Your usual getServerSideProps
    //...
  });

export default Page;
```

3. Call `useCookieState`:

```tsx
import { useCookieState } from "next-isomorphic-cookies";

const FoodTypeCookieKey = "FoodType";

const foodTypes = ["Japanese", "Mexican", "Italian"];

export const FoodTypeFilter = () => {
  // Initializer that allows us to deal with the case
  // when there is no food type stored or,
  // when the stored food type is not available anymore
  const foodTypeInitializer = (storedFoodType: string) => {
    const defaultFoodType = foodTypes[0];

    const cookieNotSet = storedFoodType === undefined;
    if (cookieNotSet) {
      return defaultFoodType;
    }

    const storedFoodTypeIsNotAvaialble = !foodTypes.includes(storedFoodType);
    if (storedFoodTypeIsNotAvaialble) {
      return defaultFoodType;
    }

    return storedFoodType;
  };

  // When using SSR, the initializer receives
  // the stored value in the very first render.
  // When using SSG, the initializer receives
  // undefined in the first render, and then
  // calls the initializer again with the stored
  // value immediately after the first render.
  const { value: foodType, setValue: setFoodType } = useCookieState<string>(
    FoodTypeCookieKey,
    foodTypeInitializer
  );

  return (
    <div>
      <label>Food Type</label>{" "}
      <select
        value={value}
        onChange={(event) => {
          // Automatically persists value
          // in the cookie
          setFoodType(event.target.value);
        }}
      >
        <option value="Japanese">Japanese</option>
        <option value="Mexican">Mexican</option>
        <option value="Italian">Italian</option>
      </select>
    </div>
  );
};
```

## API

### withCookiesAppWrapper

You must wrap your App at `_app` with this function.

Example:

```tsx
// _app

import type { AppProps } from "next/app";
import { withCookiesAppWrapper } from "next-isomorphic-cookies";

const MyApp = ({ Component, pageProps }: AppProps) => {
  return <Component {...pageProps} />;
};

//                 Wrapper! \/
export default withCookiesAppWrapper(MyApp); // <------ Wrap!
```

### withCookiesGetServerSidePropsWrapper

Wraps `getServerSideProps` to make cookies available to components rendering in the server.

If you do not wrap `getServerSideProps` with this function, either because you're using SSG, or because you simply forgot, the only thing that will happen is that the state that relies on cookies to be initialized will be synced with cookies **after the first render**, but it **won't break anything**.

Example:

```tsx
const Page = () => {
  //...
};

export const getServerSideProps: GetServerSideProps =
  //             Wrapper! \/
  withCookiesGetServerSidePropsWrapper(async (context) => {
    // Your usual getServerSideProps
    //...
  });

export default Page;
```

### useCookieState

Can be called inside **any component**, as long as you've wrapped your App with `withCookiesAppWrapper`.

```ts
export type UseCookieState<T> = (
  /**
   * Cookie key/name.
   */
  key: string,

  /**
   * Function that is called to initialize
   * the state value and, in cases where
   * cookies are not available on the server,
   * again after hydration.
   */
  initializer: (storedValue: T | undefined) => T,

  options?: UseCookieStateOptions<T>
) => {
  /**
   * Pretty much like the value you'd get
   * when calling `useState`.
   */
  value: T;

  /**
   * Pretty much like the setter you'd get
   * when calling `useState`.
   *
   * When `storeOnSet` option is enabled,
   * everytime this is called, it also
   * stores the value it was called with
   * in the cookie.
   */
  setValue: Dispatch<SetStateAction<T>>;

  /**
   * Reads value off cookie and calls sets
   * `value` to it.
   *
   * You may optionally pass a `deserializer`
   * that transforms the cookie value before
   * setting value to it.
   */
  retrieve: (options?: {
    /**
     * Transforms the cookie value before
     * setting value to it.
     *
     * Defaults to identity function.
     */
    deserializer?: (storedValue: T | undefined) => T;
  }) => void;

  /**
   * Stores value in cookie.
   */
  store: (
    /**
     * Value to be stored.
     */
    value: T,

    options?: {
      /**
       * js-cookie attributes
       */
      attributes?: CookieAttributes;
      /**
       * Transforms the value before
       * it is stored.
       *
       * Defaults to identity function.
       */
      serializer?: (storedValue: T | undefined) => T;
    }
  ) => void;

  /**
   * Clears cookie value.
   */
  clear: () => void;

  /**
   * If cookies are not available during hydration,
   * state will have to be synchronized after hydration,
   * in which case this flag will be true until synchronization
   * is finished.
   */
  isSyncing: boolean;
};

type UseCookieStateOptions<T> = {
  /**
   * Defaults to true.
   *
   * Whether the value should be stored
   * in the cookie everytime setValue
   * is called.
   *
   * It is possible to pass a serializer
   * that will transform the value
   * before it is stored as a cookie.
   */
  storeOnSet?: StoreOnSetOption<T>;
};

type StoreOnSetOption<T> =
  | true
  | false
  | {
      /**
       * js-cookie attributes
       */
      attributes?: CookieAttributes;

      /**
       * Transforms the value before
       * it is stored.
       *
       * Defaults to identity function.
       */
      serializer?: (value: T) => T;
    };

// Attributes from js-cookie
interface CookieAttributes {
  /**
   * Define when the cookie will be removed. Value can be a Number
   * which will be interpreted as days from time of creation or a
   * Date instance. If omitted, the cookie becomes a session cookie.
   */
  expires?: number | Date | undefined;

  /**
   * Define the path where the cookie is available. Defaults to '/'
   */
  path?: string | undefined;

  /**
   * Define the domain where the cookie is available. Defaults to
   * the domain of the page where the cookie was created.
   */
  domain?: string | undefined;

  /**
   * A Boolean indicating if the cookie transmission requires a
   * secure protocol (https). Defaults to false.
   */
  secure?: boolean | undefined;

  /**
   * Asserts that a cookie must not be sent with cross-origin requests,
   * providing some protection against cross-site request forgery
   * attacks (CSRF)
   */
  sameSite?: "strict" | "Strict" | "lax" | "Lax" | "none" | "None" | undefined;
}
```

### useCookie

A "lower-level" hook, that can be used in case you want to manage state yourself.

```ts
export type UseCookie = <T>(key: string) => {
  /**
   * Retrieves cookie value.
   *
   * In the server **and during hydration**, ALWAYS
   * returns the server cookie value, to prevent
   * hydration mismatches.
   *
   * After hydration, returns the client cookie value.
   */
  retrieve: () => T | undefined;

  /**
   * Stores value in cookie.
   */
  store: (data: T, attributes?: CookieAttributes) => void;

  /**
   * Clear cookie value.
   */
  clear: (attributes?: CookieAttributes) => void;

  /**
   * True whenever there are no cookies in the server, either because
   * we're using SSG, or because we didn't wrap `getServerSideProps`
   * with `withCookiesGetServerSideWrapper` AND it is hydrating.
   *
   * This indicates that we need to synchronize React state
   * with client side cookie value after hydration.
   */
  needsSync: boolean;
};
```

Example:

```ts
const { retrieve, needsSync } = useCookie("SomeCookie");
const [value, setValue] = useState(needsSync ?? retrieve());

useSyncWithCookie((storedValue) => {
  setValue(storedValue);
});
```

TODO

### useSyncWithCookie

To be used in conjunction with `useCookie` to deal with state synchronization after hydration.

```ts
type UseSyncWithCookie = <T>(key: string, sync: (cookieValue: T | undefined) => void)
```

TODO

## Motivation

When using NextJS (or any kind of server rendering), our React components end up getting rendered in two very different environments: **browser** and **server**.

So, if you have a React component that reads values from cookies **while rendering**, while it works fine when rendering in the browser, it'll **crash your application when rendering in the server**:

```tsx
const getCookie = (key: string) => {
  // Toy implementation for the sake of the argument,
  // most likely misses several edge cases
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return JSON.parse(parts.pop().split(";").shift());
  }
};

const FoodTypeCookieKey = "FoodType";

const foodTypes = ["Japanese", "Mexican", "Italian"];

export const FoodTypeFilter = () => {
  // This call to `getCookie` will crash the application,
  // because there is no `document` in the server
  const [foodType, setFoodType] = useState(getCookie(FoodTypeCookieKey));

  return (
    <div>
      <label>Food Type</label>{" "}
      <select
        value={value}
        onChange={(event) => {
          setFoodType(event.target.value);
        }}
      >
        <option value="Japanese">Japanese</option>
        <option value="Mexican">Mexican</option>
        <option value="Italian">Italian</option>
      </select>
    </div>
  );
};
```

And then probably, you might try something like this:

```tsx
const FoodTypeCookieKey = "FoodType";

const foodTypes = ["Japanese", "Mexican", "Italian"];

const isServer = typeof document === "undefined";

export const FoodTypeFilter = () => {
  // In the server we default to a fallback value,
  // so getCookie only gets called in the client
  const initialFoodType = isServer
    ? foodTypes[0]
    : getCookie(FoodTypeCookieKey);
  const [foodType, setFoodType] = useState(initialFoodType);

  return (
    <div>
      <label>Food Type</label>{" "}
      <select
        value={value}
        onChange={(event) => {
          setFoodType(event.target.value);
        }}
      >
        <option value="Japanese">Japanese</option>
        <option value="Mexican">Mexican</option>
        <option value="Italian">Italian</option>
      </select>
    </div>
  );
};
```

But then you're gonna get a **hydration mismatch**, because the HTML that was generated in the server must match **exactly** the HTML that is generated on the client **in the first render**.

Finally, you remember that `useEffect` only runs in the client, and that runs **after the render phase**:

```tsx
const FoodTypeCookieKey = "FoodType";

const foodTypes = ["Japanese", "Mexican", "Italian"];

const isServer = typeof document === "undefined";

export const FoodTypeFilter = () => {
  const [foodType, setFoodType] = useState(foodTypes[0]);

  useEffect(() => {
    // Now we're safe because useEffect
    // runs **after** the render phase,
    // so the very first render will generate
    // exactly the same HTML that was sent by the server,
    // and then after the first render, we update
    // the value with the cookie value
    setFoodType(getCookie(FoodTypeCookieKey));
  }, []);

  return (
    <div>
      <label>Food Type</label>{" "}
      <select
        value={value}
        onChange={(event) => {
          setFoodType(event.target.value);
        }}
      >
        <option value="Japanese">Japanese</option>
        <option value="Mexican">Mexican</option>
        <option value="Italian">Italian</option>
      </select>
    </div>
  );
};
```

After a little bit more of head-scratching, you're probably gonna think:

> But, **wait a moment**, if I use SSR, won't I have access to the request and thus, to the cookies? So why can't I use the cookie value while rendering on the server?

And you're right, you **absolutely can**, the only nuisance is that the **only place you have access to cookies is inside `getServerSideProps`**, so you have to pass the cookie value all the way down to your component, or use the Context API:

```tsx
type PageProps = {
  cookies: Record<string, string>;
};

const Page = ({ cookies }: PageProps) => {
  //...
  return (
    <CookiesContext.Provider value={cookies}>
      {/* ... */}
    </CookiesContext.Provider>
  );
};

export const getServerSideProps = async (context) => {
  // ...
  return {
    props: {
      cookies: context.req.cookies,
    },
  };
};
```

```tsx
const FoodTypeCookieKey = "FoodType";

const foodTypes = ["Japanese", "Mexican", "Italian"];

const isServer = typeof document === "undefined";

export const FoodTypeFilter = () => {
  const cookies = useContext(CookiesContext);
  const [foodType, setFoodType] = useState(
    JSON.parse(cookies[FoodTypeCookieKey])
  );

  return (
    <div>
      <label>Food Type</label>{" "}
      <select
        value={value}
        onChange={(event) => {
          setFoodType(event.target.value);
        }}
      >
        <option value="Japanese">Japanese</option>
        <option value="Mexican">Mexican</option>
        <option value="Italian">Italian</option>
      </select>
    </div>
  );
};
```

However, now your `FoodTypeFilter` component cannot be used in pages that use SSG anymore, because we do not have access to the request in SSG (after all, it renders the page in build time), so `cookies` will be undefined, which will crash your application.

And we could go on, but the point is, with `next-isomorphic-cookies` you can absolutely **forget** about all of these issues, you don't even need to know whether your component is going to be used in a page that uses SSR, or SSG, because **we take care of everything for you**.

## How It Works

TODO

## Cookbook

TODO
