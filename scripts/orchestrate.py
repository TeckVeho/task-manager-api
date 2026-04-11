#!/usr/bin/env python3
"""
Cursor Cloud Agent DAG Orchestrator
====================================
DAG JSON を stdin から受け取り、依存関係を解決しながら
Cursor Cloud Agents を順次並列起動して全タスクを完了させる。

Usage:
  cat plan.json | python scripts/orchestrate.py
  echo '<json>' | python scripts/orchestrate.py

Required env vars:
  CURSOR_API_KEY   - Cursor Cloud Agents API key
  SLACK_WEBHOOK_URL - (optional) Slack Incoming Webhook URL for notifications
"""

import json
import os
import sys
import time
from typing import Optional

import requests

# ──────────────────────────────────────────
# 設定
# ──────────────────────────────────────────
CURSOR_API_KEY = os.environ.get("CURSOR_API_KEY", "")
SLACK_WEBHOOK_URL = os.environ.get("SLACK_WEBHOOK_URL", "")
BASE_URL = "https://api.cursor.com/v0"
POLL_INTERVAL_SEC = 30
AGENT_TIMEOUT_MIN = 90


def _auth() -> tuple[str, str]:
    return (CURSOR_API_KEY, "")


# ──────────────────────────────────────────
# Cursor API
# ──────────────────────────────────────────
def launch_agent(task: dict, repository: str, ref: str) -> dict:
    resp = requests.post(
        f"{BASE_URL}/agents",
        auth=_auth(),
        json={
            "prompt": {"text": task["prompt"]},
            "source": {"repository": repository, "ref": ref},
            "target": {"autoCreatePr": True},
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def get_agent(agent_id: str) -> dict:
    resp = requests.get(
        f"{BASE_URL}/agents/{agent_id}",
        auth=_auth(),
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


# ──────────────────────────────────────────
# Slack 通知
# ──────────────────────────────────────────
def notify(message: str) -> None:
    print(message)
    if SLACK_WEBHOOK_URL:
        try:
            requests.post(SLACK_WEBHOOK_URL, json={"text": message}, timeout=10)
        except Exception:
            pass


# ──────────────────────────────────────────
# DAG オーケストレーター
# ──────────────────────────────────────────
def orchestrate(plan: dict) -> bool:
    repository: str = plan["repository"]
    ref: str = plan.get("ref", "master")
    tasks: dict[str, dict] = {t["id"]: t for t in plan["tasks"]}

    completed: set[str] = set()   # 完了タスク ID
    failed: list[str] = []        # 失敗タスク ID
    running: dict[str, str] = {}  # task_id -> agent_id

    notify(f"🚀 オーケストレーション開始\nリポジトリ: {repository}\nタスク数: {len(tasks)}")

    deadline = time.time() + AGENT_TIMEOUT_MIN * 60

    while len(completed) + len(failed) < len(tasks):
        if time.time() > deadline:
            notify(f"⏰ タイムアウト（{AGENT_TIMEOUT_MIN}分）。実行中: {list(running.keys())}")
            return False

        # 依存が満たされた未着手タスクを抽出
        ready = [
            t for tid, t in tasks.items()
            if tid not in completed
            and tid not in failed
            and tid not in running
            and all(dep in completed for dep in t.get("depends_on", []))
        ]

        # 準備済みタスクを全部同時に起動
        for task in ready:
            try:
                agent = launch_agent(task, repository, ref)
                running[task["id"]] = agent["id"]
                branch = agent.get("target", {}).get("branchName", "N/A")
                print(f"  ▶ 起動: {task['id']} ({task.get('name', '')}) → agent {agent['id']} / branch: {branch}")
            except Exception as e:
                print(f"  ✗ 起動失敗: {task['id']} - {e}")
                failed.append(task["id"])

        if not running:
            # 起動できるタスクがないが未完了タスクが残っている = 依存解決不能
            remaining = [tid for tid in tasks if tid not in completed and tid not in failed]
            notify(f"⚠️ 依存解決不能なタスクがあります: {remaining}")
            return False

        time.sleep(POLL_INTERVAL_SEC)

        # 実行中エージェントのステータスを確認
        for task_id, agent_id in list(running.items()):
            try:
                agent = get_agent(agent_id)
                status = agent["status"]

                if status == "FINISHED":
                    pr_url = agent.get("target", {}).get("prUrl", "")
                    completed.add(task_id)
                    del running[task_id]
                    msg = f"  ✅ 完了: {task_id}"
                    if pr_url:
                        msg += f" → PR: {pr_url}"
                    print(msg)

                elif status == "FAILED":
                    failed.append(task_id)
                    del running[task_id]
                    print(f"  ✗ 失敗: {task_id} (agent: {agent_id})")

                else:
                    print(f"  ⏳ 実行中: {task_id} ({status})")

            except Exception as e:
                print(f"  ? ステータス取得失敗: {task_id} - {e}")

    # 結果サマリー
    if failed:
        notify(
            f"⚠️ 一部タスクが失敗しました\n"
            f"完了: {sorted(completed)}\n"
            f"失敗: {failed}\n"
            f"確認: https://cursor.com/agents"
        )
        return False
    else:
        notify(
            f"✅ 全タスク完了！\n"
            f"完了: {sorted(completed)}\n"
            f"PR を確認してください: https://github.com/{repository.split('github.com/')[-1]}/pulls"
        )
        return True


# ──────────────────────────────────────────
# エントリポイント
# ──────────────────────────────────────────
def main() -> None:
    if not CURSOR_API_KEY:
        print("ERROR: CURSOR_API_KEY が設定されていません", file=sys.stderr)
        sys.exit(1)

    try:
        raw = sys.stdin.read().strip()
        plan = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"ERROR: JSON パースエラー - {e}", file=sys.stderr)
        sys.exit(1)

    success = orchestrate(plan)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
