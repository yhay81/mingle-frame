# Stack

## 採用

- Cloudflare Workers: 配信、Hono実行、セキュリティヘッダー
- Cloudflare D1: 匿名イベントの最小保存
- Cloudflare Rate Limiting: イベント書き込みの抑制
- Hono / Hono JSX: ルーティングとHTML生成
- Vite+: 開発サーバー、lint、format、テスト、ビルド
- Canvas API: 画像合成とPNG生成
- localStorage: 画像を除く端末内設定

## 採用しないもの

- Better Auth: 利用者のjobにアカウントが不要
- 画像ストレージ: 画像を端末外へ出さない
- UIキット: 小さく固有な編集台であり、ブラウザ標準部品とCSSで十分
- 画像処理ライブラリ: Canvas APIだけで安定して実現できる

## 依存関係の方針

直接依存はバージョンを固定し、lockfileをコミットします。外部サービスや依存を追加する場合は、利便性・保守性・安全性の改善が導入コストを上回ることを確認します。

## 公開前ゲート

1. リリース契約、lint、format、型検査、テスト、production buildを通す
2. npm auditで既知の脆弱性を確認する
3. CSP、セキュリティヘッダー、telemetry拒否条件を確認する
4. PCとスマートフォン幅で主要操作、横あふれ、カード出力を確認する
5. 運営判断や実験条件が利用画面へ混入していないことを確認する
6. 公開リポジトリのCI、Private vulnerability reporting、判断Issueを有効にする
