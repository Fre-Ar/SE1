export function makeJsonRequest(body: any, method = 'POST') {
  return new Request('http://localhost', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}
