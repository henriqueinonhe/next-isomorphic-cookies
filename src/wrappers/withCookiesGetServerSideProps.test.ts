import { GetServerSideProps, GetServerSidePropsContext, Redirect } from "next";
import { WithCookiesProps } from "./withCookiesAppWrapper";
import { withCookiesGetServerSidePropsWrapper } from "./withCookiesGetServerSidePropsWrapper";

describe("When wrapped getServerSideProps passes props", () => {
  const setup = async () => {
    const cookies = {
      firstCookie: "firstCookie",
      secondCookie: "secondCookie",
    };

    type PageProps = {
      someProp: string;
    };

    const pageProps: PageProps = {
      someProp: "Some Prop",
    };

    const getServerSideProps: GetServerSideProps<PageProps> = async () => {
      return {
        props: pageProps,
      };
    };

    const wrappedGetServerSideProps =
      withCookiesGetServerSidePropsWrapper(getServerSideProps);

    const context = {
      req: {
        cookies,
      },
    } as unknown as GetServerSidePropsContext;
    const result = (await wrappedGetServerSideProps(context)) as {
      props: PageProps & WithCookiesProps;
    };

    return {
      result,
      cookies,
      pageProps,
    };
  };

  it("Preserves passed props", async () => {
    const { result, pageProps } = await setup();

    expect(result.props).toStrictEqual(expect.objectContaining(pageProps));
  });

  it("Injects cookies as props", async () => {
    const { result, cookies } = await setup();

    expect(result.props.__next_isomorphic_cookies).toStrictEqual(cookies);
  });
});

describe("When wrapped getServerSideProps passes config values other than props", () => {
  const setup = async () => {
    const redirect: Redirect = {
      statusCode: 301,
      destination: "/some/path",
    };

    const getServerSideProps: GetServerSideProps = async () => {
      return {
        redirect,
      };
    };

    const wrappedGetServerSideProps =
      withCookiesGetServerSidePropsWrapper(getServerSideProps);

    const context = {
      req: {
        cookies: {},
      },
    } as unknown as GetServerSidePropsContext;
    const result = (await wrappedGetServerSideProps(context)) as {
      redirect: Redirect;
    };

    return {
      result,
      redirect,
    };
  };

  it("Preserves passed config values", async () => {
    const { redirect, result } = await setup();

    expect(result.redirect).toStrictEqual(redirect);
  });
});
