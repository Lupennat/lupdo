import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { NpdoAffectingData, NpdoColumnData, NpdoDriver, NpdoPreparedStatement, NpdoRowData } from '../../types';
import { getSqlInfo } from '../../utils';
import NpdoRawConnection from '../npdo-raw-connection';

class MysqlRawConnection extends NpdoRawConnection {
    protected async doBeginTransaction(connection: NpdoDriver.mysqlPoolConnection): Promise<void> {
        await connection.beginTransaction();
    }

    protected async doCommit(connection: NpdoDriver.mysqlPoolConnection): Promise<void> {
        await connection.commit();
    }

    protected async doRollback(connection: NpdoDriver.mysqlPoolConnection): Promise<void> {
        await connection.rollback();
    }

    protected async getStatement(connection: NpdoDriver.mysqlPoolConnection, sql: string): Promise<string> {
        return sql;
    }

    protected async executeStatement(
        connection: NpdoDriver.mysqlPoolConnection,
        statement: string,
        bindings: NpdoPreparedStatement.ArrayParams
    ): Promise<[NpdoAffectingData, NpdoRowData[], NpdoColumnData[]]> {
        return await this.doQuery(connection, statement, bindings);
    }

    protected async closeStatement(connection: NpdoDriver.mysqlPoolConnection, statement: string): Promise<void> {}

    protected async doQuery(
        connection: NpdoDriver.mysqlPoolConnection,
        sql: string,
        bindings?: NpdoPreparedStatement.ArrayParams
    ): Promise<[NpdoAffectingData, NpdoRowData[], NpdoColumnData[]]> {
        const [info, fields] = await connection.query(sql, bindings);

        return [
            info.constructor.name === 'ResultSetHeader'
                ? {
                      lastInsertRowid: (info as ResultSetHeader).insertId,
                      affectedRows: (info as ResultSetHeader).affectedRows
                  }
                : {},
            info.constructor.name === 'ResultSetHeader' ? [] : (info as RowDataPacket[]),
            Array.isArray(fields)
                ? fields.map(field => {
                      return { name: field.name };
                  })
                : []
        ];
    }

    protected getSqlInfo(rawSql: string): [number, NpdoPreparedStatement.ObjectParamsDescriptor[], string] {
        return getSqlInfo(rawSql);
    }

    protected adaptBindValue(value: NpdoPreparedStatement.ValidBindings): NpdoPreparedStatement.ValidBindings {
        return value;
    }
}

export = MysqlRawConnection;
