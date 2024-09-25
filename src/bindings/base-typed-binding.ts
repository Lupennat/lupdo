import { ValidBindingsPrimitive } from '../types/pdo-prepared-statement';
import { TypeBindingOptions } from '../types/type-bindings';

export default abstract class BaseTypedBinding {
  constructor(
    public type: string,
    public value: ValidBindingsPrimitive,
    public options?: TypeBindingOptions,
  ) {}

  toString(): string {
    let options = '';
    try {
      options = this.options ? ', ' + JSON.stringify(this.options) : '';
    } catch (error) {}

    return `${this.type}(${this.value === null ? 'null' : this.value.toString()}${options})`;
  }
}
