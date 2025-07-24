# Newsletter Site

A modern newsletter website built with Nuxt 3, featuring a hybrid content management system that combines database flexibility with static site performance. Create and edit posts with a powerful WYSIWYG/Markdown editor, then automatically publish them as optimized static files.

## ✨ Key Features

- 🎨 **Dual-Mode Editor**: WYSIWYG and Markdown editing with real-time preview
- ⚡ **Hybrid Architecture**: Database flexibility + static site performance
- 🔐 **Admin Authentication**: Secure bcrypt-based login system
- 📧 **Newsletter Integration**: Automated email campaigns via Mailjet
- 🏷️ **Smart Tagging**: Filter and organize content by tags
- 🚀 **Instant Preview**: Real-time content preview during editing
- 📱 **Responsive Design**: Mobile-first design with Tailwind CSS
- 🔄 **Auto Publishing**: Scheduled builds with smart change detection
- 🛠️ **Developer Friendly**: Local development with full feature parity

## 🏗️ Hybrid Content Management

### How It Works
```
Create/Edit Post → Database Storage → Build Process → Static Files → Fast Loading
     ↓               ↓                  ↓              ↓
  Instant UI      Live Preview      Optimization    SEO Performance
```

### Benefits
- **Immediate Feedback**: Edit and preview posts instantly
- **Static Performance**: Final content served as fast static files
- **SEO Optimized**: Server-side rendered with perfect meta tags
- **Cost Effective**: Minimal database usage, leveraging Vercel's free tiers

## 🛠️ Tech Stack

- **Framework**: Nuxt 3
- **Content Management**: Hybrid (@nuxt/content + Vercel KV)
- **Editor**: Tiptap (WYSIWYG) + Markdown support
- **Authentication**: nuxt-auth-utils + bcrypt
- **Styling**: Tailwind CSS + Typography Plugin
- **Database**: Upstash Redis (prod) / File System (dev)
- **Email Service**: Mailjet API + MJML templates
- **Deployment**: Vercel with automated builds

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd newsletter-site
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Mailjet credentials
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Visit Site**
   - Site: http://localhost:3000
   - Admin Login: http://localhost:3000/admin/login
   - Admin Dashboard: http://localhost:3000/admin (requires authentication)

## Environment Variables

Create a `.env` file with the following variables:

```env
# Mailjet Configuration
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_SECRET_KEY=your_mailjet_secret_key
MAILJET_LIST_ID=your_contact_list_id

# Email Settings
FROM_EMAIL=newsletter@yourdomain.com
FROM_NAME=Your Newsletter
TEST_EMAIL=test@yourdomain.com

# Site Configuration
SITE_URL=https://your-site.vercel.app

# Admin Authentication
# Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
NUXT_SESSION_PASSWORD=your-32-character-secret-key-for-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=bcrypt-hashed-password

# KV Store Configuration (Production only - from Upstash Redis)
STORAGE_KV_URL="rediss://default:..."
STORAGE_KV_REST_API_URL="https://your-redis-instance.upstash.io"
STORAGE_KV_REST_API_TOKEN="your-api-token"
STORAGE_KV_REST_API_READ_ONLY_TOKEN="your-read-only-token"
STORAGE_REDIS_URL="rediss://default:..."
```

## Content Structure

Articles are stored in `/content/articles/*.md` with frontmatter:

```yaml
---
title: 'Your Article Title'
description: 'SEO description for the article'
publishedAt: '2025-07-22'
tags: ['nuxt', 'web-development']
sendAsNewsletter: false  # Set to true to queue for newsletter
newsletterSentAt: null   # Updated automatically after sending
---

# Your Article Content

Write your article content here in **Markdown**.
```

## 🔌 API Endpoints

### Admin Post Management
- `GET/POST /api/admin/posts` - List and create posts
- `GET/PUT/DELETE /api/admin/posts/[slug]` - Individual post operations
- `POST /api/admin/posts/[slug]/preview` - Generate live preview
- `POST /api/admin/build/trigger` - Manual build triggering

### Content Generation & Automation
- `GET /api/build/generate-content` - Convert database posts to static files
- `GET /api/cron/nightly-build` - Automated build checking (2 AM daily)

### Newsletter & Authentication
- `POST /api/subscribe` - Newsletter subscription
- `POST /api/send-newsletter` - Send queued newsletters (2 PM daily)
- `POST /api/auth/login` - Admin authentication
- `POST /api/auth/logout` - Admin session termination

## 📝 Content Workflow

### Creating Posts
1. **Admin Interface**: Visit `/admin/posts/new`
2. **Dual Editor**: Choose WYSIWYG or Markdown mode
3. **Real-time Preview**: See changes instantly
4. **Save to Database**: Posts stored temporarily for immediate access
5. **Build Process**: Automatic or manual conversion to static files
6. **Live Publication**: Optimized static content served to users

### Newsletter Integration
1. Mark posts with `sendAsNewsletter: true`
2. Daily cron job (2 PM) processes queued articles
3. MJML templates generate responsive emails
4. Mailjet sends campaigns to subscribers
5. Article metadata updated to prevent re-sending

## Deployment

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Configure Environment Variables**
   Set all required environment variables in Vercel dashboard

3. **Set up Mailjet**
   - Create Mailjet account
   - Get API keys and create contact list
   - Add credentials to environment variables

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run generate` - Generate static site

## Project Structure

```
newsletter-site/
├── content/articles/     # Markdown articles
├── pages/               # Nuxt pages
│   └── admin/           # Protected admin pages
├── middleware/          # Authentication middleware
├── server/api/          # API routes
│   └── auth/            # Authentication endpoints
├── templates/           # MJML email templates
├── public/             # Static assets
├── CLAUDE.md           # AI assistant instructions
└── spec.md             # Project specification
```

## 🎛️ Admin Interface

### Dashboard Features
- **Posts Management**: Create, edit, delete, and organize posts
- **Dual-Mode Editor**: Switch between WYSIWYG and Markdown editing
- **Real-time Preview**: See exactly how posts will look
- **Build Controls**: Manual trigger for immediate publishing
- **Status Tracking**: Monitor which posts are pending/published

### Access Points
- **Dashboard**: `/admin` - Overview and navigation
- **Posts List**: `/admin/posts` - Manage all posts
- **Create Post**: `/admin/posts/new` - WYSIWYG/Markdown editor
- **Edit Post**: `/admin/posts/edit/[slug]` - Modify existing content
- **Newsletter**: `/admin/newsletter` - Campaign management

### Authentication Setup
1. **Generate Password Hash**:
   ```bash
   node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('your-password', 12));"
   ```

2. **Environment Variables**:
   ```env
   ADMIN_USERNAME=your-username
   ADMIN_PASSWORD_HASH=generated-bcrypt-hash
   NUXT_SESSION_PASSWORD=random-32-character-string
   ```

### Development vs Production
- **Local**: Uses file system storage (`.tmp/storage/`)
- **Production**: Uses Upstash Redis KV database
- **Same Interface**: Identical admin experience in both environments

## Email Templates

Email templates use MJML for cross-client compatibility. The main template is in `/templates/newsletter.mjml`.

## Troubleshooting

**Common Issues:**

1. **Mailjet not configured**: The app runs in demo mode without Mailjet credentials
2. **Content not loading**: Ensure Markdown files have proper frontmatter
3. **Build errors**: Check TypeScript and dependency versions

**Logs:**
- Development: Check browser console and terminal
- Production: Check Vercel function logs

## 📚 Documentation

- **[DEVELOPER.md](./DEVELOPER.md)** - Comprehensive developer guide
- **[CLAUDE.md](./CLAUDE.md)** - AI assistant instructions and architecture notes
- **[spec.md](./spec.md)** - Original project specification

## 🤝 Contributing

1. Read the [Developer Documentation](./DEVELOPER.md)
2. Fork the repository
3. Create a feature branch
4. Test both local and production scenarios
5. Update documentation if needed
6. Submit a pull request with clear description

## License

MIT License - see LICENSE file for details.