import PdoAttributes from './pdo-attributes';
import PdoRawConnectionI from './pdo-raw-connection';
import PdoStatementI from './pdo-statement';

export interface ObjectParams {
    [key: string]: ValidBindings;
}

export interface ObjectParamsDescriptor {
    index: number;
    name: string;
    key: string;
    identifier: string;
    aliases: string[];
}

export type ValidBindings = string | bigint | number | boolean | Date | Buffer | null;
export type ArrayParams = ValidBindings[];
export type Params = ArrayParams | ObjectParams;

export type Placeholder = '?';
export type Identifiers = Array<':' | '@' | '$'>;
export type NegativeLooks = Array<'"' | "'" | '`' | '%'>;

export type PdoPreparedStatementConstructor = new (
    connection: PdoRawConnectionI,
    attributes: PdoAttributes
) => PdoPreparedStatementI;

export default interface PdoPreparedStatementI extends PdoStatementI {
    /**
     * Numeric key must start from 1
     */
    bindValue: (key: string | number, value: ValidBindings) => void;

    execute: (params?: Params) => Promise<void>;
}
