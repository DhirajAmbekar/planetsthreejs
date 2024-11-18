import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

// Get canvas and setup renderer
const canvas = document.querySelector("canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Create scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  25,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 8;

// Loader elements
const loaderElement = document.createElement("div");
loaderElement.style.position = "fixed";
loaderElement.style.top = "0";
loaderElement.style.left = "0";
loaderElement.style.width = "100%";
loaderElement.style.height = "100%";
loaderElement.style.backgroundColor = "#000";
loaderElement.style.color = "#fff";
loaderElement.style.display = "flex";
loaderElement.style.alignItems = "center";
loaderElement.style.justifyContent = "center";
loaderElement.style.fontSize = "2rem";
loaderElement.innerText = "Loading...";
document.body.appendChild(loaderElement);

// Loading manager
const loadingManager = new THREE.LoadingManager(
  () => {
    // On load complete
    loaderElement.style.display = "none";
    animate();
  },
  (url, loaded, total) => {
    // Update loader progress if needed
    loaderElement.innerText = `Loading... (${Math.round(
      (loaded / total) * 100
    )}%)`;
  }
);

// Load HDRI environment map
const textureLoader = new RGBELoader(loadingManager);
textureLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/moonlit_golf_2k.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = false;
  }
);

// Create a large sphere for the starfield background
const starfieldGeometry = new THREE.SphereGeometry(50, 64, 64);

// Load and configure the stars texture
const starsTexture = new THREE.TextureLoader(loadingManager).load(
  "./stars.jpg"
);
const starfieldMaterial = new THREE.MeshStandardMaterial({
  map: starsTexture,
  side: THREE.BackSide, // Render on the inside of the sphere
});
starsTexture.colorSpace = THREE.SRGBColorSpace;

const starfield = new THREE.Mesh(starfieldGeometry, starfieldMaterial);
scene.add(starfield);

const sphereMess = [];

const radius = 1.3;
const segments = 64;
const rings = 64;
const orbitRadius = 4.5;
const textures = [
  "./earth/map.jpg",
  "./csilla/color.png",
  "./volcanic/color.png",
  "./venus/map.jpg",
];

let spheres = new THREE.Group();
for (let i = 0; i < 4; i++) {
  const texture = new THREE.TextureLoader(loadingManager).load(textures[i]);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.SphereGeometry(radius, segments, rings);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const sphere = new THREE.Mesh(geometry, material);
  const angle = ((i + 1) * Math.PI) / 2;
  sphereMess.push(sphere);
  material.needsUpdate = true;
  sphere.position.x = Math.cos(angle) * orbitRadius;
  sphere.position.z = Math.sin(angle) * orbitRadius;
  spheres.add(sphere);
}
spheres.rotation.x = 0.1;
spheres.position.y = -0.8;

scene.add(spheres);

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let isAnimating = false; // Prevents multiple animations
let headingIndex = 0;

const throttledWheel = (event) => {
  if (isAnimating) return; // Ignore while animation is ongoing

  const direction = event.deltaY > 0 ? "down" : "up";

  isAnimating = true;

  const headings = document.querySelectorAll("h1");
  const totalHeadings = headings.length;

  headingIndex =
    direction === "down"
      ? (headingIndex + 1) % totalHeadings
      : (headingIndex - 1 + totalHeadings) % totalHeadings;

  const animationDistance = headingIndex * -100;

  gsap.to(headings, {
    y: `${animationDistance}%`,
    duration: 1,
    ease: "power2.inOut",
    onComplete: () => {
      isAnimating = false;
    },
  });

  const rotationAmount = direction === "down" ? -Math.PI / 2 : Math.PI / 2;
  gsap.to(spheres.rotation, {
    y: `+=${rotationAmount}`,
    duration: 1,
    ease: "power2.inOut",
  });
};

window.addEventListener(
  "wheel",
  (event) => {
    if (Math.abs(event.deltaY) > 30) {
      throttledWheel(event);
    }
  },
  { passive: true }
);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  for (let i = 0; i < sphereMess.length; i++) {
    sphereMess[i].rotation.y += 0.0001;
  }
  renderer.render(scene, camera);
}

animate();
