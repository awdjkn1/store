<#
render_api.ps1
Generic helper to call Render API endpoints using the RENDER_API_KEY environment variable.

Usage examples (PowerShell):
  $env:RENDER_API_KEY = 'rnd_xxx'
  .\scripts\render_api.ps1 -Path '/v1/services'
  .\scripts\render_api.ps1 -Path '/v1/services/<SERVICE_ID>/deploys'

This script will not store your key. If you paste output here, redact any secrets.
#>

param(
    [string]$Method = 'GET',
    [string]$Path = '/v1/services',
    [object]$Body = $null
)

if (-not $env:RENDER_API_KEY) {
    Write-Error "RENDER_API_KEY environment variable is not set. Export it first: $env:RENDER_API_KEY = 'rnd_...';"
    exit 1
}

$BaseUrl = 'https://api.render.com'
$Uri = $BaseUrl.TrimEnd('/') + $Path
$Headers = @{ Authorization = "Bearer $($env:RENDER_API_KEY)"; Accept = 'application/json' }

try {
    if ($Method -eq 'GET') {
        $resp = Invoke-RestMethod -Uri $Uri -Headers $Headers -Method Get -ErrorAction Stop
    } else {
        $jsonBody = if ($null -ne $Body) { $Body | ConvertTo-Json -Depth 10 } else { '' }
        $resp = Invoke-RestMethod -Uri $Uri -Headers $Headers -Method $Method -Body $jsonBody -ContentType 'application/json' -ErrorAction Stop
    }
    $resp | ConvertTo-Json -Depth 10
} catch {
    Write-Error "Request to $Uri failed: $($_.Exception.Message)"
    if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
            Write-Host "Response body:`n$body"
        } catch { }
    }
    exit 2
}
