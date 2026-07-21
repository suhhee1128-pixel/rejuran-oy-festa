import { useEffect, useState } from "react";

const imgBackground  = "/bg_figma.png";
const imgBlob        = "/blob.png";
const imgLogo        = "/logo.png";
const imgMenuIcon    = "/icon_menu.svg";
const imgChatIcon    = "/icon_chat.svg";
const imgScienceFilled = "/icon_science_filled.svg";
const imgScience     = "/icon_science.svg";
const imgDecoImage   = "/deco.png";
const imgEllipse     = "/ellipse.svg";

/* ── Result screen assets ── */

function InteractiveBackground({ chat = false, origin = "home" }) {
  return (
    <div
      className={`v2-fluid-bg v2-fluid-bg--${origin}${chat ? " v2-fluid-bg-chat" : ""}`}
      aria-hidden="true"
    >
      <img className={`v2-bg${chat ? " v2-bg-chat" : ""}`} src={imgBackground} alt="" />
      <div className="v2-fluid-sheen" />
      <span className="v2-idle-wave v2-idle-wave-1" />
      <span className="v2-idle-wave v2-idle-wave-2" />
      <span className="v2-idle-wave v2-idle-wave-3" />
      <span className="v2-idle-wave v2-idle-wave-4" />
    </div>
  );
}

const suggestions = [
  { icon: imgScienceFilled, text: "What is PDRN?", screen: "pdrn" },
  { icon: imgScience, text: "What makes REJURAN's PDRN\ndifferent from other brands?", screen: "pdrn2" },
];

const PDRN_ANSWER =
  "PDRN (Polydeoxyribonucleotide) is a DNA-derived bioactive ingredient extracted from salmon.\n\nIt activates tissue repair, stimulates collagen production, and supports deep skin regeneration — making it the core of REJURAN's science.";

const PDRN_DIFF_ANSWER =
  "REJURAN uses pharmaceutical-grade PDRN with a clinically verified molecular weight optimized for skin absorption.\n\nUnlike other brands that use generic DNA extracts, REJURAN's PDRN is standardized through a patented purification process — ensuring consistent potency, safety, and regenerative efficacy in every product.";

/* ── Shared Header ── */
function Header({ onBack }) {
  return (
    <header className="v2-header" onClick={onBack} style={{ cursor: onBack ? "pointer" : "default" }}>
      <img src={imgMenuIcon} alt="menu" className="v2-header-icon-left" />
      <div className="v2-header-center">
        <div className="v2-title-row">
          <span className="v2-title">Chat REJURAN 8.1</span>
          <img src="/mdi_expand-more.png" alt="" className="v2-chevron" />
        </div>
        <span className="v2-subtitle">OLIVE YOUNG FESTA 2026</span>
      </div>
      <img src={imgChatIcon} alt="chat" className="v2-header-icon-right" />
    </header>
  );
}

/* ── Shared Chat Screen ── */
function ChatScreen({ question, answer, onBack, onNext }) {
  const [phase, setPhase] = useState("loading");
  const [displayed, setDisplayed] = useState("");
  const done = displayed.length >= answer.length;

  useEffect(() => {
    const t = setTimeout(() => setPhase("typing"), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "typing") return;
    if (done) return;
    const t = setTimeout(() => {
      setDisplayed(answer.slice(0, displayed.length + 1));
    }, 28);
    return () => clearTimeout(t);
  }, [phase, displayed, done, answer]);

  return (
    <>
      <InteractiveBackground chat />
      <Header onBack={onBack} />

      <div className="v2-deco v2-deco-left">
        <img src={imgDecoImage} alt="" />
      </div>
      <div className="v2-deco v2-deco-right">
        <img src={imgDecoImage} alt="" style={{ transform: "scaleX(-1)" }} />
      </div>

      <img src={imgScience} alt="" className="v2-chat-science-icon" />

      <div className="v2-bubble v2-bubble-user">{question}</div>

      {phase === "loading" ? (
        <div className="v2-bubble v2-bubble-typing">
          <span className="v2-dot" />
          <span className="v2-dot" />
          <span className="v2-dot" />
        </div>
      ) : (
        <div className="v2-bubble v2-bubble-answer">
          {displayed}
          {!done && <span className="v2-cursor" />}
        </div>
      )}

      {done && (
        <button type="button" className="v2-next-btn" onClick={onNext}>
          Next →
        </button>
      )}

      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
      </div>
    </>
  );
}

/* ── Great Screen ── */
function GreatScreen({ onOk }) {
  return (
    <>
      <InteractiveBackground origin="home" />
      <Header />

      <div className="v2-deco v2-deco-left">
        <img src={imgDecoImage} alt="" />
      </div>
      <div className="v2-deco v2-deco-right">
        <img src={imgDecoImage} alt="" style={{ transform: "scaleX(-1)" }} />
      </div>

      {/* blob rendered by shared layer in AppV2 */}

      <div className="v2-great-text">
        <p className="v2-great-title">Great</p>
        <p className="v2-great-sub">Now let's find your<br />perfect match together!</p>
      </div>

      <button type="button" className="v2-ok-btn" onClick={onOk}>
        OK!
      </button>

      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
      </div>
    </>
  );
}

const SKIN_OPTIONS = ["Normal", "Sensitive", "Oily", "Combination", "Dry", "Not sure"];
const QUIZ_QUESTION = "How would you describe your skin?";

/* ── Skin Type Quiz Screen ── */
function SkinTypeScreen({ onNext, onBack }) {
  const [selected, setSelected] = useState(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [typedQ, setTypedQ] = useState("");
  const [visibleOptions, setVisibleOptions] = useState(0);

  // typing done when full text is displayed
  const typingDone = typedQ.length >= QUIZ_QUESTION.length;

  useEffect(() => {
    // Step 1: show bubble after blob arrives
    const t1 = setTimeout(() => setShowQuestion(true), 750);
    return () => clearTimeout(t1);
  }, []);

  // Step 2: type question after bubble appears
  useEffect(() => {
    if (!showQuestion) return;
    if (typingDone) return;
    const t = setTimeout(() => {
      setTypedQ(QUIZ_QUESTION.slice(0, typedQ.length + 1));
    }, 36);
    return () => clearTimeout(t);
  }, [showQuestion, typedQ, typingDone]);

  // Step 3: reveal options one by one after typing done
  useEffect(() => {
    if (!typingDone) return;
    const timers = SKIN_OPTIONS.map((_, i) =>
      setTimeout(() => setVisibleOptions(i + 1), 300 + i * 140)
    );
    return () => timers.forEach(clearTimeout);
  }, [typingDone]);

  return (
    <>
      <InteractiveBackground chat origin="quiz" />
      <Header onBack={onBack} />

      {/* blob handled by shared layer in AppV2 */}

      {/* Question bubble */}
      <div className={`v2-quiz-question${showQuestion ? " v2-quiz-visible" : ""}`}>
        <div className="v2-quiz-q-bubble-wrap">
          <p className="v2-quiz-q-text">
            {typedQ}
            {!typingDone && <span className="v2-cursor" />}
          </p>
          {typingDone && <span className="v2-q-hint">SELECT ONLY 1</span>}
        </div>
      </div>

      {/* Options 2-column grid */}
      <div className="v2-quiz-grid">
        {SKIN_OPTIONS.map((opt, i) => (
          <button
            key={opt}
            type="button"
            className={`v2-quiz-opt${selected === opt ? " v2-quiz-opt-selected" : ""}${visibleOptions > i ? " v2-quiz-opt-visible" : ""}`}
            onClick={() => setSelected(opt)}
          >
            <span className={`v2-quiz-radio${selected === opt ? " v2-quiz-radio-on" : ""}`} />
            <span>{opt}</span>
          </button>
        ))}
      </div>

      {/* Back / Next — only show when all options visible */}
      {visibleOptions >= SKIN_OPTIONS.length && (
        <div className="v2-quiz-actions">
          <button type="button" className="v2-back-btn" onClick={onBack}>Back</button>
          <button
            type="button"
            className={`v2-card-next-btn${selected ? " v2-card-next-btn-active" : ""}`}
            onClick={() => selected && onNext(selected)}
          >
            Next
          </button>
        </div>
      )}

      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
      </div>
    </>
  );
}

const SKIN_RESPONSES = {
  "Normal":      "Great! Even balanced skin benefits from consistent care.",
  "Sensitive":   "Got it! Sensitive skin needs gentle, calming ingredients.",
  "Oily":        "Understood! Oily skin thrives with lightweight, balancing products.",
  "Combination": "Makes sense! Combination skin needs targeted zone care.",
  "Dry":         "Got it! Dry skin craves deep hydration and repair.",
  "Not sure":    "No worries — let's figure out what your skin needs together!",
};

const CONCERN_OPTIONS = [
  "Visible pores or excess oil",
  "Dullness or uneven texture",
  "Dryness, tightness or irritation",
  "Loss of firmness or elasticity",
];

const CONCERN_RESPONSES = {
  "Visible pores or excess oil":        "Got it! Your skin needs pore refinement and sebum-balancing care.",
  "Dullness or uneven texture":         "I see! Your skin is calling for brightening and gentle resurfacing.",
  "Dryness, tightness or irritation":   "Understood! Your skin barrier needs deep hydration and soothing repair.",
  "Loss of firmness or elasticity":     "Makes sense! Your skin needs collagen support and lifting care.",
};

/* Q2 concern → recommended product */
const PRODUCT_MAP = {
  "Visible pores or excess oil":      "Pore Tightening Ampoule",
  "Dullness or uneven texture":       "Turnover Ampoule",
  "Dryness, tightness or irritation": "Moisture Treatment Ampoule",
  "Loss of firmness or elasticity":   "Dual Effect Ampoule",
};

const RESULT_OPTIONS = [
  "Refined pores and smoother-looking skin",
  "Brighter, more even-looking skin",
  "Deep hydration and lasting comfort",
  "Firmer, bouncier-looking skin",
];

const QUIZ3_Q = "What results are you looking for?";
const QUIZ2_Q = "What skin concern are you noticing most lately?";

/* ── Quiz 2 Screen ── */
function Quiz2Screen({ skinType, onBack, onNext }) {
  const [selected, setSelected] = useState(null);
  const aiResponse = SKIN_RESPONSES[skinType] || "Got it!";

  const [typedResponse, setTypedResponse] = useState("");
  const [showQ2, setShowQ2] = useState(false);
  const [typedQ2, setTypedQ2] = useState("");
  const [visibleOptions, setVisibleOptions] = useState(0);

  const responseDone = typedResponse.length >= aiResponse.length;
  const q2Done = typedQ2.length >= QUIZ2_Q.length;

  // Step 1: type AI response immediately on mount
  useEffect(() => {
    const t = setTimeout(() => {
      setTypedResponse(aiResponse.slice(0, typedResponse.length + 1));
    }, 36);
    return () => clearTimeout(t);
  }, [typedResponse, aiResponse]);

  // Step 2: after response done, wait 400ms then type Q2
  useEffect(() => {
    if (!responseDone) return;
    const t = setTimeout(() => setShowQ2(true), 400);
    return () => clearTimeout(t);
  }, [responseDone]);

  // Step 3: type Q2
  useEffect(() => {
    if (!showQ2 || q2Done) return;
    const t = setTimeout(() => {
      setTypedQ2(QUIZ2_Q.slice(0, typedQ2.length + 1));
    }, 36);
    return () => clearTimeout(t);
  }, [showQ2, typedQ2, q2Done]);

  // Step 4: show options after Q2 done
  useEffect(() => {
    if (!q2Done) return;
    const timers = CONCERN_OPTIONS.map((_, i) =>
      setTimeout(() => setVisibleOptions(i + 1), 300 + i * 140)
    );
    return () => timers.forEach(clearTimeout);
  }, [q2Done]);

  return (
    <>
      <InteractiveBackground chat />
      <Header onBack={onBack} />

      <div className="v2-deco v2-deco-left"><img src={imgDecoImage} alt="" /></div>
      <div className="v2-deco v2-deco-right"><img src={imgDecoImage} alt="" style={{ transform: "scaleX(-1)" }} /></div>
      <img src={imgScience} alt="" className="v2-chat-science-icon" />

      {/* User's previous answer */}
      <div className="v2-bubble v2-bubble-user">{skinType}</div>

      {/* AI response typing */}
      <div className="v2-bubble v2-bubble-answer">
        {typedResponse}
        {!responseDone && <span className="v2-cursor" />}
      </div>

      {/* Second question bubble */}
      {showQ2 && (
        <div className="v2-bubble v2-bubble-answer v2-q2-bubble">
          {typedQ2}
          {!q2Done && <span className="v2-cursor" />}
        </div>
      )}

      {/* Concern options */}
      <div className="v2-quiz-grid v2-concern-grid">
        {CONCERN_OPTIONS.map((opt, i) => (
          <button
            key={opt}
            type="button"
            className={`v2-quiz-opt${selected === opt ? " v2-quiz-opt-selected" : ""}${visibleOptions > i ? " v2-quiz-opt-visible" : ""}`}
            onClick={() => setSelected(opt)}
          >
            <span className={`v2-quiz-radio${selected === opt ? " v2-quiz-radio-on" : ""}`} />
            <span>{opt}</span>
          </button>
        ))}
      </div>

      {visibleOptions >= CONCERN_OPTIONS.length && (
        <div className="v2-quiz-actions v2-concern-actions">
          <button type="button" className="v2-back-btn" onClick={onBack}>Back</button>
          <button
            type="button"
            className={`v2-card-next-btn${selected ? " v2-card-next-btn-active" : ""}`}
            onClick={() => selected && onNext(selected)}
          >
            Next
          </button>
        </div>
      )}

      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
      </div>
    </>
  );
}

/* ── Analyzing Screen ── */
function AnalyzingScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <>
      <InteractiveBackground origin="analyzing" />

      <Header onBack={null} />

      {/* 3 animated dots above blob */}
      <div className="v2-analyzing-dots">
        <span className="v2-dot" />
        <span className="v2-dot" />
        <span className="v2-dot" />
      </div>

      {/* Large centered blob */}
      <div className="v2-analyzing-blob">
        <img src={imgBlob} alt="REJURAN character" />
      </div>

      {/* Text */}
      <div className="v2-analyzing-text">
        <p className="v2-analyzing-title">Perfect!</p>
        <p className="v2-analyzing-body">I'm finding your best match<br />based on your answers.</p>
      </div>

      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
      </div>
    </>
  );
}

/* ── Quiz 3 Screen ── */
function Quiz3Screen({ concern, onBack, onNext }) {
  const [selected, setSelected] = useState(null);
  const aiResponse = CONCERN_RESPONSES[concern] || "Noted!";

  const [typedResponse, setTypedResponse] = useState("");
  const [showQ3, setShowQ3] = useState(false);
  const [typedQ3, setTypedQ3] = useState("");
  const [visibleOptions, setVisibleOptions] = useState(0);

  const responseDone = typedResponse.length >= aiResponse.length;
  const q3Done = typedQ3.length >= QUIZ3_Q.length;

  useEffect(() => {
    if (responseDone) return;
    const t = setTimeout(() => setTypedResponse(aiResponse.slice(0, typedResponse.length + 1)), 36);
    return () => clearTimeout(t);
  }, [typedResponse, aiResponse, responseDone]);

  useEffect(() => {
    if (!responseDone) return;
    const t = setTimeout(() => setShowQ3(true), 400);
    return () => clearTimeout(t);
  }, [responseDone]);

  useEffect(() => {
    if (!showQ3 || q3Done) return;
    const t = setTimeout(() => setTypedQ3(QUIZ3_Q.slice(0, typedQ3.length + 1)), 36);
    return () => clearTimeout(t);
  }, [showQ3, typedQ3, q3Done]);

  useEffect(() => {
    if (!q3Done) return;
    const timers = RESULT_OPTIONS.map((_, i) =>
      setTimeout(() => setVisibleOptions(i + 1), 300 + i * 140)
    );
    return () => timers.forEach(clearTimeout);
  }, [q3Done]);

  return (
    <>
      <InteractiveBackground chat />
      <Header onBack={onBack} />
      <div className="v2-deco v2-deco-left"><img src={imgDecoImage} alt="" /></div>
      <div className="v2-deco v2-deco-right"><img src={imgDecoImage} alt="" style={{ transform: "scaleX(-1)" }} /></div>
      <img src={imgScience} alt="" className="v2-chat-science-icon" />

      {/* User's concern answer */}
      <div className="v2-bubble v2-bubble-user">{concern}</div>

      {/* AI response */}
      <div className="v2-bubble v2-bubble-answer">
        {typedResponse}
        {!responseDone && <span className="v2-cursor" />}
      </div>

      {/* Third question */}
      {showQ3 && (
        <div className="v2-bubble v2-bubble-answer v2-q2-bubble">
          {typedQ3}
          {!q3Done && <span className="v2-cursor" />}
        </div>
      )}

      {/* Result options */}
      <div className="v2-quiz-grid v2-concern-grid">
        {RESULT_OPTIONS.map((opt, i) => (
          <button
            key={opt}
            type="button"
            className={`v2-quiz-opt${selected === opt ? " v2-quiz-opt-selected" : ""}${visibleOptions > i ? " v2-quiz-opt-visible" : ""}`}
            onClick={() => setSelected(opt)}
          >
            <span className={`v2-quiz-radio${selected === opt ? " v2-quiz-radio-on" : ""}`} />
            <span>{opt}</span>
          </button>
        ))}
      </div>

      {visibleOptions >= RESULT_OPTIONS.length && (
        <div className="v2-quiz-actions v2-concern-actions">
          <button type="button" className="v2-back-btn" onClick={onBack}>Back</button>
          <button
            type="button"
            className={`v2-card-next-btn${selected ? " v2-card-next-btn-active" : ""}`}
            onClick={() => selected && onNext(selected)}
          >
            Next
          </button>
        </div>
      )}

      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
      </div>
    </>
  );
}

/* ── Home Screen ── */
function HomeScreen({ onNavigate, onResult }) {
  return (
    <>
      <InteractiveBackground origin="home" />
      <Header />

      {/* DEV: quick result shortcuts */}
      <div className="dev-shortcuts">
        {[
          ["1", "Turnover Ampoule"],
          ["2", "Dual Effect Ampoule"],
          ["3", "Pore Tightening Ampoule"],
          ["4", "Moisture Treatment Ampoule"],
        ].map(([label, product]) => (
          <button key={label} className="dev-shortcut-btn" onClick={() => onResult(product)}>
            {label}
          </button>
        ))}
      </div>

      <div className="v2-blob-wrap">
        <img src={imgBlob} alt="REJURAN character" className="v2-blob" />
      </div>

      <div className="v2-greeting">
        <p>Hi!</p>
        <p>How's it going?</p>
      </div>

      <div className="v2-suggestions">
        {suggestions.map((s) => (
          <button
            key={s.text}
            type="button"
            className="v2-suggestion-item"
            onClick={() => s.screen && onNavigate(s.screen)}
          >
            <img src={s.icon} alt="" className="v2-suggestion-icon" />
            <span className="v2-suggestion-text">{s.text}</span>
          </button>
        ))}
      </div>

      <img src="/bar.png" alt="input bar" className="v2-input-bar-img" />

      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
      </div>
    </>
  );
}

/* ── Product data ── */
const PRODUCT_DATA = {
  "Turnover Ampoule": {
    name: "TURNOVER AMPOULE",
    image: "/turnover02.png",
    desc: "A youthful glow with c-PDRN®, a marine-based growth factor that helps improve the appearance of skin's tone, texture, and radiance.",
    lifestyle: "/turnover01.png",
  },
  "Dual Effect Ampoule": {
    name: "DUAL EFFECT AMPOULE",
    image: "/dualeffect02.png",
    desc: "Firmer, smoother-looking skin with c-PDRN®, an advanced skin-renewing ingredient that helps improve the appearance of elasticity, texture, and overall radiance.",
    lifestyle: "/dualeffect01.png",
  },
  "Pore Tightening Ampoule": {
    name: "PORE TIGHTENING AMPOULE",
    image: "/pore02.png",
    desc: "Refine the look of pores and achieve a smoother, more balanced complexion with Pore Tightening Ampoule.",
    lifestyle: "/pore01.png",
  },
  "Moisture Treatment Ampoule": {
    name: "MOISTURE TREATMENT AMPOULE",
    image: "/moisture02.png",
    desc: "Restore calm, deeply hydrated skin with Moisture Treatment Ampoule, a soothing hydrating serum designed to support the skin barrier, calm visible redness.",
    lifestyle: "/moisture01.png",
  },
};

/* ── Result Screen ── */
function ResultScreen({ product, onRestart, onNext }) {
  const data = PRODUCT_DATA[product] || PRODUCT_DATA["Turnover Ampoule"];

  return (
    <>
      <InteractiveBackground origin="result" />

      <Header onBack={null} />

      {/* Blob + speech bubble */}
      <div className="rs-blob-clip">
        <img src={imgBlob} alt="" />
      </div>
      <div className="rs-speech-wrap">
        <span className="rs-speech-text">Here's your match!</span>
      </div>

      {/* Product image */}
      <div className="rs-product-area">
        <img src={data.image} alt={data.name} className="rs-product-img" />
      </div>

      {/* Product name */}
      <p className="rs-product-name">{data.name}</p>

      {/* Description */}
      <p className="rs-product-desc">{data.desc}</p>

      {/* Lifestyle image */}
      <img src={data.lifestyle} alt="" className="rs-lifestyle-img" />

      {/* Next arrow button */}
      <button className="rs-next-btn" onClick={onNext}>›</button>

      {/* Logo */}
      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
      </div>
    </>
  );
}

/* ── Goodbye Screen ── */
function GoodbyeScreen({ onHome }) {
  return (
    <>
      <InteractiveBackground origin="goodbye" />
      <Header onBack={null} />

      {/* Large centered blob */}
      <div className="gb-blob-wrap">
        <img src={imgBlob} alt="" />
      </div>

      {/* Text */}
      <p className="gb-line1">Thanks for coming!</p>
      <p className="gb-line2">Enjoy!</p>

      {/* Goodbye button */}
      <button className="gb-btn" onClick={onHome}>Goodbye!</button>

      {/* Logo */}
      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
      </div>
    </>
  );
}

/* ── Root ── */
function AppV2() {
  const [screen, setScreen] = useState("home");
  const [skinType, setSkinType] = useState("");
  const [concern, setConcern] = useState("");
  const [product, setProduct] = useState("");
  // blobPos trails screen by one frame so the CSS transition always fires
  const [blobPos, setBlobPos] = useState("great");
  const showBlob = screen === "great" || screen === "quiz1";

  const goToQuiz = () => {
    setScreen("quiz1");
    // Keep blob at "great" position for one paint, then animate to "quiz1"
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setBlobPos("quiz1"));
    });
  };

  const goBackToGreat = () => {
    setBlobPos("great");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setScreen("great"));
    });
  };

  return (
    <main className="app app-v2">
      <div className="portrait-layout">
        {screen === "home"  && <HomeScreen onNavigate={setScreen} onResult={(p) => { setProduct(p); setScreen("result"); }} />}
        {screen === "pdrn"  && (
          <ChatScreen
            question="What is PDRN?"
            answer={PDRN_ANSWER}
            onBack={() => setScreen("home")}
            onNext={() => setScreen("great")}
          />
        )}
        {screen === "pdrn2" && (
          <ChatScreen
            question="What makes REJURAN's PDRN different?"
            answer={PDRN_DIFF_ANSWER}
            onBack={() => setScreen("home")}
            onNext={() => setScreen("great")}
          />
        )}
        {screen === "great" && <GreatScreen onOk={goToQuiz} />}
        {screen === "quiz1" && (
          <SkinTypeScreen
            onBack={goBackToGreat}
            onNext={(skinType) => { setSkinType(skinType); setScreen("quiz2"); }}
          />
        )}
        {screen === "quiz2" && (
          <Quiz2Screen
            skinType={skinType}
            onBack={() => setScreen("quiz1")}
            onNext={(c) => { setConcern(c); setProduct(PRODUCT_MAP[c] || ""); setScreen("quiz3"); }}
          />
        )}
        {screen === "quiz3" && (
          <Quiz3Screen
            concern={concern}
            onBack={() => setScreen("quiz2")}
            onNext={() => setScreen("analyzing")}
          />
        )}
        {screen === "analyzing" && (
          <AnalyzingScreen onDone={() => setScreen("result")} />
        )}
        {screen === "result" && (
          <ResultScreen
            product={product}
            onRestart={() => setScreen("home")}
            onNext={() => setScreen("goodbye")}
          />
        )}
        {screen === "goodbye" && (
          <GoodbyeScreen onHome={() => setScreen("home")} />
        )}

        {/* Shared blob — blobPos lags one frame behind screen so transition always plays */}
        {showBlob && (
          <img
            src={imgBlob}
            alt=""
            className={`v2-shared-blob v2-shared-blob--${blobPos}`}
          />
        )}
      </div>
    </main>
  );
}

export default AppV2;
