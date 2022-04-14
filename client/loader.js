class Loading {

    constructor(options = {}) {
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.active = false;
        this.animationSpeed = options.animationSpeed || 1500;
        this.countSticks = options.countSticks || 9;
        this.minCountSticks = options.minCountSticks;
        this.widthStick = options.widthStick || 7;
        this.heightStick = options.heightStick || 20;
        this.spaceSticks = options.spaceSticks + this.widthStick || 2 + this.spaceSticks;
    }

    start() {
        if (this.active) return;
        this.active = true;

        this.mainbox = document.createElement("canvas");
        let block = this.block = document.createElement("div");
        block.id = "block";
        let cnv = this.cnv = this.mainbox.getContext("2d");
        this.mainbox.id = "loadingBox";
        this.mainbox.width = this.spaceSticks*this.countSticks;
        this.mainbox.height = this.heightStick;

        let tick = 0;

        this.interval = setInterval(() => {

            if (tick == this.countSticks) {
                cnv.clearRect(0, 0, this.spaceSticks*this.countSticks+this.widthStick, this.heightStick);
                tick = 0;
            }
            cnv.fillStyle = "#FFF";
            cnv.fillRect(this.x+this.spaceSticks*tick, this.y, this.widthStick, this.heightStick);
            tick++;

        }, this.animationSpeed);

        document.getElementById("main").appendChild(block);
        document.getElementById("main").appendChild(this.mainbox);
    }

    end() {
        if (!this.active) return;
        this.active = false;

        this.mainbox.remove();
        this.block.remove();
        clearInterval(this.interval);
    }

    isActive() {
        return this.active; 
    }
}