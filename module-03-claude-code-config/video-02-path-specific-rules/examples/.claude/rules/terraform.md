---
paths: ["terraform/**/*.tf", "terraform/**/*.tfvars"]
---

# Terraform conventions

- Use `terraform fmt` before every commit.
- Resource names: `snake_case`, prefixed with environment (`prod_`, `stg_`).
- Never hardcode secrets — always `var.` references pulled from tfvars.
- New modules must include `README.md` + `variables.tf` with descriptions.
