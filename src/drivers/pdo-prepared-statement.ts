import PdoPreparedStatementI, { Params, ValidBindings } from '../types/pdo-prepared-statement';
import PdoStatement from './pdo-statement';

class PdoPreparedStatement extends PdoStatement implements PdoPreparedStatementI {
    public bindValue(key: string | number, value: ValidBindings): void {
        this.connection.bindValue(key, value);
    }

    public async execute(params?: Params): Promise<void> {
        await this.connection.execute(params);
    }
}

export default PdoPreparedStatement;
