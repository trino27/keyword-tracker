import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURES_ROOT } from '@infrastructure/remote-api/_testing/fixture-http-transport';
import {
  classifyPsiResponse,
  type TPsiOutcome,
} from '../services/classify-psi-response/classify-psi-response';
import {
  pageSpeedFixtureBody,
  readPageSpeedFixture,
} from './read-page-speed-fixture';

const FOLDER = join(FIXTURES_ROOT, 'pagespeed');

/**
 * Every answer in `pagespeed/`, the status Google sent it with, and what it must come to.
 * A file added without a row here fails the first test: an answer nobody classified is an
 * answer nobody checked.
 */
const ANSWERS: Record<
  string,
  { status: number; outcome: Partial<TPsiOutcome> }
> = {
  'url-field.json': { status: 200, outcome: { kind: 'measured' } },
  'origin-only.json': { status: 200, outcome: { kind: 'measured' } },
  'lab-only.json': { status: 200, outcome: { kind: 'measured' } },
  'failed-document.json': {
    status: 400,
    outcome: { kind: 'permanent', error: 'PAGE_LOAD_FAILED' },
  },
  'no-fcp.json': {
    status: 400,
    outcome: { kind: 'permanent', error: 'PAGE_ERRORED' },
  },
  'errored-document.synthesized.json': {
    status: 400,
    outcome: { kind: 'permanent', error: 'PAGE_ERRORED' },
  },
  'key-invalid.json': { status: 400, outcome: { kind: 'keyRejected' } },
  'rate-limited.json': { status: 429, outcome: { kind: 'rateLimited' } },
  'server-error.synthesized.json': {
    status: 503,
    outcome: { kind: 'transient', error: 'PSI_UNAVAILABLE' },
  },
};

type TLoadingExperience = {
  id?: string;
  origin_fallback?: boolean;
  metrics?: Record<string, unknown>;
};
type TSuccess = {
  loadingExperience?: TLoadingExperience;
  originLoadingExperience?: TLoadingExperience;
};

describe('the recorded PageSpeed answers', () => {
  it('every file in the folder is classified below', () => {
    expect(readdirSync(FOLDER).sort()).toEqual(Object.keys(ANSWERS).sort());
  });

  it.each(Object.entries(ANSWERS))(
    '%s classifies as its name says',
    (file, { status, outcome }) => {
      const result = classifyPsiResponse({
        response: { status, headers: {}, body: pageSpeedFixtureBody(file) },
      });

      expect(result).toMatchObject(outcome);
    },
  );

  /** An error body names its own status; the table above must agree with Google. */
  it.each(Object.entries(ANSWERS).filter(([, { status }]) => status !== 200))(
    '%s carries the status it is classified under',
    (file, { status }) => {
      expect(readPageSpeedFixture(file)).toMatchObject({
        error: { code: status },
      });
    },
  );

  /**
   * The roles the file names promise, as Google sent them — so a re-recording in which a
   * target changed role (a page gaining or losing its own data) fails here, not in a value.
   */
  it('url-field has the page’s own data, origin-only the site’s under the page’s name, lab-only none', () => {
    const own = readPageSpeedFixture('url-field.json') as TSuccess;
    const fallback = readPageSpeedFixture('origin-only.json') as TSuccess;
    const lab = readPageSpeedFixture('lab-only.json') as TSuccess;

    expect(own.loadingExperience?.origin_fallback).toBeUndefined();
    expect(Object.keys(own.loadingExperience?.metrics ?? {})).toContain(
      'LARGEST_CONTENTFUL_PAINT_MS',
    );
    expect(fallback.loadingExperience?.origin_fallback).toBe(true);
    expect(fallback.loadingExperience?.id).toBe(
      fallback.originLoadingExperience?.id,
    );
    expect(lab.loadingExperience?.metrics).toBeUndefined();
    expect(lab.originLoadingExperience?.metrics).toBeUndefined();
  });

  it('no answer carries an API key or a project number', () => {
    for (const file of readdirSync(FOLDER)) {
      const text = readFileSync(join(FOLDER, file), 'utf8');
      expect({ file, key: /AIza[0-9A-Za-z_-]{30,}/.test(text) }).toEqual({
        file,
        key: false,
      });
      const projects = [
        ...text.matchAll(/(?:projects\/|project_number:)(\d+)/g),
      ];
      expect({
        file,
        projects: projects.filter(([, id]) => /[1-9]/.test(id)),
      }).toEqual({
        file,
        projects: [],
      });
    }
  });
});
