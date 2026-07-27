# Mingle Frame

画像、好きなこと、活動時間、関わり方を一枚へ整える、交流用の自己紹介カードメーカーです。画像処理とPNG生成はブラウザ内で完結し、画像やプロフィールをサーバーへ送りません。

## できること

- Midnight / Dawn / Paperの3デザイン
- 最大3枚の画像配置と、位置・拡大率の調整
- 16:9（1200×675）と正方形（1080×1080）のPNG出力
- 好きなこと、活動時間、連絡方法、場所、境界線の整理
- 投稿文のコピー
- 文字設定の端末内保存（画像は保存しない）

## 技術構成

- Cloudflare Workers / D1 / Rate Limiting
- Hono / Hono JSX
- Vite+
- TypeScript / Vitest / Oxlint / Oxfmt

認証、外部ストレージ、画像アップロードAPIはありません。D1へ記録するのは、許可リストにある匿名イベント名と一方向変換済み識別子だけです。

## 開発

Node.js 24とnpm 11を使います。

```powershell
npm ci
npm run release:check
npm run check
npm test
npm run build
npm run dev
```

ローカルD1を準備する場合:

```powershell
npx wrangler d1 migrations apply mingle-frame --local
npm run metrics -- -Local
```

## 公開

```powershell
npx wrangler d1 migrations apply mingle-frame --remote
npm run deploy
npm run indexnow
```

運営上の判断条件は[EXPERIMENT.md](EXPERIMENT.md)、データ境界は[PRIVACY.md](PRIVACY.md)、指標定義は[METRICS.md](METRICS.md)に分離しています。
