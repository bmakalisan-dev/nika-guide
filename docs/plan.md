# ニカ 編成講座（非公式）計画

## 何を作るか

ブラウザゲーム「ニカ」の部隊編成を解説する、**非公式のファン攻略ページ**。静的HTML1枚。ビルド不要。

- 短く、シンプルに。文章より図とモンスター画像で見せる。
- 公式ではないことを、タイトル直下の方針文とフッターの免責文で明示する。
- 数値（HP・攻撃力・コスト等）は載せない。載せるのはモンスター画像・名前・属性まで。

## ページ構成

上から順に1ページのスクロール。タイプ別だけタブで切り替える。

| 区画 | 内容 |
|------|------|
| ヘッダー | タイトル／このサイトの方針 |
| 部隊の見取り図 | 3体スロット＋合算HP＋部隊属性の図に、番号つき解説3点 |
| 編成の三か条 | 3枚のカード。各カードに小さい図（重複不可／方向性／規模の段階） |
| タイプ別 Tierと編成 | タブ4つ（速度型・防御型・攻撃型・クリティカル型）。各タブに「特殊能力Tier」「相性が良いスキル・タロット」「代表的な編成」×2 |
| フッター | 免責文／画像素材のクレジット |

## ファイル構成

公開されるのは `public/` の中だけ。

```
public/
  index.html                構造だけ。文言は持たない
  assets/style.css          見た目
  assets/app.js             GUIDE と生成データからDOMを組み立てる
  data/guide.js             文面。ここだけ書き換えればページが変わる
  data/generated.js         生成物。モンスター・特殊能力・スキル・タロット
  images/monster/*.gif      掲載モンスターが使う画像のみ
  favicon.svg
docs/plan.md                この文書
tools/generate-data.mjs     generated.js と images/ を作り直すスクリプト
README.md
```

## 文面の入れ方

`public/data/guide.js` の `GUIDE` を書き換える。HTML・CSSには触らない。

- `site` … タイトル、ゲームのURL（`gameUrl` を入れるとフッターにリンクが出る）
- `policy` … タイトル直下に出す方針。`body` と `points`
- `overview` … 見取り図に出すモンスター3体と、番号つき解説3点
- `principles.items` … 三か条。`figure` は `stack`（重複不可）/ `types`（方向性）/ `kibo`（規模の段階）/ `triangle`（三竦み）のいずれか
- `types.items` … タイプごとの `tiers`（rank と特殊能力名）、`skills`・`tarots`（相性が良いもの。タロットは `{ name, position }` で正逆を指定できる）、`formations`（モンスター3体・狙い）。`accent` は `red` / `green` / `blue` / `amber`
- `types.tierLegend` … Tierの下に出す凡例
- `footer` … 免責文とクレジット

決まりごと:

- モンスター名・特殊能力名・スキル名・タロット名は**ゲーム内の表記と完全一致**させる。一致しないとチップに赤い「?」が付き、モンスターは画像が出ず「未登録」と表示される。
- 部隊属性はモンスター3体から自動計算する（多数決／3色なら黒）。手で書かない。
- 特殊能力・スキル・タロットのツールチップの説明文は自動で入る。文面側に書かない。
- 特殊能力チップの形も自動。**重複不可は六角形、重複可は丸ピル**で、ゲーム内の表示と揃えている。

## 掲載データ

`public/data/generated.js` はゲームの公開APIから作った生成物。手で書き換えない。

| データ | 取得元 |
|---|---|
| モンスター名・属性・規模・特殊能力 | `https://almaz.in.net/nika/api/master/get` |
| 特殊能力の説明文と重複可否、スキル、タロット | 同上 |
| 名前と画像の対応 | ゲームのフロントが配信しているスクリプト |
| 画像 | `https://almaz.in.net/nika/images/monster/*.gif` |

ゲーム側でモンスターや特殊能力が増えたら取り直す。手順は README を参照。

## デザイン仕様

- 配色: 背景 `#f4f6fd` に淡いグラデーション ／ カード白 ／ 文字 `#14162b` ／ アクセント紫 `#6b4bd8`
- 属性色は 赤 `#e8443a` ／ 緑 `#17a05a` ／ 青 `#2f74e8`
- タイプごとにアクセント色を持つ（速度=青・防御=緑・攻撃=赤・クリティカル=橙）。タブの選択状態とパネルのリード文に効く
- Tierのランク色は S=橙 / A=紫 / B=青
- フォント: 見出し Murecho 800 ／ 本文 IBM Plex Sans JP（Google Fonts）
- 部品: 角丸18pxのカード、1pxの罫線、丸ピルのチップとタブ
- モンスター画像は `image-rendering: pixelated` で原寸表示。拡大しない。
- 主役の部品は「3体スロット＋合算HP＋属性チップ」の部隊カード。見取り図と編成例で同じ部品を使う。
- 900px以下で1カラム、560px以下でタブ2列。

## 公開（Cloudflare Pages）

ビルドコマンドなし。**出力ディレクトリは `public`**。`wrangler.toml` の `pages_build_output_dir` で固定している。プロジェクト名 `name` がURLになる。

GitHubリポジトリを接続済みで、`main` への push で自動デプロイされる。設定は Framework preset「None」、Build command 空、Build output directory `public`。

公開URLは `https://nika-guide.pages.dev`。独自ドメインは Custom domains から追加できる。

## ローカル確認

`public/index.html` を `file://` で直接開いても動く。サーバー経由で見る場合:

```bash
cd public && python -m http.server 8787
```

## 残作業

- 各タイプのTier内容、相性が良いスキル・タロット、編成例の確定
- 内容が固まったら `public/index.html` の robots を `index, follow` に戻す（いまは `noindex`）
- `site.gameUrl` にゲームのURLを入れる
- OGP画像（`og:image`）を用意する場合は追加する
