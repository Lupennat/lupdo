import Npdo from '../src';
import config from '../db/config';
import NpdoError from '../src/npdo-error';

test('Npdo Constructor Mysql', () => {
    const npdo = new Npdo('mysql', config.mysql);
    expect(npdo).toBeInstanceOf(Npdo);
    expect(() => {
        // @ts-expect-error
        new Npdo('fake', {});
    }).toThrow('Driver [fake] not available.');
});

test('Npdo Constructor Sqlite', () => {
    const npdo = new Npdo('sqlite3', config.sqlite);
    expect(npdo).toBeInstanceOf(Npdo);
});

test('Npdo getAvailableDrivers', () => {
    expect(Npdo.getAvailableDrivers()).toEqual(['mysql', 'mariadb', 'sqlite', 'sqlite3']);
});

test('Npdo setLogger', async () => {
    const logs: any[] = [];
    const err = new Error('Error to be logged');
    Npdo.setLogger((msg: any, level: any): void => {
        logs.push({
            message: msg.message,
            cause: msg.cause,
            level: level
        });
    });
    const npdo = new Npdo('mysql', config.mysql, {
        created: async (uuid, connection) => {
            throw err;
        }
    });
    await npdo.query('SELECT 1');
    await npdo.disconnect();
    while (logs.length === 0) {}
    expect(logs[0].message).toEqual('Created Callback Error.');
    expect(logs[0].cause).toEqual(err);
    expect(logs[0].level).toEqual('error');
});

test('Npdo attributes', async () => {
    const npdo = new Npdo('mysql', config.mysql, {}, { TEST_ATTRS: 10 });
    expect(npdo.getAttribute('TEST_ATTRS')).toEqual(10);
    npdo.setAttribute('TEST_ATTRS', 15);
    expect(npdo.getAttribute('TEST_ATTRS')).toEqual(15);
});
