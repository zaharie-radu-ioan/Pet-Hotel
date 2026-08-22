import BrandLink from "./BrandLink";

// Shared split-panel shell (form left, green hero right) for login/register.
export default function SplitLayout({ children, heroTitle, heroSubtitle }) {
  return (
    <main className="page">
      <section className="left-panel">
        <BrandLink className="brand" />
        <div className="form-container">{children}</div>
      </section>

        <section className="right-panel">
        <img
          className="split-dog-image"
          src="/design.png"
          alt="Happy dog outdoors"
        />

        {/* <a className="phone" href="tel:+407XXXXXXXX">
          &#9742;&nbsp;+40 7xx xxx xxx
        </a> */}

        <div className="hero-content">
        <h2>{heroTitle}</h2>
        <p>{heroSubtitle}</p> 
        </div>
      </section>
    </main>
  );
}
