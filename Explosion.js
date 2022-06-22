import { IcosahedronGeometry, TextureLoader, ShaderMaterial, Mesh, ShaderChunk } from './libs/three137/three.module.js';
import { noise } from './libs/Noise.js';
import { Tween } from './libs/Toon3D.js';

class Explosion{
    //glsl
    static vshader = `
        #include <noise>
        uniform float u_time;
        varying float noise;
        void main() {	
            float time = u_time;
            float displacement;
            float b;
            noise = 10.0 *  -.10 * turbulence( .5 * normal + time );
            b = 5.0 * pnoise( 0.05 * position + vec3( 2.0 * time ), vec3( 100.0 ) );
            displacement = - 10. * noise + b;
            vec3 newPosition = position + normal * displacement;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
        }
    `
    static fshader = `
        #define PI 3.141592653589
        #define PI2 6.28318530718
        uniform vec2 u_mouse;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_opacity;
        uniform sampler2D u_tex;
        varying float noise;
        float random( vec3 scale, float seed ){
            return fract( sin( dot( gl_FragCoord.xyz + seed, scale ) ) * 43758.5453 + seed ) ;
        }
        void main() {
            float r = .01 * random( vec3( 12.9898, 78.233, 151.7182 ), 0.0 );
            vec2 t_pos = vec2( 0, 1.3 * noise + r );
            vec4 color = texture2D( u_tex, t_pos );
            gl_FragColor = vec4( color.rgb, u_opacity );
        }
    `
    constructor(parent, obstacles){
        //多面體(半徑,detail越多越圓)
        const geometry = new IcosahedronGeometry(20,4);
        this.obstacles = obstacles;
        this.uniforms = {
            u_time:{ value: 0 },
            u_opacity: { value:0.6 },
            u_tex: { value: new TextureLoader().load('./assets/plane/explosion.png')}
        }
        ShaderChunk.noise = noise;
        const material = new ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: Explosion.vshader,
            fragmentShader: Explosion.fshader,
            opacity:0.6,
            transparent: true
        });
        this.ball = new Mesh( geometry,material);
        const scale = 0.05;
        this.ball.scale.set(scale,scale,scale);
        parent.add(this.ball);
        this.tweens = [];
        this.tweens.push(new Tween(this.ball.scale,'x',0.2,1.5,this.onComplete.bind(this),'outQuad'));

        this.active = true;
    }
    onComplete(){
        this.ball.parent.remove(this.ball);
        this.tweens = [];
        this.active = false;
        this.ball.geometry.dispose();
        this.ball.material.dispose();
        if(this.obstacles) this.obstacles.removeExplosion(this);
    }
    update(time){
        if(!this.active) return;

        this.uniforms.u_time.value += time;
        this.uniforms.u_opacity.value = this.ball.material.opacity;

        if(this.tweens.length<2){
            if(this.uniforms.u_time.value>1){
                this.tweens.push(new Tween(this.ball.material,'opacity',0,0.5));
            }
        }
        this.tweens.forEach(tween => {
            tween.update(time);
        })

        this.ball.scale.y = this.ball.scale.z = this.ball.scale.x;
    }
}

export{Explosion}