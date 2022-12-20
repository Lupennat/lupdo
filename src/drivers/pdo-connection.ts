import { PdoConnectionI } from '../types';

abstract class PdoConnection implements PdoConnectionI {
    abstract query(sql: string): Promise<void>;
}

export default PdoConnection;
