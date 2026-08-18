import { Service } from '.';
import { storage } from 'providers/storage';
import type { TagMap } from 'interface';
import type { ReleaseCheckData } from 'plugin/database-updater';
import { Logger } from './logger';
import type { JsonValue } from 'type-fest';
import type { ListenerId, Listener } from 'providers/common/storage';

export const enum ImageLevel {
    hide,
    nonH,
    r18,
    r18g,
}

export interface ConfigData {
    translateUi: boolean;
    translateTag: boolean;
    bilingualUi: boolean;
    bilingualTag: boolean;
    translateTimestamp: boolean;
    showIntroduce: boolean;
    showIcon: boolean;
    introduceImageLevel: ImageLevel;
    autoUpdate: boolean;
    tagTip: boolean;
    overrideDbUrl: string;
}

export interface StorageItems {
    config: ConfigData;
    extensionCheck: number;
    database: undefined | TagMap;
    databaseInfo:
        | undefined
        | {
              sha: string;
              /** 上次检查时间 */
              check: number;
              /** 插件数据结构版本 */
              version: number;
          };

    release: undefined | ReleaseCheckData;
}

@Service()
export class Storage {
    constructor(readonly logger: Logger) {
        Object.defineProperty(globalThis, '__eh_storage__', {
            value: () => {
                (async () => {
                    const keys = await this.keys();
                    for (const key of keys) {
                        console.log(key, await this.get(key));
                    }
                })().catch(logger.error);
            },
        });
        this.migrate().catch(logger.error);
    }

    async get<K extends keyof StorageItems>(key: K): Promise<StorageItems[K]> {
        const value = await storage.get(key);
        if (value == null) return this.defaults[key];
        // 旧配置的 config 可能缺少新增字段，与默认值浅合并保证缺省生效
        if (key === 'config') {
            return { ...this.defaults.config, ...(value as unknown as ConfigData) } as StorageItems[K];
        }
        return value as StorageItems[K];
    }
    async set<T extends keyof StorageItems>(key: T, value: StorageItems[T] | undefined): Promise<void> {
        if (value == null) return this.delete(key);
        return storage.set(key, value as JsonValue);
    }
    async delete<T extends keyof StorageItems>(key: T): Promise<void> {
        return await storage.delete(key);
    }
    async keys(): Promise<Array<keyof StorageItems>> {
        return (await storage.keys()) as Array<keyof StorageItems>;
    }

    on<T extends keyof StorageItems>(
        key: T,
        listener: (key: T, oldValue: StorageItems[T] | undefined, newValue: StorageItems[T] | undefined) => unknown,
    ): ListenerId {
        return storage.on(key, listener as Listener);
    }

    off<T extends keyof StorageItems>(key: T, listener: ListenerId): void {
        return storage.off(key, listener);
    }

    async migrate(): Promise<void> {
        const keys = await this.keys();
        const keysInCurrentVersion = Object.keys(this.defaults);
        const deletes = keys.filter((k) => !keysInCurrentVersion.includes(k));
        if (deletes.length === 0) return;

        this.logger.log(`迁移存储版本，删除 `, deletes);
        for (const key of deletes) {
            await this.delete(key);
        }
    }

    readonly defaults: Readonly<StorageItems> = {
        extensionCheck: 0,
        config: {
            translateUi: true,
            translateTag: true,
            bilingualUi: false,
            bilingualTag: true,
            translateTimestamp: true,
            showIntroduce: true,
            showIcon: true,
            introduceImageLevel: ImageLevel.r18g,
            autoUpdate: true,
            tagTip: true,
            overrideDbUrl: '',
        },
        database: undefined,
        databaseInfo: undefined,
        release: undefined,
    };
}
