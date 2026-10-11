import { readPageSpeedFixture } from '../../_testing/read-page-speed-fixture';
import { extractImageDelivery } from './extract-image-delivery';

type TAnswer = {
  lighthouseResult: { audits: Record<string, Record<string, unknown>> };
};

const answer = (file: string) => readPageSpeedFixture(file) as TAnswer;

describe('extractImageDelivery', () => {
  /**
   * bbcgoodfood.com's recipe page, 2026-10-11: Lighthouse 13.5.0 scored the audit 0.5 with
   * 162 175 bytes to save across eight images ("Est savings of 158 KiB").
   */
  it("reads the failing audit's savings and images, largest first, at most 10", () => {
    const json = answer('image-delivery-failing.json');
    const items = json.lighthouseResult.audits['image-delivery-insight']
      .details as {
      items: { url: string; wastedBytes: number }[];
    };

    const delivery = extractImageDelivery(json);

    expect(delivery).toMatchObject({ failing: true, savingsBytes: 162_175 });
    expect(delivery!.images).toHaveLength(8);
    expect(delivery!.images[0]).toEqual({
      url: items.items[0].url,
      savingsBytes: 44_800,
    });
    const savings = delivery!.images.map(({ savingsBytes }) => savingsBytes);
    expect(savings).toEqual([...savings].sort((a, b) => b - a));

    // Eleven images are cut to the ten that save the most.
    const many = structuredClone(json);
    const details = many.lighthouseResult.audits['image-delivery-insight']
      .details as { items: { url: string; wastedBytes: number }[] };
    details.items = Array.from({ length: 11 }, (_, i) => ({
      url: `https://a.example/${i}.jpg`,
      wastedBytes: 10_000 + i,
    }));
    const cut = extractImageDelivery(many)!.images;
    expect(cut).toHaveLength(10);
    expect(cut[0].savingsBytes).toBe(10_010);
    expect(cut.map(({ url }) => url)).not.toContain('https://a.example/0.jpg');
  });

  it('reads a passing audit as passing, with nothing to save', () => {
    expect(extractImageDelivery(answer('image-delivery-passing.json'))).toEqual(
      {
        failing: false,
        savingsBytes: 0,
        images: [],
      },
    );
  });

  it('is null for an answer without the audit', () => {
    expect(extractImageDelivery(answer('url-field.json'))).toBeNull();
  });

  it('is null for an audit that does not parse', () => {
    const json = structuredClone(answer('image-delivery-failing.json'));
    json.lighthouseResult.audits['image-delivery-insight'].details = {
      debugData: { wastedBytes: 'a lot' },
      items: [],
    };

    expect(extractImageDelivery(json)).toBeNull();
  });

  it('reads nothing outside its audit', () => {
    const json = answer('image-delivery-failing.json');
    const bare = structuredClone(json);
    bare.lighthouseResult.audits = {
      'image-delivery-insight':
        json.lighthouseResult.audits['image-delivery-insight'],
    };

    expect(extractImageDelivery(bare)).toEqual(extractImageDelivery(json));
  });
});
