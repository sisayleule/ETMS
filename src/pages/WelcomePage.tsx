// =====================================================================================================================
// CINEMATIC WELCOME PAGE WITH HTML5 WORLD GLOBE PROJECTION & MULTI-LANGUAGE ENGINE
// Ambo University Woliso Campus — Department of Tourism and Hotel Management
// Solid full-viewport documentary-style design.
// =====================================================================================================================

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomePage.css';
import Logo from '../components/Logo'; // Import logo component

// Type definitions for Multi-language support
type Language = 'en' | 'am' | 'or';

interface TranslationSet {
  heroLabel: string;
  heroTitle1: string;
  heroTitle2: string;
  deptLabel: string;
  tagline: string;
  subTagline: string;
  learnMore: string;
  ctaTitle: string;
  ctaDesc: string;
  btnStudent: string;
  btnRegister: string;
  navHome: string;
  navFeatures: string;
  navStats: string;
  navJoin: string;
  featuresLabel: string;
  featuresTitle: string;
  featuresDesc: string;
  f1TagLeft: string;
  f1TagRight: string;
  f1Title: string;
  f1Desc: string;
  f2TagLeft: string;
  f2TagRight: string;
  f2Title: string;
  f2Desc: string;
  f3TagLeft: string;
  f3TagRight: string;
  f3Title: string;
  f3Desc: string;
  statsLabel: string;
  statsTitle: string;
  stat1Label: string;
  stat2Label: string;
  stat3Label: string;
  stat4Label: string;
  howLabel: string;
  howTitle: string;
  how1Title: string;
  how1Desc: string;
  how2Title: string;
  how2Desc: string;
  how3Title: string;
  how3Desc: string;
}

const languageData: Record<Language, TranslationSet> = {
  en: {
    heroLabel: "AMBO UNIVERSITY WOLISO CAMPUS",
    heroTitle1: "Educational Trip",
    heroTitle2: "Management System",
    deptLabel: "DEPARTMENT OF TOURISM AND HOTEL MANAGEMENT",
    tagline: "Explore. Learn. Experience.",
    subTagline: "Smart Educational Trip Planning for the Next Generation",
    learnMore: "LEARN MORE",
    ctaTitle: "READY TO EXPLORE?",
    ctaDesc: "Step into our smart university portal. Register or sign into your official academic account to manage everything.",
    btnStudent: "STUDENT LOGIN",
    btnRegister: "STUDENT REGISTRATION",
    navHome: "HOME",
    navFeatures: "FEATURES",
    navStats: "STATISTICS",
    navJoin: "JOIN NOW",
    featuresLabel: "ADMINISTRATIVE CORE",
    featuresTitle: "COMPREHENSIVE DIGITAL MODULE",
    featuresDesc: "Verify academic compliances, track on-field coordinators, and resolve trip complaints dynamically.",
    f1TagLeft: "REPORT →",
    f1TagRight: "Fast Resolution",
    f1Title: "Submit Field Complaints",
    f1Desc: "Direct reporting system for any onsite issues, transport delays, or accommodation concerns during active field trips.",
    f2TagLeft: "TRACK →",
    f2TagRight: "Live Dashboard",
    f2Title: "Track Trip Progress",
    f2Desc: "Real-time geographical tracking, itinerary check-ins, and safety checkpoints for all students and academic supervisors.",
    f3TagLeft: "DOCUMENTS →",
    f3TagRight: "Secure Clearance",
    f3Title: "Clearance & Document Approvals",
    f3Desc: "Seamless digital submission and review of required medical history, guardian consents, and student insurance clearances before departure.",
    statsLabel: "SYSTEM ANALYTICAL RANGE",
    statsTitle: "OPERATIONAL STATISTICS",
    stat1Label: "ENROLLED STUDENTS",
    stat2Label: "TRIPS COMPLETED",
    stat3Label: "SUPPORTED LANGUAGES",
    stat4Label: "CONTINUOUS SUPPORT",
    howLabel: "ACADEMIC CONNECTIVITY",
    howTitle: "HOW IT WORKS",
    how1Title: "Register as Student or Admin",
    how1Desc: "Create an official account with verified university credentials to initiate trip schedules.",
    how2Title: "Plan or Join Educational Trips",
    how2Desc: "Submit document clearances and access active, ongoing curriculum excursions.",
    how3Title: "Submit Reports and Track Progress",
    how3Desc: "Log reflective diaries, file safety updates, and acquire on-field performance points."
  },
  am: {
    heroLabel: "አምቦ ዩኒቨርሲቲ ወሊሶ ካምፓስ",
    heroTitle1: "የትምህርት ጉዞ",
    heroTitle2: "አስተዳደር ስርዓት",
    deptLabel: "የቱሪዝምና ሆቴል ማኔጅመንት ትምህርት ክፍል",
    tagline: "ዳስስ። ተማር። ተለማመድ።",
    subTagline: "ለሚቀጥለው ትውልድ ብልህ የትምህርት ጉዞ ዕቅድ",
    learnMore: "የበለጠ ወዳስስ",
    ctaTitle: "ለመጓዝ ዝግጁ ነዎት?",
    ctaDesc: "ወደ ብልህ ዩኒቨርሲቲ ፖርታላችን ይግቡ። ለመመዝገብ ወይም ወደ ኦፊሴላዊ የትምህርት መለያዎ ለመግባት ሁሉንም ነገር ያስተዳድሩ።",
    btnStudent: "የተማሪ መግቢያ",
    btnRegister: "የተማሪ ምዝገባ",
    navHome: "ዋና ገጽ",
    navFeatures: "ባህሪያት",
    navStats: "ስታቲስቲክስ",
    navJoin: "ይቀላቀሉ",
    featuresLabel: "የአስተዳደር ማዕከል",
    featuresTitle: "አጠቃላይ ዲጂታል ሞጁል",
    featuresDesc: "የአካዳሚክ ተገዢነትን ያረጋግጡ፣ በመስክ ላይ ያሉ አስተባባሪዎችን ይከተሉ እና የጉዞ ቅሬታዎችን በንቃት ይፍቱ።",
    f1TagLeft: "ሪፖርት →",
    f1TagRight: "ፈጣን መፍትሄ",
    f1Title: "የመስክ ቅሬታዎችን ያስገቡ",
    f1Desc: "በንቁ የመስክ ጉዞዎች ወቅት ለሚከሰቱ ማናቸውም የመስክ ችግሮች፣ የመጓጓዣ መዘግየቶች ወይም የመጠለያ ስጋቶች ቀጥተኛ የሪፖርት ማቅረቢያ ሥርዓት።",
    f2TagLeft: "ይከታተሉ →",
    f2TagRight: "የቀጥታ ዳሽቦርድ",
    f2Title: "የጉዞ ሂደትን ይከታተሉ",
    f2Desc: "ለሁሉም ተማሪዎች እና አካዳሚክ ተቆጣጣሪዎች የእውነተኛ ጊዜ ጂኦግራፊያዊ ክትትል፣ የጉዞ መርሃ ግብር ፍተሻዎች እና የደህንነት ኬላዎች።",
    f3TagLeft: "ሰነዶች →",
    f3TagRight: "አስተማማኝ ፈቃድ",
    f3Title: "የፈቃድ እና የሰነድ ማረጋገጫ",
    f3Desc: "ከመነሳትዎ በፊት አስፈላጊ የሕክምና ታሪክ ፣ የአሳዳጊ ፈቃድ እና የተማሪ ኢንሹራንስ ሰነዶችን ያለምንም እንከን በዲጂታል መንገድ ማስገባት እና መገምገም።",
    statsLabel: "የስርዓት ትንታኔ ክልል",
    statsTitle: "የአሠራር ስታቲስቲክስ",
    stat1Label: "የተመዘገቡ ተማሪዎች",
    stat2Label: "የተጠናቀቁ ጉዞዎች",
    stat3Label: "የሚደገፉ ቋንቋዎች",
    stat4Label: "የማያቋርጥ ድጋፍ",
    howLabel: "የአካዳሚክ ትስስር",
    howTitle: "እንዴት እንደሚሰራ",
    how1Title: "ከተማሪ ወይም አስተዳዳሪ ይመዝገቡ",
    how1Desc: "የጉዞ መርሃ ግብሮችን ለመጀመር በተረጋገጡ የዩኒቨርሲቲ ምስክርነቶች ኦፊሴላዊ መለያ ይፍጠሩ።",
    how2Title: "የእቅድ ወይም የትምህርት ጉዞዎችን ይቀላቀሉ",
    how2Desc: "የሰነድ ማረጋገጫዎችን ያስገቡ እና ንቁ የሆኑ ቀጣይነት ያላቸውን የጥናት ጉዞዎች ያግኙ።",
    how3Title: "ሪፖርቶችን ያስገቡ እና ሂደትን ይከታተሉ",
    how3Desc: "ነጸብራቅ ማስታወሻዎችን ይመዝግቡ፣ የደህንነት ማሻሻያዎችን ፋይል ያድርጉ እና በመስክ ላይ የስራ አፈጻጸም ነጥቦችን ያግኙ።"
  },
  or: {
    heroLabel: "YUNIVARSIITII AMBOO KAMPASII WOLISOO",
    heroTitle1: "Imala Barnootaa",
    heroTitle2: "Sirna Bulchiinsaa",
    deptLabel: "HOSPITAALITY fi TURIIZIMII BULCHIINSA",
    tagline: "Qoradhu. Baradhu. Muuxannoo Argi.",
    subTagline: "Karoora Imala Barnootaa Caalmaaf",
    learnMore: "DABALATA BARADHU",
    ctaTitle: "IMALA JALQABUUF QOPHIIDHA?",
    ctaDesc: "Gara portaala yunivarsiitii keenyaa seeni. Hunda isaa bulchuuf galmaa'i ykn herrega barnootaa keessan seenaa.",
    btnStudent: "SEENSA BARATAA",
    btnRegister: "GALMEESSA BARATAA",
    navHome: "KA'UMSA",
    navFeatures: "BAHARIYYAATA",
    navStats: "STAATISTIKSII",
    navJoin: "AMMA SEENI",
    featuresLabel: "GARAADHA BULCHIINSAA",
    featuresTitle: "MOJUULII DIGITAALAA GUUTUU",
    featuresDesc: "Waraqaalee qulqullina barnootaa mirkaneessi, hoogganitoota deeggaraa hordofi, fi komiiwwan imalaa saffisaan hiiki.",
    f1TagLeft: "GABAASA →",
    f1TagRight: "Hiika Saffisaa",
    f1Title: "Komii Dirree Galchi",
    f1Desc: "Yeroo imala dirree nannaayanii tti komiiwwan tursiisaa ykn geejjibaa fi deeggarsaa saffisaan gabaasuuf sirna qorannoo.",
    f2TagLeft: "HORDOFI →",
    f2TagRight: "Dabartii Kallattii",
    f2Title: "Adeemsa Imalaa Hordofi",
    f2Desc: "Hordoffii teessuma lafaa yeroo qabatamaa, sirna gabaasa guyyaa fi to'annoo nagaa barattoota fi hoogganitootaaf.",
    f3TagLeft: "DOOKUMANTIIN →",
    f3TagRight: "Eyyama Saffisaa",
    f3Title: "Mirkaneessa Eyyamaa fi Sanadootaa",
    f3Desc: "Gubbaa fi gadi bu'iinsa sanadoota eyyama nagaa barattootaa, eyyama maatii, fi inshuuraansii imalaa dura guutuuf sirna salphaa.",
    statsLabel: "SAMPILA SAAXILA SIRNAA",
    statsTitle: "STAATISTIKSII BULCHIINSAA",
    stat1Label: "BARATTOOTA GALMAA'AN",
    stat2Label: "IMALA XUMURAME",
    stat3Label: "AFAAN DEEGGARAMU",
    stat4Label: "DEEGGARSA WALITTI FUFIINSAA",
    howLabel: "WAL-QUNNAMTII BARNOOTAA",
    howTitle: "ADEEMSA ISAATII",
    how1Title: "Akka Barataa ykn Bulchaatti Galmaa'i",
    how1Desc: "Herrega ofisii mirkaneeffame banuun karoora imala barnootaa keessan jalqabaa.",
    how2Title: "Karoora ykn Imala Seeni",
    how2Desc: "Eyyama waraqaalee galchi fi imala barnootaa qophaayetti makami.",
    how3Title: "Gabaasa Dhiyeessi, Hordoffii Godhi",
    how3Desc: "Galmee yaadannoo barreessi, odeeffannoo nagaa gabaasi fi qabxii mul'ataa argadhu."
  }
};

// Simplified coordinate sets representing earth continents for the HTML5 canvas globe projection
const landmasses = [
  // Africa
  [
    { lat: 35, lng: -15 }, { lat: 30, lng: 32 }, { lat: 15, lng: 40 }, { lat: 5, lng: 50 },
    { lat: -5, lng: 39 }, { lat: -34, lng: 20 }, { lat: -30, lng: 15 }, { lat: 5, lng: 10 },
    { lat: 5, lng: -10 }, { lat: 15, lng: -15 }, { lat: 35, lng: -15 }
  ],
  // Europe & Asia (Eurasia)
  [
    { lat: 70, lng: -10 }, { lat: 75, lng: 60 }, { lat: 70, lng: 120 }, { lat: 55, lng: 160 },
    { lat: 35, lng: 140 }, { lat: 20, lng: 120 }, { lat: 10, lng: 100 }, { lat: 15, lng: 80 },
    { lat: 25, lng: 60 }, { lat: 30, lng: 45 }, { lat: 40, lng: 30 }, { lat: 35, lng: 10 },
    { lat: 45, lng: -10 }, { lat: 60, lng: -10 }, { lat: 70, lng: -10 }
  ],
  // North America
  [
    { lat: 70, lng: -160 }, { lat: 70, lng: -100 }, { lat: 50, lng: -60 }, { lat: 30, lng: -80 },
    { lat: 15, lng: -90 }, { lat: 20, lng: -110 }, { lat: 35, lng: -120 }, { lat: 50, lng: -130 },
    { lat: 60, lng: -150 }, { lat: 70, lng: -160 }
  ],
  // South America
  [
    { lat: 10, lng: -75 }, { lat: -5, lng: -45 }, { lat: -20, lng: -40 }, { lat: -50, lng: -65 },
    { lat: -55, lng: -70 }, { lat: -40, lng: -75 }, { lat: -20, lng: -70 }, { lat: -5, lng: -80 },
    { lat: 10, lng: -75 }
  ],
  // Australia
  [
    { lat: -15, lng: 120 }, { lat: -12, lng: 135 }, { lat: -15, lng: 145 }, { lat: -25, lng: 150 },
    { lat: -35, lng: 145 }, { lat: -38, lng: 140 }, { lat: -35, lng: 115 }, { lat: -25, lng: 113 },
    { lat: -15, lng: 120 }
  ]
];

// Gold location dots mapping (8 visible anchor cities/hubs)
const locationDots = [
  { name: 'Addis Ababa', lat: 9.0, lng: 38.7 },
  { name: 'Woliso', lat: 8.55, lng: 39.27 },
  { name: 'London', lat: 51.5, lng: -0.1 },
  { name: 'Paris', lat: 48.8, lng: 2.3 },
  { name: 'Dubai', lat: 25.2, lng: 55.2 },
  { name: 'Tokyo', lat: 35.6, lng: 139.6 },
  { name: 'New York', lat: 40.7, lng: -74.0 },
  { name: 'Cairo', lat: 30.0, lng: 31.2 }
];

// Stat counter sub-component for robust count animations inside the scroll triggers
function StatCounter({ targetValue, suffix = "" }: { targetValue: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !animatedRef.current) {
        animatedRef.current = true;
        let startTime: number | null = null;
        const duration = 2000;

        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Easing formula: 1 - Math.pow(1 - progress, 3)
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * targetValue));

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      }
    }, { threshold: 0.15 });

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [targetValue]);

  return (
    <div ref={elementRef} className="stat-number">
      {count}
      {suffix}
    </div>
  );
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Language>('en');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('welcome-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('welcome-theme', next);
  };

  // Particle list in state for high performance rendering without raw DOM hacks
  const [particles, setParticles] = useState<Array<{
    id: number;
    size: number;
    left: number;
    top: number;
    duration: number;
    delay: number;
  }>>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Fetch active translations based on state
  const textSet = languageData[lang];

  // 1. Particle creation on mount
  useEffect(() => {
    const arr = [];
    for (let i = 0; i < 60; i++) {
      arr.push({
        id: i,
        size: Math.random() * 2 + 1.5,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: Math.random() * 12 + 8,
        delay: Math.random() * -20 // Negative delay so they start immediately mid-float
      });
    }
    setParticles(arr);
  }, []);

  // 2. Scroll listener for parallax on hero and scrolled state on navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Scrolled state past 80px
      if (scrollY > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Parallax effect on hero background/layers
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${scrollY * 0.4}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 3. Globe drawing logic using requestAnimationFrame on HTML5 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let rotation = 0;

    // Set high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const size = 800; // Increased size for premium center visual
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const radius = 285; // Increased radius (approx 30% larger sphere)
    const cx = size / 2;
    const cy = size / 2;

    const projectPoint = (lat: number, lng: number, rot: number, alt = 0) => {
      const r = radius + alt;
      const phi = ((90 - lat) * Math.PI) / 180;
      const theta = ((lng + rot) * Math.PI) / 180;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      return {
        x: cx + x,
        y: cy - y,
        visible: z > 0,
        zValue: z
      };
    };

    const isLight = theme === 'light';

    const drawGlobe = (timestamp: number) => {
      ctx.clearRect(0, 0, size, size);

      // Adjust rotation speed depending on mouse position ratio (-0.5 to 0.5)
      const speed = 0.15 + (mouseX * 0.4);
      rotation += speed;

      // Layer 1 — Atmosphere glow (Radial gradient behind)
      const radialAtmosphere = ctx.createRadialGradient(cx, cy, radius - 40, cx, cy, radius + 100);
      if (isLight) {
        radialAtmosphere.addColorStop(0, 'rgba(181, 141, 27, 0.22)');
        radialAtmosphere.addColorStop(0.5, 'rgba(181, 141, 27, 0.08)');
        radialAtmosphere.addColorStop(1, 'transparent');
      } else {
        radialAtmosphere.addColorStop(0, 'rgba(99, 102, 241, 0.28)');
        radialAtmosphere.addColorStop(0.5, 'rgba(6, 182, 212, 0.14)');
        radialAtmosphere.addColorStop(1, 'transparent');
      }
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 100, 0, Math.PI * 2);
      ctx.fillStyle = radialAtmosphere;
      ctx.fill();

      // Ocean Base inside full circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip(); // Clip all subsequent drawings to the circular ocean dome

      const radialOcean = ctx.createRadialGradient(cx - 50, cy - 50, 40, cx, cy, radius);
      if (isLight) {
        radialOcean.addColorStop(0, '#FFFFFF');
        radialOcean.addColorStop(0.5, '#F1F5F9');
        radialOcean.addColorStop(1, '#E2E8F0');
      } else {
        radialOcean.addColorStop(0, '#1B3560');
        radialOcean.addColorStop(0.5, '#0F213D');
        radialOcean.addColorStop(1, '#081324');
      }
      ctx.fillStyle = radialOcean;
      ctx.fill();

      // Grid Lines: 18 Latitudes
      ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(99, 102, 241, 0.22)';
      ctx.lineWidth = 0.5;
      for (let lat = -80; lat <= 80; lat += 10) {
        ctx.beginPath();
        let first = true;
        for (let lng = -180; lng <= 180; lng += 5) {
          const pt = projectPoint(lat, lng, rotation);
          if (pt.visible) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        ctx.stroke();
      }

      // Grid Lines: 36 Longitudes
      for (let lng = 0; lng < 360; lng += 10) {
        ctx.beginPath();
        let first = true;
        for (let lat = -90; lat <= 90; lat += 5) {
          const pt = projectPoint(lat, lng, rotation);
          if (pt.visible) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        ctx.stroke();
      }

      // Continents Outlines & Solid landmass fills
      ctx.fillStyle = isLight ? 'rgba(219, 227, 238, 0.9)' : 'rgba(44, 76, 120, 0.9)';
      ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.65)' : 'rgba(129, 140, 248, 0.55)';
      ctx.lineWidth = 0.8;

      landmasses.forEach((poly) => {
        ctx.beginPath();
        let started = false;
        poly.forEach((ptCoord) => {
          const pt = projectPoint(ptCoord.lat, ptCoord.lng, rotation);
          if (pt.visible) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // 1. Draw Equator Orbit Ring: Back Half (where zValue < 0)
      ctx.beginPath();
      let firstBack = true;
      for (let lng = -180; lng <= 180; lng += 4) {
        const pt = projectPoint(12 * Math.sin(lng * Math.PI / 180), lng, rotation, 45);
        if (pt.zValue < 0 && pt.visible) {
          if (firstBack) {
            ctx.moveTo(pt.x, pt.y);
            firstBack = false;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        } else {
          firstBack = true;
        }
      }
      ctx.strokeStyle = isLight ? 'rgba(181, 141, 27, 0.12)' : 'rgba(212, 175, 55, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Flight Connections (Curves) with flowing lights
      const flightConnections = [
        { from: 'Addis Ababa', to: 'London' },
        { from: 'Addis Ababa', to: 'Dubai' },
        { from: 'Addis Ababa', to: 'Paris' },
        { from: 'London', to: 'New York' },
        { from: 'Addis Ababa', to: 'Woliso' }
      ];

      const dotCoords: Record<string, { lat: number, lng: number }> = {
        'Addis Ababa': { lat: 9.0, lng: 38.7 },
        'Woliso': { lat: 8.55, lng: 39.27 },
        'London': { lat: 51.5, lng: -0.1 },
        'Paris': { lat: 48.8, lng: 2.3 },
        'Dubai': { lat: 25.2, lng: 55.2 },
        'New York': { lat: 40.7, lng: -74.0 },
        'Cairo': { lat: 30.0, lng: 31.2 }
      };

      flightConnections.forEach((conn) => {
        const p1 = dotCoords[conn.from];
        const p2 = dotCoords[conn.to];
        if (!p1 || !p2) return;

        // Draw Arced Flight Path Line
        ctx.beginPath();
        let pathStarted = false;
        const stepsCount = 24;
        
        for (let i = 0; i <= stepsCount; i++) {
          const t = i / stepsCount;
          const lat = p1.lat + (p2.lat - p1.lat) * t;
          
          let lngDiff = p2.lng - p1.lng;
          if (lngDiff > 180) lngDiff -= 360;
          if (lngDiff < -180) lngDiff += 360;
          const lng = p1.lng + lngDiff * t;

          // Arcs up to 35px at midpoint
          const alt = Math.sin(t * Math.PI) * 35;
          const pt = projectPoint(lat, lng, rotation, alt);

          if (pt.visible) {
            if (!pathStarted) {
              ctx.moveTo(pt.x, pt.y);
              pathStarted = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            pathStarted = false;
          }
        }
        ctx.strokeStyle = isLight ? 'rgba(181, 141, 27, 0.4)' : 'rgba(212, 175, 55, 0.55)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw flowing glowing light particle on flight arc
        const packetT = (timestamp * 0.00035 + (conn.from.charCodeAt(0) * 0.2)) % 1;
        const pLat = p1.lat + (p2.lat - p1.lat) * packetT;
        let pLngDiff = p2.lng - p1.lng;
        if (pLngDiff > 180) pLngDiff -= 360;
        if (pLngDiff < -180) pLngDiff += 360;
        const pLng = p1.lng + pLngDiff * packetT;
        const pAlt = Math.sin(packetT * Math.PI) * 35;
        const pPt = projectPoint(pLat, pLng, rotation, pAlt);

        if (pPt.visible) {
          ctx.beginPath();
          ctx.arc(pPt.x, pPt.y, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#D4AF37';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 3. Location Pins, Landmark icons, and Pulsing circles
      const landmarkIcons: Record<string, string> = {
        'Paris': '🗼',
        'New York': '🗽',
        'Cairo': '🐪',
        'London': '🏰',
        'Addis Ababa': '🏛️',
        'Woliso': '🌳',
        'Dubai': '🏙️'
      };

      locationDots.forEach((dot) => {
        const pt = projectPoint(dot.lat, dot.lng, rotation, 0);
        if (pt.visible) {
          // Pulse effect
          const pulseProgress = (timestamp % 2000) / 2000;
          const pulseRadius = 3.5 + (pulseProgress * 8);
          const pulseOpacity = 1 - pulseProgress;
          
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(212, 175, 55, ${pulseOpacity * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Draw teardrop pin
          ctx.save();
          ctx.translate(pt.x, pt.y);
          
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-4, -4, -4, -10, 0, -10);
          ctx.bezierCurveTo(4, -10, 4, -4, 0, 0);
          ctx.closePath();
          ctx.fillStyle = '#D4AF37';
          ctx.fill();
          ctx.strokeStyle = isLight ? '#0F172A' : '#FFFFFF';
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Core pin dot
          ctx.beginPath();
          ctx.arc(0, -6.5, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = isLight ? '#0F172A' : '#FFFFFF';
          ctx.fill();

          // Label and custom landmark emoji!
          const icon = landmarkIcons[dot.name] || '📍';
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
          ctx.shadowBlur = 4;
          ctx.font = "bold 9px 'Montserrat', sans-serif";
          ctx.fillStyle = isLight ? '#0F172A' : '#FFFFFF';
          ctx.fillText(`${icon} ${dot.name}`, 8, -2);
          ctx.restore();
          
          ctx.restore();
        }
      });

      // 4. Floating Academic Graduation Cap (represents target educational destinations)
      const academicSites = [
        { lat: 8.55, lng: 39.27, name: "AU Woliso" }
      ];
      academicSites.forEach((site) => {
        const floatAlt = 16 + Math.sin(timestamp * 0.0022) * 3.5;
        const pt = projectPoint(site.lat, site.lng, rotation, floatAlt);
        if (pt.visible) {
          ctx.save();
          ctx.translate(pt.x, pt.y - 12);
          
          // Cap diamond top
          ctx.beginPath();
          ctx.moveTo(0, -5);
          ctx.lineTo(8, -1);
          ctx.lineTo(0, 3);
          ctx.lineTo(-8, -1);
          ctx.closePath();
          ctx.fillStyle = '#D4AF37';
          ctx.fill();
          ctx.strokeStyle = isLight ? '#0F172A' : '#FFFFFF';
          ctx.lineWidth = 0.6;
          ctx.stroke();

          // Cap base
          ctx.beginPath();
          ctx.moveTo(-4, 1);
          ctx.lineTo(-4, 4);
          ctx.quadraticCurveTo(0, 6, 4, 4);
          ctx.lineTo(4, 1);
          ctx.fillStyle = isLight ? '#1E293B' : '#E2E8F0';
          ctx.fill();
          ctx.stroke();

          // Tassel hanging down
          ctx.beginPath();
          ctx.moveTo(0, -1);
          ctx.lineTo(7, 2);
          ctx.lineTo(7, 6);
          ctx.strokeStyle = '#D4AF37';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          
          ctx.restore();
        }
      });

      // 5. Orbiting 3D Airplane with tail-smoke/trail
      const planeAngle = (timestamp * 0.0003) % (Math.PI * 2);
      const planeLat = 22 * Math.sin(planeAngle);
      const planeLng = (planeAngle * 180 / Math.PI) - 180;
      const planePt = projectPoint(planeLat, planeLng, rotation, 28);
      
      const trailLength = 8;
      const trailPts = [];
      for (let j = 1; j <= trailLength; j++) {
        const tAngle = planeAngle - (j * 0.035);
        const tLat = 22 * Math.sin(tAngle);
        const tLng = (tAngle * 180 / Math.PI) - 180;
        const tPt = projectPoint(tLat, tLng, rotation, 28);
        if (tPt.visible) {
          trailPts.push(tPt);
        }
      }
      
      if (trailPts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trailPts[0].x, trailPts[0].y);
        for (let j = 1; j < trailPts.length; j++) {
          ctx.lineTo(trailPts[j].x, trailPts[j].y);
        }
        ctx.strokeStyle = isLight ? 'rgba(181, 141, 27, 0.18)' : 'rgba(212, 175, 55, 0.28)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (planePt.visible) {
        ctx.save();
        ctx.translate(planePt.x, planePt.y);
        
        const nextAngle = planeAngle + 0.01;
        const nextLat = 22 * Math.sin(nextAngle);
        const nextLng = (nextAngle * 180 / Math.PI) - 180;
        const nextPt = projectPoint(nextLat, nextLng, rotation, 28);
        const heading = Math.atan2(nextPt.y - planePt.y, nextPt.x - planePt.x);
        ctx.rotate(heading);

        // Airplane shape path
        ctx.beginPath();
        ctx.moveTo(9, 0);       // Nose
        ctx.lineTo(-3, -7);     // Left wing
        ctx.lineTo(-1, -2);     // Core left
        ctx.lineTo(-6, -2);     // Tail wing left
        ctx.lineTo(-7, 0);      // Tail tip
        ctx.lineTo(-6, 2);      // Tail wing right
        ctx.lineTo(-1, 2);      // Core right
        ctx.lineTo(-3, 7);      // Right wing
        ctx.closePath();
        
        ctx.fillStyle = '#D4AF37';
        ctx.shadowColor = '#F0D060';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        ctx.restore();
        ctx.shadowBlur = 0;
      }

      // 6. Draw Equator Orbit Ring: Front Half (where zValue >= 0)
      ctx.beginPath();
      let firstFront = true;
      for (let lng = -180; lng <= 180; lng += 4) {
        const pt = projectPoint(12 * Math.sin(lng * Math.PI / 180), lng, rotation, 45);
        if (pt.zValue >= 0 && pt.visible) {
          if (firstFront) {
            ctx.moveTo(pt.x, pt.y);
            firstFront = false;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        } else {
          firstFront = true;
        }
      }
      ctx.strokeStyle = isLight ? 'rgba(181, 141, 27, 0.45)' : 'rgba(212, 175, 55, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 7. Floating Semi-Transparent Clouds
      const clouds = [
        { lat: 15, lng: -45, size: 22 },
        { lat: 35, lng: 75, size: 28 },
        { lat: -25, lng: -120, size: 20 },
        { lat: -5, lng: 135, size: 24 }
      ];
      clouds.forEach((cloud, index) => {
        const cloudLng = cloud.lng + (timestamp * 0.00004 * 180 / Math.PI) + (index * 45);
        const pt = projectPoint(cloud.lat, cloudLng, rotation, 18);
        if (pt.visible) {
          ctx.save();
          ctx.beginPath();
          ctx.fillStyle = isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.08)';
          ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.01)' : 'rgba(255, 255, 255, 0.04)';
          ctx.shadowBlur = 4;
          
          ctx.arc(pt.x, pt.y, cloud.size, 0, Math.PI * 2);
          ctx.arc(pt.x - cloud.size * 0.5, pt.y + cloud.size * 0.1, cloud.size * 0.65, 0, Math.PI * 2);
          ctx.arc(pt.x + cloud.size * 0.5, pt.y + cloud.size * 0.1, cloud.size * 0.65, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // 8. Globe crescent rim shade & lighting overlays (Front edge)
      const rimLight = ctx.createRadialGradient(cx - radius * 0.5, cy - radius * 0.5, radius * 0.1, cx, cy, radius);
      if (isLight) {
        rimLight.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        rimLight.addColorStop(0.8, 'transparent');
        rimLight.addColorStop(1, 'rgba(15, 23, 42, 0.08)');
      } else {
        rimLight.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
        rimLight.addColorStop(0.8, 'transparent');
        rimLight.addColorStop(1, 'rgba(0, 0, 0, 0.38)'); // Softened shadow to reduce overall darkness of the globe
      }
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = rimLight;
      ctx.fill();

      const crescentGlow = ctx.createLinearGradient(cx - radius, cy, cx, cy);
      if (isLight) {
        crescentGlow.addColorStop(0, 'rgba(181, 141, 27, 0.22)');
        crescentGlow.addColorStop(0.3, 'rgba(181, 141, 27, 0.06)');
        crescentGlow.addColorStop(1, 'transparent');
      } else {
        crescentGlow.addColorStop(0, 'rgba(212, 175, 55, 0.42)'); // Majestic gold light overlay edge
        crescentGlow.addColorStop(0.3, 'rgba(99, 102, 241, 0.16)'); // Royal indigo transitional glow
        crescentGlow.addColorStop(1, 'transparent');
      }
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = crescentGlow;
      ctx.fill();

      animFrameId = requestAnimationFrame(drawGlobe);
    };

    animFrameId = requestAnimationFrame(drawGlobe);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [mouseX, theme]);

  // 4. Scroll IntersectionObserver for adding fade/entrance animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.15 });

    const animatedElements = document.querySelectorAll('.feature-card, .step-node');
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleMouseMoveOverHero = (e: React.MouseEvent) => {
    const width = window.innerWidth;
    // ratio goes from -0.5 to 0.5 depending on mouse X location
    const ratio = (e.clientX / width) - 0.5;
    setMouseX(ratio);
  };

  const smoothScrollTo = (id: string) => {
    setMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`welcome-root ${theme}`} onMouseMove={handleMouseMoveOverHero}>
      
      {/* ===============================================================================================================
         SECTION 1 — NAVBAR (fixed top)
         =============================================================================================================== */}
      <nav ref={navRef} className={`welcome-navbar ${scrolled ? 'scrolled' : ''}`}>
        
        {/* Left Area Logo */}
        <div className="logo-area" onClick={() => smoothScrollTo('home')}>
          {/* Crest SVG (42x42px) */}
          <svg viewBox="0 0 110 120" width="42" height="42" style={{ overflow: 'visible' }}>
            {/* Rotating outer compass ring */}
            <circle 
              cx="55" 
              cy="55" 
              r="50" 
              fill="none" 
              stroke="#D4AF37" 
              strokeWidth="1.2" 
              strokeDasharray="4 3" 
              style={{ transformOrigin: '55px 55px', animation: 'compassRotate 60s linear infinite' }}
            />
            {/* Cardinal tick marks on ring */}
            <line x1="55" y1="5" x2="55" y2="12" stroke="#D4AF37" strokeWidth="1.5" />
            <line x1="55" y1="98" x2="55" y2="105" stroke="#D4AF37" strokeWidth="1.5" />
            <line x1="98" y1="55" x2="105" y2="55" stroke="#D4AF37" strokeWidth="1.5" />
            <line x1="5" y1="55" x2="12" y2="55" stroke="#D4AF37" strokeWidth="1.5" />
            
            {/* N letter at top */}
            <text x="55" y="10" fontSize="5" fontFamily="Montserrat" fill="#D4AF37" textAnchor="middle" fontWeight="bold">N</text>
            
            {/* Shield shape (static) */}
            <path d="M55 12 L88 12 L88 68 Q88 90 55 103 Q22 90 22 68 L22 12 Z" fill="#C8922A" stroke="#D4AF37" strokeWidth="1.5" />
            <path d="M55 17 L83 17 L83 66 Q83 85 55 97 Q27 85 27 66 L27 17 Z" fill="#1A237E" />
            
            {/* Large letter A centered */}
            <text x="55" y="66" fontSize="28" fontWeight="700" fontFamily="Georgia, serif" fill="#C8922A" textAnchor="middle">A</text>
            
            {/* Torch at top */}
            <rect x="53" y="20" width="4" height="10" fill="#C8922A" />
            <polygon points="55,16 52,22 58,22" fill="#FF6B35" />
            
            {/* Open book below A */}
            <rect x="42" y="74" width="11" height="7" fill="white" transform="rotate(-5 42 74)" />
            <rect x="57" y="74" width="11" height="7" fill="white" transform="rotate(5 57 74)" />
            
            {/* EST. 1947 text */}
            <text x="55" y="90" fontSize="5" fontFamily="Montserrat" fill="#D4AF37" textAnchor="middle">EST. 1947</text>
            
            {/* Laurel branches */}
            <ellipse cx="32" cy="74" rx="2" ry="4" fill="#C8922A" transform="rotate(-15 32 74)" />
            <ellipse cx="78" cy="74" rx="2" ry="4" fill="#C8922A" transform="rotate(15 78 74)" />
          </svg>
          
          <div className="logo-text-block">
            <h1 className="logo-line1">AMBO U.</h1>
            <p className="logo-line2">TOURISM & HOTEL DEPT</p>
          </div>
        </div>

        {/* Center Nav Links (Desktop) */}
        <div className="nav-center-links">
          <button onClick={() => smoothScrollTo('home')} className="nav-link-item">{textSet.navHome}</button>
          <button onClick={() => smoothScrollTo('features')} className="nav-link-item">{textSet.navFeatures}</button>
          <button onClick={() => smoothScrollTo('statistics')} className="nav-link-item">{textSet.navStats}</button>
          <button onClick={() => smoothScrollTo('join')} className="nav-link-item">{textSet.navJoin}</button>
        </div>

        {/* Right Nav Area with Language switch, Theme Switch and access button */}
        <div className="nav-right-area">
          <div className="lang-switcher">
            <button onClick={() => setLang('en')} className={`lang-btn ${lang === 'en' ? 'active' : 'inactive'}`}>EN</button>
            <span className="lang-divider"></span>
            <button onClick={() => setLang('am')} className={`lang-btn ${lang === 'am' ? 'active' : 'inactive'}`}>አማ</button>
            <span className="lang-divider"></span>
            <button onClick={() => setLang('or')} className={`lang-btn ${lang === 'or' ? 'active' : 'inactive'}`}>ORM</button>
          </div>

          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            aria-label="Toggle Theme"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="theme-toggle-icon">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="theme-toggle-icon">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
          
          <button onClick={() => navigate('/login')} className="portal-access-btn">PORTAL ACCESS</button>
        </div>

        {/* Mobile Hamburger Icon */}
        <button className={`hamburger-menu ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </nav>

      {/* Mobile Screen Slide Menu Overlay */}
      <div className={`mobile-overlay-menu ${menuOpen ? 'open' : ''}`}>
        <button onClick={() => smoothScrollTo('home')} className="mobile-overlay-link">{textSet.navHome}</button>
        <button onClick={() => smoothScrollTo('features')} className="mobile-overlay-link">{textSet.navFeatures}</button>
        <button onClick={() => smoothScrollTo('statistics')} className="mobile-overlay-link">{textSet.navStats}</button>
        <button onClick={() => smoothScrollTo('join')} className="mobile-overlay-link">{textSet.navJoin}</button>
        
        <div className="lang-switcher mt-4">
          <button onClick={() => { setLang('en'); setMenuOpen(false); }} className={`lang-btn ${lang === 'en' ? 'active' : 'inactive'} text-lg`}>EN</button>
          <span className="lang-divider h-4"></span>
          <button onClick={() => { setLang('am'); setMenuOpen(false); }} className={`lang-btn ${lang === 'am' ? 'active' : 'inactive'} text-lg`}>አማ</button>
          <span className="lang-divider h-4"></span>
          <button onClick={() => { setLang('or'); setMenuOpen(false); }} className={`lang-btn ${lang === 'or' ? 'active' : 'inactive'} text-lg`}>ORM</button>
        </div>

        <button 
          onClick={() => { setMenuOpen(false); toggleTheme(); }} 
          className="portal-access-btn mt-4 border-dashed flex items-center justify-center gap-2 text-sm px-8 py-3"
        >
          {theme === 'dark' ? '☀️ LIGHT MODE' : '🌙 DARK MODE'}
        </button>

        <button onClick={() => { setMenuOpen(false); navigate('/login'); }} className="portal-access-btn mt-4 text-base px-8 py-3">PORTAL ACCESS</button>
      </div>

      {/* ===============================================================================================================
         SECTION 2 — HERO (full screen 100vh)
         =============================================================================================================== */}
      <section id="home" className="hero-section">
        
        {/* Layer 1 — World Globe Canvas (positioned absolute on right) */}
        <canvas ref={canvasRef} className="globe-canvas" />

        {/* Layer 2 — Particle System */}
        <div className="particles-container">
          {particles.map((p) => (
            <div
              key={p.id}
              className="star-particle"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Layer 4 — Hero Content */}
        <div ref={heroRef} className="hero-content">
          
          <div className="gold-line-anim"></div>
          <p className="univ-label">{textSet.heroLabel}</p>

          <div className="typewriter-container">
            <h1 className="hero-title-1">{textSet.heroTitle1}</h1>
          </div>

          <h2 className="hero-title-2">{textSet.heroTitle2}</h2>
          
          <div className="gold-line-anim-delayed"></div>
          <p className="dept-label">{textSet.deptLabel}</p>

          <p className="tagline-text">{textSet.tagline}</p>
          <p className="subtagline-text">{textSet.subTagline}</p>

          <button onClick={() => smoothScrollTo('features')} className="learn-more-btn">
            {textSet.learnMore}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>

          {/* Bouncing scroll arrow */}
          <div className="bouncing-arrow" onClick={() => smoothScrollTo('features')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </section>

      {/* ===============================================================================================================
         SECTION 3 — FEATURES (scroll triggered)
         =============================================================================================================== */}
      <section id="features">
        <p className="section-label">{textSet.featuresLabel}</p>
        <h2 className="section-title">{textSet.featuresTitle}</h2>
        <p className="section-desc">{textSet.featuresDesc}</p>

        <div className="features-grid">
          {/* Card 1 */}
          <div className="feature-card">
            <div>
              <div className="card-icon-container icon-indigo">
                {/* Custom inline map pin icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3 className="card-title">{textSet.f1Title}</h3>
              <p className="card-description">{textSet.f1Desc}</p>
            </div>
            <div className="card-footer">
              <span className="footer-tag-left" style={{ color: 'var(--indigo)' }}>{textSet.f1TagLeft}</span>
              <span className="footer-tag-right">{textSet.f1TagRight}</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="feature-card">
            <div>
              <div className="card-icon-container icon-gold">
                {/* Custom inline compass icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
              </div>
              <h3 className="card-title">{textSet.f2Title}</h3>
              <p className="card-description">{textSet.f2Desc}</p>
            </div>
            <div className="card-footer">
              <span className="footer-tag-left" style={{ color: 'var(--gold-main)' }}>{textSet.f2TagLeft}</span>
              <span className="footer-tag-right">{textSet.f2TagRight}</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="feature-card">
            <div>
              <div className="card-icon-container icon-cyan">
                {/* Custom inline bar chart icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </div>
              <h3 className="card-title">{textSet.f3Title}</h3>
              <p className="card-description">{textSet.f3Desc}</p>
            </div>
            <div className="card-footer">
              <span className="footer-tag-left" style={{ color: 'var(--cyan)' }}>{textSet.f3TagLeft}</span>
              <span className="footer-tag-right">{textSet.f3TagRight}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===============================================================================================================
         SECTION 4 — STATISTICS (scroll triggered)
         =============================================================================================================== */}
      <section id="statistics">
        <p className="section-label">{textSet.statsLabel}</p>
        <h2 className="section-title">{textSet.statsTitle}</h2>
        
        <div className="stats-grid">
          {/* Stat 1 */}
          <div className="stat-item">
            <StatCounter targetValue={500} suffix="+" />
            <span className="stat-label">{textSet.stat1Label}</span>
          </div>

          {/* Stat 2 */}
          <div className="stat-item">
            <StatCounter targetValue={50} suffix="+" />
            <span className="stat-label">{textSet.stat2Label}</span>
          </div>

          {/* Stat 3 */}
          <div className="stat-item">
            <StatCounter targetValue={3} suffix="" />
            <span className="stat-label">{textSet.stat3Label}</span>
          </div>

          {/* Stat 4 */}
          <div className="stat-item">
            <StatCounter targetValue={24} suffix="/7" />
            <span className="stat-label">{textSet.stat4Label}</span>
          </div>
        </div>
      </section>

      {/* ===============================================================================================================
         SECTION 5 — HOW IT WORKS
         =============================================================================================================== */}
      <section className="how-it-works-section">
        <p className="section-label">{textSet.howLabel}</p>
        <h2 className="section-title">{textSet.howTitle}</h2>

        <div className="steps-container">
          <div className="steps-connecting-line"></div>

          {/* Step 1 */}
          <div className="step-node">
            <div className="step-number-circle">I</div>
            <h3 className="step-title">{textSet.how1Title}</h3>
            <p className="step-description">{textSet.how1Desc}</p>
          </div>

          {/* Step 2 */}
          <div className="step-node">
            <div className="step-number-circle">II</div>
            <h3 className="step-title">{textSet.how2Title}</h3>
            <p className="step-description">{textSet.how2Desc}</p>
          </div>

          {/* Step 3 */}
          <div className="step-node">
            <div className="step-number-circle">III</div>
            <h3 className="step-title">{textSet.how3Title}</h3>
            <p className="step-description">{textSet.how3Desc}</p>
          </div>
        </div>
      </section>

      {/* ===============================================================================================================
         SECTION 6 — CALL TO ACTION & FOOTER
         =============================================================================================================== */}
      <section id="join">
        <p className="section-label">{textSet.howLabel}</p>
        <h2 className="join-heading">{textSet.ctaTitle}</h2>
        <p className="join-desc">{textSet.ctaDesc}</p>

        <div className="cta-buttons-container">
          <button onClick={() => navigate('/login')} className="btn-student-login">
            <span className="btn-icon">👤</span>
            <span className="btn-text">{textSet.btnStudent}</span>
            <span className="btn-shine"></span>
          </button>
          <button onClick={() => navigate('/register')} className="btn-student-register">
            <span className="btn-icon">✨</span>
            <span className="btn-text">{textSet.btnRegister}</span>
            <span className="btn-shine"></span>
          </button>
        </div>

        {/* Lower Language Switcher Tabs */}
        <div className="cta-lang-switcher">
          <button onClick={() => setLang('en')} className={`lang-btn ${lang === 'en' ? 'active' : 'inactive'} text-xs`}>EN</button>
          <span className="lang-divider"></span>
          <button onClick={() => setLang('am')} className={`lang-btn ${lang === 'am' ? 'active' : 'inactive'} text-xs`}>አማርኛ</button>
          <span className="lang-divider"></span>
          <button onClick={() => setLang('or')} className={`lang-btn ${lang === 'or' ? 'active' : 'inactive'} text-xs`}>Oromoo</button>
        </div>

        {/* Footer info */}
        <footer className="welcome-footer">
          <p className="footer-univ-title">Ambo University Woliso Campus</p>
          <p className="footer-dept-title">Department of Tourism and Hotel Management</p>
          <p className="footer-copy">© 2026. All rights reserved.</p>
        </footer>
      </section>

    </div>
  );
}
