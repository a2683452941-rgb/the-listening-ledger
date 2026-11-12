$ErrorActionPreference = 'Stop'
try {
    $address = 'http://localhost:4333/'
    $alreadyRunning = $false
    try {
        $response = Invoke-WebRequest -Uri $address -UseBasicParsing -TimeoutSec 2
        if ($response.Content -match 'about-dialog' -and $response.Content -match 'legend-dialog') {
            $alreadyRunning = $true
        } else {
            throw 'Port 4333 is used by another application.'
        }
    } catch {
        if (Get-NetTCPConnection -LocalPort 4333 -State Listen -ErrorAction SilentlyContinue) {
            throw 'Port 4333 is busy. Close that application or open the existing ledger manually.'
        }
    }
    if (-not $alreadyRunning) {
        $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
        if (-not $nodeCommand) { throw 'Install Node.js 22.13 or newer from nodejs.org and reopen this launcher.' }
        $nodePath = $nodeCommand.Source
        $nodeVersion = [version]((& $nodePath --version).TrimStart('v'))
        if ($nodeVersion -lt [version]'22.13.0') { throw 'Node.js 22.13 or newer is required.' }
        $process = Start-Process -FilePath $nodePath -ArgumentList 'server.mjs' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'server.log') -RedirectStandardError (Join-Path $PSScriptRoot 'server-error.log') -PassThru
        $ready = $false
        for ($attempt = 0; $attempt -lt 20; $attempt++) {
            try { $null = Invoke-WebRequest -Uri $address -UseBasicParsing -TimeoutSec 1; $ready = $true; break } catch { Start-Sleep -Milliseconds 150 }
        }
        if (-not $ready) { throw 'Server did not start. Read server-error.log.' }
        Write-Host "Local server PID: $($process.Id)"
    }
    Start-Process $address
    Write-Host "Open $address"
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host 'Press Enter to close'
    exit 1
}
