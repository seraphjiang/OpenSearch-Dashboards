#!/bin/bash

# Script to scan opensearch-project repositories for changelog fragment systems
# Author: Claude Sonnet 4.5
# Date: 2026-03-20

OUTPUT_FILE="/Users/huanji/wss/osd/changelog_analysis_report.txt"
DETAILED_FILE="/Users/huanji/wss/osd/changelog_analysis_detailed.json"

echo "Starting repository scan for changelog fragment systems..."
echo "Fetching all repositories from opensearch-project organization..."

# Fetch all repositories
gh repo list opensearch-project --limit 1000 --json name,url,isArchived > /tmp/all_repos.json

# Count total repos
TOTAL_REPOS=$(jq 'length' /tmp/all_repos.json)
echo "Total repositories found: $TOTAL_REPOS"

# Filter out archived repos
jq '[.[] | select(.isArchived == false)]' /tmp/all_repos.json > /tmp/active_repos.json
ACTIVE_REPOS=$(jq 'length' /tmp/active_repos.json)
echo "Active (non-archived) repositories: $ACTIVE_REPOS"

# Initialize counters
HAS_FRAGMENTS=0
NO_FRAGMENTS=0

# Initialize arrays for results
echo "[]" > /tmp/repos_with_fragments.json
echo "[]" > /tmp/repos_without_fragments.json

# Process each active repository
echo ""
echo "Scanning repositories for changelog systems..."
echo "This may take a few minutes..."
echo ""

COUNTER=0
jq -r '.[] | @json' /tmp/active_repos.json | while read -r repo; do
    COUNTER=$((COUNTER + 1))
    REPO_NAME=$(echo "$repo" | jq -r '.name')
    REPO_URL=$(echo "$repo" | jq -r '.url')

    # Progress indicator
    if [ $((COUNTER % 10)) -eq 0 ]; then
        echo "Progress: $COUNTER/$ACTIVE_REPOS repositories scanned..."
    fi

    HAS_SYSTEM=false
    FOUND_IN=""

    # Check 1: changelogs/fragments/ directory (like OpenSearch-Dashboards)
    if gh api "repos/opensearch-project/$REPO_NAME/contents/changelogs/fragments" 2>/dev/null | jq -e 'type == "array"' >/dev/null 2>&1; then
        HAS_SYSTEM=true
        FOUND_IN="changelogs/fragments/"
    fi

    # Check 2: .changelog directory (alternative location)
    if [ "$HAS_SYSTEM" = false ]; then
        if gh api "repos/opensearch-project/$REPO_NAME/contents/.changelog" 2>/dev/null | jq -e 'type == "array"' >/dev/null 2>&1; then
            HAS_SYSTEM=true
            FOUND_IN=".changelog/"
        fi
    fi

    # Check 3: changelog/fragments directory (without 's')
    if [ "$HAS_SYSTEM" = false ]; then
        if gh api "repos/opensearch-project/$REPO_NAME/contents/changelog/fragments" 2>/dev/null | jq -e 'type == "array"' >/dev/null 2>&1; then
            HAS_SYSTEM=true
            FOUND_IN="changelog/fragments/"
        fi
    fi

    # Check 4: Look for changelog workflow files
    if [ "$HAS_SYSTEM" = false ]; then
        WORKFLOW_RESPONSE=$(gh api "repos/opensearch-project/$REPO_NAME/contents/.github/workflows" 2>/dev/null || echo "[]")
        if echo "$WORKFLOW_RESPONSE" | jq -e '[.[] | select(.name | test("changelog|fragment"; "i"))] | length > 0' >/dev/null 2>&1; then
            HAS_SYSTEM=true
            FOUND_IN=".github/workflows/*changelog*.yml"
        fi
    fi

    # Check 5: Look for changelog automation config files
    if [ "$HAS_SYSTEM" = false ]; then
        # Check for towncrier, scriv, or other changelog tools config
        for config_file in "pyproject.toml" ".towncrier.toml" "scriv.ini" ".scriv.ini" "changelog.d" ".github/changelog.yml"; do
            if gh api "repos/opensearch-project/$REPO_NAME/contents/$config_file" 2>/dev/null | jq -e '.type == "file"' >/dev/null 2>&1; then
                HAS_SYSTEM=true
                FOUND_IN="$config_file (changelog tool config)"
                break
            fi
        done
    fi

    # Store results
    if [ "$HAS_SYSTEM" = true ]; then
        HAS_FRAGMENTS=$((HAS_FRAGMENTS + 1))
        RESULT=$(jq -n \
            --arg name "$REPO_NAME" \
            --arg url "$REPO_URL" \
            --arg location "$FOUND_IN" \
            '{name: $name, url: $url, changelog_location: $location}')
        jq --argjson obj "$RESULT" '. += [$obj]' /tmp/repos_with_fragments.json > /tmp/temp.json && mv /tmp/temp.json /tmp/repos_with_fragments.json
    else
        NO_FRAGMENTS=$((NO_FRAGMENTS + 1))
        RESULT=$(jq -n \
            --arg name "$REPO_NAME" \
            --arg url "$REPO_URL" \
            '{name: $name, url: $url}')
        jq --argjson obj "$RESULT" '. += [$obj]' /tmp/repos_without_fragments.json > /tmp/temp.json && mv /tmp/temp.json /tmp/repos_without_fragments.json
    fi
done

# Wait for background process to finish and recalculate counters
sleep 2
HAS_FRAGMENTS=$(jq 'length' /tmp/repos_with_fragments.json)
NO_FRAGMENTS=$(jq 'length' /tmp/repos_without_fragments.json)

# Calculate percentage
if [ "$ACTIVE_REPOS" -gt 0 ]; then
    PERCENTAGE=$(awk "BEGIN {printf \"%.2f\", ($HAS_FRAGMENTS / $ACTIVE_REPOS) * 100}")
else
    PERCENTAGE="0.00"
fi

echo ""
echo "Scan complete! Generating report..."

# Generate detailed JSON report
jq -n \
    --arg scan_date "2026-03-20" \
    --argjson total_repos "$TOTAL_REPOS" \
    --argjson active_repos "$ACTIVE_REPOS" \
    --argjson has_fragments "$HAS_FRAGMENTS" \
    --argjson no_fragments "$NO_FRAGMENTS" \
    --arg percentage "$PERCENTAGE%" \
    --argjson repos_with "$(cat /tmp/repos_with_fragments.json)" \
    --argjson repos_without "$(cat /tmp/repos_without_fragments.json)" \
    '{
        scan_date: $scan_date,
        summary: {
            total_repositories: $total_repos,
            active_repositories: $active_repos,
            repositories_with_changelog_fragments: $has_fragments,
            repositories_without_changelog_fragments: $no_fragments,
            percentage_with_fragments: $percentage
        },
        repositories_with_changelog_system: $repos_with,
        repositories_without_changelog_system: $repos_without
    }' > "$DETAILED_FILE"

# Generate human-readable report
cat > "$OUTPUT_FILE" << EOF
================================================================================
CHANGELOG FRAGMENT SYSTEM ANALYSIS REPORT
OpenSearch Project Organization
================================================================================

Scan Date: 2026-03-20
Organization: opensearch-project

================================================================================
SUMMARY STATISTICS
================================================================================

Total Repositories Scanned:        $TOTAL_REPOS
Active Repositories (non-archived): $ACTIVE_REPOS
Repositories WITH Changelog Fragments: $HAS_FRAGMENTS
Repositories WITHOUT Changelog Fragments: $NO_FRAGMENTS
Percentage with Changelog System:  $PERCENTAGE%

================================================================================
REPOSITORIES WITH CHANGELOG FRAGMENT SYSTEMS ($HAS_FRAGMENTS repos)
================================================================================

EOF

# Add repos with fragments to report
jq -r '.[] | "\(.name)\n  URL: \(.url)\n  Location: \(.changelog_location)\n"' /tmp/repos_with_fragments.json >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << EOF

================================================================================
REPOSITORIES WITHOUT CHANGELOG FRAGMENT SYSTEMS ($NO_FRAGMENTS repos)
================================================================================

EOF

# Add repos without fragments to report
jq -r '.[] | "\(.name)\n  URL: \(.url)\n"' /tmp/repos_without_fragments.json >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << EOF

================================================================================
ANALYSIS NOTES
================================================================================

This scan checked for the following changelog automation patterns:
1. changelogs/fragments/ directory (OpenSearch-Dashboards style)
2. .changelog/ directory
3. changelog/fragments/ directory (without 's')
4. GitHub workflow files with 'changelog' or 'fragment' in the name
5. Configuration files for changelog tools (towncrier, scriv, etc.)

Repositories marked as "archived" were excluded from the analysis.

================================================================================
RECOMMENDATIONS
================================================================================

Based on this analysis:
- Only $PERCENTAGE% of active repositories use changelog fragment systems
- Consider standardizing changelog practices across all repositories
- Repositories without fragment systems may benefit from adopting this approach
- This improves release notes generation and change tracking

================================================================================
END OF REPORT
================================================================================
EOF

echo ""
echo "Report generation complete!"
echo ""
echo "Files created:"
echo "  - Detailed JSON: $DETAILED_FILE"
echo "  - Human-readable report: $OUTPUT_FILE"
echo ""
echo "Summary:"
echo "  Total repos: $TOTAL_REPOS"
echo "  Active repos: $ACTIVE_REPOS"
echo "  With changelog system: $HAS_FRAGMENTS ($PERCENTAGE%)"
echo "  Without changelog system: $NO_FRAGMENTS"
