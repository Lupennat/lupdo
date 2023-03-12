import { ATTR_CASE, ATTR_DEBUG, ATTR_DRIVER_NAME, CASE_LOWER, CASE_NATURAL, DEBUG_ENABLED } from '../constants';
import { PdoError } from '../errors';
import Pdo from '../pdo';
import { PdoPreparedStatement, PdoStatement, PdoTransaction } from '../support';
import { PdoLogger } from '../types/pdo';
import { PdoDriverConstructor } from '../types/pdo-driver';
import { createFakePdo } from './fixtures';
import FakeDBConnection from './fixtures/fake-db-connection';
import FakeDriver from './fixtures/fake-driver';

describe('Pdo Api', () => {
    it('Works Missing Driver', () => {
        expect(() => {
            new Pdo('notexist', {});
        }).toThrow('Driver [notexist] not available.');
    });

    it('Works GetAvailableDrivers', () => {
        expect(Pdo.getAvailableDrivers()).toEqual(['fake']);
    });

    it('Works Add Driver', () => {
        class MockPdo extends Pdo {
            public static listDrivers(): { [key: string]: PdoDriverConstructor } {
                return MockPdo.availableDrivers;
            }
        }

        MockPdo.addDriver('fakeTestNotOverride', FakeDriver);
        expect(MockPdo.getAvailableDrivers().includes('fakeTestNotOverride')).toBeTruthy();

        class Test {}
        // @ts-expect-error is not a valid driver constructor
        MockPdo.addDriver('fakeTestNotOverride', Test);
        expect(MockPdo.listDrivers()['fakeTestNotOverride']).toEqual(FakeDriver);
    });

    it('Works Constructor', () => {
        const pdo = new Pdo('fake', {});
        expect(pdo).toBeInstanceOf(Pdo);
    });

    it('Works Pdo Not Log By Default', async () => {
        class PdoStub extends Pdo {
            static getLogger(): PdoLogger {
                return this.logger;
            }
        }
        const originalLogger = PdoStub.getLogger();

        const err = new Error('Error to be logged');

        Pdo.setLogger((level: any, message: any) => {
            expect(originalLogger(level, message)).toBeUndefined();
        });

        const pdo = new PdoStub(
            'fake',
            {},
            {
                destroyed: async () => {
                    throw err;
                }
            }
        );
        await pdo.query('SELECT 1');
        await pdo.disconnect();
    });

    it('Works SetLogger', async () => {
        const err = new Error('Error to be logged');
        const mock = jest.fn();
        Pdo.setLogger(mock);
        const pdo = new Pdo(
            'fake',
            {},
            {
                destroyed: async () => {
                    throw err;
                }
            }
        );
        await pdo.query('SELECT 1');
        await pdo.disconnect();
        expect(
            mock.mock.lastCall[0].startsWith('Tarn: resource destroyer threw an exception Error: Error to be logged')
        ).toBeTruthy();
        expect(mock.mock.lastCall[1]).toEqual('warning');
    });

    it('Works Attributes', async () => {
        const pdo = new Pdo('fake', {}, {}, { TEST_ATTRR_NOT_DEFINED: 10 });

        expect(pdo.getAttribute('FAKE_DRIVER_ATTRS')).toEqual(10);
        expect(pdo.getAttribute('TEST_ATTRR_NOT_DEFINED')).toBeUndefined();
        expect(pdo.setAttribute('TEST_ATTRR_NOT_DEFINED', 15)).toBeFalsy();
        expect(pdo.getAttribute('TEST_ATTRR_NOT_DEFINED')).toBeUndefined();
        expect(pdo.setAttribute('FAKE_DRIVER_ATTRS', 15)).toBeTruthy();
        expect(pdo.getAttribute('FAKE_DRIVER_ATTRS')).toEqual(15);
        expect(pdo.getAttribute(ATTR_CASE)).toEqual(CASE_NATURAL);
        expect(pdo.setAttribute(ATTR_CASE, CASE_LOWER)).toBeTruthy();
        expect(pdo.getAttribute(ATTR_CASE)).toEqual(CASE_LOWER);
        expect(pdo.setAttribute(ATTR_CASE, CASE_NATURAL)).toBeTruthy();
    });

    it('Works BeginTransaction Return Transaction', async () => {
        const pdo = new Pdo('fake', {});
        const trx = await pdo.beginTransaction();
        expect(trx).toBeInstanceOf(PdoTransaction);
        await trx.rollback();
        await pdo.disconnect();
    });

    it('Works Disconnect', async () => {
        let tmpUuid = '';
        const pdo = new Pdo(
            'fake',
            {},
            {
                created: async uuid => {
                    tmpUuid = uuid;
                },
                destroyed: async uuid => {
                    expect(uuid).toEqual(tmpUuid);
                }
            }
        );
        await pdo.query('SELECT 1');
        await pdo.disconnect();
        await expect(pdo.query('SELECT 1')).rejects.toThrow('Pdo is Disconnected from pool, please reconnect.');
        await expect(pdo.prepare('SELECT 1')).rejects.toThrow('Pdo is Disconnected from pool, please reconnect.');
        await expect(pdo.exec('SELECT 1')).rejects.toThrow('Pdo is Disconnected from pool, please reconnect.');
        await expect(pdo.beginTransaction()).rejects.toThrow('Pdo is Disconnected from pool, please reconnect.');
        await expect(pdo.getRawPoolConnection()).rejects.toThrow('Pdo is Disconnected from pool, please reconnect.');
    });

    it('Works Reconnect', async () => {
        const pdo = new Pdo('fake', {});
        await pdo.query('SELECT 1');
        await pdo.disconnect();
        await expect(pdo.query('SELECT 1')).rejects.toThrow('Pdo is Disconnected from pool, please reconnect.');
        pdo.reconnect();
        await pdo.query('SELECT 1');
        await pdo.disconnect();
    });

    it('Works Exec Return Number', async () => {
        const pdo = new Pdo('fake', {});
        const res = await pdo.exec('SELECT 1');
        expect(typeof res === 'number').toBeTruthy();
        expect(res).toEqual(0);
        expect(await pdo.exec('INSERT INTO `users` (`name`, `gender`) VALUES ("Claudio", "All");')).toEqual(1);
        await pdo.disconnect();
    });

    it('Works Exec Fails', async () => {
        const pdo = new Pdo('fake', {});
        await expect(pdo.exec('SELECT ?')).rejects.toThrow(PdoError);
        await pdo.disconnect();
    });

    it('Works Query Return PdoStatement', async () => {
        const pdo = new Pdo('fake', {});
        const stmt = await pdo.query('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoStatement);
        await pdo.disconnect();
    });

    it('Works Query Fails', async () => {
        const pdo = new Pdo('fake', {});
        await expect(pdo.query('SELECT ?')).rejects.toThrow(PdoError);
        await pdo.disconnect();
    });

    it('Works Prepare Return PdoPreparedStatement', async () => {
        const pdo = new Pdo('fake', {});
        const stmt = await pdo.prepare('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoPreparedStatement);
        await stmt.execute();
        await stmt.close();
        await pdo.disconnect();
    });

    it('Works Prepare Fails', async () => {
        const pdo = new Pdo('fake', {});
        await expect(pdo.prepare('SELECT ??')).rejects.toThrow(PdoError);
        await pdo.disconnect();
    });

    it('Works Get Raw Pool Connection', async () => {
        const pdo = new Pdo('fake', { notSafe: true }, {});
        const raw = await pdo.getRawPoolConnection();
        expect(raw.connection).toBeInstanceOf(FakeDBConnection);
        expect(raw.connection.options.notSafe).toBeFalsy();
        await raw.release();
        await pdo.disconnect();
    });

    it('Works Get Raw Driver Connection With Unsecure', async () => {
        const pdo = new Pdo('fake', { notSafe: true }, {});
        const raw = await pdo.getRawDriverConnection<FakeDBConnection>();
        expect(raw.options.notSafe).toBeTruthy();
        await raw.end();
    });

    it('Works Debug', async () => {
        console.log = jest.fn();
        console.trace = jest.fn();
        const pdo = new Pdo('fake', {}, {}, { [ATTR_DEBUG]: DEBUG_ENABLED });
        await pdo.query('SELECT 1');
        expect(console.log).toHaveBeenCalled();
        await pdo.disconnect();
    });

    it('Works createFakePdo', async () => {
        const pdo = createFakePdo({
            notSafe: false
        });
        expect(pdo).toBeInstanceOf(Pdo);
        expect(pdo.getAttribute(ATTR_DRIVER_NAME)).toBe('fake');
        await pdo.disconnect();
    });

    it('Works uuid', async () => {
        const pdo = new Pdo('fake', {}, {}, { [ATTR_DEBUG]: DEBUG_ENABLED });
        const pdo2 = new Pdo('fake', {}, {}, { [ATTR_DEBUG]: DEBUG_ENABLED });
        expect(typeof pdo.uuid).toBe('string');
        expect(typeof pdo2.uuid).toBe('string');
        expect(pdo.uuid).not.toBe(pdo2.uuid);
        await pdo.disconnect();
        await pdo2.disconnect();
    });
});
