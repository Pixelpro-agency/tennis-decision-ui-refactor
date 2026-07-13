param(
    [int]$Port = 3001
)

$ErrorActionPreference = 'Continue'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path (Join-Path $scriptDir '..') 'backend\src'
$backendDir = (Resolve-Path $backendDir).Path

$env:PORT = "$Port"

Write-Host "[Backend] Starting node server.js on port $Port from $backendDir..."
Set-Location $backendDir
node server.js
