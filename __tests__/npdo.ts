import Npdo from '../src';
import config from '../db/config';
import NpdoTransaction from '../src/drivers/npdo-transaction';
import NpdoPreparedStatement from '../src/drivers/npdo-prepared-statement';

test('Npdo Constructor Mysql', () => {
    let npdo = new Npdo('mysql', config.mysql);
    expect(npdo).toBeInstanceOf(Npdo);
    npdo = new Npdo('mariadb', config.mariadb);
    expect(npdo).toBeInstanceOf(Npdo);
});

test('Npdo Constructor Sqlite', () => {
    let npdo = new Npdo('sqlite3', config.sqlite);
    expect(npdo).toBeInstanceOf(Npdo);
    npdo = new Npdo('sqlite', config.sqlite);
    expect(npdo).toBeInstanceOf(Npdo);
});

test('Npdo Missing Driver', () => {
    expect(() => {
        // @ts-expect-error
        new Npdo('fake', {});
    }).toThrow('Driver [fake] not available.');
});

test('Npdo getAvailableDrivers', () => {
    expect(Npdo.getAvailableDrivers()).toEqual(['mysql', 'mariadb', 'sqlite', 'sqlite3']);
});

test('Npdo setLogger', async () => {
    const err = new Error('Error to be logged');
    const mock = jest.fn();
    Npdo.setLogger(mock);
    const npdo = new Npdo('mysql', config.mysql, {
        destroyed: async uuid => {
            throw err;
        }
    });
    await npdo.query('SELECT 1');
    await npdo.disconnect();
    expect(
        mock.mock.lastCall[0].startsWith('Tarn: resource destroyer threw an exception Error: Error to be logged')
    ).toBeTruthy();
    expect(mock.mock.lastCall[1]).toEqual('warning');
});

test('Npdo attributes', async () => {
    const npdo = new Npdo('mysql', config.mysql, {}, { TEST_ATTRS: 10 });
    expect(npdo.getAttribute('TEST_ATTRS')).toEqual(10);
    npdo.setAttribute('TEST_ATTRS', 15);
    expect(npdo.getAttribute('TEST_ATTRS')).toEqual(15);
});

test('Npdo begin beginTransaction', async () => {
    const npdo = new Npdo('mysql', config.mysql);
    const trx = await npdo.beginTransaction();
    expect(trx).toBeInstanceOf(NpdoTransaction);
    await trx.rollback();
    await npdo.disconnect();
});

test('Npdo disconnect', async () => {
    let tmpUuid;
    const npdo = new Npdo('mysql', config.mysql, {
        created: async uuid => {
            tmpUuid = uuid;
        },
        destroyed: async uuid => {
            expect(uuid).toEqual(tmpUuid);
        }
    });
    await npdo.query('SELECT 1');
    await npdo.disconnect();
});

test('Npdo exec', async () => {
    const npdo = new Npdo('mysql', config.mysql);
    const res = await npdo.exec('SELECT 1');
    expect(typeof res === 'number').toBeTruthy();
    expect(res).toEqual(0);
    await npdo.disconnect();
});

test('Npdo prepare', async () => {
    const npdo = new Npdo('mysql', config.mysql);
    const stmt = await npdo.prepare('SELECT 1');
    expect(stmt).toBeInstanceOf(NpdoPreparedStatement);
    await stmt.execute();
    await npdo.disconnect();
});

test('Npdo debug', async () => {
    console.log = jest.fn();
    console.trace = jest.fn();
    const npdo = new Npdo('mysql', config.mysql, {}, { [Npdo.ATTR_DEBUG]: Npdo.DEBUG_ENABLED });
    await npdo.query('SELECT 1');
    expect(console.log).toHaveBeenCalled();
    await npdo.disconnect();
});
