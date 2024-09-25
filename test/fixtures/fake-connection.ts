import PdoConnection from '../../src/support/pdo-connection';
import JsonConnection from './fake-db-connection';

export default class FakeConnection extends PdoConnection {
  constructor(public readonly connection: JsonConnection) {
    super();
  }

  async query(sql: string): Promise<void> {
    await this.connection.query(sql);
  }
}
