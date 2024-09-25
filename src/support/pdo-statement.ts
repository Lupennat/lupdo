import {
  ATTR_CASE,
  ATTR_FETCH_DIRECTION,
  ATTR_NULLS,
  CASE_LOWER,
  CASE_NATURAL,
  FETCH_BACKWARD,
  NULL_EMPTY_STRING,
  NULL_NATURAL,
} from '../constants';
import PdoError from '../errors/pdo-error';
import { PdoAffectingData } from '../types/pdo-affecting-data';
import { PdoColumnData } from '../types/pdo-column-data';
import { PdoColumnValue } from '../types/pdo-column-value';
import { Params } from '../types/pdo-prepared-statement';
import { PdoRawConnectionI } from '../types/pdo-raw-connection';
import { PdoRowData } from '../types/pdo-raw-data';
import {
  Both,
  Dictionary,
  Fetched,
  Group,
  Named,
  Newable,
  Pair,
  PdoStatementI,
  Unique,
} from '../types/pdo-statement';
import { paramsToString } from '../utils';

export class PdoStatement implements PdoStatementI {
  protected sql: string;

  protected rawParams: Params | null = null;
  protected params: Params | null = null;
  protected cursor: number | null = null;
  protected rowset = 0;
  protected isRowset = false;
  protected currentSelectResults: PdoRowData[] = [];
  protected currentColumns: PdoColumnData[] = [];
  protected selectResults: PdoRowData[] | PdoRowData[][];
  protected columns: PdoColumnData[] | PdoColumnData[][];

  constructor(
    protected readonly connection: PdoRawConnectionI,
    protected readonly rawSql: string,
    protected affectingResults: PdoAffectingData,
    selectResults: PdoRowData[] | PdoRowData[][],
    columns: PdoColumnData[] | PdoColumnData[][],
  ) {
    this.sql = this.rawSql;
    this.columns = columns;
    this.selectResults = selectResults;
    this.resetRowset();
    this.resetCursor();
    this.setCurrentColumns();
    this.setCurrentSelectResults();
  }

  public columnCount(): number {
    return this.currentColumns.length;
  }

  public debug(): string {
    return `SQL: ${this.rawSql}\nPARAMS:${paramsToString(this.rawParams ?? [], 2)}`;
  }

  public debugSent(): string {
    return `PROCESSED SQL: ${this.sql}\nPARAMS:${paramsToString(this.params ?? [], 2)}`;
  }

  public getColumnMeta(column: number): PdoColumnData | null {
    return this.currentColumns.length > column
      ? this.currentColumns[column]
      : null;
  }

  public rowCount(): number {
    if (typeof this.affectingResults.affectedRows !== 'undefined') {
      return this.affectingResults.affectedRows;
    }
    return 0;
  }

  public async lastInsertId(
    name?: string,
  ): Promise<string | bigint | number | null> {
    return await this.connection.lastInsertId(
      {
        affectingResults: this.affectingResults,
        selectResults: this.currentSelectResults,
        columns: this.currentColumns,
      },
      name,
    );
  }

  public getAttribute(attribute: string): string | number {
    return this.connection.getAttribute(attribute);
  }

  public setAttribute(attribute: string, value: number | string): boolean {
    return this.connection.setAttribute(attribute, value);
  }

  /**
   * Specifies that the fetch method shall return each row as a key-value object keyed
   * by column name as returned in the corresponding result set.
   * If the result set contains multiple columns with the same name,
   * it returns only a single value per column name.
   */
  public fetchDictionary<T = Dictionary>(): Fetched<T> {
    return this.fetched((row: PdoRowData, columns: string[]): T => {
      return row.reduce(
        (carry: any, val: PdoColumnValue, currentIndex: number) => {
          carry[columns[currentIndex]] = val;
          return carry;
        },
        {},
      );
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
      return row.reduce(
        (carry: Both, val: PdoColumnValue, currentIndex: number) => {
          carry[currentIndex] = val;
          carry[columns[currentIndex]] = val;
          return carry;
        },
        {},
      );
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
  public fetchObject<T>(
    abstract: Newable<T>,
    constructorArgs?: any[],
  ): Fetched<T> {
    return this.fetched((row: PdoRowData, columns: string[]) => {
      const obj = new abstract(...(constructorArgs ?? []));
      this.assignPropsToObj(obj, row, columns);
      return obj;
    });
  }

  /**
   * Allows completely customize the way data is treated on the fly.
   */
  public fetchClosure<T>(fn: (...args: any[]) => T): Fetched<T> {
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
    return this.fetched(
      (
        row: PdoRowData,
        columns: string[],
        duplicatedColumns: string[],
      ): Named => {
        return row.reduce(
          (carry: Named, val: PdoColumnValue, currentIndex: number) => {
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
          },
          {},
        );
      },
      true,
    );
  }

  /**
   * Fetch a two-column results into a key-value object where the first column is a key
   * and the second column is the value.
   */
  public fetchPair<T extends PdoColumnValue, U extends PdoColumnValue>(): Pair<
    T,
    U
  > {
    const columns = this.getCasedColumnsName();

    if (columns.length !== 2) {
      throw new PdoError(
        `With fetchPair(), query results must return 2 columns, [${columns.length}] provided`,
      );
    }

    const map: Pair<T, U> = new Map();

    for (const row of this.fetchAll()) {
      map.set(row[0] as T, row[1] as U);
    }

    return map;
  }

  public resetCursor(): void {
    this.setCursor(null);
  }

  protected fetched<T>(
    callable: (
      row: PdoRowData,
      columns: string[],
      duplicatedColumns: string[],
    ) => T,
    withDuplicated = false,
  ): Fetched<T> {
    return {
      get: () => {
        const row = this.fetch();
        if (row === null) {
          return undefined;
        }
        return callable(
          this.getRowNulled(row),
          this.getCasedColumnsName(),
          withDuplicated ? this.getDuplicatedColumns() : [],
        );
      },
      all: () => {
        return this.fetchAll().map((row: PdoRowData) => {
          return callable(
            this.getRowNulled(row),
            this.getCasedColumnsName(),
            withDuplicated ? this.getDuplicatedColumns() : [],
          );
        });
      },
      group: () => {
        const columns = this.getCasedColumnsName();
        const duplicated = this.getDuplicatedColumns();
        const map: Group<T> = new Map();
        for (const row of this.fetchAll()) {
          const key = row.shift() as PdoColumnValue;
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
        for (const row of this.fetchAll()) {
          map.set(
            row.shift() as PdoColumnValue,
            callable(this.getRowNulled(row), columns, duplicated),
          );
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
          },
        };
      },
    };
  }

  protected getRowNulled(row: PdoRowData): PdoRowData {
    const nullType = this.getAttribute(ATTR_NULLS) as number;
    return nullType === NULL_NATURAL
      ? row
      : row.map((val: PdoColumnValue) => {
          return val === null || (typeof val === 'string' && val === '')
            ? nullType === NULL_EMPTY_STRING
              ? null
              : ''
            : val;
        });
  }

  protected getCasedColumnsName(): string[] {
    const columnCase = this.getAttribute(ATTR_CASE) as number;
    return this.currentColumns.map((column) => {
      return (columnCase & CASE_NATURAL) !== 0
        ? column.name
        : (columnCase & CASE_LOWER) !== 0
          ? column.name.toLowerCase()
          : column.name.toUpperCase();
    });
  }

  protected getDuplicatedColumns(): string[] {
    return this.getCasedColumnsName().filter(
      (element: string, index: number, array: string[]) =>
        array.indexOf(element) !== index,
    );
  }

  protected assignPropsToObj(
    obj: any,
    row: PdoRowData,
    columns: string[],
  ): void {
    for (let x = 0; x < row.length; x++) {
      const key = columns[x];
      if (key in obj) {
        const desc = Object.getOwnPropertyDescriptor(obj, key);
        if (desc === undefined) {
          if (typeof obj[key] === 'function') {
            throw new PdoError(
              `[${obj.constructor.name}.prototype.${key}()] conflict with column name [${key}].`,
            );
          }
        }
      }
      try {
        obj[key] = row[x];
      } catch (error: any) {
        throw new PdoError(error);
      }
    }
  }

  protected fetch(): PdoRowData | null {
    const cursorOrientation = this.getAttribute(ATTR_FETCH_DIRECTION) as number;
    const cursor = this.getTempCursorForFetch(cursorOrientation);

    if (!this.isValidCursor(cursor, cursorOrientation)) {
      cursorOrientation === FETCH_BACKWARD
        ? this.setCursorToStart()
        : this.setCursorToEnd();
      return null;
    }

    this.setCursor(cursor);

    return this.currentSelectResults[cursor];
  }

  protected fetchAll(): PdoRowData[] {
    const cursorOrientation = this.getAttribute(ATTR_FETCH_DIRECTION) as number;
    const cursor = this.getTempCursorForFetch(cursorOrientation);
    if (cursorOrientation === FETCH_BACKWARD) {
      this.setCursorToStart();
      return this.currentSelectResults.slice(0, cursor + 1).reverse();
    }

    this.setCursorToEnd();
    return this.currentSelectResults.slice(cursor);
  }

  protected setCursor(cursor: number | null): void {
    this.cursor = cursor;
  }

  protected setCursorToEnd(): void {
    this.setCursor(this.currentSelectResults.length);
  }

  protected setCursorToStart(): void {
    this.setCursor(-1);
  }

  protected getTempCursorForFetch(cursorOrientation: number): number {
    let cursor = this.cursor;
    if (cursor === null) {
      cursor =
        cursorOrientation === FETCH_BACKWARD
          ? this.currentSelectResults.length
          : -1;
    }

    return cursorOrientation === FETCH_BACKWARD ? cursor - 1 : cursor + 1;
  }

  protected isValidCursor(cursor: number, cursorOrientation: number): boolean {
    return cursorOrientation === FETCH_BACKWARD
      ? cursor > -1
      : cursor < this.currentSelectResults.length;
  }

  protected resetRowset(): void {
    this.rowset = 0;
    this.isRowset = Array.isArray(this.columns[0]);
  }

  protected setCurrentColumns(): void {
    this.currentColumns = this.isRowset
      ? (this.columns as PdoColumnData[][])[this.rowset]
      : (this.columns as PdoColumnData[]);
  }

  protected setCurrentSelectResults(): void {
    this.currentSelectResults = this.isRowset
      ? (this.selectResults as PdoRowData[][])[this.rowset]
      : (this.selectResults as PdoRowData[]);
  }

  public nextRowset(): boolean {
    if (!this.isRowset) {
      return false;
    } else {
      if (this.selectResults.length > this.rowset + 1) {
        this.rowset++;
        this.resetCursor();
        this.setCurrentColumns();
        this.setCurrentSelectResults();

        return true;
      }
      return false;
    }
  }
}
export default PdoStatement;
