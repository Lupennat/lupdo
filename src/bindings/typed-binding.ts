import { ValidBindingsPrimitive } from '../types/pdo-prepared-statement';
import BaseTypedBinding from './base-typed-binding';

export class TypedBinding extends BaseTypedBinding {
  constructor(
    public type: string,
    public value: ValidBindingsPrimitive,
  ) {
    super(type, value);
  }
}

export default TypedBinding;
