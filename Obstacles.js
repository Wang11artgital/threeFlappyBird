import { Group,Vector3 } from './libs/three137/three.module.js';
import { GLTFLoader } from './libs/three137/GLTFLoader.js';
import { Explosion } from './Explosion.js';

class Obstacles{
    constructor(game){
        this.loadingBar = game.loadingBar;
        this.game = game;
        this.scene = game.scene;
        this.loadStar();
        this.loadBomb();
        this.tmpPos = new Vector3();
        this.explosions = [];
    }
    loadStar(){
        const loader = new GLTFLoader().setPath('./assets/plane/')
        this.ready = false;

        loader.load(
            'star.glb',
            gltf => {
                this.star = gltf.scene.children[0];
                this.star.name = 'star';
                if(this.bomb!==undefined) this.initialize();
            },
            // 加載進行中
            xhr => {
                this.loadingBar.update('star',xhr.loaded,xhr.total);
            },
            err=>{
                console.log(err)
            }
        )
    }
    loadBomb(){
        const loader = new GLTFLoader().setPath('./assets/plane/')

        loader.load(
            'bomb.glb',
            gltf => {
                this.bomb = gltf.scene.children[0];
                if(this.star!==undefined) this.initialize();
            },
            // 加載進行中
            xhr => {
                this.loadingBar.update('bomb',xhr.loaded,xhr.total);
            },
            err=>{
                console.log(err)
            }
        )
    }
    initialize(){
        this.obstacles = [];
        const obstacle = new Group();
        obstacle.add(this.star);

        this.bomb.rotation.x = -Math.PI*0.5;
        this.bomb.position.y = 7.5;
        obstacle.add(this.bomb);

        let rotate = true;

        for(let y=7.5;y>-8;y-=2.5){
            rotate = !rotate;
            if(y==0) continue;
            const bomb = this.bomb.clone();
            bomb.rotation.x = (rotate) ? -Math.PI*0.5 : 0;
            bomb.position.y = y;
            obstacle.add(bomb);
        }
        this.obstacles.push(obstacle);
        this.scene.add(obstacle);

        for(let i=0;i<3;i++){
            const obstacle1 = obstacle.clone();

            this.scene.add(obstacle1);
            this.obstacles.push(obstacle1);
        }
        //定位
        this.reset();
        this.ready = true;
    }
    reset(){
        this.obstacleSpawn = {pos:20,offset:5};
        this.obstacles.forEach( obstacle=> this.respawnObstacle(obstacle));
        let count = 0;
        while(this.explosions.length>0 && count<100){
            this.explosions[0].onComplete();
            count++;
        }
    }
    respawnObstacle(obstacle){
        this.obstacleSpawn.pos += 30;
        const offset = (Math.random()*2 - 1)*this.obstacleSpawn.offset;
        this.obstacleSpawn.offset += 0.2;
        obstacle.position.set(0,offset,this.obstacleSpawn.pos);
        obstacle.userData.hit = false;
        obstacle.children.forEach(child=>{
            //把消失的星星顯示
            child.visible = true;
        })
    }
    removeExplosion(explosion){
        const index = this.explosions.indexOf(explosion);
        if(index != -1) this.explosions.splice(index,1);
    }
    //time->dt
    update(pos,time){
        let collisionObstacle;

        this.obstacles.forEach(obstacle=>{
            const relativePosZ = obstacle.position.z - pos.z;
            if(Math.abs(relativePosZ)<2 && !obstacle.userData.hit){
                collisionObstacle = obstacle;
            }
            if(relativePosZ<-20){
                this.respawnObstacle(obstacle)
            }
        });
        if(collisionObstacle!==undefined){
            const planePos = this.game.plane.position;
            collisionObstacle.children.forEach(child=>{
                child.getWorldPosition(this.tmpPos);
                //距離平方
                const dist = this.tmpPos.distanceToSquared(planePos);
                if(dist<5){
                    collisionObstacle.userData.hit = true;
                    this.hit(child);
                    return true;
                }
            })
        }
        this.explosions.forEach( explosion => {
            explosion.update( time );
        });
    }

	hit(obj){
		if(obj.name == 'star'){
            this.game.incScore();
            obj.visible = false;
        }else{
            this.explosions.push(new Explosion(obj,this))
            this.game.decLives();
        }
	}
}
export { Obstacles }