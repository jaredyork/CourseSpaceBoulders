class SceneMain extends Phaser.Scene {
	constructor() {
		super({ key: "SceneMain" });
	}

	init(data) {
        this.passingData = data;
	}

	preload() {
        this.load.image("sprIconLife", "content/sprIconLife.png");
        this.load.image("sprPlayer", "content/sprPlayer.png");
        this.load.image("sprBullet", "content/sprBullet.png");
        this.load.image("sprSaucerSmall", "content/sprSaucerSmall.png");
        this.load.image("sprSaucerLarge", "content/sprSaucerLarge.png");
        
        for (var i = 0; i < 4; i++) {
            this.load.image("sprAsteroid" + i, "content/sprAsteroid" + i + ".png");
        }
        
        this.load.image("sprPixel", "content/sprPixel.png"); 
        
        this.load.audio("sndExplode", "content/sndExplode.wav");
        this.load.audio("sndLaserEnemy", "content/sndLaserEnemy.wav");
        this.load.audio("sndLaserPlayer", "content/sndLaserPlayer.wav");
	}
	
	create() {
        if (Object.getOwnPropertyNames(this.passingData).length == 0 &&
            this.passingData.constructor === Object) {
        
            this.passingData = {
                maxLives: 3,
                lives: 3,
                score: 0
            };
        }

        this.sfx = {
            explode: this.sound.add("sndExplode"),
            laserEnemy: this.sound.add("sndLaserEnemy"),
            laserPlayer: this.sound.add("sndLaserPlayer")
        };

        this.player = new Player(this, this.game.config.width * 0.5, this.game.config.height * 0.5);

        this.bullets = this.add.group();
        this.asteroids = this.add.group();
        this.saucers = this.add.group();
        this.iconLives = this.add.group();

        this.maxLives = 3;
        this.lives = this.maxLives;
        this.score = 0;
        this.textScore = this.add.text(
            32,
            32,
            this.score,
            {
                fontFamily: "monospace",
                fontSize: 32,
                align: "left"
            }
        );

        if (this.passingData.lives == 0) {
            this.textGameOver = this.add.text(
                this.game.config.width * 0.5,
                64,
                "GAME OVER",
                {
                    fontFamily: "monospace",
                    fontSize: 72,
                    align: "left"
                }
            );
            this.textGameOver.setOrigin(0.5);
        
            this.time.addEvent({
                delay: 3000,
                callback: function() {
                    this.scene.start("SceneMain", { });
                },
                callbackScope: this,
                loop: false
            });
        }
        
        this.createLivesIcons();

        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.SPACE);

        this.input.keyboard.on("keydown_SPACE", function() {
            if (this.player.active) {
                if (!this.player.getData("hasShot")) {
                    this.player.shoot();
                }
                this.player.setData("hasShot", true);
            }
        }, this);
        
        this.input.keyboard.on("keyup_SPACE", function() {
            if (this.player.active) {
                this.player.shoot();
            }
        }, this);

        this.time.addEvent({
            delay: 500,
            callback: function() {
                this.spawnAsteroid();
                
                if (Phaser.Math.Between(0, 100) > 75) {
                    this.spawnSaucer();
                }
            },
            callbackScope: this,
            loop: true
        });
        
        this.physics.add.collider(this.player, this.asteroids, function(player, asteroid) {
            this.createExplosion(player.x, player.y, asteroid.displayWidth);
        
            if (this.player) {
                this.onLifeDown();
        
                this.player.destroy();
            }
        }, null, this);
        
        this.physics.add.collider(this.player, this.saucers, function(player, saucer) {
            this.createExplosion(player.x, player.y, player.displayWidth);
        
            if (player) {
                this.onLifeDown();
        
                player.destroy();
            }
        }, null, this);

        this.physics.add.collider(this.player, this.bullets, function(player, bullet) {
            if (!bullet.getData("isFriendly")) {
            this.createExplosion(player.x, player.y, player.displayWidth);
        
            if (player) {
                this.onLifeDown();
        
                player.destroy();
            }
        }
        }, null, this);
        
        this.physics.add.overlap(this.bullets, this.asteroids, function(bullet, asteroid) {
            if (bullet.getData("isFriendly")) {
                this.createExplosion(bullet.x, bullet.y, asteroid.displayWidth);
                
                var oldAsteroidPos = new Phaser.Math.Vector2(asteroid.x, asteroid.y);
                var oldAsteroidKey = asteroid.texture.key;
                var oldAsteroidLevel = asteroid.getData("level");
                
                if (asteroid) {
                    asteroid.destroy();
                }
            
                // give points
                switch (oldAsteroidLevel) {
                    case 0: {
                        this.addScore(20);
                        break;
                    }
            
                    case 1: {
                        this.addScore(50);
                        break;
                    }
            
                    case 2: {
                        this.addScore(100);
                        break;	
                    }
                }
        
                if (oldAsteroidLevel < 2) {
                    for (var i = 0; i < 2; i++) {
                        var scale = 1;
                        var key = "";
                        if (oldAsteroidKey == "sprAsteroid0" || oldAsteroidKey == "sprAsteroid1") {
                            scale = 0.5;
                            key = "sprAsteroid" + Phaser.Math.Between(0, 1);
                        }
                        else if (oldAsteroidKey == "sprAsteroid2" || oldAsteroidKey == "sprAsteroid3") {
                            key = "sprAsteroid" + Phaser.Math.Between(0, 1);
                        }
        
                        var newAsteroid = new Asteroid(
                            this,
                            oldAsteroidPos.x,
                            oldAsteroidPos.y,
                            "sprAsteroid" + Phaser.Math.Between(0, 3)
                        );
                        newAsteroid.setScale(scale);
                        newAsteroid.setTexture(key);
                        newAsteroid.setData("level", oldAsteroidLevel + 1);
                        
                        newAsteroid.body.setVelocity(
                            Phaser.Math.Between(-200, 200),
                            Phaser.Math.Between(-200, 200)
                        );
                        this.asteroids.add(newAsteroid);
                    }
                }
            
                if (bullet) {
                    bullet.destroy();
                }
            }
        }, null, this);
        
        this.physics.add.overlap(this.bullets, this.saucers, function(bullet, saucer) {
            
            if (bullet.getData("isFriendly")) {
                this.createExplosion(bullet.x, bullet.y, saucer.displayWidth);
            
                if (saucer.texture.key == "sprSaucerSmall") {
                    this.addScore(1000);
                }
            
                if (saucer.texture.key == "sprSaucerLarge") {
                    this.addScore(200);
                }
            
                if (bullet) {
                    bullet.destroy();
                }
            
                if (saucer) {
                    saucer.onDestroy();
                    saucer.destroy();
                }
            }
        
        }, null, this);


        
	}

	createLivesIcons() {
        for (var i = 0; i < this.passingData.lives; i++) {
            var icon = this.add.sprite(
                this.textScore.x + (i * 16) + 12,
                this.textScore.y + 42,
                "sprIconLife"
            );
            icon.setOrigin(0.5);
            this.iconLives.add(icon);
        }
	}

	createExplosion(x, y, amount) {
        this.sfx.explode.play();

        var explosion = this.add.particles("sprPixel").createEmitter({
            x: x,
            y: y,
            speed: { min: -500, max: 500 },
            scale: { start: 1, end: 0 },
            blendMode: "SCREEN",
            lifespan: 600
        });
        
        for (var i = 0; i < amount; i++) {
            explosion.explode();
        }        
	}

	onLifeDown() {
        if (this.passingData.lives > 0) {
            this.passingData.lives--;
            
            this.time.addEvent({
                delay: 1000,
                callback: function() {
                    this.scene.start("SceneMain", this.passingData);
                },
                callbackScope: this,
                loop: false
            });
        }
        else {
            this.passingData.lives = 0;
        }        
	}

	getSpawnPosition() {

        var sides = ["top", "right", "bottom", "left"];
        var side = sides[Phaser.Math.Between(0, sides.length - 1)];
        
        var position = new Phaser.Math.Vector2(0, 0);
        switch (side) {
            case "top": {
                position = new Phaser.Math.Vector2(
                    Phaser.Math.Between(0, this.game.config.width),
                    -128
                );
                break;
            }
            
            case "right": {
                position = new Phaser.Math.Vector2(
                    this.game.config.width + 128,
                    Phaser.Math.Between(0, this.game.config.height)
                );
                
                break;
            }
            
            case "bottom": {
                position = new Phaser.Math.Vector2(
                    Phaser.Math.Between(0, this.game.config.width),
                    this.game.config.height + 128
                );
            }
            
            case "left": {
                position = new Phaser.Math.Vector2(
                    0,
                    Phaser.Math.Between(-120, this.game.config.height)
                );
            }
        }
        
        return position;        
	}

	spawnAsteroid() {
        var position = this.getSpawnPosition();

        var asteroid = new Asteroid(this, position.x, position.y, "sprAsteroid" + Phaser.Math.Between(0, 3));
        
        if (asteroid.texture.key == "sprAsteroid0" ||
            asteroid.texture.key == "sprAsteroid1") {
        
            asteroid.setData("level", 1);
        
        }
        
        this.asteroids.add(asteroid);        
	}

	spawnSaucer() {
        var position = this.getSpawnPosition();

        var imageKey = "";
        if (Phaser.Math.Between(0, 10) > 5) {
            imageKey = "sprSaucerLarge";
        }
        else {
            imageKey = "sprSaucerSmall";
        }
        
        var saucer = new Saucer(this, position.x, position.y, imageKey);
        this.saucers.add(saucer);        
	}

	addScore(amount) {
        this.score += amount;
        this.textScore.setText(this.score);        
	}

	update() {
        if (this.player.active) {
            this.player.update();
            
            if (this.keyA.isDown) {
                this.player.turnLeft();
            }
        
            if (this.keyD.isDown) {
                this.player.turnRight();
            }
        
            if (this.keyW.isDown) {
                this.player.moveForward();
                
                // engine particles
                var gas = this.add.particles("sprPixel").createEmitter({
                    x: this.player.x + Phaser.Math.Between(-2, 2),
                    y: this.player.y + Phaser.Math.Between(-2, 2),
                    speed: { min: -200, max: 200 },
                    scale: { start: 1, end: 0 },
                    angle: { min: this.player.angle +(180 - 5), max: this.player.angle + (180 + 5) },
                    blendMode: "SCREEN",
                    lifespan: { min: 60, max: 320 }
                });
                
                for (var i = 0; i < 5; i++) {
                    gas.explode();
                }
            }
        }
        
        for (var i = 0; i < this.bullets.getChildren().length; i++) {
            var bullet = this.bullets.getChildren()[i];
        
            if (Phaser.Math.Distance.Between(
                bullet.x,
                bullet.y,
                this.game.config.width * 0.5,
                this.game.config.height * 0.5
            ) > 500) {
                if (bullet) {
                    bullet.destroy();
                }
            }
        }

        for (var i = 0; i < this.asteroids.getChildren().length; i++) {
            var asteroid = this.asteroids.getChildren()[i];
        
            if (Phaser.Math.Distance.Between(
                asteroid.x,
                asteroid.y,
                this.game.config.width * 0.5,
                this.game.config.height * 0.5
            ) > 500) {
                if (asteroid) {
                    asteroid.destroy();
                }
            }
        }
        
        for (var i = 0; i < this.saucers.getChildren().length; i++) {
            var saucer = this.saucers.getChildren()[i];
        
            if (Phaser.Math.Distance.Between(
                saucer.x,
                saucer.y,
                this.game.config.width * 0.5,
                this.game.config.height * 0.5
            ) > 500) {
                if (saucer) {
                    saucer.onDestroy();
                    saucer.destroy();
                }
            }
        }
        

	}
}
