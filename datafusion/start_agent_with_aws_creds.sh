#!/bin/bash

# Script to start Claude agent in tmux with AWS credentials inherited
# Usage: ./start-agent-with-aws-creds.sh <agent_name> <task_description>

AGENT_NAME="${1:-osd-agent}"
TASK_DESC="${2:-OSD development task}"

# Check if running in tmux
if [ -z "$TMUX" ]; then
    echo "Not running in tmux. Starting new tmux session..."
    tmux new-session -d -s osd-dev-team
    tmux select-window -t osd-dev-team:0
fi

# Function to check AWS credentials
check_aws_creds() {
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        echo "✓ AWS credentials found"
        return 0
    else
        echo "✗ AWS credentials not found"
        return 1
    fi
}

# Export AWS credentials if they exist in parent shell
export_aws_creds() {
    # Try to get from parent environment
    if [ -f ~/.aws/credentials ]; then
        echo "Loading AWS credentials from ~/.aws/credentials"
        export AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id)
        export AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)
        export AWS_SESSION_TOKEN=$(aws configure get aws_session_token)
        export AWS_DEFAULT_REGION=$(aws configure get region)
    fi
}

# Check current credentials
echo "Checking AWS credentials..."
if ! check_aws_creds; then
    echo "Attempting to load AWS credentials..."
    export_aws_creds
    if check_aws_creds; then
        echo "✓ AWS credentials loaded successfully"
    else
        echo "⚠ Warning: Could not load AWS credentials"
        echo "Please ensure AWS credentials are configured"
    fi
fi

# Create new tmux split and start agent
echo "Creating tmux split for agent: $AGENT_NAME"
tmux split-window -h -t osd-dev-team

# Send AWS credential exports to new pane
tmux send-keys -t osd-dev-team "export AWS_ACCESS_KEY_ID='$AWS_ACCESS_KEY_ID'" C-m
tmux send-keys -t osd-dev-team "export AWS_SECRET_ACCESS_KEY='$AWS_SECRET_ACCESS_KEY'" C-m
[ -n "$AWS_SESSION_TOKEN" ] && tmux send-keys -t osd-dev-team "export AWS_SESSION_TOKEN='$AWS_SESSION_TOKEN'" C-m
[ -n "$AWS_DEFAULT_REGION" ] && tmux send-keys -t osd-dev-team "export AWS_DEFAULT_REGION='$AWS_DEFAULT_REGION'" C-m

# Change to OSD directory
tmux send-keys -t osd-dev-team "cd /Users/huanji/wss/osd" C-m

# Verify credentials in new pane
tmux send-keys -t osd-dev-team "echo 'AWS Credentials Status:'" C-m
tmux send-keys -t osd-dev-team "[ -n \"\$AWS_ACCESS_KEY_ID\" ] && echo '✓ AWS_ACCESS_KEY_ID set' || echo '✗ AWS_ACCESS_KEY_ID missing'" C-m

echo "✓ Tmux split created for $AGENT_NAME"
echo "To attach: tmux attach -t osd-dev-team"
