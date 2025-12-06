window.onload = async function () {
  renderLayout(); // 1. 渲染界面（header/footer/layout）
  await renderFormAndBind(); // 2. 渲染表格，绑定事件
  bindFormSubmit(); // 3. 提交表格逻辑
  renderFooter();
};

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
                <a href="#about">About Us</a>
                <a href="/static/templates/WBC.html">World Buddhist Conference</a>
                <a href="/static/templates/register.html">Register Now</a>
                <a href="#contact">Contact Us</a>
            </nav>
        </div>
    `;
  document.body.appendChild(header);
}

function renderFooter() {
  const footer = document.createElement("footer");
  footer.style.textAlign = "center";
  footer.style.marginTop = "40px";
  footer.style.color = "#ffffffff";
  footer.innerHTML = `
        <p id="footer-text">© 2024 Young Buddhist Association of Malaysia (YBAM). All rights reserved.</p>
        <p>Young Buddhist Association of Malaysia</p>
    `;
  document.body.appendChild(footer);
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

function addSubmitButton(form, buttonText = "提交报名") {
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

// function addDocTypeAndNumberAndAge(form) {
//   let non_Malaysian = true; // 本函数内部变量

//   // === 证件类型 ===
//   const typeLabel = document.createElement("label");
//   typeLabel.textContent = "证件类型";

//   const typeSelect = document.createElement("select");
//   typeSelect.id = "doc_type";
//   typeSelect.name = "doc_type";

//   Object.assign(typeSelect.style, {
//     width: "100%",
//     padding: "8px",
//     marginBottom: "10px",
//   });

//   const passportOption = document.createElement("option");
//   passportOption.value = "Passport";
//   passportOption.textContent = "Passport";

//   const nricOption = document.createElement("option");
//   nricOption.value = "NRIC";
//   nricOption.textContent = "NRIC (Malaysia)";

//   typeSelect.appendChild(passportOption);
//   typeSelect.appendChild(nricOption);

//   form.appendChild(typeLabel);
//   form.appendChild(typeSelect);

//   // === 证件号码 ===
//   const numberLabel = document.createElement("label");
//   numberLabel.textContent = "证件号码";

//   const numberInput = document.createElement("input");
//   numberInput.type = "text";
//   numberInput.id = "doc_no";
//   numberInput.name = "doc_no";
//   numberInput.placeholder = "991231-01-1234 / AB1234567";

//   Object.assign(numberInput.style, {
//     width: "100%",
//     padding: "8px",
//     marginBottom: "10px",
//   });

//   form.appendChild(numberLabel);
//   form.appendChild(numberInput);

//   // === 年龄 ===
//   const ageLabel = document.createElement("label");
//   ageLabel.textContent = "Age";

//   const ageInput = document.createElement("input");
//   ageInput.type = "number";
//   ageInput.id = "age";
//   ageInput.name = "age";

//   Object.assign(ageInput.style, {
//     width: "100%",
//     padding: "8px",
//     marginBottom: "10px",
//   });

//   form.appendChild(ageLabel);
//   form.appendChild(ageInput);

//   // === 国籍 Flag 容器 ===
//   const flagContainer = document.createElement("div");
//   flagContainer.id = "flag_container";
//   Object.assign(flagContainer.style, {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: "10px 5px",
//     marginTop: "10px",
//     borderRadius: "8px",
//   });

//   // 🇲🇾 Malaysia Flag
//   const malaysiaFlag = document.createElement("span");
//   malaysiaFlag.innerHTML = "🇲🇾 Malaysian";
//   malaysiaFlag.style.opacity = "0.3"; // 默认灰白

//   // 🌍 Foreigner Flag
//   const foreignFlag = document.createElement("span");
//   foreignFlag.innerHTML = "🌍 Foreigners";
//   foreignFlag.style.opacity = "1"; // 默认亮（因为 non_Malaysian = true）

//   flagContainer.appendChild(malaysiaFlag);
//   flagContainer.appendChild(foreignFlag);

//   // 插入到价格区域上方
//   form.appendChild(flagContainer);

//   // === 价格容器 ===
//   const priceContainer = document.createElement("div");
//   priceContainer.id = "price_container";

//   Object.assign(priceContainer.style, {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: "20px",
//     padding: "15px",
//     marginTop: "10px",
//     border: "1px solid #ccc",
//     borderRadius: "10px",
//     background: "#fafafa",
//   });

//   // 左侧：马来西亚价格
//   const malaysiaBox = document.createElement("div");
//   malaysiaBox.innerHTML = `
//       <h4 style="margin-top:0;">Malaysian</h4>
//       <label><input type="checkbox" class="price_option" value="150" data-currency="RM"> Normal Participant (RM150)</label><br>
//       <label><input type="checkbox" class="price_option" value="500" data-currency="RM"> Paper Presentation (RM500)</label>
//   `;
//   malaysiaBox.style.borderRight = "1px solid #ddd";
//   malaysiaBox.style.paddingRight = "10px";
//   // === 获取实时汇率 ===
//   // === 获取实时汇率 ===
//   let usd_rate = null; // 保存汇率用于后面转换

//   async function updateUSDinMYR() {
//     try {
//       const res = await fetch("/wbc/rate");
//       const rates = await res.json();
//       const usdRate = rates.find((r) => r.currency === "1 US Dollar");
//       if (!usdRate) return;

//       usd_rate = usdRate.selling_tt_od; // 保存汇率

//       const rm50 = Math.round(50 * usd_rate);
//       const rm200 = Math.round(200 * usd_rate);

//       foreignBox.querySelector(
//         ".usd50_text"
//       ).textContent = `50 USD ≈ RM${rm50}`;
//       foreignBox.querySelector(
//         ".usd200_text"
//       ).textContent = `200 USD ≈ RM${rm200}`;
//     } catch (err) {
//       console.warn("获取汇率失败", err);
//     }
//   }

//   // 页面渲染后执行
//   updateUSDinMYR();

//   // 右侧：外国人价格
//   const foreignBox = document.createElement("div");
//   foreignBox.style.paddingLeft = "10px";

//   foreignBox.innerHTML = `
//       <h4 style="margin-top:0;">Foreigners</h4>
//       <label class="usd50">
//         <input type="checkbox" class="price_option" value="50" data-currency="USD">
//         Normal Participant (<span class="usd50_text">50 USD</span>)
//       </label><br>
//       <label class="usd200">
//         <input type="checkbox" class="price_option" value="200" data-currency="USD">
//         Paper Presentation (<span class="usd200_text">200 USD</span>)
//       </label>
//   `;

//   priceContainer.appendChild(malaysiaBox);
//   priceContainer.appendChild(foreignBox);
//   form.appendChild(priceContainer);

//   // 再去选 checkbox，再绑事件，再调用汇率更新
//   const priceCheckboxes = priceContainer.querySelectorAll(".price_option");

//   // checkbox 互斥 + 触发上传区显示
//   priceCheckboxes.forEach((cb) => {
//     cb.addEventListener("change", () => {
//       if (cb.checked) {
//         priceCheckboxes.forEach((other) => {
//           if (other !== cb) other.checked = false;
//         });
//       }
//       togglePaperUpload();
//     });
//   });

//   // 最后再调用汇率更新（此时 foreignBox / span 都已经在 DOM 里）
//   updateUSDinMYR();
//   form.appendChild(priceContainer);

//   const hiddenPaymentAmount = document.createElement("input");
//   hiddenPaymentAmount.type = "hidden";
//   hiddenPaymentAmount.id = "payment_amount";
//   hiddenPaymentAmount.name = "payment_amount";

//   const hiddenPaymentCurrency = document.createElement("input");
//   hiddenPaymentCurrency.type = "hidden";
//   hiddenPaymentCurrency.id = "payment_currency";
//   hiddenPaymentCurrency.name = "payment_currency";

//   const hiddenPaymentMYR = document.createElement("input");
//   hiddenPaymentMYR.type = "hidden";
//   hiddenPaymentMYR.id = "payment_amount_myr";
//   hiddenPaymentMYR.name = "payment_amount_myr";

//   form.appendChild(hiddenPaymentAmount);
//   form.appendChild(hiddenPaymentCurrency);
//   form.appendChild(hiddenPaymentMYR);

//   // === 汇率说明 ===
//   const rateNote = document.createElement("div");
//   rateNote.style.marginTop = "5px";
//   rateNote.style.marginBottom = "5px";
//   rateNote.style.fontSize = "13px";
//   rateNote.style.color = "#666";

//   rateNote.innerHTML = `
//     汇率参考来源：<a href="https://pbebank.com/en/rates-charges/forex/" target="_blank" style="color:#0077cc;">
//       https://pbebank.com/en/rates-charges/forex/
//     </a>
//   `;

//   form.appendChild(rateNote);
//   // === 论文文件上传区域占位 ===
//   const fileInputContainer = document.createElement("div");
//   fileInputContainer.id = "file_input_container";
//   Object.assign(fileInputContainer.style, {
//     display: "none",
//     marginTop: "15px",
//     padding: "10px",
//     border: "1px dashed #999",
//     borderRadius: "8px",
//     background: "#f9f9f9",
//   });
//   form.appendChild(fileInputContainer);

//   function togglePaperUpload() {
//     let selectedValue = null;
//     let selectedCurrency = null;

//     const selected = [...priceCheckboxes].find((i) => i.checked);

//     if (!selected) {
//       hiddenPaymentAmount.value = "";
//       hiddenPaymentCurrency.value = "";
//       hiddenPaymentMYR.value = "";
//       fileInputContainer.style.display = "none";
//       fileInputContainer.innerHTML = "";
//       return;
//     }

//     selectedValue = selected.value;
//     selectedCurrency = selected.dataset.currency;

//     hiddenPaymentAmount.value = selectedValue;
//     hiddenPaymentCurrency.value = selectedCurrency;

//     // ==== 计算 MYR 实际金额 ====
//     if (selectedCurrency === "USD" && usd_rate) {
//       hiddenPaymentMYR.value = Math.round(selectedValue * usd_rate);
//     } else if (selectedCurrency === "RM") {
//       hiddenPaymentMYR.value = selectedValue;
//     }

//     // ==== 如果是论文 ====
//     if (selectedValue === "500" || selectedValue === "200") {
//       fileInputContainer.style.display = "block";
//       fileInputContainer.innerHTML = `
//       <label style="font-weight:bold;color:#333;">Upload Paper PDF</label><br>
//       <input type="file" id="paper_files" name="paper_files" accept="application/pdf" multiple>
//       <p style="font-size:12px;color:#555;margin-top:4px;">
//         * 可上传多个 PDF 文件
//       </p>
//     `;
//     } else {
//       fileInputContainer.style.display = "none";
//       fileInputContainer.innerHTML = "";
//     }
//   }

//   // === 动态切换国旗亮度 ===
//   function updateFlag() {
//     if (non_Malaysian) {
//       // 外国人
//       malaysiaFlag.style.opacity = "0.3";
//       foreignFlag.style.opacity = "1";
//     } else {
//       // 马来西亚人
//       malaysiaFlag.style.opacity = "1";
//       foreignFlag.style.opacity = "0.3";
//     }
//   }

//   // === 更新价格区域 + 国旗 ===
//   // === 更新价格区域 + 国旗 ===
//   function updatePriceArea() {
//     const malInputs = malaysiaBox.querySelectorAll("input");
//     const foreInputs = foreignBox.querySelectorAll("input");

//     if (non_Malaysian) {
//       // ==== 外国人 ====
//       malInputs.forEach((i) => {
//         i.disabled = true;
//         i.checked = false;

//         const label = i.parentElement;
//         label.style.opacity = "0.4";
//         label.style.pointerEvents = "none";
//       });

//       foreInputs.forEach((i) => {
//         i.disabled = false;

//         const label = i.parentElement;
//         label.style.opacity = "1";
//         label.style.pointerEvents = "auto";
//       });

//       malaysiaBox.style.opacity = "0.5";
//       foreignBox.style.opacity = "1";
//       malaysiaBox.style.background = "#f0f0f0";
//       foreignBox.style.background = "#fff";
//     } else {
//       // ==== 马来西亚人 ====
//       foreInputs.forEach((i) => {
//         i.disabled = true;
//         i.checked = false;

//         const label = i.parentElement;
//         label.style.opacity = "0.4";
//         label.style.pointerEvents = "none";
//       });

//       malInputs.forEach((i) => {
//         i.disabled = false;

//         const label = i.parentElement;
//         label.style.opacity = "1";
//         label.style.pointerEvents = "auto";
//       });

//       foreignBox.style.opacity = "0.5";
//       malaysiaBox.style.opacity = "1";
//       foreignBox.style.background = "#f0f0f0";
//       malaysiaBox.style.background = "#fff";
//     }

//     updateFlag();
//   }

//   // 初始状态
//   updatePriceArea();

//   // === 证件类型变化 ===
//   typeSelect.addEventListener("change", () => {
//     if (typeSelect.value === "NRIC") {
//       numberLabel.textContent = "证件号码 (NRIC)";
//       numberInput.placeholder = "YYMMDD-XX-XXXX";
//       numberInput.title = "请输入 NRIC，例如 991231-01-1234";

//       numberInput.addEventListener("input", formatNRICandCalcAge);
//     } else {
//       numberLabel.textContent = "证件号码";
//       numberInput.placeholder = "AB1234567";
//       numberInput.removeAttribute("title");

//       numberInput.removeEventListener("input", formatNRICandCalcAge);

//       non_Malaysian = true;
//       ageInput.value = "";
//       updatePriceArea();
//     }
//   });

//   // === NRIC 自动判断 ===
//   function formatNRICandCalcAge(e) {
//     const raw = e.target.value.replace(/\D/g, "").slice(0, 12);

//     // format
//     let formatted = raw;
//     if (raw.length > 6) formatted = raw.slice(0, 6) + "-" + raw.slice(6);
//     if (raw.length > 8)
//       formatted = raw.slice(0, 6) + "-" + raw.slice(6, 8) + "-" + raw.slice(8);
//     e.target.value = formatted;

//     non_Malaysian = true;

//     if (raw.length >= 6) {
//       const yy = parseInt(raw.slice(0, 2));
//       const mm = parseInt(raw.slice(2, 4));
//       const dd = parseInt(raw.slice(4, 6));

//       const year = yy <= 24 ? 2000 + yy : 1900 + yy;

//       const date = new Date(year, mm - 1, dd);

//       if (
//         date.getFullYear() === year &&
//         date.getMonth() === mm - 1 &&
//         date.getDate() === dd
//       ) {
//         let age = new Date().getFullYear() - year;
//         const birthdayThisYear = new Date(new Date().getFullYear(), mm - 1, dd);

//         if (new Date() < birthdayThisYear) age--;

//         if (age >= 0 && age < 150) {
//           ageInput.value = age;
//           non_Malaysian = false;
//         }
//       }
//     }

//     updatePriceArea();
//   }
// }
function addDocTypeAndNumberAndAge(form) {
  let non_Malaysian = true;

  // === Document Type ===
  const typeLabel = document.createElement("label");
  typeLabel.textContent = "Document Type";

  const typeSelect = document.createElement("select");
  typeSelect.id = "doc_type";
  typeSelect.name = "doc_type";

  Object.assign(typeSelect.style, {
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
  });

  const passportOption = document.createElement("option");
  passportOption.value = "Passport";
  passportOption.textContent = "Passport";

  const nricOption = document.createElement("option");
  nricOption.value = "NRIC";
  nricOption.textContent = "NRIC (Malaysia)";

  typeSelect.appendChild(passportOption);
  typeSelect.appendChild(nricOption);

  form.appendChild(typeLabel);
  form.appendChild(typeSelect);

  // === Document Number ===
  const numberLabel = document.createElement("label");
  numberLabel.textContent = "Document Number";

  const numberInput = document.createElement("input");
  numberInput.type = "text";
  numberInput.id = "doc_no";
  numberInput.name = "doc_no";
  numberInput.placeholder = "991231-01-1234 / AB1234567";

  Object.assign(numberInput.style, {
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
  });

  form.appendChild(numberLabel);
  form.appendChild(numberInput);

  // === Age ===
  const ageLabel = document.createElement("label");
  ageLabel.textContent = "Age";

  const ageInput = document.createElement("input");
  ageInput.type = "number";
  ageInput.id = "age";
  ageInput.name = "age";

  Object.assign(ageInput.style, {
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
  });

  form.appendChild(ageLabel);
  form.appendChild(ageInput);

  // === Flag Container ===
  const flagContainer = document.createElement("div");
  flagContainer.id = "flag_container";
  Object.assign(flagContainer.style, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 5px",
    marginTop: "10px",
    borderRadius: "8px",
  });

  const malaysiaFlag = document.createElement("span");
  malaysiaFlag.innerHTML = "🇲🇾 Malaysian";
  malaysiaFlag.style.opacity = "0.3";

  const foreignFlag = document.createElement("span");
  foreignFlag.innerHTML = "🌍 Non-Malaysian";
  foreignFlag.style.opacity = "1";

  flagContainer.appendChild(malaysiaFlag);
  flagContainer.appendChild(foreignFlag);
  form.appendChild(flagContainer);

  // === Pricing Area ===
  const priceContainer = document.createElement("div");
  priceContainer.id = "price_container";

  Object.assign(priceContainer.style, {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    padding: "15px",
    marginTop: "10px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    background: "#fafafa",
  });

  // Malaysian pricing
  const malaysiaBox = document.createElement("div");
  malaysiaBox.innerHTML = `
      <h4 style="margin-top:0;">Malaysian</h4>
      <label><input type="checkbox" class="price_option" value="100" data-currency="RM"> Normal Participant (RM100)</label><br>
      <label><input type="checkbox" class="price_option" value="500" data-currency="RM"> Paper Presentation (RM500)</label>
  `;
  malaysiaBox.style.borderRight = "1px solid #ddd";
  malaysiaBox.style.paddingRight = "10px";

  // Non-Malaysian pricing
  const foreignBox = document.createElement("div");
  foreignBox.style.paddingLeft = "10px";

  foreignBox.innerHTML = `
      <h4 style="margin-top:0;">Non-Malaysian</h4>
      <label><input type="checkbox" class="price_option" value="200" data-currency="RM">
        Normal Participant (RM200)
      </label><br>
      <label><input type="checkbox" class="price_option" value="1000" data-currency="RM">
        Paper Presentation (RM1000)
      </label>
  `;

  priceContainer.appendChild(malaysiaBox);
  priceContainer.appendChild(foreignBox);
  form.appendChild(priceContainer);

  const priceCheckboxes = priceContainer.querySelectorAll(".price_option");

  priceCheckboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.checked) {
        priceCheckboxes.forEach((other) => {
          if (other !== cb) other.checked = false;
        });
      }
      togglePaperUpload();
    });
  });

  // Hidden payment fields
  const hiddenPaymentAmount = document.createElement("input");
  hiddenPaymentAmount.type = "hidden";
  hiddenPaymentAmount.id = "payment_amount";
  hiddenPaymentAmount.name = "payment_amount";

  const hiddenPaymentCurrency = document.createElement("input");
  hiddenPaymentCurrency.type = "hidden";
  hiddenPaymentCurrency.id = "payment_currency";
  hiddenPaymentCurrency.name = "payment_currency";

  const hiddenPaymentMYR = document.createElement("input");
  hiddenPaymentMYR.type = "hidden";
  hiddenPaymentMYR.id = "payment_amount_myr";
  hiddenPaymentMYR.name = "payment_amount_myr";

  form.appendChild(hiddenPaymentAmount);
  form.appendChild(hiddenPaymentCurrency);
  form.appendChild(hiddenPaymentMYR);

  // === Remove exchange rate UI completely ===
  // (Your system no longer needs any rates or USD)
  
  // === File Upload ===
  const fileInputContainer = document.createElement("div");
  fileInputContainer.id = "file_input_container";
  Object.assign(fileInputContainer.style, {
    display: "none",
    marginTop: "15px",
    padding: "10px",
    border: "1px dashed #999",
    borderRadius: "8px",
    background: "#f9f9f9",
  });
  form.appendChild(fileInputContainer);

  function togglePaperUpload() {
    const selected = [...priceCheckboxes].find((i) => i.checked);

    if (!selected) {
      hiddenPaymentAmount.value = "";
      hiddenPaymentCurrency.value = "";
      hiddenPaymentMYR.value = "";
      fileInputContainer.style.display = "none";
      fileInputContainer.innerHTML = "";
      return;
    }

    let value = Number(selected.value);

    hiddenPaymentAmount.value = value;
    hiddenPaymentCurrency.value = "RM";
    hiddenPaymentMYR.value = value;

    if (value === 500 || value === 1000) {
      fileInputContainer.style.display = "block";
      fileInputContainer.innerHTML = `
      <label style="font-weight:bold;color:#333;">Upload Paper PDF</label><br>
      <input type="file" id="paper_files" name="paper_files" accept="application/pdf" multiple>
      <p style="font-size:12px;color:#555;margin-top:4px;">
        * Multiple PDF files can be uploaded
      </p>
      `;
    } else {
      fileInputContainer.style.display = "none";
      fileInputContainer.innerHTML = "";
    }
  }

  function updateFlag() {
    if (non_Malaysian) {
      malaysiaFlag.style.opacity = "0.3";
      foreignFlag.style.opacity = "1";
    } else {
      malaysiaFlag.style.opacity = "1";
      foreignFlag.style.opacity = "0.3";
    }
  }

  function updatePriceArea() {
    const malInputs = malaysiaBox.querySelectorAll("input");
    const foreInputs = foreignBox.querySelectorAll("input");

    if (non_Malaysian) {
      malInputs.forEach((i) => {
        i.disabled = true;
        i.checked = false;
        i.parentElement.style.opacity = "0.4";
        i.parentElement.style.pointerEvents = "none";
      });

      foreInputs.forEach((i) => {
        i.disabled = false;
        i.parentElement.style.opacity = "1";
        i.parentElement.style.pointerEvents = "auto";
      });

      malaysiaBox.style.opacity = "0.5";
      foreignBox.style.opacity = "1";
    } else {
      foreInputs.forEach((i) => {
        i.disabled = true;
        i.checked = false;
        i.parentElement.style.opacity = "0.4";
        i.parentElement.style.pointerEvents = "none";
      });

      malInputs.forEach((i) => {
        i.disabled = false;
        i.parentElement.style.opacity = "1";
        i.parentElement.style.pointerEvents = "auto";
      });

      foreignBox.style.opacity = "0.5";
      malaysiaBox.style.opacity = "1";
    }

    updateFlag();
  }

  updatePriceArea();

  typeSelect.addEventListener("change", () => {
    if (typeSelect.value === "NRIC") {
      numberLabel.textContent = "Document Number (NRIC)";
      numberInput.placeholder = "YYMMDD-XX-XXXX";
      numberInput.title = "Enter NRIC, for example 991231-01-1234";

      numberInput.addEventListener("input", formatNRICandCalcAge);
    } else {
      numberLabel.textContent = "Document Number";
      numberInput.placeholder = "AB1234567";
      numberInput.removeAttribute("title");

      numberInput.removeEventListener("input", formatNRICandCalcAge);

      non_Malaysian = true;
      ageInput.value = "";
      updatePriceArea();
    }
  });

  function formatNRICandCalcAge(e) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);

    let formatted = raw;
    if (raw.length > 6) formatted = raw.slice(0, 6) + "-" + raw.slice(6);
    if (raw.length > 8)
      formatted = raw.slice(0, 6) + "-" + raw.slice(6, 8) + "-" + raw.slice(8);
    e.target.value = formatted;

    non_Malaysian = true;

    if (raw.length >= 6) {
      const yy = parseInt(raw.slice(0, 2));
      const mm = parseInt(raw.slice(2, 4));
      const dd = parseInt(raw.slice(4, 6));

      const year = yy <= 24 ? 2000 + yy : 1900 + yy;

      const date = new Date(year, mm - 1, dd);

      if (
        date.getFullYear() === year &&
        date.getMonth() === mm - 1 &&
        date.getDate() === dd
      ) {
        let age = new Date().getFullYear() - year;
        const birthdayThisYear = new Date(new Date().getFullYear(), mm - 1, dd);

        if (new Date() < birthdayThisYear) age--;

        if (age >= 0 && age < 150) {
          ageInput.value = age;
          non_Malaysian = false;
        }
      }
    }

    updatePriceArea();
  }
}

// async function renderFormAndBind() {
//   const container = document.createElement("div");
//   container.className = "container";
//   Object.assign(container.style, {
//     maxWidth: "700px",
//     margin: "30px auto",
//     padding: "20px",
//     background: "#fff",
//     borderRadius: "10px",
//     boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
//   });

//   const title = document.createElement("h2");
//   title.textContent = "大会报名";
//   title.style.textAlign = "center";
//   title.style.color = "#2c5f2d";

//   const subtitle = document.createElement("p");
//   subtitle.textContent = "请填写以下信息完成报名";
//   subtitle.style.textAlign = "center";
//   subtitle.style.color = "#555";

//   const form = document.createElement("form");
//   form.id = "registration-form";
//   form.enctype = "multipart/form-data";

//   // 添加字段（按顺序）
//   addInput(form, "姓名", "name", true, "请输入您的全名");
//   addInput(form, "中文名", "name_cn", false, "如有中文名");

//   addDocTypeAndNumberAndAge(form);

//   // ★ 新增： Malaysia Price 占位容器
//   const malaysiaPriceContainer = document.createElement("div");
//   malaysiaPriceContainer.id = "malaysia_price_placeholder";
//   Object.assign(malaysiaPriceContainer.style, {
//     margin: "15px 0",
//     padding: "10px",
//     borderRadius: "8px",
//   });
//   form.appendChild(malaysiaPriceContainer);
//   // ★ 占位容器添加完毕

//   addInput(form, "电子邮箱", "email", true, "example@email.com", "email");

//   // 国家 select + 电话输入 —— 放置占位 container
//   const countrySelectContainer = document.createElement("div");
//   countrySelectContainer.id = "country-select-container";
//   form.appendChild(countrySelectContainer);

//   // 异步渲染国家选择器
//   addCountrySelectWithDialCode(countrySelectContainer);

//   const phoneLabel = document.createElement("label");
//   phoneLabel.innerHTML = `联系电话 <span style="color:red">*</span>`;
//   const phoneInput = document.createElement("input");
//   phoneInput.type = "tel";
//   phoneInput.id = "phone";
//   phoneInput.name = "phone";
//   phoneInput.required = true;
//   phoneInput.placeholder = "e.g. +60 123456789";
//   Object.assign(phoneInput.style, {
//     width: "100%",
//     padding: "8px",
//     marginBottom: "10px",
//   });
//   form.appendChild(phoneLabel);
//   form.appendChild(phoneInput);

//   addInput(
//     form,
//     "紧急联系人",
//     "emergency_contact",
//     false,
//     "如：Jane, 87654321"
//   );
//   addInput(form, "医疗信息", "medical_information", false, "如：None");
//   addSubmitButton(form);

//   const msgDiv = document.createElement("div");
//   msgDiv.id = "message";
//   msgDiv.style.textAlign = "center";
//   msgDiv.style.marginTop = "15px";

//   container.appendChild(title);
//   container.appendChild(subtitle);
//   container.appendChild(form);
//   container.appendChild(msgDiv);
//   document.body.appendChild(container);
// }
async function renderFormAndBind() {
  const container = document.createElement("div");
  container.className = "container";
  Object.assign(container.style, {
    maxWidth: "700px",
    margin: "30px auto",
    padding: "20px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  });

  const title = document.createElement("h2");
  title.textContent = "Conference Registration";
  title.style.textAlign = "center";
  title.style.color = "#2c5f2d";

  const subtitle = document.createElement("p");
  subtitle.textContent = "Please fill in the required information to complete your registration";
  subtitle.style.textAlign = "center";
  subtitle.style.color = "#555";

  const form = document.createElement("form");
  form.id = "registration-form";
  form.enctype = "multipart/form-data";

  // Add fields (in order)
  addInput(form, "Full Name", "name", true, "Enter your full name");
  addInput(form, "Chinese Name", "name_cn", false, "If applicable");

  addDocTypeAndNumberAndAge(form);

  // Malaysia pricing placeholder
  const malaysiaPriceContainer = document.createElement("div");
  malaysiaPriceContainer.id = "malaysia_price_placeholder";
  Object.assign(malaysiaPriceContainer.style, {
    margin: "15px 0",
    padding: "10px",
    borderRadius: "8px",
  });
  form.appendChild(malaysiaPriceContainer);

  addInput(form, "Email Address", "email", true, "example@email.com", "email");

  // Country select + phone
  const countrySelectContainer = document.createElement("div");
  countrySelectContainer.id = "country-select-container";
  form.appendChild(countrySelectContainer);

  // async load country selector
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

  addInput(form, "Emergency Contact", "emergency_contact", false, "Example: Jane, 87654321");
  addInput(form, "Medical Information", "medical_information", false, "Example: None");
  addSubmitButton(form);

  const msgDiv = document.createElement("div");
  msgDiv.id = "message";
  msgDiv.style.textAlign = "center";
  msgDiv.style.marginTop = "15px";

  container.appendChild(title);
  container.appendChild(subtitle);
  container.appendChild(form);
  container.appendChild(msgDiv);
  document.body.appendChild(container);
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

function bindFormSubmit() {
  const form = document.getElementById("registration-form");
  const msgDiv = document.getElementById("message");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgDiv.textContent = "提交中...";
    msgDiv.style.color = "#555";

    const formData = new FormData();

    // ============================
    // 基础信息
    // ============================
    formData.append("name", getVal("name"));
    formData.append("name_cn", getVal("name_cn"));
    formData.append("email", getVal("email"));
    formData.append("phone", getVal("phone"));
    formData.append("country", getVal("country"));
    formData.append("age", getVal("age"));
    formData.append("emergency_contact", getVal("emergency_contact"));
    formData.append("medical_information", getVal("medical_information"));
    formData.append("doc_type", getVal("doc_type"));
    formData.append("doc_no", getVal("doc_no"));

    // ============================
    // 价格收集 — 从 hidden input
    // ============================
    formData.append(
      "payment_amount",
      document.getElementById("payment_amount").value
    );
    formData.append(
      "payment_currency",
      document.getElementById("payment_currency").value
    );
    formData.append(
      "payment_amount_myr",
      document.getElementById("payment_amount_myr").value
    );

    // ============================
    // 付款凭证（JPEG / PDF）
    // ============================
    const fileInput = document.getElementById("payment_doc");
    if (fileInput && fileInput.files.length > 0) {
      const processed = await getProcessedFile(fileInput.files[0]);
      if (processed) formData.append("payment_doc", processed);
    }

    // ============================
    // 论文 PDF — 多文件提交
    // ============================
    const paperFiles = document.getElementById("paper_files");
    if (paperFiles && paperFiles.files.length > 0) {
      for (let f of paperFiles.files) {
        formData.append("paper_files", f);
      }
      formData.append("paper_presentation", "true");
    } else {
      formData.append("paper_presentation", "false");
    }

    // ============================
    // 发送请求
    // ============================
    try {
      const res = await fetch("/wbc/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      // =====================
      // 成功后跳转
      // =====================
      if (data.success && data.data) {
        const record = data.data;

        const amountMYR = record.payment_amount_myr;
        const id = record.id;
        const name = encodeURIComponent(record.name);
        const email = encodeURIComponent(record.email);

        window.location.href = `/payment_gateway/pay?amount_myr=${amountMYR}&id=${id}&name=${name}&email=${email}`;
        return;
      }

      msgDiv.textContent = "❌ 提交失败：" + (data.error || "未知错误");
      msgDiv.style.color = "red";
    } catch (err) {
      msgDiv.textContent = "❌ 网络错误，请稍后重试。";
      msgDiv.style.color = "red";
    }
  });

  function getVal(id) {
    return document.getElementById(id)?.value || "";
  }
}
