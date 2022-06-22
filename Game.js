import * as THREE from './libs/three137/three.module.js';
import { RGBELoader } from './libs/three137/RGBELoader.js';
import { LoadingBar } from './libs/LoadingBar.js';
import { Plane } from './Plane.js';
import { Obstacles } from './Obstacles.js';
import { SFX } from './SFX.js';
class Game{
    constructor(){
        const container = document.createElement( 'div' );
        document.body.appendChild( container );

        this.loadingBar = new LoadingBar();
        this.loadingBar.visible = false;
        this.clock = new THREE.Clock();

        //參數1角度: 視場，2長寬比: 確保不會被拉伸，34為遠近值(注意在PerspectiveCamera近值0不為有效)
        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 100 );
        this.camera.position.set( -4.37, 0, -4.75 );
        this.camera.lookAt(0,0,6);
        
        //三維物體，不帶參數
        this.cameraController = new THREE.Object3D();
        this.cameraController.add(this.camera);
        //三維向量
        this.cameraTarget = new THREE.Vector3(0,0,6);
        
        this.scene = new THREE.Scene();
        this.scene.add(this.cameraController);
        
        //環境燈
        const ambientlight = new THREE.HemisphereLight( 0xFFFFFF, 0xBBBBFF, 1);
        this.scene.add(ambientlight);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild( this.renderer.domElement );
        this.setEnvironment();
        this.active = false;
        this.load();

        document.addEventListener('keydown', this.keyDown.bind(this));
        document.addEventListener('keyup', this.keyUp.bind(this));
        document.addEventListener('mousedown', this.mouseDown.bind(this));
        document.addEventListener('mouseup', this.mouseUp.bind(this));
        document.addEventListener('touchstart', this.mouseDown.bind(this));
        document.addEventListener('touchend', this.mouseUp.bind(this));
        //給飛機判斷開始遊戲的變數
        this.spaceKey = false;
        
        const btn = document.getElementById('playBtn');
        btn.addEventListener('click', this.startGame.bind(this));

        window.addEventListener('resize', this.resize.bind(this) );
    }
    startGame(){
        const gameover = document.getElementById('gameover');
        const btn = document.getElementById('playBtn');
        const instru = document.getElementById('instru');

        gameover.style.display= 'none';
        instru.style.display = 'none';
        btn.style.display = 'none';

        this.score = 0;
        this.bonusScore = 0;
        this.lives = 3;

        let elm = document.getElementById('score');
        elm.innerHTML = this.score;

        elm = document.getElementById('lives');
        elm.innerHTML = this.lives;

        this.plane.reset();
        this.obstacles.reset();
        this.active = true;
        this.sfx.play('engine');
    }
    gameOver(){
        this.active = false;

        const gameover = document.getElementById('gameover');
        const btn = document.getElementById('playBtn');

        gameover.style.display = 'block';
        btn.style.display = 'block';
        this.sfx.stopAll();
        this.sfx.play('gameover');
    }
    incScore(){
        this.score++;
        const elm = document.getElementById('score');

        if(this.score % 3 == 0 ){
            this.bonusScore += 3;
            this.sfx.play('bonus');
        }else{
            this.sfx.play('gliss');
        }
        elm.innerHTML = this.score+this.bonusScore;
    }
    decLives(){
        this.lives--;
        const elm = document.getElementById('lives');
        this.sfx.play('explosion');

        elm.innerHTML = this.lives;
        if(this.lives==0) this.gameOver();
    }
    mouseDown(evt){
        this.spaceKey = true;
    }
    mouseUp(evt){
        this.spaceKey = false;
    }
    keyDown(evt){
        switch(evt.keyCode){
            case 32:
                this.spaceKey = true;
                break;
        }
    }
    keyUp(evt){
        switch(evt.keyCode){
            case 32:
                this.spaceKey = false;
                break;
        }
    }
    setEnvironment(){
        //加載二進位式HDR文件(exr/hdr都可)
        const loader = new RGBELoader().setPath('./assets/');
        //總之處理HDR的
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        //預處理投影紋理
        pmremGenerator.compileEquirectangularShader();
        
        loader.load( 'hdr/venice_sunset_1k.hdr', ( texture ) => {
            const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
            //處理內存
            pmremGenerator.dispose();

            this.scene.environment = envMap;

        }, undefined, (err)=>{
            console.error( err.message );
        } );
    }
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth,window.innerHeight)
    }
    render() {   
        if(this.loading){
            if(this.plane.ready && this.obstacles.ready){
                this.loading = false;
                this.loadingBar.visible = false;
            }
            else{
                return;
            }
        }
        //獲得時鐘秒數
        const dt = this.clock.getDelta();
        const time = this.clock.getElapsedTime();
        this.plane.update(time);
        if(this.active) {
            this.obstacles.update(this.plane.position,dt)
        }
        this.updateCamera();
        this.renderer.render( this.scene, this.camera );
    }
    load(){
        this.loading = true;
        this.loadingBar.visible = true;

        this.loadSkybox();
        this.plane = new Plane(this);
        this.obstacles = new Obstacles(this);
        this.loadSFX();
    }
    loadSFX(){
        this.sfx = new SFX(this.camera)
        this.sfx.load('explosion');
        this.sfx.load('engine',true,2);
        this.sfx.load('gliss');
        this.sfx.load('gameover');
        this.sfx.load('bonus');
    }
    loadSkybox(){
        this.scene.background = new THREE.CubeTextureLoader()
            .setPath('./assets/plane/paintedsky/')
            .load([
                'px.jpg',
                'nx.jpg',
                'py.jpg',
                'ny.jpg',
                'pz.jpg',
                'nz.jpg'
            ],()=>{
                this.renderer.setAnimationLoop(this.render.bind(this));
            })
    }
    //將相機綁住飛機，在相機z方向前方6單位
    updateCamera(){
        this.cameraController.position.copy(this.plane.position);
        this.cameraController.position.y = 0;
        this.cameraTarget.copy(this.plane.position);
        this.cameraTarget.z += 6;
        this.camera.lookAt(this.cameraTarget);
    }
}

export { Game };