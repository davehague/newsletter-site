1. Project Overview & Core Requirements
The goal is to build a personal website for publishing articles that can also be sent as newsletters. The system must support in-browser content management and automated email sending, hosted on Vercel's free tier.

Functional Requirements:

Display a feed of published articles.

Provide dedicated pages for each article.

Allow users to filter or view articles by specific tags.

Allow an administrator to log in and manage content (create, edit, publish).

Provide a WYSIWYG or Markdown editor.

Capture new newsletter subscribers.

Automatically send new articles as email campaigns to subscribers via Mailjet.

Non-Functional Requirements:

Excellent SEO performance (leveraging Nuxt's SSR).

Fast page loads.

Cost-effective hosting (Vercel free tier).

Secure admin access.

Maintainable and scalable codebase.

2. Architecture & Tech Stack (Path A)
We're starting with a Git-based architecture to prioritize simplicity and speed of development.

Framework: Nuxt 3.

Content Layer: @nuxt/content v3. Articles are stored as Markdown (.md) files within the /content/articles/ directory of the Git repository.

Content Editor: Nuxt Studio. This provides a free, in-browser editor at the /studio route for managing the Markdown files. It handles authentication via GitHub or Google out of the box.

Email Service: Mailjet. Used for subscriber list management and sending email campaigns via its API. The node-mailjet SDK will be used in server routes.

Email Templating: MJML. Used to create responsive HTML email templates, ensuring compatibility across email clients.

Automation: Vercel Cron Jobs. A scheduled job will trigger the newsletter sending process.

Hosting: Vercel. Provides hosting, serverless functions, and cron job scheduling.

3. Data Model & Content Structure
All articles will be Markdown files. The content's metadata will be managed via YAML front-matter at the top of each file.

File Location: /content/articles/*.md

Front-Matter Schema:

---
title: 'Your Awesome Article Title'
description: 'A brief, compelling summary for SEO and social sharing (150-160 characters).'
publishedAt: '2025-07-22' # YYYY-MM-DD format
tags: ['nuxt', 'development', 'javascript'] # Optional array of tags for categorization
# --- Newsletter Fields ---
sendAsNewsletter: false # Set to true to queue this article for the next newsletter send
newsletterSentAt: null # Will be updated by the sending script upon success (e.g., '2025-07-22T14:00:00Z')
---

## Your Article Content

Your main article content starts here, written in **Markdown**.

4. Key Workflows & Implementation Details
4.1. Subscriber Signup
Frontend: Create a simple newsletter signup Vue component with an email input field and a submit button.

API Route: The form submission will POST to a Nuxt server route, e.g., /api/subscribe.

Backend Logic: This route will:

Validate the incoming email address.

Use the node-mailjet SDK to add the email to a designated Mailjet contact list.

Return a success or error message to the frontend.

4.2. Newsletter Sending (Automated)
This is the core automation workflow, triggered by a Vercel Cron Job.

Vercel Configuration (vercel.json): Define a cron job to run at a set interval (e.g., daily at 10:00 AM ET).

{
  "crons": [
    {
      "path": "/api/send-newsletter",
      "schedule": "0 14 * * *"
    }
  ]
}

API Route (/server/api/send-newsletter.ts): This endpoint contains the primary logic.

Fetch Articles: Use the @nuxt/content server-side API to query for all articles where sendAsNewsletter is true and newsletterSentAt is null.

Process Queue: For each article found:

Render the article's body from Markdown to HTML.

Inject this HTML content into an MJML template and compile it to responsive email HTML.

Use the node-mailjet SDK to create and send a campaign with the generated HTML and the article's title as the subject.

Important: After a successful API call to Mailjet, use the GitHub API (or a library like simple-git) to programmatically update the article's .md file, setting sendAsNewsletter: false and newsletterSentAt: (new Date()).toISOString() to prevent re-sending.

Response: The route should return a JSON summary of its actions (e.g., { sent: 1, skipped: 0 }).

4.3. Tagging and Filtering
Displaying Tags: On individual article pages, display the list of tags from the front-matter. Each tag should be a <NuxtLink> pointing to its respective tag page (e.g., /tags/nuxt).

Tag Page: Create a dynamic route page at /pages/tags/[tag].vue.

Filtering Logic: This page will use the route parameter ([tag]) to query all content where the tags array in the front-matter contains the given tag.

// Example query in /pages/tags/[tag].vue
const articles = await queryContent('articles')
  .where({ tags: { $contains: route.params.tag } })
  .find();

All Tags Page (Optional): Create a page at /pages/tags/index.vue that queries all articles, compiles a unique list of all tags used, and displays them as a cloud or list of links.

5. Error Handling
API Calls (Mailjet, GitHub): All external API calls within server routes must be wrapped in try...catch blocks. On failure, log the detailed error for debugging on Vercel and return an appropriate HTTP status code (e.g., 502 Bad Gateway for upstream API failures).

Cron Job Failures: Configure Vercel alerts to be notified if a cron job fails to execute. The script should be idempotent, meaning if it runs again after a failure, it won't re-send articles that were successfully processed.

Validation: Implement input validation on the subscriber form (both client-side and server-side) to handle invalid email formats.

6. Testing Plan
Unit Tests (Vitest): Test individual helper functions, such as the logic for parsing front-matter or compiling an MJML template.

Integration Tests: Test the API routes (/api/subscribe, /api/send-newsletter) by mocking the external services (Mailjet, GitHub API). This ensures the internal logic works correctly without making actual network requests.

End-to-End (E2E) Tests (Playwright/Cypress):

Test the full subscriber signup flow.

Test the admin login flow through Nuxt Studio.

Verify that published articles appear correctly on the website.

Click on an article's tag and verify that the tag page lists the correct articles.

7. Styling & Frontend Design
This section outlines the approach for styling the website using Tailwind CSS to achieve a simple, professional, and content-focused design.

7.1. CSS Framework & Setup
Framework: Tailwind CSS. We will use the official Nuxt module for seamless integration.

Installation: Add the module to your project.

npm install -D @nuxtjs/tailwindcss

Configuration (nuxt.config.ts): Register the module in your Nuxt configuration.

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxtjs/tailwindcss'
  ]
})

7.2. Typographic Styling for Articles
The core of a newsletter/blog is readability. We will use the official Tailwind CSS Typography plugin to automatically style the HTML rendered from your Markdown files.

Plugin Installation:

npm install -D @tailwindcss/typography

Plugin Configuration (tailwind.config.js): Add the plugin to your Tailwind configuration file.

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

Implementation: On your article page (/pages/articles/[...slug].vue), wrap the <ContentDoc /> component in an element with the prose class. This will apply beautiful styling to all headings, paragraphs, lists, links, etc., rendered from your Markdown.

<!-- pages/articles/[...slug].vue -->
<template>
  <main class="py-12">
    <article class="prose lg:prose-xl mx-auto px-4">
      <ContentDoc />
    </article>
  </main>
</template>

7.3. Design Principles & Color Palette
The goal is a minimalist design that emphasizes the content.

Layout: A single-column, centered layout for the main content area with a comfortable maximum width to ensure readability (e.g., max-w-3xl).

Color Palette:

Background: A soft off-white (e.g., bg-slate-50 or bg-white).

Text: A dark, desaturated color instead of pure black to reduce eye strain (e.g., text-slate-800).

Accent: A single, professional color for links and interactive elements (e.g., text-blue-600).

Spacing: Generous use of whitespace. Use Tailwind's spacing scale for padding and margins (p-4, py-12, gap-8) to maintain a consistent rhythm throughout the site.

Tag Styling: Tags should be styled as small, clickable "pills" or badges to distinguish them visually (e.g., bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full).

7.4. Layout and Component Example
Your default layout file will set the overall structure and color scheme.

<!-- layouts/default.vue -->
<template>
  <div class="bg-slate-50 text-slate-800 min-h-screen font-sans">
    <header class="border-b border-slate-200">
      <nav class="container mx-auto px-4 py-4 flex justify-between items-center">
        <!-- Site Title or Logo -->
        <NuxtLink to="/" class="text-xl font-bold hover:text-blue-600 transition-colors">
          My Newsletter
        </NuxtLink>
        <!-- Optional: Add other nav links here -->
      </nav>
    </header>

    <main class="container mx-auto py-8">
      <slot />
    </main>

    <footer class="text-center py-8 text-sm text-slate-500 border-t border-slate-200 mt-12">
      <p>&copy; 2025 Your Name. All Rights Reserved.</p>
    </footer>
  </div>
</template>

7.5. Important Note on Email Styling
Tailwind CSS styles do not automatically apply to your HTML emails. Email clients have very poor CSS support and require inline styles or specific <style> blocks.

MJML is Key: You must style your email template directly within your .mjml file using MJML's attributes (<mj-text font-size="16px" color="#334155">, <mj-button background-color="#2563eb">, etc.).

Maintain Consistency: To create a cohesive brand experience, manually mirror the design principles from your website (font choices, colors, logo) in your MJML template. Use hex codes to match your Tailwind color palette (e.g., text-slate-800 is #1e293b).