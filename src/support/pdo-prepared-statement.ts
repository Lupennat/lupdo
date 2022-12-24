import PdoPreparedStatementI from '../types/pdo-prepared-statement';
import PdoTransactionPreparedStatement from './pdo-transaction-prepared-statement';

class PdoPreparedStatement extends PdoTransactionPreparedStatement implements PdoPreparedStatementI {
    public async close(): Promise<void> {
        await this.connection.close();
    }
}

export default PdoPreparedStatement;
