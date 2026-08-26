[CmdletBinding()]
param(
    [string]$Email = "tantony31710@gmail.com",
    [string]$ServiceAccountPath = ".\serviceAccountKey.json"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ServiceAccountPath)) {
    throw "Service-account file not found: $ServiceAccountPath"
}

$env:CHECK_ADMIN_EMAIL = $Email.Trim().ToLowerInvariant()
$env:FIREBASE_SERVICE_ACCOUNT_PATH = (Resolve-Path -LiteralPath $ServiceAccountPath).Path

py -3.13 .\scripts\check_admin_consistency.py
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
