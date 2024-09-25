import PdoError from '../../src/errors/pdo-error';

describe('Pdo Error', () => {
  class AggregateErrorFake extends Error {
    constructor(
      public errors: Error[],
      message?: string,
    ) {
      super(message);
    }
  }

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
    const aggregate = new AggregateErrorFake([
      new Error('test'),
      new Error('test2'),
    ]);
    pdoError = new PdoError(aggregate);
    expect(pdoError.message).toEqual('test');
    expect(pdoError.cause).toEqual(aggregate);
    const aggregateWithMessage = new AggregateErrorFake(
      [new Error('test'), new Error('test2')],
      'Message',
    );
    pdoError = new PdoError(aggregateWithMessage);
    expect(pdoError.message).toEqual('Message');
    expect(pdoError.cause).toEqual(aggregateWithMessage);
  });
});
