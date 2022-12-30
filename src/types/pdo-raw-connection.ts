import PdoAttributes from './pdo-attributes';
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

    fetch: () => PdoRowData | null;

    fetchAll: () => PdoRowData[];

    resetCursor: () => void;

    getAttribute: (attribute: string) => string | number;
    setAttribute: (attribute: string, value: number | string) => boolean;
    setAttributes: (attributes: PdoAttributes) => void;

    commit: () => Promise<void>;
    rollback: () => Promise<void>;

    rowCount: () => number;
    lastInsertId: (name?: string) => Promise<string | number | bigint | null>;
}
