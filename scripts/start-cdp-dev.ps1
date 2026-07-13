param(
    [int]$Port = 9222,
    [string]$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe",
    [string]$ProfileDir = "C:\BetfairChromeProfile",
    [string]$StartUrl = "https://www.betfair.it/exchange/plus/it/"
)

$ErrorActionPreference = 'Continue'

if (-not (Test-Path $ChromePath)) {
    Write-Error "[$Port] Chrome not found at $ChromePath"
    exit 1
}

Write-Host "[$Port] Starting Chrome with remote debugging on port $Port..."
& $ChromePath `
    --remote-debugging-port=$Port `
    --user-data-dir="$ProfileDir" `
    --new-window "$StartUrl"
