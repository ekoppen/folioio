#!/bin/bash

# Automated Portfolio Backup Script
# Designed for scheduled execution (cron jobs)
# Usage: ./automated-backup.sh [options]

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/backup-automation.log"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-deployment.sh"
LIST_SCRIPT="$SCRIPT_DIR/list-backups.sh"
MAX_LOG_SIZE=$((10 * 1024 * 1024))  # 10MB

# Cleanup settings
AUTO_CLEANUP=true
CLEANUP_DAYS=30
MIN_BACKUPS_TO_KEEP=3

# Email notification (optional)
SEND_EMAIL=false
EMAIL_TO=""
EMAIL_FROM="backup@localhost"

# Exit codes
EXIT_SUCCESS=0
EXIT_PARTIAL_FAILURE=1
EXIT_TOTAL_FAILURE=2

# Functions
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")

    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO" "$@"
}

log_success() {
    log "SUCCESS" "$@"
}

log_error() {
    log "ERROR" "$@"
}

log_warning() {
    log "WARNING" "$@"
}

rotate_log() {
    if [ -f "$LOG_FILE" ]; then
        local log_size=$(stat -f%z "$LOG_FILE" 2>/dev/null || echo 0)

        if [ $log_size -gt $MAX_LOG_SIZE ]; then
            log_info "Rotating log file (size: $log_size bytes)"
            mv "$LOG_FILE" "$LOG_FILE.old"
            touch "$LOG_FILE"
        fi
    fi
}

send_email_notification() {
    local subject=$1
    local body=$2

    if [ "$SEND_EMAIL" = false ] || [ -z "$EMAIL_TO" ]; then
        return 0
    fi

    log_info "Sending email notification to: $EMAIL_TO"

    # Using mail command (requires mail to be configured)
    if command -v mail &> /dev/null; then
        echo "$body" | mail -s "$subject" "$EMAIL_TO"
        log_success "Email notification sent"
    else
        log_warning "mail command not available, skipping email"
    fi
}

backup_all_deployments() {
    log_info "Starting automated backup process"
    log_info "════════════════════════════════════════════════════"

    # Check if backup script exists
    if [ ! -x "$BACKUP_SCRIPT" ]; then
        log_error "Backup script not found or not executable: $BACKUP_SCRIPT"
        return $EXIT_TOTAL_FAILURE
    fi

    # Run backup for all deployments
    log_info "Executing: $BACKUP_SCRIPT --all"

    local start_time=$(date +%s)

    if $BACKUP_SCRIPT --all >> "$LOG_FILE" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        log_success "Backup completed successfully (${duration}s)"
        return $EXIT_SUCCESS
    else
        local exit_code=$?
        log_error "Backup failed with exit code: $exit_code"
        return $EXIT_PARTIAL_FAILURE
    fi
}

cleanup_old_backups() {
    if [ "$AUTO_CLEANUP" = false ]; then
        log_info "Auto-cleanup disabled, skipping"
        return 0
    fi

    log_info "Starting cleanup of backups older than $CLEANUP_DAYS days"

    # Check if list script exists
    if [ ! -x "$LIST_SCRIPT" ]; then
        log_warning "List script not found, skipping cleanup: $LIST_SCRIPT"
        return 0
    fi

    # Note: list-backups.sh cleanup requires interactive confirmation
    # For automated cleanup, we'll implement a simple version here

    local backup_root="deployment-backups"

    if [ ! -d "$backup_root" ]; then
        log_warning "Backup directory not found: $backup_root"
        return 0
    fi

    local deployments=($(ls -1 "$backup_root" 2>/dev/null | grep -v '\.env$'))
    local total_deleted=0

    for deployment in "${deployments[@]}"; do
        local backup_dir="$backup_root/$deployment"
        local backups=($(ls -1 "$backup_dir" 2>/dev/null | grep -E '^[0-9]{8}-[0-9]{6}$' | sort -r))

        if [ ${#backups[@]} -le $MIN_BACKUPS_TO_KEEP ]; then
            log_info "$deployment: Keeping all ${#backups[@]} backups (minimum: $MIN_BACKUPS_TO_KEEP)"
            continue
        fi

        local now_epoch=$(date +%s)
        local cutoff_epoch=$((now_epoch - (CLEANUP_DAYS * 86400)))
        local deleted=0
        local kept=0

        for backup in "${backups[@]}"; do
            # Convert timestamp to epoch
            local backup_date=$(echo "$backup" | sed 's/\([0-9]\{8\}\)-\([0-9]\{6\}\)/\1 \2/')
            local backup_epoch=$(date -j -f "%Y%m%d %H%M%S" "$backup_date" +%s 2>/dev/null || echo 0)

            # Check if older than cutoff and we have enough backups to keep
            if [ $backup_epoch -lt $cutoff_epoch ] && [ $kept -ge $MIN_BACKUPS_TO_KEEP ]; then
                log_info "$deployment: Deleting old backup: $backup"
                rm -rf "$backup_dir/$backup"
                deleted=$((deleted + 1))
                total_deleted=$((total_deleted + 1))
            else
                kept=$((kept + 1))
            fi
        done

        if [ $deleted -gt 0 ]; then
            log_success "$deployment: Deleted $deleted old backup(s), kept $kept"
        else
            log_info "$deployment: No old backups to delete"
        fi
    done

    if [ $total_deleted -gt 0 ]; then
        log_success "Cleanup completed: deleted $total_deleted backup(s) total"
    else
        log_info "Cleanup completed: no backups were old enough to delete"
    fi

    return 0
}

generate_summary() {
    local exit_code=$1

    log_info "════════════════════════════════════════════════════"
    log_info "Backup Summary"
    log_info "════════════════════════════════════════════════════"

    # Count backups
    local backup_root="deployment-backups"

    if [ -d "$backup_root" ]; then
        local deployments=($(ls -1 "$backup_root" 2>/dev/null | grep -v '\.env$'))
        local total_backups=0
        local total_size=0

        for deployment in "${deployments[@]}"; do
            local backup_count=$(ls -1 "$backup_root/$deployment" 2>/dev/null | grep -E '^[0-9]{8}-[0-9]{6}$' | wc -l | tr -d ' ')
            total_backups=$((total_backups + backup_count))

            log_info "$deployment: $backup_count backup(s)"
        done

        local grand_total_size=$(du -sh "$backup_root" 2>/dev/null | cut -f1 || echo "N/A")

        log_info "────────────────────────────────────────────────────"
        log_info "Total deployments: ${#deployments[@]}"
        log_info "Total backups: $total_backups"
        log_info "Total size: $grand_total_size"
    fi

    log_info "════════════════════════════════════════════════════"

    if [ $exit_code -eq $EXIT_SUCCESS ]; then
        log_success "Automated backup completed successfully"
    elif [ $exit_code -eq $EXIT_PARTIAL_FAILURE ]; then
        log_warning "Automated backup completed with some failures"
    else
        log_error "Automated backup failed"
    fi

    log_info "════════════════════════════════════════════════════"
}

show_usage() {
    cat << EOF
Automated Portfolio Backup Script
Designed for scheduled execution (cron jobs)

Usage: $0 [options]

Options:
  --no-cleanup       Disable automatic cleanup of old backups
  --cleanup-days N   Set cleanup threshold (default: $CLEANUP_DAYS days)
  --email TO         Send email notification to address
  --help             Show this help message

Configuration:
  Log file: $LOG_FILE
  Backup script: $BACKUP_SCRIPT
  Auto cleanup: $AUTO_CLEANUP
  Cleanup after: $CLEANUP_DAYS days
  Min backups kept: $MIN_BACKUPS_TO_KEEP

Cron Job Examples:

  # Daily backup at 2:00 AM
  0 2 * * * $SCRIPT_DIR/automated-backup.sh >> $LOG_FILE 2>&1

  # Daily backup with email notification
  0 2 * * * $SCRIPT_DIR/automated-backup.sh --email admin@example.com

  # Twice daily backup (2 AM and 2 PM)
  0 2,14 * * * $SCRIPT_DIR/automated-backup.sh

  # Weekly backup on Sunday at 3 AM
  0 3 * * 0 $SCRIPT_DIR/automated-backup.sh

  # Daily with custom cleanup (60 days)
  0 2 * * * $SCRIPT_DIR/automated-backup.sh --cleanup-days 60

Installation:
  1. Edit your crontab: crontab -e
  2. Add one of the examples above
  3. Save and exit
  4. Verify: crontab -l

EOF
}

# Main script
main() {
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-cleanup)
                AUTO_CLEANUP=false
                shift
                ;;
            --cleanup-days)
                CLEANUP_DAYS=$2
                shift 2
                ;;
            --email)
                SEND_EMAIL=true
                EMAIL_TO=$2
                shift 2
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Rotate log if needed
    rotate_log

    # Start
    log_info ""
    log_info "╔════════════════════════════════════════════════════╗"
    log_info "║   Automated Portfolio Backup System               ║"
    log_info "╚════════════════════════════════════════════════════╝"
    log_info ""

    local overall_exit_code=$EXIT_SUCCESS

    # Run backup
    if ! backup_all_deployments; then
        overall_exit_code=$EXIT_PARTIAL_FAILURE
    fi

    # Run cleanup
    if ! cleanup_old_backups; then
        log_warning "Cleanup had issues, but continuing"
    fi

    # Generate summary
    generate_summary $overall_exit_code

    # Send email notification if enabled
    if [ "$SEND_EMAIL" = true ]; then
        local subject=""
        local body=$(tail -100 "$LOG_FILE")

        if [ $overall_exit_code -eq $EXIT_SUCCESS ]; then
            subject="✅ Portfolio Backup Successful"
        else
            subject="⚠️ Portfolio Backup Completed with Issues"
        fi

        send_email_notification "$subject" "$body"
    fi

    exit $overall_exit_code
}

# Run main function
main "$@"
