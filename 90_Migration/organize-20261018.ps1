$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$rootPath = 'C:\Users\GIGIABYTE\Desktop\Storage\UTM\Grok Boot'
$bootsPath = Join-Path $rootPath 'The_Boots'
$archivePath = Join-Path $bootsPath '90_Migration\Archives'
[IO.Directory]::CreateDirectory($archivePath) | Out-Null
$names = @('Sally_Rename_Backup_20261018-044727','The_Boots_Continuity_20261018-041551')
$results = @()
foreach ($name in $names) {
    $sourcePath = (Resolve-Path -LiteralPath (Join-Path $rootPath $name)).ProviderPath
    if ($sourcePath -ne (Join-Path $rootPath $name) -or [IO.Path]::GetDirectoryName($sourcePath) -ne $rootPath) { throw 'Unsafe source path' }
    $allItems = @(Get-ChildItem -LiteralPath $sourcePath -Recurse -Force)
    if ($allItems | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }) { throw 'Unexpected reparse point' }
    $manifest = @($allItems | Where-Object { -not $_.PSIsContainer } | ForEach-Object {
        [pscustomobject]@{ Path=$_.FullName.Substring($sourcePath.Length+1).Replace('\','/'); Length=$_.Length; SHA256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash }
    })
    $zipPath = Join-Path $archivePath ($name + '.zip')
    if (Test-Path -LiteralPath $zipPath) { throw 'Archive already exists' }
    [IO.Compression.ZipFile]::CreateFromDirectory($sourcePath,$zipPath,[IO.Compression.CompressionLevel]::Optimal,$false)
    $zip = [IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
        $entries = @($zip.Entries | Where-Object { $_.Name -ne '' })
        if ($entries.Count -ne $manifest.Count) { throw 'File count mismatch' }
        foreach ($record in $manifest) {
            $entry = $zip.GetEntry($record.Path)
            if ($null -eq $entry -or $entry.Length -ne $record.Length) { throw "Missing or truncated archive file: $($record.Path)" }
            $stream = $entry.Open()
            $hasher = [Security.Cryptography.SHA256]::Create()
            try { $hash = [Convert]::ToHexString($hasher.ComputeHash($stream)) } finally { $stream.Dispose(); $hasher.Dispose() }
            if ($hash -ne $record.SHA256) { throw "Archive hash mismatch: $($record.Path)" }
            if ((Get-FileHash -LiteralPath (Join-Path $sourcePath $record.Path) -Algorithm SHA256).Hash -ne $record.SHA256) { throw 'Source changed during archiving' }
        }
    } finally { $zip.Dispose() }
    if (@(Get-ChildItem -LiteralPath $sourcePath -Recurse -Force).Count -ne $allItems.Count) { throw 'Source structure changed' }
    $manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $archivePath ($name + '.manifest.json')) -Encoding utf8
    # Exact allowlisted source was resolved and checked above; all file bytes are verified in the ZIP.
    Remove-Item -LiteralPath $sourcePath -Recurse -Force
    if (Test-Path -LiteralPath $sourcePath) { throw 'Source directory remains' }
    $results += [pscustomobject]@{Source=$sourcePath;Archive=$zipPath;Files=$manifest.Count;SHA256=(Get-FileHash -LiteralPath $zipPath).Hash;Verified=$true}
}
$results | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $archivePath 'verification-20261018.json') -Encoding utf8
$results | Select-Object Files,Verified,Archive | ConvertTo-Json
