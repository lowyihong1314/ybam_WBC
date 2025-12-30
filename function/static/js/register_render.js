window.onload = async function () {
  renderLayout(); // 1. 渲染界面（header/footer/layout）
  await renderStartSelection(); // 2. 渲染表格，绑定事件
};

window.currentPrice = 0;

non_Malaysian = true;

function renderLayout() {
  const body = document.body;
  body.style.fontFamily = "Segoe UI, sans-serif";
  body.style.background = "#f8fdfb";
  body.style.margin = "0";
  body.style.padding = "0";

  const header = document.createElement("header");
  header.innerHTML = `
        <div class="header-content">
            <div class="logo-section">
                <img src="https://ybam-wordpress-media.s3.ap-southeast-1.amazonaws.com/wp-content/uploads/2024/05/03162711/ybamlogo2.png" alt="YBAM Logo"
                    onerror="this.src=''; this.alt='Logo failed to load'; this.style.display='none';">
                <span class="tagline" id="tagline">Wisdom · Compassion · Gratitude</span>
            </div>
            <nav>
                <a href="/static/templates/index.html#about">About Us</a>
                <a href="/static/templates/WBC.html">World Buddhist Conference</a>
                <a href="/static/templates/register.html">Register Now</a>
                <a href="/static/templates/index.html#contact">Contact Us</a>
            </nav>
        </div>
    `;
  document.body.appendChild(header);
}


async function addCountrySelectWithDialCode(container) {
  const countryDialCodes = await fetchCountryDialCodes();

  const label = document.createElement("label");
  label.textContent = "Country / Region *";

  const select = document.createElement("select");
  select.id = "country";
  select.name = "country";
  select.required = true;
  Object.assign(select.style, {
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
  });

  // Default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Please select a country";
  select.appendChild(defaultOption);

  // Sort country names alphabetically
  const sortedCountries = Object.keys(countryDialCodes).sort();

  for (const country of sortedCountries) {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    select.appendChild(option);
  }

  // Auto-fill dial code when country selected
  select.addEventListener("change", () => {
    const phoneInput = document.getElementById("phone");
    const selectedCountry = select.value;
    const dialCode = countryDialCodes[selectedCountry] || "";
    if (phoneInput && dialCode) {
      phoneInput.value = dialCode;
    }
  });

  // 插入到指定占位 container 中
  container.appendChild(label);
  container.appendChild(select);
}

// =======================
// ✅ 获取国家与电话区号 API
// =======================
async function fetchCountryDialCodes() {
  try {
    const res = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,idd"
    );

    const data = await res.json();

    const result = {};
    data.forEach((country) => {
      const name = country.name?.common;
      const root = country.idd?.root;
      const suffixes = country.idd?.suffixes;

      if (name && root && Array.isArray(suffixes) && suffixes.length > 0) {
        result[name] = root + suffixes[0];
      }
    });
    return result;
  } catch (err) {
    console.error("Failed to fetch countries:", err);
    return {
      Malaysia: "+60",
      Singapore: "+65",
      China: "+86",
    }; // fallback
  }
}

// 工具函数：字段创建
function addInput(
  form,
  labelText,
  id,
  required = false,
  placeholder = "",
  type = "text"
) {
  const label = document.createElement("label");
  label.innerHTML = `${labelText} ${
    required ? '<span style="color:red">*</span>' : ""
  }`;

  const input = document.createElement("input");
  input.type = type;
  input.id = id;
  input.name = id;
  input.placeholder = placeholder;
  input.required = required;

  Object.assign(input.style, {
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
  });

  form.appendChild(label);
  form.appendChild(input);
}

function addSubmitButton(form, buttonText = "提交报名 Form Submission") {
  const button = document.createElement("button");
  button.type = "submit";
  button.id = "submitBtn";
  button.textContent = buttonText;

  Object.assign(button.style, {
    width: "100%",
    padding: "10px",
    background: "#5fb88f",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
  });

  form.appendChild(button);
}

function addDocTypeAndNumberAndAge(form, type) {
  let isMalaysian = false; // true = Malaysian, false = Non-Malaysian

  // =====================================================
  // GLOBAL INPUT STYLE (applied via helper)
  // =====================================================
  function applyInputStyle(el) {
    Object.assign(el.style, {
      width: "100%",
      padding: "0.9rem 1.2rem",
      border: "2px solid #e0e0e0",
      borderRadius: "10px",
      fontSize: "1rem",
      background: "#fafafa",
      fontFamily: "inherit",
      transition: "border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease",
      marginBottom: "12px"
    });

    el.addEventListener("focus", () => {
      el.style.borderColor = "#5fb88f";
      el.style.boxShadow = "0 0 0 3px rgba(95,184,143,0.1)";
      el.style.background = "white";
    });

    el.addEventListener("blur", () => {
      el.style.borderColor = "#e0e0e0";
      el.style.boxShadow = "none";
      el.style.background = "#fafafa";
    });
  }

  // =====================================================
  // Pure Logic: Detect nationality
  // =====================================================
  function detectNationality(docType, docNoRaw) {
    if (docType !== "NRIC") return false;
    if (!/^\d{6,}$/.test(docNoRaw)) return false;
    return true;
  }

  // =====================================================
  // Pure Logic: Pricing
  // =====================================================
  function calculatePrice(type, isMalaysian) {
    const table = {
      normal: { mal: 100, foreign: 200 },
      paper: { mal: 500, foreign: 1000 }
    };

    const p = table[type] || { mal: 0, foreign: 0 };

    return {
      malaysianPrice: p.mal,
      foreignPrice: p.foreign,
      selectedPrice: isMalaysian ? p.mal : p.foreign,
      needsUpload: type === "paper"
    };
  }

  // =====================================================
  // Pure Logic: Age from NRIC
  // =====================================================
  function getAgeFromNRIC(raw) {
    if (!/^\d{6}/.test(raw)) return "";

    const yy = +raw.slice(0, 2);
    const mm = +raw.slice(2, 4);
    const dd = +raw.slice(4, 6);

    const year = yy <= 24 ? 2000 + yy : 1900 + yy;
    const birthday = new Date(year, mm - 1, dd);
    if (isNaN(birthday.getTime())) return "";

    let age = new Date().getFullYear() - year;
    const thisYearBirthday = new Date(new Date().getFullYear(), mm - 1, dd);
    if (new Date() < thisYearBirthday) age--;

    return age >= 0 && age < 150 ? age : "";
  }

  // =====================================================
  // UI Updaters
  // =====================================================
  function renderPriceUI(data) {
    malDisplay.textContent = `RM${data.malaysianPrice}`;
    frDisplay.textContent = `RM${data.foreignPrice}`;

    hiddenAmount.value = data.selectedPrice;
    hiddenCurrency.value = "RM";
    hiddenMYR.value = data.selectedPrice;
  }

  function highlightPrice(isMalaysian) {
    const [malBox, foreBox] = priceContainer.querySelectorAll("div");

  function setDefault(box) {
    Object.assign(box.style, {
      opacity: "0.7",
      background: "#ffffff",
      border: "1px solid #e5e5e5",
      borderRadius: "10px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      transform: "none",
      transition: "all 0.3s ease",
      padding:"5px"
    });
  }

  function setHighlight(box) {
    Object.assign(box.style, {
      opacity: "1",
      background: "#ffffff",
      border: "1px solid #5fb88f",
      borderRadius: "10px", // ← 修正 & 美化
      boxShadow: "0 6px 20px rgba(95,184,143,0.25)",
      transform: "translateY(-2px)",
      transition: "all 0.3s ease",
      padding:"5px"
    });
  }

    // Reset both
    setDefault(malBox);
    setDefault(foreBox);

    // Highlight selected
    setHighlight(isMalaysian ? malBox : foreBox);
  }

  function updateFlagUI(isMalaysian) {
    malaysiaFlag.style.opacity = isMalaysian ? "1" : "0.3";
    foreignFlag.style.opacity = isMalaysian ? "0.3" : "1";
  }

  function renderUploadUI(showUpload) {
    if (!showUpload) {
      fileInputContainer.style.display = "none";
      fileInputContainer.innerHTML = "";
      return;
    }

    fileInputContainer.style.display = "block";
    fileInputContainer.innerHTML = `
      <label style="font-weight:bold;">Upload Paper PDF</label><br>
      <input type="file" id="paper_files" name="paper_files" accept="application/pdf" multiple>
      <p style="font-size:12px;color:#555;margin-top:4px;">* Multiple PDF files allowed</p>
    `;

    const uploadInput = fileInputContainer.querySelector("input");
    applyInputStyle(uploadInput); // beautiful file input
  }

  // =====================================================
  // Main refresh logic
  // =====================================================
  function refreshUI() {
    const docType = docTypeSelect.value;
    const raw = docNoInput.value.replace(/\D/g, "");

    isMalaysian = detectNationality(docType, raw);
    const priceInfo = calculatePrice(type, isMalaysian);

    // ⭐ 改成全局变量
    window.currentPrice = priceInfo.selectedPrice;

    renderPriceUI(priceInfo);
    highlightPrice(isMalaysian);
    updateFlagUI(isMalaysian);
    renderUploadUI(priceInfo.needsUpload);

    ageInput.value = docType === "NRIC" ? getAgeFromNRIC(raw) : "";
  }


  // Document Type
  const docTypeSelect = document.createElement("select");
  docTypeSelect.innerHTML = `
    <option value="Passport">Passport</option>
    <option value="NRIC">NRIC (Malaysia)</option>
  `;
  docTypeSelect.id = "doc_type";
  docTypeSelect.name = "doc_type";   // ⭐ 必须加
  applyInputStyle(docTypeSelect);
  form.appendChild(docTypeSelect);

  // Document Number
  const docNoInput = document.createElement("input");
  docNoInput.id = "doc_no";
  docNoInput.name = "doc_no";        // ⭐ 必须加
  docNoInput.placeholder = "991231-01-1234 or passport";
  applyInputStyle(docNoInput);
  form.appendChild(docNoInput);

  // Age
  const ageInput = document.createElement("input");
  ageInput.type = "number";
  ageInput.id = "age";
  ageInput.name = "age";             // ⭐ 必须加
  ageInput.placeholder = "Age auto-filled for NRIC";
  applyInputStyle(ageInput);
  form.appendChild(ageInput);


  // Flag UI
  const flagContainer = document.createElement("div");
  Object.assign(flagContainer.style, {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
    marginBottom: "10px"
  });

  const malaysiaFlag = document.createElement("span");
  malaysiaFlag.textContent = "🇲🇾 Malaysian";

  const foreignFlag = document.createElement("span");
  foreignFlag.textContent = "🌍 Non-Malaysian";

  flagContainer.append(malaysiaFlag, foreignFlag);
  form.appendChild(flagContainer);

  // Price UI
  const priceContainer = document.createElement("div");
  Object.assign(priceContainer.style, {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    padding: "15px",
    background: "#fafafa",
    borderRadius: "10px",
    border: "1px solid #ddd",
    marginBottom: "15px"
  });

  priceContainer.innerHTML = `
    <div><h4>Malaysian</h4><p id="malaysia_price_display"></p></div>
    <div><h4>Non-Malaysian</h4><p id="foreign_price_display"></p></div>
  `;

  const malDisplay = priceContainer.querySelector("#malaysia_price_display");
  const frDisplay = priceContainer.querySelector("#foreign_price_display");

  form.appendChild(priceContainer);

  // Upload container
  const fileInputContainer = document.createElement("div");
  fileInputContainer.style.display = "none";
  form.appendChild(fileInputContainer);

  // Hidden fields
  const hiddenAmount = document.createElement("input");
  const hiddenCurrency = document.createElement("input");
  const hiddenMYR = document.createElement("input");

  hiddenAmount.type = hiddenCurrency.type = hiddenMYR.type = "hidden";

  form.append(hiddenAmount, hiddenCurrency, hiddenMYR);

  // =====================================================
  // Bind events
  // =====================================================
  docTypeSelect.addEventListener("change", refreshUI);
  docNoInput.addEventListener("input", refreshUI);

  // =====================================================
  // Initial Render
  // =====================================================
  refreshUI();
}


function renderStartSelection() {
  let highlight = null; // ⭐ 当前高亮按钮类型："normal" | "paper" | null

  const container = document.createElement("div");
  container.style.maxWidth = "700px";
  container.style.margin = "30px auto";
  container.style.padding = "20px";
  container.style.background = "#fff";
  container.style.borderRadius = "10px";
  container.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
  container.id = "starter-container";

  const title = document.createElement("h2");
  title.textContent = "Choose Registration Type";
  title.style.textAlign = "center";

  const btnWrapper = document.createElement("div");
  btnWrapper.style.display = "flex";
  btnWrapper.style.justifyContent = "space-around";
  btnWrapper.style.marginTop = "20px";
  btnWrapper.style.gap = "15px";

  // ======================================================
  // 按钮基础外观
  // ======================================================
  function makeButtonStyle(btn) {
    Object.assign(btn.style, {
      padding: "12px 20px",
      fontSize: "16px",
      borderRadius: "10px",
      border: "2px solid #5fb88f",
      background: "#fff",
      color: "#5fb88f",
      cursor: "pointer",
      flex: "1",
      transition: "0.25s ease",
      textAlign: "center"
    });
  }

  // ======================================================
  // 按钮点亮逻辑：只依赖 highlight 变量
  // ======================================================
  function updateHighlightUI() {
    const mapping = {
      normal: btnNormal,
      paper: btnPaper
    };

    // 全部重置为普通状态
    [btnNormal, btnPaper].forEach(btn => {
      btn.style.background = "#fff";
      btn.style.color = "#5fb88f";
      btn.style.boxShadow = "none";
    });

    // 如果有高亮对象 → 点亮
    if (highlight !== null) {
      const activeBtn = mapping[highlight];
      activeBtn.style.background = "#5fb88f";
      activeBtn.style.color = "white";
      activeBtn.style.boxShadow = "0 4px 14px rgba(95,184,143,0.35)";
    }
  }

  // ======================================================
  // 按钮定义
  // ======================================================
  const btnNormal = document.createElement("button");
  btnNormal.textContent = "Normal Participant";
  makeButtonStyle(btnNormal);

  const btnPaper = document.createElement("button");
  btnPaper.textContent = "Paper Presentation";
  makeButtonStyle(btnPaper);

  btnWrapper.appendChild(btnNormal);
  btnWrapper.appendChild(btnPaper);
  container.appendChild(title);
  container.appendChild(btnWrapper);
  document.body.appendChild(container);

  // ======================================================
  // 点击事件
  // ======================================================
  btnNormal.addEventListener("click", () => {
    highlight = "normal";   // ⭐ 更新高亮变量
    updateHighlightUI();    // ⭐ 点亮按钮
    startFormWithType("normal");
  });

  btnPaper.addEventListener("click", () => {
    highlight = "paper";    // ⭐ 更新高亮变量
    updateHighlightUI();    // ⭐ 点亮按钮
    startFormWithType("paper");
  });
}


function isMalaysian() {
  const flagContainer = document.getElementById("flag_container");
  if (!flagContainer) return false;

  // 如果 Malaysia flag 不透明 = Malaysian
  const malaysiaFlag = flagContainer.querySelector("span:first-child");
  return malaysiaFlag.style.opacity === "1";
}

async function startFormWithType(type) {

  // 重新渲染表单
  await renderFormAndBind(type);
  

  // 给浏览器一点点时间渲染 DOM
  setTimeout(() => {
    const priceCheckboxes = [...document.querySelectorAll(".price_option")];

    // 清空 checkbox
    priceCheckboxes.forEach(cb => cb.checked = false);

    const malaysian = isMalaysian();

    let targetValues = [];

    if (type === "normal") {
      targetValues = malaysian ? ["100"] : ["200"];
    } else if (type === "paper") {
      targetValues = malaysian ? ["500"] : ["1000"];
    }

    // 勾选类型对应的项目
    priceCheckboxes.forEach(cb => {
      if (targetValues.includes(cb.value)) {
        cb.checked = true;
      }
    });

    // 触发 UI 更新
    priceCheckboxes.forEach(cb => cb.dispatchEvent(new Event("change")));
  }, 50);
  renderFooter();

}


async function renderFormAndBind(type) {

  // ⭐ 查找是否已有 container
  let container = document.querySelector(".container");

  if (!container) {
    // 第一次创建 container
    container = document.createElement("div");
    container.className = "container";
    Object.assign(container.style, {
      maxWidth: "700px",
      margin: "30px auto",
      padding: "20px",
      background: "#fff",
      borderRadius: "10px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    });
    document.body.appendChild(container);
  } else {
    // ⭐ 再次渲染时：清空旧内容
    container.innerHTML = "";
  }

  // ====== 以下完全保持你原本逻辑 ======

  const title = document.createElement("h2");
  title.id = "form_title";

  if (type === "normal") {
    title.textContent = "Normal Participant Registration";
  } else if (type === "paper") {
    title.textContent = "Paper Presentation Registration";
  } else {
    title.textContent = "Conference Registration";
  }

  title.style.textAlign = "center";
  title.style.color = "#2c5f2d";

  const subtitle = document.createElement("p");
  subtitle.textContent =
    "Please fill in the required information to complete your registration";
  subtitle.style.textAlign = "center";
  subtitle.style.color = "#555";

  const form = document.createElement("form");
  form.id = "registration-form";
  form.enctype = "multipart/form-data";

  addInput(form, "Full Name", "name", true, "Enter your full name");
  addInput(form, "Chinese Name", "name_cn", false, "If applicable");

  addDocTypeAndNumberAndAge(form,type);

  const malaysiaPriceContainer = document.createElement("div");
  malaysiaPriceContainer.id = "malaysia_price_placeholder";
  Object.assign(malaysiaPriceContainer.style, {
    margin: "15px 0",
    padding: "10px",
    borderRadius: "8px",
  });
  form.appendChild(malaysiaPriceContainer);

  addInput(form, "Email Address", "email", true, "example@email.com", "email");

  const countrySelectContainer = document.createElement("div");
  countrySelectContainer.id = "country-select-container";
  form.appendChild(countrySelectContainer);

  addCountrySelectWithDialCode(countrySelectContainer);

  const phoneLabel = document.createElement("label");
  phoneLabel.innerHTML = `Phone Number <span style="color:red">*</span>`;
  const phoneInput = document.createElement("input");
  phoneInput.type = "tel";
  phoneInput.id = "phone";
  phoneInput.name = "phone";
  phoneInput.required = true;
  phoneInput.placeholder = "e.g. +60 123456789";
  Object.assign(phoneInput.style, {
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
  });
  form.appendChild(phoneLabel);
  form.appendChild(phoneInput);
// ====== Paper Presentation extra fields ======
if (type === "paper") {
    const paperSection = document.createElement("div");
    Object.assign(paperSection.style, {
        background: "#f7fcff",
        border: "1px solid #d1e8f5",
        borderRadius: "10px",
        padding: "15px",
        marginTop: "20px",
        marginBottom: "20px",
        lineHeight: "1.6"
    });

    const paperTitleLabel = document.createElement("label");
    paperTitleLabel.innerHTML = `Paper Title <span style="color:red">*</span>`;
    
    const paperTitleInput = document.createElement("input");
    paperTitleInput.type = "text";
    paperTitleInput.name = "paper_title";
    paperTitleInput.required = true;
    paperTitleInput.placeholder = "Enter your paper title";
    Object.assign(paperTitleInput.style, { width: "100%", padding: "8px", marginBottom: "12px" });

    const abstractLabel = document.createElement("label");
    abstractLabel.innerHTML = `Abstract <span style="color:red">*</span>`;

    const abstractTextarea = document.createElement("textarea");
    abstractTextarea.name = "abstract";
    abstractTextarea.required = true;
    abstractTextarea.placeholder = "Enter your abstract (200–300 words recommended)";
    Object.assign(abstractTextarea.style, {
        width: "100%",
        height: "150px",
        padding: "8px",
        marginBottom: "12px",
        resize: "vertical"
    });

    paperSection.appendChild(paperTitleLabel);
    paperSection.appendChild(paperTitleInput);
    paperSection.appendChild(abstractLabel);
    paperSection.appendChild(abstractTextarea);

    form.appendChild(paperSection);
}

  addInput(form, "Emergency Contact", "emergency_contact", false, "Example: Jane, 87654321");
  addInput(form, "Medical Information", "medical_information", false, "Example: None");

  addConferenceInfoSection(form);
  // ============================
  // Conference Disclaimer Section
  // ============================
  const disclaimerBox = document.createElement("div");
  Object.assign(disclaimerBox.style, {
    background: "#f9f9f9",
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid #e0e0e0",
    marginTop: "25px",
    lineHeight: "1.6",
    fontSize: "0.95rem",
    color: "#444"
  });

  disclaimerBox.innerHTML = `
    <p>
      By registering for the <strong>World Buddhist Conference</strong> (“the Conference”), 
      participants acknowledge that the Organisers may make reasonable adjustments to the 
      programme, schedule, speakers, or venue where necessary, and may manage attendance to 
      ensure a safe, respectful, and smooth experience for all. The Organisers may also 
      record or photograph elements of the event for archival or promotional use. Any such 
      decisions will be made with due consideration for participants and the overall 
      integrity of the Conference.
    </p>

    <label style="margin-top:12px; display:flex; align-items:center; gap:8px;">
      <input type="checkbox" id="agree_disclaimer">
      <span>I have read and agree to the above terms</span>
    </label>
  `;

  form.appendChild(disclaimerBox);

  // ============================
  // Submit button (initially hidden)
  // ============================
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Submit Registration";
  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const msgDiv = document.getElementById("message");
    msgDiv.textContent = "提交中...";
    msgDiv.style.color = "#555";

    const form = document.getElementById("registration-form");
    const formData = new FormData();

    // 基础字段（全部从 form.elements 取）
    formData.append("name", form.elements["name"]?.value || "");
    formData.append("name_cn", form.elements["name_cn"]?.value || "");
    formData.append("email", form.elements["email"]?.value || "");
    formData.append("phone", form.elements["phone"]?.value || "");
    formData.append("country", form.elements["country"]?.value || "");
    formData.append("age", form.elements["age"]?.value || "");
    formData.append("emergency_contact", form.elements["emergency_contact"]?.value || "");
    formData.append("medical_information", form.elements["medical_information"]?.value || "");
    formData.append("doc_type", form.elements["doc_type"]?.value || "");
    formData.append("doc_no", form.elements["doc_no"]?.value || "");

    // Paper extras
    const paperTitleEl = form.elements["paper_title"];
    const abstractEl = form.elements["abstract"];
    if (paperTitleEl && abstractEl) {
      formData.append("paper_title", paperTitleEl.value.trim());
      formData.append("abstract", abstractEl.value.trim());
    }

    // Price
    formData.append("payment_amount", window.currentPrice);

    // Payment doc
    const fileInput = form.elements["payment_doc"];
    if (fileInput && fileInput.files.length > 0) {
      const processed = await getProcessedFile(fileInput.files[0]);
      if (processed) formData.append("payment_doc", processed);
    }

    // Paper files
    let isPaperPresentation = false;

    // Paper files
    const paperFiles = form.elements["paper_files"];
    if (paperFiles && paperFiles.files.length > 0) {
      for (let f of paperFiles.files) formData.append("paper_files", f);
      formData.append("paper_presentation", "true");
      isPaperPresentation = true;
    } else {
      formData.append("paper_presentation", "false");
    }
    // 发送请求
    try {
      const res = await fetch("/wbc/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.data) {
        const record = data.data;

        if (isPaperPresentation) {
          const messageCn = encodeURIComponent(
            "资料已成功提交。我们的工作人员将尽快审核您的论文材料，并在审核通过后通过电子邮件向您发送付款链接，请耐心等待。"
          );

          const messageEn = encodeURIComponent(
            "Your submission has been received successfully. Our staff will review your paper materials and send you the payment link by email once the review is completed. Please kindly wait."
          );

          window.location.href =
            `/static/templates/thankyou.html?message_cn=${messageCn}&message_en=${messageEn}`;
          return;
        }

        // 非 paper presentation，正常跳支付
        const amountMYR = record.payment_amount;
        const id = record.id;
        const name = encodeURIComponent(record.name);
        const email = encodeURIComponent(record.email);

        window.location.href =
          `/payment_gateway/pay?amount_myr=${amountMYR}&id=${id}&name=${name}&email=${email}`;
        return;
      }

      msgDiv.textContent = "❌ 提交失败：" + (data.error || "未知错误");
      msgDiv.style.color = "red";

    } catch (err) {
      msgDiv.textContent = "❌ 网络错误，请稍后重试。";
      msgDiv.style.color = "red";
    }
  });

  Object.assign(submitBtn.style, {
    marginTop: "20px",
    padding: "12px 20px",
    width: "100%",
    borderRadius: "10px",
    border: "none",
    background: "#5fb88f",
    color: "white",
    fontSize: "1rem",
    cursor: "pointer",
    display: "none", // ⭐ 默认隐藏
    transition: "0.3s ease"
  });

  // 显示按钮
  const agreeCheckbox = disclaimerBox.querySelector("#agree_disclaimer");
  agreeCheckbox.addEventListener("change", () => {
    submitBtn.style.display = agreeCheckbox.checked ? "block" : "none";
  });

  form.appendChild(submitBtn);


  const msgDiv = document.createElement("div");
  msgDiv.id = "message";
  msgDiv.style.textAlign = "center";
  msgDiv.style.marginTop = "15px";

  container.appendChild(title);
    // ====== Paper Presentation: Important Dates ======
  if (type === "paper") {
    const importantBox = document.createElement("div");

    Object.assign(importantBox.style, {
      background: "#f8fffa",
      border: "1px solid #d6f2e3",
      borderRadius: "10px",
      padding: "15px",
      marginTop: "15px",
      marginBottom: "20px",
      lineHeight: "1.6",
      color: "#2c5f2d",
      boxShadow: "0 1px 6px rgba(0,0,0,0.05)"
    });

    importantBox.innerHTML = `
      <h3 style="margin-top:0; color:#2c5f2d; font-size:1.2rem;">Important Dates</h3>
      <ul style="list-style: none; padding-left: 0;">
        <li><strong>Full Paper Submission Deadline:</strong> 11 January 2026</li>
        <li><strong>Notification of Acceptance:</strong> 15 February 2026</li>
        <li><strong>Camera-Ready Paper Due:</strong> 1 March 2026</li>
        <li><strong>Final Registration Deadline:</strong> 1 March 2026</li>
        <li><strong>Conference Dates:</strong> 14 – 15 March 2026</li>
      </ul>
      <p style="margin-top:10px; font-size:0.9rem; color:#3d6b59;">
        All deadlines are at <strong>23:59 (UTC+8)</strong>.
      </p>
    `;

    container.appendChild(importantBox);
  }

  container.appendChild(subtitle);
  container.appendChild(form);
  container.appendChild(msgDiv);
}


function addConferenceInfoSection(form) {
  const wrapper = document.createElement("div");
  wrapper.style.margin = "20px 0";
  wrapper.style.padding = "15px";
  wrapper.style.border = "1px solid #ddd";
  wrapper.style.borderRadius = "8px";
  wrapper.style.background = "#fafafa";

  wrapper.innerHTML = `
    <h3 style="margin-top:0;color:#2c5f2d;">Conference Information</h3>

    <p><strong>Theme:</strong> Artificial Intelligence, Buddhism & Buddhist Life</p>

    <p><strong>Refund Policy:</strong><br>
    All registrations are final and non-refundable; for any exceptional refund request, please contact us at 
    <a href="mailto:wbc@ybam.org.my">wbc@ybam.org.my</a>.
    </p>

    <p><strong>Contact:</strong><br>
    Email: <a href="mailto:wbc@ybam.org.my">wbc@ybam.org.my</a><br>
    Address / Phone (optional)
    </p>
  `;

  form.appendChild(wrapper);
}



async function getProcessedFile(file) {
  if (!file) return null;

  // 压缩图像文件
  if (file.type.startsWith("image/")) {
    try {
      const compressedDataURL = await compressImage(file, 800, 0.7);
      return dataURLtoBlob(compressedDataURL, file.name);
    } catch (err) {
      return file; // 压缩失败 fallback 原图
    }
  }

  // 其他类型直接上传
  return file;
}

function dataURLtoBlob(dataURL, fileName = "upload.jpg") {
  const [meta, content] = dataURL.split(",");
  const mime = meta.match(/:(.*?);/)[1];
  const binary = atob(content);
  const u8arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) u8arr[i] = binary.charCodeAt(i);
  return new File([u8arr], fileName, { type: mime });
}

function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function renderPDFPreview(file) {
  return new Promise((resolve, reject) => {
    const fileURL = URL.createObjectURL(file);

    const embed = document.createElement("embed");
    embed.src = fileURL;
    embed.type = "application/pdf";
    embed.width = "100%";
    embed.height = "400px";
    embed.style.borderRadius = "8px";

    // 测试是否加载成功
    embed.onerror = () => reject("PDF 加载失败");

    // 有些浏览器不触发 onload，只能直接 resolve
    setTimeout(() => resolve(embed), 500);
  });
}

function createPreviewImage(src) {
  const img = document.createElement("img");
  Object.assign(img.style, {
    display: "block",
    margin: "10px auto",
    maxWidth: "100%",
    maxHeight: "600px",
    objectFit: "cover",
    objectPosition: "center",
    borderRadius: "8px",
  });
  img.src = src;
  img.alt = "预览图像";
  return img;
}

// function bindFormSubmit() {
//   const form = document.getElementById("registration-form");
//   const msgDiv = document.getElementById("message");

//   if (!form) return;

//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();
//     msgDiv.textContent = "提交中...";
//     msgDiv.style.color = "#555";

//     const formData = new FormData();

//     // ============================
//     // 基础信息
//     // ============================
//     formData.append("name", getVal("name"));
//     formData.append("name_cn", getVal("name_cn"));
//     formData.append("email", getVal("email"));
//     formData.append("phone", getVal("phone"));
//     formData.append("country", getVal("country"));
//     formData.append("age", getVal("age"));
//     formData.append("emergency_contact", getVal("emergency_contact"));
//     formData.append("medical_information", getVal("medical_information"));
//     formData.append("doc_type", getVal("doc_type"));
//     formData.append("doc_no", getVal("doc_no"));
//     // ============================
//     // Paper Presentation extra fields
//     // ============================
//     const paperTitleEl = document.getElementById("paper_title");
//     const abstractEl = document.getElementById("abstract");

//     if (paperTitleEl && abstractEl) {
//       formData.append("paper_title", paperTitleEl.value.trim());
//       formData.append("abstract", abstractEl.value.trim());
//     }
//     // ============================
//     // 价格收集 — 从 hidden input
//     // ============================
//     formData.append(
//       "payment_amount",
//       document.getElementById("price").value
//     );
//     // formData.append(
//     //   "payment_currency",
//     //   document.getElementById("payment_currency").value
//     // );
//     // formData.append(
//     //   "payment_amount_myr",
//     //   document.getElementById("payment_amount_myr").value
//     // );

//     // ============================
//     // 付款凭证（JPEG / PDF）
//     // ============================
//     const fileInput = document.getElementById("payment_doc");
//     if (fileInput && fileInput.files.length > 0) {
//       const processed = await getProcessedFile(fileInput.files[0]);
//       if (processed) formData.append("payment_doc", processed);
//     }

//     // ============================
//     // 论文 PDF — 多文件提交
//     // ============================
//     const paperFiles = document.getElementById("paper_files");
//     if (paperFiles && paperFiles.files.length > 0) {
//       for (let f of paperFiles.files) {
//         formData.append("paper_files", f);
//       }
//       formData.append("paper_presentation", "true");
//     } else {
//       formData.append("paper_presentation", "false");
//     }

//     // ============================
//     // 发送请求
//     // ============================
//     try {
//       const res = await fetch("/wbc/register", {
//         method: "POST",
//         body: formData,
//       });

//       const data = await res.json();

//       // =====================
//       // 成功后跳转
//       // =====================
//       if (data.success && data.data) {
//         const record = data.data;

//         const amountMYR = record.payment_amount_myr;
//         const id = record.id;
//         const name = encodeURIComponent(record.name);
//         const email = encodeURIComponent(record.email);

//         window.location.href = `/payment_gateway/pay?amount_myr=${amountMYR}&id=${id}&name=${name}&email=${email}`;
//         return;
//       }

//       msgDiv.textContent = "❌ 提交失败：" + (data.error || "未知错误");
//       msgDiv.style.color = "red";
//     } catch (err) {
//       msgDiv.textContent = "❌ 网络错误，请稍后重试。";
//       msgDiv.style.color = "red";
//     }
//   });

//   function getVal(id) {
//     return document.getElementById(id)?.value || "";
//   }
// }
