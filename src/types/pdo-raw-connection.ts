import PdoColumnData from './pdo-column-data';
import { Params, ValidBindings } from './pdo-prepared-statement';
import PdoRowData from './pdo-raw-data';

export default interface PdoRawConnectionI {
    columns: PdoColumnData[];
    sql: string;
    params: Params | null;

    beginTransaction: () => Promise<void>;

    prepare: (sql: string) => Promise<void>;

    execute: (params?: Params) => Promise<void>;

    close: () => Promise<void>;

    bindValue: (key: string | number, value: ValidBindings) => void;

    exec: (sql: string) => Promise<number>;

    query: (sql: string) => Promise<void>;

    fetch: (cursorOrientation: number) => PdoRowData | null;

    fetchAll: (cursorOrientation: number) => PdoRowData[];

    resetCursor: () => void;

    commit: () => Promise<void>;
    rollback: () => Promise<void>;

    rowCount: () => number;
    lastInsertId: () => string | number | bigint | null;
}
