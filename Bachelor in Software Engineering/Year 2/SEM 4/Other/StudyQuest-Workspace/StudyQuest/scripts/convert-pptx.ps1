# ============================================================
# StudyQuest — one-time PPTX/PPT -> PDF conversion
# Uses PowerPoint COM automation. Originals are NEVER touched.
# Output mirrors relative paths under StudyQuest\converted\
# Idempotent: skips files whose converted PDF is newer than source.
# ============================================================
$ErrorActionPreference = 'Stop'

$ResourceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\Resource\Finals Subjects')).Path
$OutRoot      = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')).Path 'converted'
$ManifestPath = Join-Path $OutRoot 'conversion-manifest.json'

if (-not (Test-Path $OutRoot)) { New-Item -ItemType Directory -Force $OutRoot | Out-Null }

Write-Host "Source : $ResourceRoot"
Write-Host "Output : $OutRoot"

# Collect candidates (skip PowerPoint lock files ~$*)
$files = Get-ChildItem -Path $ResourceRoot -Recurse -Include *.pptx, *.ppt |
         Where-Object { $_.Name -notlike '~$*' }

Write-Host ("Found {0} presentation file(s)." -f $files.Count)

$manifest = @()
$converted = 0; $skipped = 0; $failed = 0
$pp = $null

try {
  foreach ($f in $files) {
    $rel = $f.FullName.Substring($ResourceRoot.Length).TrimStart('\')
    $dstRel = [System.IO.Path]::ChangeExtension($rel, '.pdf')
    $dst = Join-Path $OutRoot $dstRel
    $dstDir = Split-Path $dst -Parent
    if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Force $dstDir | Out-Null }

    if ((Test-Path $dst) -and ((Get-Item $dst).LastWriteTimeUtc -ge $f.LastWriteTimeUtc)) {
      $skipped++
      $manifest += [pscustomobject]@{ src = $rel; pdf = $dstRel; srcMtime = $f.LastWriteTimeUtc.ToString('o'); convertedAt = (Get-Item $dst).LastWriteTimeUtc.ToString('o'); status = 'cached' }
      continue
    }

    if ($null -eq $pp) {
      Write-Host 'Starting PowerPoint...'
      $pp = New-Object -ComObject PowerPoint.Application
    }

    try {
      Write-Host ("Converting: {0}" -f $rel)
      # Open(FileName, ReadOnly:=msoTrue, Untitled:=msoFalse, WithWindow:=msoFalse)
      $pres = $pp.Presentations.Open($f.FullName, $true, $false, $false)
      $pres.SaveAs($dst, 32)   # 32 = ppSaveAsPDF
      $pres.Close()
      [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($pres)
      $converted++
      $manifest += [pscustomobject]@{ src = $rel; pdf = $dstRel; srcMtime = $f.LastWriteTimeUtc.ToString('o'); convertedAt = (Get-Date).ToUniversalTime().ToString('o'); status = 'converted' }
    } catch {
      $failed++
      Write-Warning ("FAILED: {0} -> {1}" -f $rel, $_.Exception.Message)
      $manifest += [pscustomobject]@{ src = $rel; pdf = $null; srcMtime = $f.LastWriteTimeUtc.ToString('o'); convertedAt = $null; status = 'failed'; error = $_.Exception.Message }
    }
  }
} finally {
  if ($null -ne $pp) {
    try { $pp.Quit() } catch {}
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($pp)
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
  }
}

$manifest | ConvertTo-Json -Depth 4 | Out-File -FilePath $ManifestPath -Encoding utf8
Write-Host ''
Write-Host ("DONE. converted={0} cached={1} failed={2}" -f $converted, $skipped, $failed)
Write-Host ("Manifest: {0}" -f $ManifestPath)
