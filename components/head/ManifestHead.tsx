import { PropsWithChildren, FC } from 'react';
import NextHead from 'next/head';
import { join } from 'path';
// import Link from '../link/Link';

/* eslint-disable prefer-destructuring */
const LINK_PREFIX = process.env.NEXT_PUBLIC_LINK_PREFIX || '';
const THEME_COLOR = process.env.NEXT_PUBLIC_THEME_COLOR;
const MANIEFST_PATH = process.env.NEXT_PUBLIC_MANIEFST_PATH;
const ICON_192_PATH = process.env.NEXT_PUBLIC_ICON_192_PATH;
const FAV_ICON_PATH = process.env.NEXT_PUBLIC_FAV_ICON_PATH;
/* eslint-enable prefer-destructuring */

type Props = PropsWithChildren<{
  title?: string | null;
  description?: string | null;
  charSet?: string | null;
  linkPrefix?: string | null;
  hrefCanonical?: string | null;
  hrefManifest?: string | null;
  themeColor?: string | null;
  favIconPath?: string | null;
  keywords?: string | (string | null)[] | null;
  refresh?: number | null;
  appleIconPath?: string | null;
  appleIconSize?: string | null;
  isAmp?: string | null;
  noIndex?: boolean | null;
  noFollow?: boolean | null;
}>;

const ManifestHead: FC<Props> = (props) => {
  const title = props.title ?? '';
  const description = props.description ?? title;
  const charSet = props.charSet ?? 'utf-8';
  const themeColor = props.themeColor ?? THEME_COLOR;
  const keywords = Array.isArray(props.keywords)
    ? props.keywords.filter((keyword) => !!keyword).join(', ')
    : props.keywords ?? title;
  const linkPrefix = (props.linkPrefix ?? LINK_PREFIX) || '';
  const hrefManifest = props.hrefManifest ?? MANIEFST_PATH;
  const noIndex = !!props.noIndex;
  const noFollow = !!props.noFollow;
  const favIconPath = props.favIconPath ?? FAV_ICON_PATH;
  const appleIconPath = props.appleIconPath ?? ICON_192_PATH;
  const appleIconSize = props.appleIconSize ?? '192x192';
  const { isAmp, hrefCanonical, refresh, children } = props;

  return (
    <NextHead>
      <title key="title">{title}</title>
      <meta charSet={charSet} key="charSet" />
      <meta name="description" key="description" content={description} />
      {themeColor && (
        <meta name="theme-color" key="theme-color" content={themeColor} />
      )}
      <meta name="keywords" key="keywords" content={keywords} />
      <meta httpEquiv="X-UA-Compatible" key="ua-compatible" content="ie=edge" />
      {!isAmp && hrefCanonical && (
        <link rel="canonical" href={join(linkPrefix, hrefCanonical)} />
      )}
      {hrefManifest && (
        <link rel="manifest" href={join(linkPrefix, hrefManifest)} />
      )}
      {refresh && (
        <meta httpEquiv="refresh" key="refresh" content={`${refresh}`} />
      )}
      {favIconPath && (
        <link rel="shortcut icon" href={join(linkPrefix, favIconPath)} />
      )}
      {noIndex ||
        (noFollow && (
          <meta
            name="robots"
            content={[
              noIndex ? 'noIndex' : undefined,
              noFollow ? 'noFollow' : undefined,
            ].join(',')}
          />
        ))}

      {/* for safari */}
      <meta
        name="apple-mobile-web-app-capable"
        key="apple-mobile-web-app-capable"
        content="yes"
      />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        key="apple-mobile-web-app-status-bar-style"
        content="blue"
      />
      <meta
        name="apple-mobile-web-app-title"
        key="apple-mobile-web-app-title"
        content="With Manifest"
      />
      {appleIconPath && appleIconSize && (
        <link
          rel="apple-touch-icon"
          sizes={appleIconSize}
          href={join(linkPrefix, appleIconPath)}
        />
      )}

      {/* for IE */}
      {appleIconPath && (
        <meta
          name="msapplication-TitleImage"
          key="msapplication-TitleImage"
          content={join(linkPrefix, appleIconPath)}
        />
      )}
      {themeColor && (
        <meta
          name="msapplication-TitleColor"
          key="msapplication-TitleColor"
          content={themeColor}
        />
      )}
      {children}
    </NextHead>
  );
};

export default ManifestHead;
