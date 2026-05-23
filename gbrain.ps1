param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $GBrainArgs
)

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PodcastDirName = -join @([char]25773, [char]23458, [char]30456, [char]20851)
$SharedToolsRoot = Join-Path (Join-Path "F:\" $PodcastDirName) "tools"
$Bun = Join-Path $SharedToolsRoot "bun\bun.exe"
$GBrainCli = Join-Path $SharedToolsRoot "gbrain\src\cli.ts"
$BrainPath = Join-Path $ProjectRoot ".gbrain\brain.pglite"
$ProjectGBrainDir = Join-Path $ProjectRoot ".gbrain"

if (-not (Test-Path -LiteralPath $Bun)) {
  throw "Missing bundled Bun runtime: $Bun"
}

if (-not (Test-Path -LiteralPath $GBrainCli)) {
  throw "Missing bundled gbrain source: $GBrainCli"
}

if (-not (Test-Path -LiteralPath $ProjectGBrainDir)) {
  New-Item -ItemType Directory -Force $ProjectGBrainDir | Out-Null
}

$env:GBRAIN_DATABASE_PATH = $BrainPath
& $Bun $GBrainCli @GBrainArgs
