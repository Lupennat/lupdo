import {
    ATTR_CASE,
    ATTR_FETCH_DIRECTION,
    ATTR_NULLS,
    CASE_LOWER,
    CASE_NATURAL,
    NULL_EMPTY_STRING,
    NULL_NATURAL
} from '../constants';
import { PdoError } from '../errors';
import PdoAttributes from '../types/pdo-attributes';
import PdoColumnData from '../types/pdo-column-data';
import PdoColumnValue from '../types/pdo-column-value';
import PdoRawConnectionI from '../types/pdo-raw-connection';
import PdoRowData from '../types/pdo-raw-data';
import PdoStatementI, { Both, Fetched, Group, Json, Named, Newable, Pair, Unique } from '../types/pdo-statement';

class PdoStatement implements PdoStatementI {
    protected attributes: PdoAttributes;

    constructor(protected readonly connection: PdoRawConnectionI, attributes: PdoAttributes) {
        this.attributes = { ...attributes };
    }

    public columnCount(): number {
        return this.connection.columns.length;
    }

    public debug(): string {
        return `SQL: ${this.connection.sql}\nPARAMS:${JSON.stringify(this.connection.params ?? [], null, 2)}`;
    }

    public getColumnMeta(column: number): PdoColumnData | null {
        return this.connection.columns.length > column ? this.connection.columns[column] : null;
    }

    public rowCount(): number {
        return this.connection.rowCount();
    }

    public lastInsertId(): string | bigint | number | null {
        return this.connection.lastInsertId();
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

    /**
     * Specifies that the fetch method shall return each row as a key-value object keyed
     * by column name as returned in the corresponding result set.
     * If the result set contains multiple columns with the same name,
     * it returns only a single value per column name.
     */
    public fetchJson(): Fetched<Json> {
        return this.fetched((row: PdoRowData, columns: string[]): Json => {
            return row.reduce((carry: Json, val: PdoColumnValue, currentIndex: number) => {
                carry[columns[currentIndex]] = val;
                return carry;
            }, {});
        });
    }

    /**
     * Specifies that the fetch method shall return each row as an array indexed by
     * column number as returned in the corresponding result set, starting at column 0.
     */
    public fetchArray(): Fetched<PdoColumnValue[]> {
        return this.fetched((row: PdoRowData): PdoColumnValue[] => {
            return row;
        });
    }

    /**
     * Specifies that the fetch method shall return each row as a key-value object keyed by
     * both column name and number as returned in the corresponding result set, starting at column 0.
     */
    public fetchBoth(): Fetched<Both> {
        return this.fetched((row: PdoRowData, columns: string[]): Both => {
            return row.reduce((carry: Both, val: PdoColumnValue, currentIndex: number) => {
                carry[currentIndex] = val;
                carry[columns[currentIndex]] = val;
                return carry;
            }, {});
        });
    }

    /**
     * Specifies that the fetch method shall return only a single requested column
     * from the next row in the result set.
     */
    public fetchColumn<T extends PdoColumnValue>(column: number): Fetched<T> {
        return this.fetched((row: PdoRowData): T => {
            if (row.length - 1 < column) {
                throw new PdoError(`Column ${column} does not exists.`);
            }
            return row[column] as T;
        });
    }

    /**
     * Specifies that the fetch method shall return a new instance of the requested class,
     * mapping the columns to named properties in the class.
     * Note: The setter method is called if defined in the requested class
     */
    public fetchObject<T>(abstract: Newable<T>, constructorArgs?: any[]): Fetched<T> {
        return this.fetched((row: PdoRowData, columns: string[]) => {
            const obj = new abstract(...(constructorArgs ?? []));
            this.assignPropsToObj(obj, row, columns);
            return obj;
        });
    }

    /**
     * Allows completely customize the way data is treated on the fly.
     */
    public fetchClosure<T>(fn: (...args: PdoColumnValue[]) => T): Fetched<T> {
        return this.fetched((row: PdoRowData) => {
            return fn(...row);
        });
    }

    /**
     * Specifies that the fetch method shall return each row as a key-value object keyed
     * by column name as returned in the corresponding result set.
     * If the result set contains multiple columns with the same name,
     * it returns an array of values per column name.
     */
    public fecthNamed(): Fetched<Named> {
        return this.fetched((row: PdoRowData, columns: string[], duplicatedColumns: string[]): Named => {
            return row.reduce((carry: Named, val: PdoColumnValue, currentIndex: number) => {
                const columnKey = columns[currentIndex];
                if (duplicatedColumns.includes(columnKey)) {
                    if (!(columnKey in carry)) {
                        carry[columnKey] = [];
                    }
                    (carry[columnKey] as PdoColumnValue[]).push(val);
                } else {
                    carry[columnKey] = val;
                }
                return carry;
            }, {});
        }, true);
    }

    /**
     * Fetch a two-column results into a key-value object where the first column is a key
     * and the second column is the value.
     */
    public fetchPair<T extends PdoColumnValue, U extends PdoColumnValue>(): Pair<T, U> {
        const columns = this.getCasedColumnsName();

        if (columns.length !== 2) {
            throw new PdoError(`With fetchPair(), query results must return 2 columns, [${columns.length}] provided`);
        }

        const map: Pair<T, U> = new Map();

        for (const row of this.connection.fetchAll(this.getAttribute(ATTR_FETCH_DIRECTION) as number)) {
            map.set((row[0] ?? null) as T, row[1] as U);
        }

        return map;
    }

    public resetCursor(): void {
        this.connection.resetCursor();
    }

    protected fetched<T>(
        callable: (row: PdoRowData, columns: string[], duplicatedColumns: string[]) => T,
        withDuplicated = false
    ): Fetched<T> {
        return {
            get: () => {
                const row = this.connection.fetch(this.getAttribute(ATTR_FETCH_DIRECTION) as number);
                if (row === null) {
                    return undefined;
                }
                return callable(
                    this.getRowNulled(row),
                    this.getCasedColumnsName(),
                    withDuplicated ? this.getDuplicatedColumns() : []
                );
            },
            all: () => {
                return this.connection
                    .fetchAll(this.getAttribute(ATTR_FETCH_DIRECTION) as number)
                    .map((row: PdoRowData) => {
                        return callable(
                            this.getRowNulled(row),
                            this.getCasedColumnsName(),
                            withDuplicated ? this.getDuplicatedColumns() : []
                        );
                    });
            },
            group: () => {
                const columns = this.getCasedColumnsName();
                const duplicated = this.getDuplicatedColumns();
                const map: Group<T> = new Map();
                for (const row of this.connection.fetchAll(this.getAttribute(ATTR_FETCH_DIRECTION) as number)) {
                    const key = row.shift() ?? null;
                    const values = map.get(key) ?? [];
                    values.push(callable(this.getRowNulled(row), columns, duplicated));
                    map.set(key, values);
                }
                return map;
            },
            unique: () => {
                const columns = this.getCasedColumnsName();
                const duplicated = this.getDuplicatedColumns();
                const map: Unique<T> = new Map();
                for (const row of this.connection.fetchAll(this.getAttribute(ATTR_FETCH_DIRECTION) as number)) {
                    map.set(row.shift() ?? null, callable(this.getRowNulled(row), columns, duplicated));
                }
                return map;
            },
            [Symbol.iterator](): Iterator<T> {
                return {
                    next: (): IteratorResult<T> => {
                        const row = this.get();

                        if (row == null) {
                            return { done: true, value: undefined };
                        }
                        return { done: false, value: row };
                    },
                    return: (): IteratorResult<T> => {
                        return { done: true, value: undefined };
                    }
                };
            }
        };
    }

    protected getRowNulled(row: PdoRowData): PdoRowData {
        const nullType = this.attributes[ATTR_NULLS] as number;
        return (nullType & NULL_NATURAL) !== 0
            ? row
            : row.map((val: PdoColumnValue) => {
                  return val === null || (typeof val === 'string' && val === '')
                      ? (nullType & NULL_EMPTY_STRING) !== 0
                          ? null
                          : ''
                      : val;
              });
    }

    protected getCasedColumnsName(): string[] {
        const columnCase = this.attributes[ATTR_CASE] as number;
        return this.connection.columns.map(column => {
            return (columnCase & CASE_NATURAL) !== 0
                ? column.name
                : (columnCase & CASE_LOWER) !== 0
                ? column.name.toLowerCase()
                : column.name.toUpperCase();
        });
    }

    protected getDuplicatedColumns(): string[] {
        return this.getCasedColumnsName().filter(
            (element: string, index: number, array: string[]) => array.indexOf(element) !== index
        );
    }

    protected assignPropsToObj(obj: any, row: PdoRowData, columns: string[]): void {
        for (let x = 0; x < row.length; x++) {
            const key = columns[x];
            if (key in obj) {
                const desc = Object.getOwnPropertyDescriptor(obj, key) as PropertyDescriptor;
                if (typeof desc.value === 'function') {
                    throw new PdoError(`class [${obj.constructor.name}.${key}()] conflict with column name [${key}].`);
                }
                if (typeof desc.get === 'function' && typeof desc.set !== 'function') {
                    throw new PdoError(
                        `class getter [${obj.constructor.name}.${key}()] defined wihtout a setter, it conflict with column name [${key}].`
                    );
                }
            }

            obj[key] = row[x];
        }
    }
}

export default PdoStatement;
