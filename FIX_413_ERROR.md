# Fixing 413 Request Entity Too Large Error

## Problem
When uploading abstract files, you're getting a **413 Request Entity Too Large** error from nginx. This error occurs when the uploaded file exceeds the maximum request body size limit configured in nginx.

![413 Error Screenshot](file:///C:/Users/prash/.gemini/antigravity/brain/1f0fa68d-087b-4cc7-8a20-f90e04de9fa6/uploaded_media_1769670268493.jpg)

## Root Cause
The nginx web server has a default `client_max_body_size` limit (usually 1MB). When users upload larger abstract files (PDFs, documents), the request exceeds this limit.

## Solutions

### Solution 1: Update Nginx Configuration (Recommended)

#### For Nginx Reverse Proxy

1. **Locate your nginx configuration file:**
   - Main config: `/etc/nginx/nginx.conf`
   - Site config: `/etc/nginx/sites-available/your-site` or `/etc/nginx/conf.d/your-site.conf`

2. **Add or update `client_max_body_size`:**

```nginx
http {
    # ... other config ...
    
    # Set max upload size to 50MB (adjust as needed)
    client_max_body_size 50M;
    
    # ... other config ...
}
```

Or in your specific `server` block:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Set max upload size to 50MB
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Also set for proxy
        client_max_body_size 50M;
    }
}
```

3. **Test configuration:**
```bash
sudo nginx -t
```

4. **Reload nginx:**
```bash
sudo systemctl reload nginx
# or
sudo service nginx reload
```

---

### Solution 2: Docker/Docker Compose Configuration

If you're using Docker with nginx:

#### docker-compose.yml

Add nginx configuration volume:

```yaml
services:
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./nginx-site.conf:/etc/nginx/conf.d/default.conf
```

#### nginx-site.conf

```nginx
server {
    listen 80;
    server_name localhost;
    
    # Increase upload limit to 50MB
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### Solution 3: Application-Level Limit (Optional)

You can also add file size validation in your NestJS application:

#### Update abstract.controller.ts

```typescript
import { MaxFileSizeValidator, ParseFilePipe, FileTypeValidator } from '@nestjs/common';

@Post()
@Roles('ADMIN', 'USER')
@RequirePermissions('create:abstract')
@UseInterceptors(FileInterceptor('file'))
@ApiOperation({ summary: 'Create a new abstract' })
@ApiResponse({ status: 201, description: 'Abstract created successfully' })
@ApiResponse({ status: 400, description: 'Bad request' })
@ApiResponse({ status: 413, description: 'File too large' })
async create(
  @Body() createAbstractDto: CreateAbstractDto,
  @Request() req,
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
        new FileTypeValidator({ fileType: /(pdf|doc|docx)$/ }), // Optional: restrict file types
      ],
      fileIsRequired: false,
    }),
  )
  file?: Express.Multer.File
) {
  // ... existing code ...
}
```

---

## Recommended Settings

### For Abstract/Document Uploads

```nginx
# Recommended: 50MB for documents
client_max_body_size 50M;

# If you expect very large files (presentations, videos):
client_max_body_size 100M;
```

### Additional nginx Timeouts (if needed)

For large file uploads, you might also need to increase timeouts:

```nginx
server {
    # ... other config ...
    
    client_max_body_size 50M;
    client_body_timeout 300s;     # 5 minutes
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}
```

---

## Verification Steps

After applying the fix:

1. **Restart nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

2. **Test with a small file:** Try uploading a small abstract file (< 1MB)

3. **Test with a larger file:** Try uploading a file around 10-20MB

4. **Check nginx logs if issues persist:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

---

## Common Issues

### Issue: Still getting 413 error

**Check:**
- Multiple nginx config files might exist - ensure you updated the correct one
- Docker container might not have been restarted
- CDN/Load balancer in front of nginx might have its own limits

### Issue: Timeout errors with large files

**Solution:** Increase timeout values as shown in "Additional nginx Timeouts" section above

### Issue: EC2/Cloud hosting

**For AWS EC2, Lightsail, etc:**
- Ensure security groups allow traffic on ports 80/443
- Check if Application Load Balancer has size limits
- Verify CloudFront settings if using CDN

---

## Quick Fix for Development

If you're using the NestJS development server directly (without nginx):

The default limit is usually sufficient, but you can increase it in `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Increase JSON body size limit
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  await app.listen(3000);
}
bootstrap();
```

---

## Summary

**Most Common Fix:**
```nginx
# In your nginx config:
client_max_body_size 50M;

# Then reload:
sudo nginx -t && sudo systemctl reload nginx
```

This should resolve the 413 error for abstract file uploads! 🎉
