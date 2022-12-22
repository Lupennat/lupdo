import { FETCH_BACKWARD } from '../constants';
import { PdoError } from '../errors';
import PdoAffectingData from '../types/pdo-affecting-data';
import PdoColumnData from '../types/pdo-column-data';
import { PoolConnection, PoolI } from '../types/pdo-pool';
import {
    ArrayParams,
    ObjectParams,
    ObjectParamsDescriptor,
    Params,
    ValidBindings
} from '../types/pdo-prepared-statement';
import PdoRawConnectionI from '../types/pdo-raw-connection';
import PdoRowData from '../types/pdo-raw-data';

abstract class PdoRawConnection implements PdoRawConnectionI {
    protected connection: PoolConnection | null = null;
    protected inTransaction = false;
    protected statement: any = null;
    protected cursor = -1;

    protected selectResults: PdoRowData[] = [];
    protected affectingResults: PdoAffectingData = {};
    protected namedParameters: ObjectParamsDescriptor[] = [];
    protected positionalParametersLength = 0;

    public params: Params | null = null;
    public columns: PdoColumnData[] = [];
    public sql = '';

    constructor(protected readonly pool: PoolI<PoolConnection>) {}

    protected abstract doBeginTransaction(connection: PoolConnection): Promise<void>;
    protected abstract doCommit(connection: PoolConnection): Promise<void>;
    protected abstract doRollback(connection: PoolConnection): Promise<void>;
    protected abstract getStatement(sql: string, connection: PoolConnection): Promise<any>;
    protected abstract executeStatement(
        statement: any,
        bindings: Params,
        connection: PoolConnection
    ): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]>;
    protected abstract closeStatement(statement: any, connection: PoolConnection): Promise<void>;

    protected abstract doQuery(
        connection: PoolConnection,
        sql: string
    ): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]>;

    protected abstract adaptBindValue(value: ValidBindings): ValidBindings;

    public async beginTransaction(): Promise<void> {
        try {
            await this.doBeginTransaction(await this.generateConnection());
        } catch (error: any) {
            throw new PdoError(error);
        }
        this.inTransaction = true;
    }

    public async commit(): Promise<void> {
        try {
            await this.doCommit(this.connection as PoolConnection);
        } catch (error: any) {
            throw new PdoError(error);
        }

        await this.close();
    }

    public async rollback(): Promise<void> {
        try {
            await this.doRollback(this.connection as PoolConnection);
        } catch (error: any) {
            throw new PdoError(error);
        }

        await this.close();
    }

    public async prepare(sql: string): Promise<void> {
        this.sql = sql;

        try {
            this.statement = await this.getStatement(this.sql, await this.generateOrReuseConnection());
        } catch (error: any) {
            throw new PdoError(error);
        }
    }

    public bindValue(key: string | number, value: ValidBindings): void {
        value = this.adaptBindValue(value);
        if (typeof key === 'number') {
            const index = key - 1 < 0 ? 0 : key - 1;
            if (this.params === null) {
                this.params = [];
            }
            (this.params as ArrayParams)[index] = value;
        } else {
            if (this.params === null) {
                this.params = {};
            }

            (this.params as ObjectParams)[key] = value;
        }
    }

    public async execute(params?: Params): Promise<void> {
        if (this.statement === null) {
            this.statement = await this.getStatement(this.sql, await this.generateOrReuseConnection());
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
            const connection = await this.generateOrReuseConnection();

            [this.affectingResults, this.selectResults, this.columns] = await this.executeStatement(
                this.statement,
                this.params === null ? [] : this.params,
                connection
            );

            if (connection.__lupdo_killed) {
                throw new Error('Query execution was interrupted');
            }

            if (!this.inTransaction) {
                await this.close();
            }

            this.resetCursor();
        } catch (error: any) {
            throw new PdoError(error);
        }
    }

    public async query(sql: string): Promise<void> {
        this.sql = sql;

        try {
            const connection = await this.generateOrReuseConnection();
            [this.affectingResults, this.selectResults, this.columns] = await this.doQuery(connection, sql);

            if (connection.__lupdo_killed) {
                throw new Error('Query execution was interrupted');
            }

            if (!this.inTransaction) {
                await this.close();
            }

            this.resetCursor();
        } catch (error: any) {
            throw new PdoError(error);
        }
    }

    public fetch(cursorOrientation: number): PdoRowData | null {
        const cursor = this.getTempCursorForFetch(cursorOrientation);

        if (!this.isValidCursor(cursor, cursorOrientation)) {
            cursorOrientation === FETCH_BACKWARD ? this.setCursorToStart() : this.setCursorToEnd();
            return null;
        }

        this.setCursor(cursor);

        return this.selectResults[cursor];
    }

    public fetchAll(cursorOrientation: number): PdoRowData[] {
        const cursor = this.getTempCursorForFetch(cursorOrientation);
        if (cursorOrientation === FETCH_BACKWARD) {
            this.setCursorToStart();
            return this.selectResults.slice(0, cursor + 1).reverse();
        }

        this.setCursorToEnd();
        return this.selectResults.slice(cursor);
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

    public resetCursor(): void {
        this.setCursor(-1);
    }

    protected setCursor(cursor: number): void {
        this.cursor = cursor;
    }

    protected setCursorToEnd(): void {
        this.setCursor(this.selectResults.length);
    }

    protected setCursorToStart(): void {
        this.setCursor(-1);
    }

    protected getTempCursorForFetch(cursorOrientation: number): number {
        let cursor = this.cursor;
        if (cursorOrientation === FETCH_BACKWARD && cursor === -1) {
            cursor = this.selectResults.length;
        }

        return cursorOrientation === FETCH_BACKWARD ? cursor - 1 : cursor + 1;
    }

    protected isValidCursor(cursor: number, cursorOrientation: number): boolean {
        return cursorOrientation === FETCH_BACKWARD ? cursor > -1 : cursor < this.selectResults.length;
    }

    protected async generateOrReuseConnection(): Promise<PoolConnection> {
        if (this.connection === null) {
            return await this.generateConnection();
        }
        return this.connection;
    }

    protected async generateConnection(): Promise<PoolConnection> {
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

export default PdoRawConnection;
