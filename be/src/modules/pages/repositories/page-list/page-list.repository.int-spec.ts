import { sql } from 'drizzle-orm';
import { createTestDatabase } from '../../../../../test/support/test-database';

const testDb = createTestDatabase();

describe('PageListRepository (postgres)', () => {
  beforeEach(() => testDb.reset());
  afterAll(() => testDb.close());

  it('the trigram indexes behind the search exist', async () => {
    const { rows } = await testDb.db.execute<{ indexname: string }>(sql`
      select indexname from pg_indexes
      where indexname in ('pages_url_trgm_idx', 'keywords_term_trgm_idx')
      order by indexname
    `);

    expect(rows.map((row) => row.indexname)).toEqual([
      'keywords_term_trgm_idx',
      'pages_url_trgm_idx',
    ]);
  });
});
