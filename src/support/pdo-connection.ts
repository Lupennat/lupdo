import { PdoConnectionI } from '../types/pdo-connection';

export abstract class PdoConnection implements PdoConnectionI {
  public version = '';

  abstract query(sql: string): Promise<void>;
}

export default PdoConnection;
