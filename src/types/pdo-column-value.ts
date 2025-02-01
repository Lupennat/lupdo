export type PdoColumnValue = PdoColumnValueSingle | PdoColumnValueArray;
export type PdoColumnValueSingle = string | boolean | Buffer | number | null;
export type PdoColumnValueArray = (string | boolean | Buffer | number | null)[];
