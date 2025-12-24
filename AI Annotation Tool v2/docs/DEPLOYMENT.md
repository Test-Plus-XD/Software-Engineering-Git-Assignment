# Deployment Guide

This guide covers deploying the AI Dataset Annotation Tool v2 to production using Vercel.

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed locally
- A Vercel account
- A Firebase project with Authentication and Storage enabled
- A Google Cloud project with Gemini API access

## Environment Variables

### Required Environment Variables

Create these environment variables in your Vercel project settings:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Firebase Storage
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Database (SQLite file path for production)
DATABASE_PATH=/tmp/annotations.db

# Next.js Configuration
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com
```

### Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Authentication and Storage

2. **Generate Service Account Key**:
   - Go to Project Settings > Service Accounts
   - Generate new private key (JSON format)
   - Extract `project_id`, `private_key`, and `client_email` for environment variables

3. **Configure Authentication**:
   - Enable Google Sign-In provider
   - Add your domain to authorized domains

4. **Configure Storage**:
   - Set up Firebase Storage bucket
   - Configure security rules for authenticated uploads

### Google Gemini API Setup

1. **Enable Gemini API**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Gemini API
   - Create API key with appropriate restrictions

## Vercel Deployment

### Step 1: Prepare Your Repository

1. **Ensure all dependencies are installed**:
   ```bash
   cd "AI Annotation Tool v2"
   npm install
   ```

2. **Run tests to verify everything works**:
   ```bash
   npm test
   ```

3. **Build the application locally**:
   ```bash
   npm run build
   ```

### Step 2: Deploy to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project directory**:
   ```bash
   cd "AI Annotation Tool v2"
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new one
   - Set build command: `npm run build`
   - Set output directory: `.next`

### Step 3: Configure Environment Variables

1. **Via Vercel Dashboard**:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add all required variables listed above

2. **Via Vercel CLI**:
   ```bash
   vercel env add FIREBASE_PROJECT_ID
   vercel env add FIREBASE_PRIVATE_KEY
   vercel env add FIREBASE_CLIENT_EMAIL
   # ... add all other variables
   ```

### Step 4: Database Initialisation

The SQLite database will be automatically initialised on first deployment:

1. **Database Location**: `/tmp/annotations.db` (Vercel's temporary storage)
2. **Migrations**: Run automatically on application start
3. **Persistence**: Data persists during function execution but may be cleared between deployments

**Important**: For production use, consider migrating to a persistent database solution like:
- Vercel Postgres
- PlanetScale
- Supabase
- Railway

## Production Configuration

### Database Migration for Production

If using a persistent database instead of SQLite:

1. **Update database configuration** in `lib/database/config.js`
2. **Modify data access layer** to use appropriate database driver
3. **Update environment variables** with new database connection string

### Security Considerations

1. **Environment Variables**:
   - Never commit sensitive keys to version control
   - Use Vercel's environment variable encryption
   - Rotate keys regularly

2. **Firebase Security Rules**:
   ```javascript
   // Storage rules
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

3. **API Rate Limiting**:
   - Implement rate limiting for Gemini API calls
   - Monitor usage to avoid quota exceeded errors

### Performance Optimisation

1. **Image Optimisation**:
   - Use Next.js Image component for automatic optimisation
   - Configure appropriate image formats and sizes

2. **Caching**:
   - Enable Vercel's edge caching for static assets
   - Implement appropriate cache headers for API responses

3. **Bundle Analysis**:
   ```bash
   npm run analyze
   ```

## Monitoring and Maintenance

### Health Checks

Monitor these endpoints for application health:

- `GET /api/health` - Basic health check
- `GET /api/images` - Database connectivity
- `POST /api/auth/verify` - Firebase authentication

### Logging

Vercel automatically captures:
- Function logs
- Error tracking
- Performance metrics

Access logs via:
- Vercel Dashboard > Functions tab
- Vercel CLI: `vercel logs`

### Backup Strategy

**SQLite Database**:
- Regular exports via API endpoints
- Manual backups before major deployments

**Firebase Storage**:
- Automatic redundancy provided by Firebase
- Consider periodic exports for compliance

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify DATABASE_PATH environment variable
   - Check file permissions in Vercel environment

2. **Firebase Authentication Failures**:
   - Verify service account key format
   - Check Firebase project configuration
   - Ensure domain is in authorized domains list

3. **Gemini API Errors**:
   - Verify API key is valid and has quota
   - Check API is enabled in Google Cloud Console
   - Monitor rate limiting

4. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Review TypeScript compilation errors

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=true
NODE_ENV=development
```

## Rollback Strategy

If deployment issues occur:

1. **Immediate Rollback**:
   ```bash
   vercel rollback
   ```

2. **Specific Version Rollback**:
   - Go to Vercel Dashboard
   - Select previous deployment
   - Click "Promote to Production"

## Support

For deployment issues:

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Review [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
3. Consult [Firebase Setup Guide](https://firebase.google.com/docs/web/setup)

## Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Firebase authentication working
- [ ] Image upload to Firebase Storage working
- [ ] Database operations functioning
- [ ] Gemini chatbot accessible after login
- [ ] All API endpoints responding correctly
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring and logging active
- [ ] Backup strategy implemented