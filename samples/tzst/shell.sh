#!/usr/bin/env bash
# Advanced Bash: arrays, functions, process substitution, traps.

set -euo pipefail
shopt -s nullglob globstar extglob

# Constants and configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="/var/log/app.log"
readonly MAX_RETRIES=3
readonly TIMEOUT_SECONDS=30

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    local level="${1:-INFO}"
    shift
    local message="$*"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE" >&2
}

info()  { log "INFO" "$@"; }
warn()  { log "WARN" "${YELLOW}$*${NC}"; }
error() { log "ERROR" "${RED}$*${NC}"; }
fatal() { log "FATAL" "${RED}$*${NC}"; exit 1; }

# Associative arrays
declare -A CONFIG=(
    [host]="localhost"
    [port]="8080"
    [user]="${USER:-guest}"
    [timeout]="30"
)

declare -A COUNTERS=()

# Indexed arrays
declare -a FILES=()
declare -a DIRS=()

# Trap for cleanup
cleanup() {
    local exit_code=$?
    info "Cleaning up... (exit code: $exit_code)"
    [[ -f "$TEMP_FILE" ]] && rm -f "$TEMP_FILE"
    [[ -n "$PID_FILE" ]] && rm -f "$PID_FILE"
    exit $exit_code
}

trap cleanup EXIT INT TERM

# Temporary file with automatic cleanup
TEMP_FILE="$(mktemp)"
PID_FILE=""

# Process substitution and pipes
analyze_logs() {
    local pattern="${1:-ERROR}"
    local since="${2:-1 hour ago}"
    
    # Process substitution with grep and awk
    grep -E "$pattern" <(
        find /var/log -type f -name "*.log" -exec cat {} + 2>/dev/null
    ) | awk '
        /ERROR/ { errors++ }
        /WARN/ { warns++ }
        END {
            printf "Errors: %d, Warnings: %d\n", errors+0, warns+0
        }
    '
}

# Parallel processing with xargs
process_files_parallel() {
    local jobs="${1:-4}"
    local pattern="${2:-*.ts}"
    
    find . -type f -name "$pattern" -print0 |
        xargs -0 -P "$jobs" -I {} bash -c '
            file="{}"
            echo "Processing: $file"
            # Add your processing logic here
        '
}

# Here-documents and here-strings
generate_config() {
    local env="${1:-development}"
    
    cat <<-EOF
		# Generated configuration
		environment: ${env}
		host: ${CONFIG[host]}
		port: ${CONFIG[port]}
		features:
		  - logging
		  - metrics
		  - tracing
	EOF
}

# Function with named arguments using a hash
parse_args() {
    declare -gA ARGS=()
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --*=*)
                local key="${1#--}"
                local value="${key#*=}"
                key="${key%%=*}"
                ARGS["$key"]="$value"
                shift
                ;;
            --*)
                local key="${1#--}"
                if [[ -n "${2:-}" ]] && [[ ! "$2" =~ ^- ]]; then
                    ARGS["$key"]="$2"
                    shift 2
                else
                    ARGS["$key"]="true"
                    shift
                fi
                ;;
            -*)
                local flags="${1#-}"
                while [[ -n "$flags" ]]; do
                    local flag="${flags:0:1}"
                    ARGS["$flag"]="true"
                    flags="${flags:1}"
                done
                shift
                ;;
            *)
                ARGS["_args"]+="${ARGS[_args]:+ }$1"
                shift
                ;;
        esac
    done
}

# Retry logic with exponential backoff
retry() {
    local max_attempts="${1:-$MAX_RETRIES}"
    local delay="${2:-1}"
    local multiplier="${3:-2}"
    shift 3
    
    local attempt=1
    local current_delay="$delay"
    
    while [[ $attempt -le $max_attempts ]]; do
        info "Attempt $attempt/$max_attempts: $*"
        if "$@"; then
            return 0
        fi
        
        if [[ $attempt -lt $max_attempts ]]; then
            warn "Failed, retrying in ${current_delay}s..."
            sleep "$current_delay"
            current_delay=$((current_delay * multiplier))
        fi
        
        ((attempt++))
    done
    
    error "All $max_attempts attempts failed"
    return 1
}

# Timeout wrapper
with_timeout() {
    local timeout="${1:-$TIMEOUT_SECONDS}"
    shift
    
    local pid
    "$@" &
    pid=$!
    
    (
        sleep "$timeout"
        if kill -0 "$pid" 2>/dev/null; then
            warn "Process $pid timed out after ${timeout}s"
            kill -TERM "$pid" 2>/dev/null
            sleep 1
            kill -KILL "$pid" 2>/dev/null
        fi
    ) &
    local watchdog=$!
    
    wait "$pid" 2>/dev/null
    local exit_code=$?
    kill "$watchdog" 2>/dev/null
    wait "$watchdog" 2>/dev/null
    
    return $exit_code
}

# Case pattern matching
handle_file() {
    local file="$1" 
    
    case "$file" in
        *.ts|*.tsx)
            info "TypeScript: $file"
            npx tsc --noEmit "$file"
            ;;
        *.js|*.mjs|*.cjs)
            info "JavaScript: $file"
            node --check "$file"
            ;;
        *.py)
            info "Python: $file"
            python3 -m py_compile "$file"
            ;;
        *.go)
            info "Go: $file"
            go fmt "$file"
            ;;
        *.rs)
            info "Rust: $file"
            rustfmt --check "$file"
            ;;
        *)
            warn "Unknown file type: $file"
            ;;
    esac
}

# Extended pattern matching
filter_files() {
    local dir="${1:-.}"
    
    # Match files with specific patterns
    for file in "$dir"/**/*.@(ts|tsx|js|jsx); do
        [[ -f "$file" ]] || continue
        echo "$file"
    done
    
    # Exclude patterns
    for file in "$dir"/**/!(node_modules|dist|build)/*.ts; do
        [[ -f "$file" ]] || continue
        echo "$file"
    done
}

# Signal handling
handle_signal() {
    local sig="${1:-UNKNOWN}"
    warn "Received signal: $sig"
    cleanup
}

trap 'handle_signal INT' INT
trap 'handle_signal TERM' TERM

# Subshell isolation
run_isolated() {
    (
        set -e
        cd "${1:-.}" || exit 1
        shift
        
        # Run in isolated environment
        env -i PATH="$PATH" HOME="$HOME" "$@"
    )
}

# Network operations with curl
fetch_json() {
    local url="$1"
    local method="${2:-GET}"
    
    curl -sSf \
        -X "$method" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${API_TOKEN:-}" \
        "$url" | jq .
}

# Main entry point
main() {
    parse_args "$@"
    
    info "Starting with args: ${!ARGS[@]}"
    info "Config: host=${CONFIG[host]}, port=${CONFIG[port]}"
    
    # Example: process all TypeScript files
    while IFS= read -r -d '' file; do
        handle_file "$file"
    done < <(find . -type f -name "*.ts" -print0)
    
    info "Done"
}

# Run main if not sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
