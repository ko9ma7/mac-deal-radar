# GitHub Pages deployment for Mac Deal Radar (Windows PowerShell 5.1+).
# Uses GitHub CLI authentication; does not ask users to put tokens into files.
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
$repoName = 'mac-deal-radar'
$description = 'MacBook public promotion radar - GitHub Pages and PC collector'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot) -ErrorAction Stop

function Step([string]$message) { Write-Host "`n[CHECK] $message" -ForegroundColor Cyan }
function Info([string]$message) { Write-Host "[OK] $message" -ForegroundColor Green }
function Warn([string]$message) { Write-Host "[WARN] $message" -ForegroundColor Yellow }
function Invoke-Checked([string]$what, [scriptblock]$action) {
    & $action
    if ($LASTEXITCODE -ne 0) { throw "$what failed (exit code $LASTEXITCODE)." }
}
function Get-Text([scriptblock]$action) {
    $result = (& $action 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) { return $null }
    return $result
}
function Verify-Command([string]$name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "Missing: $name. Install Git: https://git-scm.com/download/win , Node: https://nodejs.org , GitHub CLI: https://cli.github.com"
    }
}

try {
    Write-Host '[BOOTSTRAP V3] GitHub Pages / Local PC / No Cloudflare' -ForegroundColor Green
    Write-Host ('[PROJECT FOLDER] ' + (Get-Location).Path)
    Step 'Checking installed tools'
    foreach ($name in @('git.exe','node.exe','npm.cmd','gh.exe')) { Verify-Command $name }
    & git.exe --version
    & node.exe --version
    & gh.exe --version | Select-Object -First 1

    Step 'Checking GitHub login (account owner cannot be blank)'
    & gh.exe auth status *> $null
    if ($LASTEXITCODE -ne 0) {
        Warn 'Sign in with your GitHub account in the opened browser.'
        Invoke-Checked 'GitHub login' { & gh.exe auth login --hostname github.com --git-protocol https --web }
    }
    $owner = Get-Text { & gh.exe api user --jq '.login' }
    if ([string]::IsNullOrWhiteSpace($owner) -or $owner -notmatch '^[A-Za-z0-9][A-Za-z0-9-]{0,38}$') {
        throw 'Unable to read your GitHub username. Run: gh auth login ; gh api user --jq .login'
    }
    $fullRepo = "$owner/$repoName"
    $repoUrl = "https://github.com/$fullRepo"
    $siteUrl = "https://$($owner.ToLowerInvariant()).github.io/$repoName/"
    Info "Authenticated account: $owner"
    Write-Host "[TARGET] $repoUrl"

    Step 'Testing collector and building static GitHub Pages site'
    Invoke-Checked 'npm test' { & npm.cmd test }
    $env:GITHUB_REPOSITORY = $fullRepo
    Invoke-Checked 'npm run build' { & npm.cmd run build }

    Step 'Preparing local Git repository'
    if (-not (Test-Path -LiteralPath '.git')) { Invoke-Checked 'git init' { & git.exe init -b main } }
    $gitName = Get-Text { & git.exe config user.name }
    if ([string]::IsNullOrWhiteSpace($gitName)) { Invoke-Checked 'Git author name' { & git.exe config user.name $owner } }
    $gitEmail = Get-Text { & git.exe config user.email }
    if ([string]::IsNullOrWhiteSpace($gitEmail)) {
        $githubId = Get-Text { & gh.exe api user --jq '.id' }
        if ([string]::IsNullOrWhiteSpace($githubId)) { throw 'Cannot get GitHub user ID to configure a noreply email.' }
        Invoke-Checked 'Git author email' { & git.exe config user.email "$githubId+$owner@users.noreply.github.com" }
    }
    Invoke-Checked 'Switching branch to main' { & git.exe branch -M main }

    Step 'Creating or locating GitHub repository'
    & gh.exe repo view $fullRepo --json name *> $null
    if ($LASTEXITCODE -ne 0) {
        Invoke-Checked 'Creating GitHub repository' { & gh.exe repo create $fullRepo --public --description $description }
    } else {
        Info "Using existing repository: $fullRepo"
    }
    # Do not overwrite a different repository remote by accident.
    $remotes = Get-Text { & git.exe remote }
    $origin = $null
    if (($remotes -split '\s+') -contains 'origin') { $origin = Get-Text { & git.exe remote get-url origin } }
    $desiredOrigin = "https://github.com/$fullRepo.git"
    if ([string]::IsNullOrWhiteSpace($origin)) {
        Invoke-Checked 'Adding GitHub remote' { & git.exe remote add origin $desiredOrigin }
    } elseif ($origin -match '^https://github\.com//mac-deal-radar(?:\.git)?/?$') {
        Warn 'Repairing the invalid empty-owner origin from the older installer.'
        Invoke-Checked 'Repairing origin' { & git.exe remote set-url origin $desiredOrigin }
    } elseif (($origin -ne $desiredOrigin) -and ($origin -ne "https://github.com/$fullRepo") -and ($origin -ne "git@github.com:$fullRepo.git")) {
        throw "The existing origin ($origin) points to another repository. Use a clean folder or review with 'git remote -v'."
    }

    Step 'Committing and uploading the actual website files'
    Invoke-Checked 'git add' { & git.exe add -A }
    $pending = (& git.exe diff --cached --name-only | Out-String).Trim()
    if (-not [string]::IsNullOrWhiteSpace($pending)) {
        Invoke-Checked 'git commit' { & git.exe commit -m 'Deploy free Mac Deal Radar (no Cloudflare)' }
    } else { Info 'No file changes; retaining existing commit.' }
    $localSha = Get-Text { & git.exe rev-parse HEAD }
    if ([string]::IsNullOrWhiteSpace($localSha)) { throw 'No Git commit exists. Nothing can be uploaded.' }
    Invoke-Checked 'git push' { & git.exe push -u origin main }
    $remoteSha = Get-Text { & gh.exe api "repos/$fullRepo/git/ref/heads/main" --jq '.object.sha' }
    if ($remoteSha -ne $localSha) {
        throw "Upload verification failed: remote main SHA does not match local HEAD. Local=$localSha Remote=$remoteSha"
    }
    Info "SOURCE UPLOADED AND VERIFIED: $repoUrl"

    Step 'Enabling GitHub Pages (GitHub Actions mode)'
    & gh.exe api "repos/$fullRepo/pages" *> $null
    if ($LASTEXITCODE -eq 0) {
        & gh.exe api --method PUT "repos/$fullRepo/pages" -f build_type=workflow *> $null
    } else {
        & gh.exe api --method POST "repos/$fullRepo/pages" -f build_type=workflow *> $null
    }
    if ($LASTEXITCODE -ne 0) {
        Warn 'Pages API setup did not complete. Visit repository Settings > Pages > Build and deployment > GitHub Actions.'
    }

    Step 'Checking the deployment workflow'
    $runId = $null
    for ($attempt = 1; $attempt -le 8; $attempt++) {
        $json = Get-Text { & gh.exe run list --repo $fullRepo --workflow deploy.yml --limit 10 --json 'databaseId,headSha' }
        if ($json) {
            $runs = @($json | ConvertFrom-Json -ErrorAction Stop)
            $run = $runs | Where-Object { $_.headSha -eq $localSha } | Select-Object -First 1
            if ($run) { $runId = $run.databaseId; break }
        }
        Start-Sleep -Seconds 3
    }
    if (-not $runId) {
        Warn 'No automatic Pages run found for the pushed revision; requesting one.'
        & gh.exe workflow run deploy.yml --repo $fullRepo
        if ($LASTEXITCODE -ne 0) {
            throw 'Could not dispatch deploy.yml. Enable Actions in the repository settings and open the Actions tab.'
        }
        for ($attempt = 1; $attempt -le 8; $attempt++) {
            Start-Sleep -Seconds 3
            $json = Get-Text { & gh.exe run list --repo $fullRepo --workflow deploy.yml --limit 10 --json 'databaseId,headSha' }
            if ($json) {
                $runs = @($json | ConvertFrom-Json -ErrorAction Stop)
                $run = $runs | Where-Object { $_.headSha -eq $localSha } | Select-Object -First 1
                if ($run) { $runId = $run.databaseId; break }
            }
        }
    }
    if (-not $runId) {
        throw "Files were uploaded but no deploy run was found. Open $repoUrl/actions and check GitHub Actions."
    }
    Write-Host "[RUN] https://github.com/$fullRepo/actions/runs/$runId"
    & gh.exe run watch "$runId" --repo $fullRepo --exit-status
    if ($LASTEXITCODE -ne 0) {
        Warn 'First workflow run did not succeed. Trying one rerun after Pages setup.'
        Invoke-Checked 'Rerun Pages workflow' { & gh.exe run rerun "$runId" --repo $fullRepo }
        Invoke-Checked 'GitHub Pages workflow (retry)' { & gh.exe run watch "$runId" --repo $fullRepo --exit-status }
    }

    Step 'Checking published site configuration'
    $publishedUrl = Get-Text { & gh.exe api "repos/$fullRepo/pages" --jq '.html_url' }
    if ([string]::IsNullOrWhiteSpace($publishedUrl) -or $publishedUrl -eq 'null') {
        Warn "Deployment completed but Pages URL was not returned. Check $repoUrl/settings/pages"
        $publishedUrl = $siteUrl
    }
    Write-Host ''
    Info 'GITHUB UPLOAD VERIFIED AND PAGES WORKFLOW COMPLETED'
    Write-Host "Repository: $repoUrl" -ForegroundColor Green
    Write-Host "Website:    $publishedUrl" -ForegroundColor Green
    Write-Host 'To refresh data later, double-click the collect-and-publish .cmd file in this folder.'
    exit 0
} catch {
    Write-Host ''
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host '[FIX] Sign in to GitHub with: gh auth login' -ForegroundColor Yellow
    Write-Host '[FIX] Confirm user with: gh api user --jq .login' -ForegroundColor Yellow
    Write-Host '[FIX] Check uploaded repository and Actions on github.com.' -ForegroundColor Yellow
    exit 1
}
