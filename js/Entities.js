class Entity extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y, key) {
		super(scene, x, y, key);
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this, 0);
	}
}

class Asteroid extends Entity {
	constructor(scene, x, y, key) {
        super(scene, x, y, key);

        this.body.setCircle(this.displayWidth * 0.5);
        
        this.body.setVelocity(
            Phaser.Math.Between(-100, 100),
            Phaser.Math.Between(-100, 100)
        );
        
        this.setData("level", 0);        
	}
}

class Saucer extends Entity {
	constructor(scene, x, y, key) {
        super(scene, x, y, key);

        this.body.setVelocity(
            Phaser.Math.Between(-100, 100),
            Phaser.Math.Between(-100, 100)
        );

        this.shootTimer = this.scene.time.addEvent({
            delay: 1000,
            callback: function() {
                if (this.scene !== undefined) {
                    if (key == "sprSaucerSmall") {
                        var dx = this.scene.player.x - this.x;
                        var dy = this.scene.player.y - this.y;
                        var angle = Math.atan2(dy, dx);

                        var bullet = new Bullet(this.scene, this.x, this.y, false);

                        bullet.setData("isFriendly", false);

                        bullet.body.setVelocity(
                            100 * Math.cos(angle),
                            100 * Math.sin(angle)
                        );
                        
                        this.scene.bullets.add(bullet);
                    }
                    else if (key == "sprSaucerLarge") {
                        var angle = Phaser.Math.Between(0, 360) * Math.PI / 180;

                        var bullet = new Bullet(this.scene, this.x, this.y, false);
                        bullet.setData("isFriendly", false);

                        bullet.body.setVelocity(
                            100 * Math.cos(angle),
                            100 * Math.sin(angle)
                        );

                        this.scene.bullets.add(bullet);
                    }
                }                
            },
            callbackScope: this,
            loop: true
        });
	}

	onDestroy() {
		if (this.shootTimer !== undefined) {
            if (this.shootTimer) {
                this.shootTimer.remove(false);
            }
        }        
	}
}

class Bullet extends Entity {
	constructor(scene, x, y, isFriendly) {
		super(scene, x, y, "sprBullet");
        this.setData("isFriendly", isFriendly);
	}
}

class Player extends Entity {
	constructor(scene, x, y) {
        super(scene, x, y, "sprPlayer");
        this.body.setCollideWorldBounds(true);
        this.setData("isMoving", false);        
	}

	turnLeft() {
        this.setAngle(Math.round(this.angle - 3));
	}

	turnRight() {
        this.setAngle(Math.round(this.angle + 3));
	}

	moveForward() {
        this.setData("isMoving", true);

        this.body.velocity.x += 2 * Math.cos(this.rotation);
        this.body.velocity.y += 2 * Math.sin(this.rotation);        
	}

	shoot() {
        this.scene.sfx.laserPlayer.play();

        var bullet = new Bullet(this.scene, this.x, this.y, true);
        bullet.setOrigin(0.5);
        bullet.setData("isFriendly", true);
        
        var speed = 1000;
        bullet.body.setVelocity(
            speed * Math.cos(this.rotation) + Phaser.Math.Between(-50, 50),
            speed * Math.sin(this.rotation) + Phaser.Math.Between(-50, 50)
        );
        this.scene.bullets.add(bullet);        
	}

	update() {
        if (!this.getData("isMoving")) {
            this.body.velocity.x *= 0.995;
            this.body.velocity.y *= 0.995;
        }
        this.setData("isMoving", false);        
	}
}
