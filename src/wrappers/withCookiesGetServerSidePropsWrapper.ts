import { GetServerSideProps, PreviewData } from "next";
import { ParsedUrlQuery } from "querystring";

type Wrappee<
  P extends {} = {},
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  D extends PreviewData = PreviewData
> = GetServerSideProps<P, Q, D>;

type WithCookiesGetPropsWrapper<
  P extends {} = {},
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  D extends PreviewData = PreviewData
> = Wrappee<P, Q, D>;

export const withCookiesGetServerSidePropsWrapper =
  <
    P extends {} = {},
    Q extends ParsedUrlQuery = ParsedUrlQuery,
    D extends PreviewData = PreviewData
  >(
    getServerSideProps: Wrappee<P, Q, D>
  ): WithCookiesGetPropsWrapper<P, Q, D> =>
  async (context) => {
    const originalProps = (await getServerSideProps(context)) as {
      props: P;
    };

    return {
      ...originalProps,
      props: {
        ...originalProps.props,
        __next_isomorphic_cookies: context.req.cookies,
      },
    };
  };
