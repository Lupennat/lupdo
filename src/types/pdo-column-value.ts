export type PdoColumnValue = PdoColumnValueSingle | PdoColumnValueArray;
export type PdoColumnValueSingle = string | bigint | Buffer | number | null;
export type PdoColumnValueArray = (string | bigint | Buffer | number | null)[];
