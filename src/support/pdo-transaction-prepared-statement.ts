import { Params, PdoTransactionPreparedStatementI, ValidBindings } from '../types/pdo-prepared-statement';
import PdoStatement from './pdo-statement';

class PdoTransactionPreparedStatement extends PdoStatement implements PdoTransactionPreparedStatementI {
    public bindValue(key: string | number, value: ValidBindings): void {
        this.connection.bindValue(key, value);
    }

    public async execute(params?: Params): Promise<void> {
        await this.connection.execute(params);
    }
}

export default PdoTransactionPreparedStatement;
