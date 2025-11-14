// /static/js/register.js

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "/wbc";
    const TABLE_CONTAINER = document.body; // 渲染在 body
    const STORAGE_KEY = "session_token";

    // 封装请求函数
    async function apiGet(path) {
        const token = localStorage.getItem(STORAGE_KEY);
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}${path}`, { headers });
        const data = await res.json();
        if (!res.ok || data.success === false) throw data;
        return data;
    }

    async function apiPost(path, bodyObj) {
        const res = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyObj)
        });
        const data = await res.json();
        if (!res.ok || data.success === false) throw data;
        return data;
    }

    // 主逻辑：加载报名数据
    async function loadRegisterData() {
        try {
            const result = await apiGet("/get_all_register_data");
            renderCardContainer(result.data);
        } catch (err) {
            console.warn("获取数据失败:", err);
            if (err.error_type === "missing_token" || err.error_type === "invalid_token" || err.error_type === "expired_session") {
                await handleTokenInput();
            } else {
                alert("加载失败：" + (err.error || "未知错误"));
            }
        }
    }

    // 处理 token 输入逻辑
    async function handleTokenInput() {
        const token = prompt("请输入访问授权 Token：");
        if (!token) {
            alert("必须输入 token 才能访问数据。");
            return;
        }

        try {
            // 向后端登录换取 session_token
            const res = await apiPost("/login_with_token", { token });
            localStorage.setItem(STORAGE_KEY, res.session_token);
            alert("登录成功！");
            await loadRegisterData();
        } catch (err) {
            alert("Token 无效或登录失败：" + (err.error || "未知错误"));
        }
    }

        // 渲染表格
    function renderCardContainer(dataList) {
        // 清空旧内容
        TABLE_CONTAINER.innerHTML = "";

        if (!dataList || dataList.length === 0) {
            TABLE_CONTAINER.innerHTML = "<p style='text-align:center;margin-top:20px;'>暂无报名数据</p>";
            return;
        }

        const container = document.createElement("div");
        container.style.display = "grid";
        container.style.gridTemplateColumns = "repeat(auto-fill, minmax(300px, 1fr))";
        container.style.gap = "20px";
        container.style.padding = "20px";

        dataList.forEach(item => {
            const card = renderCard(item);
            container.appendChild(card);
        });

        TABLE_CONTAINER.appendChild(container);
    }

function renderCard(item) {
    const card = document.createElement("div");
    card.classList.add("register-card");

    // 卡片样式
    Object.assign(card.style, {
        border: "1px solid #ccc",
        borderRadius: "10px",
        padding: "12px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        cursor: "pointer",
        transition: "box-shadow 0.2s ease"
    });

    card.addEventListener("mouseenter", () => {
        card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
    });
    card.addEventListener("mouseleave", () => {
        card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05)";
    });

    // 点击卡片打开详情
    card.addEventListener("click", () => {
        generate_register_data_detail_modal(item);
    });

    // 加载图像
    const img = document.createElement("img");
    img.src = `/wbc/register/image/${item.id}`;  // 一定要加 `/` 作为绝对路径
    img.alt = "付款证明";
    Object.assign(img.style, {
        width: "100px",
        height: "100px",
        borderRadius: "8px",
        objectFit: "cover",
        marginBottom: "10px",
        backgroundColor: "#f2f2f2"
    });
    card.appendChild(img);


    // 显示简要信息
    const name = item.name_cn || item.name || "（无名）";
    const p1 = document.createElement("p");
    p1.textContent = name;
    p1.style.fontWeight = "bold";
    p1.style.margin = "6px 0";
    card.appendChild(p1);

    const p2 = document.createElement("p");
    p2.textContent = `📞 ${item.phone || "无"}`;
    p2.style.margin = "4px 0";
    card.appendChild(p2);

    const p3 = document.createElement("p");
    p3.textContent = `🎂 ${item.age || "?"}岁`;
    p3.style.margin = "4px 0";
    card.appendChild(p3);

    const p4 = document.createElement("p");
    p4.textContent = `📄 ${item.doc_type || "证件"}：${item.doc_no || "无"}`;
    p4.style.margin = "4px 0";
    p4.style.fontSize = "13px";
    card.appendChild(p4);

    return card;
}

function generate_register_data_detail_modal(item) {
    // 如果已有 modal，先移除
    const existing = document.getElementById("register-detail-modal");
    if (existing) existing.remove();

    // 创建 modal 背景
    const overlay = document.createElement("div");
    overlay.id = "register-detail-modal";
    Object.assign(overlay.style, {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
    });

    // 创建 modal 内容容器
    const modal = document.createElement("div");
    Object.assign(modal.style, {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "10px",
        maxWidth: "500px",
        width: "90%",
        maxHeight: "80vh",
        overflowY: "auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        position: "relative"
    });

    // 关闭按钮
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    Object.assign(closeBtn.style, {
        position: "absolute",
        top: "10px",
        right: "15px",
        fontSize: "20px",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#666"
    });
    closeBtn.addEventListener("click", () => overlay.remove());
    modal.appendChild(closeBtn);

    // 标题
    const title = document.createElement("h2");
    title.textContent = item.name_cn || item.name || "报名信息";
    title.style.marginBottom = "15px";
    modal.appendChild(title);

    // 字段信息
    const fields = [
        ["姓名", item.name],
        ["姓名（中文）", item.name_cn],
        ["证件类型", item.doc_type],
        ["证件号码", item.doc_no],
        ["邮箱", item.email],
        ["电话", item.phone],
        ["国家", item.country],
        ["年龄", item.age],
        ["紧急联系人", item.emergency_contact],
        ["付款金额", item.payment_amount],
        ["创建时间", item.created_at],
        ["病史", item.medical_information]
    ];

    fields.forEach(([label, value]) => {
        const p = document.createElement("p");
        p.innerHTML = `<strong>${label}：</strong> ${value || ""}`;
        p.style.margin = "8px 0";
        modal.appendChild(p);
    });

    // 付款图片（如果是图像）
    if (item.payment_doc && /\.(jpg|jpeg|png|gif)$/i.test(item.payment_doc)) {
        const img = document.createElement("img");
        img.src = `/wbc/register/image/${item.id}`;
        img.alt = "付款证明";
        Object.assign(img.style, {
            maxWidth: "100%",
            maxHeight: "300px",
            marginTop: "15px",
            borderRadius: "8px"
        });
        modal.appendChild(img);
    } else if (item.payment_doc) {
        // 如果不是图像，也展示下载链接
        const link = document.createElement("a");
        link.href = `/wbc/register/image/${item.id}`;
        link.textContent = "点击查看付款文件";
        link.target = "_blank";
        link.style.display = "inline-block";
        link.style.marginTop = "10px";
        link.style.color = "#2a7ae2";
        modal.appendChild(link);
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}


    // 启动
    loadRegisterData();
});
