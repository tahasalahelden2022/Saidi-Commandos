import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { QualityPreset } from '../types/game';

export function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param) ?? '');
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

export interface SceneRig {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  sunLight: THREE.DirectionalLight;
  isSoftwareGl: boolean;
  setQuality: (preset: QualityPreset) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
}

export function createSceneRig(container: HTMLElement): SceneRig {
  const isSoftwareGl = detectSoftwareWebGL();
  const width = Math.max(1, container.clientWidth);
  const height = Math.max(1, container.clientHeight);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const horizonColor = 0xe3cfa9;
  scene.background = new THREE.Color(horizonColor);
  scene.fog = new THREE.FogExp2(horizonColor, 0.0095);

  // Studio environment reflections (PBR metallic/brass/clay highlights)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  pmremGenerator.dispose();

  // Warm Golden-Hour Upper Egyptian Key Light (crisp directional relief + rich warm/cool shadow contrast)
  const sunLight = new THREE.DirectionalLight(0xffe1b0, 2.55);
  sunLight.position.set(26, 29, 21);
  sunLight.castShadow = !isSoftwareGl;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 6;
  sunLight.shadow.camera.far = 98;
  const d = 32;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.00045;
  sunLight.shadow.normalBias = 0.022;
  sunLight.shadow.radius = 2.0;
  scene.add(sunLight);
  scene.add(sunLight.target);

  // Cool Nile-Sky / Warm Sand Bounce Fill
  const hemiLight = new THREE.HemisphereLight(0x8bcbe8, 0xb07542, 0.92);
  hemiLight.position.set(0, 35, 0);
  scene.add(hemiLight);

  // Crisp Cool-Sky Rim Backlight for isometric character & parapet separation
  const rimLight = new THREE.DirectionalLight(0xb0d8ff, 0.58);
  rimLight.position.set(-24, 18, -22);
  scene.add(rimLight);

  const setQuality = (preset: QualityPreset) => {
    if (isSoftwareGl) {
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
      sunLight.castShadow = false;
      return;
    }
    if (preset === 'eco') {
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = true;
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(1024, 1024);
    } else {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(2048, 2048);
    }
    sunLight.shadow.map?.dispose();
    sunLight.shadow.map = null;
  };

  const resize = (w: number, h: number) => {
    const safeW = Math.max(1, w);
    const safeH = Math.max(1, h);
    renderer.setSize(safeW, safeH);
  };

  const dispose = () => {
    envTarget.dispose();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  };

  return {
    scene,
    renderer,
    sunLight,
    isSoftwareGl,
    setQuality,
    resize,
    dispose,
  };
}
