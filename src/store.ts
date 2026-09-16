import * as fs from 'node:fs';

export interface KeyValue {
  value: string | string[];
  expiresAt?: number;
}

export class Store {
  #data = new Map<string, KeyValue>();

  constructor(private dumpPath: string = "dump.json") {}

  get(key: string): string | null | string[] {
    const value = this.#data.get(key);
    if (!value) {
      return null;
    }
    if (value.expiresAt && value.expiresAt < Date.now()) {
      this.#data.delete(key);
      return null;
    }
    return value.value;
  }

  exists(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    if (!this.exists(key)) {
      return false;
    }
    return this.#data.delete(key);
  }

  set(key: string, value: string | string[], expiresAt?: number): void {
    this.#data.set(key, { value, expiresAt });
  }

  lpush(key: string, values: string[]): number | null {
    if (!this.exists(key)) {
      const list: string[] = [];
      for (const value of values) {
        list.unshift(value);
      }
      this.#data.set(key, { value: list });
      return list.length;
    }

    const entry = this.#data.get(key);
    if (!entry || !Array.isArray(entry.value)) {
      return null;
    }

    for (const value of values) {
      entry.value.unshift(value);
    }
    return entry.value.length;
  }

  rpush(key: string, values: string[]): number | null {
    if (!this.exists(key)) {
      const list = [...values];
      this.#data.set(key, { value: list });
      return list.length;
    }

    const entry = this.#data.get(key);
    if (!entry || !Array.isArray(entry.value)) {
      return null;
    }

    entry.value.push(...values);
    return entry.value.length;
  }

  save(targetPath: string = this.dumpPath): void {
    for (const [key, value] of this.#data.entries()) {
      if (value.expiresAt && value.expiresAt <= Date.now()) {
        this.#data.delete(key);
      }
    }
    const dataForFile = JSON.stringify(Array.from(this.#data.entries()), null, 2);
    const tmpPath = `${targetPath}.tmp`;
    fs.writeFileSync(tmpPath, dataForFile, "utf8");
    fs.renameSync(tmpPath, targetPath);
  }

  load(targetPath: string = this.dumpPath): void {
    if (!fs.existsSync(targetPath)) {
      return;
    }
    try {
      const raw = fs.readFileSync(targetPath, "utf8");
      const entries = JSON.parse(raw);
      if (Array.isArray(entries)) {
        this.#data = new Map(entries);
      }
    } catch (err) {
      console.error(`Failed to load dump from ${targetPath}:`, err);
    }
  }
}

export const store = new Store();