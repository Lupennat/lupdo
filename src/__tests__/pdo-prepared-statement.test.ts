import { ATTR_CASE, CASE_NATURAL } from '../constants';
import Pdo from '../pdo';
import { PdoI } from '../types';

import table from './fixtures/config';

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

    // it.each(table)('Works $driver Statement Prepared Statement Execute Without Array', async ({ driver }) => {
    //     const stmt = await pdos[driver].prepare('SELECT * FROM users limit ?;');

    //     try {
    //         await stmt.execute();
    //     } catch (error) {
    //         console.log(error);
    //     }

    //     // expect(stmt.fetchArray().all().length).toBe(3);
    //     // expect(stmt.fetchArray().all().length).toBe(0);
    // });

    it.each(table)('Works $driver Statement Prepared Statement Bind Numeric Value', async ({ driver }) => {
        const stmt = await pdos[driver].prepare('SELECT * FROM users limit ?;');
        stmt.bindValue(0, 3);
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(3);
        expect(stmt.fetchArray().all().length).toBe(0);
    });
});
