param(
    [int]$Port = 9222,
    [string]$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe",
    [string]$ProfileDir = "C:\BetfairChromeProfile",
    [string]$StartUrl = "https://www.betfair.it/exchange/plus/it/"
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$InformationPreference = 'SilentlyContinue'
$VerbosePreference = 'SilentlyContinue'
$DebugPreference = 'SilentlyContinue'
$WarningPreference = 'SilentlyContinue'

# Stable helper exit-code contract:
# 0 = already_ready | launch_requested
# 2 = port_occupied
# 3 = chrome_not_found
# 4 = launch_failed
# 5 = input_invalid
function Write-LauncherResult {
    param(
        [bool]$Ok,
        [string]$State,
        [int]$ResultPort,
        [int]$ExitCode
    )

    $payload = [ordered]@{
        ok = $Ok
        state = $State
        port = $ResultPort
    }
    Write-Output ($payload | ConvertTo-Json -Compress)
    exit $ExitCode
}

function Test-CdpEndpoint {
    param([int]$CandidatePort)

    try {
        $response = Invoke-RestMethod `
            -Uri "http://127.0.0.1:$CandidatePort/json/version" `
            -Method Get `
            -TimeoutSec 1 `
            -ErrorAction Stop
        return (
            $null -ne $response -and
            $response.webSocketDebuggerUrl -is [string] -and
            -not [string]::IsNullOrWhiteSpace($response.webSocketDebuggerUrl)
        )
    }
    catch {
        return $false
    }
}

function Test-TcpPortOccupied {
    param([int]$CandidatePort)

    $client = $null
    $asyncResult = $null
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $asyncResult = $client.BeginConnect(
            '127.0.0.1',
            $CandidatePort,
            $null,
            $null
        )
        if (-not $asyncResult.AsyncWaitHandle.WaitOne(300, $false)) {
            return $false
        }
        $client.EndConnect($asyncResult)
        return $client.Connected
    }
    catch {
        return $false
    }
    finally {
        if ($null -ne $asyncResult) {
            try { $asyncResult.AsyncWaitHandle.Close() } catch { }
        }
        if ($null -ne $client) {
            try { $client.Close() } catch { }
        }
    }
}

if ($Port -lt 1 -or $Port -gt 65535) {
    Write-LauncherResult -Ok $false -State 'input_invalid' -ResultPort $Port -ExitCode 5
}

if (Test-CdpEndpoint -CandidatePort $Port) {
    Write-LauncherResult -Ok $true -State 'already_ready' -ResultPort $Port -ExitCode 0
}

if (Test-TcpPortOccupied -CandidatePort $Port) {
    Write-LauncherResult -Ok $false -State 'port_occupied' -ResultPort $Port -ExitCode 2
}

$chromeAvailable = $false
try {
    $chromeAvailable = Test-Path -LiteralPath $ChromePath -PathType Leaf
}
catch {
    $chromeAvailable = $false
}
if (-not $chromeAvailable) {
    Write-LauncherResult -Ok $false -State 'chrome_not_found' -ResultPort $Port -ExitCode 3
}

$chromeArguments = @(
    "--remote-debugging-port=$Port",
    "--user-data-dir=`"$ProfileDir`"",
    '--new-window',
    "`"$StartUrl`""
)

try {
    Start-Process `
        -FilePath $ChromePath `
        -ArgumentList $chromeArguments `
        -ErrorAction Stop | Out-Null
}
catch {
    Write-LauncherResult -Ok $false -State 'launch_failed' -ResultPort $Port -ExitCode 4
}

Write-LauncherResult -Ok $true -State 'launch_requested' -ResultPort $Port -ExitCode 0
