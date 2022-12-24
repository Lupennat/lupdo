import { PdoConnection } from '../../support';
import JsonConnection from './fake-db-connection';

class FakeConnection extends PdoConnection {
    constructor(public readonly connection: JsonConnection) {
        super();
    }

    async query(sql: string): Promise<void> {
        await this.connection.query(sql);
    }
}

export default FakeConnection;
