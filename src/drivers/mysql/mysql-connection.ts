import {
    FieldPacket,
    OkPacket,
    Pool,
    PoolConnection,
    ResultSetHeader,
    RowDataPacket,
    PreparedStatementInfo
} from 'mysql2/promise';
import { convertObjectParamsToArrayParams, getSqlInfo } from '../../utils';
import NpdoError from '../../pdo-error';

import { NpdoPreparedStatement } from '../../types';
import { Connection } from './types';

class MysqlConnection implements Connection {
    protected connection: PoolConnection | null = null;
    protected inTransaction: boolean = false;
    protected statement: PreparedStatementInfo | null = null;
    protected cursor: number = 0;
    protected cursorLocked: boolean = false;
    protected direction = null;
    protected selectResults: RowDataPacket[][] | RowDataPacket[] = [];
    protected affectingResults: ResultSetHeader | null = null;
    protected namedParameters: NpdoPreparedStatement.ObjectParamsDescriptor[] = [];
    protected positionalParametersLength: number = 0;
    protected sqlOnlyPositional: string = '';

    public params: NpdoPreparedStatement.Params | null = null;
    public fields: FieldPacket[] = [];
    public sql: string = '';

    constructor(protected readonly pool: Pool) {}

    public async beginTransaction(): Promise<void> {
        await (await this.generateConnection()).beginTransaction();
        this.inTransaction = true;
    }

    public async commit(): Promise<void> {
        if (this.connection === null || !this.inTransaction) {
            throw new NpdoError(`Transaction must be opened before commit`);
        }
        await this.connection.commit();
        await this.close();
    }

    public async rollback(): Promise<void> {
        if (this.connection === null || !this.inTransaction) {
            throw new NpdoError(`Transaction must be opened before rollback`);
        }
        await this.connection.rollback();
        await this.close();
    }

    public async prepare(sql: string): Promise<void> {
        [this.positionalParametersLength, this.namedParameters, this.sqlOnlyPositional] = getSqlInfo(sql);

        if (this.positionalParametersLength > 0 && this.namedParameters.length > 0) {
            throw new NpdoError('Mixed named and positional parameters found on sql');
        }

        this.sql = sql;
        this.statement = await (await this.generateOrReuseConnection()).prepare(this.sqlOnlyPositional);
    }

    public bindValue(
        key: string | number,
        value: NpdoPreparedStatement.ValidBindings | NpdoPreparedStatement.ValidBindings[]
    ): void {
        if (typeof key === 'number') {
            if (this.positionalParametersLength === 0) {
                throw new NpdoError('Positional parameters not found on sql');
            }
            const index = key - 1 < 0 ? 0 : key - 1;
            if (index > this.positionalParametersLength) {
                throw new NpdoError(`Parameter at position ${key} not found on sql`);
            }
            if (this.params === null) {
                this.params = [];
            }
            (this.params as NpdoPreparedStatement.ArrayParams)[index] = value;
        } else {
            if (this.namedParameters.length === 0) {
                throw new NpdoError('Named parameters not found on sql');
            }

            let paramKey = '';
            for (const descriptor of this.namedParameters) {
                if (descriptor.aliases.includes(key)) {
                    paramKey = descriptor.name;
                }
            }

            if (paramKey === '') {
                throw new NpdoError(`Parameter with name ${key} not found on sql`);
            }

            if (this.params === null) {
                this.params = {};
            }

            (this.params as NpdoPreparedStatement.ObjectParams)[paramKey] = value;
        }
    }

    public async execute(params?: NpdoPreparedStatement.Params): Promise<void> {
        if (this.statement === null) {
            throw new NpdoError('Statement is closed, you need to prepare a new statment');
        }

        if (this.cursorLocked) {
            throw new NpdoError('Free cursor before new execute');
        }

        if (params != null) {
            if (Array.isArray(params)) {
                for (let x = 0; x < params.length; x++) {
                    this.bindValue(x + 1, params[x]);
                }
            } else {
                for (const key in params) {
                    this.bindValue(key, params[key]);
                }
            }
        }

        const bindings =
            this.positionalParametersLength > 0
                ? (this.params as NpdoPreparedStatement.ArrayParams)
                : this.namedParameters.length > 0
                ? convertObjectParamsToArrayParams(
                      this.namedParameters,
                      this.params as NpdoPreparedStatement.ObjectParams
                  )
                : [];

        this.assignMysqlResponse(...(await this.statement.execute(bindings)));

        this.cursorLocked = true;
    }

    public freeCursor(): void {
        this.direction = null;
        this.selectResults = [];
        this.affectingResults = null;
        this.cursor = 0;
        this.cursorLocked = false;
    }

    public async query(sql: string): Promise<void> {
        this.sql = sql;
        this.assignMysqlResponse(...(await (await this.generateOrReuseConnection()).query(this.sql)));

        if (!this.inTransaction) {
            await this.close();
        }
    }

    public *fetch<T>(adapter: Function): Iterable<T> {
        while (this.selectResults.length > this.cursor) {
            const cursor = this.cursor;
            this.cursor++;
            yield adapter(this.selectResults[cursor]);
        }
    }

    public fetchAll<T>(adapter: Function): T[] {
        const res = adapter(this.selectResults.slice(this.cursor));
        this.cursor = this.selectResults.length;
        return res;
    }

    public rowCount(): number {
        if (this.affectingResults === null) {
            return this.selectResults.length;
        }

        return this.affectingResults.affectedRows;
    }

    public lastInsertId(): string | number | null {
        if (this.affectingResults === null) {
            return null;
        }

        return this.affectingResults.insertId;
    }

    protected async generateOrReuseConnection(): Promise<PoolConnection> {
        if (this.connection === null) {
            return await this.generateConnection();
        }
        return this.connection;
    }

    protected async generateConnection(): Promise<PoolConnection> {
        this.connection = await this.pool.getConnection();
        return this.connection;
    }

    public async close(): Promise<void> {
        if (this.statement !== null) {
            await this.statement.close();
            this.statement = null;
        }

        if (this.connection !== null) {
            this.connection.release();
            this.connection = null;
        }
    }

    protected assignMysqlResponse(
        results: RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader,
        fields: FieldPacket[]
    ): void {
        this.selectResults = [];
        this.affectingResults = null;

        if (results.constructor.name === 'ResultSetHeader') {
            this.affectingResults = results as ResultSetHeader;
        } else {
            this.selectResults = results as RowDataPacket[][] | RowDataPacket[];
        }

        this.fields = fields;
    }
}

export = MysqlConnection;
