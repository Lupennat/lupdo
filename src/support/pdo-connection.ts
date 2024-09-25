import { PdoConnectionI } from '../types/pdo-connection';

export default abstract class PdoConnection implements PdoConnectionI {
  public version = '';

  abstract query(sql: string): Promise<void>;
}
