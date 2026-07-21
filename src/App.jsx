import { useEffect, useMemo, useRef, useState } from "react";
import { NeatGradient } from "@firecms/neat";

const gradientConfig = {
  colors: [
    {
      color: "#1EA29E",
      enabled: true,
    },
    {
      color: "#1EA29E",
      enabled: true,
    },
    {
      color: "#CCF2EE",
      enabled: true,
    },
    {
      color: "#00BEAC",
      enabled: true,
    },
    {
      color: "#CCF2EE",
      enabled: false,
    },
    {
      color: "#CCF2EE",
      enabled: false,
    },
  ],
  speed: 2.5,
  horizontalPressure: 5,
  verticalPressure: 5,
  waveFrequencyX: 2,
  waveFrequencyY: 3,
  waveAmplitude: 6,
  shadows: 2,
  highlights: 0,
  colorBrightness: 0.9,
  colorSaturation: -3,
  wireframe: false,
  colorBlending: 4,
  backgroundColor: "#CCF2EE",
  backgroundAlpha: 1,
  grainScale: 0,
  grainSparsity: 0,
  grainIntensity: 0,
  grainSpeed: 0,
  resolution: 0.4,
  yOffset: 120,
  yOffsetWaveMultiplier: 1,
  yOffsetColorMultiplier: 4.8,
  yOffsetFlowMultiplier: 5.3,
  flowDistortionA: 3.7,
  flowDistortionB: 0.8,
  flowScale: 1.6,
  flowEase: 0.32,
  flowEnabled: true,
  enableProceduralTexture: false,
  transparentTextureVoid: true,
  textureVoidLikelihood: 0.29,
  textureVoidWidthMin: 120,
  textureVoidWidthMax: 420,
  textureBandDensity: 2.9,
  textureColorBlending: 0.06,
  textureSeed: 536,
  textureEase: 0.93,
  proceduralBackgroundColor: "#775454",
  textureShapeTriangles: 48,
  textureShapeCircles: 15,
  textureShapeBars: 15,
  textureShapeSquiggles: 27,
  domainWarpEnabled: true,
  domainWarpIntensity: 0.1,
  domainWarpScale: 2.4,
  vignetteIntensity: 0.45,
  vignetteRadius: 0.55,
  fresnelEnabled: false,
  fresnelPower: 2.7,
  fresnelIntensity: 1.3,
  fresnelColor: "#FFFFFF",
  iridescenceEnabled: false,
  iridescenceIntensity: 0.5,
  iridescenceSpeed: 1,
  bloomIntensity: 0.9,
  bloomThreshold: 0.6,
  chromaticAberration: 3.5,
  shapeType: "ribbon",
  shapeRotationX: 0.3480000000000001,
  shapeRotationY: -26.783,
  shapeRotationZ: -0.29,
  shapeAutoRotateSpeedX: 0,
  shapeAutoRotateSpeedY: 0,
  sphereRadius: 15,
  torusRadius: 15,
  torusTube: 5,
  cylinderRadius: 10,
  cylinderHeight: 40,
  planeBend: 2.3,
  planeTwist: -2.9,
  silhouetteFade: 0.83,
  cylinderFade: 0.08,
  ribbonFade: 0.31,
  flatShading: false,
  cameraLock: false,
  cameraX: 0,
  cameraY: 0,
  cameraZ: 0,
  cameraRotationX: -0.014,
  cameraRotationY: -0.23800000000000002,
  cameraRotationZ: 0,
  cameraZoom: 1,
};

const chatFlow = {
  q1: {
    question: "What is your primary skin concern?",
    options: [
      { label: "Fine lines & elasticity", next: "q2a" },
      { label: "Dryness & rough texture", next: "q2b" },
      { label: "Dull tone & uneven glow", next: "q2c" },
    ],
  },
  q2a: {
    question: "How intense is your anti-aging concern?",
    options: [
      { label: "High", result: "REJURAN Healer Turnover Ampoule" },
      { label: "Moderate", result: "REJURAN Concentrate Cream" },
    ],
  },
  q2b: {
    question: "What texture do you prefer for hydration?",
    options: [
      { label: "Rich and nourishing", result: "REJURAN Moisture Recovery Cream" },
      { label: "Light and refreshing", result: "REJURAN Hydro Balance Essence" },
    ],
  },
  q2c: {
    question: "When do you want the brightening effect most?",
    options: [
      { label: "Daily glow care", result: "REJURAN Tone-Up Radiance Serum" },
      { label: "Special event prep", result: "REJURAN Intensive Glow Capsule" },
    ],
  },
};

function App() {
  const canvasRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState("q1");
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState("");

  const currentNode = useMemo(() => chatFlow[currentStep], [currentStep]);

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    const gradient = new NeatGradient({
      ref: canvasRef.current,
      ...gradientConfig,
    });

    const handleScroll = () => {
      gradient.yOffset = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      gradient.destroy();
    };
  }, []);

  const handleStart = () => {
    setStarted(true);
    setCurrentStep("q1");
    setHistory([]);
    setResult("");
  };

  const handleRestart = () => {
    setStarted(false);
    setCurrentStep("q1");
    setHistory([]);
    setResult("");
  };

  const handleOptionSelect = (option) => {
    if (!currentNode) return;

    setHistory((prev) => [
      ...prev,
      {
        question: currentNode.question,
        answer: option.label,
      },
    ]);

    if (option.result) {
      setResult(option.result);
      return;
    }

    if (option.next) {
      setCurrentStep(option.next);
    }
  };

  return (
    <main className="app">
      <canvas
        id="gradient"
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
      />
      <div className="portrait-layout">
        {!started ? (
          <section className="hero-content">
            <h1 className="hero-title">
              Hi there.
              <br />
              Let&apos;s find your REJURAN match &gt;
            </h1>
            <div className="button-wrap" onClick={handleStart}>
              <button type="button" className="glass-button" onClick={handleStart}>
                <span>Start</span>
              </button>
              <div className="button-shadow" />
            </div>
          </section>
        ) : (
          <section className="chat-screen">
            <button
              type="button"
              className="home-button"
              onClick={handleRestart}
              aria-label="Go to home"
            >
              ‹
            </button>

            <div className="gpt-question-area">
              {!result ? (
                <p className="gpt-question">
                  {currentNode ? currentNode.question : ""}
                </p>
              ) : (
                <>
                  <p className="gpt-question">Your REJURAN match is</p>
                  <p className="gpt-result-product">{result}</p>
                </>
              )}
            </div>

            <div className="gpt-options">
              {!result && currentNode &&
                currentNode.options.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className="gpt-option-pill"
                    onClick={() => handleOptionSelect(option)}
                  >
                    {option.label}
                  </button>
                ))}
              {result && (
                <button
                  type="button"
                  className="gpt-option-pill gpt-option-restart"
                  onClick={handleRestart}
                >
                  Start over
                </button>
              )}
            </div>
          </section>
        )}
        <img
          className="brand-logo"
          src="/brand_logo01.png"
          alt="REJURAN brand logo"
        />
      </div>
    </main>
  );
}

export default App;
