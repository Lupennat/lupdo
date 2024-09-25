import { PdoAttributes, PdoPoolOptions } from '../../src';
import Pdo from '../../src/pdo';
import FakeDriver, { FakeDriverOptions } from './fake-driver';

Pdo.addDriver('fake', FakeDriver);

export function createFakePdo(
  options: FakeDriverOptions,
  poolOptions?: PdoPoolOptions,
  attributes?: PdoAttributes,
): Pdo {
  return new Pdo('fake', options, poolOptions, attributes);
}
