import { NpdoDriver } from '../src/types';

const drivers: {
    [key: string]: NpdoDriver.Options;
} = {
    mysql: {
        host: 'localhost',
        port: 3306,
        user: 'npdo',
        password: 'secret',
        database: 'test_db'
    },
    mariadb: {
        host: 'localhost',
        port: 3308,
        user: 'npdo',
        password: 'secret',
        database: 'test_db'
    },
    sqlite3: {
        path: __dirname + '/sqlite-test.db'
    }
};

export default drivers;
