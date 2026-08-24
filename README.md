# ニカ 編成講座（非公式）

ブラウザゲーム「ニカ」の部隊編成を解説する非公式ファン攻略ページ。静的HTMLのみ、ビルド不要。

公開されるのは `public/` の中だけ。

## 編集する

文面はすべて `public/data/guide.js` にある。ここを書き換えるとページが変わる。文面が確定したら `draft: true` を `false` にする。

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
```

## 公開する

Cloudflare Pages。出力ディレクトリは `wrangler.toml` で `public` に固定してある。

```bash
npx wrangler login          # 初回だけ
npx wrangler pages deploy   # 以降はこれだけ
```

詳細は [docs/plan.md](docs/plan.md)。
