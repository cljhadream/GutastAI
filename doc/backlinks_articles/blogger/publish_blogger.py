# -*- coding: utf-8 -*-
"""Publish prepared HTML articles to Blogger via Blogger API v3.

One-time setup:
    1. Save your OAuth Desktop client credentials as `client_secret.json`
       in the same folder as this script (see README-blogger-publishing.md).
    2. pip install -r requirements.txt

Usage:
    python publish_blogger.py              # upload all posts as DRAFTS (safe)
    python publish_blogger.py --publish    # publish posts directly
    python publish_blogger.py --only 01    # only upload posts whose file name contains "01"

Notes:
    - First run opens a browser window for Google consent; the token is
      cached in token.json for later runs.
    - Keep client_secret.json and token.json private; never commit them.
"""

import argparse
import json
import sys
import time
from pathlib import Path

import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# Target blog: https://www.blogger.com/blog/posts/6764856150216884671
BLOG_ID = "6764856150216884671"
SCOPES = ["https://www.googleapis.com/auth/blogger"]
API_BASE = "https://www.googleapis.com/blogger/v3"

BASE_DIR = Path(__file__).resolve().parent
CLIENT_SECRET_FILE = BASE_DIR / "client_secret.json"
TOKEN_FILE = BASE_DIR / "token.json"
MANIFEST_FILE = BASE_DIR / "posts.json"
POSTS_DIR = BASE_DIR / "posts"


def load_credentials() -> Credentials:
    """Return valid OAuth credentials, refreshing or consenting as needed."""
    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if creds and creds.valid:
        return creds
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        if not CLIENT_SECRET_FILE.exists():
            sys.exit(
                "client_secret.json not found.\n"
                "Follow README-blogger-publishing.md steps 1-4 to create it,\n"
                "then place it next to this script."
            )
        flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET_FILE), SCOPES)
        creds = flow.run_local_server(port=0, prompt="consent")
    TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")
    return creds


def upload_post(creds: Credentials, item: dict, publish: bool) -> None:
    """Upload one HTML file as a Blogger post (draft by default)."""
    html_path = POSTS_DIR / item["file"]
    if not html_path.exists():
        sys.exit(f"[FAIL] Missing post file: {html_path}")

    payload = {
        "kind": "blogger#post",
        "blog": {"id": BLOG_ID},
        "title": item["title"],
        "content": html_path.read_text(encoding="utf-8"),
        "labels": item.get("labels", []),
    }
    resp = requests.post(
        f"{API_BASE}/blogs/{BLOG_ID}/posts/",
        params={"isDraft": (not publish)},
        json=payload,
        headers={"Authorization": f"Bearer {creds.token}"},
        timeout=30,
    )
    if resp.status_code >= 400:
        sys.exit(f"[FAIL] {item['file']}: HTTP {resp.status_code}\n{resp.text[:500]}")

    data = resp.json()
    state = "PUBLISHED" if publish else "DRAFT   "
    print(f"[{state}] {item['title']}")
    print(f"          {data.get('url', '(no url returned)')}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload prepared posts to Blogger.")
    parser.add_argument(
        "--publish",
        action="store_true",
        help="publish posts immediately (default: save as drafts)",
    )
    parser.add_argument(
        "--only",
        default="",
        help="substring filter on file name, e.g. --only 01",
    )
    args = parser.parse_args()

    items = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
    if args.only:
        items = [i for i in items if args.only in i["file"]]
    if not items:
        sys.exit("No posts matched the --only filter.")

    creds = load_credentials()
    print(f"Blog {BLOG_ID} | {len(items)} post(s) | mode: "
          f"{'PUBLISH' if args.publish else 'DRAFT'}\n")

    for index, item in enumerate(items):
        # Refresh the access token if it expired mid-run.
        if not creds.valid:
            creds = load_credentials()
        upload_post(creds, item, args.publish)
        if index < len(items) - 1:
            time.sleep(1)  # stay well below API rate limits

    print("\nDone. Check drafts in the Blogger dashboard before publishing.")


if __name__ == "__main__":
    main()
