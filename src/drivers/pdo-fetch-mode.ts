import {
    ATTR_CASE,
    ATTR_DEFAULT_FETCH_MODE,
    ATTR_NULLS,
    CASE_LOWER,
    CASE_NATURAL,
    FETCH_ASSOC,
    FETCH_BOTH,
    FETCH_CLASS,
    FETCH_CLASSTYPE,
    FETCH_COLUMN,
    FETCH_FUNC,
    FETCH_GROUP,
    FETCH_INTO,
    FETCH_KEY_PAIR,
    FETCH_NAMED,
    FETCH_NUM,
    FETCH_UNIQUE,
    NULL_EMPTY_STRING,
    NULL_NATURAL
} from '../constants';
import { PdoError } from '../errors';
import PdoAttributes from '../types/pdo-attributes';
import PdoColumnValue from '../types/pdo-column-value';
import {
    AllFetchType,
    AssociativeFetch,
    BothFetch,
    ColumnFetch,
    FetchFunctionClosure,
    FetchParameters,
    FetchType,
    GroupFetch,
    KeyPairFetch,
    NamedFetch,
    NumFetch,
    SingleFetchType,
    UniqueFetch
} from '../types/pdo-fetch';
import PdoRawConnectionI from '../types/pdo-raw-connection';
import PdoRowData from '../types/pdo-raw-data';
import { isFunctionConstructor } from '../utils';

abstract class PdoFetchMode {
    protected fetchParameters: FetchParameters = {
        fetchMode: FETCH_NUM,
        classConstructorArgs: [],
        classToFetch: null,
        objectToFetch: null,
        fnToFetch: null,
        columnToFetch: 0
    };

    constructor(
        protected readonly connection: PdoRawConnectionI,
        protected readonly attributes: PdoAttributes,
        fetchMode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ) {
        this.assignFetchParameters(
            fetchMode != null ? fetchMode : (attributes[ATTR_DEFAULT_FETCH_MODE] as number),
            numberOrClassOrFnOrObject,
            constructorArgs
        );
    }

    protected getFetchParameters(
        fetchMode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[],
        reuse = true
    ): FetchParameters {
        fetchMode = fetchMode ?? this.fetchParameters.fetchMode;

        let classConstructorArgs = reuse ? this.fetchParameters.classConstructorArgs : [];
        let objectToFetch = reuse ? this.fetchParameters.objectToFetch : null;
        let classToFetch = reuse ? this.fetchParameters.classToFetch : null;
        let fnToFetch = reuse ? this.fetchParameters.fnToFetch : null;
        let columnToFetch = reuse ? this.fetchParameters.columnToFetch : 0;

        if ((fetchMode & FETCH_INTO) !== 0) {
            if (numberOrClassOrFnOrObject == null) {
                throw new PdoError('Fetch mode "FETCH_INTO" require an object.');
            }

            if (typeof numberOrClassOrFnOrObject !== 'object') {
                throw new PdoError(
                    `Fetch mode "FETCH_INTO" require an object, [${typeof numberOrClassOrFnOrObject}] provided.`
                );
            }

            objectToFetch = numberOrClassOrFnOrObject;
        }

        if ((fetchMode & FETCH_CLASS) !== 0) {
            if ((fetchMode & FETCH_CLASSTYPE) === 0) {
                if (constructorArgs != null) {
                    if (!Array.isArray(constructorArgs)) {
                        throw new PdoError('constructorArgs must be an array of constructor parameters.');
                    }
                }

                if (numberOrClassOrFnOrObject == null) {
                    throw new PdoError(
                        `Fetch mode "FETCH_CLASS" require a class, [${typeof numberOrClassOrFnOrObject}] provided.`
                    );
                }
                if (
                    typeof numberOrClassOrFnOrObject !== 'function' ||
                    !isFunctionConstructor(numberOrClassOrFnOrObject)
                ) {
                    throw new PdoError('Fetch mode "FETCH_CLASS" require a class.');
                }
                classToFetch = numberOrClassOrFnOrObject as FunctionConstructor;
                classConstructorArgs = constructorArgs ?? [];
            }
        } else if ((fetchMode & FETCH_COLUMN) !== 0) {
            if (numberOrClassOrFnOrObject == null) {
                columnToFetch = 0;
            } else {
                if (typeof numberOrClassOrFnOrObject !== 'number') {
                    throw new PdoError(
                        `Fetch mode "FETCH_COLUMN" require a number, [${typeof numberOrClassOrFnOrObject}] provided.`
                    );
                }
                columnToFetch = numberOrClassOrFnOrObject;
            }
        } else if ((fetchMode & FETCH_FUNC) !== 0) {
            if (numberOrClassOrFnOrObject == null) {
                throw new PdoError('Fetch mode "FETCH_FUNC" require a closure function.');
            }
            if (typeof numberOrClassOrFnOrObject === 'function' && isFunctionConstructor(numberOrClassOrFnOrObject)) {
                throw new PdoError(
                    'Fetch mode "FETCH_FUNC" require a closure function, [FunctionConstructor] provided.'
                );
            }
            fnToFetch = numberOrClassOrFnOrObject as FetchFunctionClosure;
        }

        return {
            fetchMode,
            classConstructorArgs,
            classToFetch,
            objectToFetch,
            fnToFetch,
            columnToFetch
        };
    }

    protected assignFetchParameters(
        fetchMode: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ): void {
        this.fetchParameters = this.getFetchParameters(fetchMode, numberOrClassOrFnOrObject, constructorArgs, false);
    }

    protected adaptRowsToFetch<T extends FetchType>(
        fetchParameters: FetchParameters,
        rows: PdoRowData[]
    ): AllFetchType<T> {
        if ((fetchParameters.fetchMode & FETCH_KEY_PAIR) !== 0) {
            return this.adaptFetchModeKeyPair(rows) as any;
        }

        if ((fetchParameters.fetchMode & FETCH_UNIQUE) !== 0) {
            return this.adaptFetchModeUnique(fetchParameters, rows) as any;
        }

        if ((fetchParameters.fetchMode & FETCH_GROUP) !== 0) {
            return this.adaptFetchModeGroup(fetchParameters, rows) as any;
        }

        return rows.map(row => this.adaptRowToFetch(fetchParameters, row)) as any;
    }

    protected adaptRowToFetch<T extends FetchType>(
        fetchParameters: FetchParameters,
        row: PdoRowData
    ): SingleFetchType<T> {
        return this.adaptRow<T>(
            fetchParameters,
            this.getRowNulled(row),
            this.getCasedColumnsName(),
            (fetchParameters.fetchMode & FETCH_NAMED) !== 0 ? this.getDuplicatedColumns() : []
        );
    }

    protected adaptRow<T extends FetchType>(
        fetchParameters: FetchParameters,
        row: PdoRowData,
        columns: string[],
        duplicated: string[]
    ): SingleFetchType<T> {
        if ((fetchParameters.fetchMode & FETCH_ASSOC) !== 0) {
            return this.adaptFetchAssociative(row, columns) as any;
        }

        if ((fetchParameters.fetchMode & FETCH_BOTH) !== 0) {
            return this.adaptFetchBoth(row, columns) as any;
        }

        if ((fetchParameters.fetchMode & FETCH_NAMED) !== 0) {
            return this.adaptFetchNamed(row, columns, duplicated) as any;
        }

        if ((fetchParameters.fetchMode & FETCH_INTO) !== 0) {
            return this.adaptFetchInto(fetchParameters, row, columns);
        }

        if ((fetchParameters.fetchMode & FETCH_CLASS) !== 0) {
            if ((fetchParameters.fetchMode & FETCH_CLASSTYPE) !== 0) {
                return this.adaptFetchClassType(row, columns);
            } else {
                return this.adaptFetchClass(fetchParameters, row, columns);
            }
        }

        if ((fetchParameters.fetchMode & FETCH_COLUMN) !== 0) {
            return this.adaptFetchColumn(fetchParameters, row) as any;
        }

        if ((fetchParameters.fetchMode & FETCH_FUNC) !== 0) {
            return this.adaptFetchFunction(fetchParameters, row);
        }

        return row as any;
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

    protected adaptFetchModeKeyPair(rows: PdoRowData[]): KeyPairFetch {
        const columns = this.getCasedColumnsName();

        if (columns.length !== 2) {
            throw new PdoError(
                `When fetchMode is FETCH_KEY_PAIR, query results must return 2 columns, [${columns.length}] provided`
            );
        }
        return rows.reduce((carry: KeyPairFetch, row: PdoRowData) => {
            carry[(row[0] as string | bigint | number | bigint | Buffer).toString()] = row[1];
            return carry;
        }, {});
    }

    protected adaptFetchModeGroup(
        fetchParameters: FetchParameters,
        rows: PdoRowData[]
    ): GroupFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch> {
        const columns = this.getCasedColumnsName();
        const duplicated = this.getDuplicatedColumns();
        return rows.reduce(
            (carry: GroupFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch>, row: PdoRowData) => {
                const id = row.shift() as string | number;
                if (!(id in carry)) {
                    carry[id] = [];
                }

                carry[id].push(this.adaptRow(fetchParameters, row, columns, duplicated));

                return carry;
            },
            {}
        );
    }

    protected adaptFetchModeUnique(
        fetchParameters: FetchParameters,
        rows: PdoRowData[]
    ): UniqueFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch> {
        const columns = this.getCasedColumnsName();
        const duplicated = this.getDuplicatedColumns();
        return rows.reduce(
            (carry: UniqueFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch>, row: PdoRowData) => {
                const id = row.shift() as string | number;
                carry[id] = this.adaptRow(fetchParameters, row, columns, duplicated);
                return carry;
            },
            {}
        );
    }

    protected adaptFetchAssociative(row: PdoRowData, columns: string[]): AssociativeFetch {
        return row.reduce((carry: AssociativeFetch, val: PdoColumnValue, currentIndex: number) => {
            carry[columns[currentIndex]] = val;
            return carry;
        }, {});
    }

    protected adaptFetchBoth(row: PdoRowData, columns: string[]): BothFetch {
        return row.reduce((carry: BothFetch, val: PdoColumnValue, currentIndex: number) => {
            carry[currentIndex.toString()] = val;
            carry[columns[currentIndex]] = val;
            return carry;
        }, {});
    }

    protected adaptFetchNamed(row: PdoRowData, columns: string[], duplicated: string[]): NamedFetch {
        return row.reduce((carry: NamedFetch, val: PdoColumnValue, currentIndex: number) => {
            const columnKey = columns[currentIndex];
            if (duplicated.includes(columnKey)) {
                if (!(columnKey in carry)) {
                    carry[columnKey] = [];
                }
                (carry[columnKey] as PdoColumnValue[]).push(val);
            } else {
                carry[columnKey] = val;
            }
            return carry;
        }, {});
    }

    protected adaptFetchClass(fetchParameters: FetchParameters, row: PdoRowData, columns: string[]): any {
        const obj = new (fetchParameters.classToFetch as FunctionConstructor)(
            ...fetchParameters.classConstructorArgs
        ) as any;

        this.assignPropsToObj(obj, row, columns);

        return obj;
    }

    protected adaptFetchClassType(row: PdoRowData, columns: string[]): any {
        const str = row.shift();
        if (typeof str !== 'string') {
            throw new PdoError(
                `Fetch mode "FETCH_CLASSTYPE" require value of first column to be a string, [${typeof str}] provided.`
            );
        }
        const key = str.charAt(0).toUpperCase() + str.slice(1);

        const tmp = {
            [key]: class {}
        };
        const obj = new tmp[key]() as { [key: string]: PdoColumnValue };
        columns = columns.slice(1);

        this.assignPropsToObj(obj, row, columns);

        return obj;
    }

    protected adaptFetchInto(fetchParameters: FetchParameters, row: PdoRowData, columns: string[]): any {
        const obj = fetchParameters.objectToFetch as { [key: string]: PdoColumnValue };
        this.assignPropsToObj(obj, row, columns, true);

        return fetchParameters.objectToFetch;
    }

    protected adaptFetchColumn(fetchParameters: FetchParameters, row: PdoRowData): ColumnFetch {
        if (row.length - 1 < fetchParameters.columnToFetch) {
            throw new PdoError(`Column ${fetchParameters.columnToFetch} does not exists.`);
        }

        return row[fetchParameters.columnToFetch];
    }

    protected adaptFetchFunction(fetchParameters: FetchParameters, row: PdoRowData): any {
        return (fetchParameters.fnToFetch as FetchFunctionClosure)(...row);
    }

    protected assignPropsToObj(
        obj: { [key: string]: PdoColumnValue },
        row: PdoRowData,
        columns: string[],
        onlyExist = false
    ): void {
        for (let x = 0; x < row.length; x++) {
            const key = columns[x];
            if (!(key in obj)) {
                if (onlyExist) {
                    continue;
                }
            } else {
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

export default PdoFetchMode;
