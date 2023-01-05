import { PdoRawConnection } from '../../support';
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
    ): Promise<[string, PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
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
    ): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
        return await connection.query(sql);
    }

    protected adaptBindValue(value: ValidBindingsSingle): string {
        if (value === null) {
            return 'null';
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
