import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { PosterPreview } from "./PosterPreview";
import {
  fetchCountryDialCodes,
  submitRegistration,
} from "../lib/api";
import { withBasePath } from "../lib/basePath";
import {
  DEFAULT_PUBLIC_VERSION,
  getVersionDisplayName,
  normalizeVersion,
  versionConfigs,
} from "../lib/versions";

const INITIAL_FORM = {
  name: "",
  name_cn: "",
  email: "",
  phone: "",
  country: "",
  age: "",
  emergency_contact: "",
  medical_information: "",
  doc_type: "Passport",
  doc_no: "",
  paper_title: "",
  abstract: "",
  student_card_no: "",
  student_card_expiry: "",
  student_school: "",
};

function detectMalaysian(docType, docNo) {
  if (docType !== "NRIC") {
    return false;
  }

  return /^\d{6,}$/.test((docNo || "").replace(/\D/g, ""));
}

function deriveAgeFromNRIC(raw) {
  const clean = (raw || "").replace(/\D/g, "");
  if (!/^\d{6}/.test(clean)) {
    return "";
  }

  const yy = Number(clean.slice(0, 2));
  const mm = Number(clean.slice(2, 4));
  const dd = Number(clean.slice(4, 6));
  const year = yy <= 24 ? 2000 + yy : 1900 + yy;
  const birthDate = new Date(year, mm - 1, dd);
  if (Number.isNaN(birthDate.getTime())) {
    return "";
  }

  let age = new Date().getFullYear() - year;
  const thisYearBirthday = new Date(new Date().getFullYear(), mm - 1, dd);
  if (new Date() < thisYearBirthday) {
    age -= 1;
  }

  return age >= 0 && age < 150 ? String(age) : "";
}

function getPrice(type, isMalaysian, isStudent) {
  const table = {
    normal: {
      mal: 100,
      foreign: 200,
      student_mal: 50,
      student_foreign: 200,
    },
    paper: {
      mal: 500,
      foreign: 1000,
    },
  };

  const current = table[type];
  if (type === "paper") {
    return isMalaysian ? current.mal : current.foreign;
  }

  if (isStudent) {
    return isMalaysian ? current.student_mal : current.student_foreign;
  }

  return isMalaysian ? current.mal : current.foreign;
}

function dataUrlToFile(dataUrl, fileName = "upload.jpg") {
  const [meta, content] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName, { type: mime });
}

function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxWidth / image.width, 1);
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.onerror = reject;
      image.src = event.target?.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function prepareUploadFile(file) {
  if (!file) {
    return null;
  }

  if (file.type.startsWith("image/")) {
    try {
      const compressed = await compressImage(file);
      return dataUrlToFile(compressed, file.name);
    } catch {
      return file;
    }
  }

  return file;
}

export function RegisterPage({ forcedVersion }) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const version = normalizeVersion(
    params.version || searchParams.get("version") || forcedVersion || DEFAULT_PUBLIC_VERSION,
  );
  const config = versionConfigs[version];
  const registerHomePath = version === DEFAULT_PUBLIC_VERSION ? "/" : `/${version}`;
  const currentConferenceLabel = getVersionDisplayName(version);

  const [registrationType, setRegistrationType] = useState("normal");
  const [form, setForm] = useState(INITIAL_FORM);
  const [isStudent, setIsStudent] = useState(false);
  const [agree, setAgree] = useState(false);
  const [countries, setCountries] = useState({});
  const [paymentDoc, setPaymentDoc] = useState(null);
  const [studentCardImage, setStudentCardImage] = useState(null);
  const [paperFiles, setPaperFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.lang = config.htmlLang;
    document.title = `${config.register.title} | ${config.siteName}`;
  }, [config]);

  useEffect(() => {
    let cancelled = false;
    fetchCountryDialCodes().then((result) => {
      if (!cancelled) {
        setCountries(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const isMalaysian = useMemo(
    () => detectMalaysian(form.doc_type, form.doc_no),
    [form.doc_no, form.doc_type],
  );

  const amount = useMemo(
    () => getPrice(registrationType, isMalaysian, isStudent),
    [isMalaysian, isStudent, registrationType],
  );

  useEffect(() => {
    setForm((current) => ({
      ...current,
      age: current.doc_type === "NRIC" ? deriveAgeFromNRIC(current.doc_no) : "",
    }));
  }, [form.doc_no, form.doc_type]);

  useEffect(() => {
    if (registrationType !== "normal" || !isMalaysian) {
      setIsStudent(false);
      setStudentCardImage(null);
      setForm((current) => ({
        ...current,
        student_card_no: "",
        student_card_expiry: "",
        student_school: "",
      }));
    }
  }, [isMalaysian, registrationType]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleCountryChange(value) {
    const nextPhone = countries[value] || form.phone;
    setForm((current) => ({
      ...current,
      country: value,
      phone: nextPhone,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (
          [
            "paper_title",
            "abstract",
            "student_card_no",
            "student_card_expiry",
            "student_school",
          ].includes(key)
        ) {
          return;
        }
        formData.append(key, value || "");
      });

      formData.append("version", version);
      formData.append("payment_amount", String(amount));
      formData.append("paper_presentation", registrationType === "paper" ? "true" : "false");
      formData.append("is_student", isStudent ? "yes" : "no");

      if (registrationType === "paper") {
        formData.append("paper_title", form.paper_title.trim());
        formData.append("abstract", form.abstract.trim());
      }

      if (isStudent) {
        formData.append("student_card_no", form.student_card_no);
        formData.append("student_card_expiry", form.student_card_expiry);
        formData.append("student_school", form.student_school);
        if (studentCardImage) {
          formData.append("student_card_image", studentCardImage);
        }
      }

      if (paymentDoc) {
        const processedPayment = await prepareUploadFile(paymentDoc);
        if (processedPayment) {
          formData.append("payment_doc", processedPayment);
        }
      }

      if (registrationType === "paper") {
        if (!paperFiles.length) {
          throw new Error(
            config.language === "zh"
              ? "请至少上传一份论文 PDF。"
              : "Please upload at least one paper PDF.",
          );
        }

        paperFiles.forEach((file) => {
          formData.append("paper_files", file);
        });
      }

      const payload = await submitRegistration(formData);
      const record = payload.data;

      if (registrationType === "paper") {
        const messageCn = encodeURIComponent(config.register.successPaperCn);
        const messageEn = encodeURIComponent(config.register.successPaperEn);
        window.location.href = withBasePath(`/static/templates/thankyou.html?message_cn=${messageCn}&message_en=${messageEn}`);
        return;
      }

      const name = encodeURIComponent(record.name);
      const email = encodeURIComponent(record.email);
      window.location.href = withBasePath(`/payment_gateway/pay?amount_myr=${record.payment_amount}&id=${record.id}&name=${name}&email=${email}&version=${encodeURIComponent(version)}`);
    } catch (err) {
      setError(err.payload?.error || err.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const countriesList = Object.keys(countries).sort((a, b) => a.localeCompare(b));

  return (
    <div className={`site-shell version-${version}`}>
      <header className="topbar">
        <Link className="brand-lockup" to={version === DEFAULT_PUBLIC_VERSION ? "/" : `/${version}`}>
          <span className="brand-kicker">YBAM</span>
          <span className="brand-title">{config.siteName}</span>
        </Link>
        <nav className="topnav">
          <Link to={registerHomePath}>{config.nav.home}</Link>
          <Link to={version === DEFAULT_PUBLIC_VERSION ? "/register" : `/${version}/register`}>
            {config.nav.register}
          </Link>
        </nav>
      </header>

      <main>
        <section className="register-shell">
          {config.posterImage ? (
            <div className="register-intro">
              <div className="register-intro-copy">
                <p className="eyebrow">{config.shortName}</p>
                <h1>{config.register.title}</h1>
                <p className="register-version-note">{config.register.versionLabel}</p>
                <p>{config.register.subtitle}</p>
              </div>
              <PosterPreview
                alt={`${config.siteName} poster`}
                hint={config.language === "zh" ? "点击查看海报大图" : "Click to enlarge poster"}
                src={config.posterImage}
              />
            </div>
          ) : null}
          <div className="register-card">
            <div className="section-heading">
              <p className="eyebrow">{config.shortName}</p>
              <h1 className="register-title">{config.register.title}</h1>
              <p className="register-version-note">
                {config.register.versionLabel}
                {config.language === "zh" ? `（${currentConferenceLabel}）` : ` (${currentConferenceLabel})`}
              </p>
              <p className="hero-description">{config.register.subtitle}</p>
            </div>

            <div className="type-switch">
              <button
                className={`type-pill ${registrationType === "normal" ? "active" : ""}`}
                onClick={() => setRegistrationType("normal")}
                type="button"
              >
                {config.register.normal}
              </button>
              <button
                className={`type-pill ${registrationType === "paper" ? "active" : ""}`}
                onClick={() => setRegistrationType("paper")}
                type="button"
              >
                {config.register.paper}
              </button>
            </div>

            <form className="register-form" onSubmit={handleSubmit}>
              <div className="field-grid">
                <label>
                  <span>Full Name</span>
                  <input required value={form.name} onChange={(e) => updateField("name", e.target.value)} />
                </label>
                <label>
                  <span>Chinese Name</span>
                  <input value={form.name_cn} onChange={(e) => updateField("name_cn", e.target.value)} />
                </label>
                <label>
                  <span>Document Type</span>
                  <select value={form.doc_type} onChange={(e) => updateField("doc_type", e.target.value)}>
                    <option value="Passport">Passport</option>
                    <option value="NRIC">NRIC (Malaysia)</option>
                  </select>
                </label>
                <label>
                  <span>Document Number</span>
                  <input required value={form.doc_no} onChange={(e) => updateField("doc_no", e.target.value)} />
                </label>
                <label>
                  <span>Age</span>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => updateField("age", e.target.value)}
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </label>
                <label>
                  <span>Country / Region</span>
                  <select value={form.country} onChange={(e) => handleCountryChange(e.target.value)} required>
                    <option value="">Please select</option>
                    {countriesList.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Phone</span>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </label>
              </div>

              <div className="price-strip">
                <div className={`price-tile ${isMalaysian ? "active" : ""}`}>
                  <span>Malaysian</span>
                  <strong>RM {registrationType === "paper" ? "500" : isStudent ? "50" : "100"}</strong>
                </div>
                <div className={`price-tile ${!isMalaysian ? "active" : ""}`}>
                  <span>Non-Malaysian</span>
                  <strong>RM {registrationType === "paper" ? "1000" : "200"}</strong>
                </div>
                <div className="price-tile total">
                  <span>Total</span>
                  <strong>RM {amount}</strong>
                </div>
              </div>

              {registrationType === "normal" && isMalaysian ? (
                <section className="subsection-card">
                  <div className="section-heading compact">
                    <h2>{config.register.studentPrompt}</h2>
                  </div>
                  <div className="radio-row">
                    <label className="radio-chip">
                      <input
                        checked={isStudent}
                        name="is_student"
                        onChange={() => setIsStudent(true)}
                        type="radio"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="radio-chip">
                      <input
                        checked={!isStudent}
                        name="is_student"
                        onChange={() => setIsStudent(false)}
                        type="radio"
                      />
                      <span>No</span>
                    </label>
                  </div>

                  {isStudent ? (
                    <div className="field-grid">
                      <label>
                        <span>Student Card Number</span>
                        <input
                          required={isStudent}
                          value={form.student_card_no}
                          onChange={(e) => updateField("student_card_no", e.target.value)}
                        />
                      </label>
                      <label>
                        <span>Student Card Expiry</span>
                        <input
                          required={isStudent}
                          type="date"
                          value={form.student_card_expiry}
                          onChange={(e) => updateField("student_card_expiry", e.target.value)}
                        />
                      </label>
                      <label className="full-row">
                        <span>School / Institution</span>
                        <input
                          required={isStudent}
                          value={form.student_school}
                          onChange={(e) => updateField("student_school", e.target.value)}
                        />
                      </label>
                      <label className="full-row">
                        <span>Student Card Image</span>
                        <input
                          required={isStudent}
                          accept="image/*"
                          onChange={(e) => setStudentCardImage(e.target.files?.[0] || null)}
                          type="file"
                        />
                      </label>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {registrationType === "paper" ? (
                <>
                  <section className="subsection-card">
                    <div className="field-grid">
                      <label className="full-row">
                        <span>Paper Title</span>
                        <input
                          required
                          value={form.paper_title}
                          onChange={(e) => updateField("paper_title", e.target.value)}
                        />
                      </label>
                      <label className="full-row">
                        <span>Abstract</span>
                        <textarea
                          required
                          rows={7}
                          value={form.abstract}
                          onChange={(e) => updateField("abstract", e.target.value)}
                        />
                      </label>
                      <label className="full-row">
                        <span>Upload Paper PDF</span>
                        <input
                          accept="application/pdf"
                          multiple
                          onChange={(e) => setPaperFiles(Array.from(e.target.files || []))}
                          type="file"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="subsection-card muted">
                    <div className="section-heading compact">
                      <h2>{config.register.paperDatesTitle}</h2>
                    </div>
                    <ul className="dates-list">
                      {config.register.paperDates.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                </>
              ) : null}

              <div className="field-grid">
                <label className="full-row">
                  <span>Emergency Contact</span>
                  <input
                    value={form.emergency_contact}
                    onChange={(e) => updateField("emergency_contact", e.target.value)}
                  />
                </label>
                <label className="full-row">
                  <span>Medical Information</span>
                  <textarea
                    rows={4}
                    value={form.medical_information}
                    onChange={(e) => updateField("medical_information", e.target.value)}
                  />
                </label>
                <label className="full-row">
                  <span>Payment Proof (Optional)</span>
                  <input
                    accept="image/*,application/pdf"
                    onChange={(e) => setPaymentDoc(e.target.files?.[0] || null)}
                    type="file"
                  />
                </label>
              </div>

              <section className="subsection-card muted">
                <div className="section-heading compact">
                  <h2>{config.register.conferenceInfoTitle}</h2>
                </div>
                <p>{config.register.conferenceInfoTheme}</p>
                <p>{config.register.conferenceInfoRefund}</p>
                <p>{config.register.conferenceInfoContact}</p>
              </section>

              <section className="subsection-card disclaimer">
                <div className="section-heading compact">
                  <h2>{config.register.disclaimerTitle}</h2>
                </div>
                <p>{config.register.disclaimerText}</p>
                <label className="checkbox-row">
                  <input
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    type="checkbox"
                  />
                  <span>{config.register.disclaimerAgree}</span>
                </label>
              </section>

              {error ? <div className="form-error-panel">{error}</div> : null}

              <button className="submit-button-v2" disabled={!agree || submitting} type="submit">
                {submitting
                  ? config.language === "zh"
                    ? "提交中..."
                    : "Submitting..."
                  : config.language === "zh"
                    ? "提交报名"
                    : "Submit Registration"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
