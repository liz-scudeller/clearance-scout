$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$apiUrl = 'https://salmon-rational-lynx.ngrok-free.app'
$port = 4000

function Test-LocalApi {
  try {
    Invoke-WebRequest -Uri "http://localhost:$port/health" -UseBasicParsing -TimeoutSec 5 | Out-Null
    return $true
  } catch {
    return $false
  }
}

if (-not (Test-LocalApi)) {
  Write-Host "Starting SaleRadar API on port $port..."
  Start-Process `
    -FilePath 'npm' `
    -ArgumentList @('run', 'dev') `
    -WorkingDirectory (Join-Path $projectRoot 'server') `
    -RedirectStandardOutput (Join-Path $projectRoot 'server\server.out.log') `
    -RedirectStandardError (Join-Path $projectRoot 'server\server.err.log') `
    -WindowStyle Hidden

  $ready = $false
  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    if (Test-LocalApi) {
      $ready = $true
      break
    }
  }

  if (-not $ready) {
    throw "SaleRadar API did not respond on http://localhost:$port/health."
  }
}

$existingTunnel = $false
try {
  $tunnels = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 3
  $existingTunnel = @($tunnels.tunnels).public_url -contains $apiUrl
} catch {
  $existingTunnel = $false
}

if (-not $existingTunnel) {
  Write-Host "Starting ngrok tunnel: $apiUrl -> http://localhost:$port"
  $ngrok = (Get-Command ngrok).Source
  Start-Process `
    -FilePath $ngrok `
    -ArgumentList @('http', '--url=salmon-rational-lynx.ngrok-free.app', "$port", '--log=stdout') `
    -WorkingDirectory $projectRoot `
    -RedirectStandardOutput (Join-Path $projectRoot 'ngrok.out.log') `
    -RedirectStandardError (Join-Path $projectRoot 'ngrok.err.log') `
    -WindowStyle Hidden
}

$headers = @{ 'ngrok-skip-browser-warning' = 'true' }
for ($i = 0; $i -lt 15; $i++) {
  Start-Sleep -Seconds 1
  try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -Headers $headers -TimeoutSec 8
    if ($health.ok) {
      Write-Host "Mobile API is ready: $apiUrl"
      exit 0
    }
  } catch {
  }
}

throw "ngrok tunnel started, but $apiUrl/health did not return ok."
