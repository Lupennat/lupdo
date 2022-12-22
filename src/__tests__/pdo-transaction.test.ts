import PdoPreparedStatement from '../drivers/pdo-prepared-statement';
import PdoStatement from '../drivers/pdo-statement';
import PdoTransaction from '../drivers/pdo-transaction';
import Pdo from '../pdo';
import { PdoI } from '../types';

import table, { insertSql } from './fixtures/config';

describe('Pdo Transactions', () => {
    const pdos: { [key: string]: PdoI } = {};

    beforeAll(() => {
        table.forEach(item => {
            pdos[item.driver] = new Pdo(item.driver, item.config);
        });
    });

    afterAll(async () => {
        const promises = [];
        for (const key in pdos) {
            promises.push(pdos[key].disconnect());
        }

        await Promise.all(promises);
    });

    afterEach(() => {
        Pdo.setLogger(() => {});
    });

    it.each(table)('Works $driver Transaction Rollback', async ({ driver }) => {
        const countBefore = await pdos[driver].query('SELECT count(*) as total from users');
        const counter = countBefore.fetchColumn<number>(0).get() as number;
        const trx = await pdos[driver].beginTransaction();
        expect(trx).toBeInstanceOf(PdoTransaction);
        const executed = await trx.exec(insertSql(driver, 'users', ['name', 'gender'], ['Claudio', 'All']));
        expect(executed).toBe(1);
        await trx.rollback();
        const countAfter = await pdos[driver].query('SELECT count(*) as total from users');
        expect(countAfter.fetchColumn<number>(0).get()).toBe(counter);
    });

    it.each(table)('Works $driver Transaction Commit', async ({ driver }) => {
        const countBefore = await pdos[driver].query('SELECT count(*) as total from users');
        const counter = countBefore.fetchColumn<number>(0).get() as number;
        const trx = await pdos[driver].beginTransaction();
        expect(trx).toBeInstanceOf(PdoTransaction);
        const executed = await trx.exec(insertSql(driver, 'users', ['name', 'gender'], ['Claudio', 'All']));
        expect(executed).toBe(1);
        await trx.commit();
        const countAfter = await pdos[driver].query('SELECT count(*) as total from users');
        expect(countAfter.fetchColumn<number>(0).get()).toBe(counter + 1);
        const stmt = await pdos[driver].query("SELECT `id` from users where `name` = 'Claudio';");
        const id = stmt.fetchColumn<number>(0).get() as number;
        expect(await pdos[driver].exec('DELETE FROM users WHERE (`id` = ' + id + ');')).toBe(1);
    });

    it.each(table)('Works $driver Transaction Exec Return Number', async ({ driver }) => {
        const trx = await pdos[driver].beginTransaction();
        const res = await trx.exec('SELECT 1');
        expect(typeof res === 'number').toBeTruthy();
        expect(res).toEqual(0);
        await trx.rollback();
    });

    it.each(table)('Works $driver Transaction Query Return PdoStatement', async ({ driver }) => {
        const trx = await pdos[driver].beginTransaction();
        const stmt = await trx.query('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoStatement);
        await trx.rollback();
    });

    it.each(table)('Works $driver Transaction Prepare Return PdoPreparedStatement', async ({ driver }) => {
        const trx = await pdos[driver].beginTransaction();
        const stmt = await trx.prepare('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoPreparedStatement);
        await stmt.execute();
        await trx.rollback();
    });
});
