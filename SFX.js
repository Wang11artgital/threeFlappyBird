import { AudioListener, Audio, PositionalAudio, AudioLoader } from '../../libs/three137/three.module.js';
class SFX{
    constructor(camera){
        this.listener= new AudioListener();
        camera.add(this.listener);

        this.sounds = {};
    }

    load(name, loop=false, vol=1, obj=null){
        const sound = (obj==null) ? new Audio(this.listener):new PositionalAudio(this.listener);
        this.sounds[name] = sound;

        const audioLoader = new AudioLoader();
        audioLoader.load(`/assets/plane/${name}.mp3`,buffer=>{
            sound.setBuffer(buffer);
            sound.setLoop(loop);
            sound.setVolume(vol);
        })
    }

    setVolume(name, volume){
        const sound = this.sounds[name];

        if(sound!==undefined) sound.setVolume(volume);
    }

    setLoop(name, loop){
        const sound = this.sounds[name];

        if(sound!==undefined) sound.setLoop(volume);
    }

    play(name){
        const sound = this.sounds[name];

        if(sound!==undefined && !sound.isPlaying) sound.play();
    }

    stop(name){
        const sound = this.sounds[name];

        if(sound!==undefined && sound.isPlaying) sound.stop();
    }

    stopAll(){
        for(let name in this.sounds) this.stop(name);
    }

    pause(name){
        const sound = this.sounds[name];

        if(sound!==undefined && !sound.isPlaying) sound.pause();
    }
}
export { SFX };