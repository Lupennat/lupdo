import Pdo from '../pdo';
import { PdoI } from '../types';
import { paramsToString } from '../utils';

describe('Pdo Statement', () => {
    let pdo: PdoI;

    beforeAll(() => {
        pdo = new Pdo('fake', {});
    });

    afterAll(async () => {
        await pdo.disconnect();
    });

    afterEach(() => {
        Pdo.setLogger(() => {});
    });

    it('Works Statement Prepared Statement Execute Without Array', async () => {
        const stmt = await pdo.prepare('SELECT * FROM users LIMIT 3;');
        const stmt2 = await pdo.prepare('SELECT * FROM users LIMIT 5;');
        await stmt.execute();
        await stmt2.execute();

        expect(stmt.fetchArray().all().length).toBe(3);
        expect(stmt.fetchArray().all().length).toBe(0);

        expect(stmt2.fetchArray().all().length).toBe(5);
        expect(stmt2.fetchArray().all().length).toBe(0);

        await stmt.close();
        await stmt2.close();
    });

    it('Works Statement Prepared Statement Bind Numeric Value', async () => {
        let stmt = await pdo.prepare('SELECT * FROM users limit ?;');
        stmt.bindValue(1, 3);
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(3);
        expect(stmt.fetchArray().all().length).toBe(0);
        stmt.bindValue(1, 5);
        await stmt.execute();

        expect(stmt.fetchArray().all().length).toBe(5);
        expect(stmt.fetchArray().all().length).toBe(0);

        await stmt.close();

        stmt = await pdo.prepare('SELECT ? as first, ? as second');
        stmt.bindValue(1, 1);
        stmt.bindValue(2, 2);
        await stmt.execute();
        const res = stmt.fetchArray().all();
        expect(res.length).toBe(1);
        expect(res).toEqual([[1, 2]]);
        await stmt.close();
    });

    it('Works Statement Prepared Statement Bind Numeric Array Value', async () => {
        const stmt = await pdo.prepare('SELECT ? as first, ? as second;');

        interface TestArray {
            first: number[];
            second: number[];
        }

        stmt.bindValue(1, [3, 4, 5]);
        stmt.bindValue(2, [BigInt(10), BigInt(15)]);
        await stmt.execute();

        const res = stmt.fetchDictionary<TestArray>().all();

        expect(res.length).toBe(1);
        expect(res[0].first).toEqual([3, 4, 5]);
        expect(res[0].second).toEqual([10, 15]);

        await stmt.close();
    });

    it('Works Statement Prepared Statement Bind Key Value', async () => {
        let stmt = await pdo.prepare('SELECT * FROM users limit :limit;');
        stmt.bindValue('limit', 3);
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(3);
        expect(stmt.fetchArray().all().length).toBe(0);
        stmt.bindValue('limit', 5);
        await stmt.execute();

        expect(stmt.fetchArray().all().length).toBe(5);
        expect(stmt.fetchArray().all().length).toBe(0);

        await stmt.close();

        stmt = await pdo.prepare('SELECT :first as first, :second as second');
        stmt.bindValue('first', 1);
        stmt.bindValue('second', 2);
        await stmt.execute();
        const res = stmt.fetchArray().all();
        expect(res.length).toBe(1);
        expect(res).toEqual([[1, 2]]);
        await stmt.close();
    });

    it('Works Statement Prepared Statement Bind Key Array Value', async () => {
        const stmt = await pdo.prepare('SELECT :first as first, :second as second;');

        interface TestArray {
            first: number[];
            second: number[];
        }

        stmt.bindValue('first', [3, 4, 5]);
        stmt.bindValue('second', [BigInt(10), BigInt(15)]);
        await stmt.execute();

        const res = stmt.fetchDictionary<TestArray>().all();

        expect(res.length).toBe(1);
        expect(res[0].first).toEqual([3, 4, 5]);
        expect(res[0].second).toEqual([10, 15]);

        await stmt.close();
    });

    it('Works Statement Bind Value Fails Loudly With Mixed Values', async () => {
        let stmt = await pdo.prepare('SELECT * FROM users where gender = ? LIMIT :limit;');
        stmt.bindValue(1, 'Cisgender male');
        expect(() => {
            stmt.bindValue('limit', 3);
        }).toThrow('Mixed Params Numeric and Keyed are forbidden.');

        await stmt.close();

        stmt = await pdo.prepare('SELECT * FROM users where gender = ? LIMIT :limit;');
        stmt.bindValue('limit', 3);
        expect(() => {
            stmt.bindValue(1, 'Cisgender male');
        }).toThrow('Mixed Params Numeric and Keyed are forbidden.');

        await stmt.close();
    });

    it('Works Statement Bind Value With Position Zero Fails Loudly', async () => {
        const stmt = await pdo.prepare('SELECT ?;');

        expect(() => {
            stmt.bindValue(0, 1);
        }).toThrow('Bind position must be greater than 0.');

        await stmt.close();
    });

    it('Works Statement Execute With Numeric Value', async () => {
        const stmt = await pdo.prepare('SELECT * FROM users limit ?;');
        await stmt.execute([3]);
        expect(stmt.fetchArray().all().length).toBe(3);
        expect(stmt.fetchArray().all().length).toBe(0);
        await stmt.execute([5]);

        expect(stmt.fetchArray().all().length).toBe(5);
        expect(stmt.fetchArray().all().length).toBe(0);

        await stmt.close();
    });

    it('Works Statement Execute With Numeric Array Value', async () => {
        const stmt = await pdo.prepare('SELECT ? as first, ? as second;');

        interface TestArray {
            first: number[];
            second: number[];
        }

        await stmt.execute([
            [3, 4, 5],
            [BigInt(10), BigInt(15)]
        ]);

        const res = stmt.fetchDictionary<TestArray>().all();

        expect(res.length).toBe(1);
        expect(res[0].first).toEqual([3, 4, 5]);
        expect(res[0].second).toEqual([10, 15]);

        await stmt.close();
    });

    it('Works Statement Execute With Key Value', async () => {
        const stmt = await pdo.prepare('SELECT * FROM users limit :limit;');

        await stmt.execute({ limit: 3 });
        expect(stmt.fetchArray().all().length).toBe(3);
        expect(stmt.fetchArray().all().length).toBe(0);
        await stmt.execute({ limit: 5 });

        expect(stmt.fetchArray().all().length).toBe(5);
        expect(stmt.fetchArray().all().length).toBe(0);

        await stmt.close();
    });

    it('Works Statement Execute With Key Array Value', async () => {
        const stmt = await pdo.prepare('SELECT :first as first, :second as second;');

        interface TestArray {
            first: number[];
            second: number[];
        }

        await stmt.execute({
            first: [3, 4, 5],
            second: [BigInt(10), BigInt(15)]
        });

        const res = stmt.fetchDictionary<TestArray>().all();

        expect(res.length).toBe(1);
        expect(res[0].first).toEqual([3, 4, 5]);
        expect(res[0].second).toEqual([10, 15]);

        await stmt.close();
    });

    it('Works Statment Execute Preserve Binded Value', async () => {
        const stmt = await pdo.prepare('SELECT * FROM users limit :limit;');
        stmt.bindValue('limit', 3);
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(3);
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(3);
        await stmt.execute({ limit: 5 });
        expect(stmt.fetchArray().all().length).toBe(5);
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(3);
        await stmt.close();
    });

    it('Works Statment Debug Return Correct Parameters', async () => {
        const stmt = await pdo.prepare('SELECT ?, ?, ?, ?, ?, ?;');
        stmt.bindValue(1, 3);
        stmt.bindValue(2, Buffer.from('bufferone'));
        stmt.bindValue(3, new Date('2022-12-12'));
        stmt.bindValue(4, BigInt('4'));
        stmt.bindValue(5, null);
        stmt.bindValue(6, true);
        stmt.bindValue(7, 'stringa');

        expect(stmt.debug()).toBe(
            'SQL: SELECT ?, ?, ?, ?, ?, ?;\nPARAMS:' +
                paramsToString(
                    [3, Buffer.from('bufferone'), new Date('2022-12-12'), BigInt('4'), null, true, 'stringa'],
                    2
                )
        );

        await stmt.execute();

        const stmt2 = await pdo.prepare('SELECT ?, ?, ?, ?, ?, ?;');

        expect(stmt2.debug()).toBe('SQL: SELECT ?, ?, ?, ?, ?, ?;\nPARAMS:[]');

        await stmt2.execute([
            4,
            Buffer.from('bufferone2'),
            new Date('2022-12-11'),
            BigInt('5'),
            null,
            false,
            'stringa2'
        ]);

        expect(stmt2.debug()).toBe(
            'SQL: SELECT ?, ?, ?, ?, ?, ?;\nPARAMS:' +
                paramsToString(
                    [4, Buffer.from('bufferone2'), new Date('2022-12-11'), BigInt('5'), null, false, 'stringa2'],
                    2
                )
        );

        await stmt.close();
        await stmt2.close();
    });

    it('Works Statment Debug Sent return Correct Parameters', async () => {
        const stmt = await pdo.prepare('SELECT ?, ?, ?, ?, ?, ?;');
        stmt.bindValue(1, 3);
        stmt.bindValue(2, Buffer.from('bufferone'));
        stmt.bindValue(3, new Date('2022-12-12'));
        stmt.bindValue(4, BigInt('4'));
        stmt.bindValue(5, null);
        stmt.bindValue(6, true);
        stmt.bindValue(7, 'stringa');

        expect(stmt.debugSent()).toBe(
            'PROCESSED SQL: SELECT ?, ?, ?, ?, ?, ?;\nPARAMS:' +
                paramsToString(['3', 'bufferone', '2022-12-12T00:00:00.000Z', '4', 'null', '1', 'stringa'], 2)
        );

        await stmt.execute();

        const stmt2 = await pdo.prepare('SELECT ?, ?, ?, ?, ?, ?;');

        expect(stmt2.debugSent()).toBe('PROCESSED SQL: SELECT ?, ?, ?, ?, ?, ?;\nPARAMS:[]');

        await stmt2.execute([
            4,
            Buffer.from('bufferone2'),
            new Date('2022-12-11'),
            BigInt('5'),
            null,
            false,
            'stringa2'
        ]);

        expect(stmt2.debugSent()).toBe(
            'PROCESSED SQL: SELECT ?, ?, ?, ?, ?, ?;\nPARAMS:' +
                paramsToString(['4', 'bufferone2', '2022-12-11T00:00:00.000Z', '5', 'null', '0', 'stringa2'], 2)
        );

        await stmt.close();
        await stmt2.close();
    });

    it('Works Statment Prepare Statement Isolation', async () => {
        const trx = await pdo.beginTransaction();

        const stmt = await trx.prepare('SELECT * FROM users limit :limit;');
        stmt.bindValue('limit', 3);
        await stmt.execute();
        expect(stmt.debug()).toBe(
            'SQL: SELECT * FROM users limit :limit;\nPARAMS:' + JSON.stringify({ limit: 3 }, null, 2)
        );

        const stmt2 = await trx.prepare('SELECT * FROM users limit :limit;');
        stmt2.bindValue('limit', 5);
        await stmt2.execute();
        expect(stmt2.debug()).toBe(
            'SQL: SELECT * FROM users limit :limit;\nPARAMS:' + JSON.stringify({ limit: 5 }, null, 2)
        );

        expect(stmt.fetchArray().all().length).toBe(3);
        expect(stmt2.fetchArray().all().length).toBe(5);

        await trx.rollback();
    });

    it('Works Statement Bind Number', async () => {
        let stmt = await pdo.prepare('SELECT * FROM users limit :limit;');
        stmt.bindValue('limit', BigInt(3));
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(3);
        await stmt.close();
        stmt = await pdo.prepare('SELECT ?;');
        await stmt.execute([1]);
        expect(stmt.fetchColumn(0).get()).toBe(1);
        await stmt.close();
    });

    it('Works Statement Bind BigInter', async () => {
        let stmt = await pdo.prepare('SELECT * FROM users limit :limit;');
        stmt.bindValue('limit', BigInt(3));
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(3);
        await stmt.close();
        stmt = await pdo.prepare('SELECT ?;');
        await stmt.execute([BigInt(1234567890123123)]);
        expect(stmt.fetchColumn(0).get()).toBe('1234567890123123');
        await stmt.close();
    });

    it('Works Statement Bind Date', async () => {
        let stmt = await pdo.prepare('SELECT * FROM companies where opened > ?;');
        const date = new Date('2014-01-01');
        stmt.bindValue(1, date);
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(10);
        await stmt.close();
        stmt = await pdo.prepare('SELECT TIMESTAMP(?);');
        await stmt.execute([date]);
        expect(new Date(stmt.fetchColumn(0).get() as string)).toEqual(date);
        await stmt.close();
    });

    it('Works Statement Bind Boolean', async () => {
        let stmt = await pdo.prepare('SELECT * FROM companies where active = ?;');
        stmt.bindValue(1, false);
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(5);
        await stmt.close();
        stmt = await pdo.prepare('SELECT ?;');
        await stmt.execute([true]);
        expect(stmt.fetchColumn(0).get()).toEqual(1);
        await stmt.close();
    });

    it('Works Statement Bind Buffer', async () => {
        let stmt = await pdo.prepare('select `id` from users where `name` = "?";');
        stmt.bindValue(1, 'Edmund');
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(1);
        await stmt.close();
        stmt = await pdo.prepare('SELECT LOWER("?");');
        await stmt.execute(['Edmund']);
        expect(stmt.fetchColumn(0).get()).toEqual('edmund');
        await stmt.close();
    });

    it('Works Statement Buffer', async () => {
        let stmt = await pdo.prepare('select `id` from users where `name` = "?";');
        const buffer = Buffer.from('Edmund');
        stmt.bindValue(1, buffer);
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(1);
        await stmt.close();
        stmt = await pdo.prepare('SELECT LOWER("?");');
        await stmt.execute([buffer]);
        expect(stmt.fetchColumn(0).get()).toEqual(buffer.toString().toLowerCase());
        await stmt.close();
    });

    it('Works Statement Bind null', async () => {
        let stmt = await pdo.prepare(
            'INSERT INTO `companies` (`name`, `opened`, `active`, `binary`) VALUES (?,?,?,?);'
        );
        stmt.bindValue(1, 'Test');
        stmt.bindValue(2, '2000-12-26T00:00:00.000Z');
        stmt.bindValue(3, 1);
        stmt.bindValue(4, null);
        await stmt.execute();
        await stmt.close();
        const id = await stmt.lastInsertId();
        stmt = await pdo.prepare('SELECT * FROM companies where id = ?');
        await stmt.execute([id]);
        expect(stmt.fetchArray().all()).toEqual([[20, 'test', '2000-12-26t00:00:00.000z', 1, null]]);
        // expect(stmt.fetchArray().all().length).toBe(19);
        await stmt.close();
        stmt = await pdo.prepare('SELECT ?;');
        await stmt.execute([null]);
        expect(stmt.fetchColumn(0).get()).toEqual(null);
        await stmt.close();
    });
});
