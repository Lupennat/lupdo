import { ValidBindingsPrimitive } from './types/pdo-prepared-statement';

export interface TypeBindingOptions {
    [key: string]: any;
}
class TypedBinding {
    constructor(public type: string, public value: ValidBindingsPrimitive, public options?: TypeBindingOptions) {}

    static create(type: string, value: ValidBindingsPrimitive, options?: TypeBindingOptions): TypedBinding {
        return new TypedBinding(type, value, options);
    }

    toString(): string {
        let options = '';
        try {
            options = this.options
                ? ', ' +
                  JSON.stringify(this.options, (_key: string, value: any) => {
                      return typeof value === 'bigint' ? value.toString() : value;
                  })
                : '';
        } catch (error) {}

        return `${this.type}(${this.value === null ? 'null' : this.value.toString()}${options})`;
    }
}

export default TypedBinding;
