// Mounts and drives the 3D field. Mirrors PitchView.js's role/method names
// (reset, animateBallApproach, swingBat, showOutcome) so MatchOrchestrator's
// call sites read the same as the old Phaser-based InningsScene's did.
//
// Coordinate system: pitch runs along +Z (bowler at -Z, batsman at +Z),
// X is sideways (off/leg side), Y is up. Ground/fielders are centered at the
// pitch's midpoint (origin).

import * as THREE from 'three';
import { createPlayerFigure, createStumps } from './figures';
import { fieldPositionsFor } from './fieldLayout';
import { AnimationScheduler, arcHeight, lerp } from './animate';

const GROUND_RADIUS = 32;
const PITCH_HALF_LENGTH = 9;
const BOWLER_Z = -PITCH_HALF_LENGTH;
const BATSMAN_Z = PITCH_HALF_LENGTH;
const BOWLER_COLOR = 0x3b82f6;
const BATSMAN_COLOR = 0xef4444;
const FIELDER_COLOR = 0x60a5fa;

export class Scene3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.scheduler = new AnimationScheduler();
    this.disposed = false;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d2b12);

    // A wider, higher, more pulled-back angle than a tight broadcast
    // "behind the arm" shot - that framing hides every fielder outside a
    // narrow forward cone, which defeats the point of having them on
    // screen at all. This trades some cinematic close-up feel for actually
    // showing the fielders the user asked to see.
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 500);
    this.camera.position.set(0, 13, BOWLER_Z - 16);
    this.camera.lookAt(0, 0, 1.5);

    this._buildField();
    this._buildLighting();

    this.bowlerFigure = createPlayerFigure({ bodyColor: BOWLER_COLOR, limbType: 'arm' });
    this.bowlerFigure.position.set(0, 0, BOWLER_Z);
    this.scene.add(this.bowlerFigure);

    this.batsmanFigure = createPlayerFigure({ bodyColor: BATSMAN_COLOR, limbType: 'bat' });
    this.batsmanFigure.position.set(0, 0, BATSMAN_Z);
    this.batsmanFigure.rotation.y = Math.PI;
    this.scene.add(this.batsmanFigure);

    this.stumps = createStumps();
    this.stumps.position.set(0, 0, BATSMAN_Z + 0.5);
    this.scene.add(this.stumps);
    this._initialStumpPositions = this.stumps.stumpMeshes.map((s) => s.position.clone());

    this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x888888 })
    );
    this.scene.add(this.ball);

    this.fielders = [];

    this._resizeObserver = new ResizeObserver(() => this._handleResize());
    this._resizeObserver.observe(canvas.parentElement);
    this._handleResize();

    this._rafId = requestAnimationFrame(this._tick);
  }

  _buildField() {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(GROUND_RADIUS, 48),
      new THREE.MeshStandardMaterial({ color: 0x1f7a3d })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    const boundaryCurve = new THREE.EllipseCurve(0, 0, GROUND_RADIUS - 1, GROUND_RADIUS - 1, 0, Math.PI * 2);
    const boundaryPoints = boundaryCurve.getPoints(64).map((p) => new THREE.Vector3(p.x, 0.02, p.y));
    const boundaryLine = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(boundaryPoints),
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    this.scene.add(boundaryLine);

    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, PITCH_HALF_LENGTH * 2 + 2),
      new THREE.MeshStandardMaterial({ color: 0xc2a36b })
    );
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0.01;
    this.scene.add(pitch);

    [BOWLER_Z, BATSMAN_Z].forEach((z) => {
      const crease = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      crease.rotation.x = -Math.PI / 2;
      crease.position.set(0, 0.02, z);
      this.scene.add(crease);
    });
  }

  _buildLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(10, 20, 10);
    this.scene.add(sun);
  }

  /** Called once per match (squad size can change between matches). */
  setupFielders(squadSize) {
    this.fielders.forEach((f) => this.scene.remove(f));
    this.fielders = fieldPositionsFor(squadSize).map(({ angleDeg }) => {
      const figure = createPlayerFigure({ bodyColor: FIELDER_COLOR });
      const angleRad = (angleDeg * Math.PI) / 180;
      const radius = GROUND_RADIUS * 0.6;
      figure.position.set(radius * Math.sin(angleRad), 0, radius * Math.cos(angleRad));
      figure.rotation.y = Math.PI + angleRad;
      this.scene.add(figure);
      return figure;
    });
  }

  /** Visual-only flavor for the catch QTE / run-out prompt - no real sim. */
  highlightFielder(index) {
    const figure = this.fielders[index % Math.max(1, this.fielders.length)];
    if (!figure) return;
    const original = figure.body.material.color.getHex();
    figure.body.material.color.setHex(0xfcd34d);
    this.scheduler.add({
      durationMs: 600,
      onUpdate: () => {},
      onComplete: () => figure.body.material.color.setHex(original),
    });
  }

  resetBall() {
    this.scheduler.clear();
    this.ball.position.set(0, 0.9, BOWLER_Z + 1.2);
    this.ball.material.opacity = 1;
    this.ball.material.transparent = false;
    this.ball.scale.set(1, 1, 1);
    if (this.bowlerFigure.limb) this.bowlerFigure.limb.rotation.x = 0;
    if (this.batsmanFigure.limb) this.batsmanFigure.limb.rotation.z = 0;
    this.batsmanFigure.body.material.opacity = 1;
    this.batsmanFigure.body.material.transparent = false;
    this.stumps.stumpMeshes.forEach((stump, i) => {
      stump.position.copy(this._initialStumpPositions[i]);
      stump.rotation.set(0, 0, 0);
      stump.material.opacity = 1;
      stump.material.transparent = false;
    });
  }

  animateBallApproach(durationMs) {
    const start = this.ball.position.clone();
    const end = new THREE.Vector3(0, 0.9, BATSMAN_Z - 1.2);

    if (this.bowlerFigure.limb) {
      this.scheduler.add({
        durationMs: Math.min(350, durationMs * 0.4),
        onUpdate: (t) => {
          this.bowlerFigure.limb.rotation.x = lerp(0, -2.2, t < 0.5 ? t * 2 : 2 - t * 2);
        },
      });
    }

    this.scheduler.add({
      durationMs,
      onUpdate: (t) => {
        this.ball.position.lerpVectors(start, end, t);
        this.ball.position.y = start.y + arcHeight(t, 0.9);
      },
    });
  }

  swingBat(shotType) {
    if (!this.batsmanFigure.limb) return;
    const target = shotType === 'power' ? -2.5 : -1.1;
    this.scheduler.add({
      durationMs: 110,
      onUpdate: (t) => {
        const phase = t < 0.5 ? t * 2 : 2 - t * 2;
        this.batsmanFigure.limb.rotation.z = lerp(0, target, phase);
      },
    });
  }

  /** @returns {Promise<void>} */
  showOutcome(outcome) {
    return new Promise((resolve) => {
      if (outcome.isWide || outcome.isNoBall) {
        setTimeout(resolve, 250);
        return;
      }

      if (outcome.isWicket && outcome.dismissalType === 'bowled') {
        this.stumps.stumpMeshes.forEach((stump, i) => {
          const start = stump.position.clone();
          const dir = (i - 1 || 1) * 1.2;
          this.scheduler.add({
            durationMs: 450,
            onUpdate: (t) => {
              stump.position.x = start.x + dir * t;
              stump.position.z = start.z + 0.8 * t;
              stump.position.y = Math.max(0.05, start.y - 0.9 * t);
              stump.rotation.z = dir * 2.2 * t;
              stump.rotation.x = 1.4 * t;
            },
          });
        });
        setTimeout(resolve, 450);
        return;
      }

      if (outcome.isWicket) {
        const material = this.batsmanFigure.body.material;
        material.transparent = true;
        this.scheduler.add({
          durationMs: 250,
          onUpdate: (t) => {
            material.opacity = 1 - 0.7 * Math.sin(t * Math.PI);
          },
          onComplete: () => {
            material.opacity = 1;
          },
        });
        setTimeout(resolve, 400);
        return;
      }

      const distance = outcome.runsScored >= 4 ? 10 : outcome.runsScored > 0 ? 3 : 0.5;
      const start = this.ball.position.clone();
      const end = start.clone().add(new THREE.Vector3(0, outcome.isAerial ? 2 : 0.2, distance));
      if (outcome.runsScored >= 4) this.ball.material.transparent = true;
      this.scheduler.add({
        durationMs: 350,
        onUpdate: (t) => {
          this.ball.position.lerpVectors(start, end, t);
          if (outcome.runsScored >= 4) this.ball.material.opacity = 1 - t;
        },
      });
      setTimeout(resolve, 400);
    });
  }

  _handleResize() {
    const parent = this.canvas.parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  _tick = (now) => {
    if (this.disposed) return;
    this.scheduler.tick(now);
    this.renderer.render(this.scene, this.camera);
    this._rafId = requestAnimationFrame(this._tick);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this._rafId);
    this._resizeObserver.disconnect();
    this.scene.traverse((obj) => {
      obj.geometry?.dispose();
      if (obj.material) {
        (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
      }
    });
    this.renderer.dispose();
  }
}
