import * as THREE from 'https://unpkg.com/three@0.142.0/build/three.module.js';
import { fragmentShader } from "../shader/fragment.js";
import { vertexShader } from "../shader/vertex.js";

export class SceneManager {
    constructor() {
        this.textures = [];
        this.init();
    }

    getDimension() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.aspect = this.width / this.height;
    }

    async init() {
        this.textures = await Promise.all([this.loadImage("/img/biei.jpg")]);

        this.getDimension();
        this.setupThree();
        this.setupPlane();
        this.render();

        window.addEventListener("pointermove", (e) => {
            const { pageX, pageY } = e;

            const aspect = window.innerWidth / window.innerHeight;
            // this.planeMat.uniforms.u_mouse.value.x = (pageX - window.innerWidth / 2) / window.innerWidth * ratio;
            // this.planeMat.uniforms.u_mouse.value.y = (pageY - window.innerHeight / 2) / window.innerHeight * -1;

            this.planeMat.uniforms.u_mouse.value.x = ((pageX / window.innerWidth));
            this.planeMat.uniforms.u_mouse.value.y = (pageY * -1 / window.innerHeight) + 1;
            // console.log(this.planeMat.uniforms.u_mouse.value.x);

            e.preventDefault();
        })
    }

    setupThree() {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById("app").appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        // this.camera = new THREE.OrthographicCamera( this.width / - 2, this.width / 2, this.height / 2, this.height / - 2, 1, 1000 );
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 2000);
        this.camera.position.z = 5;
    }

    async loadImage(path) {
        return new THREE.TextureLoader().loadAsync(path);
    }

    calcPlanePos() {
        const fovAtRadian = (this.camera.fov / 2) * (Math.PI / 180);
        const screenHeight = this.camera.position.z * Math.tan(fovAtRadian) * 2;
        const screenWidth = screenHeight * this.aspect;

        return {
            screenWidth,
            screenHeight
        };
    }

    setupPlane() {
        this.planeGeo = new THREE.PlaneGeometry(1,1);
        this.planeMat = new THREE.ShaderMaterial({
            fragmentShader,
            vertexShader,
            uniforms: {
                u_image: { value: this.textures[0] },
                u_mouse: {value: new THREE.Vector2(-.1, -.1)},
                u_time: {value: 0},
                u_resolution: { value: new THREE.Vector2(this.width * window.devicePixelRatio, this.height * window.devicePixelRatio) },
                u_imageResolution: { value: new THREE.Vector2(16, 9) },
            }
        });
        const { screenWidth, screenHeight } = this.calcPlanePos();
        this.screenMesh = new THREE.Mesh(this.planeGeo, this.planeMat);
        this.screenMesh.scale.set(screenWidth, screenHeight, 1);
        this.scene.add(this.screenMesh);
    }

    render(delta) {
        requestAnimationFrame(this.render.bind(this));

        this.planeMat.uniforms.u_time.value = delta * 0.0005;

        this.renderer.render(this.scene, this.camera);

    }
}