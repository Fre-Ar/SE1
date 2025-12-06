import { POST as loginPOST } from '../auth/login/route'

jest.mock('@/lib/db', () => ({
  db: { query: jest.fn() },
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(() => Promise.resolve(true)),
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'tok-login'),
}))

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'testsecret'
  })

  it('returns 400 when missing fields', async () => {
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: '', password: '' }) })
    const res: any = await loginPOST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 401 for unknown user', async () => {
    const { db } = require('@/lib/db')
    db.query.mockResolvedValueOnce([[]])
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'x@example.com', password: 'p' }) })
    const res: any = await loginPOST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns token for valid credentials', async () => {
    const { db } = require('@/lib/db')
    // Return a user row
    db.query.mockResolvedValueOnce([[{ id: 'u1', username: 'u1', password_hash: 'h' }]])

    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'u1@example.com', password: 'p' }) })
    const res: any = await loginPOST(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.token).toBe('tok-login')
  })
})
