import Pdo from '../pdo';
import { PdoStatement, PdoTransaction, PdoTransactionPreparedStatement } from '../support';
import { PdoI, PdoRawConnectionI } from '../types';
import FakeDriver from './fixtures/fake-driver';
import FakeRawConnection from './fixtures/fake-raw-connection';

describe('Pdo Transactions', () => {
    let pdo: PdoI;

    beforeAll(() => {
        class StubBeginFakeRawConnection extends FakeRawConnection {
            protected async doBeginTransaction(): Promise<void> {
                throw new Error('Begin Transaction Error');
            }
        }
        class StubBeginFakeDriver extends FakeDriver {
            public getRawConnection(): PdoRawConnectionI {
                return new StubBeginFakeRawConnection(this.pool);
            }
        }

        class StubCommitRawConnection extends FakeRawConnection {
            protected async doCommit(): Promise<void> {
                throw new Error('Commit Error');
            }
        }

        class StubCommitFakeDriver extends FakeDriver {
            public getRawConnection(): PdoRawConnectionI {
                return new StubCommitRawConnection(this.pool);
            }
        }

        class StubRollbackRawConnection extends FakeRawConnection {
            protected async doRollback(): Promise<void> {
                throw new Error('Rollback Error');
            }
        }

        class StubRollbackFakeDriver extends FakeDriver {
            public getRawConnection(): PdoRawConnectionI {
                return new StubRollbackRawConnection(this.pool);
            }
        }

        Pdo.addDriver('stubBegin', StubBeginFakeDriver);
        Pdo.addDriver('stubCommit', StubCommitFakeDriver);
        Pdo.addDriver('stubRollback', StubRollbackFakeDriver);

        pdo = new Pdo('fake', {});
    });

    afterAll(async () => {
        await pdo.disconnect();
    });

    afterEach(() => {
        Pdo.setLogger(() => {});
    });

    it('Works Transaction Rollback && Commit', async () => {
        const countBefore = await pdo.query('SELECT count(*) as total from users');
        const counter = countBefore.fetchColumn<number>(0).get() as number;
        let trx = await pdo.beginTransaction();
        expect(trx).toBeInstanceOf(PdoTransaction);
        let executed = await trx.exec('INSERT INTO `users` (`name`, `gender`) VALUES ("Claudio", "All");');
        expect(executed).toBe(1);
        await trx.rollback();
        let countAfter = await pdo.query('SELECT count(*) as total from users');
        expect(countAfter.fetchColumn<number>(0).get()).toBe(counter);

        trx = await pdo.beginTransaction();
        expect(trx).toBeInstanceOf(PdoTransaction);
        executed = await trx.exec('INSERT INTO `users` (`name`, `gender`) VALUES ("Claudio", "All");');
        expect(executed).toBe(1);
        await trx.commit();
        countAfter = await pdo.query('SELECT count(*) as total from users');
        expect(countAfter.fetchColumn<number>(0).get()).toBe(counter + 1);

        const stmt = await pdo.query("SELECT `id` from users where `name` = 'Claudio';");
        const id = stmt.fetchColumn<number>(0).get() as number;
        expect(await pdo.exec('DELETE FROM users WHERE (`id` = ' + id + ');')).toBe(1);
    });

    it('Works Transaction Exec Return Number', async () => {
        const trx = await pdo.beginTransaction();
        const res = await trx.exec('SELECT 1');
        expect(typeof res === 'number').toBeTruthy();
        expect(res).toEqual(0);
        await trx.rollback();
    });

    it('Works Transaction Query Return PdoStatement', async () => {
        const trx = await pdo.beginTransaction();
        const stmt = await trx.query('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoStatement);
        await trx.rollback();
    });

    it('Works Transaction Prepare Return PdoTransactionPreparedStatement', async () => {
        const trx = await pdo.beginTransaction();
        const stmt = await trx.prepare('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoTransactionPreparedStatement);
        await stmt.execute();
        await trx.rollback();
    });

    it('Works Transaction Error On Begin Transaction', async () => {
        const pdoStub = new Pdo('stubBegin', {});
        await expect(pdoStub.beginTransaction()).rejects.toThrow('Begin Transaction Error');
        await pdoStub.disconnect();
    });

    it('Works Transaction Error On Commit', async () => {
        const pdoStub = new Pdo('stubCommit', {});
        const trx = await pdoStub.beginTransaction();
        await expect(trx.commit()).rejects.toThrow('Commit Error');
        await pdoStub.disconnect();
    });

    it('Works Transaction Error On Rollback', async () => {
        const pdoStub = new Pdo('stubRollback', {});
        const trx = await pdoStub.beginTransaction();
        await expect(trx.rollback()).rejects.toThrow('Rollback Error');
        await pdoStub.disconnect();
    });
});
