import { PdoError } from '../errors';
import PdoAffectingData from '../types/pdo-affecting-data';
import PdoAttributes from '../types/pdo-attributes';
import PdoColumnData from '../types/pdo-column-data';
import { PoolConnection, PoolI } from '../types/pdo-pool';
import { Params, ValidBindings, ValidBindingsSingle } from '../types/pdo-prepared-statement';
import PdoRawConnectionI from '../types/pdo-raw-connection';
import PdoRowData from '../types/pdo-raw-data';

abstract class PdoRawConnection implements PdoRawConnectionI {
    protected attributes: PdoAttributes = {};
    protected connection: PoolConnection | null = null;
    protected inTransaction = false;
    protected statements: Map<string, any> = new Map();

    constructor(protected readonly pool: PoolI<PoolConnection>) {}

    protected abstract doBeginTransaction(connection: PoolConnection): Promise<void>;
    protected abstract doCommit(connection: PoolConnection): Promise<void>;
    protected abstract doRollback(connection: PoolConnection): Promise<void>;

    protected abstract doQuery(
        connection: PoolConnection,
        sql: string
    ): Promise<[PdoAffectingData, PdoRowData[][] | PdoRowData[], PdoColumnData[][] | PdoColumnData[]]>;

    protected abstract doExec(connection: PoolConnection, sql: string): Promise<PdoAffectingData>;

    protected abstract getStatement(sql: string, connection: PoolConnection): Promise<any>;

    protected abstract executeStatement(
        statement: any,
        bindings: Params,
        connection: PoolConnection
    ): Promise<[string, PdoAffectingData, PdoRowData[][] | PdoRowData[], PdoColumnData[][] | PdoColumnData[]]>;
    protected abstract closeStatement(statement: any, connection: PoolConnection): Promise<void>;

    protected abstract adaptBindValue(value: ValidBindingsSingle): ValidBindingsSingle;

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

    public async prepare(sql: string): Promise<any> {
        try {
            return await this.generateStatement(sql);
        } catch (error: any) {
            if (!this.inTransaction) {
                await this.release();
            }
            throw new PdoError(error);
        }
    }

    public bindValue(value: ValidBindings): ValidBindings {
        if (Array.isArray(value)) {
            const values = [];
            for (const val of value) {
                values.push(this.adaptBindValue(val));
            }
            return values;
        }
        return this.adaptBindValue(value);
    }

    public async execute(
        sql: string,
        params: Params | null
    ): Promise<[string, PdoAffectingData, PdoRowData[][] | PdoRowData[], PdoColumnData[][] | PdoColumnData[]]> {
        try {
            const connection = await this.generateOrReuseConnection();

            const [sqlProcessed, affectingResults, selectResults, columns] = await this.executeStatement(
                this.statements.get(sql),
                params === null ? [] : params,
                connection
            );

            if (connection.__lupdo_killed) {
                throw new Error('Data are compromised');
            }

            return [sqlProcessed, affectingResults, selectResults, columns];
        } catch (error: any) {
            throw new PdoError(error);
        }
    }

    public async exec(sql: string): Promise<number> {
        try {
            const connection = await this.generateOrReuseConnection();
            const affecting = await this.doExec(connection, sql);

            if (connection.__lupdo_killed) {
                throw new Error('Data are compromised');
            }

            if (!this.inTransaction) {
                await this.release();
            }

            return affecting.affectedRows ?? 0;
        } catch (error: any) {
            throw new PdoError(error);
        } finally {
            if (!this.inTransaction) {
                await this.release();
            }
        }
    }

    public async query(
        sql: string
    ): Promise<[PdoAffectingData, PdoRowData[][] | PdoRowData[], PdoColumnData[][] | PdoColumnData[]]> {
        try {
            const connection = await this.generateOrReuseConnection();
            const [affectingResults, selectResults, columns] = await this.doQuery(connection, sql);

            if (connection.__lupdo_killed) {
                throw new Error('Data are compromised');
            }

            if (!this.inTransaction) {
                await this.release();
            }

            return [affectingResults, selectResults, columns];
        } catch (error: any) {
            throw new PdoError(error);
        } finally {
            if (!this.inTransaction) {
                await this.release();
            }
        }
    }

    public async lastInsertId({
        affectingResults
    }: {
        affectingResults: PdoAffectingData;
    }): Promise<string | number | bigint | null> {
        if (typeof affectingResults.lastInsertRowid === 'undefined') {
            return null;
        }

        return affectingResults.lastInsertRowid;
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

            this.statements.clear();
            this.pool.release(this.connection);
            this.connection = null;
        }
    }

    protected async generateStatement(sql: string): Promise<[string, any]> {
        if (!this.statements.has(sql)) {
            this.statements.set(sql, await this.getStatement(sql, await this.generateOrReuseConnection()));
        }
        return this.statements.get(sql);
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
