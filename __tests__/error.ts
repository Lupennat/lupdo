import NpdoError from '../src/npdo-error';

test('Npdo Error Cause', () => {
    const err = new Error('test');
    let pdoError = new NpdoError('Message');
    expect(pdoError.message).toEqual('Message');
    expect(pdoError.cause).toBeUndefined();
    pdoError = new NpdoError(err);
    expect(pdoError.message).toEqual('test');
    expect(pdoError.cause).toEqual(err);
    pdoError = new NpdoError('Message', err);
    expect(pdoError.message).toEqual('Message');
    expect(pdoError.cause).toEqual(err);
    pdoError = new NpdoError();
    expect(pdoError.message).toEqual('');
});
