import { PdoAvailableDriver } from '../../types/pdo';
import { DriverOptions } from '../../types/pdo-driver';

const configs = {
    sqlite: {
        path: __dirname + '/../../../.sqlite.db'
    },
    sqlite3: {
        path: __dirname + '/../../../.sqlite3.db'
    },
    mysql: {
        host: 'localhost',
        port: 5306,
        user: 'lupdo',
        password: 'lupdo@s3cRet',
        database: 'test_db'
    },
    mariadb: {
        host: 'localhost',
        port: 5308,
        user: 'lupdo',
        password: 'lupdo@s3cRet',
        database: 'test_db'
    }
};

interface TableObject {
    driver: PdoAvailableDriver;
    config: DriverOptions;
}

const valids: PdoAvailableDriver[] = ['sqlite', 'sqlite3', 'mariadb', 'mysql'];
const table: TableObject[] = [];

if (process.env.__PDODRIVER__ === 'all') {
    for (const valid of valids) {
        table.push({ driver: valid, config: configs[valid] });
    }
} else {
    const driver: PdoAvailableDriver =
        process.env.__PDODRIVER__ != null && valids.includes(process.env.__PDODRIVER__ as PdoAvailableDriver)
            ? (process.env.__PDODRIVER__ as PdoAvailableDriver)
            : 'sqlite';

    const config = configs[driver];

    table.push({ driver, config });
}

export const sqliteTables = table.filter(item => ['sqlite', 'sqlite3'].includes(item.driver));
export const mysqlTables = table.filter(item => ['mysql', 'mariadb'].includes(item.driver));
export function isSqlite(name: string): boolean {
    return ['sqlite', 'sqlite3'].includes(name);
}
export function isMysql(name: string): boolean {
    return ['mariadb', 'mysql'].includes(name);
}

export function insertSql(driver: string, table: string, columns: string[], values: string[]): string {
    if (isSqlite(driver)) {
        return 'INSERT INTO ' + table + ' (' + columns.join(',') + ') VALUES (' + "'" + values.join("','") + "'" + ');';
    }

    return 'INSERT INTO `' + table + '` (`' + columns.join('`,`') + '`) VALUES ("' + values.join('","') + '");';
}
export default table;
