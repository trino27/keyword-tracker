import type { CheerioAPI } from 'cheerio';
import { ARTICLE_TYPES } from '../../constants/article-types.constant';
import type {
  IArticleMarkup,
  IMarkupAuthor,
} from '../../interfaces/parsed-page.interface';

type TSelection = ReturnType<CheerioAPI>;

const collapse = (text: string) => text.replace(/\s+/g, ' ').trim();

/** Elements whose Microdata value is a URL attribute rather than their text. */
const URL_VALUE: Readonly<Record<string, string>> = {
  a: 'href',
  area: 'href',
  link: 'href',
  img: 'src',
  audio: 'src',
  video: 'src',
  source: 'src',
  iframe: 'src',
  embed: 'src',
  track: 'src',
  object: 'data',
};

/** `https://schema.org/BlogPosting` → `BlogPosting`, for each type an `itemtype` lists. */
const itemTypesOf = (element: TSelection): string[] =>
  (element.attr('itemtype') ?? '')
    .split(/\s+/)
    .map((url) => url.split(/[/#]/).filter(Boolean).pop() ?? '')
    .filter(Boolean);

/** A property's value as the Microdata spec reads it, for an element that is no item. */
function valueOf(element: TSelection): string {
  const node = element.get(0);
  const tag = (node && 'tagName' in node ? node.tagName : '').toLowerCase();
  if (tag === 'meta') return collapse(element.attr('content') ?? '');
  const urlAttribute = URL_VALUE[tag];
  if (urlAttribute) return collapse(element.attr(urlAttribute) ?? '');
  if (tag === 'time')
    return collapse(element.attr('datetime') ?? element.text());
  if (tag === 'data' || tag === 'meter')
    return collapse(element.attr('value') ?? '');
  return collapse(element.text());
}

/**
 * The properties that belong to an item itself — not those of an item nested in it —
 * by name, each with its element. An element naming several properties counts for each.
 */
function propertiesOf(
  $: CheerioAPI,
  item: TSelection,
): Map<string, TSelection[]> {
  const scope = item.get(0);
  const properties = new Map<string, TSelection[]>();
  item.find('[itemprop]').each((_, node) => {
    const element = $(node);
    if (element.parent().closest('[itemscope]').get(0) !== scope) return;
    for (const name of (element.attr('itemprop') ?? '').split(/\s+/)) {
      if (!name) continue;
      properties.set(name, [...(properties.get(name) ?? []), element]);
    }
  });
  return properties;
}

const isItem = (element: TSelection) => element.attr('itemscope') !== undefined;

function authorOf(
  $: CheerioAPI,
  element: TSelection,
  baseUrl: string,
): IMarkupAuthor | null {
  if (!isItem(element)) {
    const name = valueOf(element);
    return name ? { name, type: null, urls: [], asText: true } : null;
  }
  const props = propertiesOf($, element);
  const first = (name: string) => {
    const found = props.get(name)?.[0];
    return found ? valueOf(found) || null : null;
  };
  return {
    name: first('name'),
    type: itemTypesOf(element)[0] ?? null,
    urls: ['url', 'sameAs'].flatMap((name) =>
      (props.get(name) ?? [])
        .map(valueOf)
        .filter(Boolean)
        .map((url) => {
          try {
            return new URL(url, baseUrl).href;
          } catch {
            return url;
          }
        }),
    ),
    asText: false,
  };
}

/**
 * What a page declares in Microdata: every type, and its article item — the first item
 * typed as an article — read into the same shape a JSON-LD article is, plus the names of
 * any `WebSite` item. RDFa is not read; it is rare on the blogs this crawls, and a page
 * using it is reported as declaring no article, which the explanation says.
 */
export function readMicrodata(
  $: CheerioAPI,
  baseUrl: string,
): {
  types: string[];
  articleFields: string[];
  article: IArticleMarkup | null;
  websiteNames: { name: string; alternateNames: string[] }[];
} {
  const types = new Set<string>();
  let articleItem: { element: TSelection; type: string } | null = null;
  const websiteNames: { name: string; alternateNames: string[] }[] = [];

  $('[itemscope][itemtype]').each((_, node) => {
    const element = $(node);
    const itemTypes = itemTypesOf(element);
    itemTypes.forEach((type) => types.add(type));
    const article = itemTypes.find((type) => ARTICLE_TYPES.has(type));
    if (article && !articleItem) articleItem = { element, type: article };
    if (itemTypes.includes('WebSite')) {
      const props = propertiesOf($, element);
      const name = props.get('name')?.map(valueOf).find(Boolean);
      if (name)
        websiteNames.push({
          name,
          alternateNames: (props.get('alternateName') ?? [])
            .map(valueOf)
            .filter(Boolean),
        });
    }
  });

  if (!articleItem)
    return {
      types: [...types],
      articleFields: [],
      article: null,
      websiteNames,
    };

  const { element, type } = articleItem as {
    element: TSelection;
    type: string;
  };
  const props = propertiesOf($, element);
  const articleFields = [...props.entries()]
    .filter(([, elements]) =>
      elements.some((found) => isItem(found) || valueOf(found)),
    )
    .map(([name]) => name);
  const first = (name: string) => {
    const found = props.get(name)?.find((candidate) => valueOf(candidate));
    return found ? valueOf(found) : null;
  };
  const absolute = (value: string | null) => {
    if (!value) return null;
    try {
      return new URL(value, baseUrl).href;
    } catch {
      return null;
    }
  };

  return {
    types: [...types],
    articleFields,
    article: {
      source: 'microdata',
      type,
      headline: first('headline') ?? first('name'),
      datePublished: first('datePublished'),
      dateModified: first('dateModified'),
      authors: (props.get('author') ?? [])
        .map((found) => authorOf($, found, baseUrl))
        .filter((author): author is IMarkupAuthor => author !== null),
      images: (props.get('image') ?? []).flatMap((found) => {
        const nested = isItem(found)
          ? propertiesOf($, found).get('url')?.[0]
          : undefined;
        const url = absolute(
          nested ? valueOf(nested) : isItem(found) ? null : valueOf(found),
        );
        return url ? [{ url, width: null, height: null }] : [];
      }),
    },
    websiteNames,
  };
}
