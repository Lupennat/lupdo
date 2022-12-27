/* eslint-disable @typescript-eslint/no-var-requires */
import PdoAffectingData from '../../types/pdo-affecting-data';
import PdoColumnData from '../../types/pdo-column-data';
import PdoRowData from '../../types/pdo-raw-data';
import db from './db';

const databases: {
    [key: string | number]: typeof db;
} = {};

function prepareSql(sql: string): void {
    sql = sql.toLowerCase().trim();
    if (sql.startsWith('select ??')) {
        throw new Error('query syntax not valid');
    }
}

const sleeps: {
    [key: string | number]: boolean;
} = {};

async function sleep(threadId: number, valid = false): Promise<void> {
    return new Promise((resolve, reject) => {
        let interval: NodeJS.Timeout | null = setInterval(() => {
            if (!sleeps[threadId]) {
                clearInterval(interval as NodeJS.Timeout);
                interval = null;
                if (valid) {
                    resolve();
                } else {
                    reject('Query execution was interrupted');
                }
            }
        }, 500);
    });
}

async function processSql(
    threadId: number,
    sql: string,
    transaction = false
): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
    sql = sql.toLowerCase().trim();

    if (sql.startsWith('select sleep(60)')) {
        sleeps[threadId] = true;
        try {
            await sleep(threadId);
        } catch (error) {
            throw error;
        }
    }

    if (sql.startsWith('select sleepresolve(60)')) {
        sleeps[threadId] = true;
        await sleep(threadId, true);
    }

    if (sql.startsWith('kill query ')) {
        const threadToKill = sql.replace('kill query ', '').replace(';', '').trim();
        sleeps[threadToKill] = false;
    }

    if (sql.includes('?')) {
        throw new Error('invalid query!');
    }

    if (sql.startsWith('select 1234567890123123')) {
        return [{}, [['1234567890123123']], []];
    }

    if (sql.startsWith('select day(')) {
        const dateString = sql.replace('select day(', '').replace(')', '').replace(';', '').trim();
        const date = new Date(dateString.toUpperCase());
        return [{}, [[date.getDate()]], []];
    }

    if (sql.startsWith('select lower(')) {
        return [
            {},
            [
                [
                    sql
                        .replace('select lower(', '')
                        .replace(/"/g, '')
                        .replace(/'/g, '')
                        .replace(')', '')
                        .replace(';', '')
                        .trim()
                ]
            ],
            []
        ];
    }

    if (sql.startsWith('select timestamp(')) {
        const dateString = sql.replace('select timestamp(', '').replace(')', '').replace(';', '').trim();
        const date = new Date(dateString.toUpperCase());
        return [{}, [[date.toISOString()]], []];
    }

    if (sql.startsWith('select 1')) {
        return [{}, [[1]], []];
    }

    const database = transaction ? databases[threadId + '_transaction'] : databases[threadId];

    if (sql.startsWith("select null as `field1`, '' as `field2`, 1 as `field3` from users limit 5")) {
        return [
            {},
            (sql.includes('limit 5') ? database.users.data.slice(0, 5) : database.users.data).map(() => {
                return [null, '', 1];
            }),
            [
                {
                    name: 'field1',
                    table: 'users'
                },
                {
                    name: 'field2',
                    table: 'users'
                },
                {
                    name: 'field3',
                    table: 'users'
                }
            ]
        ];
    }

    if (sql.startsWith('select count(*) as total from users')) {
        return [{}, [[database.users.data.length]], [{ name: 'total', table: 'users' }]];
    }

    if (sql.startsWith('select `id` from users where `name` = ')) {
        const string = sql
            .replace('select `id` from users where `name` = ', '')
            .replace(/"/g, '')
            .replace(/'/g, '')
            .replace(';', '')
            .trim();

        const name = string.charAt(0).toUpperCase() + string.slice(1);

        const found = database.users.data.find(user => user.name === name);

        if (found) {
            return [
                {},
                [[found.id]],
                [
                    {
                        name: 'id',
                        table: 'users'
                    }
                ]
            ];
        }
    }

    if (sql.startsWith('select id from users limit 5')) {
        return [
            {},
            database.users.data.slice(0, 5).map(item => {
                return [item.id];
            }),
            [
                {
                    name: 'id',
                    table: 'users'
                }
            ]
        ];
    }

    if (sql.startsWith('select name, gender from users limit 5')) {
        return [
            {},
            database.users.data.slice(0, 5).map(item => {
                return [item.name, item.gender];
            }),
            [
                {
                    name: 'name',
                    table: 'users'
                },
                {
                    name: 'gender',
                    table: 'users'
                }
            ]
        ];
    }

    if (sql.startsWith('select gender as camelcol from users limit 5')) {
        return [
            {},
            database.users.data.slice(0, 5).map(item => [item.gender]),
            [
                {
                    name: 'camElCol',
                    table: 'users'
                }
            ]
        ];
    }

    if (sql.startsWith('select gender, users.* from users limit 10')) {
        const columns = database.users.columns;
        return [
            {},
            database.users.data.slice(0, 10).map(item => {
                const res = [item.gender];
                for (const column of columns) {
                    res.push((item as any)[column]);
                }
                return res;
            }),
            [
                {
                    name: 'gender',
                    table: 'users'
                }
            ].concat(
                columns.map(column => {
                    return {
                        name: column,
                        table: 'users'
                    };
                })
            )
        ];
    }

    if (sql.startsWith("select * from users, companies where users.name = 'edmund'")) {
        const userColumns = database.users.columns;
        const companyColumns = database.companies.columns;
        const found = database.users.data.find(item => item.name === 'Edmund');

        if (found) {
            return [
                {},
                database.companies.data.map(company => {
                    const res = [];
                    for (const column of userColumns) {
                        res.push((found as any)[column]);
                    }
                    for (const column of companyColumns) {
                        res.push((company as any)[column]);
                    }
                    return res;
                }),
                userColumns
                    .map(column => {
                        return {
                            name: column,
                            table: 'users'
                        };
                    })
                    .concat(
                        companyColumns.map(column => {
                            return {
                                name: column,
                                table: 'companies'
                            };
                        })
                    )
            ];
        }
    }

    if (sql.startsWith('select * from users') || sql.startsWith('select id, name, gender from users')) {
        const columns = database.users.columns;
        return [
            {},
            (sql.includes('limit 5')
                ? database.users.data.slice(0, 5)
                : sql.includes('limit 3')
                ? database.users.data.slice(0, 3)
                : database.users.data
            ).map(item => {
                const res = [];
                for (const column of columns) {
                    res.push((item as any)[column]);
                }
                return res;
            }),
            columns.map(column => {
                return {
                    name: column,
                    table: 'users'
                };
            })
        ];
    }

    if (sql.startsWith('insert into `users` (`name`, `gender`) values ("claudio", "all")')) {
        const id = database.users.data.length + 1;
        database.users.data.push({ id, name: 'Claudio', gender: 'all' });
        return [{ lastInsertRowid: id, affectedRows: 1 }, [], []];
    }

    if (sql.startsWith('insert into `users` (`name`, `gender`) values ("sleepresolve", "all")')) {
        sleeps[threadId] = true;
        await sleep(threadId, true);
    }

    if (sql.startsWith('delete from users where (`id` =')) {
        const id = sql.replace('delete from users where (`id` =', '').replace(')', '').replace(';', '').trim();
        const index = database.users.data.findIndex(item => item.id === Number(id));
        if (index > -1) {
            database.users.data.splice(index, 1);
            return [{ affectedRows: 1 }, [], []];
        }
    }

    if (sql.startsWith('select * from companies where opened >')) {
        const dateString = sql
            .replace('select * from companies where opened >', '')
            .replace(')', '')
            .replace(';', '')
            .trim();
        const date = new Date(dateString.toUpperCase());

        const columns = database.companies.columns;
        return [
            {},
            database.companies.data
                .filter(company => {
                    return new Date(company.opened).valueOf() > date.valueOf();
                })
                .map(company => {
                    const res = [];
                    for (const column of columns) {
                        res.push((company as any)[column]);
                    }
                    return res;
                }),
            columns.map(column => {
                return {
                    name: column,
                    table: 'companies'
                };
            })
        ];
    }

    if (sql.startsWith('select * from companies where active =')) {
        const value = sql
            .replace('select * from companies where active =', '')
            .replace(')', '')
            .replace(';', '')
            .trim();

        const columns = database.companies.columns;
        return [
            {},
            database.companies.data
                .filter(company => {
                    return company.active === Number(value);
                })
                .map(company => {
                    const res = [];
                    for (const column of columns) {
                        res.push((company as any)[column]);
                    }
                    return res;
                }),
            columns.map(column => {
                return {
                    name: column,
                    table: 'companies'
                };
            })
        ];
    }

    if (sql.startsWith('select count(*) from companies')) {
        return [{}, [[database.companies.data.length]], [{ name: 'count(*)', table: 'companies' }]];
    }

    if (sql.startsWith('select * from companies')) {
        const columns = database.companies.columns;
        return [
            {},
            (sql.includes('limit 5') ? database.companies.data.slice(0, 5) : database.companies.data).map(item => {
                const res = [];
                for (const column of columns) {
                    res.push((item as any)[column]);
                }
                return res;
            }),
            columns.map(column => {
                return {
                    name: column,
                    table: 'companies'
                };
            })
        ];
    }

    return [{}, [], []];
}

export class FakeDBStatement {
    constructor(
        protected threadId: number,
        protected inTransaction: boolean,
        public query: string,
        protected options = { debug: false }
    ) {
        prepareSql(query);
    }

    protected logIfDebug(...messages: any[]): void {
        if (this.options.debug) {
            console.log(...messages);
        }
    }

    public async execute(
        params: string[] | { [key: string]: string }
    ): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
        this.logIfDebug('Execute', params);
        let sql = this.query;
        if (Array.isArray(params)) {
            for (const param of params) {
                sql = sql.replace('?', param);
            }
        } else {
            for (const key in params) {
                sql = sql.replace(':' + key, params[key]);
            }
        }

        return await processSql(this.threadId, sql, this.inTransaction);
    }
}

class FakeDBConnection {
    static connections: FakeDBConnection[] = [];
    threadId: number;
    __lupdo_uuid = '';
    __lupdo_killed = false;
    protected inTransaction = false;
    protected statements: Map<string, FakeDBStatement> = new Map();
    protected queryToBeExecuted = [];

    constructor(public options: { notSafe?: boolean; debug: boolean } = { debug: false }) {
        this.threadId = Date.now();
        databases[this.threadId] = JSON.parse(JSON.stringify(db));
        FakeDBConnection.connections.push(this);
    }

    protected logIfDebug(...messages: any[]): void {
        if (this.options.debug) {
            console.log(...messages);
        }
    }

    public async beginTransaction(): Promise<void> {
        this.logIfDebug('begin transaction');
        databases[this.threadId + '_transaction'] = JSON.parse(JSON.stringify(databases[this.threadId]));
        this.inTransaction = true;
    }

    public async end(): Promise<void> {
        this.logIfDebug('end connection');
        return void 0;
    }

    async commit(): Promise<void> {
        this.logIfDebug('commit');
        const dbToAssign = JSON.parse(JSON.stringify(databases[this.threadId + '_transaction']));
        for (const key in databases) {
            databases[key] = dbToAssign;
        }
        delete databases[this.threadId + '_transaction'];
        this.inTransaction = false;
    }

    async rollback(): Promise<void> {
        this.logIfDebug('rollback');
        delete databases[this.threadId + '_transaction'];
        this.inTransaction = false;
    }

    public async query(sql: string): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
        this.logIfDebug('query', sql);
        return await processSql(this.threadId, sql, this.inTransaction);
    }

    public async prepare(sql: string): Promise<FakeDBStatement> {
        this.logIfDebug('prepare', sql);
        if (!this.statements.has(sql)) {
            this.statements.set(sql, new FakeDBStatement(this.threadId, this.inTransaction, sql, this.options));
        }

        return this.statements.get(sql) as FakeDBStatement;
    }

    public async unprepare(sql: string): Promise<void> {
        this.logIfDebug('unprepare', sql);
        this.statements.delete(sql);
    }
}

export default FakeDBConnection;
