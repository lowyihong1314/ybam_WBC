window.onload = function() {
    const body = document.body;
    body.style.fontFamily = "Segoe UI, sans-serif";
    body.style.background = "#f8fdfb";
    body.style.margin = "0";
    body.style.padding = "0";

    // ================== HEADER ==================
    const header = document.createElement("header");
    header.innerHTML = `
   <div class="header-content">
    <div class="logo-section"><img src="https://ybam-wordpress-media.s3.ap-southeast-1.amazonaws.com/wp-content/uploads/2024/05/03162711/ybamlogo2.png" alt="YBAM Logo" onerror="this.src=''; this.alt='Logo failed to load'; this.style.display='none';"> <span class="tagline" id="tagline">智慧 · 慈悲 · 感恩</span>
    </div>
    <nav><a href="#about">关于我们</a><a href="/static/templates/WBC.html">世界佛教大会</a><a href="/static/templates/register.html">马上报名</a> <a href="#contact">联系我们</a>
    </nav>
   </div>
    `;
    body.appendChild(header);

    // ================== FORM CONTAINER ==================
    const container = document.createElement("div");
    container.className = "container";
    container.style.maxWidth = "700px";
    container.style.margin = "30px auto";
    container.style.padding = "20px";
    container.style.background = "#fff";
    container.style.borderRadius = "10px";
    container.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
    container.innerHTML = `
        <h2 style="text-align:center;color:#2c5f2d;">大会报名</h2>
        <p style="text-align:center;color:#555;">请填写以下信息完成报名</p>
        <form id="registration-form">
            <label>姓名 <span style="color:red">*</span></label>
            <input type="text" id="name" required placeholder="请输入您的全名" style="width:100%;padding:8px;margin-bottom:10px;">

            <label>中文名</label>
            <input type="text" id="name_cn" placeholder="如有中文名" style="width:100%;padding:8px;margin-bottom:10px;">

            <label>电子邮箱 <span style="color:red">*</span></label>
            <input type="email" id="email" required placeholder="example@email.com" style="width:100%;padding:8px;margin-bottom:10px;">

            <label>联系电话 <span style="color:red">*</span></label>
            <input type="tel" id="phone" required placeholder="+60 12-345 6789" style="width:100%;padding:8px;margin-bottom:10px;">

            <label>国家/地区 <span style="color:red">*</span></label>
            <input type="text" id="country" required placeholder="如：马来西亚" style="width:100%;padding:8px;margin-bottom:10px;">

            <label>年龄</label>
            <input type="number" id="age" min="1" style="width:100%;padding:8px;margin-bottom:10px;">

            <label>紧急联系人</label>
            <input type="text" id="emergency_contact" placeholder="如：Jane, 87654321" style="width:100%;padding:8px;margin-bottom:10px;">

            <label>医疗信息</label>
            <input type="text" id="medical_information" placeholder="如：None" style="width:100%;padding:8px;margin-bottom:10px;">

            <label>证件类型</label>
            <input type="text" id="doc_type" placeholder="如：Passport" style="width:100%;padding:8px;margin-bottom:10px;">

            <label>证件号码</label>
            <input type="text" id="doc_no" placeholder="991031-01-5177" style="width:100%;padding:8px;margin-bottom:10px;">

            <label>付款金额</label>
            <input type="number" id="payment_amount" placeholder="50" style="width:100%;padding:8px;margin-bottom:10px;">

            <label>付款文件名</label>
            <input type="text" id="payment_doc" placeholder="ffoasj993712.pdf" style="width:100%;padding:8px;margin-bottom:10px;">

            <button type="submit" id="submitBtn" style="width:100%;padding:10px;background:#5fb88f;color:white;border:none;border-radius:5px;font-size:16px;">提交报名</button>
        </form>
        <div id="message" style="text-align:center;margin-top:15px;"></div>
    `;
    body.appendChild(container);

    // ================== FOOTER ==================
    const footer = document.createElement("footer");
    footer.style.textAlign = "center";
    footer.style.marginTop = "40px";
    footer.style.color = "#ffffffff";
    footer.innerHTML = `
    <p id="footer-text">© 2024 马来西亚佛教青年总会 (YBAM). 版权所有.</p>
    <p>Young Buddhist Association of Malaysia</p>
    `;
    body.appendChild(footer);

    // ================== JS逻辑 ==================
    const form = document.getElementById("registration-form");
    const msgDiv = document.getElementById("message");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        msgDiv.textContent = "提交中...";
        msgDiv.style.color = "#555";

        const payload = {
            doc_no: document.getElementById("doc_no").value,
            name: document.getElementById("name").value,
            name_cn: document.getElementById("name_cn").value,
            phone: document.getElementById("phone").value,
            email: document.getElementById("email").value,
            country: document.getElementById("country").value,
            age: document.getElementById("age").value,
            medical_information: document.getElementById("medical_information").value,
            emergency_contact: document.getElementById("emergency_contact").value,
            doc_type: document.getElementById("doc_type").value,
            payment_amount: document.getElementById("payment_amount").value,
            payment_doc: document.getElementById("payment_doc").value
        };

        try {
            const res = await fetch("/wbc/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
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
};
