# Mytyl — 3D Creator

3Dデータクリエイター Mytyl の紹介サイト（1ページLP）。

- Next.js 15 (App Router) / TypeScript
- React Three Fiber + drei（`MeshTransmissionMaterial`）でヒーローの「妖精のクリスタル」をリアルタイム生成
- GSAP（ScrollTrigger / SplitText）+ Lenis でスクロール演出
- Vercel にデプロイ

## 開発

```bash
npm install
npm run dev
```

## 作品の追加

`lib/site.ts` の `works` 配列を編集します。

- 画像: `public/works/` に置いて `image: '/works/xxx.webp'`
- 準備中の枠を消す: `comingSoon: true` の項目を削除

## 独自ドメインへの切り替え

1. Vercel の Project → Settings → Domains でドメインを追加し、DNS を設定
2. 環境変数 `NEXT_PUBLIC_SITE_URL=https://<domain>` を設定して再デプロイ（OGP・sitemap の URL に使われます）
