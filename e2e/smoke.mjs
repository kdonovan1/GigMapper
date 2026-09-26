// Headless end-to-end smoke test against a production build. Not wired into CI (no
// Chromium is installed in that environment) — run locally with `npm run test:e2e`
// after `npm run build`. Exercises the things a Vitest unit test can't: the real
// browser DOM, localStorage persistence across a reload, and the print/PDF pipeline,
// which is the riskiest part of this app to get right (see PrintView.tsx).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const PORT = 4174
const BASE_URL = `http://localhost:${PORT}/GigMapper/`
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gigmapper-e2e-'))

function assert(cond, msg) {
  if (!cond) throw new Error(`FAILED: ${msg}`)
  console.log('OK:', msg)
}

function waitForServer(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    const attempt = () => {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() > deadline) reject(new Error(`Server at ${url} did not come up in time`))
          else setTimeout(attempt, 300)
        })
    }
    attempt()
  })
}

const repoRoot = new URL('..', import.meta.url).pathname
// Invoke the locally installed binary directly rather than `npx vite`, which can try
// to resolve/check package metadata over the network first — slow or hung entirely
// behind a restrictive egress proxy — even though the package is already installed.
const viteBin = path.join(repoRoot, 'node_modules', '.bin', 'vite')
const previewServer = spawn(viteBin, ['preview', '--port', String(PORT), '--strictPort'], {
  cwd: repoRoot,
  stdio: 'inherit',
})

let browser
try {
  await waitForServer(BASE_URL)
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  // 1. Deliberate validation error, then fix it.
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.click('text=+ New project')
  await page.waitForTimeout(300)
  await page.click('text=Input List & Signal Plan')
  await page.click('text=+ Add input')
  await page.waitForTimeout(100)
  const portSelect = page.locator('table select:visible').nth(2)
  await portSelect.selectOption({ label: 'CH13/14' })
  await page.waitForTimeout(150)
  assert(
    (await page.locator("text=doesn't accept mic input").count()) > 0,
    'a mic source on a stereo-only port shows a validation warning',
  )
  await portSelect.selectOption({ label: 'CH1' })
  await page.waitForTimeout(150)
  assert(
    (await page.locator("text=doesn't accept mic input").count()) === 0,
    'fixing the port assignment clears the warning',
  )

  // 2. localStorage persistence across a reload.
  await page.reload({ waitUntil: 'networkidle' })
  await page.click('text=All projects').catch(() => {})
  assert((await page.locator('text=Untitled Project').count()) > 0, 'the project survives a reload')

  // 3. Print/PDF pipeline against the Tap House 66 seed.
  await page.click('text=Load example: Tap House 66')
  await page.waitForTimeout(500)
  await page.click('text=Export / Print')
  await page.waitForTimeout(500)
  const html = await page.content()
  assert(html.includes('Tap House 66'), 'print view header renders the project name')
  assert(html.includes('<img'), 'print view includes the captured stage-plot snapshot')
  assert(html.includes('Rumble 40'), 'print view includes the input list content')

  const pdfPath = path.join(tmpDir, 'tap-house-66.pdf')
  await page.pdf({ path: pdfPath, format: 'Letter', printBackground: true })
  const stat = fs.statSync(pdfPath)
  assert(stat.size > 10_000, `PDF was actually generated (${stat.size} bytes)`)

  assert(errors.length === 0, `no console/page errors (saw: ${JSON.stringify(errors)})`)

  console.log('\nALL E2E CHECKS PASSED')
} finally {
  await browser?.close()
  previewServer.kill()
  fs.rmSync(tmpDir, { recursive: true, force: true })
}
