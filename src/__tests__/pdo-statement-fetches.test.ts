import { ATTR_FETCH_DIRECTION, FETCH_BACKWARD, FETCH_FORWARD } from '../constants';
import Pdo from '../pdo';
import { PdoI } from '../types';

import table from './fixtures/config';

describe('Fetch Mode', () => {
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
            pdos[key].setAttribute(ATTR_FETCH_DIRECTION, FETCH_FORWARD);
        }
        Pdo.setLogger(() => {});
    });

    it.each(table)('Works $driver Fetch Direction', async ({ driver }) => {
        let stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        expect(stmt.fetchArray().get()).toEqual([1, 'Edmund', 'Multigender']);
        expect(stmt.fetchArray().get()).toEqual([2, 'Kyleigh', 'Cis man']);
        stmt.setAttribute(ATTR_FETCH_DIRECTION, FETCH_BACKWARD);
        expect(stmt.fetchArray().get()).toEqual([1, 'Edmund', 'Multigender']);
        expect(stmt.fetchArray().get()).toBeUndefined();
        stmt.setAttribute(ATTR_FETCH_DIRECTION, FETCH_FORWARD);
        expect(stmt.fetchArray().get()).toEqual([1, 'Edmund', 'Multigender']);
        expect(stmt.fetchArray().get()).toEqual([2, 'Kyleigh', 'Cis man']);
        pdos[driver].setAttribute(ATTR_FETCH_DIRECTION, FETCH_BACKWARD);
        stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        expect(stmt.fetchArray().get()).toEqual([5, 'Sincere', 'Demi-girl']);
        expect(stmt.fetchArray().get()).toEqual([4, 'Cecile', 'Agender']);
        stmt.setAttribute(ATTR_FETCH_DIRECTION, FETCH_FORWARD);
        expect(stmt.fetchArray().get()).toEqual([5, 'Sincere', 'Demi-girl']);
        expect(stmt.fetchArray().get()).toBeUndefined();
    });

    it.each(table)('Works $driver Fetch All Direction', async ({ driver }) => {
        let stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        let all = stmt.fetchArray().all();
        expect(all.length).toBe(5);
        expect(all[0]).toEqual([1, 'Edmund', 'Multigender']);
        stmt.setAttribute(ATTR_FETCH_DIRECTION, FETCH_BACKWARD);
        all = stmt.fetchArray().all();
        expect(all.length).toBe(5);
        expect(all[0]).toEqual([5, 'Sincere', 'Demi-girl']);
        pdos[driver].setAttribute(ATTR_FETCH_DIRECTION, FETCH_BACKWARD);
        stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        all = stmt.fetchArray().all();
        expect(all.length).toBe(5);
        expect(all[0]).toEqual([5, 'Sincere', 'Demi-girl']);
    });

    it.each(table)('Works $driver Fetch All Direction After Fetch', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        stmt.fetchArray().get();
        stmt.fetchArray().get();
        let all = stmt.fetchArray().all();
        expect(all.length).toBe(3);
        expect(all[0]).toEqual([3, 'Josefa', 'Cisgender male']);
        expect(all[1]).toEqual([4, 'Cecile', 'Agender']);
        expect(all[2]).toEqual([5, 'Sincere', 'Demi-girl']);
        stmt.setAttribute(ATTR_FETCH_DIRECTION, FETCH_BACKWARD);
        stmt.fetchArray().get();
        stmt.fetchArray().get();
        all = stmt.fetchArray().all();
        expect(all.length).toBe(3);
        expect(all[0]).toEqual([3, 'Josefa', 'Cisgender male']);
        expect(all[1]).toEqual([2, 'Kyleigh', 'Cis man']);
        expect(all[2]).toEqual([1, 'Edmund', 'Multigender']);
    });

    it.each(table)('Works $driver Fetched Is Iterable', async ({ driver }) => {
        class User {
            id = 0;
            name = '';
            gender = '';
        }
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        const iterable = stmt.fetchObject(User);
        const [first] = iterable;
        expect(first).toBeInstanceOf(User);
        expect(first.id).toBe(1);
        const [second, third] = iterable;
        expect(second).toBeInstanceOf(User);
        expect(second.id).toBe(2);
        expect(third).toBeInstanceOf(User);
        expect(third.id).toBe(3);
        const users = [];
        for (const user of iterable) {
            expect(user).toBeInstanceOf(User);
            users.push(user);
        }
        expect(users[0].id).toBe(4);
        expect(users[1].id).toBe(5);
        expect(users[2]).toBeUndefined();
    });

    it.each(table)('Works $driver Fetch Array Get', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        expect(stmt.fetchArray().get()).toEqual([1, 'Edmund', 'Multigender']);
        expect(stmt.fetchArray().get()).toEqual([2, 'Kyleigh', 'Cis man']);
    });

    it.each(table)('Works $driver Fetch Array All', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        const all = stmt.fetchArray().all();
        expect(all.length).toBe(5);
        expect(all[0]).toEqual([1, 'Edmund', 'Multigender']);
        expect(all[1]).toEqual([2, 'Kyleigh', 'Cis man']);
    });

    it.each(table)('Works $driver Last Fetch Is Not Lost After New Statement', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        const newStmt = await pdos[driver].query('SELECT * FROM companies limit 5;');
        expect(stmt.fetchArray().get()).toEqual([1, 'Edmund', 'Multigender']);
        expect(newStmt.fetchArray().get()).toEqual([1, 'Satterfield Inc']);
        expect(stmt.fetchArray().get()).toEqual([2, 'Kyleigh', 'Cis man']);
        expect(newStmt.fetchArray().get()).toEqual([2, 'Grimes - Reinger']);
    });

    it.each(table)('Works $driver Fetch Object Get', async ({ driver }) => {
        class User {
            constructor(public test: string) {}
            id = 0;
            name = '';
            gender = '';
        }
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        let user = stmt.fetchObject(User, ['first']).get() as User;
        expect(user).toBeInstanceOf(User);
        expect(user.test).toBe('first');
        expect(user.id).toBe(1);
        expect(user.name).toBe('Edmund');
        expect(user.gender).toBe('Multigender');
        user = stmt.fetchObject(User, ['second']).get() as User;
        expect(user).toBeInstanceOf(User);
        expect(user.test).toBe('second');
        expect(user.id).toBe(2);
        expect(user.name).toBe('Kyleigh');
        expect(user.gender).toBe('Cis man');
    });

    it.each(table)('Works $driver Fetch Object All', async ({ driver }) => {
        class User {
            constructor(public test: string) {}
            id = 0;
            name = '';
            gender = '';
        }
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        const users = stmt.fetchObject(User, ['first']).all();
        expect(users[0]).toBeInstanceOf(User);
        expect(users[0].test).toBe('first');
        expect(users[0].id).toBe(1);
        expect(users[0].name).toBe('Edmund');
        expect(users[0].gender).toBe('Multigender');
        expect(users[1]).toBeInstanceOf(User);
        expect(users[2]).toBeInstanceOf(User);
        expect(users[3]).toBeInstanceOf(User);
        expect(users[4]).toBeInstanceOf(User);
    });
});
