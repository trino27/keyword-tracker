import type {
  IBreadcrumbItem,
  IMarkupAuthor,
  IMarkupImage,
} from '../../interfaces/parsed-page.interface';

/** One JSON-LD node: an object with string keys. */
export type TNode = Record<string, unknown>;

/** Nodes that carry an `@id`, so a reference — `{"@id": "#person"}` — can be followed. */
export type TNodesById = ReadonlyMap<string, TNode>;

const collapse = (text: string) => text.replace(/\s+/g, ' ').trim();

const isNode = (value: unknown): value is TNode =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export const typesOf = (node: TNode): string[] =>
  [node['@type']]
    .flat()
    .filter((type): type is string => typeof type === 'string');

/**
 * A reference resolved into the node it names, the reference's own keys kept on top: Yoast
 * writes `"author": {"@id": ".../#/schema/person/1"}` and the Person sits elsewhere in
 * the graph, with the name, the type and the url a reader of the article node needs.
 */
function deref(value: unknown, byId: TNodesById): unknown {
  if (!isNode(value) || typeof value['@id'] !== 'string') return value;
  const target = byId.get(value['@id']);
  return target ? { ...target, ...value } : value;
}

const textOf = (value: unknown): string | null =>
  typeof value === 'string' && collapse(value) ? collapse(value) : null;

/** A URL as written, resolved against the page; null when it is not one. */
function urlOf(value: unknown, baseUrl: string): string | null {
  const raw = textOf(value);
  if (!raw) return null;
  try {
    return new URL(raw, baseUrl).href;
  } catch {
    return null;
  }
}

/** `1200`, `"1200"`, `"1200px"` or `{"@type": "QuantitativeValue", "value": 1200}`. */
function numberOf(value: unknown): number | null {
  if (isNode(value)) return numberOf(value.value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** The first of a value that may be one thing or a list of them. */
const firstOf = (value: unknown): unknown =>
  Array.isArray(value) ? value[0] : value;

/** Every author the value names, in the form it names them. */
export function authorsOf(value: unknown, byId: TNodesById): IMarkupAuthor[] {
  if (Array.isArray(value)) return value.flatMap((v) => authorsOf(v, byId));
  if (typeof value === 'string')
    return collapse(value)
      ? [{ name: collapse(value), type: null, urls: [], asText: true }]
      : [];
  const node = deref(value, byId);
  if (!isNode(node)) return [];
  return [
    {
      name: textOf(node.name),
      type: typesOf(node)[0] ?? null,
      urls: [node.url, node.sameAs]
        .flat()
        .map(textOf)
        .filter((url): url is string => url !== null),
      asText: false,
    },
  ];
}

/** Every image the value names, with the size it declares. */
export function imagesOf(
  value: unknown,
  byId: TNodesById,
  baseUrl: string,
): IMarkupImage[] {
  if (Array.isArray(value))
    return value.flatMap((v) => imagesOf(v, byId, baseUrl));
  const url = urlOf(value, baseUrl);
  if (url) return [{ url, width: null, height: null }];
  const node = deref(value, byId);
  if (!isNode(node)) return [];
  const src = urlOf(node.url, baseUrl) ?? urlOf(node.contentUrl, baseUrl);
  return src
    ? [
        {
          url: src,
          width: numberOf(node.width),
          height: numberOf(node.height),
        },
      ]
    : [];
}

/** The URLs a node's `logo` names. */
export const logosOf = (
  node: TNode,
  byId: TNodesById,
  baseUrl: string,
): string[] =>
  node.logo === undefined
    ? []
    : imagesOf(node.logo, byId, baseUrl).map(({ url }) => url);

/** A `BreadcrumbList`'s items as written; a list without any is an empty list. */
export function breadcrumbItemsOf(
  node: TNode,
  byId: TNodesById,
  baseUrl: string,
): IBreadcrumbItem[] {
  return [node.itemListElement]
    .flat()
    .map((entry) => deref(entry, byId))
    .filter(isNode)
    .map((entry) => {
      const item = deref(firstOf(entry.item), byId);
      const position = numberOf(entry.position);
      return {
        position:
          position !== null && Number.isInteger(position) ? position : null,
        name: textOf(entry.name) ?? (isNode(item) ? textOf(item.name) : null),
        item: isNode(item)
          ? (urlOf(item['@id'], baseUrl) ?? urlOf(item.url, baseUrl))
          : urlOf(item, baseUrl),
      };
    });
}

/** A `WebSite` node's names, or null when it states none. */
export function websiteNameOf(
  node: TNode,
): { name: string; alternateNames: string[] } | null {
  const name = textOf(node.name);
  if (!name) return null;
  return {
    name,
    alternateNames: [node.alternateName]
      .flat()
      .map(textOf)
      .filter((v): v is string => v !== null),
  };
}
