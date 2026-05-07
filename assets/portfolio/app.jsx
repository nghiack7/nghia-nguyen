// Main React render
const { useState, useEffect, useRef } = React;

function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");
  const t = window.CONTENT[lang];

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent("lang-changed", { detail: { lang } }));
  }, [lang]);

  useEffect(() => {
    const btn = document.getElementById("lang-toggle");
    if (!btn) return;
    const handler = () => setLang(l => l === "en" ? "vi" : "en");
    btn.addEventListener("click", handler);
    return () => btn.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    const en = document.getElementById("lang-en");
    const vi = document.getElementById("lang-vi");
    if (en && vi) {
      en.classList.toggle("active", lang === "en");
      vi.classList.toggle("active", lang === "vi");
    }
  }, [lang]);

  useEffect(() => {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const apply = (theme) => {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem("theme", theme);
    };
    apply(localStorage.getItem("theme") || "dark");
    const handler = () => {
      const cur = document.documentElement.dataset.theme || "dark";
      apply(cur === "dark" ? "light" : "dark");
    };
    btn.addEventListener("click", handler);
    return () => btn.removeEventListener("click", handler);
  }, []);

  return (
    <>
      <Hero t={t} />
      <Marquee items={t.marquee} />
      <About t={t} />
      <Skills t={t} />
      <Experience t={t} />
      <Work t={t} />
      <Writing t={t} />
      <Education t={t} />
      <Contact t={t} />
      <Footer t={t} />
    </>
  );
}

function Hero({ t }) {
  return (
    <section className="hero" id="hero">
      <div className="wrap">
        <div className="ticker">
          {t.hero.ticker.map((s, i) => (
            <span key={i} className={i === 1 ? "live" : ""}>{s}</span>
          ))}
          <span className="mono" style={{color: "var(--fg-faint)"}}>· {t.hero.tagline.toUpperCase()}</span>
        </div>
        <h1>
          {t.hero.name1}<br/>
          <span className="it">{t.hero.name2}</span><span className="accent">.</span>
        </h1>
        <div className="sub">
          <div className="blurb">
            <p>{t.hero.blurb_p1}</p>
            <p style={{marginTop: 16, color: "var(--fg-dim)"}}>{t.hero.blurb_p2}</p>
          </div>
          <div className="ctas">
            <a className="btn primary" href="#work">{t.hero.cta1} <span className="arrow">→</span></a>
            <a className="btn" href="#contact">{t.hero.cta2}</a>
            <a className="btn" href="/NghiaNguyen-CV.pdf" target="_blank" rel="noopener">{t.hero.cta3} ↗</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee({ items }) {
  const repeated = [...items, ...items];
  return (
    <div className="marquee">
      <div className="track">
        {repeated.map((s, i) => (
          <span key={i} className={s === "•" ? "dot" : (i % 4 === 0 ? "hi" : "")}>{s}</span>
        ))}
      </div>
    </div>
  );
}

function About({ t }) {
  return (
    <section id="about">
      <div className="wrap">
        <div className="label"><span className="num">{t.about.label.split(' — ')[0]}</span> — {t.about.label.split(' — ')[1]}</div>
        <div className="about-grid">
          <h2>
            {t.about.h2[0]}<br/>
            <span className="it">{t.about.h2[1]}</span><br/>
            {t.about.h2[2]}
          </h2>
          <div className="about-text">
            <p dangerouslySetInnerHTML={{__html: t.about.p1}} />
            <p dangerouslySetInnerHTML={{__html: t.about.p2}} />
            <p dangerouslySetInnerHTML={{__html: t.about.p3}} />
          </div>
        </div>
        <div className="stats">
          {t.stats.map((s, i) => (
            <div className="cell" key={i}>
              <div className="num"><span className={s.accent ? "accent" : ""}>{s.num}</span></div>
              <div className="cap">{s.cap}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Skills({ t }) {
  return (
    <section id="stack">
      <div className="wrap">
        <div className="label"><span className="num">{t.skills.label.split(' — ')[0]}</span> — {t.skills.label.split(' — ')[1]}</div>
        <h2 style={{
          fontFamily: "var(--serif)", fontSize: "clamp(56px, 8vw, 120px)",
          lineHeight: 0.9, letterSpacing: "-0.03em", marginBottom: 64, fontWeight: 400
        }}>
          {t.skills.h2}
        </h2>
        <div className="skills-grid">
          {t.skills.groups.map((g, i) => (
            <div className="skill-card" key={i}>
              <div className="head">
                <h3>{g.title}</h3>
                <span className="cnt">[{g.count}]</span>
              </div>
              <ul>
                {g.items.map((it, j) => {
                  const name = typeof it === "string" ? it : it.n;
                  const hot = typeof it === "object" && it.hot;
                  return <li key={j} className={hot ? "hot" : ""}>{name}</li>;
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Experience({ t }) {
  return (
    <section id="experience">
      <div className="wrap">
        <div className="label"><span className="num">{t.experience.label.split(' — ')[0]}</span> — {t.experience.label.split(' — ')[1]}</div>
        <h2 style={{
          fontFamily: "var(--serif)", fontSize: "clamp(56px, 8vw, 120px)",
          lineHeight: 0.9, letterSpacing: "-0.03em", marginBottom: 48, fontWeight: 400
        }}>
          {t.experience.h2}
        </h2>
        <div className="exp-list">
          {t.experience.rows.map((r, i) => (
            <div className="exp-row" key={i}>
              <div className="when">{r.when}</div>
              <div className="role">{r.role_main}<span className="it"> {r.role_sub}</span></div>
              <div className="where">
                {r.co}
                <span className="ind">{r.ind}</span>
              </div>
              {r.badge ? <div className="badge">{r.badge}</div> : <div></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Work({ t }) {
  return (
    <section id="work">
      <div className="wrap">
        <div className="label"><span className="num">{t.work.label.split(' — ')[0]}</span> — {t.work.label.split(' — ')[1]}</div>
        <h2 style={{
          fontFamily: "var(--serif)", fontSize: "clamp(56px, 8vw, 120px)",
          lineHeight: 0.9, letterSpacing: "-0.03em", marginBottom: 48, fontWeight: 400
        }}>
          {t.work.h2}
        </h2>

        <div className="featured">
          <div className="meta">{t.work.featured.meta}</div>
          <h3>
            {t.work.featured.title1}<br/>
            <span className="it">{t.work.featured.title2}</span><br/>
            {t.work.featured.title3}
          </h3>
          <div className="body">
            <div>
              <p className="lede" dangerouslySetInnerHTML={{__html: t.work.featured.lede}} />
              <div className="stack">
                {t.work.featured.stack.map((s, i) => <span key={i}>{s}</span>)}
              </div>
            </div>
            <div className="specs">
              {t.work.featured.specs.map((s, i) => (
                <div className="s" key={i}>
                  <div className="k">{s.k}</div>
                  <div className="v">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="proj-grid">
          {t.work.others.map((p, i) => (
            <div className="proj" key={i}>
              <div className="top">
                <span className={`status ${p.status}`}><span className="ind"></span>{p.status === "dev" ? "IN DEV" : "SHIPPED"}</span>
                <span className="role">{p.role}</span>
              </div>
              <h4>{p.name}</h4>
              <p className="desc">{p.desc}</p>
              <div className="stack">
                {p.stack.map((s, j) => <span key={j}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Writing({ t }) {
  return (
    <section id="writing">
      <div className="wrap">
        <div className="label"><span className="num">{t.writing.label.split(' — ')[0]}</span> — {t.writing.label.split(' — ')[1]}</div>
        <h2 style={{
          fontFamily: "var(--serif)", fontSize: "clamp(56px, 8vw, 120px)",
          lineHeight: 0.9, letterSpacing: "-0.03em", marginBottom: 16, fontWeight: 400
        }}>
          {t.writing.h2}
        </h2>
        <p style={{color: "var(--fg-dim)", marginBottom: 48, fontSize: 18}}>{t.writing.sub}</p>
        <div className="writing-list">
          {t.writing.posts.map((p, i) => (
            <a className="writing-row" key={i} href={p.url}>
              <div className="when">{p.date}</div>
              <div>
                <div className="title">
                  {p.title}
                  <span className="sub">{p.sub}</span>
                </div>
              </div>
              <div className="read">{p.read} ↗</div>
            </a>
          ))}
        </div>
        <p style={{color: "var(--fg-faint)", marginTop: 32, fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.05em"}}>
          {t.writing.footer}
        </p>
      </div>
    </section>
  );
}

function Education({ t }) {
  return (
    <section id="education">
      <div className="wrap">
        <div className="label"><span className="num">{t.education.label.split(' — ')[0]}</span> — {t.education.label.split(' — ')[1]}</div>
        <h2 style={{
          fontFamily: "var(--serif)", fontSize: "clamp(56px, 8vw, 120px)",
          lineHeight: 0.9, letterSpacing: "-0.03em", marginBottom: 48, fontWeight: 400
        }}>
          {t.education.h2}
        </h2>
        <div className="exp-list">
          {t.education.items.map((e, i) => (
            <div className="exp-row" key={i}>
              <div className="when">{e.when}</div>
              <div className="role">{e.title}</div>
              <div className="where">
                {e.school}
                <span className="ind" style={{marginTop: 8, color: "var(--fg-dim)", fontFamily: "var(--sans)", fontSize: 14, letterSpacing: 0, textTransform: "none", lineHeight: 1.5}}>{e.desc}</span>
              </div>
              <div></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({ t }) {
  return (
    <section id="contact">
      <div className="wrap">
        <div className="label"><span className="num">{t.contact.label.split(' — ')[0]}</span> — {t.contact.label.split(' — ')[1]}</div>
        <div className="contact-grid">
          <h2>
            {t.contact.h2_a}<br/>
            <span className="it">{t.contact.h2_b}</span>
          </h2>
          <div>
            <p style={{color: "var(--fg-dim)", marginBottom: 32, fontSize: 16, maxWidth: 480}}>{t.contact.blurb}</p>
            <div className="contact-links">
              {t.contact.links.map((l, i) => (
                <a key={i} href={l.href} target={l.href.startsWith("http") ? "_blank" : ""} rel="noopener">
                  <span className="k">{l.k}</span>
                  <span className="v">{l.v}</span>
                  <span className="arr">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ t }) {
  return (
    <footer>
      <div className="wrap row">
        <div>{t.foot.left}</div>
        <div>{t.foot.mid}</div>
        <div>{t.foot.right}</div>
      </div>
    </footer>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
