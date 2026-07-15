#!/usr/bin/env node
import crypto from 'node:crypto'
import { promisify } from 'node:util'

const password = process.argv[2]
if (!password || password.length < 12) {
  console.error('Usage: npm run admin:hash -- "a password of at least 12 characters"')
  process.exit(1)
}

const N = 16384
const r = 8
const p = 1
const salt = crypto.randomBytes(16)
const derived = await promisify(crypto.scrypt)(password, salt, 32, {
  N, r, p, maxmem: 64 * 1024 * 1024,
})
console.log(`scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`)
