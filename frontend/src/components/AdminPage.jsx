import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import {
  buildProtectedAssetUrl,
  deleteRecord,
  fetchRegisterData,
  loginWithToken,
  reviewRecord,
} from "../lib/api";
import { exportRecordsWorkbook } from "../lib/exportExcel";
import { originWithBasePath, withBasePath } from "../lib/basePath";
import {
  KL_VERSION,
  PENANG_VERSION,
  getVersionDisplayName,
} from "../lib/versions";

const STORAGE_KEY = "ybam_backend_token";
const PAGE_SIZE = 8;

function formatAmount(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `RM ${Number(value).toFixed(2)}`;
}

function getTransactionState(record) {
  const transactions = [...(record.payment_transactions || [])].sort(
    (left, right) => (right.id || 0) - (left.id || 0),
  );

  const latest = transactions.find((item) => item?.raw_json?.bill_data?.state || item?.paid !== undefined);
  if (!latest) {
    return "";
  }

  return latest.raw_json?.bill_data?.state || (latest.paid ? "paid" : "pending");
}

function getTransactionDetailEntries(transaction) {
  const billData = transaction?.raw_json?.bill_data || {};

  return [
    ["Transaction ID", transaction?.id || "-"],
    ["Bill ID", transaction?.bill_id || billData.id || "-"],
    ["Register ID", transaction?.register_id || transaction?.raw_json?.register_id || "-"],
    ["State", billData.state || (transaction?.paid ? "paid" : "pending")],
    ["Paid", String(transaction?.paid ?? billData.paid ?? "-")],
    ["Amount", billData.amount || "-"],
    ["Paid Amount", billData.paid_amount || "-"],
    ["Due At", billData.due_at || "-"],
    ["Paid At", billData.paid_at || "-"],
    ["Collection ID", billData.collection_id || "-"],
    ["Email", billData.email || "-"],
    ["Mobile", billData.mobile || "-"],
    ["Name", billData.name || "-"],
    ["URL", billData.url || "-"],
    ["Signature", billData.x_signature || "-"],
    ["Created At", transaction?.created_at || "-"],
    ["Version", transaction?.version || "-"],
  ];
}

function buildRepaymentUrl(record, transaction, origin) {
  const billData = transaction?.raw_json?.bill_data || {};
  const url = new URL(withBasePath("/payment_gateway/pay"), origin);

  const amount =
    record?.payment_amount ??
    (billData.amount ? Number(billData.amount) / 100 : "");
  const registerId = record?.id || transaction?.register_id || transaction?.raw_json?.register_id || "";
  const name = record?.name || record?.name_cn || billData.name || "Anonymous";
  const email = record?.email || billData.email || "no-email@example.com";
  const version = record?.version || transaction?.version || "";

  url.searchParams.set("amount_myr", String(amount));
  url.searchParams.set("id", String(registerId));
  url.searchParams.set("name", name);
  url.searchParams.set("email", email);
  if (version) {
    url.searchParams.set("version", version);
  }

  return url.toString();
}

export function AdminPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEY) || "");
  const [version, setVersion] = useState("");
  const [room, setRoom] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [page, setPage] = useState(1);
  const [contextMenu, setContextMenu] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTokenInput, setDeleteTokenInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    document.documentElement.lang = "en";
    document.title = "YBAM Backend";
  }, []);

  useEffect(() => {
    if (!showGuide && !contextMenu && !showDeleteConfirm && !selectedTransaction) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowGuide(false);
        setContextMenu(null);
        setShowDeleteConfirm(false);
        setSelectedTransaction(null);
      }
    };

    const handlePointerDown = () => {
      setContextMenu(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handlePointerDown);
    };
  }, [contextMenu, selectedTransaction, showDeleteConfirm, showGuide]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError("");

      try {
        const login = await loginWithToken(token);
        if (cancelled) {
          return;
        }

        setVersion(login.version);
        setRoom(login.room);

        const payload = await fetchRegisterData(token);
        if (cancelled) {
          return;
        }

        setRecords(payload.data || []);
        setSelected(null);
        setPage(1);
        setContextMenu(null);
        setSelectedTransaction(null);
      } catch (err) {
        if (!cancelled) {
          setError(err.payload?.error || err.message || "Failed to load backend.");
          setToken("");
          setVersion("");
          setRoom("");
          localStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !room) {
      return undefined;
    }

    const socket = io("/", {
      path: withBasePath("/socket.io"),
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("join_room", { room });
    });

    socket.on("register_update", (item) => {
      setRecords((current) => {
        if (current.find((record) => record.id === item.id)) {
          return current;
        }

        return [item, ...current];
      });
    });

    return () => {
      socket.emit("leave_room", { room });
      socket.disconnect();
    };
  }, [room, token]);

  const filteredRecords = records.filter((record) => {
    const haystack = JSON.stringify(record).toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const acceptedCount = records.filter((record) => record.validfy).length;
  const pendingCount = records.length - acceptedCount;
  const paidCount = records.filter((record) =>
    (record.payment_transactions || []).some((item) => item.paid),
  ).length;
  const currentVersionLabel = version ? getVersionDisplayName(version) : "-";
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:5018";
  const appOrigin = originWithBasePath(origin);
  const frontendLinks = [
    {
      label: "KL 首页",
      href: `${appOrigin}/`,
    },
    {
      label: "KL 报名页",
      href: `${appOrigin}/register?version=${KL_VERSION}`,
    },
    {
      label: "KL 路径版首页",
      href: `${appOrigin}/${KL_VERSION}`,
    },
    {
      label: "KL 路径版报名页",
      href: `${appOrigin}/${KL_VERSION}/register`,
    },
    {
      label: "Penang 首页",
      href: `${appOrigin}/${PENANG_VERSION}`,
    },
    {
      label: "Penang 报名页",
      href: `${appOrigin}/register?version=${PENANG_VERSION}`,
    },
    {
      label: "Penang 路径版报名页",
      href: `${appOrigin}/${PENANG_VERSION}/register`,
    },
    {
      label: "后台登录页",
      href: `${appOrigin}/backend`,
    },
  ];

  async function handleLogin(event) {
    event.preventDefault();
    const nextToken = tokenInput.trim();
    if (!nextToken) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, nextToken);
    setToken(nextToken);
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken("");
    setTokenInput("");
    setVersion("");
    setRoom("");
    setRecords([]);
    setSelected(null);
    setPage(1);
    setContextMenu(null);
    setShowDeleteConfirm(false);
    setDeleteTokenInput("");
    setDeleteError("");
    setSelectedTransaction(null);
    setError("");
  }

  function handleExportAllData() {
    exportRecordsWorkbook(records, version);
  }

  function handleSelect(record) {
    setSelected(record);
  }

  function handleBackToResults() {
    setSelected(null);
    setSelectedTransaction(null);
  }

  async function handleCopyRepaymentUrl(transaction) {
    if (!selected) {
      return;
    }

    const repaymentUrl = buildRepaymentUrl(selected, transaction, origin);

    try {
      await navigator.clipboard.writeText(repaymentUrl);
      setCopyMessage("Payment gateway URL copied.");
      window.setTimeout(() => {
        setCopyMessage("");
      }, 2200);
    } catch {
      setCopyMessage(repaymentUrl);
    }
  }

  function updateRecordEverywhere(updatedRecord) {
    setSelected((current) => (current?.id === updatedRecord.id ? updatedRecord : current));
    setRecords((current) =>
      current.map((record) => (record.id === updatedRecord.id ? updatedRecord : record)),
    );
  }

  async function handleReview(action, recordOverride = null) {
    const targetRecord = recordOverride || selected;
    if (!targetRecord) {
      return;
    }

    try {
      const payload = await reviewRecord(token, targetRecord.id, action);
      updateRecordEverywhere(payload.data);
      setContextMenu(null);
    } catch (err) {
      setError(err.payload?.error || err.message || "Review failed.");
    }
  }

  function handleCardContextMenu(event, record) {
    event.preventDefault();
    setContextMenu({
      record,
      x: event.clientX,
      y: event.clientY,
    });
  }

  function openDeleteConfirm() {
    setDeleteTokenInput("");
    setDeleteError("");
    setShowDeleteConfirm(true);
  }

  async function handleDeleteSubmit(event) {
    event.preventDefault();

    if (!selected) {
      return;
    }

    if (deleteTokenInput.trim() !== token.trim()) {
      setDeleteError("Token 不匹配，无法删除。");
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError("");
      await deleteRecord(token, selected.id);
      setRecords((current) => current.filter((record) => record.id !== selected.id));
      setSelected(null);
      setSelectedTransaction(null);
      setShowDeleteConfirm(false);
      setDeleteTokenInput("");
    } catch (err) {
      setDeleteError(err.payload?.error || err.message || "Delete failed.");
    } finally {
      setDeleteLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [search, version]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="backend-shell">
      <header className="backend-header">
        <div>
          <p className="eyebrow">YBAM</p>
          <h1>后台管理</h1>
          <p className="backend-version-note">
            当前版本：{currentVersionLabel}
            {version ? ` (${version})` : ""}
          </p>
        </div>
        <div className="backend-actions">
          <button
            aria-label="Open backend guide"
            className="icon-button"
            onClick={() => setShowGuide(true)}
            type="button"
          >
            i
          </button>
          <a className="secondary-button" href={withBasePath("/")}>
            Back to site
          </a>
          {token ? (
            <button className="ghost-button" onClick={handleLogout} type="button">
              Log out
            </button>
          ) : null}
        </div>
      </header>

      {!token ? (
        <section className="login-panel">
          <div className="login-copy">
            <p className="eyebrow">Backend</p>
            <h2>请输入后台 Token</h2>
            <p>
              系统会根据你输入的 token 自动进入对应活动的数据视图。
            </p>
          </div>
          <form className="login-form" onSubmit={handleLogin}>
            <label htmlFor="token">Access token</label>
            <textarea
              id="token"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="Paste token here"
              rows={4}
            />
            <button className="primary-button" type="submit">
              Enter
            </button>
            {error ? <p className="form-error">{error}</p> : null}
          </form>
        </section>
      ) : (
        <>
          <section className="summary-grid">
            <article className="summary-card">
              <span>Active version</span>
              <strong>{currentVersionLabel}</strong>
            </article>
            <article className="summary-card">
              <span>Total records</span>
              <strong>{records.length}</strong>
            </article>
            <article className="summary-card">
              <span>Accepted</span>
              <strong>{acceptedCount}</strong>
            </article>
            <article className="summary-card">
              <span>Paid</span>
              <strong>{paidCount}</strong>
            </article>
            <article className="summary-card">
              <span>Pending</span>
              <strong>{pendingCount}</strong>
            </article>
          </section>

          <section className="backend-controls">
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, country, paper title..."
            />
            {token ? (
              <button
                className="secondary-button"
                disabled={!records.length}
                onClick={handleExportAllData}
                type="button"
              >
                Export All Data
              </button>
            ) : null}
            {loading ? <span className="status-note">Loading...</span> : null}
            {error ? <span className="status-note error">{error}</span> : null}
          </section>

          {selected ? (
            <section className="detail-page">
              <div className="detail-toolbar">
                <button className="secondary-button" onClick={handleBackToResults} type="button">
                  Back
                </button>
                <span className="status-note">Result view: {currentVersionLabel}</span>
              </div>

              <aside className="detail-panel detail-panel-expanded">
                <>
                  <div className="detail-header">
                    <div>
                      <p className="eyebrow">{selected.version}</p>
                      <h2>{selected.name || selected.name_cn || "Record detail"}</h2>
                    </div>
                    <div className="detail-actions">
                      <button className="accept-button" onClick={() => handleReview("accept")} type="button">
                        Approve
                      </button>
                      <button className="reject-button" onClick={() => handleReview("reject")} type="button">
                        Reject
                      </button>
                      <button className="delete-button" onClick={openDeleteConfirm} type="button">
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="detail-grid">
                    <div>
                      <span>Document</span>
                      <strong>{selected.doc_type} / {selected.doc_no || "-"}</strong>
                    </div>
                    <div>
                      <span>Phone</span>
                      <strong>{selected.phone || "-"}</strong>
                    </div>
                    <div>
                      <span>Email</span>
                      <strong>{selected.email || "-"}</strong>
                    </div>
                    <div>
                      <span>Country</span>
                      <strong>{selected.country || "-"}</strong>
                    </div>
                    <div>
                      <span>Fee</span>
                      <strong>{formatAmount(selected.payment_amount)}</strong>
                    </div>
                    <div>
                      <span>Paper</span>
                      <strong>{selected.paper_presentation ? "Yes" : "No"}</strong>
                    </div>
                  </div>

                  {selected.paper_title ? (
                    <section className="detail-section">
                      <h3>Paper title</h3>
                      <p>{selected.paper_title}</p>
                    </section>
                  ) : null}

                  {selected.abstract ? (
                    <section className="detail-section">
                      <h3>Abstract</h3>
                      <p>{selected.abstract}</p>
                    </section>
                  ) : null}

                  <section className="detail-section">
                    <h3>Attachments</h3>
                    <div className="link-group">
                      {selected.student_card_image ? (
                        <a
                          href={buildProtectedAssetUrl(
                            `/wbc/register/image/student_card/${selected.id}`,
                            token,
                          )}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Student card
                        </a>
                      ) : null}
                      {selected.payment_doc ? (
                        <a
                          href={buildProtectedAssetUrl(`/wbc/register/image/${selected.id}`, token)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Payment proof
                        </a>
                      ) : null}
                      {(selected.paper_files || []).map((file) => (
                        <a
                          href={buildProtectedAssetUrl("/wbc/get_paper_file", token, {
                            id: selected.id,
                            filename: file,
                          })}
                          key={file}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {file}
                        </a>
                      ))}
                    </div>
                  </section>

                  <section className="detail-section">
                    <h3>Transactions</h3>
                    {copyMessage ? <p className="status-note">{copyMessage}</p> : null}
                    {(selected.payment_transactions || []).length ? (
                      <div className="transactions-list">
                        {selected.payment_transactions.map((transaction) => (
                          <div className="transaction-card" key={transaction.id}>
                            <button
                              className="transaction-card-button"
                              onClick={() => setSelectedTransaction(transaction)}
                              type="button"
                            >
                              <strong>{transaction.bill_id || `Transaction #${transaction.id}`}</strong>
                              <span>{transaction.raw_json?.bill_data?.state || (transaction.paid ? "paid" : "pending")}</span>
                              <small>{transaction.created_at}</small>
                            </button>
                            <div className="transaction-card-actions">
                              <button
                                className="secondary-button transaction-copy-button"
                                onClick={() => handleCopyRepaymentUrl(transaction)}
                                type="button"
                              >
                                Copy payment URL
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="muted-copy">No payment records yet.</p>
                    )}
                  </section>
                </>
              </aside>
            </section>
          ) : (
            <section className="backend-grid records-only">
              <div className="records-column">
                {paginatedRecords.length ? (
                  paginatedRecords.map((record) => {
                    const transactionState = getTransactionState(record);
                    return (
                      <button
                        className="record-card record-card-compact"
                        key={record.id}
                        onContextMenu={(event) => handleCardContextMenu(event, record)}
                        onClick={() => handleSelect(record)}
                        type="button"
                      >
                        <div className="record-topline">
                          <span className="record-id">ID #{record.id}</span>
                          {transactionState ? (
                            <span className={`status-pill transaction-state ${transactionState.toLowerCase()}`}>
                              {transactionState}
                            </span>
                          ) : null}
                        </div>
                        <div className="record-header">
                          <strong>{record.name || record.name_cn || "Unnamed record"}</strong>
                          <span className={`status-pill ${record.validfy ? "accepted" : "pending"}`}>
                            {record.validfy ? "Accepted" : "Pending"}
                          </span>
                        </div>
                        <p>{record.email || "-"}</p>
                        <p>{record.country || "-"}</p>
                        <div className="record-meta-row">
                          <span>{record.created_at}</span>
                          <span>{formatAmount(record.payment_amount)}</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="empty-state">No records for this version yet.</div>
                )}
              </div>
            </section>
          )}

          {!selected && filteredRecords.length > 0 ? (
            <section className="pagination-bar">
              <span className="status-note">
                Page {currentPage} / {totalPages}
              </span>
              <span className="status-note">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredRecords.length)} of {filteredRecords.length}
              </span>
              <div className="pagination-actions">
                <button
                  className="secondary-button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  type="button"
                >
                  Previous
                </button>
                <button
                  className="secondary-button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  type="button"
                >
                  Next
                </button>
              </div>
            </section>
          ) : null}
        </>
      )}

      {showGuide ? (
        <div
          aria-label="Frontend route guide"
          aria-modal="true"
          className="guide-modal"
          onClick={() => setShowGuide(false)}
          role="dialog"
        >
          <div className="guide-panel" onClick={(event) => event.stopPropagation()}>
            <div className="guide-header">
              <div>
                <p className="eyebrow">Guide</p>
                <h2>入口与使用说明</h2>
              </div>
              <button
                aria-label="Close guide"
                className="icon-button"
                onClick={() => setShowGuide(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="guide-copy">
              <p>前台默认首页是 KL。Penang 入口已经隐藏，但对应链接仍可直接访问。</p>
              <p>报名页可用 `version` 参数切换版本；后台版本则由 token 自动判断。</p>
            </div>

            <div className="guide-links">
              {frontendLinks.map((item) => (
                <article className="guide-link-card" key={item.href}>
                  <span>{item.label}</span>
                  <a href={item.href} rel="noreferrer" target="_blank">
                    {item.href}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {contextMenu ? (
        <div
          className="context-menu"
          onClick={(event) => event.stopPropagation()}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button onClick={() => handleReview("accept", contextMenu.record)} type="button">
            Approve
          </button>
          <button onClick={() => handleReview("reject", contextMenu.record)} type="button">
            Reject
          </button>
        </div>
      ) : null}

      {showDeleteConfirm ? (
        <div
          aria-label="Delete confirmation"
          aria-modal="true"
          className="guide-modal"
          onClick={() => setShowDeleteConfirm(false)}
          role="dialog"
        >
          <div className="confirm-panel" onClick={(event) => event.stopPropagation()}>
            <div className="guide-header">
              <div>
                <p className="eyebrow">Delete</p>
                <h2>输入当前 Token 才能删除</h2>
              </div>
            </div>
            <p className="guide-copy">
              这会把当前记录标记为删除。为了避免误操作，请再次输入当前登录 token。
            </p>
            <form className="login-form" onSubmit={handleDeleteSubmit}>
              <label htmlFor="delete-token">Current token</label>
              <textarea
                id="delete-token"
                onChange={(event) => setDeleteTokenInput(event.target.value)}
                rows={4}
                value={deleteTokenInput}
              />
              {deleteError ? <p className="form-error">{deleteError}</p> : null}
              <div className="detail-actions">
                <button
                  className="secondary-button"
                  onClick={() => setShowDeleteConfirm(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button className="delete-button" disabled={deleteLoading} type="submit">
                  {deleteLoading ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {selectedTransaction ? (
        <div
          aria-label="Transaction detail"
          aria-modal="true"
          className="guide-modal"
          onClick={() => setSelectedTransaction(null)}
          role="dialog"
        >
          <div className="transaction-modal" onClick={(event) => event.stopPropagation()}>
            <div className="guide-header">
              <div>
                <p className="eyebrow">Transaction</p>
                <h2>{selectedTransaction.bill_id || `Transaction #${selectedTransaction.id}`}</h2>
              </div>
              <div className="detail-actions">
                <button
                  className="secondary-button"
                  onClick={() => handleCopyRepaymentUrl(selectedTransaction)}
                  type="button"
                >
                  Copy payment URL
                </button>
                <button
                  aria-label="Close transaction detail"
                  className="icon-button"
                  onClick={() => setSelectedTransaction(null)}
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="transaction-detail-grid">
              {getTransactionDetailEntries(selectedTransaction).map(([label, value]) => {
                const isUrl = label === "URL" && value && value !== "-";
                return (
                  <div className="transaction-detail-card" key={label}>
                    <span>{label}</span>
                    {isUrl ? (
                      <a href={value} rel="noreferrer" target="_blank">
                        {value}
                      </a>
                    ) : (
                      <strong>{value}</strong>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
