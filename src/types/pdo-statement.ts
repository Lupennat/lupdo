import PdoAttributes from './pdo-attributes';
import PdoColumnData from './pdo-column-data';
import { AllFetchType, ColumnFetch, FetchFunctionClosure, FetchType, SingleFetchType } from './pdo-fetch';
import PdoRawConnectionI from './pdo-raw-connection';

export type PdoStatementConstructor = new (
    connection: PdoRawConnectionI,
    attributes: PdoAttributes,
    fetchMode?: number,
    numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
    constructorArgs?: any[]
) => PdoStatementI;

export default interface PdoStatementI {
    fetch: <T extends FetchType>(mode?: number, cursorOrientation?: number) => SingleFetchType<T> | null;

    fetchAll: <T extends FetchType>(
        mode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ) => AllFetchType<T>;

    fetchColumn: (column: number) => ColumnFetch | null;

    fetchObject: <T>(classOrObject: Function, constructorArgs?: any[]) => T | null;

    getColumnMeta: (column: number) => PdoColumnData | null;

    rowCount: () => number;

    lastInsertId: () => string | number | bigint | null;

    setFetchMode: (
        mode: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ) => void;

    columnCount: () => number;

    getAttribute: (attribute: string) => string | number;

    setAttribute: (attribute: string, value: number | string) => boolean;

    debug: () => string;
}
