# ニカ 編成講座（非公式）計画

## 何を作るか

ブラウザゲーム「ニカ」の部隊編成を解説する、**非公式のファン攻略ページ**。静的HTML1枚。ビルド不要。

- 短く、シンプルに。文章より図とモンスター画像で見せる。
- 公式ではないことをヘッダーのバッジとフッターの免責文で明示する。
- 数値（HP・攻撃力・コスト等）は載せない。載せるのはモンスター画像・名前・属性まで。

## ページ構成

上から順に1ページのスクロール。タイプ別だけタブで切り替える。

| 区画 | 内容 |
|------|------|
| ヘッダー | 非公式バッジ／タイトル／リード文 |
| 部隊の見取り図 | 3体スロット＋共有HP＋部隊属性の図に、番号つき解説3点 |
| 編成の三か条 | 3枚のカード。各カードに小さい図（型の選択／三竦み／噛み合い） |
| タイプ別 Tierと編成 | タブ4つ（速度型・防御型・攻撃型・クリティカル型）。各タブに「特殊能力Tier」と「代表的な編成」×2 |
| フッター | 免責文／画像素材のクレジット |

## ファイル構成

公開されるのは `public/` の中だけ。

```
public/
  index.html                構造だけ。文言は持たない
  assets/style.css          見た目
  assets/app.js             GUIDE と生成データからDOMを組み立てる
  data/guide.js             文面。ここだけ書き換えればページが変わる
  data/generated.js         生成物。モンスター（画像・属性・規模・特殊能力）と特殊能力の説明
  images/monster/*.gif      掲載モンスターが使う画像のみ
  favicon.svg
docs/plan.md                この文書
README.md
```

## 文面の入れ方

`public/data/guide.js` の `GUIDE` を書き換える。HTML・CSSには触らない。

- `site` … タイトル、リード文、ゲームのURL（`gameUrl` を入れるとフッターにリンクが出る）
- `overview` … 見取り図に出すモンスター3体と、番号つき解説3点
- `principles.items` … 三か条。`figure` は `types` / `triangle` / `synergy` のいずれか
- `types.items` … タイプごとの `tiers`（rank と特殊能力名）と `formations`（モンスター3体・狙い）
- `footer` … 免責文とクレジット

決まりごと:

- モンスター名・特殊能力名は**ゲーム内の表記と完全一致**させる。一致しないと画像が出ず、名前の下に「未登録」と表示される。
- 部隊属性はモンスター3体から自動計算する（多数決／3色なら黒）。手で書かない。
- 特殊能力チップのツールチップの説明文は自動で入る。文面側に書かない。
- 文面が確定したら `draft: true` を `false` にして、上部の仮バナーを消す。

## 掲載データ

`public/data/generated.js` はゲームの公開APIから作った生成物。手で書き換えない。

| データ | 取得元 |
|---|---|
| モンスター名・属性・規模・特殊能力、特殊能力の説明文 | `https://almaz.in.net/nika/api/master/get` |
| 名前と画像の対応 | ゲームのフロントが配信しているスクリプト |
| 画像 | `https://almaz.in.net/nika/images/monster/*.gif` |

ゲーム側でモンスターや特殊能力が増えたら取り直す。手順は README を参照。

## デザイン仕様

- 配色: 背景 `#f5f7fa` ／ カード白 ／ 文字 `#12141c`。**色は属性の赤・緑・青だけに使う**。装飾に別の色を足さない。
- フォント: 見出し Murecho 800 ／ 本文 IBM Plex Sans JP（Google Fonts）
- 部品: 角丸14pxのカード、1pxの罫線、丸ピルのチップとタブ
- モンスター画像は `image-rendering: pixelated` で原寸表示。拡大しない。
- 主役の部品は「3体スロット＋共有HP＋属性チップ」の部隊カード。見取り図と編成例で同じ部品を使う。
- 900px以下で1カラム、560px以下でタブ2列。

## 公開（Cloudflare Pages）

ビルドコマンドなし。**出力ディレクトリは `public`**。`wrangler.toml` の `pages_build_output_dir` で固定している。プロジェクト名 `name` がURLになる。

- **Git連携**: リポジトリを接続し、push で自動デプロイ。Framework preset は「None」、Build command は空、Build output directory は `public`。
- **Wrangler CLI**: `npx wrangler login` のあと `npx wrangler pages deploy`。
- **手アップロード**: Workers & Pages → Create → Pages → Upload assets に `public` の中身をドラッグ。

公開URLは `https://nika-guide.pages.dev`。独自ドメインは Custom domains から追加できる。

## ローカル確認

`public/index.html` を `file://` で直接開いても動く。サーバー経由で見る場合:

```bash
cd public && python -m http.server 8787
```

## 残作業

- 文面の差し替え（`public/data/guide.js`）と `draft: false`
- 文面確定後に `public/index.html` の robots を `index, follow` に戻す（いまは仮文面なので `noindex`）
- `site.gameUrl` にゲームのURLを入れる
- 各タイプのTier内容と編成例の確定
- OGP画像（`og:image`）を用意する場合は追加する
