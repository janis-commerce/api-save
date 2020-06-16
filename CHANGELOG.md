# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [5.0.0] - 2020-06-16
### Changed
- API upgraded to v5 (`api-session` validates locations) (**BREAKING CHANGE**)

## [4.5.0] - 2020-05-19
### Removed
- `package-lock.json` file

## [4.4.2] - 2020-05-15
### Changed
- Dependencies updated

## [4.4.1] - 2020-04-16
### Changed
- Dependencies updated

## [4.4.0] - 2020-04-07
### Added
- Duplicated Key Error handler

## [4.3.2] - 2020-02-18
### Changed
- Dependencies updated

## [4.3.1] - 2020-01-21
### Changed
- Dependencies updated

## [4.3.0] - 2019-12-10
### Added
- New method `postStructValidate` to add extra validation post struc validation

## [4.2.1] - 2019-11-13
### Changed
- Updated `api` dependency

## [4.2.0] - 2019-10-15
### Added
- API post save hook

## [4.1.0] - 2019-10-08
### Added
- Now `format` method can be asynchronous

## [4.0.0] - 2019-10-02
### Changed
- API upgraded to v4 (`api-session` injected) (**BREAKING CHANGE**)
- Model v3 compatibility (`api-session` injection) (**BREAKING CHANGE**)

## [3.0.2] - 2019-09-30
### Fixed
- README fixed for relationship models property `modelClass`
- Relationships are now saved properly
- Empty relationships now works as expected instead of throwing an error

## [3.0.1] - 2019-08-06
### Fixed
- Client models not work as expected

## [3.0.0] - 2019-08-01
### Changed
- Now the validation struct is defined as 3 optional getters (BREAKING CHANGE). See README for new documentation.

## [2.2.0] - 2019-07-31
### Changed
- Now the validation struct can return a simple object, not a struct function.

### Fixed
- README updated and improved

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
