import { cwvIssuesOf } from '../cwv-issues/cwv-issues-of';
import type { IExtractedImageDelivery } from '../extract-image-delivery/extract-image-delivery';
import type { IExtractedMeasurement } from '../extract-measurement/extract-measurement';
import { speedIssuesOf } from './speed-issues-of';

const measurement: IExtractedMeasurement = {
  lcp: { value: 3100, source: 'url' },
  inp: { value: 100, source: 'url' },
  cls: { value: 0.01, source: 'url' },
  performanceScore: 70,
};

const delivery = (
  savingsBytes: number,
  failing = true,
): IExtractedImageDelivery => ({
  failing,
  savingsBytes,
  images: [{ url: 'https://a.example/hero.jpg', savingsBytes }],
});

const codesOf = (issues: { code: string }[]) => issues.map(({ code }) => code);

describe('speedIssuesOf', () => {
  /** The bar is the catalogue's `min`: 100 KiB, inclusive. */
  it('raises IMAGE_DELIVERY_INEFFICIENT at 102 400 bytes, not 102 399', () => {
    const at = speedIssuesOf({
      strategy: 'mobile',
      measurement,
      imageDelivery: delivery(102_400),
    });
    const below = speedIssuesOf({
      strategy: 'mobile',
      measurement,
      imageDelivery: delivery(102_399),
    });

    expect(at).toContainEqual({
      code: 'IMAGE_DELIVERY_INEFFICIENT',
      severity: 'notice',
      details: {
        value: 102_400,
        min: 102_400,
        images: [{ url: 'https://a.example/hero.jpg', savingsBytes: 102_400 }],
      },
    });
    expect(codesOf(below)).not.toContain('IMAGE_DELIVERY_INEFFICIENT');
  });

  it('not for a passing audit with savings', () => {
    expect(
      codesOf(
        speedIssuesOf({
          strategy: 'mobile',
          measurement,
          imageDelivery: delivery(500_000, false),
        }),
      ),
    ).not.toContain('IMAGE_DELIVERY_INEFFICIENT');
  });

  it('keeps the CWV findings of cwvIssuesOf unchanged', () => {
    const issues = speedIssuesOf({
      strategy: 'mobile',
      measurement,
      imageDelivery: delivery(200_000),
    });

    expect(issues.slice(0, -1)).toEqual(cwvIssuesOf('mobile', measurement));
    expect(
      speedIssuesOf({ strategy: 'mobile', measurement, imageDelivery: null }),
    ).toEqual(cwvIssuesOf('mobile', measurement));
  });

  /** A desktop measurement asks for performance only; image delivery is mobile's (D10). */
  it('the desktop overload returns CWV findings only', () => {
    expect(speedIssuesOf({ strategy: 'desktop', measurement })).toEqual(
      cwvIssuesOf('desktop', measurement),
    );
  });
});
