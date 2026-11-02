$dir = $PSScriptRoot
$target = Join-Path $dir 'torch-2.15.0+cpu-cp311-cp311-win_amd64.whl'
if (Test-Path $target) {
    exit 0
}

$part1 = Join-Path $dir 'torch_cpu.part1'
$part2 = Join-Path $dir 'torch_cpu.part2'
$part3 = Join-Path $dir 'torch_cpu.part3'

if ((Test-Path $part1) -and (Test-Path $part2) -and (Test-Path $part3)) {
    Write-Host "[*] Menggabungkan arsip PyTorch CPU wheel..."
    $out = [System.IO.File]::Create($target)
    1..3 | ForEach-Object {
        $part = Join-Path $dir "torch_cpu.part$_"
        $in = [System.IO.File]::OpenRead($part)
        $in.CopyTo($out)
        $in.Close()
    }
    $out.Close()
    Write-Host "[OK] PyTorch CPU wheel siap digunakan."
}

