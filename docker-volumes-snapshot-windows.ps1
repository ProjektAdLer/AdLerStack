param (
    [Parameter(Position=0, Mandatory=$true)]
    [ValidateSet("snapshot", "restore")]
    [string]$Mode
)

# Error handling
$ErrorActionPreference = "Stop"

# Check if Docker is installed and running
try {
    docker info | Out-Null
} catch {
    Write-Host "Error: Docker is either not installed, not running, or requires elevated privileges." -ForegroundColor Red
    exit 1
}

# Get project name from docker compose config
$ProjectName = docker compose config --format json | ConvertFrom-Json | Select-Object -ExpandProperty name
$BackupVolume = "${ProjectName}_backup"

# Build the Alpine image with zstd
Write-Host "Building backup utility image..." -ForegroundColor Cyan
docker build -f Dockerfile-backup-image -t alpine-zstd .

# Create backup volume if it doesn't exist
docker volume create --name $BackupVolume

# Get all volumes for the project
$Volumes = docker volume ls -q --filter "label=com.docker.compose.project=$ProjectName"

if ($Mode -eq "snapshot") {
    Write-Host "=== Stopping containers..." -ForegroundColor Cyan
    docker compose down

    Write-Host "`n=== Backing up volumes for project '$ProjectName'..." -ForegroundColor Cyan
    docker run --rm -v "${BackupVolume}:/backup" alpine sh -c "rm -rf /backup/*"

    Write-Host "Storing docker compose config hash..." -ForegroundColor Cyan
    docker compose config | Out-String | 
        ForEach-Object { [System.Text.Encoding]::UTF8.GetBytes($_) } | 
        ForEach-Object { [System.Security.Cryptography.SHA256]::Create().ComputeHash($_) } | 
        ForEach-Object { [BitConverter]::ToString($_).Replace("-", "").ToLower() } |
        docker run --rm -i -v "${BackupVolume}:/backup" alpine sh -c "cat > /backup/docker-compose.yml.hash"

    # Parallel backup using jobs
    $jobs = @()
    foreach ($Volume in $Volumes) {
        Write-Host "Backing up $Volume..." -ForegroundColor Cyan
        $jobs += Start-Job -ScriptBlock {
            param($Volume, $BackupVolume)
            docker run --rm `
                -v "${Volume}:/source" `
                -v "${BackupVolume}:/backup" `
                alpine-zstd `
                sh -c "tar -cf - -C /source . | zstd -T0 --long=31 > /backup/${Volume}.zst"
        } -ArgumentList $Volume, $BackupVolume
    }

    # Wait for all jobs to complete
    $jobs | Wait-Job | Receive-Job
    $jobs | Remove-Job

    Write-Host "`nSnapshot completed successfully in volume: $BackupVolume" -ForegroundColor Green
}
else {
    # Get stored hash
    $StoredHash = docker run --rm -v "${BackupVolume}:/backup" alpine cat /backup/docker-compose.yml.hash
    
    # Calculate current hash
    $CurrentHash = docker compose config | Out-String | 
        ForEach-Object { [System.Text.Encoding]::UTF8.GetBytes($_) } | 
        ForEach-Object { [System.Security.Cryptography.SHA256]::Create().ComputeHash($_) } | 
        ForEach-Object { [BitConverter]::ToString($_).Replace("-", "").ToLower() }

    if ($StoredHash -ne $CurrentHash) {
        Write-Host "ERROR: docker compose config has changed. Recreate the containers and take a fresh snapshot." -ForegroundColor Red
        exit 1
    }

    Write-Host "=== Stopping containers..." -ForegroundColor Cyan
    docker compose kill

    Write-Host "`n=== Restoring volumes for project '$ProjectName'..." -ForegroundColor Cyan
    
    # Parallel restore using jobs
    $jobs = @()
    foreach ($Volume in $Volumes) {
        Write-Host "Restoring $Volume..." -ForegroundColor Cyan
        $jobs += Start-Job -ScriptBlock {
            param($Volume, $BackupVolume)
            docker run --rm `
                -v "${Volume}:/target" `
                -v "${BackupVolume}:/backup" `
                alpine-zstd `
                sh -c @"
                if [ ! -f "/backup/$Volume.zst" ]; then
                  echo "ERROR: Backup file not found for volume: $Volume"
                  echo "Did you take a snapshot before restoring?"
                  exit 1
                fi
                rm -rf /target/* /target/..?* /target/.[!.]*
                zstd --memory=2048MB -d -c "/backup/$Volume.zst" | tar -xf - -C /target
"@
        } -ArgumentList $Volume, $BackupVolume
    }

    # Wait for all jobs to complete
    $jobs | Wait-Job | Receive-Job
    $jobs | Remove-Job

    Write-Host "`nRestore completed successfully" -ForegroundColor Green
}

Write-Host "`n=== Restarting containers..." -ForegroundColor Cyan
docker compose up -d --wait --force-recreate

Write-Host "`n=== Done" -ForegroundColor Green