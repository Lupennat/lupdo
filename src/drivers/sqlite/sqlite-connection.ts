'use strict';

import { Database } from 'better-sqlite3';
import { NpdoConnection } from '../../types';

class SqliteConnection implements NpdoConnection {
    constructor(public readonly connection: Database) {}

    async query(sql: string): Promise<void> {
        await this.connection.prepare(sql).run([]);
    }
}

export = SqliteConnection;
