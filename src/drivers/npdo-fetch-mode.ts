import NpdoConstants from '../constants';
import {
    FetchFunctionClosure,
    NpdoAttributes,
    NpdoRowData,
    NpdoStatement,
    NpdoColumnValue,
    NpdoRawConnection,
    KeyPairFetch,
    GroupFetch,
    AssociativeFetch,
    UniqueFetch,
    BothFetch,
    NamedFetch,
    ColumnFetch,
    SingleFetchType,
    FetchType,
    AllFetchType,
    NumFetch
} from '../types';
import { isFunctionConstructor } from '../utils';
import NpdoError from '../npdo-error';

abstract class NpdoFetchMode {
    protected fetchParameters: NpdoStatement.FetchParameters = {
        fetchMode: NpdoConstants.FETCH_NUM,
        classConstructorArgs: [],
        classToFetch: null,
        objectToFetch: null,
        fnToFetch: null,
        columnToFetch: 0
    };

    constructor(
        protected readonly connection: NpdoRawConnection,
        protected readonly attributes: NpdoAttributes,
        fetchMode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ) {
        this.assignFetchParameters(
            fetchMode != null ? fetchMode : (attributes[NpdoConstants.ATTR_DEFAULT_FETCH_MODE] as number),
            numberOrClassOrFnOrObject,
            constructorArgs
        );
    }

    protected getFetchParameters(
        fetchMode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[],
        reuse: boolean = true
    ): NpdoStatement.FetchParameters {
        fetchMode = fetchMode ?? this.fetchParameters.fetchMode;

        let classConstructorArgs = reuse ? this.fetchParameters.classConstructorArgs : [];
        let objectToFetch = reuse ? this.fetchParameters.objectToFetch : null;
        let classToFetch = reuse ? this.fetchParameters.classToFetch : null;
        let fnToFetch = reuse ? this.fetchParameters.fnToFetch : null;
        let columnToFetch = reuse ? this.fetchParameters.columnToFetch : 0;

        if ((fetchMode & NpdoConstants.FETCH_INTO) !== 0) {
            if (numberOrClassOrFnOrObject == null) {
                throw new NpdoError('Fetch mode "Npod.FETCH_INTO" require an object.');
            }

            if (typeof numberOrClassOrFnOrObject !== 'object') {
                throw new NpdoError(
                    `Fetch mode "Npod.FETCH_INTO" require an object, [${typeof numberOrClassOrFnOrObject}] provided.`
                );
            }

            objectToFetch = numberOrClassOrFnOrObject;
        }

        if ((fetchMode & NpdoConstants.FETCH_CLASS) !== 0) {
            if ((fetchMode & NpdoConstants.FETCH_CLASSTYPE) === 0) {
                if (constructorArgs != null) {
                    if (!Array.isArray(constructorArgs)) {
                        throw new NpdoError('constructorArgs must be an array of constructor parameters.');
                    }
                }

                if (numberOrClassOrFnOrObject == null) {
                    throw new NpdoError(
                        `Fetch mode "Npod.FETCH_CLASS" require a class, [${typeof numberOrClassOrFnOrObject}] provided.`
                    );
                }
                if (
                    typeof numberOrClassOrFnOrObject !== 'function' ||
                    !isFunctionConstructor(numberOrClassOrFnOrObject)
                ) {
                    throw new NpdoError('Fetch mode "Npod.FETCH_CLASS" require a class.');
                }
                classToFetch = numberOrClassOrFnOrObject as FunctionConstructor;
                classConstructorArgs = constructorArgs ?? [];
            }
        } else if ((fetchMode & NpdoConstants.FETCH_COLUMN) !== 0) {
            if (numberOrClassOrFnOrObject == null) {
                columnToFetch = 0;
            } else {
                if (typeof numberOrClassOrFnOrObject !== 'number') {
                    throw new NpdoError(
                        `Fetch mode "Npod.FETCH_COLUMN" require a number, [${typeof numberOrClassOrFnOrObject}] provided.`
                    );
                }
                columnToFetch = numberOrClassOrFnOrObject;
            }
        } else if ((fetchMode & NpdoConstants.FETCH_FUNC) !== 0) {
            if (numberOrClassOrFnOrObject == null) {
                throw new NpdoError('Fetch mode "Npod.FETCH_FUNC" require a closure function.');
            }
            if (typeof numberOrClassOrFnOrObject === 'function' && isFunctionConstructor(numberOrClassOrFnOrObject)) {
                throw new NpdoError(
                    'Fetch mode "Npod.FETCH_FUNC" require a closure function, [FunctionConstructor] provided.'
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
        fetchParameters: NpdoStatement.FetchParameters,
        rows: NpdoRowData[]
    ): AllFetchType<T> {
        if ((fetchParameters.fetchMode & NpdoConstants.FETCH_KEY_PAIR) !== 0) {
            return this.adaptFetchModeKeyPair(fetchParameters, rows) as any;
        }

        if ((fetchParameters.fetchMode & NpdoConstants.FETCH_UNIQUE) !== 0) {
            return this.adaptFetchModeUnique(fetchParameters, rows) as any;
        }

        if ((fetchParameters.fetchMode & NpdoConstants.FETCH_GROUP) !== 0) {
            return this.adaptFetchModeGroup(fetchParameters, rows) as any;
        }

        return rows.map(row => this.adaptRowToFetch(fetchParameters, row)) as any;
    }

    protected adaptRowToFetch<T extends FetchType>(
        fetchParameters: NpdoStatement.FetchParameters,
        row: NpdoRowData
    ): SingleFetchType<T> {
        return this.adaptRow<T>(
            fetchParameters,
            this.getRowNulled(row),
            this.getCasedColumnsName(),
            (fetchParameters.fetchMode & NpdoConstants.FETCH_NAMED) !== 0 ? this.getDuplicatedColumns() : []
        );
    }

    protected adaptRow<T extends FetchType>(
        fetchParameters: NpdoStatement.FetchParameters,
        row: NpdoRowData,
        columns: string[],
        duplicated: string[]
    ): SingleFetchType<T> {
        if ((fetchParameters.fetchMode & NpdoConstants.FETCH_ASSOC) !== 0) {
            return this.adaptFetchAssociative(fetchParameters, row, columns) as any;
        }

        if ((fetchParameters.fetchMode & NpdoConstants.FETCH_BOTH) !== 0) {
            return this.adaptFetchBoth(fetchParameters, row, columns) as any;
        }

        if ((fetchParameters.fetchMode & NpdoConstants.FETCH_NAMED) !== 0) {
            return this.adaptFetchNamed(fetchParameters, row, columns, duplicated) as any;
        }

        if ((fetchParameters.fetchMode & NpdoConstants.FETCH_INTO) !== 0) {
            return this.adaptFetchInto(fetchParameters, row, columns);
        }

        if ((fetchParameters.fetchMode & NpdoConstants.FETCH_CLASS) !== 0) {
            if ((fetchParameters.fetchMode & NpdoConstants.FETCH_CLASSTYPE) !== 0) {
                return this.adaptFetchClassType(fetchParameters, row, columns);
            } else {
                return this.adaptFetchClass(fetchParameters, row, columns);
            }
        }

        if ((fetchParameters.fetchMode & NpdoConstants.FETCH_COLUMN) !== 0) {
            return this.adaptFetchColumn(fetchParameters, row, columns) as any;
        }

        if ((fetchParameters.fetchMode & NpdoConstants.FETCH_FUNC) !== 0) {
            return this.adaptFetchFunction(fetchParameters, row, columns);
        }

        return row as any;
    }

    protected getRowNulled(row: NpdoRowData): NpdoRowData {
        const nullType = this.attributes[NpdoConstants.ATTR_NULLS] as number;
        return (nullType & NpdoConstants.NULL_NATURAL) !== 0
            ? row
            : row.map((val: NpdoColumnValue) => {
                  return val === null || (typeof val === 'string' && val === '')
                      ? (nullType & NpdoConstants.NULL_EMPTY_STRING) !== 0
                          ? null
                          : ''
                      : val;
              });
    }

    protected getCasedColumnsName(): string[] {
        const columnCase = this.attributes[NpdoConstants.ATTR_CASE] as number;
        return this.connection.columns.map(column => {
            return (columnCase & NpdoConstants.CASE_NATURAL) !== 0
                ? column.name
                : (columnCase & NpdoConstants.CASE_LOWER) !== 0
                ? column.name.toLowerCase()
                : column.name.toUpperCase();
        });
    }

    protected getDuplicatedColumns(): string[] {
        return this.getCasedColumnsName().filter(
            (element: string, index: number, array: string[]) => array.indexOf(element) !== index
        );
    }

    protected adaptFetchModeKeyPair(fetchParameters: NpdoStatement.FetchParameters, rows: NpdoRowData[]): KeyPairFetch {
        const columns = this.getCasedColumnsName();

        if (columns.length !== 2) {
            throw new NpdoError(
                `When fetchMode is Npdo.FETCH_KEY_PAIR, query results must return 2 columns, [${columns.length}] provided`
            );
        }
        return rows.reduce((carry: KeyPairFetch, row: NpdoRowData) => {
            carry[(row[0] as string | bigint | number | bigint | Buffer).toString()] = row[1];
            return carry;
        }, {});
    }

    protected adaptFetchModeGroup(
        fetchParameters: NpdoStatement.FetchParameters,
        rows: NpdoRowData[]
    ): GroupFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch> {
        const columns = this.getCasedColumnsName();
        const duplicated = this.getDuplicatedColumns();
        return rows.reduce(
            (carry: GroupFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch>, row: NpdoRowData) => {
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
        fetchParameters: NpdoStatement.FetchParameters,
        rows: NpdoRowData[]
    ): UniqueFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch> {
        const columns = this.getCasedColumnsName();
        const duplicated = this.getDuplicatedColumns();
        return rows.reduce(
            (carry: UniqueFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch>, row: NpdoRowData) => {
                const id = row.shift() as string | number;
                carry[id] = this.adaptRow(fetchParameters, row, columns, duplicated);
                return carry;
            },
            {}
        );
    }

    protected adaptFetchAssociative(
        fetchParameters: NpdoStatement.FetchParameters,
        row: NpdoRowData,
        columns: string[]
    ): AssociativeFetch {
        return row.reduce((carry: AssociativeFetch, val: NpdoColumnValue, currentIndex: number) => {
            carry[columns[currentIndex]] = val;
            return carry;
        }, {});
    }

    protected adaptFetchBoth(
        fetchParameters: NpdoStatement.FetchParameters,
        row: NpdoRowData,
        columns: string[]
    ): BothFetch {
        return row.reduce((carry: BothFetch, val: NpdoColumnValue, currentIndex: number) => {
            carry[currentIndex.toString()] = val;
            carry[columns[currentIndex]] = val;
            return carry;
        }, {});
    }

    protected adaptFetchNamed(
        fetchParameters: NpdoStatement.FetchParameters,
        row: NpdoRowData,
        columns: string[],
        duplicated: string[]
    ): NamedFetch {
        return row.reduce((carry: NamedFetch, val: NpdoColumnValue, currentIndex: number) => {
            const columnKey = columns[currentIndex];
            if (duplicated.includes(columnKey)) {
                if (!(columnKey in carry)) {
                    carry[columnKey] = [];
                }
                (carry[columnKey] as NpdoColumnValue[]).push(val);
            } else {
                carry[columnKey] = val;
            }
            return carry;
        }, {});
    }

    protected adaptFetchClass(
        fetchParameters: NpdoStatement.FetchParameters,
        row: NpdoRowData,
        columns: string[]
    ): any {
        const obj = new (fetchParameters.classToFetch as FunctionConstructor)(...fetchParameters.classConstructorArgs);

        // @ts-expect-error
        this.assignPropsToObj(obj, row, columns);

        return obj;
    }

    protected adaptFetchClassType(
        fetchParameters: NpdoStatement.FetchParameters,
        row: NpdoRowData,
        columns: string[]
    ): any {
        const str = row.shift();
        if (typeof str !== 'string') {
            throw new NpdoError(
                `Fetch mode "Npod.FETCH_CLASSTYPE" require value of first column to be a string, [${typeof str}] provided.`
            );
        }
        const key = str.charAt(0).toUpperCase() + str.slice(1);

        const tmp = {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            [key]: class {}
        };
        const obj = new tmp[key]() as { [key: string]: NpdoColumnValue };
        columns = columns.slice(1);

        this.assignPropsToObj(obj, row, columns);

        return obj;
    }

    protected adaptFetchInto(fetchParameters: NpdoStatement.FetchParameters, row: NpdoRowData, columns: string[]): any {
        const obj = fetchParameters.objectToFetch as { [key: string]: NpdoColumnValue };
        this.assignPropsToObj(obj, row, columns, true);

        return fetchParameters.objectToFetch;
    }

    protected adaptFetchColumn(
        fetchParameters: NpdoStatement.FetchParameters,
        row: NpdoRowData,
        columns: string[]
    ): ColumnFetch {
        if (row.length - 1 < fetchParameters.columnToFetch) {
            throw new NpdoError(`Column ${fetchParameters.columnToFetch} does not exists.`);
        }

        return row[fetchParameters.columnToFetch];
    }

    protected adaptFetchFunction(
        fetchParameters: NpdoStatement.FetchParameters,
        row: NpdoRowData,
        columns: string[]
    ): any {
        return (fetchParameters.fnToFetch as FetchFunctionClosure)(...row);
    }

    protected assignPropsToObj(
        obj: { [key: string]: NpdoColumnValue },
        row: NpdoRowData,
        columns: string[],
        onlyExist: boolean = false
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
                    throw new NpdoError(`class [${obj.constructor.name}.${key}()] conflict with column name [${key}].`);
                }
                if (typeof desc.get === 'function' && typeof desc.set !== 'function') {
                    throw new NpdoError(
                        `class getter [${obj.constructor.name}.${key}()] defined wihtout a setter, it conflict with column name [${key}].`
                    );
                }
            }

            obj[key] = row[x];
        }
    }
}

export = NpdoFetchMode;
