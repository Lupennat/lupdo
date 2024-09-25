import LengthTypedBinding from '../../src/bindings/length-typed-binding';
import NumericTypedBinding from '../../src/bindings/numeric-typed-binding';
import PrecisionTypedBinding from '../../src/bindings/precision-typed-binding';
import TypedBinding from '../../src/bindings/typed-binding';
import {
  PARAM_BIGINT,
  PARAM_CHAR,
  PARAM_DATETIME,
  PARAM_DECIMAL,
} from '../../src/constants';

describe('Type Bindings', () => {
  describe('Generic TypeBinding Test', () => {
    const params = [
      {
        test: 'BigInt',
        param: PARAM_BIGINT,
        value: BigInt(10),
        string: 'BIGINT(10)',
      },
      {
        test: 'BigInt nullable with options',
        param: PARAM_BIGINT,
        value: null,
        string: 'BIGINT(null)',
      },
    ];
    it.each(params)('Works Constructor $test', ({ param, value, string }) => {
      const typeBinding = new TypedBinding(param, value);
      expect(typeBinding.type).toBe(param);
      expect(typeBinding.value).toEqual(value);
      expect(typeBinding.options).toBeUndefined();
      expect(typeBinding.toString()).toBe(string);
    });
  });

  describe('NumericTypedBinding Test', () => {
    const params = [
      {
        test: 'Decimal',
        value: '123.560',
        options: undefined,
        string: 'DECIMAL(123.560)',
      },
      {
        test: 'Decimal Nullable with options',
        value: null,
        options: {
          total: 10,
          places: 5,
        },
        string: 'DECIMAL(null, {"total":10,"places":5})',
      },
    ];

    it.each(params)('Works Constructor $test', ({ value, options, string }) => {
      const typeBinding = new NumericTypedBinding(
        PARAM_DECIMAL,
        value,
        options,
      );
      expect(typeBinding.type).toBe(PARAM_DECIMAL);
      expect(typeBinding.value).toEqual(value);
      expect(typeBinding.options).toEqual(options);
      expect(typeBinding.toString()).toBe(string);
    });
  });

  describe('PrecisionTypedBinding Test', () => {
    const params = [
      {
        test: 'DateTime',
        value: '2024-06-15 12:00:00.123456789',
        options: undefined,
        string: 'DATETIME(2024-06-15 12:00:00.123456789)',
      },
      {
        test: 'DateTime Nullable with options',
        value: null,
        options: {
          precision: 4,
        },
        string: 'DATETIME(null, {"precision":4})',
      },
    ];

    it.each(params)('Works Constructor $test', ({ value, options, string }) => {
      const typeBinding = new PrecisionTypedBinding(
        PARAM_DATETIME,
        value,
        options,
      );
      expect(typeBinding.type).toBe(PARAM_DATETIME);
      expect(typeBinding.value).toEqual(value);
      expect(typeBinding.options).toEqual(options);
      expect(typeBinding.toString()).toBe(string);
    });
  });

  describe('LengthTypedBinding Test', () => {
    const params = [
      {
        test: 'Char',
        value: 'My Custom Char',
        options: undefined,
        string: 'CHAR(My Custom Char)',
      },
      {
        test: 'Char Nullable with options',
        value: null,
        options: {
          length: 10,
        },
        string: 'CHAR(null, {"length":10})',
      },
    ];

    it.each(params)('Works Constructor $test', ({ value, options, string }) => {
      const typeBinding = new LengthTypedBinding(PARAM_CHAR, value, options);
      expect(typeBinding.type).toBe(PARAM_CHAR);
      expect(typeBinding.value).toEqual(value);
      expect(typeBinding.options).toEqual(options);
      expect(typeBinding.toString()).toBe(string);
    });
  });
});
