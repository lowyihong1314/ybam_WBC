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
        <a href="/static/templates/WBC.html#poster" class="cta-button" id="cta-button">
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
        &nbsp;|&nbsp;
        <a href="#" id="privacy_policy_link_1">Privacy Policy</a>
        <p>ROS NO.: PPBM 0010/08</p>
      </p>
    `;

  document.getElementById("privacy_policy_link_1").onclick = () =>
    popup_ifram_modal("https://ybam.org.my/privacy-policy/");
}

function renderFooter() {
  if (document.getElementById("site-footer")) return;

  const footer = document.createElement("footer");
  footer.id = "site-footer";
  footer.style.textAlign = "center";
  footer.style.marginTop = "40px";

  footer.innerHTML = `
    <p id="footer-text">© 2024 Young Buddhist Association of Malaysia (YBAM). All rights reserved.</p>
    <p>
      Young Buddhist Association of Malaysia
      &nbsp;|&nbsp;
      <a href="#" id="privacy_policy_link_2">Privacy Policy</a>
      <p>ROS NO.: PPBM 0010/08</p>
      </p>
  `;

  document.body.appendChild(footer);

  document.getElementById("privacy_policy_link_2").onclick = () =>
    popup_ifram_modal("https://ybam.org.my/privacy-policy/");
}

function popup_ifram_modal(url) {
  // 如果 modal 已存在 → 删除旧的重新建
  const existing = document.getElementById("global_iframe_modal");
  if (existing) existing.remove();

  // ===============================
  // Overlay 遮罩层
  // ===============================
  const overlay = document.createElement("div");
  overlay.id = "global_iframe_modal";
  Object.assign(overlay.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999999,
    animation: "fadeIn 0.2s ease"
  });

  // ===============================
  // Modal 容器
  // ===============================
  const modal = document.createElement("div");
  Object.assign(modal.style, {
    width: "80%",
    height: "80%",
    background: "white",
    borderRadius: "10px",
    overflow: "hidden",
    position: "relative",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
  });

  // ===============================
  // Close Button
  // ===============================
  const closeBtn = document.createElement("div");
  closeBtn.innerHTML = "&times;";
  Object.assign(closeBtn.style, {
    position: "absolute",
    top: "10px",
    right: "15px",
    fontSize: "28px",
    cursor: "pointer",
    color: "#333",
    zIndex: 1000
  });

  closeBtn.onclick = () => overlay.remove();

  // ===============================
  // Loading Spinner
  // ===============================
  const spinner = document.createElement("div");
  spinner.id = "modal_spinner";
  Object.assign(spinner.style, {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "50px",
    height: "50px",
    border: "5px solid #eee",
    borderTop: "5px solid #5fb88f",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    zIndex: 999
  });

  // ===============================
  // Iframe
  // ===============================
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.style.border = "none";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.opacity = "0";
  iframe.style.transition = "opacity 0.3s ease";

  // iframe 加载完成 → 隐藏 spinner
  iframe.onload = () => {
    spinner.style.display = "none";
    iframe.style.opacity = "1";
  };

  // 组装 DOM
  modal.appendChild(closeBtn);
  modal.appendChild(spinner);
  modal.appendChild(iframe);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  function addModalAnimationStyles() {
    if (document.getElementById("modal_animation_styles")) return;

    const style = document.createElement("style");
    style.id = "modal_animation_styles";
    style.innerHTML = `
      @keyframes spin {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to { transform: translate(-50%, -50%) rotate(360deg); }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // CSS 动画
  addModalAnimationStyles();
}

async function get_and_generate_programme() {
  try {
    // 1. 取得後端資料
    const response = await fetch("/guest_and_member/programme");
    const programme = await response.json();

    // 2. 組裝與渲染 HTML
    document.getElementById("programme").innerHTML = `
      <section class="about" style="background:white">
        <div class="about-content">
          <h2 style="text-align:center; margin-bottom:3rem;">Conference Programme</h2>

          ${generate_programme_detail(programme.day1)}
          ${generate_programme_detail(programme.day2)}
        </div>
      </section>
    `;
  } catch (error) {
    console.error("Failed to load programme:", error);
    document.getElementById("programme").innerHTML = `
      <p style="color:red; text-align:center;">Failed to load programme data.</p>
    `;
  }
}

function generate_programme_detail(day) {
  return `
    <div style="margin-bottom: 4rem">
      <h3
        style="
          color: #2c5f2d;
          font-size: 2rem;
          margin-bottom: 2rem;
          text-align: center;
          padding: 1rem;
          background: linear-gradient(135deg, #e8f8f5 0%, #e3f2fd 100%);
          border-radius: 10px;
        "
      >
        ${day.title}
      </h3>

      <div style="display: grid; gap: 1rem">
        ${day.items.map(item => {
          const isHighlight = item.highlight;
          const isBreak = item.type === "break";

          const bg = isHighlight
            ? "linear-gradient(135deg, #e8f8f5 0%, #e3f2fd 100%)"
            : isBreak
            ? "#fff3cd"
            : "#f8f9fa";

          const border = isHighlight
            ? "4px solid #4a9fd8"
            : isBreak
            ? "4px solid #ffc107"
            : "4px solid #5fb88f";

          const titleStyle = isHighlight ? "font-weight: 600" : "";

          return `
            <div
              style="
                display: grid;
                grid-template-columns: 150px 1fr;
                gap: 1.5rem;
                padding: 1.5rem;
                background: ${bg};
                border-radius: 10px;
                border-left: ${border};
              "
            >
              <div style="font-weight: 700; color: #2c5f2d; font-size: 1.1rem">
                ${item.time}
              </div>
              <div style="color: #555; ${titleStyle}">
                ${item.title}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
