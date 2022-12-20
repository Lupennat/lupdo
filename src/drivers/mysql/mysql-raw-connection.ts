import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import PdoAffectingData from '../../types/pdo-affecting-data';
import PdoColumnData from '../../types/pdo-column-data';
import { mysqlPoolConnection } from '../../types/pdo-pool';
import { ArrayParams, ValidBindings } from '../../types/pdo-prepared-statement';
import PdoRowData from '../../types/pdo-raw-data';
import PdoRawConnection from '../pdo-raw-connection';

class MysqlRawConnection extends PdoRawConnection {
    protected async doBeginTransaction(connection: mysqlPoolConnection): Promise<void> {
        await connection.beginTransaction();
    }

    protected async doCommit(connection: mysqlPoolConnection): Promise<void> {
        await connection.commit();
    }

    protected async doRollback(connection: mysqlPoolConnection): Promise<void> {
        await connection.rollback();
    }

    protected async getStatement(sql: string): Promise<string> {
        return sql;
    }

    protected async executeStatement(
        statement: string,
        bindings: ArrayParams,
        connection: mysqlPoolConnection
    ): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
        return await this.doQuery(connection, statement, bindings);
    }

    protected async closeStatement(): Promise<void> {
        return void 0;
    }

    protected async doQuery(
        connection: mysqlPoolConnection,
        sql: string,
        bindings?: ArrayParams
    ): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
        const [info, fields] = await connection.query(sql, bindings);
        return [
            info.constructor.name === 'ResultSetHeader'
                ? {
                      lastInsertRowid: (info as ResultSetHeader).insertId,
                      affectedRows: (info as ResultSetHeader).affectedRows
                  }
                : {},
            info.constructor.name === 'ResultSetHeader' ? [] : (info as RowDataPacket[]).map(row => Object.values(row)),
            Array.isArray(fields)
                ? (fields as any[]).map(field => {
                      return {
                          catalog: field.catalog,
                          schema: field.schema,
                          name: field.name,
                          orgName: field.orgName,
                          table: field.table,
                          orgTable: field.orgTable,
                          characterSet: field.characterSet,
                          columnLength: field.columnLength,
                          columnType: field.columnType,
                          type: field.columnType,
                          flags: field.flags,
                          decimals: field.decimals
                      };
                  })
                : []
        ];
    }

    protected adaptBindValue(value: ValidBindings): ValidBindings {
        return value;
    }
}

export default MysqlRawConnection;
