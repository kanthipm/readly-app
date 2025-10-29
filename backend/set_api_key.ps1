# PowerShell script to set Gemini API key in .env file
param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$envFile = Join-Path $PSScriptRoot ".env"
$content = "GEMINI_API_KEY=$ApiKey"

Set-Content -Path $envFile -Value $content
Write-Host "API key saved to: $envFile" -ForegroundColor Green
Write-Host "Please restart the backend server for changes to take effect." -ForegroundColor Yellow

