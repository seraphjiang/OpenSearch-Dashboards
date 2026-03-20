#!/bin/bash
# Helper script to start Claude agents in tmux splits with AWS credential checks

AGENT_NAME=$1
AGENT_PROMPT=$2
TEAM_NAME=$3

# Check and export AWS credentials if not present
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "⚠️  AWS credentials not found, attempting to inherit from parent shell..."
    # Try to get from parent tmux pane environment
    eval $(tmux show-environment -s | grep AWS_)
fi

# Verify credentials are now set
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "❌ AWS_ACCESS_KEY_ID not set. Please export AWS credentials."
    exit 1
fi

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ AWS_SECRET_ACCESS_KEY not set. Please export AWS credentials."
    exit 1
fi

echo "✅ AWS credentials verified"
echo "Starting agent: $AGENT_NAME"
echo "Team: $TEAM_NAME"

# Start the claude agent
claude agent spawn --name "$AGENT_NAME" --team "$TEAM_NAME" --prompt "$AGENT_PROMPT"
