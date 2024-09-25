import {
  PrecisionType,
  PrecisionTypeBindingOptions,
  PrecisionValidPrimitive,
} from '../types/type-bindings';
import BaseTypedBinding from './base-typed-binding';

export default class PrecisionTypedBinding extends BaseTypedBinding {
  constructor(
    public type: PrecisionType,
    public value: PrecisionValidPrimitive,
    public options?: PrecisionTypeBindingOptions,
  ) {
    super(type, value, options);
  }
}
