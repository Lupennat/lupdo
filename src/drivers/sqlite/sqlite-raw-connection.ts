import { Statement } from 'better-sqlite3';
import PdoAffectingData from '../../types/pdo-affecting-data';
import PdoColumnData from '../../types/pdo-column-data';
import { sqlitePoolConnection } from '../../types/pdo-pool';
import { Params, ValidBindings } from '../../types/pdo-prepared-statement';
import PdoRowData from '../../types/pdo-raw-data';
import PdoRawConnection from '../pdo-raw-connection';

class SqliteRawConnection extends PdoRawConnection {
    protected async doBeginTransaction(connection: sqlitePoolConnection): Promise<void> {
        await connection.prepare('BEGIN').run();
    }

    protected async doCommit(connection: sqlitePoolConnection): Promise<void> {
        await connection.prepare('COMMIT').run();
    }

    protected async doRollback(connection: sqlitePoolConnection): Promise<void> {
        await connection.prepare('ROLLBACK').run();
    }

    protected async getStatement(sql: string, connection: sqlitePoolConnection): Promise<Statement> {
        return connection.prepare(sql);
    }

    protected async executeStatement(
        statement: Statement,
        bindings: Params
    ): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
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

    protected async closeStatement(): Promise<void> {
        return void 0;
    }

    protected async doQuery(
        connection: sqlitePoolConnection,
        sql: string
    ): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
        const statement = await this.getStatement(sql, connection);
        return await this.executeStatement(statement, []);
    }

    protected adaptBindValue(value: ValidBindings): ValidBindings {
        if (value instanceof Date) {
            return value.valueOf();
        }

        if (typeof value === 'boolean') {
            return Number(value);
        }

        return value;
    }
}

export default SqliteRawConnection;
