# Changelog

All notable changes to this project from 1.0.0 forward will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
