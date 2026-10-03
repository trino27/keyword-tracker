import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE_CONNECTION,
  type Database,
} from '../database-provider/database.provider';
import type { Transaction } from '../types/transaction.type';

/**
 * Opens a transaction for a service without the service importing Drizzle (ESLint
 * keeps the ORM in repositories). The callback receives the `tx` every repository
 * method accepts as its optional last argument.
 */
@Injectable()
export class TransactionRunner {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  run<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.db.transaction(work);
  }
}
