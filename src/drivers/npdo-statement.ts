import NpdoConstants from '../constants';
import {
    FetchType,
    AllFetchType,
    ColumnFetch,
    FetchFunctionClosure,
    NpdoRowData,
    NpdoStatement as NpdoStatementI,
    SingleFetchType,
    NpdoColumnData
} from '../types';
import NpdoFetchMode from './npdo-fetch-mode';

class NpdoStatement extends NpdoFetchMode implements NpdoStatementI {
    public columnCount(): number {
        return this.connection.columns.length;
    }

    public debug(): string {
        return `SQL: ${this.connection.sql}\nPARAMS:${JSON.stringify(this.connection.params, null, 2)}`;
    }

    public fetch<T extends FetchType>(mode?: number, cursorOrientation?: number): SingleFetchType<T> | null {
        return this.doFetch<T>(this.getFetchParameters(mode), cursorOrientation);
    }

    public fetchAll<T extends FetchType>(
        mode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ): AllFetchType<T> {
        return this.connection.fetchAll<T>((rows: NpdoRowData[]): AllFetchType<T> => {
            return this.adaptRowsToFetch<T>(
                this.getFetchParameters(mode, numberOrClassOrFnOrObject, constructorArgs),
                rows
            );
        });
    }

    public fetchColumn(column: number): ColumnFetch | null {
        return this.doFetch<ColumnFetch>(this.getFetchParameters(NpdoConstants.FETCH_COLUMN, column));
    }

    public fetchObject<T>(classOrObject: Function, constructorArgs?: any[]): T | null {
        return this.doFetch(this.getFetchParameters(NpdoConstants.FETCH_CLASS, classOrObject, constructorArgs)) as T;
    }

    public getColumnMeta(column: number): NpdoColumnData | null {
        return this.connection.columns.length > column ? this.connection.columns[column] : null;
    }

    public rowCount(): number {
        return this.connection.rowCount();
    }

    public lastInsertId(): string | bigint | number | null {
        return this.connection.lastInsertId();
    }

    public setFetchMode(
        mode: number,
        numberOrClassOrFnOrObject?: number | object | Function,
        constructorArgs?: any[]
    ): void {
        this.assignFetchParameters(mode, numberOrClassOrFnOrObject, constructorArgs);
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

    protected doFetch<T extends FetchType>(
        fetchParameters: NpdoStatementI.FetchParameters,
        cursorOrientation: number = NpdoConstants.FETCH_ORI_NEXT
    ): SingleFetchType<T> | null {
        return this.connection.fetch<T>((row: NpdoRowData): SingleFetchType<T> | null => {
            return this.adaptRowToFetch<T>(fetchParameters, row);
        }, cursorOrientation);
    }
}

export = NpdoStatement;
