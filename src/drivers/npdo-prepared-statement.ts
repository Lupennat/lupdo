import { NpdoPreparedStatement as NpdoPreparedStatementI } from '../types';
import NpdoStatement from './npdo-statement';

class NpdoPreparedStatement extends NpdoStatement implements NpdoPreparedStatementI {
    public bindValue(key: string | number, value: NpdoPreparedStatementI.ValidBindings): void {
        this.connection.bindValue(key, value);
    }

    public async execute(params?: NpdoPreparedStatementI.Params): Promise<void> {
        await this.connection.execute(params);
    }
}

export = NpdoPreparedStatement;
