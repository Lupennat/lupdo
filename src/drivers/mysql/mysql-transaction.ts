import NpdoTransaction from '../npdo-transaction';

class MysqlTransaction extends NpdoTransaction {
    async commit(): Promise<void> {
        try {
            return await this.connection.commit();
        } catch (error) {
            if (error !== null && (error as any).errno === 1305) {
                this.connection.log(
                    'Transaction was implicitly committed, do not mix transactions and DDL with MySQL (#805)',
                    'warning'
                );
                return;
            }
            throw error;
        }
    }
}

export = MysqlTransaction;
