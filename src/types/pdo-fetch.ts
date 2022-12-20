import PdoColumnValue from './pdo-column-value';

export type FetchFunctionClosure = (...values: PdoColumnValue[]) => any;

export interface KeyPairFetch {
    [key: string]: PdoColumnValue;
}

export interface GroupFetch<T extends AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any> {
    [key: string]: T[];
}

export interface UniqueFetch<T extends AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any> {
    [key: string | number]: T;
}

export interface AssociativeFetch {
    [key: string]: PdoColumnValue;
}

export interface BothFetch {
    [key: string | number]: PdoColumnValue;
}

export interface NamedFetch {
    [key: string]: PdoColumnValue | PdoColumnValue[];
}

export type ColumnFetch = PdoColumnValue;

export type NumFetch = PdoColumnValue[];

export type FetchType =
    | KeyPairFetch
    | GroupFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    | UniqueFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    | AssociativeFetch
    | BothFetch
    | NamedFetch
    | ColumnFetch
    | NumFetch
    | any;

// export type GroupFetchType<T> = T extends AssociativeFetch
//     ? AssociativeFetch
//     : T extends BothFetch
//     ? BothFetch
//     : T extends NamedFetch
//     ? NamedFetch
//     : T extends NumFetch
//     ? NumFetch
//     : T extends ColumnFetch
//     ? ColumnFetch
//     : T;

// export type UniqueFetchType<T> = T extends AssociativeFetch
//     ? AssociativeFetch
//     : T extends BothFetch
//     ? BothFetch
//     : T extends NamedFetch
//     ? NamedFetch
//     : T extends NumFetch
//     ? NumFetch
//     : T extends ColumnFetch
//     ? ColumnFetch
//     : T;

export type SingleFetchType<T> = T extends KeyPairFetch
    ? never
    : T extends AssociativeFetch
    ? AssociativeFetch
    : T extends BothFetch
    ? BothFetch
    : T extends NamedFetch
    ? NamedFetch
    : T extends ColumnFetch
    ? ColumnFetch
    : T extends NumFetch
    ? NumFetch
    : T extends GroupFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    ? never
    : T extends UniqueFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    ? never
    : T;

export type AllFetchType<T> = T extends KeyPairFetch
    ? KeyPairFetch
    : T extends BothFetch
    ? BothFetch[]
    : T extends NamedFetch
    ? NamedFetch[]
    : T extends ColumnFetch
    ? ColumnFetch[]
    : T extends NumFetch
    ? NumFetch[]
    : T extends GroupFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    ? GroupFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    : T extends UniqueFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    ? UniqueFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    : T extends AssociativeFetch
    ? AssociativeFetch[]
    : T[];

export interface FetchParameters {
    fetchMode: number;
    classConstructorArgs: any[];
    classToFetch: null | FunctionConstructor;
    fnToFetch: null | FetchFunctionClosure;
    objectToFetch: null | object;
    columnToFetch: number;
}
