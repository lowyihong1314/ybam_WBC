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
            renderTable(result.data);
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
    function renderTable(dataList) {
        // 清空旧内容
        TABLE_CONTAINER.innerHTML = "";

        if (!dataList || dataList.length === 0) {
            TABLE_CONTAINER.innerHTML = "<p style='text-align:center;margin-top:20px;'>暂无报名数据</p>";
            return;
        }

        const table = document.createElement("table");
        table.border = "1";
        table.cellPadding = "6";
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";

        // 表头
        const headers = [
            "ID", "Doc No", "Name", "Name (CN)", "Phone", "Email", "Country",
            "Age", "Medical Info", "Emergency Contact", "Doc Type",
            "Payment Amount", "Payment Doc", "Created At"
        ];

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        headers.forEach(h => {
            const th = document.createElement("th");
            th.textContent = h;
            th.style.background = "#eee";
            th.style.padding = "8px";
            th.style.border = "1px solid #ccc";
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // 表体
        const tbody = document.createElement("tbody");
        dataList.forEach(item => {
            const tr = document.createElement("tr");
            const values = [
                item.id, item.doc_no, item.name, item.name_cn, item.phone,
                item.email, item.country, item.age, item.medical_information,
                item.emergency_contact, item.doc_type, item.payment_amount,
                item.payment_doc, item.created_at
            ];
            values.forEach(v => {
                const td = document.createElement("td");
                td.textContent = v === null || v === undefined ? "" : v;
                td.style.border = "1px solid #ccc";
                td.style.padding = "6px";
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        TABLE_CONTAINER.appendChild(table);
    }

    // 启动
    loadRegisterData();
});
