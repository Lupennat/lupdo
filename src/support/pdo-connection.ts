import { PdoConnectionI } from '../types';

abstract class PdoConnection implements PdoConnectionI {
    public version = '';

    abstract query(sql: string): Promise<void>;
}

export default PdoConnection;
