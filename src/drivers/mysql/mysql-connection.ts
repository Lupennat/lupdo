import { Connection } from 'mysql2/promise';
import PdoConnection from '../pdo-connection';

class MysqlConnection extends PdoConnection {
    constructor(public readonly connection: Connection) {
        super();
    }

    async query(sql: string): Promise<void> {
        await this.connection.query(sql);
    }
}

export default MysqlConnection;
