class PdoError extends Error {
    public cause: any;

    constructor(error: Error | string = '', cause?: any) {
        super(
            typeof error === 'string'
                ? error
                : // @ts-expect-error AggregateError
                error.message === '' && error.errors != null && error.errors.length > 0
                ? // @ts-expect-error AggregateError
                  error.errors[0].message
                : error.message
        );
        if (cause !== undefined) {
            this.cause = cause;
        } else {
            if (typeof error !== 'string') {
                this.cause = error;
            }
        }
    }
}

export default PdoError;
