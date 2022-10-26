import { RowDataPacket } from 'mysql2';

import { isFunctionConstructor } from '../../utils';
import NpdoError from '../../pdo-error';
import { NpdoStatement } from '../../types';
import { Connection } from './types';
import NpdoConstants from '../../constants';

class MysqlStatement implements NpdoStatement {
    protected readonly connection: Connection;
    protected constructorArgs: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    protected fnToFetch: Function = class {};
    protected columnToFetch: number = 0;
    protected objectToFetch: object | null = null;
    protected fetchMode: number = NpdoConstants.FETCH_DEFAULT;
    protected readonly cursorOrientation: number | null = null;
    protected readonly cursorOffset: number = 0;

    constructor(
        connection: Connection,
        fetchMode?: number,
        columnOrFnOrObject?: number | Function | object,
        constructorArgs?: any[]
    ) {
        this.connection = connection;
        this.assignFetchParameters(fetchMode, columnOrFnOrObject, constructorArgs);
    }

    public columnCount(): number {
        return this.connection.fields.length;
    }

    public debug(): string {
        return `SQL: ${this.connection.sql}\nPARAMS:${JSON.stringify(this.connection.params, null, 2)}`;
    }

    public *fetch<T>(mode?: number, cursorOrientation?: number, cursorOffset?: number): Iterable<T> {
        this.fetchMode = mode == null ? this.fetchMode : mode;

        yield* this.connection.fetch<T>(this.adaptRowToFetch.bind(this));
    }

    public fetchAll<T>(mode?: number, columnOrFnOrObject?: number | Function | object, constructorArgs?: any[]): T[] {
        this.assignFetchParameters(mode, columnOrFnOrObject, constructorArgs);
        return this.connection.fetchAll<T>(this.adaptRowsToFetch.bind(this));
    }

    public *fetchColumn<T>(column: number): Iterable<T> {
        this.columnToFetch = column;
        yield* this.fetch<T>(NpdoConstants.FETCH_COLUMN);
    }

    public *fetchObject<T>(fnOrObject?: Function | object, constructorArgs?: any[]): Iterable<T> {
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        fnOrObject = fnOrObject != null ? fnOrObject : (class {} as Function);
        typeof fnOrObject === 'function' ? (this.fnToFetch = fnOrObject) : (this.objectToFetch = fnOrObject);
        this.constructorArgs = constructorArgs != null ? constructorArgs : [];
        yield* this.fetch(typeof fnOrObject === 'function' ? NpdoConstants.FETCH_CLASS : NpdoConstants.FETCH_OBJ);
    }

    public getColumnMeta(column: number): any {
        return column in this.connection.fields ? this.connection.fields[column] : null;
    }

    public rowCount(): number {
        return this.connection.rowCount();
    }

    public lastInsertId(): string | number | null {
        return this.connection.lastInsertId();
    }

    public setFetchMode(mode: number, columnOrFnOrObject?: number | object | Function, constructorArgs?: any[]): void {
        this.assignFetchParameters(mode, columnOrFnOrObject, constructorArgs);
    }

    protected assignFetchParameters(
        fetchMode?: number,
        columnOrFnOrObject?: number | Function | object,
        constructorArgs?: any[]
    ): void {
        let suggestedFetchMode: number = this.fetchMode;

        if (Array.isArray(constructorArgs)) {
            this.constructorArgs = constructorArgs;
            suggestedFetchMode = NpdoConstants.FETCH_CLASS;
        }

        if (columnOrFnOrObject != null) {
            if (typeof columnOrFnOrObject === 'number') {
                this.columnToFetch = columnOrFnOrObject;
                suggestedFetchMode = NpdoConstants.FETCH_COLUMN;
            } else if (typeof columnOrFnOrObject === 'function') {
                this.fnToFetch = columnOrFnOrObject;
                suggestedFetchMode = NpdoConstants.FETCH_CLASS;
            } else {
                this.objectToFetch = columnOrFnOrObject;
                suggestedFetchMode = NpdoConstants.FETCH_INTO;
            }
        }

        this.fetchMode = fetchMode != null ? fetchMode : suggestedFetchMode;
    }

    protected adaptRowsToFetch(rows: RowDataPacket[]): any[] {
        return rows.map(row => this.adaptRowToFetch(row));
    }

    protected adaptRowToFetch(row: RowDataPacket): any {
        if (this.fetchMode === NpdoConstants.FETCH_CLASS) {
            if (isFunctionConstructor(this.fnToFetch)) {
                return Object.assign(new (this.fnToFetch as FunctionConstructor)(...this.constructorArgs), row);
            } else {
                return this.fnToFetch(row);
            }
        }

        if (this.fetchMode === NpdoConstants.FETCH_COLUMN) {
            if (this.connection.fields.length - 1 < this.columnToFetch) {
                throw new NpdoError(`Column ${this.columnToFetch} does not exists.`);
            }
            const field = this.connection.fields[this.columnToFetch];

            return row[field.name];
        }

        if (this.fetchMode === NpdoConstants.FETCH_ARRAY) {
            return this.connection.fields.map(field => {
                return row[field.name];
            });
        }

        if (this.fetchMode === NpdoConstants.FETCH_INTO) {
            return Object.assign({}, this.objectToFetch, row);
        }

        return row;
    }
}

export = MysqlStatement;
