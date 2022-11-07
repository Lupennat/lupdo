import { Pool as TarnPool } from 'tarn';
import { PromiseInspection } from 'tarn/dist/PromiseInspection';
import { InternalNpdoPoolOptions } from '../types';

class NpdoPool<T> extends TarnPool<T> {
    protected timeout: NodeJS.Timeout | null = null;
    protected killResource: boolean;
    protected killTimeoutMillis: number;
    protected killer: (resource: T) => any;

    constructor(poolOptions: InternalNpdoPoolOptions<T>) {
        const { killResource, killTimeoutMillis, kill, ...tarnOptions } = poolOptions;
        super(tarnOptions);
        this.killer = kill;
        this.killResource = killResource ?? false;
        this.killTimeoutMillis = killTimeoutMillis ?? 10000;
    }

    public async destroy(): Promise<PromiseInspection<unknown> | PromiseInspection<void>> {
        if (this.killResource) {
            this.timeout = setTimeout(() => {
                for (const used of this.used) {
                    this.killer(used.resource);
                    this.release(used.resource);
                }
            }, this.killTimeoutMillis);
        }
        const res = await super.destroy();
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        return res;
    }

    public writeLog(message: string, logLevel: string): void {
        // tarn logLevel is defined as 'warn' -_-
        return this.log(message, logLevel as 'warn');
    }
}

export = NpdoPool;
