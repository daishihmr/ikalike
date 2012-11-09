enchant();

Node.prototype.remove = function() {
    if (this.parentNode) {
        this.parentNode.removeChild(this);
    }
};

window.onload = function() {
    var game = new Game(480, 480);
    game.fps = 60;
    game.keybind("Z".charCodeAt(0), "a");
    game.keybind("X".charCodeAt(0), "b");
    game.preload("chara1.png", "barrier.png", "icon0.png", "enemy-bullet.png",
            "explosion.png", "pattern1.xml");
    game.on("load", function() {
        var barrier = (function() {
            var C = 64;
            var s = new Surface(C * 2, C * 1);
            var c = s.context;
            var cx, cy, r, g;

            cx = C * 0 + C / 2;
            cy = C / 2;
            r = 32;
            g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
            g.addColorStop(0.0, "rgba(100,100,255,0.0)");
            g.addColorStop(0.2, "rgba(100,100,255,0.0)");
            g.addColorStop(0.9, "rgba(255,255,255,0.5)");
            g.addColorStop(1.0, "rgba(255,255,255,0.0)");
            c.fillStyle = g;
            c.fillRect(C * 0, C * 0, C, C);

            cx = C * 1 + C / 2;
            cy = C / 2;
            r = 32;
            g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
            g.addColorStop(0.0, "rgba(  0,  0,  0,0.0)");
            g.addColorStop(0.2, "rgba(  0,  0,  0,0.0)");
            g.addColorStop(0.7, "rgba(180,  0,  0,0.4)");
            g.addColorStop(0.9, "rgba(180,180,  0,0.8)");
            g.addColorStop(1.0, "rgba(180,  0,  0,0.0)");
            c.fillStyle = g;
            c.fillRect(C * 1, C * 0, C, C);

            document.getElementById("img").src = s.toDataURL();
            return s;
        })();

        var scene = new CanvasGroup();
        game.rootScene.addChild(scene);
        scene.backgroundColor = "#003333";

        var explode = function(obj, size) {
            if (size === undefined) {
                size = 1;
            }
            var exp = new Sprite(32, 32);
            exp.scale(3 * size, 3 * size);
            exp.image = game.assets["explosion.png"];
            exp.frame = 0;
            exp.x = obj.x + (obj.width - exp.width) / 2;
            exp.y = obj.y + (obj.height - exp.height) / 2;
            scene.addChild(exp);
            exp.on("enterframe", function() {
                this.frame += 1;
                if (this.frame >= 64) {
                    this.remove();
                }
            });
        }

        var bulletPools = [];
        bulletPools[0] = [];
        bulletPools[1] = [];
        var bulletSpeed = 16;
        for ( var i = 0; i < 100; i++) {
            var w = new Sprite(16, 16);
            w.image = game.assets["icon0.png"];
            w.frame = 48;
            w.scale(1.5, 2);
            w.alphaBlending = "lighter";
            w.on("enterframe", function() {
                this.y -= bulletSpeed;
                if (this.y < -16) {
                    this.remove();
                }
            });
            bulletPools[0].pool(w);

            var b = new Sprite(16, 16);
            b.image = game.assets["icon0.png"];
            b.scale(1.5, 2);
            b.frame = 56;
            b.alphaBlending = "lighter";
            b.on("enterframe", function() {
                this.y -= bulletSpeed;
                if (this.y < -16) {
                    this.remove();
                }
            });
            bulletPools[1].pool(b);
        }

        var kuma = new Sprite(32, 32);
        kuma.image = game.assets["chara1.png"];
        kuma.speed = 3;
        kuma.mode = 0;
        kuma.frames = [ 5, 0 ];
        kuma.barrier = new Sprite(64, 64);
        kuma.barrier.alphaBlending = "lighter";
        kuma.barrier.image = game.assets["barrier.png"];
        kuma.barrier.image = barrier;
        kuma.mophing = false;
        kuma.heat = 0;
        kuma.muteki = false;
        kuma.mutekiEndFrame = 0;

        kuma.frame = kuma.frames[kuma.mode];
        kuma.barrier.frame = kuma.mode;

        kuma.on("enterframe", function() {
            if (this.muteki) {
                this.visible = !!(this.age % 2);
            }
            if (game.frame >= this.mutekiEndFrame) {
                this.muteki = false;
                this.visible = true;
            }

            if (game.input.up) {
                this.y -= this.speed;
            } else if (game.input.down) {
                this.y += this.speed;
            }
            if (game.input.left) {
                this.x -= this.speed;
            } else if (game.input.right) {
                this.x += this.speed;
            }
            this.x = Math.max(-this.width / 2, Math.min(game.width - this.width
                    / 2, this.x));
            this.y = Math.max(-this.height / 2, Math.min(game.height
                    - this.height / 2, this.y));
            this.barrier.x = this.x + (this.width - this.barrier.width) / 2;
            this.barrier.y = this.y + (this.height - this.barrier.height) / 2;

            if (game.input.a && this.heat <= 0) {
                var self = this;
                var shot = function(x) {
                    return function(bul) {
                        bul.x = self.x + (self.width - bul.width) / 2 + x;
                        bul.y = self.y + (self.height - bul.height) / 2 - 16;
                        scene.addChild(bul);
                    }
                };
                delete self;
                bulletPools[this.mode].get(shot(-5));
                bulletPools[this.mode].get(shot(5));
                this.heat = 2;
            }
            this.heat -= 1;
        });
        game.on("bbuttondown", function() {
            if (kuma.mophing) {
                return;
            }
            kuma.mophing = true;
            var m = ~~(!kuma.mode);
            kuma.tl.scaleTo(0, 1, 5).then(function() {
                this.frame = this.frames[m];
            }).scaleTo(1, 1, 5).then(function() {
                this.mophing = false;
                this.mode = m;
            });
            kuma.barrier.tl.scaleTo(0, 0, 8).then(function() {
                this.frame = m;
            }).scaleTo(1, 1, 8);
        });
        kuma.restart = function() {
            this.muteki = true;
            this.x = (game.width - this.width) / 2;
            this.y = game.height - this.height;
            this.mutekiEndFrame = game.frame + 120;

            scene.addChild(this);
            scene.addChild(this.barrier);
        };

        var enemies = [];
        var Enemy = Class.create(Sprite, {
            initialize : function(w, h, hp) {
                Sprite.call(this, w, h);
                this.hp = hp;
                enemies[enemies.length] = this;
            },
            damage : function(dmg) {
                this.hp -= dmg;
                if (this.hp <= 0) {
                    this.kill();
                    return true;
                }
                return false;
            },
            kill : function() {
                explode(this);
                this.remove();
                for ( var i = 0, end = enemies.length; i < end; i++) {
                    if (enemies[i] === this) {
                        delete enemies[i];
                    }
                }
            }
        });

        var enemyBulletPool = [];
        for ( var i = 0; i < 1000; i++) {
            var eb = new Sprite(16, 16);
            eb.scale(1.5, 1.5);
            enemyBulletPool.pool(eb);
        }
        var ebFactory = function(spec) {
            if (spec.label[0] == "w") {
                var eb = enemyBulletPool.get();
                if (eb) {
                    eb.image = game.assets["enemy-bullet.png"];
                    eb.frame = 0;
                    eb.type = 0;
                }
                return eb;
            } else if (spec.label[0] == "b") {
                var eb = enemyBulletPool.get();
                if (eb) {
                    eb.image = game.assets["enemy-bullet.png"];
                    eb.frame = 4;
                    eb.type = 1;
                }
                return eb;
            } else {
                var eb = new Enemy(16, 16, 30);
                eb.image = game.assets["icon0.png"];
                var f;
                if (f = spec.label.match(/[0-9]+/)) {
                    eb.frame = ~~(f[0]);
                } else {
                    eb.frame = 0;
                }
                eb.type = 2;
                return eb;
            }
        };

        var clearEnemyBullets = function() {
            for ( var i = 0, end = enemyBulletPool.length; i < end; i++) {
                var eb = enemyBulletPool[i];
                if (!eb.active) {
                    continue;
                }
                eb.removeDanmaku();
                eb.on("enterframe", function() {
                    this.frame += 0.2;
                    if (this.frame >= this.type * 4 + 4) {
                        this.frame = this.type * 4;
                        this
                                .removeEventListener("enterframe",
                                        arguments.callee);
                        this.remove();
                    }
                });
            }
        };

        AttackPattern.defaultConfig.target = kuma;
        AttackPattern.defaultConfig.bulletFactory = ebFactory;
        var teki = new Enemy(32, 32, 300);
        teki.x = (game.width - teki.width) / 2;
        teki.y = 64;
        teki.scale(3, 3);
        teki.image = game.assets["chara1.png"];
        teki.frame = 10;
        teki.setDanmaku(game.assets["pattern1.xml"]);
        teki.kill = function() {
            this.removeDanmaku();
            clearEnemyBullets();
            for ( var i = 0, end = enemies.length; i < end; i++) {
                var e = enemies[i];
                if (e && e.parentNode && e !== this) {
                    e.kill();
                }
            }
            this.hp = 300;
            explode(this, 3);
            this.tl.moveTo((game.width - this.width) / 2, 64, 10).then(
                    function() {
                        this.setDanmaku(game.assets["pattern1.xml"]);
                    });
        };
        scene.addChild(teki);

        game.on("enterframe", function() {
            for ( var i = 0, end = enemyBulletPool.length; i < end; i++) {
                var eb = enemyBulletPool[i];
                if (!eb.active || !eb.parentNode) {
                    continue;
                }
                var t = eb.type;
                if (kuma.mode == t && eb.within(kuma, 32)) {
                    eb.removeDanmaku();
                    eb.remove();
                    continue;
                } else if (eb.within(kuma, 8)) {
                    eb.remove();
                    miss();
                    continue;
                }
            }

            var bulHitTest = function(mode, e) {
                if (e.hp <= 0) {
                    return;
                }
                for ( var i = 0, end = bulletPools[mode].length; i < end; i++) {
                    var b = bulletPools[mode][i];
                    if (b.active && b.within(e, 16)) {
                        b.remove();
                        return e.damage(1);
                    }
                }
            };

            for ( var i = 0, end = enemies.length; i < end; i++) {
                var e = enemies[i];
                if (!e) {
                    continue;
                }
                if (e.within(kuma, 20)) {
                    e.remove();
                    miss();
                    continue;
                }
                if (bulHitTest(0, e)) {
                    continue;
                }
                if (bulHitTest(1, e)) {
                    continue;
                }
            }
        });

        var missing = false;
        var miss = function() {
            if (missing || kuma.muteki) {
                return;
            }
            clearEnemyBullets();
            missing = true;
            explode(kuma);
            kuma.remove();
            kuma.barrier.remove();
            scene.tl.delay(60).then(function() {
                kuma.restart();
                missing = false;
            });
        };

        kuma.restart();
    });
    game.start();
};

Array.prototype.pool = function(o) {
    o.active = false;
    o.on("removed", function() {
        this.removeDanmaku();
        this.active = false
    });
    this.push(o);
};
Array.prototype.get = function(f) {
    for ( var i = 0, end = this.length; i < end; i++) {
        var o = this[i];
        if (!o.active) {
            o.active = true;
            if (f) {
                f(o);
            }
            return o;
        }
    }
};
