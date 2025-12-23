interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0
  };

  set(key: string, data: T, ttl: number = 5 * 60 * 1000) {
    this.stats.sets++;
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Cache.Set] Key: ${key.substring(0, 50)}...`);
    }
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      if (process.env.NODE_ENV !== 'production') {
        console.log(`%c[Cache.Miss] %c${key.substring(0, 50)}...`, "color: #ffa500", "color: inherit");
      }
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.stats.misses++;
      this.cache.delete(key);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`%c[Cache.Expired] %c${key.substring(0, 50)}...`, "color: #ff4500", "color: inherit");
      }
      return null;
    }

    this.stats.hits++;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`%c[Cache.Hit] %c${key.substring(0, 50)}... (Total Hits: ${this.stats.hits})`, "color: #4caf50", "color: inherit");
    }
    return entry.data;
  }

  getStats() {
    return this.stats;
  }

  clear(keyPattern?: string) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Cache.Clear] Pattern: ${keyPattern || 'all'}`);
    }
    if (!keyPattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
      }
    }
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }
}

export const memoryCache = new SimpleCache<any>();
