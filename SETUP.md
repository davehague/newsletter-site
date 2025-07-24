# Quick Setup Guide

## 🚀 5-Minute Local Setup

### 1. Clone & Install
```bash
git clone <repository-url>
cd newsletter-site2
npm install
```

### 2. Create Environment File
```bash
# Create .env file
cat > .env << 'EOF'
# Admin Authentication (Required)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$12$example.hash.generated.below

# Mailjet (Optional for development)
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_SECRET_KEY=your_mailjet_secret_key
MAILJET_LIST_ID=your_contact_list_id
FROM_EMAIL=newsletter@yourdomain.com
FROM_NAME=Your Newsletter Name

# Development settings
TEST_EMAIL=test@yourdomain.com
SITE_URL=http://localhost:3000
EOF
```

### 3. Generate Admin Password
```bash
# Generate password hash (replace 'yourpassword' with your desired password)
node -e "console.log(require('bcrypt').hashSync('yourpassword', 12))"

# Copy the output and replace the ADMIN_PASSWORD_HASH in .env
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access Admin Interface
- **Site**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login
- **Username**: `admin` (or whatever you set in ADMIN_USERNAME)
- **Password**: The password you used to generate the hash

## ✅ Verify Setup

### Test Admin Interface
1. Go to http://localhost:3000/admin/login
2. Login with your credentials
3. Visit http://localhost:3000/admin/posts/new
4. Create a test post using the WYSIWYG editor
5. Save and verify it appears in the posts list

### Test Content Generation
1. Create a post in the admin interface
2. Visit http://localhost:3000/api/build/generate-content
3. Check `/content/articles/` for your new markdown file
4. Visit the article on the frontend

## 🔧 Optional: Newsletter Setup

### Mailjet Configuration
1. Sign up at https://mailjet.com (free tier available)
2. Get your API keys from Account Settings → API Keys
3. Create a contact list and get the List ID
4. Update your `.env` file with the credentials

### Test Newsletter
1. Visit http://localhost:3000 and subscribe with your email
2. Create a post with `sendAsNewsletter: true`
3. Trigger newsletter sending via admin interface

## 🐛 Troubleshooting

### Common Issues

**Admin login fails:**
- Verify `ADMIN_PASSWORD_HASH` was generated correctly
- Check browser console for authentication errors

**Posts not saving:**
- Ensure `.tmp/storage/` directory can be created
- Check terminal for API errors

**Build errors:**
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires 18+)

### Need Help?
- Check the [Developer Documentation](./DEVELOPER.md)
- Review error messages in browser console and terminal
- Ensure all environment variables are set correctly

## 🚀 Production Deployment

When ready to deploy:

1. **Vercel Setup**:
   ```bash
   npm i -g vercel
   vercel --prod
   ```

2. **Enable Vercel KV**:
   - Vercel Dashboard → Storage → Create KV Database
   - Connect to your project

3. **Environment Variables**:
   - Copy all variables from `.env` to Vercel dashboard
   - Add `VERCEL_DEPLOY_HOOK_URL` (create via Settings → Git → Deploy Hooks)

4. **Test Production**:
   - Admin interface should work identically
   - Posts will use Vercel KV instead of local storage
   - Build triggers will actually deploy changes

---

**You're all set!** 🎉

The hybrid system gives you immediate feedback during development with the performance benefits of static generation in production.