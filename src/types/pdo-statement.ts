import { PdoAffectingData } from './pdo-affecting-data';
import { PdoColumnData } from './pdo-column-data';
import { PdoColumnValue } from './pdo-column-value';
import { PdoRawConnectionI } from './pdo-raw-connection';
import { PdoRowData } from './pdo-raw-data';

export type PdoStatementConstructor = new (
  connection: PdoRawConnectionI,
  rawSql: string,
  affectingResults: PdoAffectingData,
  selectResults: PdoRowData[][] | PdoRowData[],
  columns: PdoColumnData[][] | PdoColumnData[],
) => PdoStatementI;

export type Dictionary = { [key: string]: PdoColumnValue };
export type Both = { [key: string | number]: PdoColumnValue };
export type Named = { [key: string]: PdoColumnValue | PdoColumnValue[] };
export type Newable<T = unknown> = new (...args: any[]) => T;
export type Unique<T> = Map<PdoColumnValue, T>;
export type Group<T> = Map<PdoColumnValue, T[]>;
export type Pair<T, U> = Map<T, U>;

export interface Fetched<T> extends Iterable<T> {
  get: () => T | undefined;
  all: () => T[];
  group: () => Group<T>;
  unique: () => Unique<T>;
}

export interface PdoStatementI {
  /**
   * Specifies that the fetch method shall return each row as a key-value object keyed
   * by column name as returned in the corresponding result set.
   * If the result set contains multiple columns with the same name,
   * it returns only a single value per column name.
   */
  fetchDictionary: <T = Dictionary>() => Fetched<T>;

  /**
   * Specifies that the fetch method shall return each row as an array indexed by
   * column number as returned in the corresponding result set, starting at column 0.
   */
  fetchArray: () => Fetched<PdoColumnValue[]>;

  /**
   * Specifies that the fetch method shall return each row as a key-value object keyed by
   * both column name and number as returned in the corresponding result set, starting at column 0.
   */
  fetchBoth: () => Fetched<Both>;

  /**
   * Specifies that the fetch method shall return only a single requested column
   * from the next row in the result set.
   */
  fetchColumn: <T extends PdoColumnValue>(column: number) => Fetched<T>;

  /**
   * Specifies that the fetch method shall return a new instance of the requested class,
   * mapping the columns to named properties in the class.
   * Note: The setter method is called if defined in the requested class
   */
  fetchObject: <T>(abstract: Newable<T>, constructorArgs?: any[]) => Fetched<T>;

  /**
   * Allows completely customize the way data is treated on the fly.
   */
  fetchClosure: <T>(fn: (...args: any[]) => T) => Fetched<T>;

  /**
   * Specifies that the fetch method shall return each row as a key-value object keyed
   * by column name as returned in the corresponding result set.
   * If the result set contains multiple columns with the same name,
   * it returns an array of values per column name.
   */
  fecthNamed: () => Fetched<Named>;

  /**
   * Fetch a two-column results into a key-value object where the first column is a key
   * and the second column is the value.
   */
  fetchPair: <T extends PdoColumnValue, U extends PdoColumnValue>() => Pair<
    T,
    U
  >;

  getColumnMeta: (column: number) => PdoColumnData | null;

  rowCount: () => number;

  lastInsertId: (name?: string) => Promise<string | number | null>;

  columnCount: () => number;

  getAttribute: (attribute: string) => string | number;

  setAttribute: (attribute: string, value: number | string) => boolean;

  debug: () => string;

  debugSent(): string;

  resetCursor: () => void;

  nextRowset: () => boolean;
}
