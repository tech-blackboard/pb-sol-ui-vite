# Deployment Update Required - Fix 413 Error

## What Changed

Updated `nginx.conf.template` to allow larger file uploads (up to 50MB).

**File:** `pb-sol-ui-vite/nginx.conf.template`

**Change:**
```nginx
location ~ ^/(auth|abstract|...) {
    # Added this line:
    client_max_body_size 50M;
    
    proxy_pass http://${API_BACKEND_HOST}:3000;
    # ... rest of config
}
```

## Deployment Steps

### Option 1: Using Docker (Recommended)

If you're using Docker, the nginx configuration will be automatically updated when you rebuild:

```bash
# In pb-sol-ui-vite directory
docker build -t pb-sol-ui-vite:latest .
docker-compose up -d
```

or if you have a specific build script:

```bash
npm run build
# Then deploy the built Docker image
```

### Option 2: Manual Update (EC2/VPS)

1. **Pull the latest code:**
   ```bash
   cd /path/to/pb-sol-ui-vite
   git pull origin main  # or your branch name
   ```

2. **Rebuild the Docker container** (if using Docker):
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

3. **Or copy the updated nginx config** (if not using Docker):
   ```bash
   # Replace the nginx config
   sudo cp nginx.conf.template /etc/nginx/sites-available/pb-sol-ui-vite
   
   # Test configuration
   sudo nginx -t
   
   # Reload nginx
   sudo systemctl reload nginx
   ```

### Option 3: Cloud Deployment (AWS/Azure/GCP)

Follow your usual deployment pipeline. The updated `nginx.conf.template` will be included in the next deployment.

## Verification

After deployment, test the fix:

1. **Try uploading a small abstract file** (< 1MB)
   - Should work ✅

2. **Try uploading a larger abstract file** (10-20MB)
   - Should work ✅ (previously would fail with 413)

3. **Monitor nginx logs** if issues persist:
   ```bash
   docker logs <nginx-container-name> -f
   # or
   sudo tail -f /var/log/nginx/error.log
   ```

## What This Fixes

- ✅ **413 Request Entity Too Large** error when uploading abstract files
- ✅ Allows PDF, Word documents, and other files up to **50MB**
- ✅ Already applied to all API routes (auth, abstract, upload, etc.)

## Current Upload Limits

| Type | Old Limit | New Limit |
|------|-----------|-----------|
| Abstract Files | ~1MB (nginx default) | **50MB** |
| API Request Body | ~1MB (nginx default) | **50MB** |

## Notes

- The `client_max_body_size 50M;` directive is set **only** for API proxy routes
- Static frontend assets are not affected
- If you need larger uploads (e.g., 100MB), change the value accordingly
- Frontend uploads are already handled correctly by the API

## Rollback (if needed)

If you need to rollback this change:

```bash
git revert <commit-hash>
# Then redeploy
```

Or manually remove the `client_max_body_size 50M;` line from `nginx.conf.template`.

---

**Status:** ✅ Ready for deployment
**Priority:** High (fixes user-facing error)
**Breaking Changes:** None
