type PdoColumnValue = PdoColumnValueSingle | PdoColumnValueArray;
type PdoColumnValueSingle = string | bigint | Buffer | number | null;
type PdoColumnValueArray = (string | bigint | Buffer | number | null)[];

export default PdoColumnValue;
