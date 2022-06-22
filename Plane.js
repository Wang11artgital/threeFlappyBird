import { Vector3 } from './libs/three137/three.module.js';
import { GLTFLoader } from './libs/three137/GLTFLoader.js';

class Plane{
    constructor(game){
        this.loadingBar = game.loadingBar;
        this.game = game;
        this.scene = game.scene;
        this.load();
        this.tmpPos = new Vector3();
    }
    //給相機抓位置
    get position(){
        if (this.plane!==undefined) this.plane.getWorldPosition(this.tmpPos);
        return this.tmpPos;
    }
    load(){
        //gltf加載器
        const loader = new GLTFLoader().setPath('./assets/plane/')
        this.ready = false;

        loader.load(
            'microplane.glb',
            gltf => {
                this.scene.add(gltf.scene);
                this.plane = gltf.scene;
                //速度
                this.velocity = new Vector3(0,0,0.1);
                //glb檔案內的物件名字
                this.propeller = this.plane.getObjectByName('propeller');
                this.ready = true;
            },
            // 加載進行中
            xhr => {
                this.loadingBar.update('plane',xhr.loaded,xhr.total);
            },
            err=>{
                console.log(err)
            }
        )
    }
    reset(){
        this.plane.position.set(0, 0, 0);
        this.velocity.set(0,0,0.1);
    }
    update(time){
        if(this.propeller!==undefined) this.propeller.rotateZ(1);

        if(this.game.active){
            if(this.game.spaceKey){
                this.velocity.y += 0.001;
            }else{
                this.velocity.y -= 0.001;
            }
            this.velocity.z += 0.0001;
            this.plane.rotateZ(Math.sin(time*5)*0.01);
            this.plane.translateZ(this.velocity.z);
            this.plane.translateY(this.velocity.y);
        }else{
            this.plane.rotateZ(Math.sin(time*5)*0.01);
            this.plane.position.y = Math.cos(time)*1.5;
        }
    }
}
export { Plane }