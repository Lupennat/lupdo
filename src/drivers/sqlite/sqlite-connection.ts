'use strict';

import { Database } from 'better-sqlite3';
import PdoConnection from '../pdo-connection';

class SqliteConnection extends PdoConnection {
    constructor(public readonly connection: Database) {
        super();
    }

    async query(sql: string): Promise<void> {
        await this.connection.prepare(sql).run([]);
    }
}

export default SqliteConnection;
