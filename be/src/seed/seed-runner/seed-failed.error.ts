/** The seed could not produce what the brief requires; the CLI exits 1 with this message. */
export class SeedFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeedFailedError';
  }
}
