import { POST as registerPOST } from '../auth/register/route'
import { makeJsonRequest } from './utils'

jest.mock('@/lib/db', () => ({
  db: { query: jest.fn() },
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed')),
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'tok-register'),
}))

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'u-123'),
}))

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'testsecret'
  })

  it('returns 400 when missing fields', async () => {
    const req = makeJsonRequest({ username: '', email: '', password: '' })
    const res: any = await registerPOST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 409 when email or username exists', async () => {
    const { db } = require('@/lib/db')
    // simulate existing user
    db.query.mockResolvedValueOnce([[{ id: 'u', username: 'bob', email: 'bob@example.com' }]])
    const req = makeJsonRequest({ username: 'bob', email: 'bob@example.com', password: 'p' })
    const res: any = await registerPOST(req as any)
    expect(res.status).toBe(409)
  })

  it('creates user and returns token on success', async () => {
    const { db } = require('@/lib/db')
    // first select -> empty
    db.query.mockResolvedValueOnce([[]])
    // insert -> succeed (mock second call)
    db.query.mockResolvedValueOnce([{}])

    const req = makeJsonRequest({ username: 'alice', email: 'alice@example.com', password: 'p' })
    const res: any = await registerPOST(req as any)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.token).toBe('tok-register')
    expect(body.user).toBeDefined()
  })
})
