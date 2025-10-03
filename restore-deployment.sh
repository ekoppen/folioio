#!/bin/bash

# Portfolio Deployment Restore Script
# Safely restores deployments from backups with automatic pre-restore backup
# Usage: ./restore-deployment.sh [deployment-name] [backup-timestamp] [options]

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKUP_ROOT="deployment-backups"
DEPLOYMENTS_DIR="deployments"

# Options
DRY_RUN=false
SKIP_PRE_BACKUP=false
AUTO_YES=false

# Functions
print_header() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  🔄 Portfolio Deployment Restore System${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
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
Usage: $0 [deployment-name] [backup-timestamp|latest] [options]

Arguments:
  deployment-name    Name of deployment to restore (e.g., folioio, pucktest)
  backup-timestamp   Backup timestamp to restore (e.g., 20251002-153045)
                     Use 'latest' to restore the most recent backup

Options:
  --dry-run          Show what would be done without making changes
  --skip-pre-backup  Skip automatic pre-restore backup (not recommended)
  --yes              Auto-confirm all prompts (use with caution)
  -h, --help         Show this help message

Examples:
  $0                                    # Interactive mode
  $0 folioio latest                     # Restore latest backup
  $0 folioio 20251002-153045            # Restore specific backup
  $0 folioio latest --dry-run           # Test restore without changes
  $0 pucktest latest --skip-pre-backup  # Skip safety backup

Safety Features:
  ⚠️  Automatic pre-restore backup of current state
  ⚠️  Confirmation prompts before destructive actions
  ⚠️  Dry-run mode for testing
  ⚠️  Rollback instructions provided

Backup location: $BACKUP_ROOT/[deployment]/[timestamp]/
EOF
}

list_available_backups() {
    local deployment=$1
    local backup_dir="$BACKUP_ROOT/$deployment"

    if [ ! -d "$backup_dir" ]; then
        print_error "No backups found for deployment: $deployment"
        return 1
    fi

    local backups=($(ls -1 "$backup_dir" 2>/dev/null | grep -E '^[0-9]{8}-[0-9]{6}$' | sort -r))

    if [ ${#backups[@]} -eq 0 ]; then
        print_error "No valid backups found for deployment: $deployment"
        return 1
    fi

    echo -e "${BLUE}Available backups for $deployment:${NC}"
    echo ""

    local i=1
    for backup in "${backups[@]}"; do
        local backup_path="$backup_dir/$backup"
        local backup_date=$(echo "$backup" | sed 's/-/ /')
        local backup_size=$(du -sh "$backup_path" 2>/dev/null | cut -f1 || echo "N/A")

        # Read metadata if available
        local meta_file="$backup_path/backup.meta"
        local postgres_files="N/A"
        local minio_files="N/A"

        if [ -f "$meta_file" ]; then
            postgres_files=$(grep "postgres_files=" "$meta_file" | cut -d'=' -f2 || echo "N/A")
            minio_files=$(grep "minio_files=" "$meta_file" | cut -d'=' -f2 || echo "N/A")
        fi

        echo -e "${GREEN}$i.${NC} $backup"
        echo "   📅 Date: $backup_date"
        echo "   📊 Size: $backup_size"
        echo "   📁 Files: Postgres=$postgres_files, MinIO=$minio_files"
        echo ""

        i=$((i + 1))
    done

    return 0
}

get_latest_backup() {
    local deployment=$1
    local backup_dir="$BACKUP_ROOT/$deployment"

    if [ ! -d "$backup_dir" ]; then
        return 1
    fi

    local latest=$(ls -1 "$backup_dir" 2>/dev/null | grep -E '^[0-9]{8}-[0-9]{6}$' | sort -r | head -1)

    if [ -n "$latest" ]; then
        echo "$latest"
        return 0
    fi

    return 1
}

show_backup_info() {
    local deployment=$1
    local timestamp=$2
    local backup_path="$BACKUP_ROOT/$deployment/$timestamp"

    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📋 Backup Information${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "📦 Deployment: $deployment"
    echo "🕒 Timestamp: $timestamp"
    echo "📁 Location: $backup_path"
    echo ""

    # Read metadata
    local meta_file="$backup_path/backup.meta"
    if [ -f "$meta_file" ]; then
        echo "📊 Backup Details:"
        grep -E "backup_date=|total_backup_size=|postgres_files=|minio_files=" "$meta_file" | sed 's/^/   /'
        echo ""
    fi

    # Check what's in the backup
    echo "📦 Backup Contents:"
    if [ -d "$backup_path/data/postgres" ]; then
        local pg_size=$(du -sh "$backup_path/data/postgres" | cut -f1)
        echo "   ✅ PostgreSQL data: $pg_size"
    else
        echo "   ⚠️  PostgreSQL data: Not found"
    fi

    if [ -d "$backup_path/data/minio" ]; then
        local minio_size=$(du -sh "$backup_path/data/minio" | cut -f1)
        echo "   ✅ MinIO data: $minio_size"
    else
        echo "   ⚠️  MinIO data: Not found"
    fi

    if [ -f "$backup_path/database.sql" ]; then
        local sql_size=$(du -sh "$backup_path/database.sql" | cut -f1)
        echo "   ✅ SQL dump: $sql_size"
    else
        echo "   ⚠️  SQL dump: Not found"
    fi

    if [ -f "$backup_path/.env" ]; then
        echo "   ✅ Environment config"
    fi

    if [ -f "$backup_path/docker-compose.yml" ]; then
        echo "   ✅ Docker compose config"
    fi

    echo ""
}

confirm_action() {
    local message=$1

    if [ "$AUTO_YES" = true ]; then
        return 0
    fi

    read -p "$(echo -e ${YELLOW}⚠️  $message [y/N]: ${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    fi
    return 1
}

create_pre_restore_backup() {
    local deployment=$1
    local deploy_dir="$DEPLOYMENTS_DIR/$deployment"

    print_info "Creating pre-restore safety backup..."

    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN: Would create pre-restore backup"
        return 0
    fi

    # Use the backup script to create a safety backup
    if [ -x "./backup-deployment.sh" ]; then
        print_info "Running: ./backup-deployment.sh $deployment"
        ./backup-deployment.sh "$deployment" --quick
        print_success "Pre-restore backup created"
    else
        # Fallback: manual backup
        local timestamp=$(date +"%Y%m%d-%H%M%S")
        local safety_backup="$deploy_dir/safety_backup_before_restore_$timestamp"

        mkdir -p "$safety_backup"

        if [ -d "$deploy_dir/data" ]; then
            cp -r "$deploy_dir/data" "$safety_backup/"
        fi

        if [ -f "$deploy_dir/.env" ]; then
            cp "$deploy_dir/.env" "$safety_backup/"
        fi

        print_success "Safety backup created: $safety_backup"
    fi

    return 0
}

restore_deployment() {
    local deployment=$1
    local timestamp=$2
    local backup_path="$BACKUP_ROOT/$deployment/$timestamp"
    local deploy_dir="$DEPLOYMENTS_DIR/$deployment"

    print_header

    # Validate backup exists
    if [ ! -d "$backup_path" ]; then
        print_error "Backup not found: $backup_path"
        return 1
    fi

    # Validate deployment directory exists
    if [ ! -d "$deploy_dir" ]; then
        print_error "Deployment directory not found: $deploy_dir"
        print_info "Create the deployment first before restoring"
        return 1
    fi

    # Show backup information
    show_backup_info "$deployment" "$timestamp"

    # Confirm restore
    if ! confirm_action "This will OVERWRITE the current deployment. Continue?"; then
        print_info "Restore cancelled"
        return 0
    fi

    # Create pre-restore backup
    if [ "$SKIP_PRE_BACKUP" = false ]; then
        if ! create_pre_restore_backup "$deployment"; then
            print_warning "Pre-restore backup failed"
            if ! confirm_action "Continue without safety backup?"; then
                print_info "Restore cancelled"
                return 0
            fi
        fi
    else
        print_warning "Skipping pre-restore backup (--skip-pre-backup flag used)"
    fi

    # Start restore process
    local start_time=$(date +%s)

    print_info "Starting restore process..."
    echo ""

    # 1. Stop containers
    print_info "Stopping containers..."
    if [ "$DRY_RUN" = false ]; then
        cd "$deploy_dir"
        docker compose down
        print_success "Containers stopped"
        cd - > /dev/null
    else
        print_info "DRY RUN: Would stop containers"
    fi

    # 2. Restore data directory
    if [ -d "$backup_path/data" ]; then
        print_info "Restoring data directory (postgres + minio)..."

        if [ "$DRY_RUN" = false ]; then
            # Remove old data directory
            if [ -d "$deploy_dir/data" ]; then
                rm -rf "$deploy_dir/data"
            fi

            # Copy backup data
            cp -r "$backup_path/data" "$deploy_dir/data"

            local restored_size=$(du -sh "$deploy_dir/data" | cut -f1)
            print_success "Data restored: $restored_size"
        else
            local backup_size=$(du -sh "$backup_path/data" | cut -f1)
            print_info "DRY RUN: Would restore $backup_size of data"
        fi
    else
        print_warning "No data directory in backup, skipping"
    fi

    # 3. Restore configuration files
    print_info "Restoring configuration files..."

    if [ "$DRY_RUN" = false ]; then
        if [ -f "$backup_path/.env" ]; then
            cp "$backup_path/.env" "$deploy_dir/.env"
            print_success "Restored .env"
        fi

        if [ -f "$backup_path/docker-compose.yml" ]; then
            cp "$backup_path/docker-compose.yml" "$deploy_dir/docker-compose.yml"
            print_success "Restored docker-compose.yml"
        fi
    else
        print_info "DRY RUN: Would restore .env and docker-compose.yml"
    fi

    # 4. Start containers
    print_info "Starting containers..."

    if [ "$DRY_RUN" = false ]; then
        cd "$deploy_dir"
        docker compose up -d
        sleep 5

        local running=$(docker compose ps --services --filter "status=running" | wc -l | tr -d ' ')
        local total=$(docker compose ps --services | wc -l | tr -d ' ')

        if [ "$running" -eq "$total" ]; then
            print_success "All containers started ($running/$total)"
        else
            print_warning "Some containers may not be running ($running/$total)"
            print_info "Check logs: cd $deploy_dir && docker compose logs"
        fi

        cd - > /dev/null
    else
        print_info "DRY RUN: Would start containers"
    fi

    # 5. Verify restoration
    if [ "$DRY_RUN" = false ]; then
        print_info "Verifying restoration..."
        sleep 3

        cd "$deploy_dir"

        # Check database
        if docker compose exec -T postgres psql -U postgres -d portfolio_db -c "SELECT COUNT(*) FROM site_settings;" &>/dev/null; then
            print_success "Database is accessible"
        else
            print_warning "Could not verify database access"
        fi

        cd - > /dev/null
    fi

    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Print summary
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    if [ "$DRY_RUN" = false ]; then
        echo -e "${GREEN}✅ Restore completed successfully!${NC}"
    else
        echo -e "${BLUE}✅ Dry-run completed - no changes made${NC}"
    fi
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if [ "$DRY_RUN" = false ]; then
        echo "📦 Deployment: $deployment"
        echo "🕒 Restored from: $timestamp"
        echo "⏱️  Duration: ${duration}s"
        echo ""

        # Get port info
        if [ -f "$deploy_dir/.env" ]; then
            local port=$(grep "FRONTEND_PORT=" "$deploy_dir/.env" | cut -d'=' -f2)
            if [ -n "$port" ]; then
                echo "🌐 Access your site at: http://localhost:$port"
                echo ""
            fi
        fi

        print_info "If something went wrong, check the pre-restore backup:"
        echo "   Location: $deploy_dir/safety_backup_before_restore_*"
        echo ""
        print_info "To rollback, you can restore from that backup"
    fi
    echo ""

    return 0
}

interactive_mode() {
    print_header

    # List available deployments
    if [ ! -d "$BACKUP_ROOT" ]; then
        print_error "No backups directory found: $BACKUP_ROOT"
        print_info "Create backups first with: ./backup-deployment.sh"
        return 1
    fi

    local deployments=($(ls -1 "$BACKUP_ROOT" 2>/dev/null))

    if [ ${#deployments[@]} -eq 0 ]; then
        print_error "No deployment backups found"
        print_info "Create backups first with: ./backup-deployment.sh"
        return 1
    fi

    echo -e "${BLUE}Available deployments with backups:${NC}"
    echo ""

    local i=1
    for dep in "${deployments[@]}"; do
        local backup_count=$(ls -1 "$BACKUP_ROOT/$dep" 2>/dev/null | grep -E '^[0-9]{8}-[0-9]{6}$' | wc -l | tr -d ' ')
        echo -e "${GREEN}$i.${NC} $dep ($backup_count backup(s))"
        i=$((i + 1))
    done

    echo ""
    read -p "Select deployment (1-${#deployments[@]}): " selection

    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt ${#deployments[@]} ]; then
        print_error "Invalid selection"
        return 1
    fi

    local selected_deployment="${deployments[$((selection - 1))]}"

    echo ""
    if ! list_available_backups "$selected_deployment"; then
        return 1
    fi

    read -p "Enter backup number or timestamp (or 'latest'): " backup_input

    local timestamp=""
    if [ "$backup_input" = "latest" ]; then
        timestamp=$(get_latest_backup "$selected_deployment")
    elif [[ "$backup_input" =~ ^[0-9]+$ ]]; then
        local backups=($(ls -1 "$BACKUP_ROOT/$selected_deployment" 2>/dev/null | grep -E '^[0-9]{8}-[0-9]{6}$' | sort -r))
        if [ "$backup_input" -ge 1 ] && [ "$backup_input" -le ${#backups[@]} ]; then
            timestamp="${backups[$((backup_input - 1))]}"
        fi
    else
        timestamp="$backup_input"
    fi

    if [ -z "$timestamp" ]; then
        print_error "Invalid backup selection"
        return 1
    fi

    echo ""
    restore_deployment "$selected_deployment" "$timestamp"
}

# Main script
main() {
    # Parse options first
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                print_header
                show_usage
                exit 0
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-pre-backup)
                SKIP_PRE_BACKUP=true
                shift
                ;;
            --yes)
                AUTO_YES=true
                shift
                ;;
            *)
                break
                ;;
        esac
    done

    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN MODE - No changes will be made"
        echo ""
    fi

    # If no arguments, run interactive mode
    if [ $# -eq 0 ]; then
        interactive_mode
        exit $?
    fi

    # Parse positional arguments
    local deployment=$1
    local timestamp=${2:-""}

    # Resolve 'latest' if specified
    if [ "$timestamp" = "latest" ]; then
        timestamp=$(get_latest_backup "$deployment")
        if [ -z "$timestamp" ]; then
            print_error "No backups found for deployment: $deployment"
            exit 1
        fi
        print_info "Using latest backup: $timestamp"
        echo ""
    fi

    # If no timestamp provided, show available backups
    if [ -z "$timestamp" ]; then
        echo ""
        list_available_backups "$deployment"
        echo ""
        read -p "Enter backup timestamp (or 'latest'): " timestamp

        if [ "$timestamp" = "latest" ]; then
            timestamp=$(get_latest_backup "$deployment")
        fi

        if [ -z "$timestamp" ]; then
            print_error "No backup specified"
            exit 1
        fi
    fi

    # Perform restore
    restore_deployment "$deployment" "$timestamp"
}

# Run main function
main "$@"
