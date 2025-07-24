import Mailjet from 'node-mailjet'

interface SubscribeRequest {
  email: string
}

interface MailjetResponse {
  body: {
    Count: number
    Data: Array<{
      ContactID: number
      Email: string
      Name: string
      CreatedAt: string
    }>
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { email }: SubscribeRequest = await readBody(event)

    // Validate email
    if (!email || typeof email !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required'
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    const config = useRuntimeConfig()
    
    // Check if Mailjet is configured
    if (!config.mailjetApiKey || !config.mailjetSecretKey || !config.mailjetListId) {
      console.warn('Mailjet not configured - email subscription would be processed here')
      return { 
        success: true, 
        message: 'Subscription successful (demo mode)' 
      }
    }

    // Initialize Mailjet client
    const mailjet = new Mailjet({
      apiKey: config.mailjetApiKey,
      apiSecret: config.mailjetSecretKey
    })

    // Add subscriber to Mailjet list
    const response = await mailjet
      .post('contactslist', { version: 'v3' })
      .id(config.mailjetListId)
      .action('managecontact')
      .request({
        Email: email,
        Action: 'addnoforce'
      }) as MailjetResponse

    return {
      success: true,
      message: 'Successfully subscribed to newsletter!'
    }

  } catch (error: any) {
    console.error('Newsletter subscription error:', error)
    
    // Handle Mailjet-specific errors
    if (error.response?.status === 400) {
      const errorData = error.response.data
      if (errorData?.ErrorMessage?.includes('already exists')) {
        return {
          success: true,
          message: 'You are already subscribed!'
        }
      }
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to subscribe to newsletter'
    })
  }
})