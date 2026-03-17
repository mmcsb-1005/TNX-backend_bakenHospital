# Deployment Guide for Render

## Prerequisites
- GitHub repository with your code
- Render account (https://render.com)
- PostgreSQL database (can use Render's PostgreSQL or external like Neon)

## Step-by-Step Deployment

### 1. Prepare Your Environment Variables

In Render dashboard, you'll need to set these environment variables:

```
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET=your-super-secret-jwt-key-here
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-admin-password
MAIL_HOST=your-mail-host
MAIL_PORT=465
MAIL_USER=your-email@domain.com
MAIL_PASS=your-email-password
MAIL_FROM=your-email@domain.com
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
NODE_ENV=production
```

### 2. Create Web Service on Render

1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the backend folder (or root if backend is root)

### 3. Configure Build Settings

**Environment**: `Node`

**Build Command**: 
```bash
npm run build
```

**Start Command**:
```bash
npm start
```

**Important Notes**:
- The build command will automatically:
  1. Install dependencies
  2. Generate Prisma Client (creates TypeScript types)
  3. Run database migrations
  4. Generate Swagger documentation
  5. Compile TypeScript to JavaScript
- Make sure the `postinstall` script runs after npm install to generate Prisma client

**Branch**: `main` or `master` (your default branch)

### 4. Add Environment Variables

In the "Environment" section, add all the variables listed in step 1.

### 5. Deploy

Click "Create Web Service" and Render will:
1. Install dependencies
2. Run the build script (compile TypeScript + generate Prisma client)
3. Start the server with the start command

### 6. Database Migration

After first deployment, you may need to run migrations:

1. Go to your service's Shell tab in Render
2. Run:
```bash
npx prisma migrate deploy
```

Or if using `prisma db push`:
```bash
npx prisma db push
```

## Build Scripts Explanation

- `npm run build`: Compiles TypeScript to JavaScript in `/dist` folder and generates Prisma Client
- `npm start`: Runs the compiled JavaScript from `/dist/index.js`
- `npm run dev`: For local development with hot reload

## Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify DATABASE_URL is accessible from Render
- Check build logs for specific errors

### Database Connection Issues
- Ensure DATABASE_URL is correct
- If using Neon, make sure to use the pooled connection string
- Check if database allows connections from Render's IP ranges

### Prisma Client Not Generated
- Make sure `postinstall` script runs: `npx prisma generate`
- Check that `prisma` package is in dependencies (not devDependencies)

### Port Issues
- Render automatically sets the PORT environment variable
- Make sure your app reads from `process.env.PORT || 3001`

## Health Check

Render will check if your service is running. Make sure:
- Your app starts successfully
- Port is correctly configured
- A basic endpoint (like `/`) responds with 2xx status

## Custom Domain

After deployment, you can add a custom domain in Render's settings.

## Auto-Deploy

Render automatically deploys when you push to your connected branch.

## Logs

View real-time logs in Render dashboard under the "Logs" tab.
