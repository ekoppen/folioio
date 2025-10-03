#!/bin/bash

# Portfolio Deployment Backup Script
# Creates complete backups of deployments including database, MinIO data, and configurations
# Usage: ./backup-deployment.sh [deployment-name] [options]

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_ROOT="deployment-backups"
DEPLOYMENTS_DIR="deployments"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Options
QUICK_MODE=false
COMPRESS=false
INCREMENTAL=false
REMOTE_DEST=""
STOP_CONTAINERS=false
DRY_RUN=false
BACKUP_ALL=false

# Functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  🛡️  Portfolio Deployment Backup System${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

show_usage() {
    cat << EOF
Usage: $0 [deployment-name] [options]

Arguments:
  deployment-name    Name of deployment to backup (e.g., folioio, pucktest)
                     Use --all to backup all deployments

Options:
  --quick           Quick mode: only SQL dump, skip full data copy
  --compress        Compress backup with tar.gz (saves space)
  --incremental     Use rsync for incremental backups (faster updates)
  --remote DEST     Copy backup to remote destination (e.g., user@server:/path)
  --stop            Stop containers during backup (ensures consistency)
  --dry-run         Show what would be done without making changes
  --all             Backup all deployments
  -h, --help        Show this help message

Examples:
  $0 folioio                    # Backup folioio deployment
  $0 pucktest --compress        # Backup and compress pucktest
  $0 --all                      # Backup all deployments
  $0 folioio --quick            # Quick SQL dump only
  $0 folioio --dry-run          # Test without making changes

Backup location: $BACKUP_ROOT/[deployment]/[timestamp]/
EOF
}

check_requirements() {
    local missing=0

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        missing=1
    fi

    if ! command -v rsync &> /dev/null; then
        print_warning "rsync not found, will use cp instead"
    fi

    return $missing
}

check_disk_space() {
    local deployment=$1
    local deploy_dir="$DEPLOYMENTS_DIR/$deployment"

    if [ ! -d "$deploy_dir/data" ]; then
        print_warning "No data directory found in $deploy_dir"
        return 0
    fi

    local data_size=$(du -sm "$deploy_dir/data" 2>/dev/null | cut -f1)
    local available_space=$(df -m . | awk 'NR==2 {print $4}')
    local required_space=$((data_size * 2))  # 2x for safety

    print_info "Data size: ${data_size}MB, Available: ${available_space}MB, Required: ${required_space}MB"

    if [ $available_space -lt $required_space ]; then
        print_error "Insufficient disk space!"
        print_info "Need at least ${required_space}MB, have ${available_space}MB"
        return 1
    fi

    return 0
}

get_deployment_status() {
    local deployment=$1
    local deploy_dir="$DEPLOYMENTS_DIR/$deployment"

    cd "$deploy_dir" 2>/dev/null || return 1

    local running=$(docker compose ps --services --filter "status=running" 2>/dev/null | wc -l | tr -d ' ')
    local total=$(docker compose ps --services 2>/dev/null | wc -l | tr -d ' ')

    cd - > /dev/null

    echo "$running/$total"
}

backup_deployment() {
    local deployment=$1
    local deploy_dir="$DEPLOYMENTS_DIR/$deployment"

    print_header
    echo -e "${BLUE}📦 Backing up deployment: ${GREEN}$deployment${NC}"
    echo ""

    # Validate deployment exists
    if [ ! -d "$deploy_dir" ]; then
        print_error "Deployment not found: $deploy_dir"
        return 1
    fi

    # Check disk space
    if ! check_disk_space "$deployment"; then
        return 1
    fi

    # Create backup directory
    local backup_dir="$BACKUP_ROOT/$deployment/$TIMESTAMP"

    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN: Would create backup in: $backup_dir"
    else
        mkdir -p "$backup_dir"
        print_success "Created backup directory: $backup_dir"
    fi

    # Get deployment status
    local status=$(get_deployment_status "$deployment")
    print_info "Deployment status: $status containers running"

    # Stop containers if requested
    local was_running=false
    if [ "$STOP_CONTAINERS" = true ]; then
        if [ "$DRY_RUN" = false ]; then
            cd "$deploy_dir"
            local running=$(docker compose ps --services --filter "status=running" | wc -l | tr -d ' ')
            if [ "$running" -gt 0 ]; then
                print_info "Stopping containers for consistent backup..."
                docker compose stop
                was_running=true
                print_success "Containers stopped"
            fi
            cd - > /dev/null
        else
            print_info "DRY RUN: Would stop containers"
        fi
    fi

    # Start backup process
    local start_time=$(date +%s)

    # 1. Backup database (SQL dump)
    print_info "Creating database SQL dump..."
    if [ "$DRY_RUN" = false ]; then
        cd "$deploy_dir"

        # Ensure database is running for SQL dump
        if [ "$was_running" = true ] || docker compose ps postgres --quiet &>/dev/null; then
            if [ "$was_running" = true ]; then
                docker compose start postgres
                sleep 5
            fi

            if docker compose exec -T postgres pg_dump -U postgres portfolio_db > "$backup_dir/database.sql" 2>/dev/null; then
                local sql_size=$(du -h "$backup_dir/database.sql" | cut -f1)
                print_success "SQL dump created: $sql_size"
            else
                print_warning "Could not create SQL dump (container may not be running)"
            fi
        else
            print_warning "Postgres container not running, skipping SQL dump"
        fi

        cd - > /dev/null
    else
        print_info "DRY RUN: Would create SQL dump at $backup_dir/database.sql"
    fi

    # 2. Backup full data directory (unless quick mode)
    if [ "$QUICK_MODE" = false ]; then
        print_info "Backing up full data directory (postgres + minio)..."

        if [ -d "$deploy_dir/data" ]; then
            local postgres_files=$(find "$deploy_dir/data/postgres" -type f 2>/dev/null | wc -l | tr -d ' ')
            local minio_files=$(find "$deploy_dir/data/minio" -type f 2>/dev/null | wc -l | tr -d ' ')

            print_info "PostgreSQL files: $postgres_files"
            print_info "MinIO files: $minio_files"

            if [ "$DRY_RUN" = false ]; then
                if [ "$INCREMENTAL" = true ] && command -v rsync &> /dev/null; then
                    print_info "Using rsync for incremental backup..."
                    rsync -av --progress "$deploy_dir/data/" "$backup_dir/data/"
                else
                    print_info "Copying data directory..."
                    cp -r "$deploy_dir/data/" "$backup_dir/data/"
                fi

                local data_size=$(du -sh "$backup_dir/data" | cut -f1)
                print_success "Data directory backed up: $data_size"
            else
                local data_size=$(du -sh "$deploy_dir/data" | cut -f1)
                print_info "DRY RUN: Would backup $data_size of data to $backup_dir/data/"
            fi
        else
            print_warning "No data directory found, skipping"
        fi
    else
        print_info "Quick mode: skipping full data copy"
    fi

    # 3. Backup configuration files
    print_info "Backing up configuration files..."
    if [ "$DRY_RUN" = false ]; then
        if [ -f "$deploy_dir/.env" ]; then
            cp "$deploy_dir/.env" "$backup_dir/.env"
            print_success "Backed up .env"
        fi

        if [ -f "$deploy_dir/docker-compose.yml" ]; then
            cp "$deploy_dir/docker-compose.yml" "$backup_dir/docker-compose.yml"
            print_success "Backed up docker-compose.yml"
        fi
    else
        print_info "DRY RUN: Would backup .env and docker-compose.yml"
    fi

    # 4. Create metadata file
    print_info "Creating backup metadata..."
    if [ "$DRY_RUN" = false ]; then
        local postgres_size=$(du -sh "$deploy_dir/data/postgres" 2>/dev/null | cut -f1 || echo "N/A")
        local minio_size=$(du -sh "$deploy_dir/data/minio" 2>/dev/null | cut -f1 || echo "N/A")
        local total_size=$(du -sh "$backup_dir" 2>/dev/null | cut -f1 || echo "N/A")

        cat > "$backup_dir/backup.meta" << EOF
# Backup Metadata
backup_timestamp=$TIMESTAMP
backup_date=$(date)
deployment_name=$deployment
deployment_status=$status

# Sizes
total_backup_size=$total_size
postgres_size=$postgres_size
minio_size=$minio_size

# File counts
postgres_files=$(find "$deploy_dir/data/postgres" -type f 2>/dev/null | wc -l | tr -d ' ')
minio_files=$(find "$deploy_dir/data/minio" -type f 2>/dev/null | wc -l | tr -d ' ')

# Options
quick_mode=$QUICK_MODE
compressed=$COMPRESS
incremental=$INCREMENTAL

# Checksums
checksum_generated=$(date +%s)
EOF

        # Add checksums for verification (optional, can be slow for large backups)
        if [ -d "$backup_dir/data" ]; then
            print_info "Calculating checksums (this may take a moment)..."
            find "$backup_dir/data" -type f -exec md5 {} + 2>/dev/null | md5 >> "$backup_dir/backup.meta" || true
        fi

        print_success "Metadata created"
    else
        print_info "DRY RUN: Would create backup.meta file"
    fi

    # 5. Compress if requested
    if [ "$COMPRESS" = true ]; then
        print_info "Compressing backup..."
        if [ "$DRY_RUN" = false ]; then
            cd "$BACKUP_ROOT/$deployment"
            tar -czf "$TIMESTAMP.tar.gz" "$TIMESTAMP/"
            rm -rf "$TIMESTAMP"
            print_success "Backup compressed: $TIMESTAMP.tar.gz"
            cd - > /dev/null
        else
            print_info "DRY RUN: Would compress to $TIMESTAMP.tar.gz"
        fi
    fi

    # 6. Copy to remote if specified
    if [ -n "$REMOTE_DEST" ]; then
        print_info "Copying to remote destination: $REMOTE_DEST"
        if [ "$DRY_RUN" = false ]; then
            if [ "$COMPRESS" = true ]; then
                rsync -avz "$BACKUP_ROOT/$deployment/$TIMESTAMP.tar.gz" "$REMOTE_DEST/"
            else
                rsync -avz "$backup_dir/" "$REMOTE_DEST/$deployment/$TIMESTAMP/"
            fi
            print_success "Copied to remote destination"
        else
            print_info "DRY RUN: Would copy to $REMOTE_DEST"
        fi
    fi

    # Restart containers if we stopped them
    if [ "$was_running" = true ] && [ "$DRY_RUN" = false ]; then
        print_info "Restarting containers..."
        cd "$deploy_dir"
        docker compose start
        sleep 3
        local running=$(docker compose ps --services --filter "status=running" | wc -l | tr -d ' ')
        print_success "Containers restarted ($running running)"
        cd - > /dev/null
    fi

    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Print summary
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    if [ "$DRY_RUN" = false ]; then
        echo "📁 Backup location: $backup_dir"
        echo "⏱️  Duration: ${duration}s"
        echo "📊 Backup size: $(du -sh "$backup_dir" 2>/dev/null | cut -f1 || echo "N/A")"
    else
        print_info "DRY RUN completed - no changes made"
    fi
    echo ""
    print_info "To restore this backup, use:"
    echo "   ./restore-deployment.sh $deployment $TIMESTAMP"
    echo ""

    return 0
}

# Main script
main() {
    print_header

    # Check requirements
    if ! check_requirements; then
        exit 1
    fi

    # If no arguments, show usage
    if [ $# -eq 0 ]; then
        show_usage
        exit 0
    fi

    # Parse arguments
    DEPLOYMENT=""
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            --all)
                BACKUP_ALL=true
                shift
                ;;
            --quick)
                QUICK_MODE=true
                shift
                ;;
            --compress)
                COMPRESS=true
                shift
                ;;
            --incremental)
                INCREMENTAL=true
                shift
                ;;
            --remote)
                REMOTE_DEST="$2"
                shift 2
                ;;
            --stop)
                STOP_CONTAINERS=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                print_warning "DRY RUN MODE - No changes will be made"
                echo ""
                shift
                ;;
            *)
                if [ -z "$DEPLOYMENT" ]; then
                    DEPLOYMENT="$1"
                else
                    print_error "Unknown option: $1"
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # Backup all or specific deployment
    if [ "$BACKUP_ALL" = true ]; then
        print_info "Backing up all deployments..."
        echo ""

        if [ ! -d "$DEPLOYMENTS_DIR" ]; then
            print_error "Deployments directory not found: $DEPLOYMENTS_DIR"
            exit 1
        fi

        local deployments=($(find "$DEPLOYMENTS_DIR" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;))

        if [ ${#deployments[@]} -eq 0 ]; then
            print_error "No deployments found in $DEPLOYMENTS_DIR"
            exit 1
        fi

        local failed=0
        for deployment in "${deployments[@]}"; do
            if ! backup_deployment "$deployment"; then
                failed=$((failed + 1))
            fi
            echo ""
        done

        if [ $failed -gt 0 ]; then
            print_error "$failed deployment(s) failed to backup"
            exit 1
        fi
    else
        if [ -z "$DEPLOYMENT" ]; then
            print_error "Please specify a deployment name or use --all"
            echo ""
            show_usage
            exit 1
        fi

        backup_deployment "$DEPLOYMENT"
    fi
}

# Run main function
main "$@"
