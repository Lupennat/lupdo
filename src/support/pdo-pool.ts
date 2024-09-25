import { Pool as TarnPool } from 'tarn';
import { PromiseInspection } from 'tarn/dist/PromiseInspection';

import { InternalPdoPoolOptions, PoolI } from '../types/pdo-pool';

export class PdoPool<T> extends TarnPool<T> implements PoolI<T> {
  protected timeout: NodeJS.Timeout | null = null;
  protected killResource: boolean;
  protected killTimeoutMillis: number;
  protected killer: (resource: T) => Promise<void>;

  constructor(poolOptions: InternalPdoPoolOptions<T>) {
    const { killResource, killTimeoutMillis, kill, ...tarnOptions } =
      poolOptions;
    super(tarnOptions);
    this.killer = kill;
    this.killResource = killResource ?? false;
    this.killTimeoutMillis = killTimeoutMillis ?? 10000;
  }

  public async destroy(): Promise<
    PromiseInspection<unknown> | PromiseInspection<void>
  > {
    if (this.killResource) {
      this.timeout = setTimeout(async () => {
        for (const used of this.used) {
          await this.killer(used.resource);
          this._executeEventHandlers('kill');
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
}

export default PdoPool;
