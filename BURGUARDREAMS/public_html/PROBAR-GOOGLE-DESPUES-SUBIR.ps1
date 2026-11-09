# Comprobacion post-subida Google OAuth — Burguar Dreams
# Uso: powershell -ExecutionPolicy Bypass -File ".\PROBAR-GOOGLE-DESPUES-SUBIR.ps1"

$ErrorActionPreference = 'Continue'

Write-Host ''
Write-Host '=== Burguar Dreams — comprobacion Google OAuth ===' -ForegroundColor Cyan
Write-Host ''

function Show-Get {
    param([string]$Url)
    Write-Host "--- GET $Url ---" -ForegroundColor Yellow
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing
        Write-Host ("Estado: " + $r.StatusCode) -ForegroundColor Green
        Write-Host $r.Content
    }
    catch {
        Write-Host ('Error: ' + $_.Exception.Message) -ForegroundColor Red
    }
    Write-Host ''
}

function Show-PostCredential {
    param([string]$Url)
    Write-Host "--- POST $Url (token falso; debe dar 401) ---" -ForegroundColor Yellow
    $body = '{"credential":"fake-token-test"}'
    try {
        $r = Invoke-WebRequest -Uri $Url -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing
        Write-Host ("Estado: " + $r.StatusCode) -ForegroundColor Green
        Write-Host $r.Content
    }
    catch {
        $resp = $_.Exception.Response
        if ($null -ne $resp) {
            $code = [int]$resp.StatusCode
            $reader = [System.IO.StreamReader]::new($resp.GetResponseStream())
            $text = $reader.ReadToEnd()
            $reader.Close()
            if ($code -eq 401 -and $text -match 'invalid_google_token') {
                Write-Host ("Estado: " + $code + ' (correcto)') -ForegroundColor Green
            }
            elseif ($code -eq 500) {
                Write-Host ("Estado: " + $code + ' (MAL — sube api/Http.php y api/google-login.php)') -ForegroundColor Red
            }
            else {
                Write-Host ("Estado: " + $code) -ForegroundColor DarkYellow
            }
            Write-Host $text
        }
        else {
            Write-Host ('Error: ' + $_.Exception.Message) -ForegroundColor Red
        }
    }
    Write-Host ''
}

Show-Get 'https://burguardreams.com/api/intranet-check.php'
Show-Get 'https://burguardreams.com/api/google-login.php'
Show-PostCredential 'https://burguardreams.com/api/google-login.php'
Show-PostCredential 'https://burguardreams.com/api/auth/google'

Write-Host '=== Fin ===' -ForegroundColor Cyan
Write-Host 'Si ambos POST muestran 401 e invalid_google_token, abre:' 
Write-Host 'https://burguardreams.com/intranet/login (Ctrl+F5) y entra con Google.'
Write-Host ''
