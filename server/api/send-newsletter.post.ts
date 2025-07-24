import Mailjet from 'node-mailjet'
import mjml from 'mjml'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface NewsletterArticle {
  _path: string
  title: string
  description: string
  body: any
  publishedAt: string
  tags?: string[]
  sendAsNewsletter: boolean
  newsletterSentAt: string | null
}

interface SendResult {
  sent: number
  skipped: number
  articles: string[]
  errors: string[]
}

export default defineEventHandler(async (event): Promise<SendResult> => {
  const result: SendResult = {
    sent: 0,
    skipped: 0,
    articles: [],
    errors: []
  }

  try {
    const config = useRuntimeConfig()

    // Check if Mailjet is configured
    if (!config.mailjetApiKey || !config.mailjetSecretKey || !config.mailjetListId) {
      console.warn('Mailjet not configured - newsletter sending would be processed here')
      return {
        sent: 0,
        skipped: 0,
        articles: ['Demo mode - no emails sent'],
        errors: []
      }
    }

    // Find articles queued for newsletter
    const articles = await queryContent<NewsletterArticle>('articles')
      .where({ sendAsNewsletter: true, newsletterSentAt: null })
      .find()

    if (articles.length === 0) {
      return result
    }

    // Initialize Mailjet client
    const mailjet = new Mailjet({
      apiKey: config.mailjetApiKey,
      apiSecret: config.mailjetSecretKey
    })

    // Process each article
    for (const article of articles) {
      try {
        // Generate HTML content from markdown
        const htmlContent = await $render('ContentRenderer', { value: article })
        
        // Create MJML template
        const mjmlTemplate = `
          <mjml>
            <mj-head>
              <mj-title>${article.title}</mj-title>
              <mj-preview>${article.description}</mj-preview>
              <mj-attributes>
                <mj-all font-family="Arial, sans-serif" />
                <mj-text font-size="16px" color="#334155" line-height="1.6" />
                <mj-button background-color="#2563eb" color="#ffffff" />
              </mj-attributes>
              <mj-style inline="inline">
                .article-content h1 { color: #0f172a !important; font-size: 28px !important; }
                .article-content h2 { color: #1e293b !important; font-size: 24px !important; }
                .article-content h3 { color: #334155 !important; font-size: 20px !important; }
                .article-content p { margin-bottom: 16px !important; }
                .article-content a { color: #2563eb !important; }
              </mj-style>
            </mj-head>
            <mj-body background-color="#f8fafc">
              <mj-section background-color="#ffffff" padding="20px">
                <mj-column>
                  <mj-text align="center" font-size="24px" font-weight="bold" color="#0f172a">
                    ${config.fromName || 'My Newsletter'}
                  </mj-text>
                  <mj-divider border-color="#e2e8f0" border-width="1px" />
                </mj-column>
              </mj-section>
              
              <mj-section background-color="#ffffff" padding="0 20px">
                <mj-column>
                  <mj-text font-size="32px" font-weight="bold" color="#0f172a" padding-bottom="10px">
                    ${article.title}
                  </mj-text>
                  <mj-text font-size="18px" color="#64748b" padding-bottom="20px">
                    ${article.description}
                  </mj-text>
                  <mj-text css-class="article-content">
                    ${htmlContent}
                  </mj-text>
                </mj-column>
              </mj-section>
              
              <mj-section background-color="#ffffff" padding="20px">
                <mj-column>
                  <mj-button href="${config.public.siteUrl}${article._path}" padding="10px 25px" font-size="16px">
                    Read Full Article
                  </mj-button>
                </mj-column>
              </mj-section>
              
              <mj-section background-color="#f1f5f9" padding="20px">
                <mj-column>
                  <mj-text align="center" font-size="14px" color="#64748b">
                    You received this email because you subscribed to ${config.fromName || 'My Newsletter'}.
                  </mj-text>
                  <mj-text align="center" font-size="12px" color="#94a3b8">
                    © 2025 ${config.fromName || 'My Newsletter'}. All rights reserved.
                  </mj-text>
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>
        `

        // Compile MJML to HTML
        const { html, errors } = mjml(mjmlTemplate)
        
        if (errors.length > 0) {
          console.warn('MJML compilation warnings:', errors)
        }

        // Send campaign via Mailjet
        const campaignResponse = await mailjet
          .post('send', { version: 'v3.1' })
          .request({
            Messages: [
              {
                From: {
                  Email: config.fromEmail,
                  Name: config.fromName || 'My Newsletter'
                },
                To: [
                  {
                    Email: config.testEmail || config.fromEmail,
                    Name: 'Test Subscriber'
                  }
                ],
                Subject: article.title,
                HTMLPart: html,
                CustomID: `newsletter-${Date.now()}`
              }
            ]
          })

        // Update article metadata
        const articlePath = join(process.cwd(), 'content', 'articles', `${article._path.split('/').pop()}.md`)
        try {
          const fileContent = readFileSync(articlePath, 'utf8')
          const updatedContent = fileContent
            .replace('sendAsNewsletter: true', 'sendAsNewsletter: false')
            .replace('newsletterSentAt: null', `newsletterSentAt: '${new Date().toISOString()}'`)
          
          writeFileSync(articlePath, updatedContent, 'utf8')
        } catch (fileError) {
          console.warn(`Could not update article file: ${articlePath}`, fileError)
        }

        result.sent++
        result.articles.push(article.title)

      } catch (articleError: any) {
        console.error(`Error processing article "${article.title}":`, articleError)
        result.errors.push(`${article.title}: ${articleError.message}`)
      }
    }

    return result

  } catch (error: any) {
    console.error('Newsletter sending error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send newsletter'
    })
  }
})