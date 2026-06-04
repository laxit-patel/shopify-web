# shopify-web staging (OpenTofu)

Separate EC2 from **avip** backend. Same region/key pair is fine.

```bash
cp environments/staging/terraform.tfvars.example environments/staging/terraform.tfvars
# edit key_name, avip_backend_url

aws login
bash ../../scripts/apply-staging-infra.sh
```

Outputs: `public_ip`, `app_url` (sslip.io), `avip_backend_url`.

Then bootstrap host: [../../deploy/README.md](../../deploy/README.md)
