$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$src = Join-Path $root 'API.RENTIAGENT.COM\public_html'
$out = Join-Path $root 'DEPLOY-SUPABASE'
$stage = Join-Path $out '_staging'

if (Test-Path $out) {
    Remove-Item -LiteralPath $out -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $out, $stage | Out-Null
Copy-Item (Join-Path $root 'SUPABASE-MIGRACION-HOSTINGER.txt') $out

function Copy-ApiCore([string] $target) {
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    $exclude = @('.env', 'storage-import.php', 'catalog-import.php', 'pdo-test.php', 'DO_NOT_UPLOAD_HERE')
    Get-ChildItem -LiteralPath $src -File |
        Where-Object {
            $exclude -notcontains $_.Name -and
            ($_.Extension -in @('.php', '.py', '.txt') -or $_.Name -eq '.htaccess')
        } |
        ForEach-Object {
            Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $target $_.Name) -Force
        }

    foreach ($dir in @('auth', 'intranet', 'support', 'users', 'utilities')) {
        $targetDir = Join-Path $target $dir
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
        Copy-Item -Path ((Join-Path $src $dir) + '\*') -Destination $targetDir -Recurse -Force
    }

    $migrations = Join-Path $target 'supabase\migrations'
    New-Item -ItemType Directory -Force -Path $migrations | Out-Null
    Copy-Item -Path (Join-Path $root 'API.RENTIAGENT.COM\supabase\migrations\*.sql') `
        -Destination $migrations -Force
}

$p1 = Join-Path $stage '01'
Copy-ApiCore $p1
Copy-Item (Join-Path $root 'SUPABASE-MIGRACION-HOSTINGER.txt') `
    (Join-Path $p1 'LEEME-01-API-Y-ESQUEMA.txt')
Compress-Archive -Path (Join-Path $p1 '*') `
    -DestinationPath (Join-Path $out '01-supabase-schema-api.zip') -CompressionLevel Optimal

$p2 = Join-Path $stage '02'
New-Item -ItemType Directory -Force -Path $p2 | Out-Null
Copy-Item -LiteralPath (Join-Path $src 'storage-import.php'), (Join-Path $src 'catalog-import.php') `
    -Destination $p2
Copy-Item -LiteralPath (Join-Path $src '_storage_import') -Destination $p2 -Recurse
Copy-Item (Join-Path $root 'SUPABASE-MIGRACION-HOSTINGER.txt') `
    (Join-Path $p2 'LEEME-02-IMPORTAR-STORAGE.txt')
Compress-Archive -Path (Join-Path $p2 '*') `
    -DestinationPath (Join-Path $out '02-supabase-storage-import.zip') -CompressionLevel Optimal

$p3 = Join-Path $stage '03'
Copy-ApiCore $p3
Copy-Item (Join-Path $root 'SUPABASE-MIGRACION-HOSTINGER.txt') `
    (Join-Path $p3 'LEEME-03-ESPEJO-API.txt')
Compress-Archive -Path (Join-Path $p3 '*') `
    -DestinationPath (Join-Path $out '03-burguar-api-mirror.zip') -CompressionLevel Optimal

$p4 = Join-Path $stage '04'
New-Item -ItemType Directory -Force -Path $p4 | Out-Null
Copy-Item -LiteralPath `
    (Join-Path $root 'APP.RENTIAGENT.COM\public_html\index.html'), `
    (Join-Path $root 'APP.RENTIAGENT.COM\public_html\cloud-bootstrap.js') `
    -Destination $p4
Copy-Item (Join-Path $root 'SUPABASE-MIGRACION-HOSTINGER.txt') (Join-Path $p4 'LEEME-04-APP.txt')
Compress-Archive -Path (Join-Path $p4 '*') `
    -DestinationPath (Join-Path $out '04-app-cloud-sync.zip') -CompressionLevel Optimal

$p5 = Join-Path $stage '05'
New-Item -ItemType Directory -Force -Path $p5 | Out-Null
Copy-Item -LiteralPath `
    (Join-Path $root 'BURGUARDREAMS\public_html\intranet\index.html'), `
    (Join-Path $root 'BURGUARDREAMS\public_html\intranet\cloud-bootstrap.js') `
    -Destination $p5
Compress-Archive -Path (Join-Path $p5 '*') `
    -DestinationPath (Join-Path $out '05-legacy-intranet-cloud-sync.zip') -CompressionLevel Optimal

Remove-Item -LiteralPath $stage -Recurse -Force
Get-ChildItem -LiteralPath $out -File |
    Select-Object Name, @{N = 'MB'; E = { [math]::Round($_.Length / 1MB, 2) } }
