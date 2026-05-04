# Architecture

## Purpose

Automate Airtable data processing using Python scripts executed locally or via GitHub Actions.

## Core Components

- config.json → defines task configurations
- scripts/ → executable scripts
- .github/workflows/run_airtable_script.yml → manual execution

## Project Structure

productOS/
|- config.json
|- scripts/
|  |- generate_descriptions.py
|  |- generate_skus.py
|  `- sku_dictionary.json
`- .github/workflows/run_airtable_script.yml

## Execution Flow

1. Select script (CLI or GitHub Actions)
2. Resolve task from config.json
3. Load Airtable + environment variables
4. Process records
5. Write results back to Airtable

## Design Rules

- No hardcoded table or field names → always use config.json
- Scripts must be task-driven
- All secrets come from environment variables
- Scripts should be idempotent (safe to re-run)

## Tasks

Current tasks:

- descriptions → text generation
- skus → SKU generation