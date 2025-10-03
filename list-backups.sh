#!/bin/bash

# Portfolio Backup Management Script
# Lists, verifies, and manages deployment backups
# Usage: ./list-backups.sh [deployment-name] [options]

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKUP_ROOT="deployment-backups"
MIN_BACKUPS_TO_KEEP=3

# Options
VERIFY_MODE=false
CLEANUP_MODE=false
CLEANUP_DAYS=30
SHOW_DETAILS=false

# Functions
print_header() {
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}  📊 Portfolio Backup Management${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
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
  deployment-name    Name of deployment to show backups for
                     Omit to show all deployments

Options:
  --verify           Verify backup integrity (check checksums)
  --cleanup DAYS     Remove backups older than DAYS (default: 30)
                     Always keeps minimum of $MIN_BACKUPS_TO_KEEP backups
  --details          Show detailed backup information
  -h, --help         Show this help message

Examples:
  $0                       # List all backups
  $0 folioio               # List backups for folioio
  $0 --verify              # Verify all backups
  $0 folioio --verify      # Verify folioio backups
  $0 --cleanup 30          # Remove backups older than 30 days
  $0 folioio --details     # Show detailed info for folioio

Backup location: $BACKUP_ROOT/
EOF
}

format_age() {
    local timestamp=$1
    # Convert timestamp to epoch
    local backup_date=$(echo "$timestamp" | sed 's/\([0-9]\{8\}\)-\([0-9]\{6\}\)/\1 \2/')
    local backup_epoch=$(date -j -f "%Y%m%d %H%M%S" "$backup_date" +%s 2>/dev/null || echo 0)
    local now_epoch=$(date +%s)
    local age_seconds=$((now_epoch - backup_epoch))
    local age_days=$((age_seconds / 86400))
    local age_hours=$(( (age_seconds % 86400) / 3600))

    if [ $age_days -gt 0 ]; then
        echo "${age_days}d ${age_hours}h ago"
    elif [ $age_hours -gt 0 ]; then
        echo "${age_hours}h ago"
    else
        echo "< 1h ago"
    fi
}

format_timestamp() {
    local timestamp=$1
    local year=${timestamp:0:4}
    local month=${timestamp:4:2}
    local day=${timestamp:6:2}
    local hour=${timestamp:9:2}
    local minute=${timestamp:11:2}
    local second=${timestamp:13:2}

    echo "$year-$month-$day $hour:$minute:$second"
}

verify_backup() {
    local backup_path=$1
    local errors=0

    # Check required files/directories
    if [ ! -d "$backup_path/data" ] && [ ! -f "$backup_path/database.sql" ]; then
        print_error "Missing data directory and SQL dump"
        return 1
    fi

    # Check data directory integrity
    if [ -d "$backup_path/data" ]; then
        local postgres_files=$(find "$backup_path/data/postgres" -type f 2>/dev/null | wc -l | tr -d ' ')
        local minio_files=$(find "$backup_path/data/minio" -type f 2>/dev/null | wc -l | tr -d ' ')

        if [ "$postgres_files" -eq 0 ]; then
            print_warning "No PostgreSQL files found"
            errors=$((errors + 1))
        fi

        # MinIO files are optional
    fi

    # Check metadata
    if [ -f "$backup_path/backup.meta" ]; then
        # Verify metadata is readable
        if ! grep -q "backup_timestamp=" "$backup_path/backup.meta" 2>/dev/null; then
            print_warning "Metadata file is corrupted"
            errors=$((errors + 1))
        fi
    else
        print_warning "No metadata file found"
        errors=$((errors + 1))
    fi

    if [ $errors -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

list_backup_details() {
    local deployment=$1
    local timestamp=$2
    local backup_path="$BACKUP_ROOT/$deployment/$timestamp"

    echo -e "${CYAN}───────────────────────────────────────────────────${NC}"
    echo -e "${CYAN}📦 Backup: $timestamp${NC}"
    echo -e "${CYAN}───────────────────────────────────────────────────${NC}"

    # Basic info
    local formatted_date=$(format_timestamp "$timestamp")
    local age=$(format_age "$timestamp")
    local total_size=$(du -sh "$backup_path" 2>/dev/null | cut -f1 || echo "N/A")

    echo "📅 Date: $formatted_date ($age)"
    echo "📊 Size: $total_size"
    echo "📁 Path: $backup_path"

    # Data breakdown
    if [ -d "$backup_path/data/postgres" ]; then
        local pg_size=$(du -sh "$backup_path/data/postgres" 2>/dev/null | cut -f1 || echo "N/A")
        local pg_files=$(find "$backup_path/data/postgres" -type f 2>/dev/null | wc -l | tr -d ' ')
        echo "   🗄️  PostgreSQL: $pg_size ($pg_files files)"
    fi

    if [ -d "$backup_path/data/minio" ]; then
        local minio_size=$(du -sh "$backup_path/data/minio" 2>/dev/null | cut -f1 || echo "N/A")
        local minio_files=$(find "$backup_path/data/minio" -type f 2>/dev/null | wc -l | tr -d ' ')
        echo "   📦 MinIO: $minio_size ($minio_files files)"
    fi

    if [ -f "$backup_path/database.sql" ]; then
        local sql_size=$(du -sh "$backup_path/database.sql" 2>/dev/null | cut -f1 || echo "N/A")
        echo "   💾 SQL dump: $sql_size"
    fi

    # Configuration files
    local configs=""
    [ -f "$backup_path/.env" ] && configs="${configs}.env "
    [ -f "$backup_path/docker-compose.yml" ] && configs="${configs}docker-compose.yml "
    if [ -n "$configs" ]; then
        echo "   ⚙️  Config: $configs"
    fi

    # Metadata
    if [ -f "$backup_path/backup.meta" ]; then
        echo "   ℹ️  Metadata: Available"

        if [ "$SHOW_DETAILS" = true ]; then
            echo ""
            echo "   📋 Metadata Details:"
            grep -E "backup_date=|deployment_status=|quick_mode=|compressed=" "$backup_path/backup.meta" 2>/dev/null | sed 's/^/      /'
        fi
    fi

    # Verification
    if [ "$VERIFY_MODE" = true ]; then
        echo -n "   🔍 Integrity: "
        if verify_backup "$backup_path"; then
            echo -e "${GREEN}✅ OK${NC}"
        else
            echo -e "${RED}❌ Issues found${NC}"
        fi
    fi

    echo ""
}

list_deployment_backups() {
    local deployment=$1
    local backup_dir="$BACKUP_ROOT/$deployment"

    if [ ! -d "$backup_dir" ]; then
        print_error "No backups found for: $deployment"
        return 1
    fi

    local backups=($(ls -1 "$backup_dir" 2>/dev/null | grep -E '^[0-9]{8}-[0-9]{6}$' | sort -r))

    if [ ${#backups[@]} -eq 0 ]; then
        print_error "No valid backups found for: $deployment"
        return 1
    fi

    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📦 Deployment: $deployment${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}Found ${#backups[@]} backup(s)${NC}"
    echo ""

    local total_size=0
    for backup in "${backups[@]}"; do
        if [ "$SHOW_DETAILS" = true ]; then
            list_backup_details "$deployment" "$backup"
        else
            local backup_path="$backup_dir/$backup"
            local formatted_date=$(format_timestamp "$backup")
            local age=$(format_age "$backup")
            local size=$(du -sh "$backup_path" 2>/dev/null | cut -f1 || echo "N/A")

            echo -e "${CYAN}🕒 $backup${NC}"
            echo "   📅 $formatted_date ($age)"
            echo "   📊 $size"

            if [ "$VERIFY_MODE" = true ]; then
                echo -n "   🔍 "
                if verify_backup "$backup_path"; then
                    echo -e "${GREEN}✅ Verified${NC}"
                else
                    echo -e "${RED}❌ Issues found${NC}"
                fi
            fi

            echo ""
        fi
    done

    # Summary
    local total_size=$(du -sh "$backup_dir" 2>/dev/null | cut -f1 || echo "N/A")
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📊 Total: ${#backups[@]} backup(s), $total_size${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    return 0
}

list_all_backups() {
    if [ ! -d "$BACKUP_ROOT" ]; then
        print_error "Backup directory not found: $BACKUP_ROOT"
        print_info "Create backups first with: ./backup-deployment.sh"
        return 1
    fi

    local deployments=($(ls -1 "$BACKUP_ROOT" 2>/dev/null | grep -v '\.env$'))

    if [ ${#deployments[@]} -eq 0 ]; then
        print_error "No deployment backups found"
        print_info "Create backups first with: ./backup-deployment.sh"
        return 1
    fi

    for deployment in "${deployments[@]}"; do
        list_deployment_backups "$deployment"
    done

    # Grand total
    local grand_total_size=$(du -sh "$BACKUP_ROOT" 2>/dev/null | cut -f1 || echo "N/A")
    local total_backups=0

    for deployment in "${deployments[@]}"; do
        local backup_count=$(ls -1 "$BACKUP_ROOT/$deployment" 2>/dev/null | grep -E '^[0-9]{8}-[0-9]{6}$' | wc -l | tr -d ' ')
        total_backups=$((total_backups + backup_count))
    done

    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}📊 Grand Total${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "📦 Deployments: ${#deployments[@]}"
    echo "🗄️  Total backups: $total_backups"
    echo "💾 Total size: $grand_total_size"
    echo ""

    return 0
}

cleanup_old_backups() {
    local deployment=$1
    local days=$2
    local backup_dir="$BACKUP_ROOT/$deployment"

    if [ ! -d "$backup_dir" ]; then
        print_error "No backups found for: $deployment"
        return 1
    fi

    local backups=($(ls -1 "$backup_dir" 2>/dev/null | grep -E '^[0-9]{8}-[0-9]{6}$' | sort -r))

    if [ ${#backups[@]} -eq 0 ]; then
        print_info "No backups to clean up for: $deployment"
        return 0
    fi

    local now_epoch=$(date +%s)
    local cutoff_epoch=$((now_epoch - (days * 86400)))

    local to_delete=()
    local to_keep=()

    for backup in "${backups[@]}"; do
        local backup_date=$(echo "$backup" | sed 's/\([0-9]\{8\}\)-\([0-9]\{6\}\)/\1 \2/')
        local backup_epoch=$(date -j -f "%Y%m%d %H%M%S" "$backup_date" +%s 2>/dev/null || echo 0)

        if [ $backup_epoch -lt $cutoff_epoch ]; then
            to_delete+=("$backup")
        else
            to_keep+=("$backup")
        fi
    done

    # Always keep minimum number of backups
    local keep_count=${#to_keep[@]}
    if [ $keep_count -lt $MIN_BACKUPS_TO_KEEP ]; then
        local need_more=$((MIN_BACKUPS_TO_KEEP - keep_count))
        print_info "Keeping minimum $MIN_BACKUPS_TO_KEEP backups"

        # Move newest from to_delete to to_keep
        for ((i=0; i<need_more && i<${#to_delete[@]}; i++)); do
            to_keep+=("${to_delete[$i]}")
        done

        # Remove moved items from to_delete
        to_delete=("${to_delete[@]:$need_more}")
    fi

    if [ ${#to_delete[@]} -eq 0 ]; then
        print_info "No backups older than $days days for: $deployment"
        return 0
    fi

    # Show what will be deleted
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  Cleanup Preview: $deployment${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Backups to delete (older than $days days):"
    echo ""

    local delete_size=0
    for backup in "${to_delete[@]}"; do
        local age=$(format_age "$backup")
        local size=$(du -sh "$backup_dir/$backup" 2>/dev/null | cut -f1 || echo "N/A")
        echo -e "${RED}  ❌ $backup${NC} - $age - $size"
    done

    echo ""
    echo "Backups to keep:"
    echo ""

    for backup in "${to_keep[@]}"; do
        local age=$(format_age "$backup")
        local size=$(du -sh "$backup_dir/$backup" 2>/dev/null | cut -f1 || echo "N/A")
        echo -e "${GREEN}  ✅ $backup${NC} - $age - $size"
    done

    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "Will delete: ${#to_delete[@]} backup(s)"
    echo "Will keep: ${#to_keep[@]} backup(s)"
    echo ""

    # Confirm deletion
    read -p "$(echo -e ${YELLOW}⚠️  Proceed with cleanup? [y/N]: ${NC})" -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleanup cancelled"
        return 0
    fi

    # Delete old backups
    local deleted=0
    for backup in "${to_delete[@]}"; do
        rm -rf "$backup_dir/$backup"
        deleted=$((deleted + 1))
        print_success "Deleted: $backup"
    done

    echo ""
    print_success "Cleanup completed: deleted $deleted backup(s)"
    echo ""

    return 0
}

cleanup_all_old_backups() {
    local days=$1

    if [ ! -d "$BACKUP_ROOT" ]; then
        print_error "Backup directory not found: $BACKUP_ROOT"
        return 1
    fi

    local deployments=($(ls -1 "$BACKUP_ROOT" 2>/dev/null | grep -v '\.env$'))

    if [ ${#deployments[@]} -eq 0 ]; then
        print_error "No deployment backups found"
        return 1
    fi

    for deployment in "${deployments[@]}"; do
        cleanup_old_backups "$deployment" "$days"
    done

    return 0
}

# Main script
main() {
    # Parse options
    DEPLOYMENT=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                print_header
                show_usage
                exit 0
                ;;
            --verify)
                VERIFY_MODE=true
                shift
                ;;
            --cleanup)
                CLEANUP_MODE=true
                CLEANUP_DAYS=${2:-30}
                shift 2
                ;;
            --details)
                SHOW_DETAILS=true
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

    print_header

    # Handle cleanup mode
    if [ "$CLEANUP_MODE" = true ]; then
        if [ -n "$DEPLOYMENT" ]; then
            cleanup_old_backups "$DEPLOYMENT" "$CLEANUP_DAYS"
        else
            cleanup_all_old_backups "$CLEANUP_DAYS"
        fi
        exit $?
    fi

    # List backups
    if [ -n "$DEPLOYMENT" ]; then
        list_deployment_backups "$DEPLOYMENT"
    else
        list_all_backups
    fi
}

# Run main function
main "$@"
