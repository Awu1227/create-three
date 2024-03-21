import * as THREE from "three";

import Experience from "../Experience.js";

export default class Floor {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    // Setup
    this.setGeometry();
    this.setTextures();
    this.setMaterial();
    this.setMesh();
  }

  setGeometry() {
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
  }

  setTextures() {
    this.textures = {};

    // 设置材质的颜色贴图纹理对象
    this.textures.color = this.resources.items.wallColorTexture;
    this.textures.color.encoding = THREE.sRGBEncoding; // 设置sRGB编码方式以提高颜色的准确性和一致性，避免出现色彩误差和变形等问题。
    this.textures.color.repeat.set(1.5, 1.5); // 用于控制材质贴图重复的次数，将贴图在S轴和T轴上重复1.5次
    this.textures.color.wrapS = THREE.RepeatWrapping; // 在S轴（水平）方向上采用重复纹理的方式，即在纹理周围填充与之相同的纹理，实现更好的纹理平铺效果
    this.textures.color.wrapT = THREE.RepeatWrapping; // 在T轴（垂直）方向上采用重复纹理的方式，即在纹理周围填充与之相同的纹理，实现更好的纹理平铺效果

    this.textures.normal = this.resources.items.wallNormalTexture;
    this.textures.normal.repeat.set(1.5, 1.5);
    this.textures.normal.wrapS = THREE.RepeatWrapping;
    this.textures.normal.wrapT = THREE.RepeatWrapping;
  }

  setMaterial() {
    this.material = new THREE.MeshPhongMaterial({
      map: this.textures.color,
      normalMap: this.textures.normal,
    });
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.y = 1;
    this.mesh.rotation.x = -Math.PI * 0.5;
    this.mesh.castShadow = true;
    this.scene.add(this.mesh);
  }
  update() {
    this.mesh.rotation.x += 0.01;
    this.mesh.rotation.y += 0.01;
  }
}
