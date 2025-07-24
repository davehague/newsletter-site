# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal newsletter website project built with Nuxt 3. The system enables publishing articles that can also be sent as newsletters, featuring in-browser content management with a hybrid database + static generation architecture.

## Architecture

- **Framework**: Nuxt 3
- **Content Management**: Hybrid system with @nuxt/content v3 and Vercel KV database
- **Content Storage**: 
  - **Development**: Local file system (`.tmp/storage/`)
  - **Production**: Vercel KV for temporary posts, static markdown files for published content
- **Authentication**: nuxt-auth-utils with bcrypt password hashing and secure session cookies
- **Admin Interface**: Full WYSIWYG + Markdown editor with real-time preview
- **Post Editor**: Tiptap-based dual-mode editor (WYSIWYG ↔ Markdown)
- **Email Service**: Mailjet API with node-mailjet SDK
- **Email Templates**: MJML for responsive email HTML
- **Automation**: Vercel Cron Jobs for newsletter sending and content publishing
- **Styling**: Tailwind CSS with @tailwindcss/typography plugin
- **Hosting**: Vercel (free tier)

## Content Structure

Articles are stored as Markdown files at `/content/articles/*.md` with YAML front-matter:

```yaml
---
title: 'Article Title'
description: 'SEO description (150-160 characters)'
publishedAt: '2025-07-22' # YYYY-MM-DD format
tags: ['nuxt', 'development'] # Optional array
sendAsNewsletter: false # Set to true to queue for newsletter
newsletterSentAt: null # Updated by sending script
---
```

## Hybrid Content Management System

### Content Publishing Workflow

1. **Draft Creation**: Admin creates/edits posts via web interface
2. **Temporary Storage**: Posts saved to database (Vercel KV in production, local FS in dev)
3. **Real-time Preview**: Immediate preview available via database queries
4. **Static Generation**: Build process converts database posts to static markdown files
5. **Database Cleanup**: Processed posts removed from temporary storage
6. **Live Publication**: Static files served by Nuxt Content with optimal performance

### Build Triggers

- **Nightly Builds**: Automated at 2 AM daily (if pending changes exist)
- **Manual Builds**: Admin can trigger immediate builds via UI button
- **Smart Triggering**: Only builds when temporary posts or deletions are pending

## Key API Routes

### Admin Post Management
- `GET/POST /api/admin/posts` - List and create posts
- `GET/PUT/DELETE /api/admin/posts/[slug]` - Individual post operations
- `POST /api/admin/posts/[slug]/preview` - Generate live preview
- `POST /api/admin/build/trigger` - Manual build triggering

### Content Generation
- `GET /api/build/generate-content` - Convert database posts to static files
- `GET /api/cron/nightly-build` - Automated build checking and triggering

### Newsletter & Auth
- `/api/subscribe` - Newsletter signup endpoint
- `/api/send-newsletter` - Automated newsletter sending (triggered by cron)
- `/api/auth/login` - Admin authentication with bcrypt password verification
- `/api/auth/logout` - Admin session termination

## Newsletter Workflow

1. Articles marked with `sendAsNewsletter: true` are queued
2. Vercel cron job triggers `/api/send-newsletter` daily at 2 PM
3. Script processes queued articles, renders Markdown to HTML
4. MJML templates generate responsive email HTML
5. Mailjet sends campaigns and updates article metadata

## Testing Strategy

- **Unit Tests**: Vitest for helper functions (front-matter parsing, MJML compilation)
- **Integration Tests**: API route testing with mocked external services
- **E2E Tests**: Playwright/Cypress for subscriber signup and content flows

## Styling Approach

- Tailwind CSS for utility-first styling
- Typography plugin for automatic Markdown styling using `prose` classes
- Minimalist design with single-column, centered layout
- Color palette: soft off-white background, dark desaturated text, blue accents
- Tag styling as clickable pills/badges

## Authentication System

- **Login**: Admin credentials stored as environment variables (username + bcrypt hash)
- **Session Management**: nuxt-auth-utils provides secure, sealed session cookies
- **Route Protection**: Middleware at `/middleware/auth.ts` protects all `/admin/*` routes
- **Password Security**: Bcrypt with 12 salt rounds for password hashing
- **Admin Pages**: Dashboard at `/admin`, post management at `/admin/posts/*`, newsletter at `/admin/newsletter`

## Important Notes

- **Dual Editor**: Admin interface supports both WYSIWYG and Markdown editing modes
- **Local vs Production**: Uses local file storage in development, Vercel KV in production
- **Build Process**: Content generation happens automatically during Vercel builds
- **Email Templates**: Use MJML, not Tailwind (email clients require inline styles)
- **Admin Authentication**: Uses environment-based credentials (no database required)
- **Newsletter Sending**: Idempotent to handle cron job failures
- **Error Handling**: All external API calls wrapped in try-catch blocks
- **Session Management**: Cookies are tamper-proof and automatically managed by nuxt-auth-utils
- **Static Performance**: Final content served as static files for optimal SEO and speed