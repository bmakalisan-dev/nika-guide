# Nika 編成講座（非公式）

ブラウザゲーム「Nika」の部隊編成を解説する非公式ファン攻略ページ。静的HTML。

公開されるのは `public/` の中だけ。`public/index.html` は `content/` から生成しているので直接編集しない。

## 編集する

1. `content/guide.js` を書き換える（文面はすべてここ）
2. `node tools/build.mjs` でHTMLを作り直す
3. コミットして push すると自動デプロイされる

モンスター名・特殊能力名・スキル名・タロット名がゲーム内の表記と一致しない場合、ビルドがエラーで止まる。

## 確認する

`public/index.html` を直接ブラウザで開く。またはサーバー経由で:

```bash
cd public && python -m http.server 8787
```

## モンスターデータを更新する

ゲームの公開APIと画像から取り込む。

```bash
node tools/generate-data.mjs                 # 既定のベースURLから取る
node tools/generate-data.mjs <ベースURL>     # 別環境から取る場合
node tools/build.mjs                         # 取り込んだらHTMLを作り直す
```

## 公開する

Cloudflare Pages。GitHubの `main` への push で自動デプロイ。出力ディレクトリは `public`。

詳細は [docs/plan.md](docs/plan.md)。
