# Developer Documentation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Local Development Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd newsletter-site
   npm install
   ```

2. **Environment Variables**
   Create `.env` file in the project root:
   ```bash
   # Admin Authentication
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH=<bcrypt-hash-of-your-password>
   
   # Mailjet Configuration
   MAILJET_API_KEY=your-mailjet-api-key
   MAILJET_SECRET_KEY=your-mailjet-secret-key
   MAILJET_LIST_ID=your-mailjet-list-id
   FROM_EMAIL=newsletter@yourdomain.com
   FROM_NAME=Your Newsletter Name
   
   # Optional: Test email for development
   TEST_EMAIL=test@yourdomain.com
   
   # Production only (set in Vercel dashboard)
   VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
   ```

3. **Generate Admin Password Hash**
   ```bash
   node -e "console.log(require('bcrypt').hashSync('your-password', 12))"
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access Admin Panel**
   - Visit: `http://localhost:3000/admin`
   - Login with your admin credentials

## 🏗️ Architecture Overview

### Hybrid Content Management

This project uses a unique hybrid approach combining database flexibility with static site performance:

```
Admin Creates Post → Database Storage → Build Process → Static Files → Production Site
     ↓                    ↓                ↓              ↓
  Instant UI          Live Preview    Optimization    Fast Loading
```

### Storage Strategy

| Environment | Storage Type | Location | Purpose |
|-------------|--------------|----------|---------|
| **Development** | File System | `.tmp/storage/` | Local testing |
| **Production** | Upstash Redis | Cloud database | Temporary staging |
| **Final** | Static Files | `/content/articles/` | Published content |

## 📁 Project Structure

```
newsletter-site2/
├── components/
│   └── admin/                    # Admin interface components
│       ├── MetadataForm.vue      # Post metadata editor
│       ├── PostEditor.vue        # Dual-mode WYSIWYG/Markdown editor
│       └── PostsList.vue         # Posts management interface
├── content/
│   └── articles/                 # Published markdown files
├── middleware/
│   └── auth.ts                   # Admin route protection
├── pages/
│   ├── admin/                    # Admin panel pages
│   │   ├── index.vue             # Dashboard
│   │   ├── login.vue             # Authentication
│   │   └── posts/                # Post management
│   │       ├── index.vue         # Posts list
│   │       ├── new.vue           # Create post
│   │       └── edit/[slug].vue   # Edit post
│   ├── articles/[...slug].vue    # Article display
│   └── index.vue                 # Homepage
├── server/
│   ├── api/
│   │   ├── admin/posts/          # Post CRUD API
│   │   ├── auth/                 # Authentication API
│   │   ├── build/                # Build trigger API
│   │   └── cron/                 # Automated jobs
│   └── utils/
│       └── tempPostManager.ts    # Database utilities
├── scripts/
│   └── generate-content.mjs      # Build-time content generation
└── templates/
    └── newsletter.mjml           # Email template
```

## 🛠️ Development Workflow

### Creating a New Post

1. **Via Admin Interface** (Recommended)
   - Visit `/admin/posts/new`
   - Fill in metadata (title, description, tags, etc.)
   - Write content using WYSIWYG or Markdown editor
   - Save (stored in local database for immediate preview)

2. **Direct Markdown File** (Traditional)
   - Create `.md` file in `/content/articles/`
   - Add YAML frontmatter
   - Content appears immediately

### Testing Content Generation

```bash
# Manually trigger content generation
curl http://localhost:3000/api/build/generate-content

# Or via admin interface
# Visit /admin/posts and click "Trigger Build"
```

### Editor Modes

The post editor supports three modes:

1. **WYSIWYG Mode**: Rich text editing with toolbar
2. **Markdown Mode**: Raw markdown editing with syntax highlighting  
3. **Preview Mode**: Live preview of rendered content

Switch between modes using the toggle buttons in the editor interface.

## 🚀 Production Deployment

### Vercel Setup

1. **Create Vercel Project**
   ```bash
   vercel --prod
   ```

2. **Enable Upstash Redis (KV Storage)**
   - Go to Vercel Dashboard → Storage → Create Database
   - Select **Upstash** from Marketplace Database Providers
   - Choose **Redis** option (not Vector/Queue)
   - Click "Connect Project" to auto-configure environment variables
   - Add KV environment variables to your local `.env` file:
   ```env
   # KV Store Configuration (from Upstash dashboard)
   STORAGE_KV_URL="rediss://default:..."
   STORAGE_KV_REST_API_URL="https://your-redis-instance.upstash.io"
   STORAGE_KV_REST_API_TOKEN="your-api-token"
   STORAGE_KV_REST_API_READ_ONLY_TOKEN="your-read-only-token"
   STORAGE_REDIS_URL="rediss://default:..."
   ```

3. **Set Environment Variables**
   In Vercel dashboard, add all variables from your `.env` file plus:
   ```
   VERCEL_DEPLOY_HOOK_URL=<your-deploy-hook-url>
   ```

4. **Create Deploy Hook**
   - Vercel Dashboard → Settings → Git → Deploy Hooks
   - Create hook for `main` branch
   - Copy URL to `VERCEL_DEPLOY_HOOK_URL`

### Build Process

The production build process:

1. **Pre-build**: Content generation from database
2. **Build**: Nuxt builds static site with content
3. **Deploy**: Site goes live
4. **Cleanup**: Database entries removed

### Automated Scheduling

Two cron jobs run automatically:

- **2 AM Daily**: Check for pending posts, trigger build if needed
- **2 PM Daily**: Send newsletter campaigns

## 🧪 Testing

### Manual Testing Checklist

**Admin Interface:**
- [ ] Login/logout functionality
- [ ] Create new post (both WYSIWYG and Markdown modes)
- [ ] Edit existing post
- [ ] Delete post
- [ ] Preview functionality
- [ ] Manual build trigger

**Content Display:**
- [ ] Homepage shows articles
- [ ] Individual article pages load
- [ ] Tags and filtering work
- [ ] Newsletter signup form

**API Endpoints:**
- [ ] All admin API routes return proper responses
- [ ] Authentication middleware protects routes
- [ ] Error handling works correctly

### Testing Commands

```bash
# Start development server
npm run dev

# Build for production (tests build process)
npm run build

# Preview production build
npm run preview

# Test content generation
curl http://localhost:3000/api/build/generate-content
```

## 🔧 Troubleshooting

### Common Issues

**"Storage driver not found" in development:**
- Ensure `.tmp/storage/` directory is created
- Check Nuxt config storage driver setting

**Admin login fails:**
- verify `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` environment variables
- Ensure password hash was generated with bcrypt rounds=12

**Posts not appearing after creation:**
- Check browser network tab for API errors
- Verify post was saved to storage (check `.tmp/storage/` in dev)
- Try manual content generation

**Build fails in production:**
- Check Vercel build logs for specific errors
- Ensure all environment variables are set
- Verify Upstash Redis KV is properly connected
- Check that KV environment variables are set in Vercel dashboard

### Debug Mode

Enable debug logging:

```bash
# Development
DEBUG=nuxt:* npm run dev

# Check storage contents (development)
ls -la .tmp/storage/
```

### Storage Inspection

**Development (File System):**
```bash
# List temporary posts
find .tmp/storage -name "*temp-post*" -type f

# View post content
cat .tmp/storage/temp-post:example-slug
```

**Production (Upstash Redis KV):**
Access via Upstash dashboard, Vercel dashboard, or API calls to admin endpoints.

## 📚 Key Dependencies

| Package | Purpose | Documentation |
|---------|---------|---------------|
| `@nuxt/content` | Static content management | [Docs](https://content.nuxt.com/) |
| `@tiptap/vue-3` | WYSIWYG editor | [Docs](https://tiptap.dev/) |
| `@vercel/kv` | Database storage | [Docs](https://vercel.com/docs/storage/vercel-kv) |
| `nuxt-auth-utils` | Authentication | [Docs](https://github.com/atinux/nuxt-auth-utils) |
| `marked` | Markdown processing | [Docs](https://marked.js.org/) |
| `mjml` | Email templates | [Docs](https://mjml.io/) |
| `node-mailjet` | Email sending | [Docs](https://github.com/mailjet/mailjet-apiv3-nodejs) |

## 🤝 Contributing

### Code Style

- Use TypeScript for type safety
- Follow Vue 3 Composition API patterns
- Use Tailwind CSS for styling
- Add JSDoc comments for complex functions

### Pull Request Process

1. Create feature branch from `main`
2. Make changes and test locally
3. Update documentation if needed
4. Submit PR with clear description
5. Ensure all checks pass

### Adding New Features

When adding new admin features:

1. Create API routes in `/server/api/admin/`
2. Add authentication checks
3. Create Vue components in `/components/admin/`
4. Add pages in `/pages/admin/`
5. Update this documentation

## 📞 Support

For issues or questions:

1. Check this documentation first
2. Review error logs (browser console, Vercel logs)
3. Create GitHub issue with reproduction steps
4. Include environment details (local vs production)

## 🔄 Migration Notes

### From Previous Version

If migrating from a simpler setup:

1. Existing markdown files in `/content/articles/` will continue to work
2. Admin interface provides additional editing capabilities
3. No changes needed to frontend display components
4. Environment variables need to be added for admin functionality

The hybrid system is fully backward compatible with existing Nuxt Content setups.