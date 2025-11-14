window.onload = async function () {
    renderLayout();           // 1. 渲染界面（header/footer/layout）
     await renderFormAndBind();      // 2. 渲染表格，绑定事件
    bindFormSubmit();         // 3. 提交表格逻辑
    renderFooter();
};
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
                <span class="tagline" id="tagline">智慧 · 慈悲 · 感恩</span>
            </div>
            <nav>
                <a href="#about">关于我们</a>
                <a href="/static/templates/WBC.html">世界佛教大会</a>
                <a href="/static/templates/register.html">马上报名</a>
                <a href="#contact">联系我们</a>
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
        <p id="footer-text">© 2024 马来西亚佛教青年总会 (YBAM). 版权所有.</p>
        <p>Young Buddhist Association of Malaysia</p>
    `;
    document.body.appendChild(footer);
}

async function addCountrySelectWithDialCode(formElement) {
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
        marginBottom: "10px"
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

    formElement.appendChild(label);
    formElement.appendChild(select);
}

// =======================
// ✅ 获取国家与电话区号 API
// =======================
async function fetchCountryDialCodes() {
    try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name,idd');

        const data = await res.json();

        const result = {};
        data.forEach(country => {
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
            "Malaysia": "+60",
            "Singapore": "+65",
            "China": "+86"
        }; // fallback
    }
}

// 工具函数：字段创建
function addInput(form, labelText, id, required = false, placeholder = "", type = "text") {
    const label = document.createElement("label");
    label.innerHTML = `${labelText} ${required ? '<span style="color:red">*</span>' : ""}`;

    const input = document.createElement("input");
    input.type = type;
    input.id = id;
    input.name = id;
    input.placeholder = placeholder;
    input.required = required;

    Object.assign(input.style, {
        width: "100%",
        padding: "8px",
        marginBottom: "10px"
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
        fontSize: "16px"
    });

    form.appendChild(button);
}

function addDocTypeAndNumberAndAge(form) {
    // === 证件类型 ===
    const typeLabel = document.createElement("label");
    typeLabel.textContent = "证件类型";

    const typeSelect = document.createElement("select");
    typeSelect.id = "doc_type";
    typeSelect.name = "doc_type";

    Object.assign(typeSelect.style, {
        width: "100%",
        padding: "8px",
        marginBottom: "10px"
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

    // === 证件号码 ===
    const numberLabel = document.createElement("label");
    numberLabel.id = "doc_no_label";
    numberLabel.textContent = "证件号码";

    const numberInput = document.createElement("input");
    numberInput.type = "text";
    numberInput.id = "doc_no";
    numberInput.name = "doc_no";
    numberInput.placeholder = "991231-01-1234 / AB1234567";

    Object.assign(numberInput.style, {
        width: "100%",
        padding: "8px",
        marginBottom: "10px"
    });

    form.appendChild(numberLabel);
    form.appendChild(numberInput);

    // === 年龄 ===
    const ageLabel = document.createElement("label");
    ageLabel.textContent = "年龄";

    const ageInput = document.createElement("input");
    ageInput.type = "number";
    ageInput.id = "age";
    ageInput.name = "age";
    ageInput.placeholder = "";

    Object.assign(ageInput.style, {
        width: "100%",
        padding: "8px",
        marginBottom: "10px"
    });

    form.appendChild(ageLabel);
    form.appendChild(ageInput);

    // === 绑定监听器 ===
    typeSelect.addEventListener("change", () => {
        const type = typeSelect.value;

        if (type === "NRIC") {
            numberLabel.textContent = "证件号码 (NRIC)";
            numberInput.placeholder = "YYMMDD-XX-XXXX";
            numberInput.pattern = "\\d{6}-\\d{2}-\\d{4}";
            numberInput.title = "请输入有效的 NRIC 格式，如：991231-01-1234";

            numberInput.addEventListener("input", formatNRICandCalcAge);
        } else {
            numberLabel.textContent = "证件号码";
            numberInput.placeholder = "AB1234567";
            numberInput.pattern = "";
            numberInput.removeAttribute("title");

            numberInput.removeEventListener("input", formatNRICandCalcAge);
            ageInput.value = ""; // 清空年龄
        }
    });

    // === 自动格式化 NRIC + 自动计算年龄 ===
    function formatNRICandCalcAge(e) {
        const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
        let formatted = "";

        if (raw.length <= 6) {
            formatted = raw;
        } else if (raw.length <= 8) {
            formatted = raw.slice(0, 6) + "-" + raw.slice(6);
        } else {
            formatted = raw.slice(0, 6) + "-" + raw.slice(6, 8) + "-" + raw.slice(8);
        }

        e.target.value = formatted;

        // 年龄推算（从前6位的 YYMMDD 得到年份）
        if (raw.length >= 6) {
            const yy = parseInt(raw.slice(0, 2), 10);
            const year = yy >= 0 && yy <= 24 ? 2000 + yy : 1900 + yy;

            const today = new Date();
            const birthYear = year;
            let age = today.getFullYear() - birthYear;

            // 补上月份判断（不严格，但够用了）
            const mm = parseInt(raw.slice(2, 4), 10);
            const dd = parseInt(raw.slice(4, 6), 10);
            const birthdayThisYear = new Date(today.getFullYear(), mm - 1, dd);
            if (today < birthdayThisYear) age -= 1;

            if (!isNaN(age)) {
                ageInput.value = age;
            }
        }
    }
}


async function renderFormAndBind() {
    const container = document.createElement("div");
    container.className = "container";
    Object.assign(container.style, {
        maxWidth: "700px",
        margin: "30px auto",
        padding: "20px",
        background: "#fff",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    });

    const title = document.createElement("h2");
    title.textContent = "大会报名";
    title.style.textAlign = "center";
    title.style.color = "#2c5f2d";

    const subtitle = document.createElement("p");
    subtitle.textContent = "请填写以下信息完成报名";
    subtitle.style.textAlign = "center";
    subtitle.style.color = "#555";

    const form = document.createElement("form");
    form.id = "registration-form";
    form.enctype = "multipart/form-data";

    // 添加字段（按顺序）
    addInput(form, "姓名", "name", true, "请输入您的全名");
    addInput(form, "中文名", "name_cn", false, "如有中文名");

    addDocTypeAndNumberAndAge(form);

    addInput(form, "电子邮箱", "email", true, "example@email.com", "email");

    // 国家 select + 电话输入
    await addCountrySelectWithDialCode(form);

    const phoneLabel = document.createElement("label");
    phoneLabel.innerHTML = `联系电话 <span style="color:red">*</span>`;
    const phoneInput = document.createElement("input");
    phoneInput.type = "tel";
    phoneInput.id = "phone";
    phoneInput.name = "phone";
    phoneInput.required = true;
    phoneInput.placeholder = "e.g. +60 123456789";
    Object.assign(phoneInput.style, {
        width: "100%",
        padding: "8px",
        marginBottom: "10px"
    });
    form.appendChild(phoneLabel);
    form.appendChild(phoneInput);

    addInput(form, "紧急联系人", "emergency_contact", false, "如：Jane, 87654321");
    addInput(form, "医疗信息", "medical_information", false, "如：None");
    addInput(form, "付款金额", "payment_amount", false, "50", "number");
    addFileInput(form, "付款凭证", "payment_doc", ".pdf,.jpg,.jpeg,.png");
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

function addFileInput(form, labelText, id, accept = "") {
    const label = document.createElement("label");
    label.textContent = labelText;

    const input = document.createElement("input");
    input.type = "file";
    input.id = id;
    input.name = id;
    input.accept = accept;

    Object.assign(input.style, {
        width: "100%",
        padding: "0.9rem 1.2rem",
        border: "2px solid #e0e0e0",
        borderRadius: "10px",
        fontSize: "1rem",
        fontFamily: "inherit",
        background: "#fafafa",
        marginBottom: "10px",
        cursor: "pointer",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease"
    });

    input.addEventListener("focus", () => {
        input.style.borderColor = "#5fb88f";
        input.style.boxShadow = "0 0 0 3px rgba(95, 184, 143, 0.1)";
        input.style.background = "white";
    });

    input.addEventListener("blur", () => {
        input.style.borderColor = "#e0e0e0";
        input.style.boxShadow = "none";
        input.style.background = "#fafafa";
    });

    // 预览容器
    const previewDiv = document.createElement("div");
    previewDiv.id = `${id}_preview`;
    previewDiv.style.marginBottom = "15px";

    input.addEventListener("change", async (e) => {
        previewDiv.innerHTML = "";
        const file = e.target.files[0];
        if (!file) return;

        if (file.type.startsWith("image/")) {
            try {
                const compressedDataURL = await compressImage(file, 800, 0.7);
                const img = createPreviewImage(compressedDataURL);
                previewDiv.appendChild(img);
            } catch (err) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = createPreviewImage(ev.target.result);
                    previewDiv.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        } else if (file.type === "application/pdf") {
            try {
                const preview = await renderPDFPreview(file);
                previewDiv.appendChild(preview);
            } catch (err) {
                const fallback = document.createElement("p");
                fallback.textContent = "无法预览 PDF，请上传后下载查看。";
                fallback.style.textAlign = "center";
                fallback.style.color = "#888";
                previewDiv.appendChild(fallback);
            }
        }
    });

    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(previewDiv);
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
        borderRadius: "8px"
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
        formData.append("payment_amount", getVal("payment_amount"));

        const fileInput = document.getElementById("payment_doc");
        if (fileInput && fileInput.files.length > 0) {
            const processed = await getProcessedFile(fileInput.files[0]);
            if (processed) formData.append("payment_doc", processed);
        }


        try {
            const res = await fetch("/wbc/register", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                msgDiv.textContent = "✅ 报名成功！感谢您的报名。";
                msgDiv.style.color = "green";
                form.reset();
            } else {
                msgDiv.textContent = "❌ 提交失败：" + (data.error || "未知错误");
                msgDiv.style.color = "red";
            }
        } catch (err) {
            msgDiv.textContent = "❌ 网络错误，请稍后重试。";
            msgDiv.style.color = "red";
        }
    });

    function getVal(id) {
        return document.getElementById(id)?.value || "";
    }
}
