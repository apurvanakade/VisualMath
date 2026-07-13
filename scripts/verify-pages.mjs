/**
 * Copyright (c) 2026 Apurva Nakade. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade
 */

// Browser-level check for every rendered page: `quarto render` only catches
// Pandoc/parse errors, not OJS runtime errors (e.g. a renamed VM.category.fn
// call site only surfaces as a browser console TypeError). This script
// serves the already-rendered docs/ directory, visits every page, clicks
// every button and nudges every range slider (not just the initial render,
// since many VM.* calls only run inside event handlers), and fails if any
// page logs a console error, throws, or has a failed network request.
//
// Usage: quarto render && node scripts/verify-pages.mjs
// (or: npm run verify)

import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const docsRoot = path.join(repoRoot, 'docs')
const port = 8934

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

function findPages(dir, base = '') {
  const pages = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const fullPath = path.join(dir, entry.name)
    const relPath = base + entry.name
    if (entry.isDirectory()) {
      pages.push(...findPages(fullPath, relPath + '/'))
    } else if (entry.name === 'index.html') {
      pages.push(relPath)
    }
  }
  return pages
}

function startServer() {
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0])
    if (urlPath.endsWith('/')) urlPath += 'index.html'
    const filePath = path.join(docsRoot, urlPath)
    if (!filePath.startsWith(docsRoot)) {
      res.writeHead(403)
      res.end()
      return
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404)
        res.end()
        return
      }
      const ext = path.extname(filePath)
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] ?? 'application/octet-stream' })
      res.end(data)
    })
  })
  return new Promise(resolve => {
    server.listen(port, () => resolve(server))
  })
}

async function checkPage(browser, base, relPath) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', err => errors.push(`pageerror: ${err.message}`))
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  page.on('requestfailed', req => {
    errors.push(`requestfailed: ${req.url()} -- ${req.failure()?.errorText ?? ''}`)
  })

  await page.goto(base + relPath, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)

  const buttons = page.locator('button')
  const buttonCount = await buttons.count()
  for (let i = 0; i < buttonCount; i++) {
    const button = buttons.nth(i)
    if (await button.isVisible()) {
      await button.click({ timeout: 2000 }).catch(() => {})
      await page.waitForTimeout(100)
    }
  }

  const sliders = page.locator('input[type=range]')
  const sliderCount = await sliders.count()
  for (let i = 0; i < sliderCount; i++) {
    const slider = sliders.nth(i)
    const min = Number((await slider.getAttribute('min')) ?? 0)
    const max = Number((await slider.getAttribute('max')) ?? 100)
    await slider.fill(String(min + (max - min) / 2)).catch(() => {})
    await page.waitForTimeout(100)
  }

  await page.waitForTimeout(300)
  await page.close()
  return errors
}

async function main() {
  if (!fs.existsSync(docsRoot)) {
    console.error('docs/ not found -- run `quarto render` first.')
    process.exit(1)
  }

  const pages = findPages(docsRoot).sort()
  console.log(`Found ${pages.length} rendered pages.\n`)

  const server = await startServer()
  const base = `http://localhost:${port}/`
  const browser = await chromium.launch()

  let anyFailure = false
  for (const relPath of pages) {
    const errors = await checkPage(browser, base, relPath)
    if (errors.length) {
      anyFailure = true
      console.log(`FAIL  ${relPath}`)
      for (const e of errors) console.log(`      ${e}`)
    } else {
      console.log(`OK    ${relPath}`)
    }
  }

  await browser.close()
  server.close()

  console.log(anyFailure ? '\nSome pages failed.' : '\nAll pages passed.')
  process.exit(anyFailure ? 1 : 0)
}

main()
