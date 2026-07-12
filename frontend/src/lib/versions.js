export const PENANG_VERSION = "WBC_Penang_2026";
export const KL_VERSION = "WBC_KL_2026";
export const DEFAULT_PUBLIC_VERSION = KL_VERSION;

export const VALID_VERSIONS = [KL_VERSION, PENANG_VERSION];

export function normalizeVersion(value) {
  if (VALID_VERSIONS.includes(value)) {
    return value;
  }

  return DEFAULT_PUBLIC_VERSION;
}

export function getVersionDisplayName(version) {
  const normalized = normalizeVersion(version);
  return normalized === KL_VERSION ? "KL" : "Penang";
}

export const versionConfigs = {
  [KL_VERSION]: {
    code: KL_VERSION,
    language: "zh",
    htmlLang: "zh-Hans",
    posterImage: "/static/images/WBC_KL_2026.jpg",
    siteName: "2026 国际佛教当代关怀研讨会",
    shortName: "吉隆坡研讨会",
    nav: {
      home: "首页",
      programme: "议程",
      speakers: "讲者",
      register: "立即报名",
      backend: "后台登录",
      penang: "槟城会场",
    },
    headline: "2026 国际佛教当代关怀研讨会",
    strapline: "新科技时代的佛学教育转型与实践",
    dateLabel: "2026 年 12 月 5 日 至 6 日",
    locationLabel: "吉隆坡珍珠酒店 The Pearl Kuala Lumpur Hotel（暂定）",
    audienceLabel: "参会对象：学者、佛教教育工作者、佛团代表及公众",
    description:
      "本活动以中文为主要交流媒介，聚焦 AI、数码传播、沉浸式科技与佛学教育实践，共同探讨在快速变动的时代中，如何持续守住价值、实现身心安定及保持教学深度。",
    ctaPrimary: "查看议题方向",
    ctaSecondary: "了解合作单位",
    quickFacts: [
      ["交流语言", "中文"],
      ["活动形式", "专题研讨与实践交流"],
      ["预估规模", "150 人"],
      ["举办城市", "吉隆坡"],
    ],
    sections: [
      {
        eyebrow: "缘起",
        title: "在技术跃迁中，重新定位教育的方向",
        body:
          "人工智能、虚拟现实、网络学习与大数据正在重塑知识传播方式，但教育的意义远不止于效率。吉隆坡场次将围绕佛教教育对价值判断、情绪安顿、伦理反思与生命实践等课题的回应方式，展开专题研讨。",
      },
      {
        eyebrow: "本届宗旨",
        title: "从中文佛教社群出发，构建面向未来的教育对话",
        body:
          "探讨佛教教育如何从佛学知识走向学佛教育，建立儿童、青年与终身学习之间的完整学习路径，并确保科技在教育中的辅助性角色，避免其取代教育本身的价值。",
      },
      {
        eyebrow: "议题方向",
        title: "围绕四大主轴展开讨论",
        body:
          "终身学习与全人教育、跨界融合与学佛探索、儿童生命教育的创新模式，以及算法时代下青年心理韧性与价值重建。",
      },
    ],
    featureCards: [
      {
        title: "终身学习",
        text: "从儿童佛学班到成年学习者，构建持续发展的佛学教育体系。",
      },
      {
        title: "跨界融合",
        text: "汇聚佛教、教育、媒体、科技与青年实践者，围绕真实案例展开交流与分享。",
      },
      {
        title: "价值重建",
        text: "回应 AI 时代的专注力危机、情绪压力与伦理判断问题。",
      },
    ],
    programmePlaceholder: "吉隆坡场议程整理中，稍后会在这里更新。",
    peoplePlaceholder: "吉隆坡场讲者与筹备名单整理中。",
    partnersTitle: "合作单位",
    partnersSubtitle: "主办、协办与媒体单位资料将持续完善。",
    partners: [
      {
        name: "YBAM",
        image: "/kl-assets/ybam-logo.png",
      },
      {
        name: "拉曼大学佛教研究中心",
        image: "/kl-assets/utar-buddhist-centre.png",
      },
      {
        name: "Eastern Horizon",
        image: "/kl-assets/eastern-horizon.png",
      },
      {
        name: "星洲日报",
        image: "/kl-assets/sinchew.jpg",
      },
    ],
    footer:
      "主办：马来西亚佛教青年总会（YBAM）｜ 协办：拉曼大学佛教研究中心、马大人间佛教研究中心",
    register: {
      title: "报名登记",
      versionLabel: "当前场次：KL",
      subtitle: "请填写以下资料完成报名，我们会依照活动类别安排后续审核与付款流程。",
      chooseType: "请选择报名类别",
      normal: "一般报名",
      paper: "论文发表",
      disclaimerTitle: "报名须知",
      disclaimerText:
        "提交报名资料即表示您理解并同意以下事项：\n1. 主办方可能因场地、流程或讲者安排等因素，对活动内容作出合理调整；\n2. 活动现场影像（含照片、影片等）可用于记录及宣传用途。",
      disclaimerAgree: "我已阅读并同意以上说明",
      conferenceInfoTitle: "活动资讯",
      conferenceInfoTheme: "主题：新科技时代的佛学教育转型与实践",
      conferenceInfoContact: "联系邮箱：wbc@ybam.org.my",
      conferenceInfoRefund:
        "报名费用原则上不设退款，如有特殊情况请来信说明。",
      paperDatesTitle: "论文重要日期",
      paperDates: [
        "全文截止：2026年10月31日",
        "录取通知：2026 年 11 月 15 日",
        "修订稿提交：2026 年 11 月 25 日",
        "最终报名截止：2026 年 11 月 25 日",
      ],
      studentPrompt: "是否为学生",
      successPaperCn:
        "报名成功，期待相遇！感谢你的信任与参与。我们已经准备好迎接你的到来，不见不散！",
      successPaperEn:
        "Registration successful! We look forward to meeting you. Thank you for your trust and participation. See you there!",
    },
  },
  [PENANG_VERSION]: {
    code: PENANG_VERSION,
    language: "en",
    htmlLang: "en",
    posterImage: "/static/images/WBC_Penang_2026.jpg",
    siteName: "World Buddhist Conference 2026",
    shortName: "Penang Conference",
    nav: {
      home: "Home",
      programme: "Programme",
      speakers: "Speakers",
      register: "Register",
      backend: "Backend",
      kl: "KL Seminar",
    },
    headline: "World Buddhist Conference 2026",
    strapline: "Ancient Wisdom for the Digital Age",
    dateLabel: "14-15 March 2026",
    locationLabel: "Convention 33, Prangin Mall, Penang, Malaysia",
    audienceLabel:
      "For academics, Dharma educators, media practitioners, and Buddhist organizations",
    description:
      "An English-facing conference bringing together keynote talks and workshops on Buddhism, AI, virtual reality, digital communication, and institutional learning.",
    ctaPrimary: "See Programme",
    ctaSecondary: "Meet Speakers",
    quickFacts: [
      ["Language", "English"],
      ["Format", "Talks + Workshops"],
      ["Duration", "2 Days"],
      ["City", "Penang"],
    ],
    sections: [
      {
        eyebrow: "Conference Focus",
        title: "Buddhist wisdom in conversation with AI and immersive media",
        body:
          "The Penang programme connects Buddhist thought with questions raised by artificial intelligence, generated knowledge, virtual reality, and practical media work.",
      },
      {
        eyebrow: "Why It Matters",
        title: "From ideas to implementation",
        body:
          "Instead of treating technology as an abstract trend, the programme highlights practical questions in education, communication, responsibility, and organizational learning.",
      },
      {
        eyebrow: "Format",
        title: "Public-facing talks and workshops",
        body:
          "Participants can move between keynote reflection and hands-on creation through sessions on generative AI, AR content, and Buddhist digital storytelling.",
      },
    ],
    featureCards: [
      {
        title: "AI Ethics",
        text: "Philosophical and ethical reflection on artificial intelligence in Buddhist settings.",
      },
      {
        title: "Digital Dharma",
        text: "Practical workshops on media creation, storytelling, and immersive Buddhist content.",
      },
      {
        title: "Institutional Learning",
        text: "What Buddhist organizations can adapt from broader industry practice.",
      },
    ],
    programmePlaceholder: "Programme data is currently unavailable.",
    peoplePlaceholder: "Speaker and committee data is currently unavailable.",
    partnersTitle: "Organizing context",
    partnersSubtitle: "Public conference information and supporting materials will continue to expand here.",
    partners: [],
    footer:
      "Organized by Young Buddhist Association of Malaysia (YBAM) for the Penang conference programme.",
    register: {
      title: "Conference Registration",
      versionLabel: "Current conference: Penang",
      subtitle:
        "Please fill in the form below to complete your registration. Payment or paper-review follow-up will be arranged after submission.",
      chooseType: "Choose registration type",
      normal: "Normal Participant",
      paper: "Paper Presentation",
      disclaimerTitle: "Registration notice",
      disclaimerText:
        "By submitting this form, you acknowledge that the organizers may make reasonable programme or logistical adjustments, and that event photography or recording may be used for documentation and promotion.",
      disclaimerAgree: "I have read and agree to the above notice",
      conferenceInfoTitle: "Conference Information",
      conferenceInfoTheme: "Theme: Artificial Intelligence, Buddhism & Buddhist Life",
      conferenceInfoContact: "Contact: wbc@ybam.org.my",
      conferenceInfoRefund:
        "All registrations are final and generally non-refundable. Please contact us for exceptional cases.",
      paperDatesTitle: "Important dates",
      paperDates: [
        "Full paper submission deadline: 11 January 2026",
        "Notification of acceptance: 15 February 2026",
        "Camera-ready paper due: 1 March 2026",
        "Final registration deadline: 1 March 2026",
      ],
      studentPrompt: "Are you a student",
      successPaperCn:
        "资料已成功提交。我们的工作人员将尽快审核您的论文材料，并在审核通过后通过电子邮件向您发送付款链接，请耐心等待。",
      successPaperEn:
        "Your submission has been received successfully. Our staff will review your paper materials and send the next steps by email. Please kindly wait.",
    },
  },
};
