import PdoColumnData from './pdo-column-data';
import { AllFetchType, FetchType, SingleFetchType } from './pdo-fetch';
import { Params, ValidBindings } from './pdo-prepared-statement';
import PdoRowData from './pdo-raw-data';

export default interface PdoRawConnectionI {
    columns: PdoColumnData[];
    sql: string;
    params: Params | null;

    beginTransaction: () => Promise<void>;

    prepare: (sql: string) => Promise<void>;

    execute: (params?: Params) => Promise<void>;

    bindValue: (key: string | number, value: ValidBindings) => void;

    query: (sql: string) => Promise<void>;

    fetch: <T extends FetchType>(
        adapter: (row: PdoRowData) => SingleFetchType<T> | null,
        cursorOrientation: number
    ) => SingleFetchType<T> | null;
    fetchAll: <T extends FetchType>(adapter: (rows: PdoRowData[]) => AllFetchType<T>) => AllFetchType<T>;

    commit: () => Promise<void>;
    rollback: () => Promise<void>;

    rowCount: () => number;
    lastInsertId: () => string | number | bigint | null;
}
