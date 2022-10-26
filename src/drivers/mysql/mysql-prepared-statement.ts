import { NpdoPreparedStatement } from '../../types';
import MysqlStatement from './mysql-statement';

class MysqlPreparedStatement extends MysqlStatement implements NpdoPreparedStatement {
    public bindValue(
        key: string | number,
        value: NpdoPreparedStatement.ValidBindings | NpdoPreparedStatement.ValidBindings[]
    ): void {
        this.connection.bindValue(key, value);
    }

    public async execute(params?: NpdoPreparedStatement.Params): Promise<void> {
        await this.connection.execute(params);
    }

    public freeCursor(): void {
        this.connection.freeCursor();
    }

    public async close(): Promise<void> {
        return await this.connection.close();
    }
}

export = MysqlPreparedStatement;
