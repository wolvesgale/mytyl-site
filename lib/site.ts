export const site = {
  name: 'Mytyl',
  role: '3D Creator',
  roleJa: '3Dデータクリエイター',
  email: 'office@mytylm-create.com',
  description:
    'Mytylは、3Dデータを制作するクリエイターです。光と透明感をまとうモデルを、ひとつずつ丁寧に。',
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000'),
};

export type Work = {
  no: string;
  title: string;
  titleJa: string;
  category: string;
  text: string;
  tags: string[];
  /** add later: '/works/xxx.webp' */
  image?: string;
  /** add later: '/models/xxx.glb' */
  glb?: string;
  comingSoon?: boolean;
};

export const works: Work[] = [
  {
    no: '01',
    title: 'Fairy Crystal',
    titleJa: '妖精のクリスタル',
    category: '3D Model',
    text: '透き通る結晶の奥に、小さな光が眠る。妖精の気配を閉じ込めたクリスタルを、形状・質感・光の入り方まで設計して3Dデータとして構築しました。',
    tags: ['Modeling', 'Material', 'Lighting'],
  },
  {
    no: '02',
    title: 'Next Piece',
    titleJa: '準備中',
    category: 'Coming soon',
    text: '新しい作品を準備しています。',
    tags: [],
    comingSoon: true,
  },
  {
    no: '03',
    title: 'Next Piece',
    titleJa: '準備中',
    category: 'Coming soon',
    text: '新しい作品を準備しています。',
    tags: [],
    comingSoon: true,
  },
];
