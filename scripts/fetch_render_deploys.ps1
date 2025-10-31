<#
fetch_render_deploys.ps1
Interactive helper to list Render services, show their recent deploys, and attempt to fetch logs for the latest deploy.

Usage:
  $env:RENDER_API_KEY = 'rnd_...'
  .\scripts\fetch_render_deploys.ps1            # picks first service by default
  .\scripts\fetch_render_deploys.ps1 -ServiceId '<SERVICE_ID>'

Note: This script does not embed your API key. Run locally and paste outputs here if you want me to analyze them.
#>

param(
    [string]$ServiceId = ''
)

if (-not $env:RENDER_API_KEY) {
    Write-Error "Set RENDER_API_KEY env var first: $env:RENDER_API_KEY = 'rnd_...';"
    exit 1
}

function ApiGet($path) {
    & .\scripts\render_api.ps1 -Path $path -Method GET
}

Write-Host "Fetching services..."
$servicesJson = ApiGet '/v1/services' | ConvertFrom-Json
if (-not $servicesJson) {
    Write-Error "No services returned."
    exit 2
}

$services = $servicesJson

if (-not $ServiceId) {
    Write-Host "Available services (id : name)"
    $i = 0
    foreach ($s in $services) {
        $i++
        Write-Host "$i) $($s.id) : $($s.name)  (type=$($s.type) status=$($s.state))"
    }
    Write-Host ""
    $ServiceId = $services[0].id
    Write-Host "No ServiceId provided; defaulting to first service: $ServiceId"
}

Write-Host "Fetching deploys for service: $ServiceId"
$deploys = ApiGet "/v1/services/$ServiceId/deploys" | ConvertFrom-Json
if (-not $deploys) {
    Write-Error "No deploys returned for service $ServiceId"
    exit 3
}

Write-Host "Recent deploys (showing up to 10):"
$count = 0
foreach ($d in $deploys) {
    $count++
    Write-Host "$count) id=$($d.id) state=$($d.state) createdAt=$($d.createdAt) commit=$($d.commit)"
    if ($count -ge 10) { break }
}

$latest = $deploys | Select-Object -First 1
if (-not $latest) { Write-Error "No latest deploy found"; exit 4 }

Write-Host "Attempting to fetch logs for latest deploy id=$($latest.id)"
try {
    # Common Render endpoints for logs vary; try the deploy logs endpoint and the deploy endpoint for more info
    Write-Host "GET /v1/services/$ServiceId/deploys/$($latest.id)/logs"
    ApiGet "/v1/services/$ServiceId/deploys/$($latest.id)/logs" | Out-Host
} catch {
    Write-Warning "/logs endpoint failed or returned non-JSON. Falling back to deploy metadata."
    ApiGet "/v1/services/$ServiceId/deploys/$($latest.id)" | Out-Host
}

Write-Host "Done. If you want, paste the outputs here (redact tokens) and I will help analyze them."
