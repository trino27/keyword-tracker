import type { IPageImage } from '../../../interfaces/parsed-page.interface';

/** A content image that loads eagerly and reserves its box; a test overrides what it reads. */
export const makeImage = (overrides: Partial<IPageImage> = {}): IPageImage => ({
  src: 'a.png',
  alt: 'A chart',
  loading: null,
  sized: true,
  markup: `<img src="${overrides.src ?? 'a.png'}">`,
  ...overrides,
});
