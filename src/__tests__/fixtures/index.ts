import Pdo from '../../pdo';
import FakeDriver from './fake-driver';

Pdo.addDriver('fake', FakeDriver);
