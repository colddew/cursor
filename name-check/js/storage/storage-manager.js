// 存储管理器
class StorageManager {
    constructor() {
        this.prefix = AppConfig.storage.prefix;
        this.version = AppConfig.storage.version;
        this.storage = this._initializeStorage();
        this.migrations = new Map();
    }

    /**
     * 初始化存储
     * @returns {Object} 存储对象
     */
    _initializeStorage() {
        try {
            // 检查localStorage是否可用
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return localStorage;
        } catch (error) {
            console.error('localStorage不可用:', error);
            // 降级到内存存储
            return new MemoryStorage();
        }
    }

    /**
     * 生成存储键名
     * @param {string} key - 原始键名
     * @returns {string} 带前缀的键名
     */
    _getStorageKey(key) {
        return `${this.prefix}${key}`;
    }

    /**
     * 设置数据
     * @param {string} key - 键名
     * @param {*} value - 值
     * @returns {boolean} 是否成功
     */
    set(key, value) {
        try {
            const storageKey = this._getStorageKey(key);
            const data = {
                value: value,
                timestamp: Date.now(),
                version: this.version
            };

            this.storage.setItem(storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`存储数据失败 [${key}]:`, error);
            return false;
        }
    }

    /**
     * 获取数据
     * @param {string} key - 键名
     * @param {*} defaultValue - 默认值
     * @returns {*} 存储的值
     */
    get(key, defaultValue = null) {
        try {
            const storageKey = this._getStorageKey(key);
            const item = this.storage.getItem(storageKey);

            if (!item) {
                return defaultValue;
            }

            const data = JSON.parse(item);

            // 检查数据是否过期
            if (this._isExpired(data)) {
                this.remove(key);
                return defaultValue;
            }

            // 检查版本是否需要迁移
            if (this._needsMigration(data)) {
                this._migrateData(key, data);
            }

            return data.value;
        } catch (error) {
            console.error(`获取数据失败 [${key}]:`, error);
            return defaultValue;
        }
    }

    /**
     * 删除数据
     * @param {string} key - 键名
     * @returns {boolean} 是否成功
     */
    remove(key) {
        try {
            const storageKey = this._getStorageKey(key);
            this.storage.removeItem(storageKey);
            return true;
        } catch (error) {
            console.error(`删除数据失败 [${key}]:`, error);
            return false;
        }
    }

    /**
     * 清空所有应用数据
     * @returns {boolean} 是否成功
     */
    clear() {
        try {
            const keys = this._getAllKeys();
            keys.forEach(key => {
                this.storage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }

    /**
     * 检查键是否存在
     * @param {string} key - 键名
     * @returns {boolean} 是否存在
     */
    has(key) {
        const storageKey = this._getStorageKey(key);
        return this.storage.getItem(storageKey) !== null;
    }

    /**
     * 获取所有应用键名
     * @returns {Array} 键名数组
     */
    getKeys() {
        const storageKeys = this._getAllKeys();
        return storageKeys
            .filter(key => key.startsWith(this.prefix))
            .map(key => key.substring(this.prefix.length));
    }

    /**
     * 获取存储大小（字节）
     * @returns {number} 存储大小
     */
    getSize() {
        try {
            let totalSize = 0;
            const keys = this._getAllKeys();

            keys.forEach(key => {
                const value = this.storage.getItem(key);
                if (value) {
                    totalSize += new Blob([value]).size;
                }
            });

            return totalSize;
        } catch (error) {
            console.error('获取存储大小失败:', error);
            return 0;
        }
    }

    /**
     * 导出所有数据
     * @returns {Object} 导出的数据
     */
    export() {
        const data = {};
        const keys = this.getKeys();

        keys.forEach(key => {
            data[key] = this.get(key);
        });

        return {
            version: this.version,
            exportedAt: DateUtils.now(),
            data: data
        };
    }

    /**
     * 导入数据
     * @param {Object} exportData - 导出的数据
     * @param {boolean} merge - 是否合并（默认覆盖）
     * @returns {boolean} 是否成功
     */
    import(exportData, merge = false) {
        try {
            if (!exportData || !exportData.data) {
                throw new Error('无效的导入数据');
            }

            if (!merge) {
                this.clear();
            }

            Object.keys(exportData.data).forEach(key => {
                this.set(key, exportData.data[key]);
            });

            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }

    /**
     * 注册数据迁移
     * @param {string} fromVersion - 源版本
     * @param {string} toVersion - 目标版本
     * @param {Function} migrator - 迁移函数
     */
    registerMigration(fromVersion, toVersion, migrator) {
        this.migrations.set(`${fromVersion}->${toVersion}`, migrator);
    }

    /**
     * 获取所有存储键名
     * @returns {Array} 键名数组
     */
    _getAllKeys() {
        const keys = [];
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key) {
                keys.push(key);
            }
        }
        return keys;
    }

    /**
     * 检查数据是否过期
     * @param {Object} data - 存储的数据
     * @returns {boolean} 是否过期
     */
    _isExpired(data) {
        if (!AppConfig.storage.expiration) {
            return false;
        }

        const now = Date.now();
        return (now - data.timestamp) > AppConfig.storage.expiration;
    }

    /**
     * 检查数据是否需要迁移
     * @param {Object} data - 存储的数据
     * @returns {boolean} 是否需要迁移
     */
    _needsMigration(data) {
        return data.version !== this.version;
    }

    /**
     * 迁移数据
     * @param {string} key - 键名
     * @param {Object} data - 数据
     */
    _migrateData(key, data) {
        const migrationKey = `${data.version}->${this.version}`;
        const migrator = this.migrations.get(migrationKey);

        if (migrator) {
            try {
                const migratedValue = migrator(data.value);
                this.set(key, migratedValue);
            } catch (error) {
                console.error(`数据迁移失败 [${key}]:`, error);
            }
        } else {
            // 没有迁移函数，直接更新版本
            this.set(key, data.value);
        }
    }
}

// 内存存储实现（降级方案）
class MemoryStorage {
    constructor() {
        this.data = new Map();
    }

    setItem(key, value) {
        this.data.set(key, value);
    }

    getItem(key) {
        return this.data.get(key) || null;
    }

    removeItem(key) {
        this.data.delete(key);
    }

    clear() {
        this.data.clear();
    }

    get length() {
        return this.data.size;
    }

    key(index) {
        const keys = Array.from(this.data.keys());
        return keys[index] || null;
    }
}

// 创建全局存储管理器实例
window.storage = new StorageManager();