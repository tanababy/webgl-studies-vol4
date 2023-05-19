import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

gsap.registerPlugin(ScrollTrigger);

class Main {
    constructor() {
        this.width = document.body.clientWidth;//スクロールバーの長さを除いた幅
        this.height = window.innerHeight;
        this.aspect = this.width / this.height;
        this.modelList = [
            "plane_crash_by_a_brothel_in_nevada_small",
            "camera_path"
        ];
        this.loadedModelList = null;
        this.clock = new THREE.Clock();

        this.increment = 0;

        this.$scroller = document.querySelectorAll(".scrollerSection");
        this.$contents = document.querySelectorAll(".contentsSection");

        this.onScroll = this.onScroll.bind(this);

        this.init();
    }

    async init() {
        this.setupLenis();
        this.loadedModelList = await Promise.all(
            this.modelLoad()
        );
        this.modelGLB = this.loadedModelList[0];
        this.cameraGLB = this.loadedModelList[1];

        this.hdr = await this.textureload();
        this.hdr.mapping = THREE.EquirectangularReflectionMapping;

        this.setupTHREE();
        this.setupScene();
        this.setupCamera();
        this.setupModel();
        this.render();

        this.setupAnimation();
        this.setupDOMAnimation();
    }

    setupLenis() {
        this.lenis = new Lenis({
            smoothWheel: true,
            normalizeWheel: true,
        });
        this.lenis.on('scroll', this.onScroll);
    }

    textureload() {
        const loader = new RGBELoader();
        return loader.loadAsync(`/texture/kiara_7_late-afternoon_4k.hdr`);
    }

    modelLoad() {
        const loader = new GLTFLoader();
        const promises = [];

        for (let i = 0; i < this.modelList.length; i++) {
            promises.push(loader.loadAsync(`/model/${this.modelList[i]}.glb`))
        }

        return promises;
    }

    setupTHREE() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("canvas"),
            antialias: true
        });
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.setSize( this.width, this.height );
        this.renderer.setPixelRatio( window.devicePixelRatio );
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = this.hdr;
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera( 70, this.aspect, 0.01, 100 );
    }

    setupModel() {
        this.scene.add(this.modelGLB.scene);
    }

    setupAnimation() {
        const clip = this.cameraGLB.animations[0];
        clip.duration += 0.01;// three.jsはseekした時last frameをskipするらしいので時間ちょっと足す
        this.mixer = new THREE.AnimationMixer(this.cameraGLB.cameras[0]);
        const action = this.mixer.clipAction(clip);
        action.clampWhenFinished = true;
        action.play();
        // action.paused = true;
    }

    setupDOMAnimation() {
        for (let i = 0; i < this.$contents.length; i++) {
            gsap.to(this.$contents[i], {
                startAt: {
                    autoAlpha: 0
                },
                autoAlpha: 1,
                duration: 0.25,
                scrollTrigger: {
                    trigger: this.$scroller[i],
                    start: 'top bottom',
                    end: 'top+=1500 bottom',
                    toggleActions: 'play reverse play reverse',
                    // toggleActions:
                    //   event: onEnter onLeave onEnterBack onLeaveBack
                    //   default: play none none none
                    // markers: true
                },
            })
        }

        //scrollTrigger初期化であたってしまうスタイルを削除しておく
        this.$contents.forEach((el) => {
            el.style.removeProperty('opacity');
            el.style.removeProperty('visibility');
            gsap.set(el, {
                autoAlpha: 0
            })
        })
    }

    setAnimationByProgressPercentage(percentage) {
        const percent = Math.max(0, Math.min(percentage * this.mixer._actions[0]._clip.duration, this.mixer._actions[0]._clip.duration - 0.0001));
        if(this.mixer._actions[0].paused) this.mixer._actions[0].paused = false;
        this.mixer.setTime(percent);
        this.mixer._actions[0].time = percent;
    }

    onScroll(e) {
        ScrollTrigger.update();

        this.setAnimationByProgressPercentage(e.progress);
    }


    render(time) {
        this.increment++;
        requestAnimationFrame(this.render.bind(this));

        if(this.lenis) this.lenis.raf(time);

        if(this.increment % 2 === 0) return;

        this.camera.position.copy(this.cameraGLB.cameras[0].position);
        this.camera.quaternion.copy(this.cameraGLB.cameras[0].quaternion);
        this.camera.updateProjectionMatrix();

        // const delta = this.clock.getDelta();
        // if (this.mixer) this.mixer.update(delta);
        this.renderer.render(this.scene, this.camera);
    }
}

window.history.scrollRestoration = 'manual';
new Main();