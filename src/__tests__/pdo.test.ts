/* eslint-disable @typescript-eslint/no-var-requires */
const { PromiseConnection } = require('mysql2/promise');
import Database from 'better-sqlite3';
import { ATTR_DEBUG, DEBUG_ENABLED } from '../constants';
import PdoPreparedStatement from '../drivers/pdo-prepared-statement';
import PdoStatement from '../drivers/pdo-statement';
import PdoTransaction from '../drivers/pdo-transaction';
import Pdo from '../pdo';
import { PdoLogger } from '../types/pdo';
import { mysqlPoolConnection, sqlitePoolConnection } from '../types/pdo-pool';

import { PdoError } from '../errors';
import table, { isMysql, sqliteTables } from './fixtures/config';

describe('Pdo Api', () => {
    it('Works Missing Driver', () => {
        expect(() => {
            // @ts-expect-error Testing wrong constructor
            new Pdo('fake', {});
        }).toThrow('Driver [fake] not available.');
    });

    it('Works GetAvailableDrivers', () => {
        expect(Pdo.getAvailableDrivers()).toEqual(['mysql', 'mariadb', 'sqlite', 'sqlite3']);
    });

    it.each(table)('Works $driver Constructor', ({ driver, config }) => {
        const pdo = new Pdo(driver, config);
        expect(pdo).toBeInstanceOf(Pdo);
    });

    it.each(table)('Works $driver Pdo Not Log By Default', async ({ driver, config }) => {
        class PdoStub extends Pdo {
            static getLogger(): PdoLogger {
                return this.logger;
            }
        }
        const originalLogger = PdoStub.getLogger();

        const err = new Error('Error to be logged');

        Pdo.setLogger((message: any, level: any) => {
            expect(originalLogger(message, level)).toBeUndefined();
        });

        const pdo = new PdoStub(driver, config, {
            destroyed: async () => {
                throw err;
            }
        });
        await pdo.query('SELECT 1');
        await pdo.disconnect();
    });

    it.each(table)('Works $driver SetLogger', async ({ driver, config }) => {
        const err = new Error('Error to be logged');
        const mock = jest.fn();
        Pdo.setLogger(mock);
        const pdo = new Pdo(driver, config, {
            destroyed: async () => {
                throw err;
            }
        });
        await pdo.query('SELECT 1');
        await pdo.disconnect();
        expect(
            mock.mock.lastCall[0].startsWith('Tarn: resource destroyer threw an exception Error: Error to be logged')
        ).toBeTruthy();
        expect(mock.mock.lastCall[1]).toEqual('warning');
    });

    it.each(table)('Works $driver Attributes', async ({ driver, config }) => {
        const pdo = new Pdo(driver, config, {}, { TEST_ATTRS: 10 });
        expect(pdo.getAttribute('TEST_ATTRS')).toEqual(10);
        expect(pdo.setAttribute('TEST_ATTRR_NOT_DEFINED', 15)).toBeFalsy();
        expect(pdo.setAttribute('TEST_ATTRS', 15)).toBeTruthy();
        expect(pdo.getAttribute('TEST_ATTRS')).toEqual(15);
    });

    it.each(table)('Works $driver BeginTransaction Return Transaction', async ({ driver, config }) => {
        const pdo = new Pdo(driver, config);
        const trx = await pdo.beginTransaction();
        expect(trx).toBeInstanceOf(PdoTransaction);
        await trx.rollback();
        await pdo.disconnect();
    });

    it.each(table)('Works $driver Disconnect', async ({ driver, config }) => {
        let tmpUuid = '';
        const pdo = new Pdo(driver, config, {
            created: async uuid => {
                tmpUuid = uuid;
            },
            destroyed: async uuid => {
                expect(uuid).toEqual(tmpUuid);
            }
        });
        await pdo.query('SELECT 1');
        await pdo.disconnect();
        await expect(pdo.query('SELECT 1')).rejects.toThrow('Pdo is Disconnected from pool, please reconnect.');
        await expect(pdo.prepare('SELECT 1')).rejects.toThrow('Pdo is Disconnected from pool, please reconnect.');
        await expect(pdo.exec('SELECT 1')).rejects.toThrow('Pdo is Disconnected from pool, please reconnect.');
        await expect(pdo.beginTransaction()).rejects.toThrow('Pdo is Disconnected from pool, please reconnect.');
        await expect(pdo.getRawPoolConnection()).rejects.toThrow('Pdo is Disconnected from pool, please reconnect.');
    });

    it.each(table)('Works $driver Reconnect', async ({ driver, config }) => {
        const pdo = new Pdo(driver, config);
        await pdo.query('SELECT 1');
        await pdo.disconnect();
        await expect(pdo.query('SELECT 1')).rejects.toThrow('Pdo is Disconnected from pool, please reconnect.');
        pdo.reconnect();
        await pdo.query('SELECT 1');
        await pdo.disconnect();
    });

    it.each(table)('Works $driver Exec Return Number', async ({ driver, config }) => {
        const pdo = new Pdo(driver, config);
        const res = await pdo.exec('SELECT 1');
        expect(typeof res === 'number').toBeTruthy();
        expect(res).toEqual(0);
        await pdo.disconnect();
    });

    it.each(table)('Works $driver Query Return PdoStatement', async ({ driver, config }) => {
        const pdo = new Pdo(driver, config);
        const stmt = await pdo.query('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoStatement);
        await pdo.disconnect();
    });

    it.each(table)('Works $driver Query Fails', async ({ driver, config }) => {
        const pdo = new Pdo(driver, config);
        await expect(pdo.query('SELECT ?')).rejects.toThrow(PdoError);
        await pdo.disconnect();
    });

    it.each(table)('Works $driver Prepare Return PdoPreparedStatement', async ({ driver, config }) => {
        const pdo = new Pdo(driver, config);
        const stmt = await pdo.prepare('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoPreparedStatement);
        await stmt.execute();
        await pdo.disconnect();
    });

    if (sqliteTables.length > 0) {
        it.each(sqliteTables)('Works $driver Prepare Fails', async ({ driver, config }) => {
            const pdo = new Pdo(driver, config);
            await expect(pdo.prepare('SELECT ??')).rejects.toThrow(PdoError);
            await pdo.disconnect();
        });
    }

    it.each(table)('Works $driver Get Raw Pool Connection', async ({ driver, config }) => {
        const pdo = new Pdo(driver, config, {});
        const raw = await pdo.getRawPoolConnection();
        if (isMysql(driver)) {
            expect(raw.connection as mysqlPoolConnection).toBeInstanceOf(PromiseConnection);
        } else {
            expect(raw.connection as sqlitePoolConnection).toBeInstanceOf(Database);
        }

        await raw.release();
        await pdo.disconnect();
    });

    it.each(table)('Works $driver Debug', async ({ driver, config }) => {
        console.log = jest.fn();
        console.trace = jest.fn();
        const pdo = new Pdo(driver, config, {}, { [ATTR_DEBUG]: DEBUG_ENABLED });
        await pdo.query('SELECT 1');
        expect(console.log).toHaveBeenCalled();
        await pdo.disconnect();
    });
});
