import NpdoError from '../npdo-error';
import {
    FetchType,
    AllFetchType,
    NpdoAffectingData,
    NpdoColumnData,
    NpdoDriver,
    NpdoPreparedStatement,
    NpdoRawConnection as NpdoRawConnectionI,
    NpdoRowData,
    SingleFetchType,
    NpdoPool
} from '../types';

import NpdoConstants from '../constants';

abstract class NpdoRawConnection implements NpdoRawConnectionI {
    protected connection: NpdoDriver.PoolConnection | null = null;
    protected inTransaction: boolean = false;
    protected statement: any = null;
    protected cursor: number = -1;

    protected selectResults: NpdoRowData[] = [];
    protected affectingResults: NpdoAffectingData = {};
    protected namedParameters: NpdoPreparedStatement.ObjectParamsDescriptor[] = [];
    protected positionalParametersLength: number = 0;

    public params: NpdoPreparedStatement.Params | null = null;
    public columns: NpdoColumnData[] = [];
    public sql: string = '';

    constructor(protected readonly pool: NpdoPool<NpdoDriver.PoolConnection>) {}

    protected abstract doBeginTransaction(connection: NpdoDriver.PoolConnection): Promise<void>;
    protected abstract doCommit(connection: NpdoDriver.PoolConnection): Promise<void>;
    protected abstract doRollback(connection: NpdoDriver.PoolConnection): Promise<void>;
    protected abstract getStatement(connection: NpdoDriver.PoolConnection, sql: string): Promise<any>;
    protected abstract executeStatement(
        connection: NpdoDriver.PoolConnection,
        statement: any,
        bindings: NpdoPreparedStatement.Params
    ): Promise<[NpdoAffectingData, NpdoRowData[], NpdoColumnData[]]>;
    protected abstract closeStatement(connection: NpdoDriver.PoolConnection, statement: any): Promise<void>;
    protected abstract doQuery(
        connection: NpdoDriver.PoolConnection,
        sql: string
    ): Promise<[NpdoAffectingData, NpdoRowData[], NpdoColumnData[]]>;

    protected abstract adaptBindValue(value: NpdoPreparedStatement.ValidBindings): NpdoPreparedStatement.ValidBindings;

    public log(message: string, logLevel: string): void {
        this.pool.writeLog(message, logLevel);
    }

    public async beginTransaction(): Promise<void> {
        try {
            await this.doBeginTransaction(await this.generateConnection());
        } catch (error: any) {
            throw new NpdoError(error);
        }
        this.inTransaction = true;
    }

    public async commit(): Promise<void> {
        if (this.connection === null || !this.inTransaction) {
            throw new NpdoError(`Transaction must be opened before commit`);
        }

        try {
            await this.doCommit(this.connection);
        } catch (error: any) {
            throw new NpdoError(error);
        }

        await this.close();
    }

    public async rollback(): Promise<void> {
        if (this.connection === null || !this.inTransaction) {
            throw new NpdoError(`Transaction must be opened before rollback`);
        }

        try {
            await this.doRollback(this.connection);
        } catch (error: any) {
            throw new NpdoError(error);
        }

        await this.close();
    }

    public async prepare(sql: string): Promise<void> {
        this.sql = sql;

        try {
            this.statement = await this.getStatement(await this.generateOrReuseConnection(), this.sql);
        } catch (error: any) {
            throw new NpdoError(error);
        }
    }

    public bindValue(key: string | number, value: NpdoPreparedStatement.ValidBindings): void {
        value = this.adaptBindValue(value);
        if (typeof key === 'number') {
            const index = key - 1 < 0 ? 0 : key - 1;
            if (this.params === null) {
                this.params = [];
            }
            (this.params as NpdoPreparedStatement.ArrayParams)[index] = value;
        } else {
            if (this.params === null) {
                this.params = {};
            }

            (this.params as NpdoPreparedStatement.ObjectParams)[key] = value;
        }
    }

    public async execute(params?: NpdoPreparedStatement.Params): Promise<void> {
        if (this.statement === null) {
            this.statement = await this.getStatement(await this.generateOrReuseConnection(), this.sql);
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

        try {
            [this.affectingResults, this.selectResults, this.columns] = await this.executeStatement(
                await this.generateOrReuseConnection(),
                this.statement,
                this.params === null ? [] : this.params
            );

            if (!this.inTransaction) {
                await this.close();
            }

            this.resetCursor();
        } catch (error: any) {
            throw new NpdoError(error);
        }
    }

    public async query(sql: string): Promise<void> {
        this.sql = sql;

        try {
            [this.affectingResults, this.selectResults, this.columns] = await this.doQuery(
                await this.generateOrReuseConnection(),
                sql
            );

            if (!this.inTransaction) {
                await this.close();
            }

            this.resetCursor();
        } catch (error: any) {
            throw new NpdoError(error);
        }
    }

    public fetch<T extends FetchType>(adapter: Function, cursorOrientation: number): SingleFetchType<T> | null {
        const cursor = this.getTempCursorForFetch(cursorOrientation);

        if (!this.isValidCursor(cursor, cursorOrientation)) {
            return null;
        }
        this.setCursor(cursor);

        return adapter(this.selectResults[cursor]);
    }

    public fetchAll<T extends FetchType>(adapter: Function): AllFetchType<T> {
        const cursor = this.getTempCursorForFetch();
        this.setCursorToEnd();

        return adapter(this.selectResults.slice(cursor));
    }

    public rowCount(): number {
        if (typeof this.affectingResults.affectedRows !== 'undefined') {
            return this.affectingResults.affectedRows;
        }
        return 0;
    }

    public lastInsertId(): string | number | bigint | null {
        if (typeof this.affectingResults.lastInsertRowid === 'undefined') {
            return null;
        }

        return this.affectingResults.lastInsertRowid;
    }

    protected resetCursor(): void {
        this.setCursor(-1);
    }

    protected setCursor(cursor: number): void {
        this.cursor = cursor;
    }

    protected setCursorToEnd(): void {
        this.setCursor(this.selectResults.length);
    }

    protected getTempCursorForFetch(cursorOrientation: number = NpdoConstants.FETCH_ORI_NEXT): number {
        if (
            (cursorOrientation & NpdoConstants.FETCH_ORI_FIRST) !== 0 ||
            (cursorOrientation & NpdoConstants.FETCH_ORI_LAST) !== 0
        ) {
            return (cursorOrientation & NpdoConstants.FETCH_ORI_FIRST) !== 0 ? 0 : this.selectResults.length - 1;
        }

        const cursor = this.cursor;

        return (cursorOrientation & NpdoConstants.FETCH_ORI_PRIOR) !== 0 ? cursor - 1 : cursor + 1;
    }

    protected isValidCursor(cursor: number, cursorOrientation: number = NpdoConstants.FETCH_ORI_NEXT): boolean {
        return (cursorOrientation & NpdoConstants.FETCH_ORI_PRIOR) !== 0
            ? cursor > -1
            : cursor < this.selectResults.length;
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
