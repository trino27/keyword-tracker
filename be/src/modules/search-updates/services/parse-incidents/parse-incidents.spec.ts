import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURES_ROOT } from '@infrastructure/remote-api/_testing/fixture-http-transport';
import { parseIncidents } from './parse-incidents';

const recorded = () =>
  JSON.parse(
    readFileSync(
      join(FIXTURES_ROOT, 'sites', 'google-status', 'incidents.json'),
      'utf8',
    ),
  ) as unknown;

describe('parseIncidents', () => {
  // Recorded from status.search.google.com on 2026-10-09: eight ranking updates and one
  // serving outage, which is not an update and says nothing about rankings.
  it('reads the ranking updates of the recorded feed, newest first, and no outage', () => {
    const updates = parseIncidents(recorded());

    expect(updates).toHaveLength(8);
    expect(updates[0]).toEqual({
      id: 'XhUDXP7A67iHCD2kmbVu',
      title: 'September 2026 spam update',
      kind: 'spam',
      begin: '2026-09-24T16:15:00.000Z',
      end: '2026-10-08T08:00:00.000Z',
      url: 'https://status.search.google.com/incidents/XhUDXP7A67iHCD2kmbVu',
    });
    expect(updates.map(({ kind }) => kind)).toEqual([
      'spam',
      'spam',
      'spam',
      'core',
      'core',
      'spam',
      'other',
      'core',
    ]);
    expect(updates.some(({ title }) => /serving/i.test(title))).toBe(false);
  });

  it('keeps an update still rolling out, with no end', () => {
    expect(
      parseIncidents([
        {
          id: 'x',
          service_name: 'Ranking',
          external_desc: 'November 2026 core update',
          begin: '2026-11-03T15:00:00+00:00',
          end: null,
          uri: 'incidents/x',
        },
      ]),
    ).toEqual([expect.objectContaining({ kind: 'core', end: null })]);
  });

  // Someone else's undocumented feed: an entry missing a field is dropped, not guessed.
  it('drops what it cannot read, and reads a body that is not a list as nothing', () => {
    expect(
      parseIncidents([
        {
          service_name: 'Ranking',
          external_desc: 'No id',
          begin: '2026-01-01',
        },
        {
          id: 'y',
          service_name: 'Ranking',
          external_desc: 'Bad date',
          begin: 'soon',
        },
        null,
      ]),
    ).toEqual([]);
    expect(parseIncidents({ incidents: [] })).toEqual([]);
  });
});
