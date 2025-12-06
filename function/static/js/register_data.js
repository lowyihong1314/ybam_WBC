// /static/js/register.js

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "/wbc";
  const TABLE_CONTAINER = document.body; // 渲染在 body
  const STORAGE_KEY = "session_token";

  const SEARCH_CONTAINER = document.createElement("div");
  const CARD_CONTAINER_WRAPPER = document.createElement("div");
  const PAGINATION_CONTAINER = document.createElement("div");
  const BOTTOM_BUTTON_CONTAINER = document.createElement("div");

  TABLE_CONTAINER.appendChild(SEARCH_CONTAINER);
  TABLE_CONTAINER.appendChild(CARD_CONTAINER_WRAPPER);
  TABLE_CONTAINER.appendChild(PAGINATION_CONTAINER);
  TABLE_CONTAINER.appendChild(BOTTOM_BUTTON_CONTAINER);

  Object.assign(TABLE_CONTAINER.style, {
    padding: "20px",
    backgroundColor: "#222", // 深色背景
    color: "white", // 白色字体
    fontFamily: "Arial, sans-serif",
    margin: "0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  });

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
      if (!GLOBAL_ROOM) {
        console.warn("Room not ready yet, delaying join...");
        const interval = setInterval(() => {
          if (GLOBAL_ROOM) {
            socket.emit("join_room", { room: GLOBAL_ROOM });
            console.log("加入房间:", GLOBAL_ROOM);
            clearInterval(interval);
          }
        }, 100);
        return;
      }

      socket.emit("join_room", { room: GLOBAL_ROOM });
      console.log("加入房间:", GLOBAL_ROOM);
    });

    socket.on("room_joined", (data) => {
      console.log("房间提示:", data.msg);
      console.log("加入者 SID:", data.sid);
    });
    socket.on("register_update", (item) => {
      console.log("新增报名:", item);

      // ⭐ 新数据加入内存
      ORIGINAL_DATA_LIST.push(item);

      // ⭐ 搜索状态：只更新卡片，不刷新分页
      const input = document.querySelector("#search_input");
      if (input && input.value.trim() !== "") {
        const keyword = input.value.trim().toLowerCase();
        const filtered = ORIGINAL_DATA_LIST.filter((obj) =>
          JSON.stringify(obj).toLowerCase().includes(keyword)
        );
        renderCardsOnly(filtered); // ✔ 不刷新分页
        return;
      }

      // ⭐ 未在搜索情况下的新增逻辑
      if (CARD_CONTAINER_WRAPPER) {
        const cardList = CARD_CONTAINER_WRAPPER.querySelector("div");
        if (cardList) {
          cardList.appendChild(renderCard(item)); // ✔ 只追加，不重绘全部
        }
      }
    });
  }

  // 渲染表格
  let CARD_CONTAINER = null;

  let ORIGINAL_DATA_LIST = []; // ⭐ 原始数据缓存

  function renderCardContainer(dataList) {
    ORIGINAL_DATA_LIST = dataList;

    // 只清内容，不删容器
    SEARCH_CONTAINER.innerHTML = "";
    CARD_CONTAINER_WRAPPER.innerHTML = "";
    PAGINATION_CONTAINER.innerHTML = "";
    BOTTOM_BUTTON_CONTAINER.innerHTML = "";

    // 渲染搜索框
    createSearchBar();

    if (!dataList || dataList.length === 0) {
      CARD_CONTAINER_WRAPPER.innerHTML =
        "<p style='text-align:center;margin-top:20px;'>暂无报名数据</p>";
      init_socket_once();
      return;
    }

    renderCards(dataList);
    init_socket_once();
  }

  function createSearchBar() {
    const searchContainer = document.createElement("div");

    Object.assign(searchContainer.style, {
      display: "flex",
      justifyContent: "center",
      margin: "10px 0",
    });

    const input = document.createElement("input");
    input.type = "text";
    input.id = "search_input";
    input.placeholder = "输入关键词搜索...";

    Object.assign(input.style, {
      width: "300px",
      padding: "8px 12px",
      border: "1px solid #444",
      borderRadius: "6px",
      backgroundColor: "#333",
      color: "white",
      fontSize: "16px",
      transition: "all 0.3s ease",
    });

    input.addEventListener("focus", () => {
      input.style.transform = "translateY(-5px)";
      input.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
    });

    input.addEventListener("blur", () => {
      input.style.transform = "translateY(0)";
      input.style.boxShadow = "none";
    });

    input.oninput = function () {
      const keyword = input.value.trim().toLowerCase();
      const filtered = ORIGINAL_DATA_LIST.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(keyword)
      );

      // 搜索时回到第 1 页，避免当前页超出范围
      currentPage = 1;
      renderCards(filtered);
    };

    searchContainer.appendChild(input);

    // ✅ 重点：只往 SEARCH_CONTAINER 塞，不操作 TABLE_CONTAINER
    SEARCH_CONTAINER.appendChild(searchContainer);
  }

  let currentPage = 1; // 当前页
  const itemsPerPage = 15; // 每页显示 15 条

  function renderCardsOnly(list) {
    CARD_CONTAINER_WRAPPER.innerHTML = ""; // 清空卡片区域

    const cardsDiv = document.createElement("div");
    Object.assign(cardsDiv.style, {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: "20px",
      padding: "20px",
    });

    list.forEach((item) => {
      cardsDiv.appendChild(renderCard(item));
    });

    CARD_CONTAINER_WRAPPER.appendChild(cardsDiv);
  }

  function renderCards(list) {
    // 计算分页
    const totalPages = Math.ceil(list.length / itemsPerPage);
    const paginatedList = paginateList(list);

    // ⭐ 只更新卡片区域
    renderCardsOnly(paginatedList);

    // ⭐ 更新分页按钮
    renderPaginationControls(totalPages);

    // ⭐ 更新底部按钮
    renderBottomButtons();
  }

  // 分页数据
  function paginateList(list) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = currentPage * itemsPerPage;
    return list.slice(startIndex, endIndex);
  }

  function renderPaginationControls(totalPages) {
    PAGINATION_CONTAINER.innerHTML = ""; // 清空
    let paginationContainer = document.createElement("div");
    // 使用 Object.assign 给 paginationContainer 添加样式
    Object.assign(paginationContainer.style, {
      display: "flex",
      justifyContent: "center",
      margin: "20px 0",
    });

    // 上一页按钮
    const prevButton = document.createElement("button");
    prevButton.innerText = "上一页";
    prevButton.disabled = currentPage === 1;

    // 使用 Object.assign 给 prevButton 添加样式
    Object.assign(prevButton.style, {
      padding: "10px 20px",
      marginRight: "10px",
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "16px",
      transition: "background-color 0.3s",
    });

    prevButton.onclick = () => changePage(currentPage - 1);
    paginationContainer.appendChild(prevButton);

    // 下一页按钮
    const nextButton = document.createElement("button");
    nextButton.innerText = "下一页";
    nextButton.disabled = currentPage === totalPages;

    // 使用 Object.assign 给 nextButton 添加样式
    Object.assign(nextButton.style, {
      padding: "10px 20px",
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "16px",
      transition: "background-color 0.3s",
    });

    nextButton.onclick = () => changePage(currentPage + 1);
    paginationContainer.appendChild(nextButton);

    // 添加分页容器到 TABLE_CONTAINER
    PAGINATION_CONTAINER.appendChild(paginationContainer);
  }

  // 切换页面
  function changePage(page) {
    if (page < 1 || page > Math.ceil(ORIGINAL_DATA_LIST.length / itemsPerPage))
      return;
    currentPage = page;
    renderCards(ORIGINAL_DATA_LIST);
  }

  function renderBottomButtons() {
    BOTTOM_BUTTON_CONTAINER.innerHTML = ""; // 清空
    let btnList = document.createElement("div");
    // 使用 Object.assign 给 btnList 添加样式
    Object.assign(btnList.style, {
      display: "flex",
      justifyContent: "center",
      margin: "20px",
      gap: "20px",
    });

    // 创建导出按钮
    const exportBtn = document.createElement("button");
    exportBtn.innerText = "导出 Excel";

    // 使用 Object.assign 给 exportBtn 添加样式
    Object.assign(exportBtn.style, {
      padding: "8px 16px",
      borderRadius: "6px",
      border: "1px solid #0d45ffff",
      cursor: "pointer",
      fontSize: "16px",
      backgroundColor: "#007bff",
      color: "white",
      transition: "all 0.3s ease", // 按钮的过渡效果
    });

    // 鼠标悬停效果：按钮背景色改变并增加阴影
    exportBtn.onmouseover = () => {
      exportBtn.style.backgroundColor = "#0056b3";
      exportBtn.style.transform = "scale(1.05)"; // 按钮放大
      exportBtn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
    };

    exportBtn.onmouseout = () => {
      exportBtn.style.backgroundColor = "#007bff";
      exportBtn.style.transform = "scale(1)"; // 按钮恢复原大小
      exportBtn.style.boxShadow = "none";
    };

    // 点击执行导出
    exportBtn.onclick = exportExcel;

    btnList.appendChild(exportBtn);
    BOTTOM_BUTTON_CONTAINER.appendChild(btnList);
  }

  function exportExcel() {
    if (!ORIGINAL_DATA_LIST || ORIGINAL_DATA_LIST.length === 0) {
      alert("暂无数据可导出");
      return;
    }

    const header = Object.keys(ORIGINAL_DATA_LIST[0]);
    const rows = ORIGINAL_DATA_LIST.map((obj) =>
      header.map((k) => `"${obj[k] ?? ""}"`).join(",")
    );

    const csvContent = [header.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "报名数据.csv";
    link.click();

    URL.revokeObjectURL(url);
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

    // 使用 Object.assign 为卡片添加暗色系样式
    Object.assign(card.style, {
      border: "1px solid #444", // 暗色边框
      borderRadius: "10px",
      padding: "12px",
      backgroundColor: "#333", // 暗色背景
      color: "white", // 白色文字
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start", // 文字靠左对齐
      justifyContent: "space-between", // 保持一致的卡片内容布局
      minHeight: "250px", // 确保卡片高度一致
      width: "250px", // 统一宽度
      transition: "transform 0.3s ease, box-shadow 0.3s ease", // 渲染和悬停动画
      cursor: "pointer",
    });

    // 处理支付状态
    let paid = false;
    if (item.payment_transactions && item.payment_transactions.length > 0) {
      paid = item.payment_transactions.some((tx) => tx.paid === true);
    }

    // 根据支付状态调整 box-shadow
    if (paid) {
      card.style.boxShadow = "0 4px 12px rgba(0, 255, 0, 0.3)"; // 已支付，绿色阴影
    } else {
      card.style.boxShadow = "0 4px 12px rgba(255, 0, 0, 0.3)"; // 未支付，红色阴影
    }

    // Hover 动画
    card.addEventListener("mouseenter", () => {
      card.style.boxShadow = paid
        ? "0 6px 14px rgba(0, 255, 0, 0.5)" // 已支付，放大绿色阴影
        : "0 6px 14px rgba(255, 0, 0, 0.5)"; // 未支付，放大红色阴影
      card.style.transform = "scale(1.05)"; // 放大效果
    });
    card.addEventListener("mouseleave", () => {
      card.style.boxShadow = paid
        ? "0 4px 12px rgba(0, 255, 0, 0.3)" // 已支付，恢复绿色阴影
        : "0 4px 12px rgba(255, 0, 0, 0.3)"; // 未支付，恢复红色阴影
      card.style.transform = "scale(1)"; // 恢复大小
    });

    // 点击开启详情
    card.addEventListener("click", () => {
      generate_register_data_detail_modal(item);
    });

    // 右键菜单
    card.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      show_contax_menu(e, item);
    });

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
    const phoneIcon = document.createElement("i");
    phoneIcon.classList.add("fas", "fa-phone-alt"); // FontAwesome 电话图标
    p2.appendChild(phoneIcon);
    p2.appendChild(document.createTextNode(` ${item.phone || "无"}`)); // 在图标后面显示文本
    p2.style.margin = "4px 0";
    p2.style.fontSize = "13px";
    p2.style.color = "#bbb"; // 暗色文本
    card.appendChild(p2);

    const p3 = document.createElement("p");
    const ageIcon = document.createElement("i");
    ageIcon.classList.add("fas", "fa-birthday-cake"); // FontAwesome 生日蛋糕图标
    p3.appendChild(ageIcon);
    p3.appendChild(document.createTextNode(` ${item.age || "?"}岁`));
    p3.style.margin = "4px 0";
    p3.style.fontSize = "13px";
    p3.style.color = "#bbb"; // 暗色文本
    card.appendChild(p3);

    const p4 = document.createElement("p");
    const docIcon = document.createElement("i");
    docIcon.classList.add("fas", "fa-id-card"); // FontAwesome 身份证图标
    p4.appendChild(docIcon);
    p4.appendChild(
      document.createTextNode(` ${item.doc_type || ""}：${item.doc_no || ""}`)
    );
    p4.style.margin = "4px 0";
    p4.style.fontSize = "13px";
    p4.style.color = "#bbb"; // 暗色文本
    card.appendChild(p4);

    return card;
  }

  function show_contax_menu(e, item) {
    // 如果已有菜单，先移除
    let old = document.getElementById("context_menu");
    if (old) old.remove();

    // 创建菜单容器
    const div = document.createElement("div");
    div.id = "context_menu";
    Object.assign(div.style, {
      position: "fixed",
      left: `${e.clientX}px`,
      top: `${e.clientY}px`,
      padding: "10px",
      backgroundColor: "#333", // 暗色背景
      border: "1px solid #444", // 深色边框
      borderRadius: "6px",
      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
      zIndex: "9999",
      opacity: 0, // 初始透明度为0
      transform: "scale(0.8)", // 初始缩放
      transition: "opacity 0.3s ease, transform 0.3s ease", // 打开动画
    });

    // 创建菜单项
    const menuItems = [
      { text: "查看详情", action: () => console.log("查看详情", item) },
      { text: "复制信息", action: () => console.log("复制信息", item) },
      { text: "删除记录", action: () => console.log("删除记录", item) },
    ];

    menuItems.forEach((menuItem) => {
      const itemDiv = document.createElement("div");
      itemDiv.textContent = menuItem.text;
      Object.assign(itemDiv.style, {
        cursor: "pointer",
        marginBottom: "6px",
        color: "#fff", // 白色文字
        fontSize: "14px",
      });
      itemDiv.addEventListener("click", menuItem.action);
      div.appendChild(itemDiv);
    });

    // 添加菜单到页面
    document.body.appendChild(div);

    // 动画：打开菜单
    setTimeout(() => {
      div.style.opacity = 1;
      div.style.transform = "scale(1)";
    }, 10);

    // 点击空白区域关闭菜单
    document.addEventListener("click", function handler(event) {
      if (!div.contains(event.target)) {
        div.remove();
        document.removeEventListener("click", handler);
      }
    });
  }

  function generate_register_data_detail_modal(item) {
    const existing = document.getElementById("register-detail-modal");
    if (existing) existing.remove();

    // 创建背景遮罩
    const overlay = document.createElement("div");
    overlay.addEventListener("click", () => overlay.remove());
    overlay.id = "register-detail-modal";
    Object.assign(overlay.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.7)", // 暗色背景
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      opacity: 0,
      transition: "opacity 0.3s ease", // 背景淡入动画
    });

    // 创建弹窗
    const modal = document.createElement("div");
    Object.assign(modal.style, {
      backgroundColor: "#222", // 深色背景
      padding: "20px",
      borderRadius: "10px",
      maxWidth: "550px",
      width: "90%",
      maxHeight: "80vh",
      overflowY: "auto",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      position: "relative",
      transform: "scale(0.8)", // 初始缩小状态
      opacity: 0,
      transition: "transform 0.3s ease, opacity 0.3s ease", // 弹窗动画
    });

    // 关闭按钮
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "<i class='fas fa-times'></i>"; // FontAwesome 关闭图标
    Object.assign(closeBtn.style, {
      position: "absolute",
      top: "10px",
      right: "15px",
      fontSize: "20px",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#ccc",
    });
    closeBtn.addEventListener("click", () => overlay.remove());
    modal.appendChild(closeBtn);

    // 标题
    const title = document.createElement("h2");
    title.textContent = item.name_cn || item.name || "报名信息";
    title.style.marginBottom = "15px";
    title.style.color = "white"; // 标题字体为白色
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
      p.style.color = "#ddd"; // 字体颜色调整为浅灰
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
    if (
      item.paper_presentation &&
      item.paper_files &&
      item.paper_files.length > 0
    ) {
      const box = document.createElement("div");
      box.style.marginTop = "15px";

      const title = document.createElement("p");
      title.innerHTML = `<strong><i class="fas fa-paperclip"></i> 投稿文件：</strong>`;
      title.style.color = "#fff";
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

      // 使用 Object.assign 为 box 添加样式
      Object.assign(box.style, {
        marginTop: "20px",
        padding: "15px",
        background: "#444", // 深色背景
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)", // 添加阴影
      });

      const t = document.createElement("p");

      // 使用 Object.assign 为标题添加样式
      Object.assign(t.style, {
        fontSize: "18px",
        fontWeight: "bold",
        marginBottom: "10px",
        color: "#fff", // 白色文字
      });

      t.innerHTML = `<i class="fas fa-credit-card"></i> 支付交易记录`;
      box.appendChild(t);

      item.payment_transactions.forEach((tx) => {
        const row = document.createElement("div");

        // 使用 Object.assign 为每一行添加样式
        Object.assign(row.style, {
          borderBottom: "1px solid #555", // 更深的分隔线
          padding: "10px 0",
        });

        row.innerHTML = `
      <p><strong>Bill ID:</strong> ${tx.bill_id}</p>
      <p><strong>支付状态:</strong> ${tx.paid ? "✅ 成功" : "❌ 失败"}</p>
      <p><strong>支付时间:</strong> ${tx.created_at}</p>
    `;

        // 添加查看原始 JSON 的按钮
        const rawBtn = document.createElement("button");

        // 使用 Object.assign 为按钮添加样式
        Object.assign(rawBtn.style, {
          padding: "8px 16px",
          marginTop: "10px",
          backgroundColor: "#007bff", // 按钮背景色
          color: "#fff", // 按钮文字颜色
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
          transition: "background-color 0.3s ease", // 背景色过渡
        });

        rawBtn.textContent = "查看支付原始 JSON";

        rawBtn.addEventListener("click", () => {
          alert(JSON.stringify(tx.raw_json, null, 2));
        });

        row.appendChild(rawBtn);

        box.appendChild(row);
      });

      modal.appendChild(box);
    }

    // 展开动画
    setTimeout(() => {
      modal.style.transform = "scale(1)";
      modal.style.opacity = "1";
      overlay.style.opacity = "1";
    }, 10); // 延迟以确保过渡生效

    // 添加到页面
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // 启动
  loadRegisterData();
});
