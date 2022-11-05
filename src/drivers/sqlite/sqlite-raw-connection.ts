import { NpdoAffectingData, NpdoColumnData, NpdoDriver, NpdoPreparedStatement, NpdoRowData } from '../../types';
import NpdoRawConnection from '../npdo-raw-connection';
import { Statement } from 'better-sqlite3';

class SqliteRawConnection extends NpdoRawConnection {
    protected async doBeginTransaction(connection: NpdoDriver.sqlitePoolConnection): Promise<void> {
        await connection.prepare('BEGIN').run();
    }

    protected async doCommit(connection: NpdoDriver.sqlitePoolConnection): Promise<void> {
        await connection.prepare('COMMIT').run();
    }

    protected async doRollback(connection: NpdoDriver.sqlitePoolConnection): Promise<void> {
        await connection.prepare('ROLLBACK').run();
    }

    protected async getStatement(connection: NpdoDriver.sqlitePoolConnection, sql: string): Promise<Statement> {
        return connection.prepare(sql);
    }

    protected async executeStatement(
        connection: NpdoDriver.sqlitePoolConnection,
        statement: Statement,
        bindings: NpdoPreparedStatement.Params
    ): Promise<[NpdoAffectingData, NpdoRowData[], NpdoColumnData[]]> {
        const info = await statement.run(bindings);
        return [
            statement.reader
                ? {}
                : {
                      lastInsertRowid: info.lastInsertRowid,
                      affectedRows: info.changes
                  },
            statement.reader ? statement.raw().all(bindings) : [],
            (statement.reader ? statement.columns() : []).map(field => {
                return {
                    name: field.name,
                    column: field.column,
                    table: field.table,
                    database: field.database,
                    type: field.type
                };
            })
        ];
    }

    protected async closeStatement(connection: NpdoDriver.sqlitePoolConnection, statement: Statement): Promise<void> {}

    protected async doQuery(
        connection: NpdoDriver.sqlitePoolConnection,
        sql: string
    ): Promise<[NpdoAffectingData, NpdoRowData[], NpdoColumnData[]]> {
        const statement = await this.getStatement(connection, sql);
        return await this.executeStatement(connection, statement, []);
    }

    protected adaptBindValue(value: NpdoPreparedStatement.ValidBindings): NpdoPreparedStatement.ValidBindings {
        if (value instanceof Date) {
            return value.valueOf();
        }

        if (typeof value === 'boolean') {
            return Number(value);
        }

        return value;
    }
}

export = SqliteRawConnection;
