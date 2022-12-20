import { PdoError } from '../errors';

describe('Pdo Error', () => {
    it('Throws Error With Cause', () => {
        const error = new Error('test');
        let pdoError = new PdoError('Message');
        expect(pdoError.message).toEqual('Message');
        expect(pdoError.cause).toBeUndefined();
        pdoError = new PdoError(error);
        expect(pdoError.message).toEqual('test');
        expect(pdoError.cause).toEqual(error);
        pdoError = new PdoError('Message', error);
        expect(pdoError.message).toEqual('Message');
        expect(pdoError.cause).toEqual(error);
        pdoError = new PdoError();
        expect(pdoError.message).toEqual('');
    });
});
