function generate_hero_content() {
  const hero = document.getElementById("hero");
  if (!hero) return;

  hero.innerHTML = `
      <div class="hero-content">
        <h1 id="hero-title">2026 World Buddhist Conference</h1>
        <p id="hero-subtitle">
          Ancient Wisdom · A Sustainable Future | March 14–15, 2026 · Convention
          33, Prangin Mall, Penang, Malaysia
        </p>
        <a href="/static/templates/WBC.html" class="cta-button" id="cta-button">
          Learn More
        </a>
      </div>
    `;
}

function generate_contact_section() {
  const contactSection = document.getElementById("contact");
  if (!contactSection) return;

  // 清空旧内容
  contactSection.innerHTML = "";

  // Title
  const title = document.createElement("h2");
  title.textContent = "Follow Us";
  contactSection.appendChild(title);

  // Social links container
  const linksContainer = document.createElement("div");
  linksContainer.className = "social-links";
  contactSection.appendChild(linksContainer);

  // Helper function to create social link item
  function createSocialLink(href, imgSrc, label) {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "social-link";

    const icon = document.createElement("img");
    icon.className = "social-icon";
    icon.src = imgSrc;
    icon.alt = label;

    Object.assign(icon.style, {
      width: "24px",
      height: "24px",
      objectFit: "contain",
      marginRight: "8px",
    });

    const text = document.createElement("span");
    text.textContent = label;

    a.appendChild(icon);
    a.appendChild(text);
    return a;
  }

  // Add links
  linksContainer.appendChild(
    createSocialLink("https://ybam.org.my/", "/static/images/logo/YBAM_logo.jpeg", "Website")
  );

  linksContainer.appendChild(
    createSocialLink(
      "https://www.facebook.com/YBAMalaysia/?locale=zh_CN",
      "https://static.xx.fbcdn.net/rsrc.php/yx/r/e9sqr8WnkCf.ico",
      "Facebook"
    )
  );

  linksContainer.appendChild(
    createSocialLink(
      "https://www.instagram.com/ybamalaysia/",
      "https://static.cdninstagram.com/rsrc.php/v4/yI/r/VsNE-OHk_8a.png",
      "Instagram"
    )
  );

  linksContainer.appendChild(
    createSocialLink(
      "https://www.youtube.com/c/YBAMalaysia",
      "https://www.youtube.com/s/desktop/31c2c151/img/favicon_144x144.png",
      "YouTube"
    )
  );
}

function generate_footer_section() {
  const footer = document.getElementById("ybam_footer");
  if (!footer) return;

  footer.innerHTML = `
      <p id="footer-text">
        © 2024 Young Buddhist Association of Malaysia (YBAM). All Rights Reserved.
      </p>
      <p>
        <a href="https://ybam.org.my/" target="_blank" rel="noopener noreferrer">
          Young Buddhist Association of Malaysia
        </a>
      </p>
    `;
}
