import {
  PARAM_CHAR,
  PARAM_DATETIME,
  PARAM_DATETIMETZ,
  PARAM_DECIMAL,
  PARAM_DOUBLE,
  PARAM_NUMERIC,
  PARAM_TIME,
  PARAM_TIMESTAMP,
  PARAM_TIMESTAMPTZ,
  PARAM_TIMETZ,
  PARAM_VARBINARY,
  PARAM_VARCHAR,
} from '../constants';

export interface TypeBindingOptions {
  [key: string]: number | string | boolean | undefined;
}

export interface LengthTypeBindingOptions extends TypeBindingOptions {
  length?: number | 'max';
}

export type LengthType =
  | typeof PARAM_CHAR
  | typeof PARAM_VARCHAR
  | typeof PARAM_VARBINARY;

export type LengthValidPrimitive = string | Buffer | null;

export interface NumericTypeBindingOptions extends TypeBindingOptions {
  total?: number;
  places?: number;
}

export type NumericValidPrimitive = string | bigint | number | null;

export type NumericType =
  | typeof PARAM_DECIMAL
  | typeof PARAM_NUMERIC
  | typeof PARAM_DOUBLE;

export interface PrecisionTypeBindingOptions extends TypeBindingOptions {
  precision?: number;
}

export type PrecisionType =
  | typeof PARAM_DATETIME
  | typeof PARAM_DATETIMETZ
  | typeof PARAM_TIMESTAMP
  | typeof PARAM_TIMESTAMPTZ
  | typeof PARAM_TIME
  | typeof PARAM_TIMETZ;

export type PrecisionValidPrimitive = string | Date | null;
