import { ValidBindingsPrimitive } from './types/pdo-prepared-statement';

export interface TypeBindingOptions {
    [key: string]: any;
}
class TypedBinding {
    constructor(public type: string, public value: ValidBindingsPrimitive, public options?: TypeBindingOptions) {}

    static create(type: string, value: ValidBindingsPrimitive, options?: TypeBindingOptions): TypedBinding {
        return new TypedBinding(type, value, options);
    }
}

export default TypedBinding;
