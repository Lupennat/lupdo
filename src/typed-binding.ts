import { ValidBindingsPrimitive } from './types/pdo-prepared-statement';

class TypedBinding {
    constructor(public type: string, public value: ValidBindingsPrimitive) {}

    static create(type: string, value: ValidBindingsPrimitive): TypedBinding {
        return new TypedBinding(type, value);
    }
}

export default TypedBinding;
