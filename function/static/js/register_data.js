// /static/js/register.js

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "/wbc";
  const TABLE_CONTAINER = document.body; // 渲染在 body
  const STORAGE_KEY = "session_token";

  // 封装请求函数
  async function apiGet(path) {
    const token = localStorage.getItem(STORAGE_KEY);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}${path}`, { headers });
    const data = await res.json();
    if (!res.ok || data.success === false) throw data;
    return data;
  }

  async function apiPost(path, bodyObj) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyObj),
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
      GLOBAL_ROOM = result.room;
    } catch (err) {
      console.warn("获取数据失败:", err);
      if (
        err.error_type === "missing_token" ||
        err.error_type === "invalid_token" ||
        err.error_type === "expired_session"
      ) {
        await handleTokenInput();
      } else {
        alert("加载失败：" + (err.error || "未知错误"));
      }
    }
  }

  // 处理 token 输入逻辑
  let GLOBAL_ROOM = null;

  async function handleTokenInput() {
    const token = prompt("请输入访问授权 Token：");

    const res = await apiPost("/login_with_token", { token });

    // ⭐ 必须存，否则永远没 token 发送给后端
    localStorage.setItem(STORAGE_KEY, res.session_token);

    GLOBAL_ROOM = res.room;

    await loadRegisterData();
    await init_socket_once();
  }

  function init_socket() {
    const socket = io("/");

    socket.on("connect", () => {
      socket.emit("join_room", { room: GLOBAL_ROOM });
      console.log("加入房间:", GLOBAL_ROOM);
    });

    socket.on("room_joined", (data) => {
      console.log("房间提示:", data.msg);
      console.log("加入者 SID:", data.sid);
    });
    socket.on("register_update", (item) => {
      console.log("新增报名:", item);

      if (CARD_CONTAINER) {
        const card = renderCard(item);
        CARD_CONTAINER.appendChild(card); // ⭐ 直接加进去
      }
    });
  }

  // 渲染表格
  let CARD_CONTAINER = null;

  function renderCardContainer(dataList) {
    TABLE_CONTAINER.innerHTML = "";

    if (!dataList || dataList.length === 0) {
      TABLE_CONTAINER.innerHTML =
        "<p style='text-align:center;margin-top:20px;'>暂无报名数据</p>";
      init_socket_once();
      return;
    }

    const container = document.createElement("div");
    container.style.display = "grid";
    container.style.gridTemplateColumns =
      "repeat(auto-fill, minmax(300px, 1fr))";
    container.style.gap = "20px";
    container.style.padding = "20px";

    CARD_CONTAINER = container; // ⭐ 保存

    dataList.forEach((item) => {
      container.appendChild(renderCard(item));
    });

    TABLE_CONTAINER.appendChild(container);

    init_socket_once();
  }

  let socket_initialized = false;

  async function init_socket_once() {
    if (socket_initialized) return;

    const scriptList = ["https://cdn.socket.io/4.3.2/socket.io.min.js"];

    // ✅ 加载脚本
    await Promise.all(
      scriptList.map(
        (src) =>
          new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          })
      )
    );
    socket_initialized = true;
    init_socket();
  }

function renderCard(item) {
  const card = document.createElement("div");
  card.classList.add("register-card");

  Object.assign(card.style, {
    border: "1px solid #ccc",
    borderRadius: "10px",
    padding: "12px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
    cursor: "pointer",
    transition: "box-shadow 0.2s ease",
  });

  // hover
  card.addEventListener("mouseenter", () => {
    card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
  });
  card.addEventListener("mouseleave", () => {
    card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05)";
  });

  // 点击开启详情
  card.addEventListener("click", () => {
    generate_register_data_detail_modal(item);
  });

  // ==============================
  // 💳 支付状态处理
  // ==============================
  let paid = false;
  if (item.payment_transactions && item.payment_transactions.length > 0) {
    // 只要有一个成功支付记录 == paid
    paid = item.payment_transactions.some(tx => tx.paid === true);
  }

  // ==============================
  // 顶部支付状态图标
  // ==============================
  const status = document.createElement("div");
  status.style.fontSize = "26px";
  status.style.marginBottom = "8px";

  if (paid) {
    status.innerHTML = "💚";
  } else {
    status.innerHTML = "⏳";
  }
  card.appendChild(status);

  // ==============================
  // 显示金额
  // ==============================
  const amount = document.createElement("p");
  amount.style.margin = "4px 0";
  amount.style.fontWeight = "bold";

  if (item.payment_amount && item.payment_currency) {
    amount.textContent = `${item.payment_amount} ${item.payment_currency}`;
  } else {
    amount.textContent = "未付款";
  }

  // 颜色强调
  amount.style.color = paid ? "green" : "red";
  card.appendChild(amount);

  // ==============================
  // 基本资料
  // ==============================
  const p1 = document.createElement("p");
  p1.textContent = item.name_cn || item.name || "—";
  p1.style.fontWeight = "bold";
  p1.style.margin = "6px 0";
  card.appendChild(p1);

  const p2 = document.createElement("p");
  p2.textContent = `📞 ${item.phone || "无"}`;
  p2.style.margin = "4px 0";
  p2.style.fontSize = "13px";
  p2.style.color = "#666";
  card.appendChild(p2);

  const p3 = document.createElement("p");
  p3.textContent = `🎂 ${item.age || "?"}岁`;
  p3.style.margin = "4px 0";
  p3.style.fontSize = "13px";
  p3.style.color = "#666";
  card.appendChild(p3);

  const p4 = document.createElement("p");
  p4.textContent = `🪪 ${item.doc_type || ""}：${item.doc_no || ""}`;
  p4.style.margin = "4px 0";
  p4.style.fontSize = "13px";
  p4.style.color = "#666";
  card.appendChild(p4);

  return card;
}

function generate_register_data_detail_modal(item) {

  const existing = document.getElementById("register-detail-modal");
  if (existing) existing.remove();

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
    zIndex: 1000,
  });

  const modal = document.createElement("div");
  Object.assign(modal.style, {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    maxWidth: "550px",
    width: "90%",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    position: "relative",
  });

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
    color: "#666",
  });
  closeBtn.addEventListener("click", () => overlay.remove());
  modal.appendChild(closeBtn);

  const title = document.createElement("h2");
  title.textContent = item.name_cn || item.name || "报名信息";
  title.style.marginBottom = "15px";
  modal.appendChild(title);

  // ===============================
  // 基本信息
  // ===============================
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
    ["付款金额", `${item.payment_amount} ${item.payment_currency}`],
    ["换算金额 (MYR)", item.payment_amount_myr],
    ["提交时间", item.created_at],
    ["病史", item.medical_information],
  ];

  fields.forEach(([label, value]) => {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${label}：</strong> ${value || ""}`;
    p.style.margin = "6px 0";
    modal.appendChild(p);
  });

  // ===============================
  // 付款截图
  // ===============================
  if (item.payment_doc) {
    const link = document.createElement("a");
    link.href = `/wbc/register/payment_doc?id=${item.id}`;
    link.textContent = "查看付款凭证";
    link.target = "_blank";
    link.style.color = "#007bff";
    link.style.display = "block";
    link.style.marginTop = "10px";
    modal.appendChild(link);
  }

  // ===============================
  // ========== Paper Files =========
  // ===============================

  if (item.paper_presentation && item.paper_files && item.paper_files.length > 0) {
    const box = document.createElement("div");
    box.style.marginTop = "15px";

    const title = document.createElement("p");
    title.innerHTML = `<strong>📎 投稿文件：</strong>`;
    box.appendChild(title);

    item.paper_files.forEach((filename) => {
      const link = document.createElement("a");
      link.textContent = filename;
      link.href = `/wbc/get_paper_file?id=${item.id}&filename=${filename}`;
      link.target = "_blank";
      link.style.display = "block";
      link.style.margin = "3px 0";
      link.style.color = "#0056d6";
      box.appendChild(link);
    });

    modal.appendChild(box);
  }

  // ===============================
  // ========== 支付记录 ============
  // ===============================

  if (item.payment_transactions && item.payment_transactions.length > 0) {
    const box = document.createElement("div");
    box.style.marginTop = "20px";
    box.style.padding = "10px";
    box.style.background = "#f5f5f5";
    box.style.borderRadius = "8px";

    const t = document.createElement("p");
    t.innerHTML = `<strong>💳 支付交易记录</strong>`;
    box.appendChild(t);

    item.payment_transactions.forEach((tx) => {
      const row = document.createElement("div");
      row.style.borderBottom = "1px solid #ddd";
      row.style.padding = "5px";

      row.innerHTML = `
        <p><strong>Bill ID:</strong> ${tx.bill_id}</p>
        <p><strong>支付状态:</strong> ${tx.paid ? "✅ 成功" : "❌ 失败"}</p>
        <p><strong>支付时间:</strong> ${tx.created_at}</p>
      `;

      // 添加查看原始 JSON 的按钮
      const rawBtn = document.createElement("button");
      rawBtn.textContent = "查看支付原始 JSON";
      rawBtn.style.marginBottom = "10px";
      rawBtn.style.cursor = "pointer";
      rawBtn.addEventListener("click", () => {
        alert(JSON.stringify(tx.raw_json, null, 2));
      });
      row.appendChild(rawBtn);

      box.appendChild(row);
    });

    modal.appendChild(box);
  }

  // 添加到页面
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

  // 启动
  loadRegisterData();
});
