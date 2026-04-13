#!/usr/bin/env python3
"""
Script to scan opensearch-project repositories for changelog fragment systems
Author: Claude Sonnet 4.5
Date: 2026-03-20
"""

import json
import subprocess
import sys
from typing import Dict, List, Tuple

def run_gh_api(endpoint: str) -> Tuple[bool, any]:
    """Run gh api command and return success status and parsed JSON"""
    try:
        result = subprocess.run(
            ['gh', 'api', endpoint],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            try:
                return True, json.loads(result.stdout)
            except json.JSONDecodeError:
                return False, None
        return False, None
    except (subprocess.TimeoutExpired, Exception):
        return False, None

def check_repo_for_changelog_system(repo_name: str) -> Tuple[bool, str]:
    """
    Check if a repository has a changelog fragment system
    Returns: (has_system: bool, location: str)
    """

    # Check 1: changelogs/fragments/ directory (OpenSearch-Dashboards style)
    success, data = run_gh_api(f"repos/opensearch-project/{repo_name}/contents/changelogs/fragments")
    if success and isinstance(data, list):
        return True, "changelogs/fragments/"

    # Check 2: .changelog directory
    success, data = run_gh_api(f"repos/opensearch-project/{repo_name}/contents/.changelog")
    if success and isinstance(data, list):
        return True, ".changelog/"

    # Check 3: changelog/fragments directory (without 's')
    success, data = run_gh_api(f"repos/opensearch-project/{repo_name}/contents/changelog/fragments")
    if success and isinstance(data, list):
        return True, "changelog/fragments/"

    # Check 4: Look for changelog workflow files
    success, data = run_gh_api(f"repos/opensearch-project/{repo_name}/contents/.github/workflows")
    if success and isinstance(data, list):
        for file in data:
            if 'changelog' in file.get('name', '').lower() or 'fragment' in file.get('name', '').lower():
                return True, f".github/workflows/{file['name']}"

    # Check 5: Look for changelog automation config files
    config_files = [
        "pyproject.toml",
        ".towncrier.toml",
        "scriv.ini",
        ".scriv.ini",
        ".github/changelog.yml",
        "changelog.d"
    ]

    for config_file in config_files:
        success, data = run_gh_api(f"repos/opensearch-project/{repo_name}/contents/{config_file}")
        if success and isinstance(data, dict) and data.get('type') == 'file':
            return True, f"{config_file} (changelog tool config)"

    return False, ""

def main():
    print("Starting repository scan for changelog fragment systems...")
    print("=" * 80)

    # Fetch all repositories
    print("\nFetching repositories from opensearch-project organization...")
    result = subprocess.run(
        ['gh', 'repo', 'list', 'opensearch-project', '--limit', '1000',
         '--json', 'name,url,isArchived'],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"Error fetching repositories: {result.stderr}")
        sys.exit(1)

    all_repos = json.loads(result.stdout)
    total_repos = len(all_repos)

    # Filter active repos
    active_repos = [r for r in all_repos if not r['isArchived']]
    active_count = len(active_repos)

    print(f"Total repositories: {total_repos}")
    print(f"Active repositories: {active_count}")
    print(f"Archived repositories: {total_repos - active_count}")

    # Scan each repository
    repos_with_system = []
    repos_without_system = []

    print("\nScanning repositories for changelog systems...")
    print("This may take several minutes...")
    print("-" * 80)

    for idx, repo in enumerate(active_repos, 1):
        repo_name = repo['name']
        repo_url = repo['url']

        # Progress indicator
        if idx % 10 == 0 or idx == active_count:
            print(f"Progress: {idx}/{active_count} repositories scanned...")

        has_system, location = check_repo_for_changelog_system(repo_name)

        if has_system:
            repos_with_system.append({
                'name': repo_name,
                'url': repo_url,
                'changelog_location': location
            })
        else:
            repos_without_system.append({
                'name': repo_name,
                'url': repo_url
            })

    # Calculate statistics
    has_count = len(repos_with_system)
    no_count = len(repos_without_system)
    percentage = (has_count / active_count * 100) if active_count > 0 else 0

    print("\n" + "=" * 80)
    print("SCAN COMPLETE!")
    print("=" * 80)

    # Generate detailed JSON report
    detailed_report = {
        'scan_date': '2026-03-20',
        'summary': {
            'total_repositories': total_repos,
            'active_repositories': active_count,
            'repositories_with_changelog_fragments': has_count,
            'repositories_without_changelog_fragments': no_count,
            'percentage_with_fragments': f"{percentage:.2f}%"
        },
        'repositories_with_changelog_system': repos_with_system,
        'repositories_without_changelog_system': repos_without_system
    }

    with open('/Users/huanji/wss/osd/changelog_analysis_detailed.json', 'w') as f:
        json.dump(detailed_report, f, indent=2)

    # Generate human-readable report
    report_lines = [
        "=" * 80,
        "CHANGELOG FRAGMENT SYSTEM ANALYSIS REPORT",
        "OpenSearch Project Organization",
        "=" * 80,
        "",
        "Scan Date: 2026-03-20",
        "Organization: opensearch-project",
        "",
        "=" * 80,
        "SUMMARY STATISTICS",
        "=" * 80,
        "",
        f"Total Repositories Scanned:              {total_repos}",
        f"Active Repositories (non-archived):      {active_count}",
        f"Repositories WITH Changelog Fragments:   {has_count}",
        f"Repositories WITHOUT Changelog Fragments: {no_count}",
        f"Percentage with Changelog System:        {percentage:.2f}%",
        "",
        "=" * 80,
        f"REPOSITORIES WITH CHANGELOG FRAGMENT SYSTEMS ({has_count} repos)",
        "=" * 80,
        ""
    ]

    for repo in sorted(repos_with_system, key=lambda x: x['name'].lower()):
        report_lines.append(f"{repo['name']}")
        report_lines.append(f"  URL: {repo['url']}")
        report_lines.append(f"  Location: {repo['changelog_location']}")
        report_lines.append("")

    report_lines.extend([
        "=" * 80,
        f"REPOSITORIES WITHOUT CHANGELOG FRAGMENT SYSTEMS ({no_count} repos)",
        "=" * 80,
        ""
    ])

    for repo in sorted(repos_without_system, key=lambda x: x['name'].lower()):
        report_lines.append(f"{repo['name']}")
        report_lines.append(f"  URL: {repo['url']}")
        report_lines.append("")

    report_lines.extend([
        "=" * 80,
        "ANALYSIS NOTES",
        "=" * 80,
        "",
        "This scan checked for the following changelog automation patterns:",
        "1. changelogs/fragments/ directory (OpenSearch-Dashboards style)",
        "2. .changelog/ directory",
        "3. changelog/fragments/ directory (without 's')",
        "4. GitHub workflow files with 'changelog' or 'fragment' in the name",
        "5. Configuration files for changelog tools (towncrier, scriv, etc.)",
        "",
        "Repositories marked as 'archived' were excluded from the analysis.",
        "",
        "=" * 80,
        "RECOMMENDATIONS",
        "=" * 80,
        "",
        "Based on this analysis:",
        f"- Only {percentage:.2f}% of active repositories use changelog fragment systems",
        "- Consider standardizing changelog practices across all repositories",
        "- Repositories without fragment systems may benefit from adopting this approach",
        "- This improves release notes generation and change tracking",
        "",
        "=" * 80,
        "END OF REPORT",
        "=" * 80
    ])

    report_text = "\n".join(report_lines)
    with open('/Users/huanji/wss/osd/changelog_analysis_report.txt', 'w') as f:
        f.write(report_text)

    # Print summary
    print("\nFiles created:")
    print("  - Detailed JSON: /Users/huanji/wss/osd/changelog_analysis_detailed.json")
    print("  - Human-readable report: /Users/huanji/wss/osd/changelog_analysis_report.txt")
    print("\nKey Statistics:")
    print(f"  Total repos: {total_repos}")
    print(f"  Active repos: {active_count}")
    print(f"  With changelog system: {has_count} ({percentage:.2f}%)")
    print(f"  Without changelog system: {no_count}")

    print("\nTop repositories WITH changelog systems:")
    for repo in repos_with_system[:5]:
        print(f"  - {repo['name']} ({repo['changelog_location']})")

    if len(repos_with_system) > 5:
        print(f"  ... and {len(repos_with_system) - 5} more")

if __name__ == '__main__':
    main()
