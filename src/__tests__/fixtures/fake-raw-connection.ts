import { PdoRawConnection } from '../../support';
import TypedBinding from '../../typed-binding';
import PdoAffectingData from '../../types/pdo-affecting-data';
import PdoColumnData from '../../types/pdo-column-data';
import { ValidBindingsSingle } from '../../types/pdo-prepared-statement';
import PdoRowData from '../../types/pdo-raw-data';
import FakeDBConnection, { FakeDBStatement } from './fake-db-connection';

class FakeRawConnection extends PdoRawConnection {
    public async lastInsertId(
        { affectingResults }: { affectingResults: PdoAffectingData },
        name?: string
    ): Promise<string | number | bigint | null> {
        if (name != null) {
            return name;
        }
        return super.lastInsertId({ affectingResults });
    }

    protected async doBeginTransaction(connection: FakeDBConnection): Promise<void> {
        await connection.beginTransaction();
    }

    protected async doCommit(connection: FakeDBConnection): Promise<void> {
        await connection.commit();
    }

    protected async doRollback(connection: FakeDBConnection): Promise<void> {
        await connection.rollback();
    }

    protected async getStatement(sql: string, connection: FakeDBConnection): Promise<FakeDBStatement> {
        return await connection.prepare(sql);
    }

    protected async executeStatement(
        statement: FakeDBStatement,
        bindings: string[] | { [key: string]: string }
    ): Promise<[string, PdoAffectingData, PdoRowData[][] | PdoRowData[], PdoColumnData[][] | PdoColumnData[]]> {
        return [statement.query, ...(await statement.execute(bindings))];
    }

    protected async closeStatement(statement: FakeDBStatement, connection: FakeDBConnection): Promise<void> {
        connection.unprepare(statement.query);
    }

    protected async doExec(connection: FakeDBConnection, sql: string): Promise<PdoAffectingData> {
        return (await connection.query(sql))[0];
    }

    protected async doQuery(
        connection: FakeDBConnection,
        sql: string
    ): Promise<[PdoAffectingData, PdoRowData[][] | PdoRowData[], PdoColumnData[][] | PdoColumnData[]]> {
        return await connection.query(sql);
    }

    protected adaptBindValue(value: ValidBindingsSingle): string {
        if (value === null) {
            return 'null';
        }

        if (value instanceof TypedBinding) {
            let val = value.value;
            if (value.options != null) {
                val = val == null ? '' : val.toString();
                if ('scale' in value.options) {
                    val = parseFloat(val).toFixed(value.options.scale);
                }
                if ('precision' in value.options) {
                    const isDecimal = val.includes('.');
                    const valLength = isDecimal ? val.length - 1 : val.length;

                    if (valLength < value.options.precision) {
                        val = (isDecimal ? val : val + '.').padEnd(value.options.precision + 1, '0');
                    }

                    if (valLength > value.options.precision) {
                        val = val.slice(0, value.options.precision + (isDecimal ? 1 : 0));
                    }
                    val = val.endsWith('.') ? val.slice(0, val.length - 1) : val;
                }
            }

            return this.adaptBindValue(val);
        }

        if (typeof value === 'boolean') {
            return value ? '1' : '0';
        }

        if (typeof value === 'number' || typeof value === 'bigint') {
            return value.toString();
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (Buffer.isBuffer(value)) {
            return value.toString();
        }

        return value;
    }
}

export default FakeRawConnection;
