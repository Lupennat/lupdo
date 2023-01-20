import Pdo from '../../pdo';
import PdoAttributes from '../../types/pdo-attributes';
import { PoolOptions } from '../../types/pdo-pool';
import FakeDriver, { FakeDriverOptions } from './fake-driver';

Pdo.addDriver('fake', FakeDriver);

export function createFakePdo(options: FakeDriverOptions, poolOptions?: PoolOptions, attributes?: PdoAttributes): Pdo {
    return new Pdo('fake', options, poolOptions, attributes);
}
