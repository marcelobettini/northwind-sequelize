## Project Context

- Backend application built with Node.js, Express, Sequelize, and MySQL.
- Initial starter project (Greenfield). Keep the implementation simple and introduce complexity only when required by explicit specs.

## Technology Stack & Versions

- **Node.js:** v24
- **Express:** v5
- **Sequelize:** v6
- **mysql2:** v3
- **Database:** MySQL

Respect these versions. Do not upgrade major versions or modify dependency constraints without explicit authorization.

## Database & Schema

- The MySQL database schema is defined in `./db-schema/northwind.sql`.
- Treat this SQL schema as the single source of truth for tables, columns, data types, primary keys, foreign keys, indexes, and constraints.
- Do not assume relationships exist unless explicitly declared in the schema.
- Do not modify the database schema or introduce migrations without an explicit requirement.

## Dependencies Management

- **Lean Dependencies:** Prefer existing tools over introducing new packages. Add a dependency only when it provides clear value for a concrete requirement.
- **Lockfile Integrity:** Keep `package.json` and the lockfile synchronized and committed to version control.
- **No Unnecessary Abstractions:** Avoid speculative frameworks, utilities, or architectural complexity.

## General Guidelines for AI Agents

- **Task Scope:** Keep changes strictly focused on the requested task or specification. Avoid unrelated refactoring and speculative functionality.
- **No Assumptions:** Do not assume requirements or business logic that have not been specified.
- **Consistency:** Follow clean code principles and establish clean patterns as you build out the initial modules.
- **Validation:** Verify changes with tests or validation commands available in the project whenever applicable.