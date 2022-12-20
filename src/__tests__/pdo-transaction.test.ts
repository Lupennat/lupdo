import PdoPreparedStatement from '../drivers/pdo-prepared-statement';
import PdoStatement from '../drivers/pdo-statement';
import PdoTransaction from '../drivers/pdo-transaction';
import Pdo from '../pdo';

import table, { insertSql } from './fixtures/config';

describe('Pdo Transactions', () => {
    it.each(table)('Works $driver Transaction Rollback', async ({ driver, config }) => {
        const pdo = new Pdo(driver, config);
        const countBefore = await pdo.query('SELECT count(*) as total from users');
        const counter = countBefore.fetchColumn(0) as number;
        const trx = await pdo.beginTransaction();
        expect(trx).toBeInstanceOf(PdoTransaction);
        const executed = await trx.exec(insertSql(driver, 'users', ['name', 'gender'], ['Claudio', 'All']));
        expect(executed).toBe(1);
        await trx.rollback();
        const countAfter = await pdo.query('SELECT count(*) as total from users');
        expect(countAfter.fetchColumn(0)).toBe(counter);
        await pdo.disconnect();
    });

    it.each(table)('Works $driver Transaction Commit', async ({ driver, config }) => {
        const pdo = new Pdo(driver, config);
        const countBefore = await pdo.query('SELECT count(*) as total from users');
        const counter = countBefore.fetchColumn(0) as number;
        const trx = await pdo.beginTransaction();
        expect(trx).toBeInstanceOf(PdoTransaction);
        const executed = await trx.exec(insertSql(driver, 'users', ['name', 'gender'], ['Claudio', 'All']));
        expect(executed).toBe(1);
        await trx.commit();
        const countAfter = await pdo.query('SELECT count(*) as total from users');
        expect(countAfter.fetchColumn(0)).toBe(counter + 1);
        const stmt = await pdo.query("SELECT `id` from users where `name` = 'Claudio';");
        const id = stmt.fetchColumn(0) as number;
        expect(await pdo.exec('DELETE FROM users WHERE (`id` = ' + id + ');')).toBe(1);
        await pdo.disconnect();
    });

    it.each(table)('Works $driver Transaction Exec Return Number', async ({ driver, config }) => {
        const pdo = new Pdo(driver, config);
        const trx = await pdo.beginTransaction();
        const res = await trx.exec('SELECT 1');
        expect(typeof res === 'number').toBeTruthy();
        expect(res).toEqual(0);
        await trx.rollback();
        await pdo.disconnect();
    });

    it.each(table)('Works $driver Transaction Query Return PdoStatement', async ({ driver, config }) => {
        const pdo = new Pdo(driver, config);
        const trx = await pdo.beginTransaction();
        const stmt = await trx.query('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoStatement);
        await trx.rollback();
        await pdo.disconnect();
    });

    it.each(table)('Works $driver Transaction Prepare Return PdoPreparedStatement', async ({ driver, config }) => {
        const pdo = new Pdo(driver, config);
        const trx = await pdo.beginTransaction();
        const stmt = await trx.prepare('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoPreparedStatement);
        await stmt.execute();
        await trx.rollback();
        await pdo.disconnect();
    });
});
