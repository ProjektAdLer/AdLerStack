param (
    [string]$Mode
)

if ($Mode -ne "snapshot" -and $Mode -ne "restore") {
    Write-Host "Usage: .\docker-volumes-snapshot-windows.ps1 [snapshot|restore]"
    exit 1
}

# Check if Docker is installed
if (-not (docker info -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker is either not installed, not running, or requires administrative privileges."
    exit 1
}

$ProjectName = docker compose config --format json | jq -r '.name'
$BackupVolume = "${ProjectName}_backup"

docker build -f Dockerfile-backup-image -t alpine-zstd .

docker volume create --name $BackupVolume

$Volumes = docker volume ls -q --filter "label=com.docker.compose.project=$ProjectName"

if ($Mode -eq "snapshot") {
    Write-Host "=== Stopping containers..."
    docker compose down

    Write-Host "`n=== Backing up volumes for project '$ProjectName'..."
    docker run --rm -v "$BackupVolume:/backup" alpine sh -c "rm -rf /backup/*"
    Write-Host "Storing docker compose config hash..."
    docker compose config | sha256sum | ForEach-Object { $_.Split(" ")[0] } | docker run --rm -i -v "$BackupVolume:/backup" alpine sh -c "cat > /backup/docker-compose.yml.hash" &
    foreach ($Volume in $Volumes) {
        Write-Host "Backing up $Volume..."
        docker run --rm `
            -v "$Volume:/source" `
            -v "$BackupVolume:/backup" `
            alpine-zstd `
            sh -c "tar -cf - -C /source . | zstd -T0 --long=31 > /backup/${Volume}.zst" `
            &  # Run in background for parallel backup
    }
    Wait-Job
    Write-Host "`nSnapshot completed successfully in volume: $BackupVolume"
} else {
    $StoredHash = docker run --rm -v "$BackupVolume:/backup" alpine cat /backup/docker-compose.yml.hash
    $CurrentHash = docker compose config | sha256sum | ForEach-Object { $_.Split(" ")[0] }
    if ($StoredHash -ne $CurrentHash) {
        Write-Host "ERROR: docker compose config has changed. Recreate the containers and take a fresh snapshot."
        exit 1
    }

    Write-Host "=== Stopping containers..."
    docker compose kill

    Write-Host "`n=== Restoring volumes for project '$ProjectName'..."
    foreach ($Volume in $Volumes) {
        Write-Host "Restoring $Volume..."
        docker run --rm `
            -v "$Volume:/target" `
            -v "$BackupVolume:/backup" `
            alpine-zstd `
            sh -c @"
                if [ ! -f "/backup/$Volume.zst" ]; then
                    echo "ERROR: Backup file not found for volume: $Volume"
                    echo "Did you take a snapshot before restoring?"
                    exit 1
                fi
                rm -rf /target/* /target/..?* /target/.[!.]*
                zstd --memory=2048MB -d -c "/backup/$Volume.zst" | tar -xf - -C /target
"@ `
            &  # Run in background for parallel restore
    }
    Wait-Job
    Write-Host "`nRestore completed successfully"
}

Write-Host "`n=== Restarting containers..."
docker compose up -d --wait --force-recreate

Write-Host "`n=== Done"
