import { ATTR_CASE, ATTR_FETCH_DIRECTION, CASE_LOWER, CASE_NATURAL, FETCH_BACKWARD } from '../constants';
import Pdo from '../pdo';
import { PdoI } from '../types';

import table, { insertSql } from './fixtures/config';

describe('Pdo Statement', () => {
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
        for (const key in pdos) {
            pdos[key].setAttribute(ATTR_CASE, CASE_NATURAL);
        }
        Pdo.setLogger(() => {});
    });

    it.each(table)('Works $driver Statement Debug', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        expect(stmt.debug()).toBe('SQL: SELECT * FROM users limit 5;\nPARAMS:[]');
    });

    it.each(table)('Works $driver Statement Get Attribute is Localized', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        const stmtFetchMode = stmt.getAttribute(ATTR_CASE);
        expect(pdos[driver].getAttribute(ATTR_CASE)).toBe(stmtFetchMode);
        pdos[driver].setAttribute(ATTR_CASE, CASE_LOWER);
        expect(pdos[driver].getAttribute(ATTR_CASE)).toBe(CASE_LOWER);
        expect(stmt.getAttribute(ATTR_CASE)).toBe(stmtFetchMode);
    });

    it.each(table)('Works $driver Statement Set Attribute is Localized', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        const pdoFetchMode = pdos[driver].getAttribute(ATTR_CASE);
        expect(stmt.getAttribute(ATTR_CASE)).toBe(pdoFetchMode);
        const res = stmt.setAttribute(ATTR_CASE, CASE_LOWER);
        expect(res).toBeTruthy();
        expect(stmt.getAttribute(ATTR_CASE)).toBe(CASE_LOWER);
        expect(pdos[driver].getAttribute(ATTR_CASE)).toBe(pdoFetchMode);
        expect(stmt.setAttribute('NOT_EXISTS', 1)).toBeFalsy();
    });

    it.each(table)('Works $driver Statement Last Insert Id', async ({ driver }) => {
        let trx = await pdos[driver].beginTransaction();
        let stmt = await trx.query('SELECT * FROM users limit 5;');

        expect(stmt.lastInsertId()).toBe(null);
        stmt = await trx.query('SELECT count(*) as total from users');
        const lastId = stmt.fetchColumn<number>(0).get() as number;
        stmt = await trx.query(insertSql(driver, 'users', ['name', 'gender'], ['Claudio', 'All']));
        expect(stmt.lastInsertId()).toBeGreaterThan(lastId);
        await trx.rollback();
    });

    it.each(table)('Works $driver Statement Row Count', async ({ driver }) => {
        let trx = await pdos[driver].beginTransaction();
        let stmt = await trx.query('SELECT * FROM users limit 5;');
        expect(stmt.rowCount()).toBe(0);
        stmt = await trx.query(insertSql(driver, 'users', ['name', 'gender'], ['Claudio', 'All']));
        expect(stmt.rowCount()).toBe(1);
        await trx.rollback();
    });

    it.each(table)('Works $driver Column Count', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        expect(stmt.columnCount()).toBe(3);
    });

    it.each(table)('Works $driver Get Column Meta', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        expect(stmt.getColumnMeta(0)?.name).toBe('id');
        expect(stmt.getColumnMeta(1)?.name).toBe('name');
        expect(stmt.getColumnMeta(5)).toBeNull();
    });

    it.each(table)('Works $driver Reset Cursor', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        const fetch = stmt.fetchArray();
        expect(fetch.get()).toEqual([1, 'Edmund', 'Multigender']);
        fetch.all();
        expect(fetch.get()).toBeUndefined();
        stmt.resetCursor();
        expect(fetch.get()).toEqual([1, 'Edmund', 'Multigender']);
        stmt.setAttribute(ATTR_FETCH_DIRECTION, FETCH_BACKWARD);
        stmt.resetCursor();
        expect(fetch.get()).toEqual([5, 'Sincere', 'Demi-girl']);
        fetch.all();
        expect(fetch.get()).toBeUndefined();
        stmt.resetCursor();
        expect(fetch.get()).toEqual([5, 'Sincere', 'Demi-girl']);
    });
});
