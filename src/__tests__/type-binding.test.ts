import { PARAM_BIGINT, PARAM_NUMERIC } from '../constants';
import TypedBinding from '../typed-binding';

describe('Type Binding', () => {
    it('Works Constructor', () => {
        let typeBinding = new TypedBinding(PARAM_BIGINT, BigInt(10));
        expect(typeBinding.type).toBe(PARAM_BIGINT);
        expect(typeBinding.value).toEqual(BigInt(10));
        expect(typeBinding.options).toBeUndefined();
        typeBinding = new TypedBinding(PARAM_NUMERIC, '12323.2132312', { precision: 10, scale: 5 });
        expect(typeBinding.type).toBe(PARAM_NUMERIC);
        expect(typeBinding.value).toBe('12323.2132312');
        expect(typeBinding.options).toEqual({ precision: 10, scale: 5 });
    });

    it('Works Static Create', () => {
        let typeBinding = TypedBinding.create(PARAM_BIGINT, BigInt(10));
        expect(typeBinding.type).toBe(PARAM_BIGINT);
        expect(typeBinding.value).toEqual(BigInt(10));
        expect(typeBinding.options).toBeUndefined();
        typeBinding = TypedBinding.create(PARAM_NUMERIC, '12323.2132312', { precision: 10, scale: 5 });
        expect(typeBinding.type).toBe(PARAM_NUMERIC);
        expect(typeBinding.value).toBe('12323.2132312');
        expect(typeBinding.options).toEqual({ precision: 10, scale: 5 });
    });

    it('Works toString', () => {
        let typeBinding = TypedBinding.create(PARAM_BIGINT, BigInt(10));
        expect(typeBinding.toString()).toBe('BIGINT(10)');
        typeBinding = TypedBinding.create(PARAM_NUMERIC, null, { precision: BigInt(10), scale: 5 });
        typeBinding.toString();
        expect(typeBinding.toString()).toBe('NUMERIC(null, {"precision":"10","scale":5})');
    });
});
