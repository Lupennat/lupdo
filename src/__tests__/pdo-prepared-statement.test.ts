import Pdo from '../pdo';
import { PdoI } from '../types';

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
        let stmt = await pdo.prepare('SELECT * FROM company where opened > ?;');
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
        let stmt = await pdo.prepare('SELECT * FROM company where active = ?;');
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
});
