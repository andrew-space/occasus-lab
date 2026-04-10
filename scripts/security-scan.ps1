$ErrorActionPreference = "Stop"
Write-Host "[Security] Starting local scan..."

$root = Get-Location
$patterns = @(
  "sk_live_",
  "sk_test_",
  "whsec_",
  "-----BEGIN PRIVATE KEY-----"
)

$filesToScan = @("site", "functions") | Where-Object { Test-Path $_ }
foreach ($path in $filesToScan) {
  $scanFiles = Get-ChildItem -Path $path -Recurse -File | Where-Object {
    $_.Name -notmatch "\.example$" -and
    $_.Name -notmatch "^README\.md$"
  }
  foreach ($p in $patterns) {
    $matches = $scanFiles | Select-String -Pattern $p -SimpleMatch -ErrorAction SilentlyContinue
    if ($matches) {
      Write-Error "Sensitive pattern '$p' found under $path"
    }
  }
}

$appJs = "site/assets/app.js"
if (Test-Path $appJs) {
  $isProEscalation = Select-String -Path $appJs -Pattern "\.update\(\{\s*isPro\s*:\s*true" -CaseSensitive:$false
  if ($isProEscalation) {
    Write-Error "Forbidden anti-pattern found: direct client-side isPro escalation"
  }
}

$trackedEnv = git ls-files | Select-String -Pattern "(^|/)(\.env|\.env\.[^.]+)$" -CaseSensitive:$false
if ($trackedEnv) {
  Write-Error "Tracked .env files detected"
}

Write-Host "[Security] Scan passed"
