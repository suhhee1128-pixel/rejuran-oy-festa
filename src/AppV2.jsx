import { createContext, useContext, useEffect, useRef, useState } from "react";

const imgLogo        = "/logo.png";
const imgMenuIcon    = "/icon_menu.svg";
const imgChatIcon    = "/icon_question.svg";
const imgScienceFilled = "/icon_science_filled.svg";
const imgScience     = "/icon_science.svg";
const imgDecoImage   = "/deco.png";
const imgEllipse     = "/ellipse.svg";

const HeaderNavContext = createContext({
  onMenu: null,
  onChat: null,
});

const GREAT_MAGIC_TRANSITION_MS = 1150;

/* ── Result screen assets ── */

const blobVertexShader = `
  varying vec3 vLocalPosition;
  varying vec3 vLocalNormal;

  void main() {
    vLocalPosition = position;
    vLocalNormal = normalize(normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const blobFragmentShader = `
  varying vec3 vLocalPosition;
  varying vec3 vLocalNormal;

  void main() {
    vec3 n = abs(normalize(vLocalNormal));
    vec2 facePosition = vLocalPosition.xy;

    if (n.x > n.y && n.x > n.z) {
      facePosition = vLocalPosition.zy;
    } else if (n.y > n.x && n.y > n.z) {
      facePosition = vLocalPosition.xz;
    }

    vec2 p = facePosition / 1.09;
    float edgeAmount = smoothstep(0.34, 1.34, length(p)) * 0.62;
    float whiteRim = smoothstep(0.86, 1.22, length(p)) * 0.18;

    vec3 core = vec3(0.0157, 0.7451, 0.6902);
    vec3 edge = vec3(0.8078, 0.9529, 0.9529);
    vec3 color = mix(core, edge, edgeAmount);
    color = mix(color, vec3(1.0), whiteRim);

    gl_FragColor = vec4(color, 1.0);
  }
`;

let threeBlobModulesPromise;

function loadThreeBlobModules() {
  if (!threeBlobModulesPromise) {
    threeBlobModulesPromise = Promise.all([
      import("three/src/renderers/WebGLRenderer.js"),
      import("three/src/scenes/Scene.js"),
      import("three/src/cameras/PerspectiveCamera.js"),
      import("three/src/objects/Group.js"),
      import("three/src/lights/AmbientLight.js"),
      import("three/src/lights/DirectionalLight.js"),
      import("three/src/materials/ShaderMaterial.js"),
      import("three/src/materials/SpriteMaterial.js"),
      import("three/src/objects/Mesh.js"),
      import("three/src/objects/Sprite.js"),
      import("three/src/textures/CanvasTexture.js"),
      import("three/src/geometries/BoxGeometry.js"),
      import("three/src/math/Vector3.js"),
      import("three/src/constants.js"),
    ]).then(([
      { WebGLRenderer },
      { Scene },
      { PerspectiveCamera },
      { Group },
      { AmbientLight },
      { DirectionalLight },
      { ShaderMaterial },
      { SpriteMaterial },
      { Mesh },
      { Sprite },
      { CanvasTexture },
      { BoxGeometry },
      { Vector3 },
      { AdditiveBlending, SRGBColorSpace },
    ]) => ({
      AdditiveBlending,
      AmbientLight,
      BoxGeometry,
      CanvasTexture,
      DirectionalLight,
      Group,
      Mesh,
      PerspectiveCamera,
      Scene,
      ShaderMaterial,
      Sprite,
      SpriteMaterial,
      SRGBColorSpace,
      Vector3,
      WebGLRenderer,
    }));
  }

  return threeBlobModulesPromise;
}

function createRoundedCubeGeometry(THREE) {
  const width = 2.18;
  const height = 2.18;
  const depth = 2.18;
  const segments = 32;
  const radius = 0.74;
  const totalSegments = segments * 2 + 1;
  const baseGeometry = new THREE.BoxGeometry(1, 1, 1, totalSegments, totalSegments, totalSegments);
  const geometry = baseGeometry.toNonIndexed();
  baseGeometry.dispose();

  const position = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const box = new THREE.Vector3(width, height, depth).divideScalar(2).subScalar(radius);
  const positions = geometry.attributes.position.array;
  const normals = geometry.attributes.normal.array;
  const halfSegmentSize = 0.5 / totalSegments;

  for (let i = 0; i < positions.length; i += 3) {
    position.fromArray(positions, i);
    normal.copy(position);
    normal.x -= Math.sign(normal.x) * halfSegmentSize;
    normal.y -= Math.sign(normal.y) * halfSegmentSize;
    normal.z -= Math.sign(normal.z) * halfSegmentSize;
    normal.normalize();

    positions[i] = box.x * Math.sign(position.x) + normal.x * radius;
    positions[i + 1] = box.y * Math.sign(position.y) + normal.y * radius;
    positions[i + 2] = box.z * Math.sign(position.z) + normal.z * radius;

    normals[i] = normal.x;
    normals[i + 1] = normal.y;
    normals[i + 2] = normal.z;
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.normal.needsUpdate = true;
  return geometry;
}

function createEyeTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.shadowColor = "rgba(255,255,255,0.72)";
  ctx.shadowBlur = 28;
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.beginPath();
  ctx.roundRect(43, 50, 42, 156, 21);
  ctx.fill();

  ctx.shadowBlur = 14;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(45, 52, 38, 152, 19);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function InteractiveBackground({ chat = false, origin = "home", still = false, style }) {
  return (
    <div
      className={`v2-fluid-bg v2-fluid-bg--${origin}${chat ? " v2-fluid-bg-chat" : ""}${still ? " v2-fluid-bg--still" : ""}`}
      style={style}
      aria-hidden="true"
    >
      {!still && <div className="v2-fluid-sheen" />}
    </div>
  );
}

function BlobMedia({ className = "", alt = "", magic = false, magicBurstKey = 0, motion = "default" }) {
  return (
    <Blob3D
      className={`blob-video${className ? ` ${className}` : ""}`}
      alt={alt}
      magic={magic}
      magicBurstKey={magicBurstKey}
      motion={motion}
    />
  );
}

function MagicTrail({ className = "" }) {
  return (
    <span
      className={`home-blob-magic-trail home-blob-magic-trail--burst${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      {Array.from({ length: 84 }, (_, index) => (
        <i key={index} style={getMagicSparkStyle(index)} />
      ))}
    </span>
  );
}

function getMagicSparkStyle(index) {
  const angle = ((index * 137.508) % 360) * (Math.PI / 180);
  const ring = index % 6;
  const baseRadius = [118, 162, 214, 276, 338, 404][ring];
  const radiusJitter = ((index * 29) % 53) - 26;
  const radius = baseRadius + radiusJitter;
  const drift = Math.sin(index * 12.9898) * 18;
  const x = Math.cos(angle) * radius + Math.cos(angle * 2.35) * drift;
  const y = Math.sin(angle) * radius * 0.8 + Math.sin(angle * 1.72) * drift;
  const size = index % 17 === 0 ? 5.2 : index % 11 === 0 ? 4.4 : index % 5 === 0 ? 3.7 : 3.1;
  const delay = (index % 30) * 0.014;

  return {
    "--spark-near-x": `${(x * 0.34).toFixed(1)}px`,
    "--spark-near-y": `${(y * 0.34).toFixed(1)}px`,
    "--spark-mid-x": `${(x * 0.56).toFixed(1)}px`,
    "--spark-mid-y": `${(y * 0.56).toFixed(1)}px`,
    "--spark-far-x": `${(x * 0.86).toFixed(1)}px`,
    "--spark-far-y": `${(y * 0.86).toFixed(1)}px`,
    "--spark-x": `${x.toFixed(1)}px`,
    "--spark-y": `${y.toFixed(1)}px`,
    "--spark-size": `${size}px`,
    "--spark-delay": `${delay.toFixed(2)}s`,
  };
}

function Blob3D({ className = "", alt = "", magic = false, magicBurstKey = 0, motion = "default" }) {
  const mountRef = useRef(null);
  const trailRef = useRef(null);
  const magicRef = useRef(magic);
  const replayTrailRef = useRef(() => {});
  const magicClass = magic === "strong"
    ? " home-blob-3d--magic-strong"
    : magic
      ? " home-blob-3d--magic"
      : "";

  useEffect(() => {
    magicRef.current = magic;
  }, [magic]);

  useEffect(() => {
    if (!magic || !magicBurstKey) return undefined;
    const rafId = requestAnimationFrame(() => replayTrailRef.current());
    return () => cancelAnimationFrame(rafId);
  }, [magic, magicBurstKey]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let cleanupBlob = () => {};
    let isDisposed = false;

    loadThreeBlobModules().then((THREE) => {
      if (isDisposed || !mount.isConnected) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
      camera.position.set(0, 0, 9.6);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      const blobGroup = new THREE.Group();
      blobGroup.scale.set(1, 1, 1);
      scene.add(blobGroup);

      const ambient = new THREE.AmbientLight(0xffffff, 1.35);
      scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
      keyLight.position.set(-2.8, 3.6, 4.8);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xffffff, 1.1);
      rimLight.position.set(3.2, 2.4, 3.6);
      scene.add(rimLight);

      const bodyGeometry = createRoundedCubeGeometry(THREE);
      const basePositions = bodyGeometry.attributes.position.array.slice();
      const bodyMaterial = new THREE.ShaderMaterial({
        vertexShader: blobVertexShader,
        fragmentShader: blobFragmentShader,
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.scale.set(1, 1, 1);
      blobGroup.add(body);

      const eyeTexture = createEyeTexture(THREE);
      const eyeMaterial = new THREE.SpriteMaterial({
        map: eyeTexture,
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      });
      const leftEye = new THREE.Sprite(eyeMaterial);
      leftEye.position.set(-0.39, -0.02, 1.18);
      leftEye.scale.set(0.38, 0.58, 1);
      blobGroup.add(leftEye);

      const rightEye = new THREE.Sprite(eyeMaterial);
      rightEye.position.copy(leftEye.position);
      rightEye.position.x = 0.39;
      rightEye.scale.copy(leftEye.scale);
      blobGroup.add(rightEye);

      const resize = () => {
        const width = mount.clientWidth || 194;
        const height = mount.clientHeight || 197;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);

      const startTime = performance.now();
      let spinStart = 0;
      let nextSpinAt = 1.35;
      const spinDuration = 1.85;
      const smooth = (value) => value * value * (3 - 2 * value);
      const pulseAt = (value, center, width) => Math.max(0, 1 - Math.abs(value - center) / width);
      const replayMagicTrail = () => {
        const trail = trailRef.current;
        if (!trail) return;

        trail.classList.remove("home-blob-magic-trail--burst");
        void trail.offsetWidth;
        trail.classList.add("home-blob-magic-trail--burst");
      };
      replayTrailRef.current = replayMagicTrail;
      if (magicRef.current && magicBurstKey) {
        requestAnimationFrame(replayMagicTrail);
      }
      let rafId = 0;
      const animate = () => {
        const t = (performance.now() - startTime) * 0.001;
        const positions = bodyGeometry.attributes.position;

        for (let i = 0; i < positions.count; i += 1) {
          const index = i * 3;
          const x = basePositions[index];
          const y = basePositions[index + 1];
          const z = basePositions[index + 2];
          const pulse =
            1 +
            Math.sin(x * 3.1 + t * 1.35) * 0.01 +
            Math.sin(y * 4.4 + t * 1.05) * 0.008 +
            Math.sin(z * 5.3 + t * 1.18) * 0.006;

          positions.setXYZ(i, x * pulse, y * pulse, z * pulse);
        }

        positions.needsUpdate = true;
        bodyGeometry.computeVertexNormals();

        if (motion !== "calm" && !spinStart && t >= nextSpinAt) {
          spinStart = t;
          if (magicRef.current) replayMagicTrail();
        }

        let spinProgress = 0;
        if (spinStart) {
          spinProgress = Math.min((t - spinStart) / spinDuration, 1);

          if (spinProgress >= 1) {
            spinStart = 0;
            nextSpinAt = t + 1.25 + Math.random() * 2.1;
            spinProgress = 0;
          }
        }

        const idleY = Math.sin(t * 1.35) * 0.085;
        const idleWobble = motion === "calm" ? 0 : spinStart ? 0 : Math.sin(t * 1.05) * 0.018;
        const jumpArc = spinStart ? Math.sin(spinProgress * Math.PI) : 0;
        const rebound = spinStart ? Math.sin(pulseAt(spinProgress, 0.93, 0.07) * Math.PI) * 0.035 : 0;
        const jumpY = spinStart ? jumpArc * 0.72 + rebound : 0;
        const spinTurn = spinStart ? smooth(spinProgress) * Math.PI * 2 : 0;

        blobGroup.scale.set(1, 1, 1);
        const rotationY = spinTurn + idleWobble;
        const frontVisibility = Math.max(0, Math.cos(rotationY));
        eyeMaterial.opacity = 0.96 * smooth(Math.min(frontVisibility * 1.35, 1));

        blobGroup.rotation.y = rotationY;
        blobGroup.rotation.x = Math.sin(t * 0.9) * 0.02 - jumpArc * 0.035;
        blobGroup.position.y = -0.12 + idleY + jumpY;

        renderer.render(scene, camera);
        rafId = requestAnimationFrame(animate);
      };
      animate();

      cleanupBlob = () => {
        cancelAnimationFrame(rafId);
        replayTrailRef.current = () => {};
        resizeObserver.disconnect();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
        bodyGeometry.dispose();
        bodyMaterial.dispose();
        eyeTexture.dispose();
        eyeMaterial.dispose();
        renderer.dispose();
      };
    });

    return () => {
      isDisposed = true;
      cleanupBlob();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`home-blob-3d${magicClass}${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={alt}
    >
      {magic && (
        <span ref={trailRef} className="home-blob-magic-trail home-blob-magic-trail--burst" aria-hidden="true">
          {Array.from({ length: 84 }, (_, index) => (
            <i key={index} style={getMagicSparkStyle(index)} />
          ))}
        </span>
      )}
    </div>
  );
}

function getCanvasRect(element) {
  const layout = document.querySelector(".portrait-layout");
  if (!element || !layout) return null;
  const layoutRect = layout.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const scale = layoutRect.width / 1080 || 1;
  return {
    left: (rect.left - layoutRect.left) / scale,
    top: (rect.top - layoutRect.top) / scale,
    width: rect.width / scale,
    height: rect.height / scale,
  };
}

function SurveyUserBubble({ children, origin }) {
  const bubbleRef = useRef(null);
  const [flyStyle, setFlyStyle] = useState(null);

  useEffect(() => {
    if (!origin || !bubbleRef.current) return;
    const finalRect = getCanvasRect(bubbleRef.current);
    if (!finalRect) return;
    const originCenterX = origin.left + origin.width / 2;
    const originCenterY = origin.top + origin.height / 2;
    const finalCenterX = finalRect.left + finalRect.width / 2;
    const finalCenterY = finalRect.top + finalRect.height / 2;
    setFlyStyle({
      "--answer-fly-x": `${originCenterX - finalCenterX}px`,
      "--answer-fly-y": `${originCenterY - finalCenterY}px`,
    });
  }, [origin, children]);

  return (
    <div
      ref={bubbleRef}
      className={`v2-bubble v2-bubble-user v2-survey-followup-user${origin ? " v2-answer-fly-in" : ""}${flyStyle ? " v2-answer-fly-ready" : ""}`}
      style={flyStyle || undefined}
    >
      {children}
    </div>
  );
}

const suggestions = [
  {
    icon: imgScience,
    text: "What is PDRN?",
    screen: "pdrn",
    label: <>What is <strong>PDRN</strong>?</>,
  },
  {
    icon: imgScienceFilled,
    text: "What makes REJURAN's PDRN\ndifferent from other brands?",
    screen: "pdrn2",
    label: <><span className="v2-suggestion-nowrap">What makes <strong>REJURAN's PDRN</strong> different</span><br />from other brands?</>,
  },
];

const PDRN_ANSWER =
  "PDRN (Polydeoxyribonucleotide) is a purified mixture of DNA fragments, most commonly derived from salmon through a highly controlled purification process.\n\nIn skincare and aesthetic medicine, PDRN is known for its ability to support the skin's natural repair processes and improve the appearance of damaged or aging skin.";

const PDRN_DIFF_ANSWER =
  "REJURAN uses pharmaceutical-grade PDRN with a clinically verified molecular weight optimized for skin absorption.\n\nUnlike other brands that use generic DNA extracts, REJURAN's PDRN is standardized through a patented purification process — ensuring consistent potency, safety, and regenerative efficacy in every product.";

/* ── Shared Header ── */
function Header({ onBack, onChat }) {
  const headerNav = useContext(HeaderNavContext);
  const handleChat = onChat || headerNav.onChat;

  return (
    <header className="v2-header">
      <div className="v2-header-icon-btn v2-header-icon-btn-left" aria-hidden="true">
        <img src={imgMenuIcon} alt="" className="v2-header-icon-left" />
      </div>
      <button
        type="button"
        className="v2-header-center"
        onClick={onBack}
        style={{ cursor: onBack ? "pointer" : "default" }}
        aria-label={onBack ? "Go back" : "Current experience"}
      >
        <div className="v2-title-row">
          <span className="v2-title">
            Chat <span className="v2-title-brand">REJURAN</span> 8.1
          </span>
          <img src="/mdi_expand-more.png" alt="" className="v2-chevron" />
        </div>
        <span className="v2-subtitle">OLIVE YOUNG FESTA 2026</span>
      </button>
      <button
        type="button"
        className="v2-header-icon-btn v2-header-icon-btn-right"
        onClick={handleChat}
        aria-label="Open PDRN chat"
      >
        <img src={imgChatIcon} alt="" className="v2-header-icon-right" />
      </button>
    </header>
  );
}

/* ── Shared Chat Screen ── */
function ChatScreen({ question, answer, onBack, onNext, recommendation, variant = "default" }) {
  const paragraphs = answer.split("\n\n");
  const [showUserBubble, setShowUserBubble] = useState(false);
  const [showBlob, setShowBlob] = useState(false);
  const [showAnswerBubble, setShowAnswerBubble] = useState(false);
  const [phase, setPhase] = useState("loading");
  const [visibleParagraphs, setVisibleParagraphs] = useState(0);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [showRecommendationChoices, setShowRecommendationChoices] = useState(false);
  const [recommendationChoice, setRecommendationChoice] = useState("");
  const done = visibleParagraphs >= paragraphs.length;

  useEffect(() => {
    setShowUserBubble(false);
    setShowBlob(false);
    setShowAnswerBubble(false);
    setPhase("loading");
    setVisibleParagraphs(0);
    const userTimer = setTimeout(() => setShowUserBubble(true), 180);
    const blobTimer = setTimeout(() => setShowBlob(true), 520);
    const answerTimer = setTimeout(() => setShowAnswerBubble(true), 860);
    return () => {
      clearTimeout(userTimer);
      clearTimeout(blobTimer);
      clearTimeout(answerTimer);
    };
  }, [question, answer]);

  useEffect(() => {
    if (!showAnswerBubble) return;
    setPhase("typing");
    setVisibleParagraphs(0);
  }, [showAnswerBubble, question, answer]);

  useEffect(() => {
    if (phase !== "typing") return;
    if (done) return;
    const t = setTimeout(() => {
      setVisibleParagraphs(v => v + 1);
    }, visibleParagraphs === 0 ? 0 : 1500);
    return () => clearTimeout(t);
  }, [phase, visibleParagraphs, done]);

  useEffect(() => {
    setShowRecommendation(false);
    setShowRecommendationChoices(false);
    setRecommendationChoice("");
  }, [question, answer]);

  useEffect(() => {
    if (!done || !recommendation) return;
    const t = setTimeout(() => setShowRecommendation(true), 800);
    return () => clearTimeout(t);
  }, [done, recommendation]);

  useEffect(() => {
    if (!showRecommendation) return;
    const t = setTimeout(() => setShowRecommendationChoices(true), 180);
    return () => clearTimeout(t);
  }, [showRecommendation]);

  const goNextFromRecommendation = () => {
    if (recommendationChoice === "yes") {
      recommendation.onYes();
      return;
    }
    if (recommendationChoice === "no") {
      onNext();
    }
  };

  return (
    <div className={`v2-chat-screen v2-chat-screen--${variant}`}>
      <InteractiveBackground chat origin="center" />
      <Header onBack={onBack} />

      <div className="v2-deco v2-deco-left">
        <img src={imgDecoImage} alt="" />
            </div>
      <div className="v2-deco v2-deco-right">
        <img src={imgDecoImage} alt="" style={{ transform: "scaleX(-1)" }} />
      </div>

      {showUserBubble && (
        <div className="v2-bubble v2-bubble-user v2-chat-sequence-in">{question}</div>
      )}

      {showBlob && (
        <div className="v2-chat-blob-wrap v2-chat-sequence-in">
          <BlobMedia alt="REJURAN character" motion="calm" />
        </div>
      )}

      {showAnswerBubble && (
        <div className="v2-chat-answer-stack">
          <div className="v2-bubble v2-bubble-answer v2-chat-answer v2-chat-sequence-in">
            {paragraphs.slice(0, visibleParagraphs).map((p, i) => (
              <p key={i} className="v2-chat-paragraph v2-chat-paragraph-in">
                {p}
              </p>
            ))}
          </div>
          {showRecommendation && (
            <div className="v2-chat-recommendation">
              <button
                type="button"
                className="v2-chat-recommendation-bubble v2-chat-recommendation-bubble--clickable"
                onClick={() => recommendation.onYes()}
              >
                <p className="v2-chat-recommendation-copy">Want to explore this too?</p>
                <p className="v2-chat-recommendation-question">{recommendation.question} →</p>
              </button>
            </div>
          )}
        </div>
      )}

      {done && !recommendation && (
        <button type="button" className="v2-next-btn" onClick={onNext}>
          Next →
        </button>
      )}

      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
      </div>
    </div>
  );
}

/* ── Great Screen ── */
function GreatScreen({ onOk }) {
  useEffect(() => {
    const t = setTimeout(onOk, 2000);
    return () => clearTimeout(t);
  }, [onOk]);

  return (
    <>
      <InteractiveBackground origin="great" />
      <Header />

      <div className="v2-deco v2-deco-left">
        <img src={imgDecoImage} alt="" />
      </div>
      <div className="v2-deco v2-deco-right">
        <img src={imgDecoImage} alt="" style={{ transform: "scaleX(-1)" }} />
      </div>

      {/* blob rendered by shared layer in AppV2 */}

      <div className="v2-great-text">
        <p className="v2-great-title">
          <span className="v2-great-first-line">Great!</span>
          <br />
          Now let&apos;s find your
          <br />
          perfect match together!
        </p>
      </div>

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
  const [showOptions, setShowOptions] = useState(false);
  const optionRefs = useRef({});

  useEffect(() => {
    const t1 = setTimeout(() => setShowQuestion(true), 750);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!showQuestion) return;
    const t = setTimeout(() => setShowOptions(true), 300);
    return () => clearTimeout(t);
  }, [showQuestion]);

  return (
    <>
      <InteractiveBackground chat origin="center" />
      <Header onBack={onBack} />

      {/* blob handled by shared layer in AppV2 */}

      {/* Question bubble */}
      <div className={`v2-quiz-question${showQuestion ? " v2-quiz-visible" : ""}`}>
        <div className="v2-quiz-q-bubble-wrap">
          <p className="v2-quiz-q-text">{QUIZ_QUESTION}</p>
          {showQuestion && <span className="v2-q-hint">SELECT ONLY 1</span>}
        </div>
      </div>

      {/* Options 2-column grid */}
      <div className="v2-quiz-grid">
        {SKIN_OPTIONS.map((opt, i) => (
          <button
            key={opt}
            ref={(node) => { optionRefs.current[opt] = node; }}
            type="button"
            className={`v2-quiz-opt${selected === opt ? " v2-quiz-opt-selected" : ""}${showOptions ? " v2-quiz-opt-visible" : ""}`}
            onClick={() => {
              if (selected) return;
              setSelected(opt);
              window.setTimeout(() => onNext(opt, getCanvasRect(optionRefs.current[opt])), 220);
            }}
          >
            <span className={`v2-quiz-radio${selected === opt ? " v2-quiz-radio-on" : ""}`} />
            <span>{opt}</span>
          </button>
        ))}
      </div>

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
  "Combination": "Got it. Combination skin just needs a bit of balance.",
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
  "Visible pores or excess oil":        "Pores and oil — totally get it. Let's find what works best for your skin!",
  "Dullness or uneven texture":         "Dullness can be so frustrating. Let's brighten things up for you!",
  "Dryness, tightness or irritation":   "Dry and tight skin needs some serious love. Let's find your perfect match!",
  "Loss of firmness or elasticity":     "Firmness concerns are super common. Let's find what gives your skin that bounce back!",
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

function SplitConcernQuestion({ text }) {
  const emphasis = "What skin concern";
  const breakPoint = "What skin concern are you noticing ";
  if (!text.startsWith(breakPoint)) return text;
  const emphasizedText = text.slice(0, Math.min(text.length, emphasis.length));
  const firstLineRest = text.slice(emphasis.length, Math.min(text.length, breakPoint.length));
  const secondLine = text.slice(breakPoint.length);
  return (
    <>
      <span className="v2-question-emphasis">{emphasizedText}</span>
      {firstLineRest}
      {text.length > breakPoint.length && <br />}
      {secondLine}
    </>
  );
}

function EmphasizedPrefix({ text, prefix }) {
  if (!text.startsWith(prefix)) return text;
  const emphasizedText = text.slice(0, Math.min(text.length, prefix.length));
  const rest = text.slice(prefix.length);
  return (
    <>
      <span className="v2-question-emphasis">{emphasizedText}</span>
      {rest}
    </>
  );
}

/* ── Quiz 2 Screen ── */
function Quiz2Screen({ skinType, answerOrigin, onBack, onNext }) {
  const [selected, setSelected] = useState(null);
  const aiResponse = SKIN_RESPONSES[skinType] || "Got it!";
  const optionRefs = useRef({});

  const [showFollowupBlob, setShowFollowupBlob] = useState(!answerOrigin);
  const [showFollowupAnswer, setShowFollowupAnswer] = useState(!answerOrigin);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    setShowFollowupBlob(false);
    setShowFollowupAnswer(false);
    setShowOptions(false);
    const blobTimer = setTimeout(() => setShowFollowupBlob(true), answerOrigin ? 760 : 0);
    const answerTimer = setTimeout(() => setShowFollowupAnswer(true), answerOrigin ? 1040 : 220);
    return () => {
      clearTimeout(blobTimer);
      clearTimeout(answerTimer);
    };
  }, [answerOrigin, skinType]);

  useEffect(() => {
    if (!showFollowupAnswer) return;
    const t = setTimeout(() => setShowOptions(true), 300);
    return () => clearTimeout(t);
  }, [showFollowupAnswer]);

  return (
    <>
      <InteractiveBackground chat origin="center" />
      <Header onBack={onBack} />
      <button type="button" className="v2-back-btn" onClick={onBack}>Back</button>

      <div className="v2-deco v2-deco-left"><img src={imgDecoImage} alt="" /></div>
      <div className="v2-deco v2-deco-right"><img src={imgDecoImage} alt="" style={{ transform: "scaleX(-1)" }} /></div>
      {showFollowupBlob && (
        <div className="v2-chat-blob-wrap v2-survey-followup-blob v2-followup-content-in">
          <BlobMedia alt="REJURAN character" motion="calm" />
        </div>
      )}

      {/* User's previous answer */}
      <SurveyUserBubble origin={answerOrigin}>{skinType}</SurveyUserBubble>

      {/* AI response and next question */}
      {showFollowupAnswer && (
        <div className="v2-bubble v2-bubble-answer v2-survey-followup-answer v2-followup-content-in">
          <span>{aiResponse}</span>
          <span className="v2-followup-question">
            <SplitConcernQuestion text={QUIZ2_Q} />
            <span className="v2-q-hint v2-followup-q-hint">SELECT ONLY 1</span>
          </span>
        </div>
      )}

      {/* Concern options */}
      <div className="v2-quiz-grid v2-concern-grid">
        {CONCERN_OPTIONS.map((opt, i) => (
                  <button
            key={opt}
            ref={(node) => { optionRefs.current[opt] = node; }}
                    type="button"
            className={`v2-quiz-opt${selected === opt ? " v2-quiz-opt-selected" : ""}${showOptions ? " v2-quiz-opt-visible" : ""}`}
            onClick={() => {
              if (selected) return;
              setSelected(opt);
              window.setTimeout(() => onNext(opt, getCanvasRect(optionRefs.current[opt])), 220);
            }}
          >
            <span className={`v2-quiz-radio${selected === opt ? " v2-quiz-radio-on" : ""}`} />
            <span>{opt}</span>
          </button>
        ))}
      </div>

      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
      </div>
    </>
  );
}

/* ── Analyzing Screen ── */
function AnalyzingScreen({ onDone, hold = false }) {
  useEffect(() => {
    if (hold) return undefined;
    const t = setTimeout(onDone, 6000);
    return () => clearTimeout(t);
  }, [hold, onDone]);

  return (
    <>
      <InteractiveBackground origin="analyzing" />

      <Header onBack={null} />

      {/* Large centered blob */}
      <div className="v2-analyzing-blob">
        <BlobMedia alt="REJURAN character" motion="calm" />
      </div>

      <div className="v2-analyzing-text">
        <p className="v2-analyzing-title">Perfect!</p>
        <p className="v2-analyzing-body">I’ll find your best match<br />based on your answers.</p>
      </div>

      <div className="v2-loading-card-stage" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <img
            key={n}
            src={`/loading-card0${n}.png`}
            alt=""
            className={`v2-loading-card v2-loading-card-${n}`}
          />
        ))}
      </div>
      <div className="v2-card-wave-focus" aria-hidden="true" />

      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
      </div>
    </>
  );
}

/* ── Quiz 3 Screen ── */
function Quiz3Screen({ concern, answerOrigin, onBack, onNext }) {
  const [selected, setSelected] = useState(null);
  const aiResponse = CONCERN_RESPONSES[concern] || "Noted!";

  const [showFollowupBlob, setShowFollowupBlob] = useState(!answerOrigin);
  const [showFollowupAnswer, setShowFollowupAnswer] = useState(!answerOrigin);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    setShowFollowupBlob(false);
    setShowFollowupAnswer(false);
    setShowOptions(false);
    const blobTimer = setTimeout(() => setShowFollowupBlob(true), answerOrigin ? 760 : 0);
    const answerTimer = setTimeout(() => setShowFollowupAnswer(true), answerOrigin ? 1040 : 220);
    return () => {
      clearTimeout(blobTimer);
      clearTimeout(answerTimer);
    };
  }, [answerOrigin, concern]);

  useEffect(() => {
    if (!showFollowupAnswer) return;
    const t = setTimeout(() => setShowOptions(true), 300);
    return () => clearTimeout(t);
  }, [showFollowupAnswer]);

  return (
    <>
      <InteractiveBackground chat origin="center" />
      <Header onBack={onBack} />
      <button type="button" className="v2-back-btn" onClick={onBack}>Back</button>
      <div className="v2-deco v2-deco-left"><img src={imgDecoImage} alt="" /></div>
      <div className="v2-deco v2-deco-right"><img src={imgDecoImage} alt="" style={{ transform: "scaleX(-1)" }} /></div>
      {showFollowupBlob && (
        <div className="v2-chat-blob-wrap v2-survey-followup-blob v2-followup-content-in">
          <BlobMedia alt="REJURAN character" motion="calm" />
        </div>
      )}

      {/* User's concern answer */}
      <SurveyUserBubble origin={answerOrigin}>{concern}</SurveyUserBubble>

      {/* AI response and next question */}
      {showFollowupAnswer && (
        <div className="v2-bubble v2-bubble-answer v2-survey-followup-answer v2-followup-content-in">
          <span>{aiResponse}</span>
          <span className="v2-followup-question">
            <EmphasizedPrefix text={QUIZ3_Q} prefix="What results" />
            <span className="v2-q-hint v2-followup-q-hint">SELECT ONLY 1</span>
          </span>
        </div>
      )}

      {/* Result options */}
      <div className="v2-quiz-grid v2-concern-grid v2-results-grid">
        {RESULT_OPTIONS.map((opt, i) => (
          <button
            key={opt}
            type="button"
            className={`v2-quiz-opt${selected === opt ? " v2-quiz-opt-selected" : ""}${showOptions ? " v2-quiz-opt-visible" : ""}`}
            onClick={() => {
              if (selected) return;
              setSelected(opt);
              window.setTimeout(() => onNext(opt), 220);
            }}
          >
            <span className={`v2-quiz-radio${selected === opt ? " v2-quiz-radio-on" : ""}`} />
            <span>{opt}</span>
          </button>
        ))}
      </div>

      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
      </div>
    </>
  );
}

/* ── Home Screen ── */
function HomeScreen({ onNavigate, onResult }) {
  return (
    <section className="v2-home-screen">
      <InteractiveBackground origin="home" />
      <Header />


      <div className="v2-blob-wrap">
        <BlobMedia className="v2-blob" alt="REJURAN character" magic />
      </div>

      <div className="v2-greeting">
        <p className="v2-greeting-line v2-greeting-line-1">Welcome!</p>
        <p className="v2-greeting-line v2-greeting-line-2">
          Find your <strong>REJURAN match</strong>
        </p>
      </div>

      <p className="v2-suggestions-hint">Choose a question to get started</p>

      <div className="v2-suggestions">
        {suggestions.map((s) => (
          <button
            key={s.text}
            type="button"
            className="v2-suggestion-item"
            onClick={() => s.screen && onNavigate(s.screen)}
          >
            <img src={s.icon} alt="" className="v2-suggestion-icon" />
            <span className="v2-suggestion-text">{s.label}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="v2-input-bar-btn"
        onClick={() => onNavigate("pdrn")}
        aria-label="Ask Chat REJURAN"
      >
        <img src="/bar.png" alt="" className="v2-input-bar-img" />
      </button>

      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
            </div>
          </section>
  );
}

/* ── Product data ── */
const PRODUCT_DATA = {
  "Turnover Ampoule": {
    name: "TURNOVER AMPOULE",
    resultClass: "rs-turnover",
    image: "/turnover02.png",
    descLines: [
      "A youthful glow with c-PDRN®, a marine-based",
      "growth factor that helps improve the appearance of",
      "skin's tone, texture, and radiance.",
    ],
    waveX: "558px",
    waveY: "800px",
    nextLabel: "Next",
  },
  "Dual Effect Ampoule": {
    name: "DUAL EFFECT AMPOULE",
    resultClass: "rs-dual-effect",
    image: "/dualeffect02.png",
    descLines: [
      "Firmer, smoother-looking skin with c-PDRN®,",
      "an advanced skin-renewing ingredient that helps",
      "improve elasticity, texture, and overall radiance.",
    ],
    waveX: "564px",
    waveY: "770px",
    nextLabel: "Next",
  },
  "Pore Tightening Ampoule": {
    name: "PORE TIGHTENING AMPOULE",
    nameLines: ["PORE TIGHTENING", "AMPOULE"],
    resultClass: "rs-pore",
    image: "/pore02.png",
    descLines: [
      "Refine the look of pores and achieve",
      "a smoother, more balanced complexion with",
      "Pore Tightening Ampoule.",
    ],
    waveX: "572px",
    waveY: "800px",
    nextLabel: "Next",
  },
  "Moisture Treatment Ampoule": {
    name: "MOISTURE TREATMENT AMPOULE",
    resultClass: "rs-moisture",
    image: "/moisture02.png",
    descLines: [
      "Restore calm, deeply hydrated skin with",
      "Moisture Treatment Ampoule, a soothing serum",
      "designed to support the skin barrier.",
    ],
    waveX: "564px",
    waveY: "800px",
    nextLabel: "Next",
  },
};

/* ── Result Screen ── */
function ResultScreen({ product, onRestart, onNext }) {
  const data = PRODUCT_DATA[product] || PRODUCT_DATA["Turnover Ampoule"];

  return (
    <>
      <InteractiveBackground
        origin="result"
        style={{
          "--wave-x": data.waveX,
          "--wave-y": data.waveY,
        }}
      />

      <section className={`rs-page ${data.resultClass}`}>
        <Header onBack={null} />

        <div className="rs-result-scroll">
          <div className="rs-result-scroll-inner">
            {/* Blob + speech bubble */}
            <div className="rs-blob-clip">
              <BlobMedia />
            </div>
            <div className="rs-speech-wrap">
              <span className="rs-speech-text">Here's your match!</span>
            </div>

            {/* Product image */}
            <div className="rs-product-area">
              <img src={data.image} alt={data.name} className="rs-product-img" />
            </div>

            {/* Product name */}
            <p className="rs-product-name">
              {data.nameLines
                ? data.nameLines.map((line, index) => (
                    <span key={line}>
                      {line}
                      {index < data.nameLines.length - 1 && <br />}
                    </span>
                  ))
                : data.name}
            </p>

            {/* Description */}
            <p className="rs-product-desc">
              {data.descLines
                ? data.descLines.map((line, index) => (
                    <span key={line}>
                      {line}
                      {index < data.descLines.length - 1 && <br />}
                    </span>
                  ))
                : data.desc}
            </p>

            {/* Next arrow button */}
            <button className="rs-next-btn" onClick={onNext}>{data.nextLabel || "›"}</button>
          </div>
        </div>

        {/* Logo */}
        <div className="v2-logo-wrap">
          <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
        </div>
      </section>
    </>
  );
}

/* ── Goodbye Screen ── */
function GoodbyeScreen({ onHome }) {
  useEffect(() => {
    const t = setTimeout(onHome, 3000);
    return () => clearTimeout(t);
  }, [onHome]);

  return (
    <>
      <InteractiveBackground origin="goodbye" />
      <Header onBack={null} />

      {/* Large centered blob */}
      <div className="gb-blob-wrap">
        <BlobMedia />
      </div>

      {/* Text */}
      <p className="gb-line1">Thanks for coming!</p>
      <p className="gb-line2">Enjoy!</p>

      {/* Logo */}
      <div className="v2-logo-wrap">
        <img src={imgLogo} alt="REJURAN COSMETICS" className="v2-logo" />
      </div>
    </>
  );
}

function NavPage({ type, onBack }) {
  const isMenu = type === "menu";

  return (
    <>
      <InteractiveBackground origin={isMenu ? "menu" : "chat"} />
      <Header onBack={null} />

      <section className={`v2-nav-page v2-nav-page--${type}`}>
        {isMenu ? (
          <>
            <p className="v2-nav-page-kicker">Menu</p>
            <h1 className="v2-nav-page-title">Explore REJURAN</h1>
          </>
        ) : (
          <>
            <p className="v2-nav-page-kicker">About</p>
            <h1 className="v2-nav-page-title">Chat REJURAN 8.1</h1>
            <p className="v2-nav-page-desc">
              Chat REJURAN is your personal skin advisor, powered by REJURAN's science. Answer a few quick questions and discover the ampoule made for your skin — right here, right now.
            </p>
          </>
        )}
        <button type="button" className="v2-nav-page-back" onClick={onBack}>
          Back
        </button>
      </section>
    </>
  );
}

/* ── Root ── */
function AppV2() {
  const [screen, setScreen] = useState("home");
  const [showAbout, setShowAbout] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [skinType, setSkinType] = useState("");
  const [concern, setConcern] = useState("");
  const [product, setProduct] = useState("");
  const [viewedPdrnScreens, setViewedPdrnScreens] = useState([]);
  const [skinAnswerOrigin, setSkinAnswerOrigin] = useState(null);
  const [concernAnswerOrigin, setConcernAnswerOrigin] = useState(null);
  const [sharedMagicBurstKey, setSharedMagicBurstKey] = useState(0);
  const [isGreatMagicBurst, setIsGreatMagicBurst] = useState(false);
  const greatMagicTimeoutRef = useRef(null);
  // blobPos trails screen by one frame so the CSS transition always fires
  const [blobPos, setBlobPos] = useState("great");
  const showBlob = screen === "great" || screen === "quiz1";

  useEffect(() => {
    if (screen !== "pdrn" && screen !== "pdrn2") return;
    setViewedPdrnScreens((prev) => (
      prev.includes(screen) ? prev : [...prev, screen]
    ));
  }, [screen]);

  useEffect(() => {
    if (screen !== "great") return;
    setSharedMagicBurstKey((key) => key + 1);
  }, [screen]);

  useEffect(() => () => {
    if (greatMagicTimeoutRef.current) {
      clearTimeout(greatMagicTimeoutRef.current);
    }
  }, []);

  const goToQuiz = () => {
    if (greatMagicTimeoutRef.current) {
      clearTimeout(greatMagicTimeoutRef.current);
    }

    setBlobPos("great");
    setIsGreatMagicBurst(true);
    setSharedMagicBurstKey((key) => key + 1);
    greatMagicTimeoutRef.current = setTimeout(() => {
      setIsGreatMagicBurst(false);
      greatMagicTimeoutRef.current = null;
      setScreen("quiz1");
      // Keep blob at "great" position for one paint, then animate to "quiz1"
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setBlobPos("quiz1"));
      });
    }, GREAT_MAGIC_TRANSITION_MS);
  };

  const goBackToGreat = () => {
    if (greatMagicTimeoutRef.current) {
      clearTimeout(greatMagicTimeoutRef.current);
      greatMagicTimeoutRef.current = null;
    }
    setIsGreatMagicBurst(false);
    setBlobPos("great");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setScreen("great"));
    });
  };

  const headerNav = {
    onMenu: () => { setShowCollection(true); },
    onChat: () => { setShowAbout(true); },
  };

  return (
    <main className="app app-v2">
      <HeaderNavContext.Provider value={headerNav}>
      <div className="portrait-stage">
      <div className="portrait-layout">
        {screen === "home"  && <HomeScreen onNavigate={setScreen} onResult={(p) => { setProduct(p); setScreen("result"); }} />}
        {/* Collection modal */}
        {showCollection && (
          <div className="about-overlay" onClick={() => setShowCollection(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <button className="about-close-btn" onClick={() => setShowCollection(false)}>✕</button>
              <p className="v2-nav-page-kicker">Collection</p>
              <h1 className="v2-nav-page-title">REJURAN Ampoules</h1>
              <div className="collection-grid">
                {[1, 2, 3, 4].map((n) => (
                  <img key={n} src={`/loading-card0${n}.png`} alt="" className="collection-card" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* About modal */}
        {showAbout && (
          <div className="about-overlay" onClick={() => setShowAbout(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <button className="about-close-btn" onClick={() => setShowAbout(false)}>✕</button>
              <p className="v2-nav-page-kicker">About</p>
              <h1 className="v2-nav-page-title">Chat REJURAN 8.1</h1>
              <p className="v2-nav-page-desc">
                Chat REJURAN is your personal skin advisor, powered by REJURAN's science. Answer a few quick questions and discover the ampoule made for your skin — right here, right now.
              </p>
            </div>
          </div>
        )}
        {screen === "pdrn"  && (
          <ChatScreen
            variant="pdrn"
            question="What is PDRN?"
            answer={PDRN_ANSWER}
            onBack={() => setScreen("home")}
            onNext={() => setScreen("great")}
            recommendation={!viewedPdrnScreens.includes("pdrn2") ? {
              question: "What makes REJURAN's PDRN different from other brands?",
              onYes: () => setScreen("pdrn2"),
            } : null}
          />
        )}
        {screen === "pdrn2" && (
          <ChatScreen
            variant="pdrn-diff"
            question="What makes REJURAN's PDRN different?"
            answer={PDRN_DIFF_ANSWER}
            onBack={() => setScreen("home")}
            onNext={() => setScreen("great")}
            recommendation={!viewedPdrnScreens.includes("pdrn") ? {
              question: "What is PDRN?",
              onYes: () => setScreen("pdrn"),
            } : null}
          />
        )}
        {screen === "great" && <GreatScreen onOk={goToQuiz} />}
        {screen === "quiz1" && (
          <SkinTypeScreen
            onBack={goBackToGreat}
            onNext={(skinType, origin) => { setSkinType(skinType); setSkinAnswerOrigin(origin); setScreen("quiz2"); }}
          />
        )}
        {screen === "quiz2" && (
          <Quiz2Screen
            skinType={skinType}
            answerOrigin={skinAnswerOrigin}
            onBack={() => setScreen("quiz1")}
            onNext={(c, origin) => { setConcern(c); setConcernAnswerOrigin(origin); setProduct(PRODUCT_MAP[c] || ""); setScreen("quiz3"); }}
          />
        )}
        {screen === "quiz3" && (
          <Quiz3Screen
            concern={concern}
            answerOrigin={concernAnswerOrigin}
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
          <BlobMedia
            className={`v2-shared-blob v2-shared-blob--${blobPos}`}
          />
        )}
      </div>
      </div>
      </HeaderNavContext.Provider>
    </main>
  );
}

export default AppV2;
