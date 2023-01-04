import { PdoError } from '../errors';
import { PdoRawConnectionI } from '../types';
import {
    ArrayParams,
    ObjectParams,
    Params,
    PdoTransactionPreparedStatementI,
    ValidBindings
} from '../types/pdo-prepared-statement';
import PdoStatement from './pdo-statement';

class PdoTransactionPreparedStatement extends PdoStatement implements PdoTransactionPreparedStatementI {
    protected bindedParams: Params | null = null;

    constructor(connection: PdoRawConnectionI, sql: string) {
        super(connection, sql, {}, [], []);
    }

    protected generateBinding(key: string | number, value: ValidBindings, params: Params | null): Params | null {
        value = this.connection.bindValue(value);

        if (typeof key === 'number') {
            if (key - 1 < 0) {
                throw new PdoError('Bind position must be greater than 0.');
            }
            const index = key - 1;
            if (params === null) {
                params = [];
            }

            if (!Array.isArray(params)) {
                throw new PdoError('Mixed Params Numeric and Keyed are forbidden.');
            }

            (params as ArrayParams)[index] = value;
        } else {
            if (params === null) {
                params = {};
            }

            if (Array.isArray(params)) {
                throw new PdoError('Mixed Params Numeric and Keyed are forbidden.');
            }

            (params as ObjectParams)[key] = value;
        }

        return params;
    }

    public bindValue(key: string | number, value: ValidBindings): void {
        this.bindedParams = this.generateBinding(key, value, this.bindedParams);
    }

    public async execute(params?: Params): Promise<void> {
        this.params = null;

        if (params != null) {
            if (Array.isArray(params)) {
                for (let x = 0; x < params.length; x++) {
                    this.params = this.generateBinding(x + 1, params[x], this.params);
                }
            } else {
                for (const key in params) {
                    this.params = this.generateBinding(key, params[key], this.params);
                }
            }
        } else {
            this.params = this.bindedParams;
        }

        [this.affectingResults, this.selectResults, this.columns] = await this.connection.execute(this.params);
        this.resetCursor();
    }
}

export default PdoTransactionPreparedStatement;
