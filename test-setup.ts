// テストセットアップファイル
// @ts-ignore
import FDBFactory from 'fake-indexeddb/lib/FDBFactory';
// @ts-ignore
import FDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange';

// IndexedDBのモック設定
global.indexedDB = new FDBFactory();
global.IDBKeyRange = FDBKeyRange;

// Dexie用の追加設定
global.IDBFactory = FDBFactory as any;
// @ts-ignore
global.IDBDatabase = require('fake-indexeddb/lib/FDBDatabase');
// @ts-ignore
global.IDBObjectStore = require('fake-indexeddb/lib/FDBObjectStore');
// @ts-ignore
global.IDBIndex = require('fake-indexeddb/lib/FDBIndex');
// @ts-ignore
global.IDBTransaction = require('fake-indexeddb/lib/FDBTransaction');
// @ts-ignore
global.IDBRequest = require('fake-indexeddb/lib/FDBRequest');
// @ts-ignore
global.IDBCursor = require('fake-indexeddb/lib/FDBCursor');
// @ts-ignore
global.IDBCursorWithValue = require('fake-indexeddb/lib/FDBCursorWithValue');