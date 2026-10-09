// Sivas 5-8 oyununun tüm kodu. Sayfanın içinde değil ayrı dosyada: sayfanın içerik güvenlik politikası (CSP)
// yalnızca bu siteden gelen betik dosyalarına izin verir; oyun ne kadar değişirse değişsin politika güncellenmez.
    (() => {
      const data = {
        1: ["Merkez", "42.000", 65, "+18", 24, "Müttefik"], 2: ["Zara", "18.500", 42, "+11", 9, "Tarafsız"], 3: ["Suşehri", "21.300", 72, "+8", 16, "Rakip"],
        4: ["Koyulhisar", "14.800", 38, "+9", 5, "Tarafsız"], 5: ["Akıncılar", "11.200", 35, "+7", 4, "Tarafsız"], 6: ["Gürün", "26.700", 58, "+14", 12, "Tarafsız"],
        7: ["Yıldızeli", "16.100", 44, "+10", 7, "Tarafsız"], 8: ["Hafik", "12.400", 39, "+8", 6, "Tarafsız"], 9: ["Şarkışla", "29.600", 76, "+13", 12, "Rakip"],
        10: ["Kangal", "19.700", 51, "+12", 8, "Tarafsız"], 11: ["Divriği", "23.900", 63, "+15", 10, "Tarafsız"], 12: ["Altınyayla", "10.600", 34, "+6", 3, "Tarafsız"],
        13: ["Ulaş", "13.500", 46, "+10", 12, "Müttefik"], 14: ["Gemerek", "15.300", 41, "+9", 5, "Tarafsız"], 15: ["Gölova", "9.800", 32, "+5", 2, "Tarafsız"],
        16: ["Çamlıbel", "8.900", 29, "+5", 2, "Tarafsız"], 17: ["Koyulhisar Ovası", "31.000", 61, "+16", 15, "Tarafsız"]
      };
      let selected = 1; let turn = 12; let honor = 74; let gold = 1240; let food = 2180;
      const unitAccents = ["#d6b762", "#a9c27e", "#c8795e", "#b879d1", "#78b8da", "#8d9fe0", "#79c3a0", "#8ec8bb", "#5fabbc"];
      const combatUnits = [
        { name: "Piyade subayı", domain: "kara", brigadeSize: 10, power: 4, defense: 18, speed: 3.8, strongAgainst: "mekanize", weakAgainst: "hava" },
        { name: "Piyade eri", domain: "kara", brigadeSize: 10, power: 1, defense: 12, speed: 4.2, strongAgainst: "hava", weakAgainst: "mekanize" },
        { name: "Tank", domain: "mekanize", brigadeSize: 15, power: 45, defense: 30, speed: 2.4, strongAgainst: "piyade", weakAgainst: "hava" },
        { name: "General", domain: "mekanize", brigadeSize: 1, power: 30, defense: 25, speed: 2.8, strongAgainst: "piyade", weakAgainst: "hava" },
        { name: "F-35", domain: "hava", brigadeSize: 20, power: 150, defense: 20, speed: 9.5, strongAgainst: "mekanize", weakAgainst: "hava" },
        { name: "KAAN", domain: "hava", brigadeSize: 20, power: 150, defense: 23, speed: 9.2, strongAgainst: "hava", weakAgainst: "hava" },
        { name: "Atak helikopteri", domain: "hava", brigadeSize: 12, power: 70, defense: 17, speed: 7.2, strongAgainst: "mekanize", weakAgainst: "kara" },
        { name: "İHA", domain: "hava", brigadeSize: 8, power: 35, defense: 10, speed: 8.1, strongAgainst: "piyade", weakAgainst: "hava" },
        { name: "Savaş gemisi", domain: "deniz", brigadeSize: 4, power: 95, defense: 34, speed: 3.1, strongAgainst: "kara", weakAgainst: "hava" }
      ];
      // Üstten görünüşle çizilen hava araçları yürüyüş yönüne döndürülür; diğerleri yalnızca sağa/sola bakar.
      const TOP_DOWN = new Set([4, 5, 7]);
      // Başlangıç ordusu: piyade başkentin kalesinde, diğerleri başkentte sahada üç ayrı birlik.
      const STARTING_GARRISON = { 0: 8, 1: 24 };
      const STARTING_FIELD = [{ 2: 5, 3: 2 }, { 4: 2, 5: 1, 6: 4, 7: 6 }, { 8: 2 }];
      // Kaledeki tugaylar savunmada sahadakinden etkilidir; sahadakiler yürütülebilir.
      const FIELD_DEFENSE = .35;
      const GARRISON_DEFENSE = .45;
      // Sefer masrafı: birlikler artık saldırıda harcanmıyor, kayıp verip dönüyor; bedelin %20'si yol masrafı.
      const CAMPAIGN_COST = .2;
      // Kuşatma kampı: düşmeyen kalenin önünde bekleyen birlik, her saldırıdan sonra bu kadar saniye toparlanır.
      const SIEGE_REGROUP = 10;
      const unitEntities = [];
      const garrisonUnits = {};
      const playerMarches = [];
      let stackSeq = 0;
      let marchSeq = 0;
      const defenseSystems = [
        { name: "Hava savunma", domain: "hava", fixed: 78, mobile: 45, cost: 420, buildSeconds: 18, icon: "✦" },
        { name: "Kara savunma", domain: "kara", fixed: 70, mobile: 42, cost: 360, buildSeconds: 15, icon: "♜" },
        { name: "Deniz savunma", domain: "deniz", fixed: 82, mobile: 48, cost: 520, buildSeconds: 22, icon: "⚓" }
      ];
      const regionDefenses = {};
      Object.keys(data).forEach(id => { regionDefenses[id] = defenseSystems.map(() => ({ fixed: 0, mobile: 0 })); garrisonUnits[id] = {}; });
      const mobileDefenseStock = [2, 2, 1];
      const coastalRegions = [5, 6, 11, 15];
      const unitCosts = [32, 10, 260, 180, 900, 900, 420, 210, 560];
      const unitProductionSeconds = combatUnits.map(unit => Math.max(18, Math.ceil(unit.power / 3) + unit.brigadeSize));
      const productionQueue = [];
      const regionArea = { 1: 100, 2: 72, 3: 88, 4: 70, 5: 94, 6: 110, 7: 76, 8: 60, 9: 105, 10: 98, 11: 120, 12: 82, 13: 65, 14: 84, 15: 102, 16: 90, 17: 140 };
      const regionCenters = {
        1: [145, 130], 2: [278, 105], 3: [365, 105], 4: [480, 112], 5: [630, 120], 6: [785, 165],
        7: [145, 250], 8: [290, 225], 9: [455, 225], 10: [635, 235], 11: [790, 285],
        12: [155, 350], 13: [315, 310], 14: [465, 315], 15: [635, 350], 16: [200, 475], 17: [475, 430]
      };
      // Haritadaki bölge sınırlarından çıkarılan komşuluklar (iki yönlü).
      const neighbors = {
        1: [2, 7], 2: [1, 3, 8], 3: [2, 4, 8, 9], 4: [3, 5, 9, 10], 5: [4, 6, 10], 6: [5, 10, 11],
        7: [1, 8, 12], 8: [2, 3, 7, 9, 12, 13], 9: [3, 4, 8, 10, 13, 14], 10: [4, 5, 6, 9, 11, 14, 15], 11: [6, 10, 15],
        12: [7, 8, 13, 16, 17], 13: [8, 9, 12, 14, 17], 14: [9, 10, 13, 15, 17], 15: [10, 11, 14, 17], 16: [12, 17], 17: [12, 13, 14, 15, 16]
      };
      // Zorluk yalnızca rakibi değiştirir; oyuncunun ekonomisi her seviyede aynı.
      // peaceMoves: oyuncuya saldırmadığı ilk hamleler. attackMargin: saldırmak için gereken güç fazlası
      // (düşük = daha cüretkâr). aggressionMoves: oyuncuyu tarafsız topraktan çok hedeflemesi için geçen hamle.
      // toughness: oyuncu saldırısında rakip garnizonunun dayanıklılığı (yüksek = fethetmek daha çok ateş gücü ister).
      // Rakip asker maliyeti oyuncunun garnizon fiyatından (10 altın) hep yüksek: savunmak ucuz, fethetmek pahalı.
      const DIFFICULTIES = {
        baslangic: { label: "Başlangıç", note: "Uzun barış, yavaş ve temkinli rakip. Oyunu öğrenmek için.", firstMoveSeconds: 45, moveSeconds: 18, peaceMoves: 16, incomeFactor: .3, soldierCost: 40, attackMargin: 1.6, aggressionMoves: 24, toughness: 1, startGarrison: [16, 12] },
        amator: { label: "Amatör", note: "Rahat başlangıç; rakip ancak açık verirseniz saldırır.", firstMoveSeconds: 40, moveSeconds: 15, peaceMoves: 10, incomeFactor: .45, soldierCost: 30, attackMargin: 1.35, aggressionMoves: 15, toughness: 1.3, startGarrison: [24, 18] },
        orta: { label: "Orta", note: "Dengeli: yaklaşık 2 dakika barış, sonra sınır baskısı.", firstMoveSeconds: 30, moveSeconds: 12, peaceMoves: 8, incomeFactor: .6, soldierCost: 25, attackMargin: 1.25, aggressionMoves: 10, toughness: 1.6, startGarrison: [32, 24] },
        zor: { label: "Zor", note: "Kısa barış; hızlı, kalabalık ve saldırgan rakip.", firstMoveSeconds: 25, moveSeconds: 10, peaceMoves: 5, incomeFactor: .75, soldierCost: 22, attackMargin: 1.15, aggressionMoves: 6, toughness: 2, startGarrison: [44, 32] },
        fatih: { label: "Fatih", note: "Neredeyse hiç barış yok; rakip her açığı kollar ve zor teslim olur.", firstMoveSeconds: 20, moveSeconds: 8, peaceMoves: 3, incomeFactor: .9, soldierCost: 20, attackMargin: 1.05, aggressionMoves: 3, toughness: 2.4, startGarrison: [56, 42] }
      };
      const RIVAL_BASE = { name: "Rakip Beylik", soldierPower: 3, keepHome: 3 };
      let difficulty = "orta";
      let RIVAL = { ...RIVAL_BASE, ...DIFFICULTIES[difficulty] };
      function setDifficulty(key) {
        difficulty = DIFFICULTIES[key] ? key : "orta";
        RIVAL = { ...RIVAL_BASE, ...DIFFICULTIES[difficulty] };
      }
      const SAVE_KEY = "sivas58-kayit-v1";
      const SAVE_VERSION = 1;
      const rival = { gold: 0, capital: null, nextMove: RIVAL.firstMoveSeconds, moves: 0, plan: "Rakip beylik sınırlarını gözlüyor." };
      const rivalMarches = [];
      let playerCapital = null;
      let gameOver = false;
      let elapsedSeconds = 0;
      let kingdomName = "";
      let selectedUnitId = null;
      // Seçili yürüyen ordu (yolda yön değiştirmek için); duran birlik seçimiyle aynı anda olmaz.
      let selectedMarchId = null;
      let selectedUnitIds = [];
      let attackTarget = null;
      let garrisonRegion = null;
      let mapZoom = 1;
      const panOffset = { x: 0, y: 0 };
      const activePointers = new Map();
      let panStart = null;
      let pinch = null;
      let didPan = false;
      let tap = null;
      let longPressTimer = null;
      let lastPointerType = "mouse";
      const $ = id => document.getElementById(id);
      const formatNumber = value => Math.round(value).toLocaleString("tr-TR");
      let toastTimer = null;
      const toast = message => {
        $("toast").textContent = message;
        $("toast").classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2400);
      };

      // ---- Ses: tüm sesler tarayıcıda Web Audio ile üretilir, dosya indirilmez. Tarayıcılar sesi ancak bir
      // dokunuş/tıklamadan sonra başlatır; ses bağlamı ilk etkileşimde açılır. Açık/kapalı tercihi bu cihazda saklanır.
      const sfx = {
        noise(ctx) {
          if (!ctx.sivasNoise) {
            const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
            const channel = buffer.getChannelData(0);
            for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1;
            ctx.sivasNoise = buffer;
          }
          const source = ctx.createBufferSource();
          source.buffer = ctx.sivasNoise;
          source.loop = true;
          return source;
        },
        envelope(ctx, out, t, peak, attack, decay) {
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(.0001, t);
          gain.gain.exponentialRampToValueAtTime(peak, t + attack);
          gain.gain.exponentialRampToValueAtTime(.0001, t + attack + decay);
          gain.connect(out);
          return gain;
        },
        // Nal: alçak, tok bir vuruş + toprakta kısa bir çıtırtı
        hoof(ctx, out, t, strength = 1) {
          const thump = ctx.createOscillator();
          thump.type = "sine";
          thump.frequency.setValueAtTime(150, t);
          thump.frequency.exponentialRampToValueAtTime(55, t + .08);
          thump.connect(sfx.envelope(ctx, out, t, .5 * strength, .004, .09));
          thump.start(t); thump.stop(t + .12);
          const grit = sfx.noise(ctx);
          const band = ctx.createBiquadFilter();
          band.type = "bandpass"; band.frequency.value = 1600 + Math.random() * 500; band.Q.value = 1.4;
          grit.connect(band); band.connect(sfx.envelope(ctx, out, t, .22 * strength, .002, .045));
          grit.start(t, Math.random() * .5); grit.stop(t + .06);
        },
        // Dörtnal: atın üç vuruşluk adımı
        gallop(ctx, out, t, strength = 1) {
          [0, .085, .17].forEach((offset, index) => sfx.hoof(ctx, out, t + offset + Math.random() * .012, strength * [.65, .85, 1][index]));
        },
        // Kılıç: uyumsuz yüksek kısmi tonlar (metal çınlaması) + keskin vuruş
        clash(ctx, out, t, strength = 1) {
          const detune = 1 + (Math.random() - .5) * .08;
          [1870, 2630, 3910, 5270, 6830].forEach((frequency, index) => {
            const ring = ctx.createOscillator();
            ring.type = index % 2 ? "triangle" : "sine";
            ring.frequency.value = frequency * detune;
            ring.connect(sfx.envelope(ctx, out, t, .09 * strength / (1 + index * .35), .002, .35 + Math.random() * .4));
            ring.start(t); ring.stop(t + .9);
          });
          const hit = sfx.noise(ctx);
          const high = ctx.createBiquadFilter();
          high.type = "highpass"; high.frequency.value = 2500;
          hit.connect(high); high.connect(sfx.envelope(ctx, out, t, .35 * strength, .001, .05));
          hit.start(t, Math.random() * .5); hit.stop(t + .08);
        },
        swords(ctx, out, t, count = 4, strength = 1) {
          for (let i = 0; i < count; i++) sfx.clash(ctx, out, t + i * .2 + Math.random() * .09, strength * (.7 + Math.random() * .3));
        },
        // Savaş narası: farklı perdelerden birçok "aaa"; testere dalgası ses tellerini, bant geçiren süzgeçler
        // ağız boşluğunu ("a" ünlüsünün formantları ~760 / ~1200 / ~2500 Hz) taklit eder.
        cry(ctx, out, t, voices = 7, strength = 1) {
          for (let i = 0; i < voices; i++) {
            const start = t + Math.random() * .18;
            const f0 = 120 + Math.random() * 110;
            const vocal = ctx.createOscillator();
            vocal.type = "sawtooth";
            vocal.frequency.setValueAtTime(f0 * .8, start);
            vocal.frequency.linearRampToValueAtTime(f0 * 1.18, start + .3);
            vocal.frequency.linearRampToValueAtTime(f0 * 1.05, start + .9);
            vocal.frequency.linearRampToValueAtTime(f0 * .78, start + 1.35);
            const vibrato = ctx.createOscillator();
            const depth = ctx.createGain();
            vibrato.frequency.value = 5 + Math.random() * 2; depth.gain.value = f0 * .02;
            vibrato.connect(depth); depth.connect(vocal.frequency);
            const voice = ctx.createGain();
            voice.gain.setValueAtTime(.0001, start);
            voice.gain.exponentialRampToValueAtTime(.05 * strength, start + .12);
            voice.gain.setValueAtTime(.05 * strength, start + 1);
            voice.gain.exponentialRampToValueAtTime(.0001, start + 1.45);
            voice.connect(out);
            [[760, 6, 1], [1200, 7, .6], [2500, 8, .25]].forEach(([frequency, q, level]) => {
              const formant = ctx.createBiquadFilter();
              formant.type = "bandpass"; formant.frequency.value = frequency * (.95 + Math.random() * .1); formant.Q.value = q;
              const amount = ctx.createGain(); amount.gain.value = level * 3;
              vocal.connect(formant); formant.connect(amount); amount.connect(voice);
            });
            vocal.start(start); vocal.stop(start + 1.5); vibrato.start(start); vibrato.stop(start + 1.5);
          }
          const breath = sfx.noise(ctx);
          const band = ctx.createBiquadFilter(); band.type = "bandpass"; band.frequency.value = 1000; band.Q.value = .8;
          breath.connect(band); band.connect(sfx.envelope(ctx, out, t, .05 * strength, .15, 1.1));
          breath.start(t); breath.stop(t + 1.4);
        }
      };
      const SOUND_KEY = "sivas58-ses";
      const sound = {
        ctx: null, out: null, marches: 0, timer: null,
        enabled: (() => { try { return localStorage.getItem(SOUND_KEY) !== "0"; } catch (error) { return true; } })(),
        context() {
          if (!this.enabled) return null;
          if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;
            this.ctx = new AudioCtx();
            // Üst üste binen sesler (birkaç ordu + çatışma) cızırdamasın diye sınırlayıcıdan geçer.
            const limiter = this.ctx.createDynamicsCompressor();
            this.out = this.ctx.createGain();
            this.out.gain.value = .7;
            this.out.connect(limiter); limiter.connect(this.ctx.destination);
          }
          if (this.ctx.state === "suspended") this.ctx.resume();
          return this.ctx;
        },
        play(name, ...args) {
          const ctx = this.context();
          if (!ctx || document.hidden) return;
          sfx[name](ctx, this.out, ctx.currentTime + .02, ...args);
        },
        // Yürüyen her ordu nal sesini açık tutar; sonuncusu varınca susar.
        marchStart() {
          this.marches++;
          if (this.timer) return;
          this.play("gallop", .8);
          this.timer = setInterval(() => this.play("gallop", Math.min(1.2, .7 + this.marches * .15)), 430);
        },
        marchEnd() {
          this.marches = Math.max(0, this.marches - 1);
          if (!this.marches && this.timer) { clearInterval(this.timer); this.timer = null; }
        },
        toggle() {
          this.enabled = !this.enabled;
          try { localStorage.setItem(SOUND_KEY, this.enabled ? "1" : "0"); } catch (error) { /* tercih bu oturumla sınırlı kalır */ }
          if (!this.enabled && this.ctx) this.ctx.suspend();
          else this.play("gallop", .8);
          renderSoundButton();
        }
      };
      function renderSoundButton() {
        $("sound-button").textContent = sound.enabled ? "🔊 Ses açık" : "🔇 Ses kapalı";
        $("sound-button").setAttribute("aria-pressed", String(sound.enabled));
      }

      // ---- Kaleler ve ordular ----
      const SVG_NS = "http://www.w3.org/2000/svg";
      // Her ilçenin kalesi: surlar ayaktayken saldırının garnizona ulaşan kısmı azalır. Azami sur = bölgenin savunma değeri.
      const walls = {};
      const maxWalls = id => data[id][2];
      Object.keys(data).forEach(id => { walls[id] = maxWalls(id); });
      // Sur yıkmada birlik türlerinin etkisi: tank/general kuşatma gücüdür, piyade surda zayıftır.
      const SIEGE = { mekanize: 1.6, deniz: 1.3, hava: .9, kara: .5 };
      const repairCost = id => Math.ceil((maxWalls(id) - walls[id]) * 4);
      const ridersFor = size => Math.max(4, Math.min(14, Math.round(size)));
      // Kale, bölge merkezinin üstünde durur; Kangal'da orası sınıra ve Akıncı köyü yazısına değdiği için içeri alınır.
      const castlePosition = { 10: [690, 214] };
      const castleAt = id => castlePosition[id] || [regionCenters[id][0], regionCenters[id][1] - 46];

      // ---- Tugay kümeleri: { türNo: adet } ----
      const unitTotal = units => Object.values(units).reduce((sum, count) => sum + count, 0);
      const unitsPower = units => Object.entries(units).reduce((sum, [type, count]) => sum + combatUnits[type].power * count, 0);
      function addUnits(target, units) {
        Object.entries(units).forEach(([type, count]) => { if (count > 0) target[type] = (target[type] || 0) + count; });
        return target;
      }
      // Türler, güçleri (güç x adet) büyükten küçüğe: birliğin "yüzü" en ağır türüdür.
      const typesByWeight = units => Object.keys(units).map(Number).filter(type => units[type] > 0)
        .sort((a, b) => combatUnits[b].power * units[b] - combatUnits[a].power * units[a]);
      const describeUnits = units => typesByWeight(units).map(type => `${units[type]} ${combatUnits[type].name}`).join(", ");
      const fieldStacksIn = regionId => unitEntities.filter(stack => stack.region === regionId);
      const fieldUnitsIn = regionId => fieldStacksIn(regionId).reduce((all, stack) => addUnits(all, stack.units), {});
      const fieldStock = type => unitEntities.filter(stack => isPlayer(stack.region)).reduce((sum, stack) => sum + (stack.units[type] || 0), 0);
      function stockOf(type) {
        return unitEntities.reduce((sum, stack) => sum + (stack.units[type] || 0), 0)
          + Object.values(garrisonUnits).reduce((sum, units) => sum + (units[type] || 0), 0)
          + playerMarches.reduce((sum, march) => sum + (march.units[type] || 0), 0);
      }
      // Kalenin çevresindeki aday noktalar (yakından uzağa); birlik halkası (yarıçap 16) tümüyle bölgenin içinde
      // kalanlar, kaleye ve birbirine değmeyecek şekilde seçilir. Bölgelerin şekli farklı olduğu için sabit yuva olmaz.
      const campSlotCache = {};
      function campSlots(regionId) {
        if (campSlotCache[regionId]) return campSlotCache[regionId];
        const [cx, cy] = castleAt(regionId);
        const shape = document.querySelector(`.region[data-region="${regionId}"]`);
        const point = $("map-svg").createSVGPoint();
        const inside = (x, y) => [[0, 0], [17, 0], [-17, 0], [0, 17], [0, -17]].every(([dx, dy]) => {
          point.x = x + dx; point.y = y + dy;
          return shape.isPointInFill(point);
        });
        // Haritadaki yazılar (bölge adı/numarası, köyler) ve krallık adının yeri (bölge merkezinin 16 üstü) örtülmesin.
        const [rx, ry] = regionCenters[regionId];
        const boxes = [...$("map-svg").querySelectorAll(".region-label, .region-number, .settlement-label, .bridge-city-label")].map(text => text.getBBox())
          .concat([{ x: rx - 52, y: ry - 26, width: 104, height: 14 }]);
        const clear = (x, y) => boxes.every(box => x + 17 < box.x || x - 17 > box.x + box.width || y + 17 < box.y || y - 17 > box.y + box.height);
        const candidates = [];
        for (let dy = -36; dy <= 108; dy += 9) for (let dx = -108; dx <= 108; dx += 9) {
          if (Math.abs(dx) < 34 && dy > -40 && dy < 30) continue; // kalenin kendisi
          candidates.push([cx + dx, cy + dy, Math.hypot(dx, dy * 1.3)]);
        }
        candidates.sort((a, b) => a[2] - b[2]);
        // Önce yazıya değmeyen yuvalar; küçük bölgede yetmezse yazının üstüne de konur (bölgenin dışına asla).
        const slots = [];
        [true, false].forEach(strict => candidates.forEach(([x, y]) => {
          if (slots.length < 6 && inside(x, y) && (!strict || clear(x, y)) && slots.every(([sx, sy]) => Math.hypot(sx - x, sy - y) >= 36)) slots.push([x, y]);
        }));
        return (campSlotCache[regionId] = slots);
      }
      function layoutRegion(regionId) {
        const [x, y] = regionCenters[regionId];
        // Kuşatma kampları kalenin çevresinde, bölgenin içinde kalan en yakın yuvalarda.
        if (isRival(regionId)) {
          const slots = campSlots(regionId);
          // Yuvalar biterse sonraki kamplar aynı yuvalara hafif kaydırılarak dizilir.
          fieldStacksIn(regionId).forEach((stack, index) => {
            const [sx, sy] = slots.length ? slots[index % slots.length] : [x, y + 54];
            const shift = slots.length ? Math.floor(index / slots.length) * 7 : index * 7;
            [stack.x, stack.y] = [sx + shift, sy + shift];
          });
          return;
        }
        fieldStacksIn(regionId).forEach((stack, index) => {
          stack.x = x + (index % 3 - 1) * 34;
          stack.y = y + 54 + Math.floor(index / 3) * 34;
        });
      }
      // merge: bölgede duran ilk birliğe katıl (varış, kaleden çıkış); değilse yeni nesne (üretim).
      function addFieldStack(regionId, units, merge) {
        if (!unitTotal(units)) return null;
        let stack = merge ? fieldStacksIn(regionId)[0] : null;
        if (stack) addUnits(stack.units, units);
        else {
          stack = { id: `stack-${Date.now().toString(36)}-${stackSeq++}`, region: regionId, units: addUnits({}, units) };
          unitEntities.push(stack);
        }
        layoutRegion(regionId);
        return stack;
      }
      // Birliklerden istenen kadar tugay çeker; boşalan birlikler haritadan kalkar.
      function takeFromStacks(stacks, request) {
        const taken = {};
        Object.entries(request).forEach(([type, wanted]) => {
          let need = wanted;
          stacks.forEach(stack => {
            const take = Math.min(need, stack.units[type] || 0);
            if (!take) return;
            stack.units[type] -= take;
            if (!stack.units[type]) delete stack.units[type];
            taken[type] = (taken[type] || 0) + take;
            need -= take;
          });
        });
        const emptied = new Set(stacks.filter(stack => !unitTotal(stack.units)).map(stack => stack.region));
        for (let i = unitEntities.length - 1; i >= 0; i--) if (!unitTotal(unitEntities[i].units)) unitEntities.splice(i, 1);
        emptied.forEach(layoutRegion);
        selectedUnitIds = selectedUnitIds.filter(id => unitEntities.some(stack => stack.id === id));
        return taken;
      }
      const regionDistance = (a, b) => Math.hypot(regionCenters[a][0] - regionCenters[b][0], regionCenters[a][1] - regionCenters[b][1]);
      function nearestPlayerRegion(fromId) {
        return regionsOf("Müttefik").sort((a, b) => regionDistance(a, fromId) - regionDistance(b, fromId))[0] || null;
      }
      // Rakip toprağında duran birlik kuşatma kampıdır (başarısız saldırıdan sağ kalanlar).
      const isCamp = stack => isRival(stack.region);
      const regroupLeft = stack => Math.max(0, (stack.readyAt || 0) - elapsedSeconds);
      const campaignCost = units => Math.round(Object.entries(units).reduce((sum, [type, count]) => sum + unitCosts[type] * count, 0) * CAMPAIGN_COST);

      // ---- Çizim: kaleler, birlikler, yürüyen ordular ----
      function renderCastles() {
        const layer = $("castle-layer");
        layer.replaceChildren();
        Object.keys(data).forEach(id => {
          const [x, y] = castleAt(id);
          const ratio = Math.max(0, Math.min(1, walls[id] / maxWalls(id)));
          const side = isPlayer(id) ? "ally" : isRival(id) ? "rival" : "neutral";
          const castle = document.createElementNS(SVG_NS, "g");
          castle.setAttribute("class", `castle side-${side}${ratio < .4 ? " breached" : ""}`);
          castle.setAttribute("transform", `translate(${x} ${y})`);
          const garrisoned = garrisonUnits[id];
          const brigades = unitTotal(garrisoned);
          // Kaledeki tugaylar kalenin solunda: en ağır türün simgesi + toplam tugay sayısı.
          const badge = brigades ? `<g class="garrison-badge" transform="translate(-25 1)"><rect x="-10" y="-9" width="20" height="18" rx="4"/><use href="#u-${typesByWeight(garrisoned)[0]}" class="sil-badge" transform="scale(.5)"/><text y="19">${brigades}</text></g>` : "";
          castle.innerHTML = `<path class="castle-body" d="M-11 8V-6h2v2h2v-2h2V-1h2v-2h2v2h2v-2h2v2h2v-2h2v2h2V-6h2v2h2v-2h2V8Z"/>`
            + `<path class="castle-gate" d="M-2.5 8V4.5a2.5 2.5 0 0 1 5 0V8Z"/>`
            + (ratio < .4 ? `<path class="castle-crack" d="M-8 -2l2 3-1 3M7 0l-2 3 1 3"/>` : "")
            + `<path class="flag-pole" d="M9 -6V-19"/><path class="flag-cloth" d="M9 -19q4 -1.6 8 0v5.5q-4 -1.6 -8 0Z"/><circle class="flag-emblem" cx="13" cy="-16.3" r="1.3"/>`
            + `<rect class="wall-bar-bg" x="-11" y="10" width="22" height="3"/><rect class="wall-bar" x="-11" y="10" width="${(22 * ratio).toFixed(1)}" height="3"/>`
            + badge;
          layer.appendChild(castle);
        });
      }
      // Rakibin ordusu: önde sancaklı büyük komutan, arkasında iki sıra hâlinde dörtnala giden süvari.
      function drawColumn(layer, { x, y, dx, dy, riders, side, label }) {
        const group = document.createElementNS(SVG_NS, "g");
        group.setAttribute("class", `march-column side-${side}`);
        const length = Math.hypot(dx, dy) || 1;
        const ux = dx / length, uy = dy / length;
        const face = ux < 0 ? -1 : 1;
        const now = performance.now();
        let markup = "";
        for (let i = riders; i >= 1; i--) {
          const row = Math.ceil(i / 2), lane = i % 2 ? -1 : 1;
          const px = x - ux * (16 + row * 10) - uy * lane * 7;
          const py = y - uy * (16 + row * 10) + ux * lane * 7 + Math.sin(now / 85 + i * 1.7) * 1.3;
          markup += `<use href="#sym-rider" class="rider" transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${.62 * face} .62)"/>`;
        }
        markup += `<use href="#sym-commander" class="commander" transform="translate(${x.toFixed(1)} ${(y + Math.sin(now / 95) * 1.6).toFixed(1)}) scale(${face} 1)"/>`;
        if (label) markup += `<text class="march-label" x="${x.toFixed(1)}" y="${(y - 36).toFixed(1)}">${label}</text>`;
        group.innerHTML = markup;
        layer.appendChild(group);
      }
      // Oyuncunun ordusu: her tugay kendi türünün görseliyle (tank, jet, helikopter, gemi, piyade...).
      // General varsa önde sancaklı atlı general; yoksa en ağır tür sancak taşır.
      function drawForce(layer, { id, x, y, tx, ty, heading, units, label }) {
        const group = document.createElementNS(SVG_NS, "g");
        group.setAttribute("class", "march-column side-ally");
        group.dataset.march = id;
        const [dx, dy] = heading;
        const length = Math.hypot(dx, dy) || 1;
        const ux = dx / length, uy = dy / length;
        const face = ux < 0 ? -1 : 1;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const now = performance.now();
        const total = unitTotal(units);
        const types = typesByWeight(units);
        // En fazla 14 figür; kalabalık ordularda türler oranlı temsil edilir, her tür en az bir figür.
        const figures = [];
        types.forEach(type => { const n = Math.max(1, Math.round(units[type] / total * Math.min(14, total))); for (let i = 0; i < n; i++) figures.push(type); });
        const leader = units[3] ? 3 : types[0];
        figures.splice(figures.indexOf(leader), 1);
        const figure = (type, px, py, scale) => TOP_DOWN.has(type)
          ? `<use href="#u-${type}" class="sil-march" transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${angle.toFixed(0)}) scale(${scale})"/>`
          : `<use href="#u-${type}" class="sil-march" transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${(scale * face).toFixed(2)} ${scale})"/>`;
        const tail = 18 + Math.ceil(figures.length / 2) * 13;
        const line = (ax, ay, bx, by) => `M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`;
        let markup = "";
        // Seçiliyse: hedefe kesik çizgi ve komutanın çevresinde halka.
        if (id === selectedMarchId) markup += `<path class="march-route" d="${line(x, y, tx, ty)}"/><circle class="march-ring" cx="${x.toFixed(1)}" cy="${(y - 6).toFixed(1)}" r="24"/>`;
        for (let i = figures.length; i >= 1; i--) {
          const type = figures[i - 1];
          const row = Math.ceil(i / 2), lane = i % 2 ? -1 : 1;
          const bob = combatUnits[type].domain === "hava" ? Math.sin(now / 260 + i) * 1.8 : Math.sin(now / 85 + i * 1.7) * 1.1;
          markup += figure(type, x - ux * (18 + row * 13) - uy * lane * 9, y - uy * (18 + row * 13) + ux * lane * 9 + bob, .8);
        }
        if (leader === 3) {
          markup += `<use href="#sym-commander" class="commander" transform="translate(${x.toFixed(1)} ${(y + Math.sin(now / 95) * 1.6).toFixed(1)}) scale(${face} 1)"/>`;
        } else {
          markup += figure(leader, x, y, 1.15);
          markup += `<path class="flag-pole" d="M${(x - 4).toFixed(1)} ${(y - 8).toFixed(1)}V${(y - 30).toFixed(1)}"/><path class="flag-cloth" d="M${(x - 4).toFixed(1)} ${(y - 30).toFixed(1)}q6 -2.4 12 0v8q-6 -2.4 -12 0Z"/><circle class="flag-emblem" cx="${(x + 2).toFixed(1)}" cy="${(y - 26).toFixed(1)}" r="1.8"/>`;
        }
        if (label) markup += `<text class="march-label" x="${x.toFixed(1)}" y="${(y - 36).toFixed(1)}">${label}</text>`;
        markup += `<path class="march-hit" stroke-width="40" d="${line(x, y - 6, x - ux * tail, y - 6 - uy * tail)}"/>`;
        group.innerHTML = markup;
        layer.appendChild(group);
      }
      // Yalnızca yürüyen ordular her karede yeniden çizilir; duran birlikler ayrı katmanda kalır.
      // (Eski hata: tüm birlik katmanı her karede silinip çiziliyordu; basıp bırakma arasında altındaki
      // öğe değiştiği için tıklama düşüyor, yürüyüş sırasında başka birlik seçilemiyordu.)
      function renderMarches() {
        const layer = $("march-layer");
        layer.replaceChildren();
        playerMarches.forEach(march => drawForce(layer, march));
        rivalMarches.forEach(march => drawColumn(layer, { x: march.x, y: march.y, dx: march.heading[0], dy: march.heading[1], riders: ridersFor(march.soldiers / 3), side: "rival", label: String(march.soldiers) }));
      }
      function renderUnitEntities() {
        const layer = $("unit-entities");
        layer.replaceChildren();
        unitEntities.forEach(stack => {
          const main = typesByWeight(stack.units)[0];
          const kinds = typesByWeight(stack.units).length;
          const domain = combatUnits[main].domain;
          const group = document.createElementNS(SVG_NS, "g");
          const camp = isCamp(stack);
          const wait = regroupLeft(stack);
          group.setAttribute("class", `unit-entity side-ally ${selectedUnitIds.includes(stack.id) ? "selected " : ""}${camp ? "camp " : ""}${domain === "hava" ? "air" : domain === "deniz" ? "sea" : "land"}`);
          group.dataset.unitEntity = stack.id;
          group.setAttribute("transform", `translate(${stack.x} ${stack.y})`);
          // Kuşatma kampı: birliğin solunda çadır, kesik kırmızı halka; toparlanırken kalan saniye.
          group.innerHTML = (camp ? `<path class="camp-tent" d="M-31 9l8-13 8 13ZM-23 -4v13"/>` : "")
            + `<path class="flag-pole" d="M13 -9V-24"/><path class="flag-cloth" d="M13 -24q4.5 -1.8 9 0v6q-4.5 -1.8 -9 0Z"/><circle r="16"/>`
            + `<use href="#u-${main}" class="sil-badge" transform="scale(.75)"/><text y="27">x${unitTotal(stack.units)}${kinds > 1 ? "+" : ""}${camp && wait ? ` · ${wait} sn` : ""}</text>`;
          layer.appendChild(group);
        });
        Object.entries(regionDefenses).forEach(([regionId, systems]) => {
          const [x, y] = regionCenters[regionId];
          systems.forEach((defense, index) => {
            if (!defense.fixed && !defense.mobile) return;
            const marker = document.createElementNS(SVG_NS, "path");
            marker.setAttribute("class", "defense-entity");
            marker.setAttribute("d", "M0 -9 L8 7 L0 3 L-8 7Z");
            marker.setAttribute("transform", `translate(${x + 24 + index * 11} ${y - 44}) scale(.7)`);
            layer.appendChild(marker);
          });
        });
      }

      // ---- Durum yardımcıları ----
      const isPlayer = id => data[id][5] === "Müttefik";
      const isRival = id => data[id][5] === "Rakip";
      const regionsOf = status => Object.keys(data).map(Number).filter(id => data[id][5] === status);
      const productionOf = id => Number(data[id][3].replace("+", ""));
      const hasFieldUnits = () => unitEntities.some(stack => isPlayer(stack.region));
      const mobileCost = system => Math.round(system.cost * .65);
      function canPlayerClaim(regionId) {
        return data[regionId][5] === "Tarafsız" && neighbors[regionId].some(isPlayer);
      }
      function getDefenseProfile(regionId) {
        const installed = regionDefenses[regionId];
        const scores = defenseSystems.map((system, index) => ({
          domain: system.domain,
          score: installed[index].fixed * system.fixed + installed[index].mobile * system.mobile
        }));
        const strongest = scores.reduce((best, current) => current.score > best.score ? current : best, scores[0]);
        return { total: scores.reduce((sum, item) => sum + item.score, 0), domain: strongest.score ? strongest.domain : "kara" };
      }
      // Rakip seferine karşı bölgenin direnci, rakip asker gücüyle aynı birimde. Bir rakip askeri ~8 oyuncu
      // gücüne denk (oyuncu saldırısında 8 hasar = 1 asker); sahadaki tugaylar .35, kaledekiler .45 ile sayılır.
      function regionDefenseValue(regionId) {
        const region = data[regionId];
        return region[4] * RIVAL.soldierPower + walls[regionId] * 1.2 + getDefenseProfile(regionId).total * .3
          + unitsPower(fieldUnitsIn(regionId)) * FIELD_DEFENSE + unitsPower(garrisonUnits[regionId]) * GARRISON_DEFENSE;
      }
      function totalPower() {
        return combatUnits.reduce((sum, unit, index) => sum + unit.power * stockOf(index), 0);
      }
      function incomeRates() {
        const owned = regionsOf("Müttefik");
        return {
          gold: owned.reduce((sum, id) => sum + productionOf(id), 0),
          food: Math.max(1, Math.round(owned.reduce((sum, id) => sum + regionArea[id], 0) * .12))
        };
      }
      function collectProduction() {
        const rates = incomeRates();
        gold += rates.gold;
        food += rates.food;
      }

      // ---- Üretim ve savunma ----
      function queueUnit(index) {
        if (gameOver || !isPlayer(selected) || gold < unitCosts[index]) return;
        gold -= unitCosts[index];
        const durationMs = unitProductionSeconds[index] * 1000;
        productionQueue.push({ kind: "unit", index, region: selected, readyAt: Date.now() + durationMs, durationMs, label: `${combatUnits[index].name} tugayı` });
        toast(`${combatUnits[index].name} tugayı üretime alındı.`);
        render();
      }
      function buildDefense(index, fixed) {
        const system = defenseSystems[index];
        const cost = fixed ? system.cost : mobileCost(system);
        if (gameOver || !isPlayer(selected) || gold < cost || (!fixed && mobileDefenseStock[index] < 1)) return;
        gold -= cost;
        if (!fixed) mobileDefenseStock[index]--;
        const durationMs = system.buildSeconds * 1000;
        productionQueue.push({ kind: "defense", index, fixed, region: selected, readyAt: Date.now() + durationMs, durationMs, label: `${system.name} ${fixed ? "sabit bina" : "mobil birlik"}` });
        toast(`${system.name} ${fixed ? "sabit bina" : "mobil birlik"} yapıma alındı.`);
        render();
      }
      function processProductionQueue() {
        const now = Date.now();
        let changed = false;
        for (let i = productionQueue.length - 1; i >= 0; i--) {
          const job = productionQueue[i];
          if (job.readyAt > now) continue;
          if (job.kind === "unit") {
            // Üretilen tugay şehirde haritaya ayrı bir nesne olarak çıkar.
            addFieldStack(job.region, { [job.index]: 1 }, false);
            addBattleEffect(job.region, "defense");
          } else if (job.kind === "defense") {
            regionDefenses[job.region][job.index][job.fixed ? "fixed" : "mobile"]++;
            addBattleEffect(job.region, "defense");
          }
          productionQueue.splice(i, 1);
          changed = true;
          toast(`${job.label} ${data[job.region][0]} bölgesinde hazır.`);
        }
        if (changed) { turn++; render(); }
      }

      // ---- Arayüz ----
      function renderRegionPanel() {
        const r = data[selected];
        const status = r[5];
        const owned = status === "Müttefik";
        $("region-name").textContent = r[0];
        $("region-status").textContent = owned ? "Senin" : status === "Rakip" ? "Rakip" : "Tarafsız";
        $("region-status").style.background = status === "Rakip" ? "var(--red)" : owned ? "var(--green)" : "var(--gold)";
        $("population").textContent = r[1]; $("walls").textContent = `${Math.round(walls[selected])}/${maxWalls(selected)}`; $("production").textContent = r[3]; $("garrison").textContent = r[4];
        $("garrison-button").hidden = !owned;
        $("repair-button").hidden = !owned;
        $("claim-button").hidden = status !== "Tarafsız";
        $("attack-open-button").hidden = owned;
        $("attack-open-button").textContent = status === "Rakip" ? "Saldır" : "Birliklerle al";
        $("scout-button").hidden = status !== "Rakip";
        const kept = garrisonUnits[selected];
        const field = fieldUnitsIn(selected);
        $("region-units").textContent = owned
          ? `Kalede: ${r[4]} asker${unitTotal(kept) ? ` · ${describeUnits(kept)}` : ""}. Sahada: ${unitTotal(field) ? describeUnits(field) : "birlik yok"}.`
          : `Garnizon: ${r[4]} asker.${unitTotal(field) ? ` Önünde kuşatma kampınız: ${describeUnits(field)}.` : ""}`;
        $("region-note").textContent = owned
          ? `${selected === playerCapital ? "Başkentiniz. " : ""}Garnizonu yönetmek için şehre sağ tıklayın (telefonda basılı tutun) ya da düğmeyi kullanın.`
          : status === "Tarafsız"
            ? (canPlayerClaim(selected) ? "Sınırınıza komşu: 100 altınla sahiplenebilir ya da birlik yürütüp alabilirsiniz." : "Sahiplenmek için sınırınıza komşu olmalı. Birlik yürüterek her yerden alınabilir.")
            : `${RIVAL.name} toprağı. Birliğinizi seçip bu şehre dokunun ya da Saldır'ı kullanın. Önce surlar yıkılmalı (tank ve general en etkili).`;
      }
      function renderProductionList() {
        $("production-note").textContent = isPlayer(selected) ? `Üretim yeri: ${data[selected][0]}. Hazır olan tugay haritada belirir.` : "Üretim için kendi bölgenizi seçin.";
        $("unit-list").innerHTML = combatUnits.map((unit, index) =>
          `<div class="unit-row" style="--unit-accent:${unitAccents[index]}"><span class="unit-icon" aria-hidden="true"><svg viewBox="-17 -17 34 34"><use href="#u-${index}" class="sil-row"/></svg></span><div class="unit-main"><strong>${unit.name}</strong><small>Toplam ${stockOf(index)} · Güç ${unit.power} · ${unitProductionSeconds[index]} sn</small></div><button type="button" data-unit="${index}" aria-label="${unit.name} tugayı üret, ${unitCosts[index]} altın">+ ${unitCosts[index]} ◈</button></div>`
        ).join("");
      }
      function renderProductionQueue() {
        const now = Date.now();
        $("production-queue").innerHTML = productionQueue.map(job => {
          const total = job.durationMs || (job.buildSeconds || 1) * 1000;
          const remaining = Math.max(0, job.readyAt - now);
          const done = Math.min(100, Math.max(0, (1 - remaining / total) * 100));
          return `<div class="queue-row"><span>⚙ ${job.label} · ${data[job.region][0]}</span><span>${Math.ceil(remaining / 1000)} sn</span><div class="bar"><span style="width:${done}%"></span></div></div>`;
        }).join("");
      }
      function renderDefenses() {
        const owned = isPlayer(selected);
        $("defense-panel").hidden = !owned;
        if (!owned) return;
        $("defense-note").textContent = `${data[selected][0]} · toplam savunma gücü ${getDefenseProfile(selected).total}`;
        $("defense-list").innerHTML = defenseSystems.map((system, index) => {
          const installed = regionDefenses[selected][index];
          const pending = productionQueue.filter(job => job.kind === "defense" && job.region === selected && job.index === index).length;
          return `<div class="defense-row"><div><strong>${system.icon} ${system.name}</strong><small>Sabit ${installed.fixed} · Mobil ${installed.mobile}${pending ? ` · ${pending} yapımda` : ""} · ${system.buildSeconds} sn</small></div><button type="button" data-defense-fixed="${index}">Sabit · ${system.cost} ◈</button><button type="button" data-defense-mobile="${index}">Mobil · ${mobileCost(system)} ◈ (${mobileDefenseStock[index]})</button></div>`;
        }).join("");
      }
      // Düğmeleri yeniden çizmeden yalnızca etkin/edilgin hâllerini günceller: her saniye çağrılır ve
      // dokunmatikte basılı düğmenin altından eleman değişip dokunuşun kaybolmasını önler.
      function refreshAffordability() {
        const owned = isPlayer(selected);
        document.querySelectorAll("[data-unit]").forEach(button => { button.disabled = gameOver || !owned || gold < unitCosts[button.dataset.unit]; });
        document.querySelectorAll("[data-defense-fixed]").forEach(button => { button.disabled = gameOver || !owned || gold < defenseSystems[button.dataset.defenseFixed].cost; });
        document.querySelectorAll("[data-defense-mobile]").forEach(button => {
          const index = Number(button.dataset.defenseMobile);
          button.disabled = gameOver || !owned || mobileDefenseStock[index] < 1 || gold < mobileCost(defenseSystems[index]);
        });
        $("claim-button").disabled = gameOver || !canPlayerClaim(selected) || gold < 100;
        $("attack-open-button").disabled = gameOver || !hasFieldUnits();
        $("scout-button").disabled = gameOver;
        $("garrison-button").disabled = gameOver;
        const repair = repairCost(selected);
        $("repair-button").disabled = gameOver || !repair || gold < repair;
        $("repair-button").textContent = repair ? `Surları onar · ${formatNumber(repair)} ◈` : "Surlar sağlam";
        $("walls").textContent = `${Math.round(walls[selected])}/${maxWalls(selected)}`;
        document.querySelectorAll("[data-recruit]").forEach(button => { button.disabled = gameOver || gold < 50; });
        if (!$("map-actions").hidden) updateAttackSummary();
      }
      function updateResourceStrip() {
        const owned = regionsOf("Müttefik");
        const rates = incomeRates();
        $("total-population").textContent = formatNumber(owned.reduce((sum, id) => sum + Number(data[id][1].replace(/\./g, "")), 0));
        $("total-gold").textContent = formatNumber(gold);
        $("gold-rate").textContent = `+${rates.gold}/sn`;
        $("total-food").textContent = formatNumber(food);
        $("food-rate").textContent = `+${rates.food}/sn`;
        $("total-power").textContent = formatNumber(totalPower());
        $("total-territory").textContent = owned.length;
        $("turn").textContent = turn;
        $("honor").textContent = honor;
        $("difficulty-label").textContent = DIFFICULTIES[difficulty].label;
      }
      function renderKingdomLabels() {
        const labels = $("kingdom-labels");
        labels.replaceChildren();
        if (!kingdomName) return;
        Object.entries(data).forEach(([id, region]) => {
          if (region[5] === "Tarafsız") return;
          const [x, y] = regionCenters[id];
          const label = document.createElementNS(SVG_NS, "text");
          label.setAttribute("class", region[5] === "Rakip" ? "kingdom-label rival" : "kingdom-label");
          label.setAttribute("x", x);
          label.setAttribute("y", y - 16);
          label.textContent = `${region[5] === "Rakip" ? RIVAL.name : kingdomName} · ${region[4]}`;
          labels.appendChild(label);
        });
      }
      function renderRivalPanel() {
        const owned = regionsOf("Rakip");
        const peaceLeft = RIVAL.peaceMoves - rival.moves;
        $("rival-regions").textContent = owned.length;
        $("rival-garrison").textContent = owned.reduce((sum, id) => sum + data[id][4], 0);
        $("rival-gold").textContent = formatNumber(rival.gold);
        $("rival-next").textContent = kingdomName && owned.length && !gameOver ? `${Math.max(0, Math.ceil(rival.nextMove))} sn` : "—";
        $("ai-state").textContent = gameOver ? (owned.length ? "Galip" : "Yenildi") : rivalMarches.length ? "Seferde" : !kingdomName ? "Hazır" : peaceLeft > 0 ? `Barış · ${peaceLeft} hamle` : "Aktif";
        $("ai-scenario").textContent = rival.plan;
        $("objective").textContent = owned.length ? `${owned.length} rakip bölge` : "Sivas birleşti";
      }
      function render() {
        renderRegionPanel();
        document.querySelectorAll(".region").forEach(element => {
          const id = Number(element.dataset.region);
          element.classList.toggle("selected", id === selected);
          element.classList.toggle("ally", isPlayer(id));
          element.classList.toggle("enemy", isRival(id));
        });
        renderCastles();
        renderKingdomLabels();
        renderUnitEntities();
        renderMarches();
        renderProductionList();
        renderProductionQueue();
        renderDefenses();
        updateResourceStrip();
        renderRivalPanel();
        if (garrisonRegion !== null) renderGarrison();
        refreshAffordability();
      }
      function addBattleLog(message, kind = "") {
        const log = $("battle-log");
        const entry = document.createElement("div");
        if (kind) entry.className = kind + "-entry";
        entry.textContent = message;
        log.prepend(entry);
        while (log.children.length > 40) log.lastElementChild.remove();
      }
      function addBattleEffect(regionId, kind) {
        const [x, y] = regionCenters[regionId];
        const effect = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        effect.setAttribute("class", "battle-effect");
        effect.setAttribute("cx", x); effect.setAttribute("cy", y); effect.setAttribute("r", 8);
        effect.setAttribute("data-effect", kind);
        $("battle-effects").appendChild(effect);
        setTimeout(() => effect.remove(), 900);
      }
      function placePopup(popup, anchorRect, width, height) {
        const card = document.querySelector(".map-card").getBoundingClientRect();
        popup.style.left = Math.max(8, Math.min(anchorRect.left - card.left + 16, card.width - width - 8)) + "px";
        popup.style.top = Math.max(56, Math.min(anchorRect.top - card.top, card.height - height - 8)) + "px";
      }

      // ---- Garnizon penceresi: kaleden çıkar / kaleye al / asker yaz ----
      function closeGarrison() { $("garrison-popup").hidden = true; garrisonRegion = null; }
      function openGarrison(regionId) {
        if (gameOver || !isPlayer(regionId)) return;
        closeMapActions();
        closeUnitInfo();
        selected = regionId;
        garrisonRegion = regionId;
        const popup = $("garrison-popup");
        popup.hidden = false;
        render();
        placePopup(popup, document.querySelector(`.region[data-region="${regionId}"]`).getBoundingClientRect(), 300, popup.offsetHeight);
      }
      function renderGarrison() {
        const id = garrisonRegion;
        if (id === null || !isPlayer(id)) { closeGarrison(); return; }
        const kept = garrisonUnits[id];
        const field = fieldUnitsIn(id);
        const row = (type, count, action, label) => `<div class="garrison-row"><svg viewBox="-17 -17 34 34" aria-hidden="true"><use href="#u-${type}" class="sil-row"/></svg><span>${combatUnits[type].name} <strong>×${count}</strong></span><button type="button" data-g="${action}" data-type="${type}" data-n="1">${label} 1</button><button type="button" data-g="${action}" data-type="${type}" data-n="${count}">Tümü</button></div>`;
        $("garrison-title").textContent = `${data[id][0]} · Garnizonu yönet`;
        $("garrison-body").innerHTML = `<p>Kale surları ${Math.round(walls[id])}/${maxWalls(id)} · ${data[id][4]} asker</p>`
          + `<button class="action" type="button" data-recruit>Asker yaz · +5 asker · 50 ◈</button>`
          + `<h4>Kaledeki tugaylar</h4>` + (typesByWeight(kept).map(type => row(type, kept[type], "out", "Çıkar")).join("") || `<p class="garrison-empty">Kalede tugay yok.</p>`)
          + `<h4>Bu bölgede sahadaki tugaylar</h4>` + (typesByWeight(field).map(type => row(type, field[type], "in", "Kaleye al")).join("") || `<p class="garrison-empty">Sahada tugay yok.</p>`)
          + `<p class="garrison-empty">Kaledeki tugaylar savunmada daha etkilidir ama yürütülemez; sefere çıkarmak için sahaya çıkarın.</p>`;
      }
      function garrisonAction(action, type, count) {
        const id = garrisonRegion;
        if (id === null || gameOver || !isPlayer(id)) return;
        if (action === "out") {
          const moved = Math.min(count, garrisonUnits[id][type] || 0);
          if (!moved) return;
          garrisonUnits[id][type] -= moved;
          if (!garrisonUnits[id][type]) delete garrisonUnits[id][type];
          addFieldStack(id, { [type]: moved }, true);
          toast(`${moved} ${combatUnits[type].name} tugayı kaleden çıktı.`);
        } else {
          const taken = takeFromStacks(fieldStacksIn(id), { [type]: count });
          addUnits(garrisonUnits[id], taken);
          if (unitTotal(taken)) toast(`${taken[type]} ${combatUnits[type].name} tugayı kaleye girdi.`);
        }
        render();
      }

      // ---- Saldırı penceresi ----
      function closeMapActions() { $("map-actions").hidden = true; attackTarget = null; }
      function readAttackSlots() {
        const request = {};
        for (let slot = 1; slot <= 3; slot++) {
          const select = $(`popup-unit-${slot}`);
          if (select.value === "") continue;
          const index = Number(select.value);
          const available = fieldStock(index) - (request[index] || 0);
          const count = Math.max(0, Math.min(Math.floor(Number($(`popup-count-${slot}`).value) || 0), available));
          $(`popup-count-${slot}`).max = fieldStock(index);
          if (count > 0) request[index] = (request[index] || 0) + count;
        }
        return request;
      }
      function updateAttackSummary() {
        const request = readAttackSlots();
        const rivalTarget = attackTarget !== null && isRival(attackTarget);
        const cost = rivalTarget ? campaignCost(request) : 0;
        const power = unitsPower(request);
        let forecast = "";
        if (rivalTarget && unitTotal(request)) {
          const estimate = battleEstimate(typesByWeight(request).map(type => ({ index: type, count: request[type] })), attackTarget);
          const left = Math.max(0, data[attackTarget][4] - Math.ceil(estimate.garrisonLoss));
          forecast = ` · Tahmini: sur −${Math.round(estimate.wallDamage)}, garnizon −${Math.ceil(estimate.garrisonLoss)}${left ? ` (kalan ~${left})` : " (kale düşer)"}`;
        }
        $("attack-summary").textContent = `${rivalTarget ? `Sefer masrafı: ${formatNumber(cost)} altın · ` : "Savaşsız yürüyüş · "}Güç: ${formatNumber(power)}${forecast}${cost > gold ? " · altın yetersiz" : ""}`;
        $("popup-confirm-attack").disabled = gameOver || !unitTotal(request) || cost > gold;
      }
      function openAttackForm(regionId) {
        if (gameOver || isPlayer(regionId)) return;
        const available = combatUnits.map((unit, index) => index).filter(index => fieldStock(index) > 0);
        if (!available.length) { toast("Sahada gönderilecek tugay yok. Garnizondan çıkarın ya da üretin."); return; }
        closeUnitInfo();
        closeGarrison();
        attackTarget = regionId;
        selected = regionId;
        render();
        $("action-region").textContent = data[regionId][0];
        $("action-status").textContent = isRival(regionId)
          ? `Rakip kale · sur ${Math.round(walls[regionId])}/${maxWalls(regionId)}, garnizon ${data[regionId][4]}. Hedefe en yakın sahadaki tugaylar gider; kale düşerse sağ kalanlar oraya yerleşir, düşmezse önünde kamp kurar.`
          : "Tarafsız bölge · gönderilen tugaylar bölgeyi savaşmadan alır ve orada kalır.";
        const options = available.map(index => `<option value="${index}">${combatUnits[index].name} · sahada ${fieldStock(index)}</option>`).join("");
        for (let slot = 1; slot <= 3; slot++) {
          $(`popup-unit-${slot}`).innerHTML = options;
          $(`popup-unit-${slot}`).value = String(available[Math.min(slot - 1, available.length - 1)]);
          $(`popup-count-${slot}`).value = slot === 1 ? 1 : 0;
        }
        const popup = $("map-actions");
        popup.hidden = false;
        placePopup(popup, document.querySelector(`.region[data-region="${regionId}"]`).getBoundingClientRect(), 280, popup.offsetHeight);
        updateAttackSummary();
      }
      function confirmAttack() {
        const request = readAttackSlots();
        const targetId = attackTarget;
        if (targetId === null || !unitTotal(request)) { toast("En az bir tugay gönderin."); return; }
        if (request[8] && !coastalRegions.includes(targetId)) { toast("Savaş gemileri yalnızca kıyı bölgelerine gidebilir."); return; }
        const cost = isRival(targetId) ? campaignCost(request) : 0;
        if (gold < cost) { toast("Bu sefer için yeterli altın yok."); return; }
        // Hedefe en yakın bölgelerdeki sahadaki birliklerden çekilir; ordu en çok katkı veren bölgeden yola çıkar.
        const stacks = unitEntities.filter(stack => isPlayer(stack.region)).sort((a, b) => regionDistance(a.region, targetId) - regionDistance(b.region, targetId));
        const contribution = {};
        const units = {};
        Object.entries(request).forEach(([type, wanted]) => {
          let need = wanted;
          stacks.forEach(stack => {
            const take = Math.min(need, stack.units[type] || 0);
            if (!take) return;
            contribution[stack.region] = (contribution[stack.region] || 0) + take;
            need -= take;
          });
        });
        addUnits(units, takeFromStacks(stacks, request));
        const origin = Number(Object.keys(contribution).sort((a, b) => contribution[b] - contribution[a])[0]);
        gold -= cost;
        closeMapActions();
        launchMarch(units, origin, targetId);
        render();
      }

      // ---- Seçim ve hareket ----
      const unitRows = units => typesByWeight(units).map(type => `<div class="garrison-row compact"><svg viewBox="-17 -17 34 34" aria-hidden="true"><use href="#u-${type}" class="sil-row"/></svg><span>${combatUnits[type].name} <strong>×${units[type]}</strong></span></div>`).join("");
      function openUnitInfo(stack) {
        selectedUnitId = stack.id;
        if (!selectedUnitIds.includes(stack.id)) selectedUnitIds = [stack.id];
        selectedMarchId = null;
        closeMapActions();
        closeGarrison();
        renderUnitEntities();
        renderMarches();
        const camp = isCamp(stack);
        $("unit-info-hint").textContent = camp
          ? "Kalenin önünde kuşatmada. Bu şehre dokunun ya da düğmeyi kullanın: yeniden saldırır. Kendi bölgenize dokunun: çekilir. Rakip kaleden çıkıp kampa saldırabilir."
          : "Hedef bölgeye dokunun: kendi ya da tarafsız bölgeye yürür, rakip şehre saldırır.";
        $("unit-recall").hidden = true;
        const chosen = unitEntities.filter(item => selectedUnitIds.includes(item.id));
        const units = chosen.reduce((all, item) => addUnits(all, item.units), {});
        $("unit-info-name").textContent = chosen.length > 1 ? `${chosen.length} birlik seçili` : camp ? `${data[stack.region][0]} kuşatma kampı` : `${data[stack.region][0]} birliği`;
        $("unit-info-status").textContent = `${camp ? "Kuşatmada" : "Konuşlu"} · ${data[stack.region][0]} · güç ${formatNumber(unitsPower(units))}`;
        updateAssaultButton();
        $("unit-info-list").innerHTML = unitRows(units);
        const sameRegion = fieldStacksIn(stack.region);
        $("unit-select-region").hidden = sameRegion.length < 2 || sameRegion.every(item => selectedUnitIds.includes(item.id));
        $("unit-merge").hidden = chosen.length < 2;
        $("unit-split").hidden = typesByWeight(stack.units).length < 2;
        // Birlik penceresi haritanın üstüne değil altına açılır (her ekranda): sıradaki iş haritada bir hedefe
        // dokunmak; haritanın üstündeki pencere o hedefi (çoğu zaman rakip şehri) örtüyordu.
        $("unit-info-popup").hidden = false;
      }
      // Yürüyen ordu seçilince: nereye gittiği, içindekiler; yeni hedefe dokunmak yolu değiştirir.
      function openMarchInfo(march) {
        selectedMarchId = march.id;
        selectedUnitId = null;
        selectedUnitIds = [];
        closeMapActions();
        closeGarrison();
        renderUnitEntities();
        renderMarches();
        $("unit-info-name").textContent = `Yürüyen ordu · ${unitTotal(march.units)} tugay`;
        $("unit-info-status").textContent = `${march.retreat ? "Geri dönüyor" : isRival(march.target) ? "Saldırıya gidiyor" : "Yürüyor"} → ${data[march.target][0]} · güç ${formatNumber(unitsPower(march.units))}`;
        $("unit-info-list").innerHTML = unitRows(march.units);
        $("unit-info-hint").textContent = "Yolda yön değiştirmek için yeni hedef bölgeye dokunun. Vardığında bölgenin üstünde bekler.";
        $("unit-select-region").hidden = true;
        $("unit-merge").hidden = true;
        $("unit-split").hidden = true;
        $("unit-assault").hidden = true;
        $("unit-recall").hidden = false;
        $("unit-info-popup").hidden = false;
      }
      function closeUnitInfo() {
        $("unit-info-popup").hidden = true;
        selectedUnitId = null;
        selectedUnitIds = [];
        selectedMarchId = null;
        renderUnitEntities();
        renderMarches();
      }
      // Çoklu seçim: masaüstünde Ctrl/Shift + tık, dokunmatikte "Bölgedeki tümünü seç".
      function toggleUnitSelection(stack, additive) {
        if (!additive) selectedUnitIds = [stack.id];
        else if (selectedUnitIds.includes(stack.id)) selectedUnitIds = selectedUnitIds.filter(id => id !== stack.id);
        else selectedUnitIds.push(stack.id);
        const last = unitEntities.find(item => item.id === selectedUnitIds[selectedUnitIds.length - 1]);
        if (last) openUnitInfo(last);
        else closeUnitInfo();
      }
      function selectAllUnitsInRegion() {
        const focus = unitEntities.find(item => item.id === selectedUnitId);
        if (!focus) return;
        selectedUnitIds = fieldStacksIn(focus.region).map(item => item.id);
        openUnitInfo(focus);
      }
      function mergeSelectedUnits() {
        const chosen = unitEntities.filter(item => selectedUnitIds.includes(item.id));
        if (chosen.length < 2) return;
        if (chosen.some(item => item.region !== chosen[0].region)) { toast("Birlikler aynı bölgede olmalı."); return; }
        const primary = chosen[0];
        chosen.slice(1).forEach(item => { addUnits(primary.units, item.units); unitEntities.splice(unitEntities.indexOf(item), 1); });
        layoutRegion(primary.region);
        selectedUnitIds = [primary.id];
        toast("Birlikler tek komuta altında birleştirildi.");
        render();
        openUnitInfo(primary);
      }
      function splitSelectedUnit() {
        const stack = unitEntities.find(item => item.id === selectedUnitId);
        if (!stack || typesByWeight(stack.units).length < 2) return;
        const [first, ...rest] = typesByWeight(stack.units);
        const parts = rest.map(type => {
          const part = { id: `stack-${Date.now().toString(36)}-${stackSeq++}`, region: stack.region, units: { [type]: stack.units[type] } };
          delete stack.units[type];
          return part;
        });
        unitEntities.splice(unitEntities.indexOf(stack) + 1, 0, ...parts);
        layoutRegion(stack.region);
        selectedUnitIds = [stack.id, ...parts.map(part => part.id)];
        toast(`Birlik ${parts.length + 1} parçaya ayrıldı (${combatUnits[first].name} ve diğerleri).`);
        render();
        openUnitInfo(stack);
      }
      // Seçili birlikleri hedefe yürüt: kendi ya da tarafsız bölgeye yürüyüş, rakip bölgeye saldırı.
      function orderSelectedUnits(targetRegion) {
        const chosen = unitEntities.filter(stack => selectedUnitIds.includes(stack.id));
        if (!chosen.length) return;
        if (chosen.some(stack => stack.region !== chosen[0].region)) { toast("Seçili birlikler aynı bölgeden hareket etmeli."); return; }
        const origin = chosen[0].region;
        const units = chosen.reduce((all, stack) => addUnits(all, stack.units), {});
        if (units[8] && !coastalRegions.includes(targetRegion)) { toast("Savaş gemileri yalnızca kıyı bölgelerine gidebilir."); return; }
        const cost = isRival(targetRegion) ? campaignCost(units) : 0;
        if (gold < cost) { toast(`Bu sefer için ${formatNumber(cost)} altın gerekiyor.`); return; }
        gold -= cost;
        chosen.forEach(stack => unitEntities.splice(unitEntities.indexOf(stack), 1));
        layoutRegion(origin);
        closeUnitInfo();
        launchMarch(units, origin, targetRegion);
        if (isRival(targetRegion)) toast(`${data[targetRegion][0]} üzerine sefer: ${unitTotal(units)} tugay, masraf ${formatNumber(cost)} altın.`);
        render();
      }
      // Yürüyüşün rotası: bulunduğu noktadan hedef bölgeye. Yolda yön değiştirince de buradan yeniden kurulur.
      function setMarchCourse(march, targetId, retreat) {
        const [cx, cy] = regionCenters[targetId];
        const slowest = Math.min(...typesByWeight(march.units).map(type => combatUnits[type].speed));
        Object.assign(march, { target: targetId, retreat, sx: march.x, sy: march.y, tx: cx, ty: cy + 30, started: performance.now() });
        march.heading = [march.tx - march.sx, march.ty - march.sy];
        march.duration = Math.max(600, Math.round(Math.hypot(march.heading[0], march.heading[1]) / slowest * 90));
        march.label = `${unitTotal(march.units)} tugay${retreat ? " geri çekiliyor" : ""}`;
      }
      function launchMarch(units, originId, targetId, retreat = false) {
        const [sx, sy] = regionCenters[originId];
        // paid: rakibe giden seferin masrafı (çağıran taraf) ödendi; yolda başka rakip şehre dönünce yeniden alınmaz.
        const march = { id: `march-${marchSeq++}`, units, origin: originId, x: sx, y: sy + 30, paid: isRival(targetId) && !retreat };
        setMarchCourse(march, targetId, retreat);
        playerMarches.push(march);
        sound.marchStart();
        function step(now) {
          if (!playerMarches.includes(march)) return;
          const progress = Math.min(1, (now - march.started) / march.duration);
          march.x = march.sx + (march.tx - march.sx) * progress;
          march.y = march.sy + (march.ty - march.sy) * progress;
          renderMarches();
          if (progress < 1) { requestAnimationFrame(step); return; }
          playerMarches.splice(playerMarches.indexOf(march), 1);
          sound.marchEnd();
          if (selectedMarchId === march.id) closeUnitInfo();
          renderMarches();
          arriveMarch(march);
        }
        requestAnimationFrame(step);
      }
      // ---- Kuşatma kampı ----
      // Seçim tek bir kampın (aynı rakip bölgede bekleyen birliklerin) tamamıysa o birlikler, değilse null.
      function selectedCamp() {
        const chosen = unitEntities.filter(stack => selectedUnitIds.includes(stack.id));
        return chosen.length && chosen.every(stack => isCamp(stack) && stack.region === chosen[0].region) ? chosen : null;
      }
      function updateAssaultButton() {
        const camp = selectedCamp();
        const button = $("unit-assault");
        button.hidden = !camp;
        if (!camp) return;
        const wait = Math.max(...camp.map(regroupLeft));
        const cost = campaignCost(camp.reduce((all, stack) => addUnits(all, stack.units), {}));
        button.disabled = gameOver || wait > 0 || gold < cost;
        button.textContent = wait ? `Toparlanıyor · ${wait} sn` : `Yeniden saldır · ${formatNumber(cost)} ◈`;
      }
      // Kamptan yeniden saldırı: yol yok, sefer masrafı (erzak, kuşatma aleti) her saldırıda yeniden alınır.
      function assaultFromCamp() {
        const camp = selectedCamp();
        if (!camp || gameOver) return;
        const regionId = camp[0].region;
        const wait = Math.max(...camp.map(regroupLeft));
        if (wait) { toast(`Birlikler toparlanıyor: ${wait} sn.`); return; }
        const units = camp.reduce((all, stack) => addUnits(all, stack.units), {});
        const cost = campaignCost(units);
        if (gold < cost) { toast(`Bu saldırı için ${formatNumber(cost)} altın gerekiyor.`); return; }
        gold -= cost;
        camp.forEach(stack => unitEntities.splice(unitEntities.indexOf(stack), 1));
        layoutRegion(regionId);
        closeUnitInfo();
        sound.play("cry", 4, .8);
        arriveMarch({ units, target: regionId, retreat: false });
      }
      // Kayıplar en zayıf savunmalı türden başlayıp türler arasında sırayla düşer.
      function pickLosses(units, count) {
        const left = { ...units };
        const lost = {};
        const order = Object.keys(left).map(Number).sort((a, b) => combatUnits[a].defense - combatUnits[b].defense);
        while (count > 0 && unitTotal(left)) {
          for (const type of order) {
            if (count <= 0) break;
            if (left[type] > 0) { left[type]--; lost[type] = (lost[type] || 0) + 1; count--; }
          }
        }
        return lost;
      }
      // Yürüyen orduya yeni hedef: rakip şehre dönüyorsa (ve masraf ödenmediyse) sefer masrafı o an alınır.
      function redirectMarch(march, targetId) {
        if (targetId === march.target) { toast(`Ordu zaten ${data[targetId][0]} yolunda.`); return; }
        if (march.units[8] && !coastalRegions.includes(targetId)) { toast("Savaş gemileri yalnızca kıyı bölgelerine gidebilir."); return; }
        const cost = isRival(targetId) && !march.paid ? campaignCost(march.units) : 0;
        if (gold < cost) { toast(`Bu sefer için ${formatNumber(cost)} altın gerekiyor.`); return; }
        gold -= cost;
        if (cost) march.paid = true;
        setMarchCourse(march, targetId, false);
        closeUnitInfo();
        toast(isRival(targetId) ? `Ordu yön değiştirdi: ${data[targetId][0]} üzerine sefer${cost ? `, masraf ${formatNumber(cost)} altın` : ""}.` : `Ordu yön değiştirdi: ${data[targetId][0]}.`);
        render();
      }
      // "Geri dön": çıktığı bölgeye (elden gittiyse en yakın kendi bölgeye).
      function recallSelectedMarch() {
        const march = playerMarches.find(item => item.id === selectedMarchId);
        if (!march) { closeUnitInfo(); return; }
        const home = isPlayer(march.origin) ? march.origin : nearestPlayerRegion(march.target);
        if (!home) { toast("Dönülecek toprak kalmadı."); return; }
        setMarchCourse(march, home, true);
        closeUnitInfo();
        toast(`Ordu ${data[home][0]} bölgesine geri dönüyor.`);
      }
      // Varan ordu kaleye girmez ve başka birliğe katılmaz: bölgenin üstünde ayrı bir birlik olarak bekler.
      function arriveMarch({ units, target, retreat }) {
        if (gameOver) return;
        if (isPlayer(target)) {
          addFieldStack(target, units, false);
          toast(`${unitTotal(units)} tugay ${data[target][0]} bölgesine ulaştı ve emir bekliyor.`);
        } else if (retreat) {
          // Geri çekilirken varılacak yer elden gittiyse en yakın kendi bölgeye; hiç yoksa ordu dağılır.
          const home = nearestPlayerRegion(target);
          if (home) launchMarch(units, target, home, true);
          else toast("Geri çekilecek toprak kalmadı; ordu dağıldı.");
        } else if (data[target][5] === "Tarafsız") {
          data[target][5] = "Müttefik";
          honor += 2;
          addFieldStack(target, units, false);
          addBattleLog(`${data[target][0]} savaşsız ele geçirildi; ${unitTotal(units)} tugay bölgeye yerleşti.`);
          sound.play("cry", 4, .6);
          toast(`${data[target][0]} birliklerinizce alındı.`);
        } else {
          const result = runBattle(units, target);
          if (result.captured) addFieldStack(target, result.survivors, false);
          // Kale düşmezse sağ kalanlar kalenin önünde kuşatma kampı kurar ve toparlanır.
          else if (unitTotal(result.survivors)) addFieldStack(target, result.survivors, false).readyAt = elapsedSeconds + SIEGE_REGROUP;
        }
        render();
        checkGameEnd();
      }
      function battleEstimate(attacks, targetId) {
        const target = data[targetId];
        const profile = getDefenseProfile(targetId);
        const defenderDomain = profile.total ? profile.domain : (targetId % 2 ? "mekanize" : "piyade");
        const terrain = attacks.some(attack => combatUnits[attack.index].domain === "kara") && coastalRegions.includes(targetId) ? 0.9 : 1;
        const defenseFactor = Math.max(.35, 1 - target[2] / 220) * (1 - Math.min(.45, profile.total / 240));
        let power = 0;
        let siegePower = 0;
        attacks.forEach(attack => {
          const unit = combatUnits[attack.index];
          const matchup = unit.strongAgainst === defenderDomain ? 1.28 : unit.weakAgainst === defenderDomain ? .68 : 1;
          power += unit.power * attack.count * matchup;
          siegePower += unit.power * attack.count * SIEGE[unit.domain];
        });
        const damage = power * defenseFactor * terrain;
        // .15: büyük bir kale tek dalgada değil, birkaç kuşatma dalgasında düşer.
        const wallDamage = Math.min(walls[targetId], siegePower * defenseFactor * .15);
        const wallRatio = (walls[targetId] - wallDamage) / maxWalls(targetId);
        const garrisonLoss = damage * (1 - .7 * wallRatio) / (8 * RIVAL.toughness);
        return { profile, defenseFactor, damage, wallDamage, garrisonLoss };
      }
      // Kuşatma. Saldıran tugaylar artık harcanmıyor: savunmanın gücüne göre kayıp verir (önce savunması zayıf
      // olanlar düşer); kale düşerse sağ kalanlar oraya yerleşir, düşmezse önünde kuşatma kampı kurar.
      function runBattle(units, targetId) {
        const target = data[targetId];
        const attacks = typesByWeight(units).map(type => ({ index: type, count: units[type] }));
        const estimate = battleEstimate(attacks, targetId);
        const roll = .88 + Math.random() * .24;
        const attackDamage = Math.max(1, Math.round(estimate.damage * roll));
        const defenderPower = target[4] * RIVAL.soldierPower + walls[targetId] * 1.2;
        const oldGarrison = target[4];
        const oldWalls = Math.round(walls[targetId]);
        walls[targetId] = Math.max(0, walls[targetId] - estimate.wallDamage * roll);
        target[4] = Math.max(0, target[4] - Math.ceil(estimate.garrisonLoss * roll));
        turn++;
        const total = unitTotal(units);
        const averageDefense = attacks.reduce((sum, attack) => sum + combatUnits[attack.index].defense * attack.count, 0) / total;
        const casualties = Math.min(total, Math.round(defenderPower * .45 * (.8 + Math.random() * .4) / averageDefense));
        const survivors = { ...units };
        Object.entries(pickLosses(units, casualties)).forEach(([type, lost]) => { survivors[type] -= lost; if (!survivors[type]) delete survivors[type]; });
        const force = describeUnits(units);
        const captured = target[4] === 0;
        if (captured) {
          target[5] = "Müttefik"; honor += 4;
          addBattleLog(`${force}: ${attackDamage} hasar, sur ${oldWalls} → ${Math.round(walls[targetId])}; ${target[0]} kalesi fethedildi. Kayıp: ${casualties} tugay.`);
          toast(`${target[0]} kalesi fethedildi!`);
          sound.play("swords", 5, 1);
          sound.play("cry", 8, 1);
        } else {
          addBattleLog(`${force}: ${attackDamage} hasar; sur ${oldWalls} → ${Math.round(walls[targetId])}, garnizon ${oldGarrison} → ${target[4]}. Kayıp: ${casualties} tugay${casualties < total ? "; sağ kalanlar kalenin önünde kamp kurdu" : ""}.`);
          toast(`Kuşatma sürüyor: sur ${Math.round(walls[targetId])}, garnizon ${target[4]}.`);
          sound.play("swords", 3, .9);
        }
        return { captured, survivors };
      }

      // ---- Rakip ----
      // Bölge düşünce oradaki sahadaki ve kaledeki tugaylar, savunma sistemleri ve bekleyen üretim kaybedilir.
      function removePlayerAssetsAt(regionId) {
        for (let i = unitEntities.length - 1; i >= 0; i--) if (unitEntities[i].region === regionId) unitEntities.splice(i, 1);
        selectedUnitIds = selectedUnitIds.filter(id => unitEntities.some(stack => stack.id === id));
        selectedUnitId = selectedUnitIds.includes(selectedUnitId) ? selectedUnitId : null;
        if (!selectedUnitId) $("unit-info-popup").hidden = true;
        garrisonUnits[regionId] = {};
        regionDefenses[regionId] = defenseSystems.map(() => ({ fixed: 0, mobile: 0 }));
        for (let i = productionQueue.length - 1; i >= 0; i--) {
          if (productionQueue[i].region === regionId) productionQueue.splice(i, 1);
        }
      }
      function rivalTurn() {
        const owned = regionsOf("Rakip");
        if (!owned.length || gameOver) return;
        rival.moves++;
        rival.gold += Math.round(owned.reduce((sum, id) => sum + productionOf(id), 0) * RIVAL.moveSeconds * RIVAL.incomeFactor);
        const frontier = owned.filter(id => neighbors[id].some(n => !isRival(n)));
        owned.filter(id => !frontier.includes(id)).forEach(id => {
          const surplus = data[id][4] - 2;
          const target = neighbors[id].filter(n => frontier.includes(n)).sort((a, b) => data[a][4] - data[b][4])[0];
          if (surplus > 0 && target) { data[id][4] -= surplus; data[target][4] += surplus; }
        });
        // Önünde oyuncu kampı olan (kuşatılan) kaleler; en büyük tehdit onlar.
        const besieged = owned.filter(id => fieldStacksIn(id).length);
        const recruits = Math.floor(rival.gold / RIVAL.soldierCost);
        if (recruits > 0) {
          rival.gold -= recruits * RIVAL.soldierCost;
          const pool = frontier.length ? frontier : owned;
          const threat = id => neighbors[id].filter(isPlayer).reduce((sum, n) => sum + regionDefenseValue(n), 0) + campValue(id) * 2;
          const target = pool.slice().sort((a, b) => threat(b) - threat(a) || data[a][4] - data[b][4])[0];
          data[target][4] += recruits;
        }
        // Kuşatmaya karşılık (barış süresinde de): kale yeterince güçlüyse çıkıp kampa saldırır; değilse
        // kuşatılmamış komşu kalelerden takviye çeker (gelen askerler garnizona katılır, yeniden saldırıyı zorlaştırır).
        besieged.forEach(id => {
          const needed = Math.ceil(campValue(id) * RIVAL.attackMargin / RIVAL.soldierPower) + 2;
          const spare = data[id][4] - RIVAL.keepHome;
          if (spare >= needed) { sallyAgainstCamp(id, needed); return; }
          let missing = needed - Math.max(0, spare);
          neighbors[id].filter(n => isRival(n) && !besieged.includes(n)).sort((a, b) => data[b][4] - data[a][4]).forEach(n => {
            // Komşu kale kendini savunmasız bırakmaz: fazlasının en çok %60'ını gönderir.
            const give = Math.min(missing, Math.floor((data[n][4] - RIVAL.keepHome) * .6));
            if (give <= 0) return;
            launchRivalMarch(n, id, give);
            missing -= give;
          });
        });
        // Oyuncuya saldırma isteği zamanla artar; barış süresinde yalnızca tarafsız toprakla büyür.
        const aggression = Math.min(1, rival.moves / RIVAL.aggressionMoves);
        let best = null;
        // Kuşatılan kale askerini dışarı sefere göndermez.
        owned.filter(from => !besieged.includes(from)).forEach(from => {
          const available = data[from][4] - RIVAL.keepHome;
          neighbors[from].filter(n => !isRival(n) && !rivalMarches.some(march => march.to === n)).forEach(to => {
            if (isPlayer(to) && rival.moves <= RIVAL.peaceMoves) return;
            const needed = Math.ceil(regionDefenseValue(to) * RIVAL.attackMargin / RIVAL.soldierPower) + 2;
            if (needed > available) return;
            const score = (productionOf(to) + 5) / (needed + 5) * (isPlayer(to) ? 1 + aggression : 1);
            if (!best || score > best.score) best = { from, to, soldiers: needed, score };
          });
        });
        if (best) {
          rival.plan = `${data[best.from][0]} bölgesinden ${data[best.to][0]} üzerine ${best.soldiers} askerle yürüyor.`;
          launchRivalMarch(best.from, best.to, best.soldiers);
          if (isPlayer(best.to)) toast(`${RIVAL.name} ${data[best.to][0]} bölgesine saldırıyor!`);
        } else {
          const weakest = frontier.slice().sort((a, b) => data[a][4] - data[b][4])[0];
          rival.plan = weakest ? `Sınır hattını güçlendiriyor; en zayıf noktası ${data[weakest][0]} (${data[weakest][4]} asker).` : "Topraklarını tahkim ediyor.";
        }
        render();
      }
      // Kampın açık arazideki direnci, rakip asker gücü biriminde (sur ve kale yok).
      const campValue = regionId => unitsPower(fieldUnitsIn(regionId)) * FIELD_DEFENSE;
      // Kaleden çıkış: kazanırsa kamp dağılır, kalan askerler kaleye döner; kaybederse çıkan askerler düşer,
      // kamp gücüyle orantılı kayıp verir (en çok %40).
      function sallyAgainstCamp(regionId, soldiers) {
        const name = data[regionId][0];
        const units = fieldUnitsIn(regionId);
        const defense = campValue(regionId);
        const attack = Math.round(soldiers * RIVAL.soldierPower * (.85 + Math.random() * .3));
        data[regionId][4] -= soldiers;
        addBattleEffect(regionId, "rival");
        if (attack > defense) {
          takeFromStacks(fieldStacksIn(regionId), units);
          data[regionId][4] += Math.max(1, Math.ceil((attack - defense) / RIVAL.soldierPower));
          sound.play("swords", 5, 1);
          sound.play("cry", 8, 1);
          rival.plan = `${name} kalesinden çıkıp kuşatma kampını dağıttı.`;
          addBattleLog(`${RIVAL.name}, ${soldiers} askerle ${name} kalesinden çıkıp kuşatma kampını dağıttı; ${unitTotal(units)} tugay kaybedildi (${describeUnits(units)}).`, "rival");
          toast(`${name} önündeki kamp dağıtıldı!`);
        } else {
          const lost = takeFromStacks(fieldStacksIn(regionId), pickLosses(units, Math.round(unitTotal(units) * attack / defense * .4)));
          sound.play("swords", 3, 1);
          rival.plan = `${name} kalesinden çıkış yaptı, püskürtüldü.`;
          addBattleLog(`${RIVAL.name}, ${name} önündeki kampa ${soldiers} askerle çıkış yaptı ve püskürtüldü; kamp ${unitTotal(lost)} tugay kaybetti.`, "rival");
          toast(`${name} önündeki kamp çıkışı püskürttü.`);
        }
        // Seçili birlik yok olduysa açık birlik penceresi kapanır.
        if (selectedUnitId && !unitEntities.some(stack => stack.id === selectedUnitId)) closeUnitInfo();
        else if (!$("unit-info-popup").hidden && selectedUnitId) openUnitInfo(unitEntities.find(stack => stack.id === selectedUnitId));
      }
      function launchRivalMarch(from, to, soldiers) {
        const [sx, sy] = regionCenters[from];
        const [tx, ty] = regionCenters[to];
        const march = { from, to, soldiers, x: sx, y: sy, heading: [tx - sx, ty - sy] };
        data[from][4] -= soldiers;
        rivalMarches.push(march);
        const duration = Math.max(1200, Math.round(Math.hypot(tx - sx, ty - sy) * 9));
        const started = performance.now();
        sound.marchStart();
        function step(now) {
          const progress = Math.min(1, (now - started) / duration);
          march.x = sx + (tx - sx) * progress;
          march.y = sy + (ty - sy) * progress;
          renderMarches();
          if (progress < 1) { requestAnimationFrame(step); return; }
          rivalMarches.splice(rivalMarches.indexOf(march), 1);
          sound.marchEnd();
          renderMarches();
          resolveRivalArrival(march);
        }
        requestAnimationFrame(step);
      }
      function resolveRivalArrival({ from, to, soldiers }) {
        if (gameOver) return;
        const target = data[to];
        if (isRival(to)) { target[4] += soldiers; render(); return; }
        const wasPlayer = isPlayer(to);
        const defense = regionDefenseValue(to);
        const attack = Math.round(soldiers * RIVAL.soldierPower * (.85 + Math.random() * .3));
        addBattleEffect(to, "rival");
        const volume = wasPlayer ? 1 : .5;
        if (attack > defense) {
          if (wasPlayer) removePlayerAssetsAt(to);
          walls[to] = maxWalls(to) * .25;
          sound.play("swords", 5, volume);
          sound.play("cry", 8, volume);
          target[5] = "Rakip";
          target[4] = Math.max(1, Math.ceil((attack - defense) / RIVAL.soldierPower));
          addBattleLog(`${RIVAL.name}, ${data[from][0]} bölgesinden gelen ${soldiers} askerle ${target[0]} bölgesini ele geçirdi.`, "rival");
          if (wasPlayer) toast(`${target[0]} düştü!`);
        } else {
          const losses = Math.min(target[4], Math.ceil(attack / RIVAL.soldierPower * .4));
          target[4] -= losses;
          walls[to] = Math.max(0, walls[to] - attack * .25);
          sound.play("swords", 3, volume);
          addBattleLog(`${RIVAL.name}, ${target[0]} saldırısında püskürtüldü (${soldiers} asker kaybetti); garnizon ${losses} kayıp verdi.`, "rival");
          if (wasPlayer) toast(`${target[0]} saldırıyı püskürttü.`);
        }
        render();
        checkGameEnd();
      }

      // ---- Oyun başlangıcı ve sonu ----
      function formatDuration(seconds) {
        return `${Math.floor(seconds / 60)} dk ${String(seconds % 60).padStart(2, "0")} sn`;
      }
      function checkGameEnd() {
        if (gameOver || !kingdomName) return;
        if (!regionsOf("Rakip").length) endGame(true);
        else if (!regionsOf("Müttefik").length) endGame(false);
      }
      function endGame(won) {
        gameOver = true;
        clearSave();
        closeMapActions();
        closeGarrison();
        closeUnitInfo();
        rival.plan = won ? `${RIVAL.name} dağıldı.` : `${RIVAL.name} Sivas'ı ele geçirdi.`;
        $("end-eyebrow").textContent = won ? "Sefer kazanıldı" : "Sefer kaybedildi";
        $("end-title").textContent = won ? "Zafer" : "Yenilgi";
        $("end-text").textContent = won
          ? `${kingdomName}, ${RIVAL.name}'in son toprağını aldı. Sivas tek sancak altında.`
          : `${kingdomName} son toprağını da kaybetti. ${RIVAL.name} Sivas'a hükmediyor.`;
        $("end-stats").innerHTML = `<div>Zorluk<strong>${DIFFICULTIES[difficulty].label}</strong></div><div>Süre<strong>${formatDuration(elapsedSeconds)}</strong></div><div>Tur<strong>${turn}</strong></div><div>Bölge<strong>${regionsOf("Müttefik").length}</strong></div>`;
        $("end-screen").hidden = false;
        render();
      }
      function startGame(event) {
        event.preventDefault();
        kingdomName = $("kingdom-name-input").value.trim();
        if (!kingdomName) return;
        setDifficulty(new FormData($("setup-form")).get("difficulty"));
        selected = Number($("start-region-input").value);
        playerCapital = selected;
        Object.values(data).forEach(region => { region[5] = "Tarafsız"; });
        data[selected][5] = "Müttefik";
        // Rakip başkenti oyuncuya en uzak bölge; yanına, oyuncudan en uzak komşusu.
        const distance = id => regionDistance(id, selected);
        const byDistance = Object.keys(data).map(Number).filter(id => id !== selected).sort((a, b) => distance(b) - distance(a));
        rival.capital = byDistance[0];
        const second = neighbors[rival.capital].filter(id => id !== selected).sort((a, b) => distance(b) - distance(a))[0];
        [rival.capital, second].forEach((id, index) => {
          data[id][5] = "Rakip";
          data[id][4] = RIVAL.startGarrison[index];
        });
        rival.gold = 0;
        rival.moves = 0;
        rival.nextMove = RIVAL.firstMoveSeconds;
        rival.plan = `${RIVAL.name}, ${data[rival.capital][0]} merkezli olarak kuruldu.`;
        garrisonUnits[selected] = { ...STARTING_GARRISON };
        STARTING_FIELD.forEach(units => addFieldStack(selected, units, false));
        $("setup-screen").hidden = true;
        render();
        saveGame();
        toast(`${kingdomName} kuruldu · ${DIFFICULTIES[difficulty].label}. ${RIVAL.name} ${data[rival.capital][0]} bölgesinde.`);
      }

      // ---- Kayıt ----
      // localStorage gizli pencerede veya engelli site verisinde hata verebilir; o durumda oyun kayıtsız sürer.
      let saveDisabled = false;
      function saveGame() {
        if (saveDisabled || gameOver || !kingdomName) return;
        const now = Date.now();
        const savedData = JSON.parse(JSON.stringify(data));
        // Yoldaki rakip askerleri çıktıkları bölgeye geri yazılır; yoksa yeniden yüklemede kaybolurlardı.
        rivalMarches.forEach(march => { if (savedData[march.from][5] === "Rakip") savedData[march.from][4] += march.soldiers; });
        // Yoldaki kendi ordularımız da en yakın kendi bölgemizde saha birliği olarak kaydedilir.
        const stacks = unitEntities.map(({ id, region, units, readyAt }) => ({ id, region, units: { ...units }, readyAt }));
        playerMarches.forEach(march => {
          const home = isPlayer(march.origin) ? march.origin : isPlayer(march.target) ? march.target : nearestPlayerRegion(march.target);
          if (home) stacks.push({ id: march.id, region: home, units: { ...march.units } });
        });
        const state = {
          version: SAVE_VERSION, savedAt: now, difficulty,
          kingdomName, playerCapital, selected, turn, honor, gold, food, elapsedSeconds,
          data: savedData,
          unitEntities: stacks, garrisonUnits, mobileDefenseStock: [...mobileDefenseStock], regionDefenses, walls,
          productionQueue: productionQueue.map(({ readyAt, ...job }) => ({ ...job, remainingMs: Math.max(0, readyAt - now) })),
          rival: { gold: rival.gold, capital: rival.capital, nextMove: rival.nextMove, moves: rival.moves, plan: rival.plan },
          log: [...$("battle-log").children].slice(0, 20).map(entry => [entry.textContent, entry.className])
        };
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (error) { saveDisabled = true; }
      }
      function readSave() {
        try {
          const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
          return saved && saved.version === SAVE_VERSION && saved.kingdomName ? saved : null;
        } catch (error) { return null; }
      }
      function clearSave() {
        try { localStorage.removeItem(SAVE_KEY); } catch (error) { /* kayıt zaten kullanılamıyor */ }
      }
      function applySave(saved) {
        // Zorluk eklenmeden önceki kayıtlar o zamanki tek seviyeyle (Orta) oynanmıştı.
        setDifficulty(saved.difficulty || "orta");
        Object.keys(data).forEach(id => { data[id] = saved.data[id]; });
        ({ kingdomName, playerCapital, selected, turn, honor, gold, food } = saved);
        elapsedSeconds = saved.elapsedSeconds || 0;
        mobileDefenseStock.splice(0, mobileDefenseStock.length, ...saved.mobileDefenseStock);
        Object.keys(regionDefenses).forEach(id => { regionDefenses[id] = saved.regionDefenses[id]; });
        // Kaleler eklenmeden önceki kayıtlarda surlar sağlam başlar.
        Object.keys(walls).forEach(id => { walls[id] = saved.walls ? saved.walls[id] : maxWalls(id); });
        // Birlikler: eski kayıtta { index, composition, count } + ortak stok vardı; yenisinde { units } + garnizon.
        unitEntities.splice(0, unitEntities.length);
        (saved.unitEntities || []).forEach(entity => {
          let units = entity.units;
          if (!units) {
            const composition = entity.composition || [entity.index];
            const total = Math.max(composition.length, entity.count || composition.length);
            units = {};
            composition.forEach((type, part) => { units[type] = (units[type] || 0) + Math.floor(total / composition.length) + (part < total % composition.length ? 1 : 0); });
          }
          // Kendi bölgelerdeki birlikler ve rakip kalelerin önündeki kuşatma kampları.
          if (data[entity.region] && ["Müttefik", "Rakip"].includes(data[entity.region][5])) {
            const stack = addFieldStack(entity.region, units, false);
            if (stack && entity.readyAt) stack.readyAt = entity.readyAt;
          }
        });
        Object.keys(garrisonUnits).forEach(id => { garrisonUnits[id] = saved.garrisonUnits ? { ...saved.garrisonUnits[id] } : {}; });
        if (!saved.garrisonUnits && saved.unitStock) {
          // Eski kayıt: haritada görünmeyen ortak stoktaki tugaylar artık başkentin (yoksa ilk bölgenin) kalesinde.
          const home = data[playerCapital] && data[playerCapital][5] === "Müttefik" ? playerCapital : regionsOf("Müttefik")[0];
          const onMap = unitEntities.reduce((all, stack) => addUnits(all, stack.units), {});
          if (home) saved.unitStock.forEach((count, type) => { const extra = count - (onMap[type] || 0); if (extra > 0) addUnits(garrisonUnits[home], { [type]: extra }); });
        }
        const now = Date.now();
        productionQueue.splice(0, productionQueue.length, ...saved.productionQueue.map(({ remainingMs, ...job }) => ({ ...job, readyAt: now + remainingMs })));
        Object.assign(rival, saved.rival);
        $("battle-log").replaceChildren();
        saved.log.slice().reverse().forEach(([message, className]) => addBattleLog(message, className.replace(/-entry$/, "")));
        $("setup-screen").hidden = true;
        render();
        toast(`${kingdomName} seferine devam ediliyor.`);
      }
      function startNewGame() {
        saveDisabled = true;
        clearSave();
        location.reload();
      }

      // ---- Harita: dokunma, fare, yakınlaştırma ----
      const mapWrap = $("map-wrap");
      function applyMapTransform() {
        const rect = mapWrap.getBoundingClientRect();
        const limitX = rect.width * (mapZoom - 1) / 2 + 30;
        const limitY = rect.height * (mapZoom - 1) / 2 + 30;
        panOffset.x = Math.max(-limitX, Math.min(limitX, panOffset.x));
        panOffset.y = Math.max(-limitY, Math.min(limitY, panOffset.y));
        $("map-svg").style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${mapZoom})`;
      }
      function setZoom(value) {
        mapZoom = Math.max(1, Math.min(3.5, value));
        if (mapZoom === 1) { panOffset.x = 0; panOffset.y = 0; }
        applyMapTransform();
      }
      function handleRegionTap(regionId) {
        const march = playerMarches.find(item => item.id === selectedMarchId);
        if (march) { redirectMarch(march, regionId); return; }
        const chosen = unitEntities.filter(stack => selectedUnitIds.includes(stack.id));
        // Seçili kamp, kuşattığı şehre dokununca yeniden saldırır.
        const camp = selectedCamp();
        if (camp && camp[0].region === regionId) { assaultFromCamp(); return; }
        if (chosen.length && chosen.some(stack => stack.region !== regionId)) {
          orderSelectedUnits(regionId);
          return;
        }
        if (chosen.length) closeUnitInfo();
        selected = regionId;
        closeMapActions();
        closeGarrison();
        render();
      }
      // Sağ tık / basılı tutma: kendi şehrinde garnizon penceresi, diğerlerinde saldırı penceresi.
      function openRegionMenu(regionId) {
        selected = regionId;
        if (isPlayer(regionId)) openGarrison(regionId);
        else { render(); openAttackForm(regionId); }
      }
      function handleTap(info) {
        if (info.unitId) {
          const stack = unitEntities.find(item => item.id === info.unitId);
          if (stack) { toggleUnitSelection(stack, info.additive); return; }
        }
        // Basıldığı an ile bırakıldığı an arasında varmış olabilir; o zaman dokunuş bölgeye sayılır.
        if (info.marchId) {
          const march = playerMarches.find(item => item.id === info.marchId);
          if (march) { openMarchInfo(march); return; }
        }
        if (info.regionId) { handleRegionTap(info.regionId); return; }
        closeMapActions();
        closeGarrison();
        if (!$("unit-info-popup").hidden) closeUnitInfo();
      }
      // Üst üste binen birlik ve ordudan hangisi: dokunulan noktaya birliğin merkezi mi, ordunun kolu mu yakın.
      // Yakın olan zaten seçiliyse diğeri seçilir (tam üst üste geldiklerinde ikisine de ulaşılabilsin).
      function pickOverlap(event, stackId, marchId) {
        const stack = unitEntities.find(item => item.id === stackId);
        const march = playerMarches.find(item => item.id === marchId);
        if (!stack || !march) return stack ? "unit" : "march";
        const point = $("map-svg").createSVGPoint();
        point.x = event.clientX; point.y = event.clientY;
        const { x, y } = point.matrixTransform($("map-svg").getScreenCTM().inverse());
        const length = Math.hypot(march.heading[0], march.heading[1]) || 1;
        const ux = march.heading[0] / length, uy = march.heading[1] / length;
        // Kol, komutandan geriye doğru ~60 birim uzanır: noktanın o doğru parçasına uzaklığı.
        const along = Math.max(0, Math.min(60, (march.x - x) * ux + (march.y - 6 - y) * uy));
        const toMarch = Math.hypot(x - (march.x - ux * along), y - (march.y - 6 - uy * along));
        const toUnit = Math.hypot(x - stack.x, y - stack.y);
        const nearer = toMarch < toUnit ? "march" : "unit";
        const selectedNearer = nearer === "march" ? selectedMarchId === march.id : selectedUnitIds.includes(stack.id);
        return selectedNearer ? (nearer === "march" ? "unit" : "march") : nearer;
      }
      const pointerDistance = () => {
        const [a, b] = [...activePointers.values()];
        return Math.hypot(a.x - b.x, a.y - b.y);
      };
      const cancelLongPress = () => { clearTimeout(longPressTimer); longPressTimer = null; };
      // Dokunuşun hedefi basıldığı anda okunur ve bırakınca işlenir: arada harita yeniden çizilse (yürüyen
      // ordular, rakip hamlesi) bile dokunuş kaybolmaz. Tarayıcının "click" olayına bu yüzden güvenilmez.
      mapWrap.addEventListener("pointerdown", event => {
        lastPointerType = event.pointerType;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        // İlk parmak yeni bir etkileşim başlatır: kaçırılmış eski "bırakma" kayıtları temizlenir.
        if (event.isPrimary) activePointers.clear();
        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (activePointers.size === 1) {
          didPan = false;
          panStart = { x: event.clientX - panOffset.x, y: event.clientY - panOffset.y, startX: event.clientX, startY: event.clientY };
          // Noktanın altındaki tüm katmanlara bakılır (bölge, ordunun altında da bulunur). Duran birlikle
          // yürüyen ordu üst üste geldiğinde dokunuşa yakın olan seçilir; aynı yere yeniden dokunmak diğerine geçer.
          const under = document.elementsFromPoint(event.clientX, event.clientY);
          const find = selector => under.map(element => element.closest(selector)).find(Boolean);
          let unitElement = find(".unit-entity");
          let marchElement = find("[data-march]");
          if (unitElement && marchElement) {
            const pick = pickOverlap(event, unitElement.dataset.unitEntity, marchElement.dataset.march);
            if (pick === "march") unitElement = null;
            else marchElement = null;
          }
          const regionElement = find(".region");
          tap = {
            unitId: unitElement ? unitElement.dataset.unitEntity : null,
            marchId: marchElement ? marchElement.dataset.march : null,
            regionId: regionElement ? Number(regionElement.dataset.region) : null,
            additive: event.ctrlKey || event.shiftKey || event.metaKey,
            consumed: false
          };
          cancelLongPress();
          if (event.pointerType !== "mouse" && tap.regionId) {
            const pressed = tap;
            longPressTimer = setTimeout(() => {
              if (tap !== pressed || didPan) return;
              pressed.consumed = true;
              if (navigator.vibrate) navigator.vibrate(15);
              openRegionMenu(pressed.regionId);
            }, 550);
          }
        } else if (activePointers.size === 2) {
          pinch = { distance: pointerDistance(), zoom: mapZoom };
          didPan = true;
          cancelLongPress();
        }
      });
      mapWrap.addEventListener("pointermove", event => {
        if (!activePointers.has(event.pointerId)) return;
        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pinch && activePointers.size === 2) {
          setZoom(pinch.zoom * pointerDistance() / Math.max(1, pinch.distance));
          return;
        }
        if (!panStart || activePointers.size !== 1) return;
        if (!didPan && Math.hypot(event.clientX - panStart.startX, event.clientY - panStart.startY) > 8) {
          didPan = true;
          cancelLongPress();
          mapWrap.classList.add("is-panning");
          mapWrap.setPointerCapture(event.pointerId);
        }
        if (!didPan) return;
        panOffset.x = event.clientX - panStart.x;
        panOffset.y = event.clientY - panStart.y;
        applyMapTransform();
      });
      const endPointer = event => {
        const wasTracked = activePointers.delete(event.pointerId);
        cancelLongPress();
        if (activePointers.size < 2) pinch = null;
        if (activePointers.size === 1) {
          const [rest] = activePointers.values();
          panStart = { x: rest.x - panOffset.x, y: rest.y - panOffset.y, startX: rest.x, startY: rest.y };
        }
        if (!activePointers.size) {
          panStart = null;
          mapWrap.classList.remove("is-panning");
          if (wasTracked && event.type === "pointerup" && tap && !tap.consumed && !didPan) handleTap(tap);
          tap = null;
        }
      };
      // Bırakma haritanın dışında olsa da yakalansın diye pencere düzeyinde dinlenir.
      window.addEventListener("pointerup", endPointer);
      window.addEventListener("pointercancel", endPointer);
      mapWrap.addEventListener("contextmenu", event => {
        event.preventDefault();
        // Dokunmatikte basılı tutma kendi zamanlayıcımızla açılır; tarayıcının menü olayı yok sayılır.
        if (lastPointerType !== "mouse") return;
        const region = event.target.closest(".region");
        if (region) openRegionMenu(Number(region.dataset.region));
      });
      mapWrap.addEventListener("wheel", event => {
        event.preventDefault();
        setZoom(mapZoom + (event.deltaY < 0 ? .2 : -.2));
      }, { passive: false });
      $("zoom-in").addEventListener("click", () => setZoom(mapZoom + .5));
      $("zoom-out").addEventListener("click", () => setZoom(mapZoom - .5));
      $("zoom-fit").addEventListener("click", () => setZoom(1));
      window.addEventListener("resize", applyMapTransform);

      // ---- Düğmeler ----
      $("setup-form").addEventListener("submit", startGame);
      $("unit-list").addEventListener("click", event => {
        const button = event.target.closest("[data-unit]");
        if (button && !button.disabled) queueUnit(Number(button.dataset.unit));
      });
      $("defense-list").addEventListener("click", event => {
        const fixed = event.target.closest("[data-defense-fixed]");
        const mobile = event.target.closest("[data-defense-mobile]");
        if (fixed && !fixed.disabled) buildDefense(Number(fixed.dataset.defenseFixed), true);
        if (mobile && !mobile.disabled) buildDefense(Number(mobile.dataset.defenseMobile), false);
      });
      $("garrison-body").addEventListener("click", event => {
        const recruit = event.target.closest("[data-recruit]");
        if (recruit && !recruit.disabled && garrisonRegion !== null && gold >= 50) {
          gold -= 50;
          data[garrisonRegion][4] += 5;
          turn++;
          addBattleEffect(garrisonRegion, "defense");
          toast(`${data[garrisonRegion][0]} kalesine 5 asker yazıldı.`);
          render();
          return;
        }
        const button = event.target.closest("[data-g]");
        if (button) garrisonAction(button.dataset.g, Number(button.dataset.type), Number(button.dataset.n));
      });
      $("garrison-button").addEventListener("click", () => openGarrison(selected));
      $("garrison-close").addEventListener("click", closeGarrison);
      $("claim-button").addEventListener("click", () => {
        if ($("claim-button").disabled || !canPlayerClaim(selected)) return;
        data[selected][5] = "Müttefik"; gold -= 100; honor += 3; turn++;
        render(); toast(data[selected][0] + " artık senin sancağın.");
      });
      $("attack-open-button").addEventListener("click", () => openAttackForm(selected));
      $("repair-button").addEventListener("click", () => {
        const cost = repairCost(selected);
        if ($("repair-button").disabled || !isPlayer(selected) || !cost || gold < cost) return;
        gold -= cost;
        walls[selected] = maxWalls(selected);
        render();
        toast(`${data[selected][0]} surları onarıldı.`);
      });
      $("scout-button").addEventListener("click", () => {
        const r = data[selected];
        addBattleLog(`Gözetleme: ${r[0]} kale surları ${Math.round(walls[selected])}/${maxWalls(selected)}, garnizon ${r[4]}, durum ${r[5]}.`);
        turn++; render(); toast(r[0] + " gözetlendi.");
      });
      for (let slot = 1; slot <= 3; slot++) {
        $(`popup-unit-${slot}`).addEventListener("change", updateAttackSummary);
        $(`popup-count-${slot}`).addEventListener("input", updateAttackSummary);
      }
      $("popup-confirm-attack").addEventListener("click", confirmAttack);
      $("popup-cancel").addEventListener("click", closeMapActions);
      $("popup-close").addEventListener("click", closeMapActions);
      $("unit-info-close").addEventListener("click", closeUnitInfo);
      $("unit-recall").addEventListener("click", recallSelectedMarch);
      $("unit-assault").addEventListener("click", assaultFromCamp);
      $("unit-select-region").addEventListener("click", selectAllUnitsInRegion);
      $("unit-merge").addEventListener("click", mergeSelectedUnits);
      $("unit-split").addEventListener("click", splitSelectedUnit);
      $("sound-button").addEventListener("click", () => sound.toggle());
      // Tarayıcılar sesi ancak bir kullanıcı etkileşiminden sonra açar.
      ["pointerdown", "keydown"].forEach(type => document.addEventListener(type, () => sound.context(), { once: true }));
      document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        closeMapActions();
        closeGarrison();
        if (!$("unit-info-popup").hidden) closeUnitInfo();
      });
      $("new-game-button").addEventListener("click", () => {
        if (!kingdomName || gameOver || confirm("Kayıtlı sefer silinecek. Yeni oyun başlasın mı?")) startNewGame();
      });
      $("end-new").addEventListener("click", startNewGame);
      $("end-view").addEventListener("click", () => { $("end-screen").hidden = true; });
      document.addEventListener("visibilitychange", () => { if (document.hidden) saveGame(); });
      window.addEventListener("pagehide", saveGame);

      // ---- Açılış ----
      $("start-region-input").innerHTML = Object.entries(data).map(([id, region]) => `<option value="${id}">${id}. ${region[0]}</option>`).join("");
      $("difficulty-options").insertAdjacentHTML("beforeend", Object.entries(DIFFICULTIES).map(([key, level], index) =>
        `<label><input type="radio" name="difficulty" value="${key}" ${key === "orta" ? "checked" : ""}><strong>${index + 1}. ${level.label}</strong><small>${level.note}</small></label>`
      ).join(""));
      renderSoundButton();
      render();
      const saved = readSave();
      if (saved) {
        const regionCount = Object.values(saved.data).filter(region => region[5] === "Müttefik").length;
        const level = (DIFFICULTIES[saved.difficulty] || DIFFICULTIES.orta).label;
        $("resume-text").textContent = `${saved.kingdomName} · ${level} · Tur ${saved.turn} · ${regionCount} bölge · ${formatDuration(saved.elapsedSeconds || 0)}`;
        $("resume-box").hidden = false;
        $("resume-button").addEventListener("click", () => {
          try { applySave(saved); }
          catch (error) {
            // Bozuk ya da eski biçimli kayıt: yarım yüklenmiş bir oyun yerine temiz başlangıç.
            console.error("Kayıt yüklenemedi:", error);
            clearSave();
            location.reload();
          }
        });
      }
      setInterval(() => {
        if (gameOver || !kingdomName) return;
        collectProduction();
        processProductionQueue();
        elapsedSeconds++;
        // Surlar ~4 dakikada boştan tama kendini onarır (her iki taraf için).
        Object.keys(walls).forEach(id => { walls[id] = Math.min(maxWalls(id), walls[id] + maxWalls(id) * .004); });
        renderCastles();
        // Toparlanan kampların geri sayımı (sıfıra indiği saniye de bir kez çizilir).
        if (unitEntities.some(stack => isCamp(stack) && (stack.readyAt || 0) >= elapsedSeconds)) renderUnitEntities();
        if (!$("unit-info-popup").hidden && selectedUnitId) updateAssaultButton();
        // Sekme arka plandayken rakip beklemede; oyuncu yokken saldırı olmasın.
        if (!document.hidden && --rival.nextMove <= 0) {
          rival.nextMove = RIVAL.moveSeconds;
          rivalTurn();
        }
        updateResourceStrip();
        renderRivalPanel();
        renderProductionQueue();
        refreshAffordability();
        if (elapsedSeconds % 5 === 0) saveGame();
      }, 1000);
    })();
