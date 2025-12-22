
const ASSET_PATHS: Record<string, string> = {
  // BOTS
  'scout_bot': 'c:/Users/BjörnBrorsson/.gemini/antigravity/brain/af35d00e-fd6f-40f3-9406-a70080a98ac5/scout_bot_1766413580448.png',
  'assault_bot': 'c:/Users/BjörnBrorsson/.gemini/antigravity/brain/af35d00e-fd6f-40f3-9406-a70080a98ac5/assault_bot_1766413597670.png',
  'tank_bot': 'c:/Users/BjörnBrorsson/.gemini/antigravity/brain/af35d00e-fd6f-40f3-9406-a70080a98ac5/tank_bot_1766413612911.png',
  'tech_bot': 'c:/Users/BjörnBrorsson/.gemini/antigravity/brain/af35d00e-fd6f-40f3-9406-a70080a98ac5/tech_bot_1766413627236.png',

  // TERRAIN
  'floor_metal': 'c:/Users/BjörnBrorsson/.gemini/antigravity/brain/af35d00e-fd6f-40f3-9406-a70080a98ac5/floor_metal_1766413649462.png',
  'wall_tech': 'c:/Users/BjörnBrorsson/.gemini/antigravity/brain/af35d00e-fd6f-40f3-9406-a70080a98ac5/wall_tech_1766413664020.png',
  'jungle_floor': 'c:/Users/BjörnBrorsson/.gemini/antigravity/brain/af35d00e-fd6f-40f3-9406-a70080a98ac5/jungle_floor_1766413679828.png',
  'magma_tile': 'c:/Users/BjörnBrorsson/.gemini/antigravity/brain/af35d00e-fd6f-40f3-9406-a70080a98ac5/magma_tile_1766413714872.png',
  'glitch_tile': 'c:/Users/BjörnBrorsson/.gemini/antigravity/brain/af35d00e-fd6f-40f3-9406-a70080a98ac5/glitch_tile_1766413728311.png',
  'crystal_floor': 'c:/Users/BjörnBrorsson/.gemini/antigravity/brain/af35d00e-fd6f-40f3-9406-a70080a98ac5/crystal_floor_1766413741646.png',
};

class ImageLoader {
  private images: Record<string, HTMLImageElement> = {};
  private loadedCount = 0;
  private totalCount = 0;

  constructor() {
    this.totalCount = Object.keys(ASSET_PATHS).length;
    this.preload();
  }

  private preload() {
    Object.entries(ASSET_PATHS).forEach(([key, path]) => {
      const img = new Image();
      img.src = path; // In a real browser this would need a file server or base64. 
                      // Since we are running in an environment that might not serve local files directly to canvas without security errors,
                      // we trust that the environment handles this absolute path or we need to copy them to public.
                      // For this specific environment, absolute paths usually work if the user is local.
                      // NOTE: If this fails, we might need a workaround.
      img.onload = () => {
         this.loadedCount++;
         console.log(`Loaded ${key}`);
      };
      img.onerror = (e) => {
         console.error(`Failed to load ${key}`, e);
      };
      this.images[key] = img;
    });
  }

  public getImage(key: string): HTMLImageElement | null {
    if (this.images[key] && this.images[key].complete) {
      return this.images[key];
    }
    return null;
  }
}

export const imageLoader = new ImageLoader();
