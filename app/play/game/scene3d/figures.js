// Builds low-poly player figures - capsule body + sphere head + a single
// rotatable box "limb" (bat for the batsman, bowling arm for the bowler,
// nothing for a plain fielder) pivoted at its base so rotating the whole
// Object3D reads as a swing. No skeletal animation/rigging, no textures -
// there's no 3D art budget here, just flat-colored primitives.

import * as THREE from 'three';

const HEAD_COLOR = 0xfcd34d;

export function createPlayerFigure({ bodyColor, limbType = null }) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.75, 4, 8),
    new THREE.MeshStandardMaterial({ color: bodyColor })
  );
  body.position.y = 0.6;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshStandardMaterial({ color: HEAD_COLOR }));
  head.position.y = 1.15;
  group.add(head);

  let limb = null;
  if (limbType === 'bat') {
    limb = new THREE.Group();
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.6, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x92400e })
    );
    handle.position.y = -0.3;
    limb.add(handle);
    limb.position.set(0.22, 0.55, 0.1);
  } else if (limbType === 'arm') {
    limb = new THREE.Group();
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.45, 0.08),
      new THREE.MeshStandardMaterial({ color: bodyColor })
    );
    arm.position.y = -0.22;
    limb.add(arm);
    limb.position.set(0.18, 0.85, 0);
  }
  if (limb) {
    group.add(limb);
    group.limb = limb;
  }

  group.body = body;
  group.head = head;
  return group;
}

export function createStumps() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0xf5f0e6 });
  const positions = [-0.12, 0, 0.12];
  group.stumpMeshes = positions.map((dx) => {
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 6), material);
    stump.position.set(dx, 0.325, 0);
    group.add(stump);
    return stump;
  });
  return group;
}
