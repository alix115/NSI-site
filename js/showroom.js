// ============================================================
//  NFS HEAT — Showroom 3D (caméra orbitale 360°)
//  Three.js + OrbitControls + GLTFLoader
// ============================================================
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const MODEL_URL =
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf/ferrari.glb";

const modal = document.getElementById("showroom");
const stage = document.getElementById("showroomStage");
const titleEl = document.getElementById("showroomTitle");
const subEl = document.getElementById("showroomSub");
const badgeEl = document.getElementById("showroomBadge");
const photoEl = document.getElementById("showroomPhoto");
const loadingEl = document.getElementById("showroomLoading");
const hintEl = document.getElementById("showroomHint");

let renderer, scene, camera, controls, model, bodyMat, pmrem;
let raf = null;
let initDone = false;
let modelReady = false;
let modelFailed = false;
let loadPromise = null;
let resizeObserver = null;

function setupScene() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 120);
  camera.position.set(4.6, 1.9, 5.4);

  // Éclairage : environnement studio + néons rose/cyan
  pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(6, 9, 5);
  scene.add(key);
  const pink = new THREE.DirectionalLight(0xff2d78, 2.0);
  pink.position.set(-7, 3, -3);
  scene.add(pink);
  const cyan = new THREE.DirectionalLight(0x00e5ff, 1.8);
  cyan.position.set(7, 2, -7);
  scene.add(cyan);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  // Sol réfléchissant + grille néon
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(16, 72),
    new THREE.MeshStandardMaterial({ color: 0x08080f, metalness: 0.9, roughness: 0.32 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  const grid = new THREE.GridHelper(32, 32, 0xff2d78, 0x1b1b30);
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  scene.add(grid);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 3.2;
  controls.maxDistance = 14;
  controls.minPolarAngle = 0.08;
  controls.maxPolarAngle = Math.PI * 0.53; // on ne passe pas sous le sol
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.1;
  controls.target.set(0, 0.55, 0);

  // Le fond dégradé
  scene.background = null;

  resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(stage);
  window.addEventListener("resize", resize);

  // Double-clic : réinitialiser la caméra
  renderer.domElement.addEventListener("dblclick", () => {
    if (!controls) return;
    camera.position.set(4.6, 1.9, 5.4);
    controls.target.set(0, 0.55, 0);
    controls.update();
  });

  initDone = true;
}

function resize() {
  if (!renderer || !stage) return;
  const w = stage.clientWidth || 1;
  const h = stage.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function loadModel() {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        model = gltf.scene;
        model.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.material.envMapIntensity = 1.15;
          }
        });

        // Normalisation : centré, posé sur le sol, longueur ~4,5
        let box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        model.scale.setScalar(4.6 / maxDim);
        box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= box.min.y;
        model.rotation.y = Math.PI * 0.15;

        scene.add(model);
        modelReady = true;
        resolve(true);
      },
      undefined,
      () => {
        modelFailed = true;
        resolve(false);
      }
    );
  });
  return loadPromise;
}

function setBodyColor(hex) {
  if (!model) return;
  if (!bodyMat) {
    bodyMat = new THREE.MeshPhysicalMaterial({
      metalness: 0.9,
      roughness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.3
    });
  }
  bodyMat.color.set(hex);
  model.traverse((o) => {
    if (!o.isMesh) return;
    const n = (o.name || "").toLowerCase();
    const mn = ((o.material && o.material.name) || "").toLowerCase();
    if (n === "body" || mn === "body") o.material = bodyMat;
  });
}

function loop() {
  if (raf) return;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
  };
  tick();
}

function stopLoop() {
  if (raf) cancelAnimationFrame(raf);
  raf = null;
}

async function open(payload) {
  const { car, cat, img } = payload;

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
  stage.classList.remove("no3d");

  titleEl.textContent = `${car.brand} ${car.model}`;
  subEl.textContent = `${car.year} · ${cat.label}`;
  badgeEl.textContent = cat.label;
  badgeEl.style.color = cat.color;
  badgeEl.style.borderColor = cat.color;
  badgeEl.style.background = cat.color + "1f";

  if (img) {
    photoEl.src = img;
    photoEl.style.display = "";
  } else {
    photoEl.style.display = "none";
  }

  if (!initDone) {
    try {
      setupScene();
    } catch (e) {
      modelFailed = true;
      initDone = true;
    }
  }
  resize();

  loadingEl.classList.remove("hidden");
  hintEl.classList.add("hidden");

  if (!modelFailed) {
    await loadModel();
  }

  if (modelReady && !modelFailed) {
    setBodyColor(cat.color);
    loadingEl.classList.add("hidden");
    hintEl.classList.remove("hidden");
    requestAnimationFrame(() => {
      resize();
      stopLoop();
      loop();
    });
  } else {
    // Repli : on affiche la grande photo
    loadingEl.classList.add("hidden");
    hintEl.classList.add("hidden");
    if (img) stage.classList.add("no3d");
  }
}

function close() {
  modal.classList.remove("open");
  document.body.style.overflow = "";
  stopLoop();
  stage.classList.remove("no3d");
}

// Événements UI
document.getElementById("showroomClose").addEventListener("click", close);
modal.addEventListener("click", (e) => {
  if (e.target === modal) close();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("open")) close();
});

// Exposé pour main.js
window.openShowroom = open;
window.NFS_SHOWROOM_READY = true;
