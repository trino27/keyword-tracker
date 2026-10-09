import {
  declaredCanonicals,
  quoteCanonical,
} from '../_shared/declared-canonicals';
import {
  isDevelopmentHost,
  isOwnDevelopmentHost,
} from '../_shared/development-host';
import { attribute, evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

/**
 * Every place the page names a URL a reader or a search engine would follow or load —
 * the canonical, og:url, hreflang, the content's links and the resources it loads — and
 * which of those point at a development, staging or preview host — any such host for
 * what names the page itself, only this site's own for links and resources. Each is quoted as the
 * kind of reference it is, because a staging canonical and a staging image are fixed in
 * different templates.
 *
 * Always applicable: every page names URLs.
 */
export const DEVELOPMENT_HOST_REFERENCES_CHECK = defineCheck(
  'DEVELOPMENT_HOST_REFERENCES',
  (page) => {
    const { parsed } = page;
    const pageHost = new URL(page.finalUrl).hostname;
    // What names this page itself — canonical, og:url, hreflang — may only ever be a
    // production address; a link or a resource only leaks when it is this site's own.
    const leaked = (url: string) => {
      const host = hostOf(url);
      return host !== null && isDevelopmentHost(host, pageHost);
    };
    const ownLeak = (url: string) => {
      const host = hostOf(url);
      return host !== null && isOwnDevelopmentHost(host, pageHost);
    };
    const ogUrl = parsed.openGraph['og:url'];
    const found = [
      ...declaredCanonicals(page)
        .filter(({ url }) => leaked(url))
        .map(quoteCanonical),
      ...(ogUrl && leaked(ogUrl)
        ? [`<meta property="og:url" content="${attribute(ogUrl)}">`]
        : []),
      ...parsed.alternates
        .filter(({ href }) => leaked(href))
        .map(
          ({ lang, href }) =>
            `<link rel="alternate" hreflang="${attribute(lang)}" href="${attribute(href)}">`,
        ),
      ...[...new Set(parsed.links.filter(ownLeak))].map(
        (href) => `<a href="${attribute(href)}"> in the content`,
      ),
      ...parsed.resourceUrls.filter(ownLeak).map((url) => `loads ${url}`),
    ];
    return found.length === 0
      ? PASS
      : fails({ count: found.length, evidence: evidence(found) });
  },
);
