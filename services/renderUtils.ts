import { COLORS, TILE_SIZE, VIEW_WIDTH, VIEW_HEIGHT, getTerrainAt, getPOIAt, POD_POS, GUARDIAN_POS } from '../constants';
import { Player, Enemy, TerrainType, POIType, Bot, CombatEffect } from '../types';
import { imageLoader } from './ImageLoader';

export const drawWorld = (ctx: CanvasRenderingContext2D, player: Player, time: number) => {
  const halfW = Math.floor(VIEW_WIDTH / 2);
  const halfH = Math.floor(VIEW_HEIGHT / 2);

  // Draw Terrain
  for (let relX = -halfW; relX <= halfW; relX++) {
    for (let relY = -halfH; relY <= halfH; relY++) {
      const worldX = player.pos.x + relX;
      const worldY = player.pos.y + relY;
      
      const screenX = (relX + halfW) * TILE_SIZE;
      const screenY = (relY + halfH) * TILE_SIZE;

      const terrain = getTerrainAt(worldX, worldY, player.planetConfig.theme);
      
      // Default to floor
      let spriteKey = 'floor_metal';
      let rotation = 0;
      
      if (terrain === TerrainType.WALL) {
          spriteKey = 'wall_tech';
      } else if (terrain === TerrainType.MAGMA) {
          spriteKey = 'magma_tile';
      } else if (terrain === TerrainType.GLITCH) {
          spriteKey = 'glitch_tile';
      } else if (terrain === TerrainType.JUNGLE) {
          spriteKey = 'jungle_floor';
      } else if (terrain === TerrainType.CRYSTAL) {
          spriteKey = 'crystal_floor';
      } else if (terrain === TerrainType.ACID_POOL) {
          spriteKey = 'jungle_floor'; // Tint later
      }

      const img = imageLoader.getImage(spriteKey);
      if (img) {
          ctx.save();
          if (terrain === TerrainType.ACID_POOL) {
              ctx.filter = 'hue-rotate(90deg) brightness(1.5)';
          }
          ctx.drawImage(img, screenX, screenY, TILE_SIZE, TILE_SIZE);
          ctx.restore();
      } else {
         // Fallback Primitive Rendering
          if (terrain === TerrainType.WALL) {
            ctx.fillStyle = COLORS.wallDark;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          } else {
            ctx.fillStyle = COLORS.groundDark;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
      }

      // POI Rendering
        const poiKey = `${worldX},${worldY}`;
        const poi = getPOIAt(worldX, worldY);
        const visited = player.visitedPOIs[poiKey];

        if (poi === POIType.POD) {
             drawPod(ctx, screenX, screenY, time);
        } else if (player.quest.stage === 'DEFEAT_GUARDIAN' && worldX === GUARDIAN_POS.x && worldY === GUARDIAN_POS.y) {
             drawBossSprite(ctx, screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, time);
        } else if (poi !== POIType.NONE && !visited) {
             drawPOI(ctx, screenX, screenY, poi, time);
        }
    }
  }

  // Draw Reserves (Base Camp)
  const distToPodX = POD_POS.x - player.pos.x;
  const distToPodY = POD_POS.y - player.pos.y;
  
  if (Math.abs(distToPodX) < VIEW_WIDTH/2 + 2 && Math.abs(distToPodY) < VIEW_HEIGHT/2 + 2) {
    player.reserves.forEach((bot, idx) => {
       const offsetTime = time / 1000;
       const offsetX = Math.sin(offsetTime + idx) * 1.5;
       const offsetY = Math.cos(offsetTime * 0.8 + idx) * 1.5;
       
       const botWorldX = POD_POS.x + offsetX;
       const botWorldY = POD_POS.y + offsetY;

       const screenX = (botWorldX - player.pos.x + halfW) * TILE_SIZE;
       const screenY = (botWorldY - player.pos.y + halfH) * TILE_SIZE;
       
       drawBotMini(ctx, screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, bot, COLORS.neonGreen);
    });
  }

  // Draw Player
  const centerX = halfW * TILE_SIZE;
  const centerY = halfH * TILE_SIZE;
  const activeBot = player.team[player.activeSlot];
  
  drawPlayerSprite(ctx, centerX, centerY, player.facing, time, activeBot);

  // Draw Compass
  if (player.quest.stage !== 'COMPLETED') {
     drawCompass(ctx, distToPodX, distToPodY, centerX + TILE_SIZE/2, centerY + TILE_SIZE/2, time);
  }
};

const drawPlayerSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, facing: string, time: number, bot: Bot) => {
    // Determine Sprite
    let botKey = 'scout_bot';
    if (bot.class === 'ASSAULT') botKey = 'assault_bot';
    if (bot.class === 'TANK') botKey = 'tank_bot';
    if (bot.class === 'TECH') botKey = 'tech_bot';

    const img = imageLoader.getImage(botKey);
    const bob = Math.sin(time / 200) * 2;

    if (img) {
        ctx.drawImage(img, x, y + bob, TILE_SIZE, TILE_SIZE);
        
        // Facing indicator (small arrow?)
        ctx.fillStyle = COLORS.neonYellow;
        ctx.beginPath();
        let fx = x + TILE_SIZE/2; 
        let fy = y + TILE_SIZE/2;
        
        // Simple direction dot for now
        if (facing === 'UP') fy -= 18;
        if (facing === 'DOWN') fy += 18;
        if (facing === 'LEFT') fx -= 18;
        if (facing === 'RIGHT') fx += 18;
        // ctx.arc(fx, fy, 2, 0, Math.PI*2);
        // ctx.fill(); 
        
    } else {
        // Fallback
        ctx.fillStyle = '#0f0';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
};

export const drawCombatScene = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, player: Player, enemy: Enemy | null, combatEffect: CombatEffect | null) => {
  if (!enemy) return;

  const w = width * TILE_SIZE;
  const h = height * TILE_SIZE;

  // Background
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, w, h);
  
  // Grid Floor
  ctx.strokeStyle = COLORS.neonPurple;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  for(let i = 0; i < 20; i++) {
      let y = h/2 + Math.pow(i, 1.5) * 2; 
      if (y > h) break;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
  }
  for(let i = -10; i < 20; i++) {
      ctx.moveTo(w/2 + (i-5)*50, h/2);
      ctx.lineTo(w/2 + (i-5)*400, h);
  }
  ctx.stroke();
  ctx.globalAlpha = 1.0;

  const activeBot = player.team[player.activeSlot];

  // Coordinates
  const pX = w * 0.25;
  const pY = h * 0.75;
  const eX = w * 0.75;
  const eY = h * 0.45;

  // -- Draw Active Bot --
  ctx.save();
  ctx.translate(pX, pY);
  ctx.scale(3.5, 3.5); 
  
  // Use Sprite for Combat too
  let botKey = 'scout_bot';
  if (activeBot.class === 'ASSAULT') botKey = 'assault_bot';
  if (activeBot.class === 'TANK') botKey = 'tank_bot';
  if (activeBot.class === 'TECH') botKey = 'tech_bot';
  
  const botImg = imageLoader.getImage(botKey);
  if (botImg) {
      // center sprite
      ctx.drawImage(botImg, -16, -16, 32, 32);
  } else {
     // fallback
     ctx.fillStyle = '#0f0';
     ctx.fillRect(-10, -20, 20, 40);
  }

  if ((activeBot.tempShield || 0) > 0) {
    ctx.strokeStyle = COLORS.neonBlue;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }
  ctx.restore();

  // -- Draw Enemy --
  const float = Math.sin(time / 300) * 12;
  ctx.save();
  ctx.translate(eX, eY + float);
  const scale = enemy.isBoss ? 6 : 4;
  ctx.scale(scale, scale);
  drawEnemySprite(ctx, enemy, time);
  ctx.restore();

  // -- Combat Effects --
  if (combatEffect) {
      drawCombatEffect(ctx, combatEffect, pX, pY - 20, eX, eY + float, time);
  }
};

const drawCombatEffect = (ctx: CanvasRenderingContext2D, effect: CombatEffect, startX: number, startY: number, endX: number, endY: number, time: number) => {
    const elapsed = time - effect.startTime;
    if (elapsed > effect.duration) return;
    const progress = elapsed / effect.duration;

    const sx = effect.source === 'PLAYER' ? startX : endX;
    const sy = effect.source === 'PLAYER' ? startY : endY;
    const tx = effect.source === 'PLAYER' ? endX : startX;
    const ty = effect.source === 'PLAYER' ? endY : startY;

    if (effect.type === 'LASER') {
        ctx.strokeStyle = COLORS.neonRed;
        ctx.lineWidth = 4 * (1 - progress);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        
        if (progress > 0.5) {
           ctx.fillStyle = '#fff';
           ctx.beginPath();
           ctx.arc(tx, ty, 20 * progress, 0, Math.PI*2);
           ctx.fill();
        }
    } else if (effect.type === 'RAILGUN') {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 6 * (1-progress);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.beginPath();
        ctx.arc(tx, ty, 40 * progress, 0, Math.PI*2);
        ctx.fill();

    } else if (effect.type === 'ELECTRIC') {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        
        const segments = 10;
        for(let i=1; i<=segments; i++) {
           const t = i / segments;
           const cx = sx + (tx - sx) * t;
           const cy = sy + (ty - sy) * t;
           const jitter = Math.random() * 40 - 20;
           ctx.lineTo(cx + jitter, cy + jitter);
        }
        ctx.stroke();

    } else if (effect.type === 'EXPLOSION') {
        const size = 100 * Math.sin(progress * Math.PI);
        ctx.fillStyle = COLORS.neonRed;
        ctx.beginPath();
        ctx.arc(tx, ty, size, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = COLORS.neonYellow;
        ctx.beginPath();
        ctx.arc(tx, ty, size * 0.7, 0, Math.PI*2);
        ctx.fill();

    } else if (effect.type === 'SHIELD') {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.beginPath();
        ctx.arc(sx, sy, 50 + Math.sin(progress*10)*5, 0, Math.PI*2);
        ctx.fill();
        
        ctx.strokeStyle = COLORS.neonBlue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 50 + Math.sin(progress*10)*5, 0, Math.PI*2);
        ctx.stroke();

    } else if (effect.type === 'REPAIR') {
        ctx.fillStyle = COLORS.neonGreen;
        ctx.font = '20px monospace';
        ctx.fillText('+', sx, sy - (progress * 50));
        ctx.fillText('+', sx + 20, sy - (progress * 60));
        ctx.fillText('+', sx - 20, sy - (progress * 40));
    } else if (effect.type === 'MELEE') {
        const cx = sx + (tx - sx) * progress;
        const cy = sy + (ty - sy) * progress;
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI*2);
        ctx.fill();
        
        if (progress > 0.8) {
           ctx.strokeStyle = '#fff';
           ctx.lineWidth = 3;
           ctx.beginPath();
           ctx.arc(tx, ty, 30, 0, Math.PI*2);
           ctx.stroke();
        }
    }
};

const drawEnemySprite = (ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) => {
  // Temporary fallback until Enemy Sprites are generated
  // Stick with primitives for enemies for now
  
  ctx.fillStyle = COLORS.enemyBody;
  
  if (enemy.type === 'CORE_GUARDIAN') {
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI*2);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 8 + Math.sin(time/100)*2, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
  }
  else if (enemy.type === 'SCRAP_DRONE' || enemy.type === 'TESLA_DROID') {
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(10, 5);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = enemy.type === 'TESLA_DROID' ? COLORS.neonPurple : COLORS.neonRed;
      ctx.beginPath();
      ctx.arc(0, -2, 3, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#aaa';
      ctx.beginPath();
      ctx.moveTo(-15, -10); ctx.lineTo(15, -10);
      ctx.stroke();

  } else if (enemy.type === 'HEAVY_MECH' || enemy.type === 'SHIELD_BREAKER') {
      ctx.fillRect(-12, -14, 24, 28);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-16, -12, 4, 10);
      ctx.fillRect(12, -12, 4, 10);
      ctx.fillStyle = enemy.type === 'SHIELD_BREAKER' ? '#f59e0b' : COLORS.neonRed;
      ctx.fillRect(-10, -8, 20, 6);
      ctx.fillStyle = '#333';
      ctx.fillRect(-8, 14, 6, 10);
      ctx.fillRect(2, 14, 6, 10);

  } else if (enemy.type === 'NANITE_SWARM') {
      ctx.fillStyle = '#a855f7';
      for(let i=0; i<5; i++) {
        const ox = Math.sin(time/100 + i) * 8;
        const oy = Math.cos(time/120 + i) * 8;
        ctx.beginPath();
        ctx.arc(ox, oy, 4, 0, Math.PI*2);
        ctx.fill();
      }
      
  } else if (enemy.type === 'JUNKER_BEHEMOTH') {
     ctx.fillStyle = '#3f3f46';
     ctx.beginPath();
     ctx.arc(0, 0, 18, 0, Math.PI*2, false); 
     ctx.fill();
     ctx.fillStyle = '#18181b';
     ctx.fillRect(-22, 5, 44, 10);
     ctx.fillStyle = '#b91c1c';
     ctx.fillRect(-8, -15, 16, 10);
     ctx.strokeStyle = COLORS.neonYellow;
     ctx.lineWidth = 2;
     ctx.beginPath();
     ctx.moveTo(0, -15); ctx.lineTo(0, -25);
     ctx.stroke();

  } else if (enemy.type === 'STEALTH_SPIDER') {
      ctx.fillStyle = '#1e293b'; 
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 12, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#22c55e'; 
      ctx.lineWidth = 2;
      for(let i=0; i<4; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const angle = (Math.PI/4) + (i * Math.PI/2);
          const legX = Math.cos(angle) * 20;
          const legY = Math.sin(angle) * 20;
          ctx.lineTo(legX, legY);
          ctx.stroke();
      }
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-3, -6, 2, 0, Math.PI*2);
      ctx.arc(3, -6, 2, 0, Math.PI*2);
      ctx.fill();

  } else if (enemy.type === 'CRYSTAL_CRAB') {
      ctx.fillStyle = COLORS.crystalLight;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(0, -10);
      ctx.lineTo(15, 0);
      ctx.lineTo(0, 10);
      ctx.fill();
      ctx.fillStyle = COLORS.crystalDark;
      ctx.beginPath();
      ctx.fillRect(-10, -5, 20, 10);
      ctx.strokeStyle = COLORS.crystalLight;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(-20, -15);
      ctx.moveTo(10, 0); ctx.lineTo(20, -15);
      ctx.stroke();

  } else if (enemy.type === 'PYRO_MECH') {
      ctx.fillStyle = '#b91c1c'; 
      ctx.beginPath();
      ctx.roundRect(-15, -20, 30, 40, 5); 
      ctx.fill();
      ctx.fillStyle = '#ffedd5'; 
      ctx.fillRect(-8, -5, 16, 10);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-22, -5, 7, 20);
      ctx.fillRect(15, -5, 7, 20);

  } else if (enemy.type === 'PHANTOM_BOT') {
      ctx.globalAlpha = 0.7; 
      ctx.fillStyle = '#22d3ee'; 
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(15, 10);
      ctx.lineTo(0, 5);
      ctx.lineTo(-15, 10);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#000';
      ctx.fillRect(-5, -10, 3, 3);
      ctx.fillRect(2, -10, 3, 3);

  } else {
      ctx.fillStyle = '#4c1d95';
      ctx.beginPath();
      ctx.arc(0,0, 12, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = COLORS.neonGreen;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-15, 0); ctx.lineTo(15, 0);
      ctx.moveTo(0, -15); ctx.lineTo(0, 15);
      ctx.stroke();
  }
};

const drawBossSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
   const pulse = Math.sin(time / 100) * 3;
   ctx.fillStyle = '#000';
   ctx.beginPath();
   ctx.arc(x, y, 24, 0, Math.PI*2);
   ctx.fill();

   ctx.strokeStyle = '#ef4444';
   ctx.lineWidth = 3;
   ctx.beginPath();
   ctx.arc(x, y, 20 + pulse, 0, Math.PI*2);
   ctx.stroke();

   ctx.fillStyle = '#ef4444';
   ctx.beginPath();
   ctx.arc(x, y, 10, 0, Math.PI*2);
   ctx.fill();
};

const drawCompass = (ctx: CanvasRenderingContext2D, dx: number, dy: number, cx: number, cy: number, time: number) => {
   const dist = Math.sqrt(dx*dx + dy*dy);
   if (dist < 2) return; 

   const angle = Math.atan2(dy, dx);
   const radius = 120; 
   
   const arrowX = cx + Math.cos(angle) * radius;
   const arrowY = cy + Math.sin(angle) * radius;

   ctx.save();
   ctx.translate(arrowX, arrowY);
   ctx.rotate(angle);
   
   ctx.fillStyle = COLORS.pod;
   ctx.shadowBlur = 5;
   ctx.shadowColor = COLORS.pod;
   
   ctx.beginPath();
   ctx.moveTo(10, 0);
   ctx.lineTo(-10, -7);
   ctx.lineTo(-10, 7);
   ctx.fill();

   ctx.restore();
};

const drawPod = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.ellipse(x + 24, y + 35, 20, 8, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = COLORS.pod;
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 5);
  ctx.bezierCurveTo(x + 48, y + 15, x + 48, y + 40, x + 24, y + 45);
  ctx.bezierCurveTo(x + 0, y + 40, x + 0, y + 15, x + 24, y + 5);
  ctx.fill();

  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.arc(x + 24, y + 20, 8, 0, Math.PI*2);
  ctx.fill();
  
  const steam = Math.sin(time / 200);
  if (steam > 0) {
    ctx.fillStyle = 'rgba(200,200,200,0.3)';
    ctx.beginPath();
    ctx.arc(x + 24 + steam * 5, y + 5 - steam * 10, 5, 0, Math.PI*2);
    ctx.fill();
  }
};

const drawBotMini = (ctx: CanvasRenderingContext2D, x: number, y: number, bot: Bot, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.fillRect(x-2, y-2, 4, 2);
};

const drawPOI = (ctx: CanvasRenderingContext2D, x: number, y: number, type: POIType, time: number) => {
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;

  if (type === POIType.CACHE) {
    const glow = Math.sin(time / 200) * 5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.neonYellow;
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(x + 12, y + 12, 24, 24);
    ctx.fillStyle = COLORS.neonYellow;
    ctx.fillRect(x + 14, y + 18 + glow/5, 20, 2);
    ctx.shadowBlur = 0;
  } else if (type === POIType.NPC) {
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.fillRect(cx - 3, cy - 4, 2, 2);
    ctx.fillRect(cx + 1, cy - 4, 2, 2);
    if (Math.floor(time / 500) % 2 === 0) {
      ctx.fillStyle = 'white';
      ctx.fillText('?', cx + 6, cy - 10);
    }
  } else if (type === POIType.DERELICT) {
    ctx.fillStyle = '#4b5563';
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.4);
    ctx.fillRect(-10, -8, 20, 16);
    ctx.restore();
    if (Math.random() > 0.95) {
      ctx.fillStyle = COLORS.neonYellow;
      ctx.fillRect(cx, cy, 2, 2);
    }
  }
};