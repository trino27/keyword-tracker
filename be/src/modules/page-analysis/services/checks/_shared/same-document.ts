/** Same document: scheme and host as given, trailing slash and fragment ignored. */
export function sameDocument(a: string, b: string): boolean {
  const key = (url: string) => {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.href.replace(/\/+$/, '');
  };
  try {
    return key(a) === key(b);
  } catch {
    return false;
  }
}
