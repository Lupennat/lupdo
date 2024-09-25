import BaseTypedBinding from '../bindings/base-typed-binding';
import { Params } from '../types/pdo-prepared-statement';

class JsonDate extends Date {
  toJSON(key?: any): any {
    return { type: 'Date', data: super.toJSON(key) };
  }
}

class JsonBigInt {
  constructor(protected readonly bigint: BigInt) {}
  toJSON(): any {
    return { type: 'BigInt', data: this.bigint.toString() };
  }
}

const toJsonable = (value: any): any => {
  if (value instanceof BaseTypedBinding) {
    return toJsonable(value.value);
  }
  if (value instanceof Date) {
    return new JsonDate(value.toString());
  }
  if (typeof value === 'bigint') {
    return new JsonBigInt(value);
  }
  return value;
};

export function paramsToString(
  params: Params,
  space?: string | number,
): string {
  let parsed: any = null;
  if (Array.isArray(params)) {
    parsed = [];
    for (const param of params) {
      if (Array.isArray(param)) {
        const values: any[] = [];
        for (const value of param) {
          values.push(toJsonable(value));
        }
        parsed.push(values);
      } else {
        parsed.push(toJsonable(param));
      }
    }
  } else {
    parsed = {};
    for (const key in params) {
      const param = params[key];
      if (Array.isArray(param)) {
        const values: any[] = [];
        for (const value of param) {
          values.push(toJsonable(value));
        }
        parsed[key] = values;
      } else {
        parsed[key] = toJsonable(param);
      }
    }
  }

  return JSON.stringify(parsed, null, space);
}
