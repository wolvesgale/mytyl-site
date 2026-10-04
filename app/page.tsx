import Experience from '@/components/Experience';
import ContactActions from '@/components/ContactActions';
import { site, works } from '@/lib/site';
import { ArchFrame, Divider, HeroArch, Star8 } from '@/components/Ornaments';

const services = [
  {
    en: 'Modeling',
    ja: '3Dモデリング',
    text: 'キャラクター小物、アクセサリー、結晶や鉱物のようなモチーフまで。コンセプトから形を起こします。',
  },
  {
    en: 'Material & Light',
    ja: '質感・ライティング',
    text: '透明感、屈折、きらめき。素材の「光の入り方」まで設計し、世界観にあった質感に仕上げます。',
  },
  {
    en: '3D Data',
    ja: '3Dデータ制作',
    text: '用途に合わせたデータ形式・ポリゴン量で納品。映像、Web、ゲーム、グッズなど、使う場所を考えてつくります。',
  },
];

const process = [
  { no: '01', en: 'Listen', ja: 'ヒアリング', text: 'イメージ、用途、納期をうかがいます。' },
  { no: '02', en: 'Sketch', ja: 'ラフ・形状検討', text: '形のバランスを決め、方向性をすり合わせます。' },
  { no: '03', en: 'Model', ja: 'モデリング', text: '細部まで形を起こしていきます。' },
  { no: '04', en: 'Shine', ja: '質感・光', text: 'マテリアルとライティングで命を吹き込みます。' },
  { no: '05', en: 'Deliver', ja: '納品', text: '用途に合わせた形式で書き出してお渡しします。' },
];

export default function Page() {
  return (
    <>
      <Experience />

      <header className="site-header">
        <a href="#top" className="logo" aria-label={`${site.name} トップへ`}>
          <Star8 size={15} className="logo__mark" /> {site.name}
        </a>
        <nav className="nav" aria-label="メインナビゲーション">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#works">Works</a>
          <a href="#contact" className="nav__cta">Contact</a>
        </nav>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero" aria-label="イントロダクション">
          <HeroArch />
          <p className="hero__eyebrow" data-hero-fade>
            <span>3D Creator</span>
            <Star8 size={10} className="dot-star" />
            <span>{site.roleJa}</span>
          </p>
          <h1 className="hero__title" data-hero-title>
            {site.name}
          </h1>
          <p className="hero__lead" data-hero-fade>
            光を、かたちに。
            <em>Crafting light into form.</em>
          </p>
          <a href="#about" className="hero__scroll" data-hero-fade aria-label="下へスクロール">
            <span>Scroll</span>
            <span className="hero__scroll-line" aria-hidden />
          </a>
        </section>

        {/* ABOUT */}
        <section id="about" className="section about">
          <div className="section__label" data-reveal>
            <span className="num">01</span> About
          </div>
          <div className="about__body">
            <h2 className="heading-ja" data-reveal>
              ひとつの結晶に、
              <br />
              物語が宿るように。
            </h2>
            <p className="text" data-reveal>
              {site.name}は、3Dデータを制作するクリエイターです。
              <br />
              透き通るもの、きらめくもの、ちいさな魔法を感じるもの。
              <br />
              光と透明感をまとうモデルを、ひとつずつ丁寧につくっています。
            </p>
            <p className="text-en" data-reveal>
              A 3D creator shaping luminous, translucent worlds — one crystal at a time.
            </p>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="marquee" aria-hidden>
          <div className="marquee__track" data-marquee>
            {['Crystal', 'Light', 'Form', 'Mirage', 'Fairy', 'Crystal', 'Light', 'Form', 'Mirage', 'Fairy'].map((w, i) => (
              <span key={i} className="marquee__item">
                {w}
                <Star8 size={28} className="marquee__star" />
              </span>
            ))}
          </div>
        </div>

        {/* SERVICES */}
        <section id="services" className="section services">
          <div className="section__label" data-reveal>
            <span className="num">02</span> What I Do
          </div>
          <h2 className="heading-en" data-reveal>
            <em>Services</em>
          </h2>
          <div className="cards" data-stagger>
            {services.map((s) => (
              <article key={s.en} className="glass-card">
                <p className="glass-card__en">{s.en}</p>
                <h3 className="glass-card__ja">{s.ja}</h3>
                <p className="glass-card__text">{s.text}</p>
                <span className="glass-card__shine" aria-hidden />
              </article>
            ))}
          </div>
        </section>

        <Divider />

        {/* WORKS */}
        <section id="works" className="section works">
          <div className="section__label" data-reveal>
            <span className="num">03</span> Works
          </div>
          <h2 className="heading-en" data-reveal>
            <em>Selected Works</em>
          </h2>
          <div className="works__list" data-stagger>
            {works.map((w) => (
              <article key={w.no} className={`work ${w.comingSoon ? 'is-soon' : ''}`}>
                <div className="work__visual" aria-hidden>
                  <ArchFrame />
                  {w.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.image} alt="" />
                  ) : (
                    <div className={`work__placeholder ${w.comingSoon ? '' : 'is-crystal'}`}>
                      {!w.comingSoon && (
                        <svg viewBox="0 0 120 160" className="work__gem">
                          <defs>
                            <linearGradient id={`g${w.no}`} x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#c9b8ff" />
                              <stop offset="50%" stopColor="#e9cf96" />
                              <stop offset="100%" stopColor="#ffd0ec" />
                            </linearGradient>
                          </defs>
                          <polygon points="60,4 96,44 88,128 60,156 32,128 24,44" fill="none" stroke={`url(#g${w.no})`} strokeWidth="1.2" />
                          <polyline points="24,44 60,60 96,44" fill="none" stroke={`url(#g${w.no})`} strokeWidth="0.8" opacity=".8" />
                          <line x1="60" y1="4" x2="60" y2="60" stroke={`url(#g${w.no})`} strokeWidth="0.6" opacity=".6" />
                          <line x1="60" y1="60" x2="60" y2="156" stroke={`url(#g${w.no})`} strokeWidth="0.6" opacity=".5" />
                          <polyline points="32,128 60,120 88,128" fill="none" stroke={`url(#g${w.no})`} strokeWidth="0.6" opacity=".6" />
                          <circle cx="60" cy="78" r="5" fill="#fff" className="work__gem-core" />
                        </svg>
                      )}
                      {w.comingSoon && <span className="work__soon">Coming soon</span>}
                    </div>
                  )}
                </div>
                <div className="work__meta">
                  <span className="work__no">{w.no}</span>
                  <span className="work__cat">{w.category}</span>
                </div>
                <h3 className="work__title">
                  {w.title}
                  <span>{w.titleJa}</span>
                </h3>
                <p className="work__text">{w.text}</p>
                {w.tags.length > 0 && (
                  <ul className="work__tags">
                    {w.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* PROCESS */}
        <section className="section process" aria-labelledby="process-title">
          <div className="section__label" data-reveal>
            <span className="num">04</span> Process
          </div>
          <h2 id="process-title" className="heading-en" data-reveal>
            <em>How it’s made</em>
          </h2>
          <div className="process__line" data-process-line aria-hidden />
          <ol className="process__list" data-stagger>
            {process.map((p) => (
              <li key={p.no} className="process__item">
                <span className="process__no">{p.no}</span>
                <p className="process__en">{p.en}</p>
                <h3 className="process__ja">{p.ja}</h3>
                <p className="process__text">{p.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <Divider />

        {/* CONTACT */}
        <section id="contact" className="section contact">
          <div className="section__label" data-reveal>
            <span className="num">05</span> Contact
          </div>
          <h2 className="contact__title" data-reveal>
            <em>Let’s make something</em>
            <br />
            <em className="prism-text">luminous.</em>
          </h2>
          <p className="text contact__text" data-reveal>
            3Dデータ制作のご依頼・ご相談は、お気軽にメールでご連絡ください。
          </p>
          <div data-reveal>
            <a className="contact__mail" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            <ContactActions email={site.email} />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span className="site-footer__copy">
          <Star8 size={12} /> © {new Date().getFullYear()} {site.name}
        </span>
        <span className="site-footer__en">Crafting light into form.</span>
      </footer>
    </>
  );
}
