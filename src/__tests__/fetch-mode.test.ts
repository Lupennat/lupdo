// import Pdo from '../pdo';
// import table from './fixtures/config';

// describe('Fetch Mode', () => {
//     it('Works Missing Driver', () => {
//         expect(() => {
//             // @ts-expect-error Testing wrong constructor
//             new Pdo('fake', {});
//         }).toThrow('Driver [fake] not available.');
//     });

//     it('Works GetAvailableDrivers', () => {
//         expect(Pdo.getAvailableDrivers()).toEqual(['mysql', 'mariadb', 'sqlite', 'sqlite3']);
//     });

//     it.each(table)('Works $driver Constructor', ({ driver, config }) => {
//         const pdo = new Pdo(driver, config);
//         expect(pdo).toBeInstanceOf(Pdo);
//     });
// });

describe('Pdo Api', () => {
    it('Throws Error With Cause', () => {
        new Error('test');
    });
});
