import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Client } from 'pg';
import { EnvKeys } from '@infrastructure/config/env-keys.constant';

/**
 * A dedicated connection that LISTENs on one channel. LISTEN needs its own session —
 * a pooled connection is handed to other queries between notifications.
 *
 * Losing the connection only costs latency: whoever listens also polls.
 */
@Injectable()
export class PgNotificationListener {
  private client: Client | null = null;

  constructor(
    private readonly config: ConfigService,
    @InjectPinoLogger(PgNotificationListener.name)
    private readonly logger: PinoLogger,
  ) {}

  async listen(channel: string, onNotify: () => void): Promise<void> {
    const client = new Client({
      connectionString: this.config.getOrThrow<string>(EnvKeys.DATABASE_URL),
    });
    client.on('notification', () => onNotify());
    client.on('error', (err) => {
      this.logger.warn(
        { err, channel },
        'Notification connection lost; falling back to polling',
      );
    });
    await client.connect();
    // Identifiers cannot be bound as parameters; the channel is our own constant.
    await client.query(`LISTEN "${channel.replace(/"/g, '""')}"`);
    this.client = client;
  }

  async close(): Promise<void> {
    const client = this.client;
    this.client = null;
    await client?.end();
  }
}
