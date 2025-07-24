import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username and password are required'
    })
  }

  const config = useRuntimeConfig()
  const adminUsername = process.env.ADMIN_USERNAME
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

  if (!adminUsername || !adminPasswordHash) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error'
    })
  }

  try {
    const isValidUsername = username === adminUsername
    const isValidPassword = await bcrypt.compare(password, adminPasswordHash)

    if (!isValidUsername || !isValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    await setUserSession(event, {
      user: {
        username: adminUsername,
        role: 'admin'
      }
    })

    return { success: true, user: { username: adminUsername, role: 'admin' } }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication failed'
    })
  }
})