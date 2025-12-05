# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Multi-provider email support (AWS SES and Resend)
- Comprehensive rate limiting on all email-sending endpoints
- Donation links (Buy Me a Coffee integration)
- CSRF protection on all state-changing endpoints
- GitHub Actions CI/CD pipeline
- Comprehensive security documentation

### Changed

- Improved session refresh after verification
- Enhanced email abuse protections

### Fixed

- Admin signup validation bug with empty name field
- Navigation state not updating after login

## [1.0.0] - 2025-12-02

### Added

- Initial release
- Password-free authentication with email verification
- Secret Santa lottery with no-self-assignment guarantee
- Bilingual support (English and Portuguese)
- Group management and invitation system
- Email notifications for assignments
- MongoDB database integration
- Encrypted session management
- Modern UI with Shadcn components
- Responsive design
- Dark mode support

[Unreleased]: https://github.com/ssmcb/santa/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ssmcb/santa/releases/tag/v1.0.0
