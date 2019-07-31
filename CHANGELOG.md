# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.1] - 2019-07-31
### Fixed
- Default struct fixed so it now returns no relationships

## [2.1.0] - 2019-07-26
### Added
- Support for client specific models instanciation

### Changed
- Now save APIs rely on API package, so they can be handled as common REST APIs

### Fixed
- README updated

## [2.0.0] - 2019-07-18
### Changed
- Browse APIs paths changed. Now MS_PATH env var is taken into account.
- Now relationships configurations receive a `modelClass` instead of a `model`

## [1.1.2] - 2019-07-02
### Fixed
- Version bump for already published version 1.1.1

## [1.1.1] - 2019-07-02
### Fixed
- ApiSaveData now checks for not saved MainData

## [1.1.0] - 2019-06-28
### Added
- ApiSaveData now accepts a `format()` hook to manipulate main data before saving

## [1.0.1] - 2019-06-27
### Changed
- ApiSave renamed to ApiSaveData

## [1.0.0] - 2019-06-26
### Added
- Project inited
- API Handler
- Tests
