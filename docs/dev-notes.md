# Dev Notes: Asset Uploads + Generate Edge

## Storage setup (Supabase)

The frontend uploader stores user images in Storage bucket `project-assets` (or `VITE_SUPABASE_UPLOADS_BUCKET`).

- Migration: `supabase/migrations/20260301123000_storage_project_assets_policies.sql`
- Upload prefixes used by app:
  - `refs/*` (subject/style/reference images)
  - `builder/*` (social builder logo/product/background/overlays)

If you prefer a private bucket, keep storing `path` in spec and generate signed URLs on demand before render/compile.
Current implementation returns public URL and expects public bucket access.

## Edge function placement

Edge function must live at:

- `supabase/functions/generate-image/index.ts`

Deno import used:

- `import { createClient } from "https://esm.sh/@supabase/supabase-js@2";`

## Deploy commands

```bash
supabase functions deploy generate-image
```

For local serve:

```bash
supabase functions serve generate-image --env-file supabase/.env
```

## Required Edge env vars

- `GCP_PROJECT_ID`
- `GCP_LOCATION` (default `us-central1`)
- `GCP_SA_KEY_B64` (base64 encoded GCP service account JSON)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`)
- Optional:
  - `GENS_BUCKET`
  - `SIGNED_URL_TTL_SECONDS`

## Frontend call contract

POST `${VITE_SUPABASE_URL}/functions/v1/generate-image` with:

```json
{
  "prompt": "...",
  "width": 1080,
  "height": 1350,
  "seed": 12345,
  "negativePrompt": "...",
  "module": "ecom_banner"
}
```

Response includes:

```json
{
  "generationId": "...",
  "signedUrl": "...",
  "provider": "vertex-imagen",
  "bucket": "...",
  "path": "...",
  "mime": "image/png",
  "width": 1080,
  "height": 1350,
  "creditsUsed": 1,
  "createdAt": "..."
}
```

## Test plan

1. Upload subject image and confirm `spec.subjectImageUrl` is `https://...` and `spec.subjectImagePath` is set.
2. Upload style ref and confirm `spec.ecomV2.styleRefImageUrl` + `styleRefImagePath` are set.
3. Upload a `referenceImages[]` item and confirm stored URL is remote (not `data:`).
4. Refresh app and confirm projects load without localStorage quota errors.
5. Generate image and confirm response includes `signedUrl` and preview renders.
