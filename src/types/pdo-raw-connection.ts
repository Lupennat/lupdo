import PdoAffectingData from './pdo-affecting-data';
import PdoAttributes from './pdo-attributes';
import PdoColumnData from './pdo-column-data';
import { Params, ValidBindings } from './pdo-prepared-statement';
import PdoRowData from './pdo-raw-data';

export default interface PdoRawConnectionI {
    beginTransaction: () => Promise<void>;

    prepare: (sql: string) => Promise<void>;

    execute: (params: Params | null) => Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]>;

    close: () => Promise<void>;

    bindValue: (value: ValidBindings) => ValidBindings;

    exec: (sql: string) => Promise<number>;

    query: (sql: string) => Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]>;

    getAttribute: (attribute: string) => string | number;
    setAttribute: (attribute: string, value: number | string) => boolean;
    setAttributes: (attributes: PdoAttributes) => void;

    commit: () => Promise<void>;
    rollback: () => Promise<void>;

    lastInsertId: (
        {
            affectingResults,
            selectResults,
            columns
        }: {
            affectingResults: PdoAffectingData;
            selectResults: PdoRowData[];
            columns: PdoColumnData[];
        },
        name?: string
    ) => Promise<string | number | bigint | null>;
}
