/**
 * The first path segments under which a site keeps redirects to someone else's site —
 * its affiliate links, `/refer/bluehost/` on wpbeginner.com, `/out/clicky/` on yoast.com.
 * The URL is the site's, the page it leads to is not, and Google asks for exactly such
 * links to be marked.
 */
const OUTBOUND_REDIRECT_SECTIONS = new Set([
  'refer',
  'go',
  'goto',
  'out',
  'recommends',
  'visit',
  'aff',
  'affiliate',
]);

/** A print version of a post — `/wprm_print/<slug>`, `/print/` — is the post again. */
const PRINT_SEGMENT = /(?:^|[-_])print(?:$|[-_])/i;

/**
 * An address that does something rather than show a page: a shop's cart and checkout,
 * an add-to-cart link (`/eu/cart?add-to-cart=109998` on yoast.com), signing in or out.
 * It redirects as part of the action, and a site rightly keeps crawlers off it.
 */
const ACTION_SEGMENTS = new Set([
  'cart',
  'basket',
  'checkout',
  'login',
  'logout',
  'signin',
  'signout',
  'wp-login.php',
]);
const ACTION_PARAMETERS = ['add-to-cart', 'add_to_cart', 'redirect_to'];

/** Whether the link is to the site's redirect to another site, its affiliate link. */
export function isOutboundRedirect(href: string): boolean {
  const [first] = new URL(href).pathname.split('/').filter(Boolean);
  return OUTBOUND_REDIRECT_SECTIONS.has(first?.toLowerCase() ?? '');
}

/** Whether the link performs an action — cart, checkout, sign-in — rather than show a page. */
export function isActionLink(href: string): boolean {
  const url = new URL(href);
  return (
    url.pathname
      .split('/')
      .some((segment) => ACTION_SEGMENTS.has(segment.toLowerCase())) ||
    ACTION_PARAMETERS.some((name) => url.searchParams.has(name))
  );
}

/**
 * Whether the link leads to a page of this site that the site would vouch for: not an
 * outbound redirect dressed as an internal URL, not a print copy kept out on purpose.
 * An action such as adding to the cart still is: Google asks a site to keep crawlers off
 * its own URLs with robots.txt, not with nofollow.
 */
export function isOwnPage(href: string): boolean {
  return !(
    isOutboundRedirect(href) ||
    new URL(href).pathname
      .split('/')
      .filter(Boolean)
      .some((segment) => PRINT_SEGMENT.test(segment))
  );
}
