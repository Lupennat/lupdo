import { ATTR_FETCH_DIRECTION, FETCH_BACKWARD } from '../constants';
import { PdoError } from '../errors';
import PdoAffectingData from '../types/pdo-affecting-data';
import PdoAttributes from '../types/pdo-attributes';
import PdoColumnData from '../types/pdo-column-data';
import { PoolConnection, PoolI } from '../types/pdo-pool';
import { ArrayParams, ObjectParams, Params, ValidBindings } from '../types/pdo-prepared-statement';
import PdoRawConnectionI from '../types/pdo-raw-connection';
import PdoRowData from '../types/pdo-raw-data';

abstract class PdoRawConnection implements PdoRawConnectionI {
    protected attributes: PdoAttributes = {};
    protected connection: PoolConnection | null = null;
    protected inTransaction = false;
    protected statement: any = null;
    protected statements: Map<string, any> = new Map();
    protected cursor: number | null = null;

    protected selectResults: PdoRowData[] = [];
    protected affectingResults: PdoAffectingData = {};

    public params: Params | null = null;
    public columns: PdoColumnData[] = [];
    public sql = '';

    constructor(protected readonly pool: PoolI<PoolConnection>) {}

    protected abstract doBeginTransaction(connection: PoolConnection): Promise<void>;
    protected abstract doCommit(connection: PoolConnection): Promise<void>;
    protected abstract doRollback(connection: PoolConnection): Promise<void>;

    protected abstract doQuery(
        connection: PoolConnection,
        sql: string
    ): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]>;

    protected abstract doExec(connection: PoolConnection, sql: string): Promise<PdoAffectingData>;

    protected abstract getStatement(sql: string, connection: PoolConnection): Promise<any>;
    protected abstract executeStatement(
        statement: any,
        bindings: Params,
        connection: PoolConnection
    ): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]>;
    protected abstract closeStatement(statement: any, connection: PoolConnection): Promise<void>;

    protected abstract adaptBindValue(value: ValidBindings): ValidBindings;

    public async beginTransaction(): Promise<void> {
        try {
            await this.doBeginTransaction(await this.generateConnection());
            this.inTransaction = true;
        } catch (error: any) {
            await this.release();
            throw new PdoError(error);
        }
    }

    public async commit(): Promise<void> {
        try {
            await this.doCommit(this.connection as PoolConnection);
        } catch (error: any) {
            throw new PdoError(error);
        } finally {
            await this.release();
        }
    }

    public async rollback(): Promise<void> {
        try {
            await this.doRollback(this.connection as PoolConnection);
        } catch (error: any) {
            throw new PdoError(error);
        } finally {
            await this.release();
        }
    }

    public async prepare(sql: string): Promise<void> {
        this.sql = sql;

        try {
            await this.generateStatement();
        } catch (error: any) {
            if (!this.inTransaction) {
                await this.release();
            }
            throw new PdoError(error);
        }
    }

    public bindValue(key: string | number, value: ValidBindings): void {
        value = this.adaptBindValue(value);
        if (typeof key === 'number') {
            if (key - 1 < 0) {
                throw new PdoError('Bind position must be greater than 0.');
            }
            const index = key - 1;
            if (this.params === null) {
                this.params = [];
            }

            if (!Array.isArray(this.params)) {
                throw new PdoError('Mixed Params Numeric and Keyed are forbidden.');
            }

            (this.params as ArrayParams)[index] = value;
        } else {
            if (this.params === null) {
                this.params = {};
            }

            if (Array.isArray(this.params)) {
                throw new PdoError('Mixed Params Numeric and Keyed are forbidden.');
            }

            (this.params as ObjectParams)[key] = value;
        }
    }

    public async execute(params?: Params): Promise<void> {
        try {
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
            const connection = await this.generateOrReuseConnection();

            [this.affectingResults, this.selectResults, this.columns] = await this.executeStatement(
                this.statement,
                this.params === null ? [] : this.params,
                connection
            );

            if (connection.__lupdo_killed) {
                throw new Error('Data are compromised');
            }

            this.resetCursor();
        } catch (error: any) {
            throw new PdoError(error);
        }
    }

    public async exec(sql: string): Promise<number> {
        this.sql = sql;

        try {
            const connection = await this.generateOrReuseConnection();
            const affecting = await this.doExec(connection, sql);

            if (connection.__lupdo_killed) {
                throw new Error('Data are compromised');
            }

            if (!this.inTransaction) {
                await this.release();
            }

            this.resetCursor();

            return affecting.affectedRows ?? 0;
        } catch (error: any) {
            throw new PdoError(error);
        } finally {
            if (!this.inTransaction) {
                await this.release();
            }
        }
    }

    public async query(sql: string): Promise<void> {
        this.sql = sql;

        try {
            const connection = await this.generateOrReuseConnection();
            [this.affectingResults, this.selectResults, this.columns] = await this.doQuery(connection, sql);

            if (connection.__lupdo_killed) {
                throw new Error('Data are compromised');
            }

            if (!this.inTransaction) {
                await this.release();
            }

            this.resetCursor();
        } catch (error: any) {
            throw new PdoError(error);
        } finally {
            if (!this.inTransaction) {
                await this.release();
            }
        }
    }

    public fetch(): PdoRowData | null {
        const cursorOrientation = this.getAttribute(ATTR_FETCH_DIRECTION) as number;
        const cursor = this.getTempCursorForFetch(cursorOrientation);

        if (!this.isValidCursor(cursor, cursorOrientation)) {
            cursorOrientation === FETCH_BACKWARD ? this.setCursorToStart() : this.setCursorToEnd();
            return null;
        }

        this.setCursor(cursor);

        return this.selectResults[cursor];
    }

    public fetchAll(): PdoRowData[] {
        const cursorOrientation = this.getAttribute(ATTR_FETCH_DIRECTION) as number;
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

    public async lastInsertId(): Promise<string | number | bigint | null> {
        if (typeof this.affectingResults.lastInsertRowid === 'undefined') {
            return null;
        }

        return this.affectingResults.lastInsertRowid;
    }

    public resetCursor(): void {
        this.setCursor(null);
    }

    public async close(): Promise<void> {
        await this.release();
    }

    public getAttribute(attribute: string): string | number {
        return this.attributes[attribute];
    }

    public setAttribute(attribute: string, value: number | string): boolean {
        if (attribute in this.attributes) {
            this.attributes[attribute] = value;
            return true;
        }
        return false;
    }

    public setAttributes(attributes: PdoAttributes): void {
        this.attributes = { ...attributes };
    }

    protected async release(): Promise<void> {
        if (this.connection !== null) {
            for (const statement of this.statements.values()) {
                await this.closeStatement(statement, this.connection);
            }
            this.statement = null;
            this.statements.clear();
            this.pool.release(this.connection);
            this.connection = null;
        }
    }

    protected async generateStatement(): Promise<void> {
        if (!this.statements.has(this.sql)) {
            this.statements.set(this.sql, await this.getStatement(this.sql, await this.generateOrReuseConnection()));
        }
        this.statement = this.statements.get(this.sql);
    }

    protected setCursor(cursor: number | null): void {
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
        if (cursor === null) {
            cursor = cursorOrientation === FETCH_BACKWARD ? this.selectResults.length : -1;
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
}

export default PdoRawConnection;
