# Windows-safe Prisma setup (paths with spaces break Prisma extension / .bin shims).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$prisma = Join-Path $PWD "node_modules\prisma\build\index.js"
$tsx = Join-Path $PWD "node_modules\tsx\dist\cli.mjs"

if (-not (Test-Path $prisma)) {
  Write-Error "Run npm install first."
}

# Optional: load production env from Vercel pull (vercel env pull .env.production.local --environment=production)
$prodEnv = Join-Path $PWD ".env.production.local"
if ($args -contains "--production" -and (Test-Path $prodEnv)) {
  Get-Content $prodEnv | ForEach-Object {
    if ($_ -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"(.*)"\s*$') {
      if ($matches[2].Length -gt 0) {
        Set-Item -Path "env:$($matches[1])" -Value $matches[2]
      }
    }
  }
}

Write-Host ">> prisma generate"
& node $prisma generate

Write-Host ">> prisma migrate deploy"
& node $prisma migrate deploy

Write-Host ">> seed"
& node $tsx prisma/seed.ts

Write-Host "Done."
