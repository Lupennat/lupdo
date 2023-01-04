# Changelog

All notable changes to this project from 1.0.0 forward will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.3] - 2022-01-04

### Fixed

-   `statements` isolation, now you can generate new statement inside a transaction without override previous statement
-   prepared statement `execute` now reflect correctly parameters arguments, if parameters are passed to execute, the statement will use only received parameters, otherwise it will reuse bindedParameters.

### Changed

-   support `pdo-statement` and `pdo-raw-connection` are changed to fix statements, please ensure your driver is updated for lupdo version 2.0.3

## [2.0.2] - 2022-12-28

### Changed

-   `attributes` are propagated to low raw-connection level

## [2.0.1] - 2022-12-28

### Added

-   `null` is a Valid Parameter Binding

## [2.0.0] - 2022-12-28

### Changed

-   `Statement.lastInsertId()` accept a parameter `name :string` and return a Promise. (this should allow the integration of drivers using sequences)

## [1.2.1] - 2022-12-27

### Added

-   `Pdo.prototype.getRawDriverConnection<T>(): Promise<T>`

## [1.2.0] - 2022-12-26

### Changed

-   Pdo prepared statement `bindValue(key: string | number, value: ValidBindings)` Fails Loudly if number <= 0

## [1.1.2] - 2022-12-26

### Fixed

-   Pdo extra `Attributes` now can be defined only through Driver Implementation

### Changed

-   Pdo driver constructor refactoring to use custom `driverAttributes` object

## [1.1.1] - 2022-12-26

### Changed

-   `Pdo.exec` under the hood call a new RawConnection method exec
-   `Pdo.RawConnection` must implements `abstract doExec` method

## [1.0.1] - 2022-12-24

### Changed

-   `PdoDriverConstructor` parameter `driverOptions` now is `any`

## [1.0.0] - 2022-12-24

First Public Release On Npm
