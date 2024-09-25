import {
  NumericType,
  NumericTypeBindingOptions,
  NumericValidPrimitive,
} from '../types/type-bindings';
import BaseTypedBinding from './base-typed-binding';

export default class NumericTypedBinding extends BaseTypedBinding {
  constructor(
    public type: NumericType,
    public value: NumericValidPrimitive,
    public options?: NumericTypeBindingOptions,
  ) {
    super(type, value, options);
  }
}
