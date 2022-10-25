import { Pdo } from '../../../@types/index';
import MysqlStatement from './mysql-statement';

class MysqlPreparedStatement extends MysqlStatement implements Pdo.PreparedStatement {
    public bindValue(
        key: string | number,
        value: Pdo.PreparedStatement.ValidBindings | Pdo.PreparedStatement.ValidBindings[]
    ): void {
        this.connection.bindValue(key, value);
    }

    public async execute(params?: Pdo.PreparedStatement.Params): Promise<void> {
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
