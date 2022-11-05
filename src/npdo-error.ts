class NpdoError extends Error {
    public cause: any;

    constructor(error: Error | string = '', cause?: any) {
        super(typeof error === 'string' ? error : error.message);
        if (cause !== undefined) {
            this.cause = cause;
        } else {
            if (typeof error !== 'string') {
                this.cause = error;
            }
        }
    }
}

export = NpdoError;
