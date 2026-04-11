---
name: orchestrate-worktrees
description: >-
  要件・機能説明からタスクを自動分解し、ファイル依存関係を分析して DAG（有向非巡回グラフ）形式の
  実行計画 JSON を出力し、GitHub Actions 経由で Cursor Cloud Agents を自動起動するオーケストレーションスキル。
  「タスクを並列実行したい」「worktree でエージェントを同時に動かしたい」「タスク間の依存関係を整理したい」
  「parallel agents」「並列エージェント」「タスク分解」「要件から実装を進めたい」「機能を実装してほしい」
  と言われたときに使用する。
---

# Orchestrate Worktrees

要件またはタスクリストを受け取り、依存関係を DAG で分析して GitHub Actions 経由で Cursor Cloud Agents に委任する。

## フェーズ0：要件からタスク分解（タスクリストがない場合）

要件・機能説明のみ渡された場合、タスクリストに分解する。タスクリストが渡された場合はスキップ。

**分解の基準：**
- 1タスク = 独立してテスト・レビュー可能な単位（1 PR 相当）
- 1 Cloud Agent が1セッションで完結できる粒度
- 共有インフラ（DB定義・API型・ルーティング設定）は**最初のタスク**にまとめる

**出力フォーマット：**

```
## タスク分解案

1. [タスク名] - [1行の概要]
2. [タスク名] - [1行の概要]
...

このタスク分解で進めてよいですか？変更があれば指示してください。
```

ユーザーの承認後にフェーズ1へ進む。

## フェーズ1：タスク分析

各タスクについてコードベースを `grep` とセマンティック検索で調査し、変更対象ファイルを列挙する。

**出力フォーマット：**

```
## タスク分析結果

### タスク: [タスク名]
- 変更対象ファイル:
  - src/path/to/file.ts
- 他タスクとの重複: なし / あり（タスクXの○○と競合）
```

## フェーズ2：依存関係マッピングと DAG 実行計画

分析結果をもとに依存グラフを構築する。

**依存の判断基準：**
- 同じファイルを変更する → 依存あり（depends_on に追加）
- 一方が他方の出力（関数・型・API）を呼び出す → 提供側を depends_on に追加
- 完全に別ファイル・別モジュール → depends_on は空（同時起動可）
- ホットスポット（`package.json`, routing, DB migration）→ 常に depends_on に追加

**出力フォーマット（DAG JSON）：**

```json
{
  "repository": "https://github.com/<owner>/<repo>",
  "ref": "main",
  "tasks": [
    {
      "id": "task-1",
      "name": "[タスク名1]",
      "prompt": "[Cloud Agent へのプロンプト（実装内容・対象ファイル・完了条件）]",
      "depends_on": []
    },
    {
      "id": "task-2",
      "name": "[タスク名2]",
      "prompt": "[Cloud Agent へのプロンプト]",
      "depends_on": []
    },
    {
      "id": "task-3",
      "name": "[タスク名3]",
      "prompt": "[Cloud Agent へのプロンプト]",
      "depends_on": ["task-1", "task-2"]
    }
  ]
}
```

承認しますか？ [y/n]

ユーザーの承認後にフェーズ3へ進む。

## フェーズ3：GitHub Actions トリガー

承認後、以下の手順を案内する：

### 自動実行（推奨）

```bash
# DAG JSON をファイルに保存してから GitHub Actions を起動
cat > /tmp/plan.json << 'EOF'
{上記の DAG JSON}
EOF

gh workflow run orchestrate.yml \
  --repo <owner>/<repo> \
  --field plan_json="$(cat /tmp/plan.json)"
```

### 手動実行

GitHub の Actions タブ → `Cursor Agent Orchestration` → `Run workflow` → DAG JSON を貼り付けて実行

### 進捗確認

```bash
# GitHub Actions の実行ログを確認
gh run watch

# Cursor Agents ダッシュボードで各エージェントを監視
open https://cursor.com/agents
```

## 注意事項

- `prompt` には実装内容・変更対象ファイル・完了条件を具体的に記述する（エージェントへの指示書になる）
- `depends_on` に指定したタスクが完了・マージされてから起動するため、順序を正確に設定する
- 実行スクリプト詳細は `scripts/orchestrate.py` を参照
