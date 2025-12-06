import React from 'react'
import '@testing-library/jest-dom'

// Lightweight mock for `next/link` used in components
// Renders a normal anchor so tests can assert on link text/props.
jest.mock('next/link', () => ({
	__esModule: true,
	default: ({ children, href, ...props }: any) => React.createElement('a', { href, ...props }, children),
}))

// Mock react-markdown (ESM) to avoid transform issues in Jest environment.
jest.mock('react-markdown', () => ({
	__esModule: true,
	default: (props: any) => React.createElement('div', null, props.children),
}))

// remark-gfm is an ESM-only package; mock it as an empty plugin for tests
jest.mock('remark-gfm', () => [])


