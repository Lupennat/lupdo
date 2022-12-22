import {
    ATTR_CASE,
    ATTR_FETCH_DIRECTION,
    ATTR_NULLS,
    CASE_LOWER,
    CASE_NATURAL,
    CASE_UPPER,
    FETCH_BACKWARD,
    FETCH_FORWARD,
    NULL_EMPTY_STRING,
    NULL_NATURAL,
    NULL_TO_STRING
} from '../constants';
import Pdo from '../pdo';
import { PdoI } from '../types';
import { Both, Dictionary, Named } from '../types/pdo-statement';

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
            pdos[key].setAttribute(ATTR_CASE, CASE_NATURAL);
            pdos[key].setAttribute(ATTR_NULLS, NULL_NATURAL);
        }
        Pdo.setLogger(() => {});
    });

    it.each(table)('Works $driver Fetch Column Case', async ({ driver }) => {
        let stmt = await pdos[driver].query('SELECT gender as camElCol FROM users LIMIT 5;');
        expect('camElCol' in (stmt.fetchDictionary().get() as Dictionary)).toBeTruthy();
        expect('camelcol' in (stmt.fetchDictionary().get() as Dictionary)).toBeFalsy();
        expect('CAMELCOL' in (stmt.fetchDictionary().get() as Dictionary)).toBeFalsy();
        expect('camElCol' in stmt.fetchDictionary().all()[0]).toBeTruthy();

        stmt = await pdos[driver].query('SELECT gender as camElCol FROM users LIMIT 5;');
        stmt.setAttribute(ATTR_CASE, CASE_LOWER);
        expect('camElCol' in (stmt.fetchDictionary().get() as Dictionary)).toBeFalsy();
        expect('camelcol' in (stmt.fetchDictionary().get() as Dictionary)).toBeTruthy();
        expect('CAMELCOL' in (stmt.fetchDictionary().get() as Dictionary)).toBeFalsy();
        expect('camelcol' in stmt.fetchDictionary().all()[0]).toBeTruthy();

        stmt = await pdos[driver].query('SELECT gender as camElCol FROM users LIMIT 5;');
        stmt.setAttribute(ATTR_CASE, CASE_UPPER);
        expect('camElCol' in (stmt.fetchDictionary().get() as Dictionary)).toBeFalsy();
        expect('camelcol' in (stmt.fetchDictionary().get() as Dictionary)).toBeFalsy();
        expect('CAMELCOL' in (stmt.fetchDictionary().get() as Dictionary)).toBeTruthy();
        expect('CAMELCOL' in stmt.fetchDictionary().all()[0]).toBeTruthy();
    });

    it.each(table)('Works $driver Fetch Row Null', async ({ driver }) => {
        let stmt = await pdos[driver].query(
            "SELECT NULL as `field1`, '' as `field2`, 1 as `field3` FROM users LIMIT 5;"
        );
        expect(stmt.fetchArray().get()).toEqual([null, '', 1]);
        expect(stmt.fetchArray().all()[0]).toEqual([null, '', 1]);
        stmt = await pdos[driver].query("SELECT NULL as `field1`, '' as `field2`, 1 as `field3` FROM users LIMIT 5;");
        stmt.setAttribute(ATTR_NULLS, NULL_EMPTY_STRING);
        expect(stmt.fetchArray().get()).toEqual([null, null, 1]);
        expect(stmt.fetchArray().all()[0]).toEqual([null, null, 1]);
        stmt = await pdos[driver].query("SELECT NULL as `field1`, '' as `field2`, 1 as `field3` FROM users LIMIT 5;");
        stmt.setAttribute(ATTR_NULLS, NULL_TO_STRING);
        expect(stmt.fetchArray().get()).toEqual(['', '', 1]);
        expect(stmt.fetchArray().all()[0]).toEqual(['', '', 1]);
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

    it.each(table)('Works $driver Last Fetch Is Not Lost After New Statement', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        const newStmt = await pdos[driver].query('SELECT * FROM companies limit 5;');
        expect(stmt.fetchArray().get()).toEqual([1, 'Edmund', 'Multigender']);
        expect(newStmt.fetchArray().get()).toEqual([1, 'Satterfield Inc']);
        expect(stmt.fetchArray().get()).toEqual([2, 'Kyleigh', 'Cis man']);
        expect(newStmt.fetchArray().get()).toEqual([2, 'Grimes - Reinger']);
    });

    it.each(table)('Works $driver Fetch Group', async ({ driver }) => {
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

    it.each(table)('Works $driver Fetch Unique', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        const unique = stmt.fetchArray().unique();
        expect(unique).toBeInstanceOf(Map);
        expect(unique.get(1)).toEqual(['Edmund', 'Multigender']);
        expect(unique.get(5)).toEqual(['Sincere', 'Demi-girl']);
    });

    it.each(table)('Works $driver Fetch Group', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT gender, users.* FROM users limit 10;');
        const group = stmt.fetchArray().group();
        expect(group).toBeInstanceOf(Map);
        expect(group.get('Cisgender male')).toEqual([
            [3, 'Josefa', 'Cisgender male'],
            [6, 'Baron', 'Cisgender male']
        ]);
        expect(group.get('Multigender')).toEqual([[1, 'Edmund', 'Multigender']]);
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

    it.each(table)('Works $driver Fetch Array', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        expect(stmt.fetchArray().get()).toEqual([1, 'Edmund', 'Multigender']);
        expect(stmt.fetchArray().get()).toEqual([2, 'Kyleigh', 'Cis man']);
    });

    it.each(table)('Works $driver Fetch Json', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        expect(stmt.fetchDictionary().get()).toEqual({ id: 1, name: 'Edmund', gender: 'Multigender' });
        expect(stmt.fetchDictionary().get()).toEqual({ id: 2, name: 'Kyleigh', gender: 'Cis man' });
    });

    it.each(table)('Works $driver Fetch Both', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        const obj = stmt.fetchBoth().get() as Both;
        expect(obj.id).toBe(1);
        expect(obj[0]).toBe(1);
        expect(obj.name).toBe('Edmund');
        expect(obj[1]).toBe('Edmund');
        expect(obj.gender).toBe('Multigender');
        expect(obj[2]).toBe('Multigender');
    });

    it.each(table)('Works $driver Fetch Column', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        expect(stmt.fetchColumn<number>(0).get()).toBe(1);
        expect(stmt.fetchColumn<number>(1).get()).toBe('Kyleigh');
        expect(stmt.fetchColumn<number>(4).get).toThrow('Column 4 does not exists.');
    });

    it.each(table)('Works $driver Fetch Object', async ({ driver }) => {
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

    it.each(table)('Works $driver Fetch Object Fails Loudly', async ({ driver }) => {
        class User {
            id(): void {}
        }

        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');

        expect(() => {
            stmt.fetchObject(User).get();
        }).toThrow('[User.prototype.id()] conflict with column name [id].');

        class UserGetter {
            get id(): string {
                return 'id';
            }
        }
        expect(() => {
            stmt.fetchObject(UserGetter).get();
        }).toThrow('Cannot set property id of #<UserGetter> which has only a getter');
    });

    it.each(table)('Works $driver Fetch Closure', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT * FROM users limit 5;');
        expect(
            stmt
                .fetchClosure<[number, string, string]>((first: number, second: string, third: string) => {
                    return [first, second, third];
                })
                .get()
        ).toEqual([1, 'Edmund', 'Multigender']);
    });

    it.each(table)('Works $driver Fetch Named', async ({ driver }) => {
        let stmt = await pdos[driver].query("SELECT * FROM users, companies where users.name = 'Edmund';");
        const obj = stmt.fecthNamed().get() as Named;
        expect(obj.id).toEqual([1, 1]);
        expect(obj.name).toEqual(['Edmund', 'Satterfield Inc']);
        expect(obj.gender).toBe('Multigender');
        stmt = await pdos[driver].query("SELECT * FROM users, companies where users.name = 'Edmund';");
        const totalCompanies = (await pdos[driver].query('SELECT count(*) FROM companies;'))
            .fetchColumn<number>(0)
            .get() as number;

        expect(stmt.fecthNamed().all().length).toBe(totalCompanies);
    });

    it.each(table)('Works $driver Fetch Pair', async ({ driver }) => {
        const stmt = await pdos[driver].query('SELECT name, gender FROM users LIMIT 5;');
        const pair = stmt.fetchPair<string, string>();
        expect(pair).toBeInstanceOf(Map);
        expect(Array.from(pair.keys())).toEqual(['Edmund', 'Kyleigh', 'Josefa', 'Cecile', 'Sincere']);
        expect(Array.from(pair.values())).toEqual(['Multigender', 'Cis man', 'Cisgender male', 'Agender', 'Demi-girl']);
    });

    it.each(table)('Works $driver Fetch Pair Fails Loudly', async ({ driver }) => {
        let stmt = await pdos[driver].query('SELECT id, name, gender FROM users LIMIT 5;');

        expect(() => {
            stmt.fetchPair();
        }).toThrow('With fetchPair(), query results must return 2 columns, [3] provided');

        stmt = await pdos[driver].query('SELECT id FROM users LIMIT 5;');
        expect(() => {
            stmt.fetchPair();
        }).toThrow('With fetchPair(), query results must return 2 columns, [1] provided');
    });
});
