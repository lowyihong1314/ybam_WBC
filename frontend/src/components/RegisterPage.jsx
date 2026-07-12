import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { PosterPreview } from "./PosterPreview";
import {
  fetchCountryDialCodes,
  fetchExchangeRate,
  submitRegistration,
} from "../lib/api";
import { withBasePath } from "../lib/basePath";
import {
  DEFAULT_PUBLIC_VERSION,
  KL_VERSION,
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
  gender: "",
  state_region: "",
  organization: "",
  registration_group: "participant",
  participant_category: "local_public",
  accommodation_required: "",
  has_roommate: "",
  roommate_name: "",
  roommate_doc_no: "",
  project_name: "",
  helper_count: "",
  helper_names: "",
  special_request: "",
};

const KL_GROUPS = [
  { value: "monastic", label: "法师（免费报名）", free: true },
  { value: "academic_presenter", label: "学术呈现者（免费报名）", free: true },
  { value: "creative_presenter", label: "创意教学项目呈现者（免费报名）", free: true },
  { value: "vendor", label: "摊主 / 摊位协助人员（仅限一位）", free: false },
  { value: "participant", label: "普通参与者", free: false },
];

const KL_PRICE_TABLE = {
  early: {
    local_public: { label: "国内大众", amount: 190, currency: "RM" },
    foreign_public: { label: "国外大众", amount: 48, currency: "USD" },
    student: { label: "学生", amount: 75, currency: "RM" },
    member: { label: "会员团体/大马佛教杂志订户", amount: 140, currency: "RM" },
    council: { label: "全国理事", amount: 95, currency: "RM" },
  },
  regular: {
    local_public: { label: "国内大众", amount: 200, currency: "RM" },
    foreign_public: { label: "国外大众", amount: 50, currency: "USD" },
    student: { label: "学生", amount: 80, currency: "RM" },
    member: { label: "会员团体/大马佛教杂志订户", amount: 150, currency: "RM" },
    council: { label: "全国理事", amount: 100, currency: "RM" },
  },
};

const KL_ACCOMMODATION_FEE = 280;

const FALLBACK_REGION_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT",
  "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI",
  "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY",
  "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
  "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM",
  "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK",
  "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL",
  "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR",
  "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN",
  "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS",
  "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
  "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW",
  "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP",
  "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM",
  "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM",
  "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF",
  "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW",
  "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "XK", "YE", "YT", "ZA", "ZM", "ZW",
];

function getSupportedRegionCodes() {
  if (typeof Intl.supportedValuesOf !== "function") {
    return FALLBACK_REGION_CODES;
  }

  try {
    const regionCodes = Intl.supportedValuesOf("region").filter((code) =>
      /^[A-Z]{2}$/.test(code),
    );
    return regionCodes.length ? regionCodes : FALLBACK_REGION_CODES;
  } catch {
    return FALLBACK_REGION_CODES;
  }
}

const REGION_CODES = getSupportedRegionCodes();

const englishRegionNames =
  typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;
const chineseRegionNames =
  typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["zh-Hans"], { type: "region" })
    : null;

function getRegionName(displayNames, code) {
  try {
    return displayNames?.of(code) || code;
  } catch {
    return code;
  }
}

function buildWorldCountries(dialCodes = {}) {
  const byName = new Map();

  REGION_CODES.forEach((code) => {
    const label = getRegionName(englishRegionNames, code);
    const zhLabel = getRegionName(chineseRegionNames, code);
    byName.set(label, {
      code,
      value: label,
      label,
      zhLabel: zhLabel === label ? "" : zhLabel,
      dialCode: dialCodes[label] || "",
    });
  });

  Object.entries(dialCodes).forEach(([label, dialCode]) => {
    if (!byName.has(label)) {
      byName.set(label, {
        code: "",
        value: label,
        label,
        zhLabel: "",
        dialCode,
      });
      return;
    }

    byName.set(label, {
      ...byName.get(label),
      dialCode,
    });
  });

  return Array.from(byName.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

function getKlPricePhase(now = new Date()) {
  const earlyBirdEnd = new Date("2026-08-31T23:59:59+08:00");
  return now <= earlyBirdEnd ? "early" : "regular";
}

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

function formatRateTimestamp(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("zh-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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

function CountryPicker({ countries, language, onChange, value }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = countries.find((country) => country.value === value);
  const isZh = language === "zh";
  const placeholder = isZh ? "请选择国籍" : "Select country / region";
  const emptyCopy = isZh ? "没有找到对应国家" : "No countries found";
  const searchPlaceholder = isZh ? "输入国家名称搜索" : "Search country / region";
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCountries = normalizedQuery
    ? countries.filter((country) =>
        [
          country.code,
          country.label,
          country.zhLabel,
          country.dialCode,
        ]
          .filter(Boolean)
          .some((item) => item.toLowerCase().includes(normalizedQuery)),
      )
    : countries;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function selectCountry(country) {
    onChange(country);
    setOpen(false);
    setQuery("");
  }

  function handleTriggerKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function handleOptionKeyDown(event, country) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectCountry(country);
    }
  }

  return (
    <>
      <div
        aria-haspopup="dialog"
        aria-label={placeholder}
        className={`country-picker-trigger ${selected ? "selected" : "placeholder"}`}
        onClick={() => setOpen(true)}
        onKeyDown={handleTriggerKeyDown}
        role="button"
        tabIndex={0}
      >
        <span>{selected?.label || placeholder}</span>
        {selected?.zhLabel ? <small>{selected.zhLabel}</small> : null}
        {selected?.dialCode ? <em>{selected.dialCode}</em> : null}
        <strong>⌄</strong>
      </div>

      {open ? (
        <div
          aria-label={placeholder}
          aria-modal="true"
          className="country-picker-modal"
          onClick={() => setOpen(false)}
          role="dialog"
        >
          <div className="country-picker-panel" onClick={(event) => event.stopPropagation()}>
            <div className="country-picker-header">
              <div>
                <p className="eyebrow">Country</p>
                <h2>{isZh ? "选择国籍" : "Select Country / Region"}</h2>
              </div>
              <button
                aria-label="Close country picker"
                className="icon-button"
                onClick={() => setOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <input
              autoFocus
              className="country-picker-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              value={query}
            />
            <div className="country-picker-list" role="listbox">
              {filteredCountries.length ? (
                filteredCountries.map((country) => (
                  <div
                    aria-selected={value === country.value}
                    className={`country-picker-option ${value === country.value ? "active" : ""}`}
                    key={`${country.code}-${country.value}`}
                    onClick={() => selectCountry(country)}
                    onKeyDown={(event) => handleOptionKeyDown(event, country)}
                    role="option"
                    tabIndex={0}
                  >
                    <div>
                      <strong>{country.label}</strong>
                      {country.zhLabel ? <span>{country.zhLabel}</span> : null}
                    </div>
                    <small>{country.dialCode || country.code}</small>
                  </div>
                ))
              ) : (
                <p className="muted-copy">{emptyCopy}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
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
  const [exchangeRate, setExchangeRate] = useState(null);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [exchangeError, setExchangeError] = useState("");
  const [exchangeAutoTriggered, setExchangeAutoTriggered] = useState(false);
  const selectedKlGroup = KL_GROUPS.find((item) => item.value === form.registration_group) || KL_GROUPS[4];
  const klPricePhase = getKlPricePhase();
  const klSelectedPrice = KL_PRICE_TABLE[klPricePhase][form.participant_category];
  const klOriginalAmount = selectedKlGroup.free ? 0 : klSelectedPrice.amount;
  const klNeedsExchange = !selectedKlGroup.free && klSelectedPrice.currency === "USD";
  const klConvertedAmount =
    klNeedsExchange && exchangeRate
      ? Number((klOriginalAmount * exchangeRate.rate).toFixed(2))
      : klOriginalAmount;
  const klAccommodationFee =
    !selectedKlGroup.free && form.accommodation_required === "yes" ? KL_ACCOMMODATION_FEE : 0;
  const klAmount = selectedKlGroup.free
    ? 0
    : Number((klConvertedAmount + klAccommodationFee).toFixed(2));

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

  function handleCountryChange(country) {
    const value = typeof country === "string" ? country : country?.value || "";
    const nextPhone = country?.dialCode || countries[value] || form.phone;
    setForm((current) => ({
      ...current,
      country: value,
      phone: nextPhone,
    }));
  }

  async function refreshExchangeRate() {
    setExchangeLoading(true);
    setExchangeError("");

    try {
      const payload = await fetchExchangeRate("USD");
      setExchangeRate(payload);
    } catch (err) {
      setExchangeError(err.payload?.error || err.message || "Unable to fetch exchange rate.");
    } finally {
      setExchangeLoading(false);
    }
  }

  useEffect(() => {
    if (!klNeedsExchange) {
      setExchangeAutoTriggered(false);
      return;
    }

    if (version !== KL_VERSION || exchangeAutoTriggered || exchangeLoading) {
      return;
    }

    setExchangeAutoTriggered(true);
    refreshExchangeRate();
  }, [exchangeAutoTriggered, exchangeLoading, klNeedsExchange, version]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (!form.country.trim()) {
        throw new Error(
          config.language === "zh"
            ? "请选择国籍。"
            : "Please select your country / region.",
        );
      }

      if (version === KL_VERSION) {
        const formData = new FormData();
        const isFreeGroup = selectedKlGroup.free;

        formData.append("version", version);
        formData.append("registration_group", form.registration_group);
        formData.append("payment_amount", String(klAmount));
        formData.append("payment_currency", "RM");
        formData.append("participant_category", isFreeGroup ? "" : form.participant_category);
        formData.append("original_payment_amount", isFreeGroup ? "" : String(klOriginalAmount));
        formData.append("original_payment_currency", isFreeGroup ? "" : klSelectedPrice.currency);
        formData.append("exchange_rate", klNeedsExchange && exchangeRate ? String(exchangeRate.rate) : "");
        formData.append("exchange_rate_date", klNeedsExchange && exchangeRate ? exchangeRate.rate_datetime || exchangeRate.date || "" : "");
        formData.append("paper_presentation", "false");
        formData.append("name", form.registration_group === "monastic" ? form.name.trim() : form.name.trim());
        formData.append("name_cn", form.name_cn.trim());
        formData.append("email", form.email.trim());
        formData.append("phone", form.phone.trim());
        formData.append("country", form.country.trim());
        formData.append("age", form.age);
        formData.append("gender", form.gender);
        formData.append("state_region", form.state_region.trim());
        formData.append("organization", form.organization.trim());
        formData.append("project_name", form.project_name.trim());
        formData.append("helper_count", form.helper_count);
        formData.append("helper_names", form.helper_names.trim());
        formData.append("special_request", form.special_request.trim());
        formData.append("medical_information", form.medical_information);
        formData.append("emergency_contact", form.emergency_contact);

        {
          const needsAccommodation = form.accommodation_required === "yes";
          const hasRoommate = needsAccommodation && form.has_roommate === "yes";
          formData.append("accommodation_required", needsAccommodation ? "true" : "false");
          formData.append("doc_no", needsAccommodation ? form.doc_no.trim() : "");
          formData.append("roommate_name", hasRoommate ? form.roommate_name.trim() : "");
          formData.append("roommate_doc_no", hasRoommate ? form.roommate_doc_no.trim() : "");
        }

        if (klNeedsExchange && !exchangeRate) {
          throw new Error("请先点击换算按钮，将 USD 自动换算成 MYR。");
        }

        const payload = await submitRegistration(formData);
        const record = payload.data;

        if (isFreeGroup) {
          const messageCn = encodeURIComponent(config.register.successPaperCn);
          const messageEn = encodeURIComponent(config.register.successPaperEn);
          window.location.href = withBasePath(`/static/templates/thankyou.html?message_cn=${messageCn}&message_en=${messageEn}`);
          return;
        }

        const name = encodeURIComponent(record.name || record.name_cn || "Anonymous");
        const email = encodeURIComponent(record.email || "no-email@example.com");
        window.location.href = withBasePath(`/payment_gateway/pay?amount_myr=${record.payment_amount}&id=${record.id}&name=${name}&email=${email}&version=${encodeURIComponent(version)}`);
        return;
      }

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (
          [
            "paper_title",
            "abstract",
            "student_card_no",
            "student_card_expiry",
            "student_school",
            "accommodation_required",
            "has_roommate",
            "roommate_name",
            "roommate_doc_no",
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

  const countryOptions = useMemo(() => buildWorldCountries(countries), [countries]);

  if (version === KL_VERSION) {
    const isFreeGroup = selectedKlGroup.free;
    const isMonastic = form.registration_group === "monastic";
    const needsAccommodation = form.accommodation_required === "yes";
    const hasRoommate = needsAccommodation && form.has_roommate === "yes";
    const requiresProjectName = ["creative_presenter", "vendor"].includes(form.registration_group);
    const requiresCreativeHelperDetails = form.registration_group === "creative_presenter";
    const requiresBoothNotice = ["creative_presenter", "vendor"].includes(form.registration_group);

    return (
      <div className={`site-shell version-${version}`}>
        <header className="topbar">
          <Link className="brand-lockup" to={registerHomePath}>
            <span className="brand-kicker">YBAM</span>
            <span className="brand-title">{config.siteName}</span>
          </Link>
          <nav className="topnav">
            <Link to={registerHomePath}>{config.nav.home}</Link>
            <Link to={`/${version}/register`}>{config.nav.register}</Link>
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
                  hint="点击查看海报大图"
                  src={config.posterImage}
                />
              </div>
            ) : null}

            <div className="register-card">
              <div className="section-heading">
                <p className="eyebrow">{config.shortName}</p>
                <h1 className="register-title">{config.register.title}</h1>
                <p className="register-version-note">当前场次：{currentConferenceLabel}</p>
                <p className="hero-description">{config.register.subtitle}</p>
              </div>

              <form className="register-form" onSubmit={handleSubmit}>
                <section className="subsection-card">
                  <div className="section-heading compact">
                    <h2>报名组别</h2>
                  </div>
                  <div className="type-switch">
                    {KL_GROUPS.map((group) => (
                      <button
                        className={`type-pill ${form.registration_group === group.value ? "active" : ""}`}
                        key={group.value}
                        onClick={() => updateField("registration_group", group.value)}
                        type="button"
                      >
                        {group.label}
                      </button>
                    ))}
                  </div>
                </section>

                {isFreeGroup ? null : (
                  <section className="subsection-card muted">
                    <div className="section-heading compact">
                      <h2>报名费用</h2>
                      <p className="muted-copy">
                        {klPricePhase === "early"
                          ? "早鸟价优惠：2026-08-31 前报名"
                          : "普通价：2026-09-01 至 2026-11-14"}
                      </p>
                    </div>
                    <div className="field-grid">
                      <label className="full-row">
                        <span>请选择您的报名组别</span>
                        <select
                          required
                          value={form.participant_category}
                          onChange={(event) => updateField("participant_category", event.target.value)}
                        >
                          {Object.entries(KL_PRICE_TABLE[klPricePhase]).map(([value, item]) => (
                            <option key={value} value={value}>
                              {item.label} - {item.currency}{item.amount}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="price-strip price-strip-single">
                      <div className="price-tile total">
                        <span>原价</span>
                        <strong>{klSelectedPrice.currency} {klSelectedPrice.amount}</strong>
                        {klAccommodationFee > 0 ? (
                          <small>住宿费：RM {klAccommodationFee.toFixed(2)}</small>
                        ) : null}
                        {klNeedsExchange ? (
                          <small>
                            换算后付款金额：RM {exchangeRate ? klAmount.toFixed(2) : "-"}
                          </small>
                        ) : (
                          <small>付款金额：RM {klAmount.toFixed(2)}</small>
                        )}
                      </div>
                    </div>
                    {klNeedsExchange ? (
                      <div className="exchange-panel">
                        <div>
                          <strong>USD 自动换算 MYR</strong>
                          <p>
                            {exchangeRate
                              ? `${exchangeRate.fallback ? "使用缓存汇率" : "最新汇率"}：1 USD = RM ${exchangeRate.rate}（${exchangeRate.rate_datetime || exchangeRate.date || "最新"}）`
                              : "页面会自动拉取一次汇率，也可以手动点击换算。"}
                          </p>
                          {exchangeRate ? (
                            <p>
                              来源：{exchangeRate.source || "data.gov.my / BNM"}
                              {exchangeRate.fetched_at ? `；抓取时间：${formatRateTimestamp(exchangeRate.fetched_at)}` : ""}
                            </p>
                          ) : null}
                          {exchangeRate?.warning ? (
                            <p className="form-error">{exchangeRate.warning}</p>
                          ) : null}
                          <p>
                            外部汇率服务暂时失败时，系统会使用最后一次成功保存的汇率。
                          </p>
                          {exchangeError ? <p className="form-error">{exchangeError}</p> : null}
                        </div>
                        <button
                          className="secondary-button"
                          disabled={exchangeLoading}
                          onClick={refreshExchangeRate}
                          type="button"
                        >
                          {exchangeLoading ? "换算中..." : "换算成 MYR"}
                        </button>
                      </div>
                    ) : null}
                  </section>
                )}

                <section className="subsection-card">
                  <div className="section-heading compact">
                    <h2>{selectedKlGroup.label}个人资料</h2>
                  </div>
                  <div className="field-grid">
                    {form.registration_group === "monastic" ? (
                      <label>
                        <span>法名</span>
                        <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
                      </label>
                    ) : (
                      <>
                        <label>
                          <span>中文姓名（全名）</span>
                          <input required value={form.name_cn} onChange={(event) => updateField("name_cn", event.target.value)} />
                        </label>
                        <label>
                          <span>英文姓名（as per IC）</span>
                          <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
                        </label>
                      </>
                    )}

                    <label>
                      <span>性别</span>
                      <select required value={form.gender} onChange={(event) => updateField("gender", event.target.value)}>
                        <option value="">请选择</option>
                        <option value="男">男</option>
                        <option value="女">女</option>
                      </select>
                    </label>
                    <label>
                      <span>年龄</span>
                      <input required type="number" value={form.age} onChange={(event) => updateField("age", event.target.value)} />
                    </label>

                    <div className="field-control">
                      <span>国籍</span>
                      <CountryPicker
                        countries={countryOptions}
                        language={config.language}
                        onChange={handleCountryChange}
                        value={form.country}
                      />
                    </div>
                    <label>
                      <span>目前所在州属 / 地区</span>
                      <input required value={form.state_region} onChange={(event) => updateField("state_region", event.target.value)} />
                    </label>
                    <label>
                      <span>联络号码（含 Country Code）</span>
                      <input required type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
                    </label>
                    <label>
                      <span>
                        {form.registration_group === "monastic"
                          ? "所属团体或单位"
                          : form.registration_group === "vendor"
                            ? "所属团体或单位（如有）"
                            : "所属工作单位、团体或学院"}
                      </span>
                      <input
                        required={form.registration_group !== "vendor"}
                        value={form.organization}
                        onChange={(event) => updateField("organization", event.target.value)}
                      />
                    </label>

                    {!isFreeGroup ? (
                      <label className="full-row">
                        <span>Email（Billplz 付款通知）</span>
                        <input required type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
                      </label>
                    ) : null}
                  </div>
                </section>

                <section className="subsection-card">
                    <div className="section-heading compact">
                      <h2>酒店住宿安排（Hotel Accommodation）</h2>
                      {isFreeGroup ? (
                        <p className="muted-copy">
                          住宿日期：2026 年 12 月 5 日 至 6 日｜房型：Twin Room（双人房）｜住宿费用：每房 RM280
                        </p>
                      ) : (
                        <p className="muted-copy">
                          住宿日期：2026 年 12 月 5 日 至 6 日｜房型：Twin Room（双人房）｜住宿费用：每人 RM280。住宿费将与报名费合并，提交报名后一同通过 Billplz 付款。
                        </p>
                      )}
                    </div>

                    <div className="field-grid">
                      <label className="full-row">
                        <span>是否需要安排酒店住宿？</span>
                        <select
                          required
                          value={form.accommodation_required}
                          onChange={(event) => updateField("accommodation_required", event.target.value)}
                        >
                          <option value="">请选择</option>
                          <option value="yes">需要</option>
                          <option value="no">不需要</option>
                        </select>
                      </label>

                      {needsAccommodation ? (
                        <>
                          <label className="full-row">
                            <span>身份证号码（IC）/ 护照号码（Passport No.）</span>
                            <input required value={form.doc_no} onChange={(event) => updateField("doc_no", event.target.value)} />
                          </label>
                          <label className="full-row">
                            <span>是否有指定同房对象？</span>
                            <select
                              required
                              value={form.has_roommate}
                              onChange={(event) => updateField("has_roommate", event.target.value)}
                            >
                              <option value="">请选择</option>
                              <option value="yes">有</option>
                              <option value="no">没有</option>
                            </select>
                          </label>
                        </>
                      ) : null}

                      {hasRoommate ? (
                        <>
                          <label>
                            <span>同房对象姓名</span>
                            <input required value={form.roommate_name} onChange={(event) => updateField("roommate_name", event.target.value)} />
                          </label>
                          <label>
                            <span>同房对象身份证号码（IC）/ 护照号码</span>
                            <input required value={form.roommate_doc_no} onChange={(event) => updateField("roommate_doc_no", event.target.value)} />
                          </label>
                        </>
                      ) : null}
                    </div>

                    {needsAccommodation && isFreeGroup && form.has_roommate === "no" ? (
                      <p className="muted-copy">没有指定同房对象者，须自行承担整间房费用 RM280。</p>
                    ) : null}

                    <p className="muted-copy">
                      注意事项：酒店住宿申请截止日期为 2026 年 9 月 30 日。若有指定同房对象，仅需其中一位申请住宿并填写双方资料，另一位无需重复申请；双方须自行协调住宿费用，主办单位不负责后续费用分配。住宿费用一经缴付，恕不接受退款。
                    </p>
                  </section>

                {requiresProjectName ? (
                  <section className="subsection-card">
                    <div className="section-heading compact">
                      <h2>
                        {form.registration_group === "vendor"
                          ? "所负责摊位资料"
                          : "创意教学项目摊位参与详情"}
                      </h2>
                    </div>
                    <div className="field-grid">
                      <label className="full-row">
                        <span>创意教学项目名称</span>
                        <input required value={form.project_name} onChange={(event) => updateField("project_name", event.target.value)} />
                      </label>
                      {requiresCreativeHelperDetails ? (
                        <>
                          <label>
                            <span>摊位协助人员人数（仅限一位；不包含呈现者）</span>
                            <input required min="0" max="1" type="number" value={form.helper_count} onChange={(event) => updateField("helper_count", event.target.value)} />
                          </label>
                          <label className="full-row">
                            <span>请列出摊位协助人员姓名</span>
                            <textarea required rows={4} value={form.helper_names} onChange={(event) => updateField("helper_names", event.target.value)} />
                          </label>
                          <label className="full-row">
                            <span>其他特别需求（如有）</span>
                            <input value={form.special_request} onChange={(event) => updateField("special_request", event.target.value)} />
                          </label>
                        </>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                <section className="subsection-card disclaimer">
                  <div className="section-heading compact">
                    <h2>{config.register.disclaimerTitle}</h2>
                  </div>
                  <p>{config.register.disclaimerText}</p>
                  {requiresBoothNotice ? (
                    <p>
                      3. 摊位协助人员仅限一位；若需要膳食或参与研讨会其他活动，须另行以“摊主 / 摊位协助人员”身份报名并缴付相关费用。{"\n"}
                      4. 所有摊位协助人员须自行负责个人膳食及饮用水，主办方不提供餐饮安排。{"\n"}
                      5. 各摊位须自行安排足够人手，负责摊位布置、看顾及活动结束后的收拾工作。{"\n"}
                      6. 所有参与者须准时到场，并配合主办方整体安排与指示。
                    </p>
                  ) : null}
                  <label className="checkbox-row">
                    <input checked={agree} onChange={(event) => setAgree(event.target.checked)} type="checkbox" />
                    <span>{config.register.disclaimerAgree}</span>
                  </label>
                </section>

                {error ? <div className="form-error-panel">{error}</div> : null}

                <button
                  className="submit-button-v2"
                  disabled={!agree || submitting || (klNeedsExchange && (!exchangeRate || exchangeLoading))}
                  type="submit"
                >
                  {submitting ? "提交中..." : isFreeGroup ? "提交免费报名" : "提交并前往付款"}
                </button>
              </form>
            </div>
          </section>
        </main>
      </div>
    );
  }

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
                <div className="field-control">
                  <span>Country / Region</span>
                  <CountryPicker
                    countries={countryOptions}
                    language={config.language}
                    onChange={handleCountryChange}
                    value={form.country}
                  />
                </div>
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
