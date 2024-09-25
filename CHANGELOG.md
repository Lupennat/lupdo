# Changelog

All notable changes to this project from 1.0.0 forward will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2024-09-25

### Breaking Changes

- `PARAM_DATETIMEZONE` renamed to `PARAM_DATETIMETZ`.
- nodejs < 18 is no longer supported.
- dist types folder is changed from `dist/typing` to `dist/types` all default export are removed.
- removed `TypedBinding` static `create` method.
- `TypedBinding` no longer accepts options.
- **(DEV)** new abstract `BaseTypeBinding` should be used to verify Parameter type.
- **(DEV)** changed `TypeBindingOptions` interface value can ve only `string|number|boolean`.

### Added

- `PARAM_DOUBLE`
- `PARAM_TIMESTAMPTZ`
- `PARAM_TIMETZ`
- `NumericTypedBinding`
- `PrecisionTypedBinding`
- `LengthTypedBinding`

## [3.4.0] - 2023-12-24

### Added

- `PdoStatementI.nextRowset` added, you can advances to the next rowset in a multi-rowset statement handle.

### Changed

- **(DEV)** please ensure your driver is updated for lupdo version 3.4.0,
- **(DEV)** support `pdo-raw-connection` methods `doQuery`, `executeStatement`, `execute`, `query` signature are changed to support multi-rowset statement.

## [3.3.0] - 2023-03-22

### Added

- `PdoConnectionI.version` added, you can retrieve db version from connection on `pool.created` callback.

### Changed

- `pool.created` and `pool.destroyed` callback can be promise/non-promise
- **(DEV)** please ensure your driver is updated for lupdo version 3.3.0 and implements abstract `pdoDriver.getVersionFromConnection(PoolConnection)`.

### Removed

- **(DEV)** please ensure your driver is updated for lupdo version 3.3.0 and remove abstract `pdoDriver.getServerVersion()`.

## [3.2.0] - 2023-03-22

### Added

- `pdo.getVersion()` return promise version of database
- **(DEV)** please ensure your driver is updated for lupdo version 3.1.7 and implements abstract `pdoDriver.getServerVersion()`.

## [3.1.6] - 2023-03-12

### Fixed

- `Pdologger` type and `Pool log` fixed argument list (level, message).

## [3.1.5] - 2023-03-11

### Added

- added `pdo.uuid` unique identifier.

## [3.1.4] - 2023-02-07

### Added

- `TypeBinding.toString()`

## [3.1.3] - 2023-01-13

### Changed

- prefer `create{Driver}Pdo(options)` instead of `new Pdo('driver', options)`

## [3.1.2] - 2023-01-13

### Added

- Added new param `PARAM_DATETIMEZONE`.

## [3.1.1] - 2023-01-11

### Added

- Added third parameter `TypeBindingOptions` optional to `TypeBinding`.

## [3.0.1] - 2023-01-11

### Fixed

- `PdoError` improve get message from `AggregateError`.

## [3.0.0] - 2023-01-10

### Added

- `TypedBinding`
- `ValidBindings` now accept `TypedBinding`
- **(DEV)** `ValidBindingsSingle` include the new `TypedBinding`, driver must support it.

## [2.1.0] - 2023-01-05

### Added

- statement `debugSent` method

### Changed

- debug params serialization improved for bigint, and date.
- `statements` isolation, debug now will be consistent with last snapshot.
- prepared statement `bindValue` and `execute` now accept Array of Values both on Numeric and Keyed.
- statement `fetchDictionary` now accept a custom Type `fetchDictionary<MyInterface>()` default is `Dictionary`.
- **(DEV)** `PdoColumnValue` type is changed, it can be `PdoColumnValueSingle` or `PdoColumnValueArray`to support array columns.
- **(DEV)** `ValidBindings` type is changed, it can be `ValidBindingsSingle` or `ValidBindingsArray`to support array parameters.
- **(DEV)** support `pdo-raw-connection` method `prepare` must return the statement.
- **(DEV)** support `pdo-raw-connection` method `execute` and `executeStatement` must return sql processed string as first element of array.
- **(DEV)** support `pdo-raw-connection` method `adaptBindValue` signature is changed.
- **(DEV)** please ensure your driver is updated for lupdo version 2.1.0.

## [2.0.3] - 2023-01-04

### Fixed

- `statements` isolation, now you can generate new statement inside a transaction without override previous statement.
- **(DEV)** prepared statement `execute` now reflect correctly parameters arguments, if parameters are passed to execute, the statement will use only received parameters, otherwise it will reuse bindedParameters.

### Changed

- support `pdo-statement` and `pdo-raw-connection` are changed to fix statements, please ensure your driver is updated for lupdo version 2.0.3.

## [2.0.2] - 2022-12-28

### Changed

- `attributes` are propagated to low raw-connection level.

## [2.0.1] - 2022-12-28

### Added

- `null` is a Valid Parameter Binding.

## [2.0.0] - 2022-12-28

### Changed

- `Statement.lastInsertId()` accept a parameter `name :string` and return a Promise. (this should allow the integration of drivers using sequences).

## [1.2.1] - 2022-12-27

### Added

- `Pdo.prototype.getRawDriverConnection<T>(): Promise<T>`.

## [1.2.0] - 2022-12-26

### Changed

- Pdo prepared statement `bindValue(key: string | number, value: ValidBindings)` Fails Loudly if number <= 0.

## [1.1.2] - 2022-12-26

### Fixed

- Pdo extra `Attributes` now can be defined only through Driver Implementation.

### Changed

- Pdo driver constructor refactoring to use custom `driverAttributes` object.

## [1.1.1] - 2022-12-26

### Changed

- `Pdo.exec` under the hood call a new RawConnection method exec.
- `Pdo.RawConnection` must implements `abstract doExec` method.

## [1.0.1] - 2022-12-24

### Changed

- `PdoDriverConstructor` parameter `driverOptions` now is `any`.

## [1.0.0] - 2022-12-24

First Public Release On Npm.
