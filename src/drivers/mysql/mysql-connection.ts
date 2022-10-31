import { Connection } from 'mysql2/promise';
import { NpdoConnection } from '../../types';
class MysqlConnection implements NpdoConnection {
    constructor(public readonly connection: Connection) {}

    async query(sql: string): Promise<void> {
        await this.connection.query(sql);
    }
}

export = MysqlConnection;
