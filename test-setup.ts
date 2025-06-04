// テストセットアップファイル
import FDBFactory from 'fake-indexeddb/lib/FDBFactory';
import FDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange';

// IndexedDBのモック設定
global.indexedDB = new FDBFactory();
global.IDBKeyRange = FDBKeyRange;

// Dexie用の追加設定
global.IDBFactory = FDBFactory;
global.IDBDatabase = require('fake-indexeddb/lib/FDBDatabase');
global.IDBObjectStore = require('fake-indexeddb/lib/FDBObjectStore');
global.IDBIndex = require('fake-indexeddb/lib/FDBIndex');
global.IDBTransaction = require('fake-indexeddb/lib/FDBTransaction');
global.IDBRequest = require('fake-indexeddb/lib/FDBRequest');
global.IDBCursor = require('fake-indexeddb/lib/FDBCursor');
global.IDBCursorWithValue = require('fake-indexeddb/lib/FDBCursorWithValue');