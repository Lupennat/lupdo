import { convertObjectParamsToArrayParams } from '../utils';
import NpdoError from '../npdo-error';
import {
    NpdoAffectingData,
    NpdoColumnData,
    NpdoDriver,
    NpdoPreparedStatement,
    NpdoRawConnection as NpdoRawConnectionI,
    NpdoRowData
} from '../types';
import { Pool } from 'tarn';

abstract class NpdoRawConnection implements NpdoRawConnectionI {
    protected connection: NpdoDriver.PoolConnection | null = null;
    protected inTransaction: boolean = false;
    protected statement: any = null;
    protected cursor: number = 0;
    protected direction = null;
    protected selectResults: NpdoRowData[] = [];
    protected affectingResults: NpdoAffectingData = {};
    protected namedParameters: NpdoPreparedStatement.ObjectParamsDescriptor[] = [];
    protected positionalParametersLength: number = 0;
    protected sqlOnlyPositional: string = '';

    public params: NpdoPreparedStatement.Params | null = null;
    public columns: NpdoColumnData[] = [];
    public sql: string = '';

    constructor(protected readonly pool: Pool<NpdoDriver.PoolConnection>) {}

    protected abstract doBeginTransaction(connection: NpdoDriver.PoolConnection): Promise<void>;
    protected abstract doCommit(connection: NpdoDriver.PoolConnection): Promise<void>;
    protected abstract doRollback(connection: NpdoDriver.PoolConnection): Promise<void>;
    protected abstract getStatement(connection: NpdoDriver.PoolConnection, sql: string): Promise<any>;
    protected abstract executeStatement(
        connection: NpdoDriver.PoolConnection,
        statement: any,
        bindings: NpdoPreparedStatement.ArrayParams
    ): Promise<[NpdoAffectingData, NpdoRowData[], NpdoColumnData[]]>;
    protected abstract closeStatement(connection: NpdoDriver.PoolConnection, statement: any): Promise<void>;
    protected abstract doQuery(
        connection: NpdoDriver.PoolConnection,
        sql: string
    ): Promise<[NpdoAffectingData, NpdoRowData[], NpdoColumnData[]]>;

    protected abstract getSqlInfo(rawSql: string): [number, NpdoPreparedStatement.ObjectParamsDescriptor[], string];
    protected abstract adaptBindValue(value: NpdoPreparedStatement.ValidBindings): NpdoPreparedStatement.ValidBindings;

    public async beginTransaction(): Promise<void> {
        await this.doBeginTransaction(await this.generateConnection());
        this.inTransaction = true;
    }

    public async commit(): Promise<void> {
        if (this.connection === null || !this.inTransaction) {
            throw new NpdoError(`Transaction must be opened before commit`);
        }
        await this.doCommit(this.connection);
        await this.close();
    }

    public async rollback(): Promise<void> {
        if (this.connection === null || !this.inTransaction) {
            throw new NpdoError(`Transaction must be opened before rollback`);
        }
        await this.doRollback(this.connection);
        await this.close();
    }

    public async prepare(sql: string): Promise<void> {
        [this.positionalParametersLength, this.namedParameters, this.sqlOnlyPositional] = this.getSqlInfo(sql);

        if (this.positionalParametersLength > 0 && this.namedParameters.length > 0) {
            throw new NpdoError('Mixed named and positional parameters found on sql');
        }

        this.sql = sql;

        this.statement = await this.getStatement(await this.generateOrReuseConnection(), this.sqlOnlyPositional);
    }

    public bindValue(key: string | number, value: NpdoPreparedStatement.ValidBindings): void {
        value = this.adaptBindValue(value);
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
            this.statement = await this.getStatement(await this.generateOrReuseConnection(), this.sqlOnlyPositional);
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

        [this.affectingResults, this.selectResults, this.columns] = await this.executeStatement(
            await this.generateOrReuseConnection(),
            this.statement,
            bindings
        );

        if (!this.inTransaction) {
            await this.close();
        }

        this.resetCursor();
    }

    public async query(sql: string): Promise<void> {
        this.sql = sql;

        [this.affectingResults, this.selectResults, this.columns] = await this.doQuery(
            await this.generateOrReuseConnection(),
            sql
        );

        if (!this.inTransaction) {
            await this.close();
        }

        this.resetCursor();
    }

    public *fetch<T>(adapter: Function, cursorOrientation?: number, cursorOffset?: number): Iterable<T> {
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
        if (typeof this.affectingResults.affectedRows !== 'undefined') {
            return this.affectingResults.affectedRows;
        }
        return this.selectResults.length;
    }

    public lastInsertId(): string | number | bigint | null {
        if (typeof this.affectingResults.lastInsertRowid === 'undefined') {
            return null;
        }

        return this.affectingResults.lastInsertRowid;
    }

    protected resetCursor(): void {
        this.direction = null;
        this.cursor = 0;
    }

    protected async generateOrReuseConnection(): Promise<NpdoDriver.PoolConnection> {
        if (this.connection === null) {
            return await this.generateConnection();
        }
        return this.connection;
    }

    protected async generateConnection(): Promise<NpdoDriver.PoolConnection> {
        this.connection = await this.pool.acquire().promise;
        return this.connection;
    }

    protected async close(): Promise<void> {
        if (this.connection !== null) {
            if (this.statement !== null) {
                await this.closeStatement(this.connection, this.statement);
                this.statement = null;
            }

            this.pool.release(this.connection);
            this.connection = null;
        }
    }
}

export = NpdoRawConnection;
