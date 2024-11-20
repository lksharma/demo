/* prebid.js v9.20.0-pre
Updated: 2024-11-20
Modules: ixBidAdapter, rtdModule, permutiveRtdProvider */

if (!window.pbjs || !window.pbjs.libLoaded) {
 (function(){
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/dlv/index.js":
/*!***********************************!*\
  !*** ./node_modules/dlv/index.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ dlv)
/* harmony export */ });
function dlv(obj, key, def, p, undef) {
	key = key.split ? key.split('.') : key;
	for (p = 0; p < key.length; p++) {
		obj = obj ? obj[key[p]] : undef;
	}
	return obj === undef ? def : obj;
}


/***/ }),

/***/ "./node_modules/fun-hooks/no-eval/index.js":
/*!*************************************************!*\
  !*** ./node_modules/fun-hooks/no-eval/index.js ***!
  \*************************************************/
/***/ ((module) => {

/*
* @license MIT
* Fun Hooks v0.9.10
* (c) @snapwich
*/
create.SYNC = 1;
create.ASYNC = 2;
create.QUEUE = 4;

var packageName = "fun-hooks";

function hasProxy() {
  return !!(typeof Proxy === "function" && Proxy.revocable);
}

var defaults = Object.freeze({
  useProxy: true,
  ready: 0
});

var hookableMap = new WeakMap();

// detect incorrectly implemented reduce and if found use polyfill
// https://github.com/prebid/Prebid.js/issues/3576
// polyfill from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
var reduce =
  [1]
    .reduce(function(a, b, c) {
      return [a, b, c];
    }, 2)
    .toString() === "2,1,0"
    ? Array.prototype.reduce
    : function(callback, initial) {
        var o = Object(this);
        var len = o.length >>> 0;
        var k = 0;
        var value;
        if (initial) {
          value = initial;
        } else {
          while (k < len && !(k in o)) {
            k++;
          }
          value = o[k++];
        }
        while (k < len) {
          if (k in o) {
            value = callback(value, o[k], k, o);
          }
          k++;
        }
        return value;
      };

function rest(args, skip) {
  return Array.prototype.slice.call(args, skip);
}

var assign =
  Object.assign ||
  function assign(target) {
    return reduce.call(
      rest(arguments, 1),
      function(target, obj) {
        if (obj) {
          Object.keys(obj).forEach(function(prop) {
            target[prop] = obj[prop];
          });
        }
        return target;
      },
      target
    );
  };

function runAll(queue) {
  var queued;
  // eslint-disable-next-line no-cond-assign
  while ((queued = queue.shift())) {
    queued();
  }
}

function create(config) {
  var hooks = {};
  var postReady = [];

  config = assign({}, defaults, config);

  function dispatch(arg1, arg2) {
    if (typeof arg1 === "function") {
      return hookFn.call(null, "sync", arg1, arg2);
    } else if (typeof arg1 === "string" && typeof arg2 === "function") {
      return hookFn.apply(null, arguments);
    } else if (typeof arg1 === "object") {
      return hookObj.apply(null, arguments);
    }
  }

  var ready;
  if (config.ready) {
    dispatch.ready = function() {
      ready = true;
      runAll(postReady);
    };
  } else {
    ready = true;
  }

  function hookObj(obj, props, objName) {
    var walk = true;
    if (typeof props === "undefined") {
      props = Object.getOwnPropertyNames(obj);
      walk = false;
    }
    var objHooks = {};
    var doNotHook = ["constructor"];
    do {
      props = props.filter(function(prop) {
        return (
          typeof obj[prop] === "function" &&
          !(doNotHook.indexOf(prop) !== -1) &&
          !prop.match(/^_/)
        );
      });
      props.forEach(function(prop) {
        var parts = prop.split(":");
        var name = parts[0];
        var type = parts[1] || "sync";
        if (!objHooks[name]) {
          var fn = obj[name];
          objHooks[name] = obj[name] = hookFn(
            type,
            fn,
            objName ? [objName, name] : undefined
          );
        }
      });
      obj = Object.getPrototypeOf(obj);
    } while (walk && obj);
    return objHooks;
  }

  /**
   * Navigates a string path to return a hookable function.  If not found, creates a placeholder for hooks.
   * @param {(Array<string> | string)} path
   */
  function get(path) {
    var parts = Array.isArray(path) ? path : path.split(".");
    return reduce.call(
      parts,
      function(memo, part, i) {
        var item = memo[part];
        var installed = false;
        if (item) {
          return item;
        } else if (i === parts.length - 1) {
          if (!ready) {
            postReady.push(function() {
              if (!installed) {
                // eslint-disable-next-line no-console
                console.warn(
                  packageName +
                    ": referenced '" +
                    path +
                    "' but it was never created"
                );
              }
            });
          }
          return (memo[part] = newHookable(function(fn) {
            memo[part] = fn;
            installed = true;
          }));
        }
        return (memo[part] = {});
      },
      hooks
    );
  }

  function newHookable(onInstall) {
    var before = [];
    var after = [];
    var generateTrap = function() {};

    var api = {
      before: function(hook, priority) {
        return add.call(this, before, "before", hook, priority);
      },
      after: function(hook, priority) {
        return add.call(this, after, "after", hook, priority);
      },
      getHooks: function(match) {
        var hooks = before.concat(after);
        if (typeof match === "object") {
          hooks = hooks.filter(function(entry) {
            return Object.keys(match).every(function(prop) {
              return entry[prop] === match[prop];
            });
          });
        }
        try {
          assign(hooks, {
            remove: function() {
              hooks.forEach(function(entry) {
                entry.remove();
              });
              return this;
            }
          });
        } catch (e) {
          console.error(
            "error adding `remove` to array, did you modify Array.prototype?"
          );
        }
        return hooks;
      },
      removeAll: function() {
        return this.getHooks().remove();
      }
    };

    var meta = {
      install: function(type, fn, generate) {
        this.type = type;
        generateTrap = generate;
        generate(before, after);
        onInstall && onInstall(fn);
      }
    };

    // store meta data related to hookable. use `api.after` since `api` reference is not available on our proxy.
    hookableMap.set(api.after, meta);

    return api;

    function add(store, type, hook, priority) {
      var entry = {
        hook: hook,
        type: type,
        priority: priority || 10,
        remove: function() {
          var index = store.indexOf(entry);
          if (index !== -1) {
            store.splice(index, 1);
            generateTrap(before, after);
          }
        }
      };
      store.push(entry);
      store.sort(function(a, b) {
        return b.priority - a.priority;
      });
      generateTrap(before, after);
      return this;
    }
  }

  function hookFn(type, fn, name) {
    // check if function has already been wrapped
    var meta = fn.after && hookableMap.get(fn.after);
    if (meta) {
      if (meta.type !== type) {
        throw packageName + ": recreated hookable with different type";
      } else {
        return fn;
      }
    }

    var hookable = name ? get(name) : newHookable();

    var trap;
    var hookedFn;
    var handlers = {
      get: function(target, prop) {
        return hookable[prop] || Reflect.get.apply(Reflect, arguments);
      }
    };

    if (!ready) {
      postReady.push(setTrap);
    }

    if (config.useProxy && hasProxy()) {
      hookedFn = new Proxy(fn, handlers);
    } else {
      hookedFn = function() {
        return handlers.apply
          ? handlers.apply(fn, this, rest(arguments))
          : fn.apply(this, arguments);
      };
      assign(hookedFn, hookable);
    }

    hookableMap.get(hookedFn.after).install(type, hookedFn, generateTrap);

    return hookedFn;

    // eslint-disable-next-line no-redeclare
    function generateTrap(before, after) {
      var order = [];
      var targetIndex;
      if (before.length || after.length) {
        before.forEach(addToOrder);
        // placeholder for target function wrapper
        targetIndex = order.push(undefined) - 1;
        after.forEach(addToOrder);
        trap = function(target, thisArg, args) {
          var curr = 0;
          var result;
          var callback =
            type === "async" &&
            typeof args[args.length - 1] === "function" &&
            args.pop();
          function bail(value) {
            if (type === "sync") {
              result = value;
            } else if (callback) {
              callback.apply(null, arguments);
            }
          }
          function next(value) {
            if (order[curr]) {
              var args = rest(arguments);
              next.bail = bail;
              args.unshift(next);
              return order[curr++].apply(thisArg, args);
            }
            if (type === "sync") {
              result = value;
            } else if (callback) {
              callback.apply(null, arguments);
            }
          }
          order[targetIndex] = function() {
            var args = rest(arguments, 1);
            if (type === "async" && callback) {
              delete next.bail;
              args.push(next);
            }
            var result = target.apply(thisArg, args);
            if (type === "sync") {
              next(result);
            }
          };
          next.apply(null, args);
          return result;
        };
      } else {
        trap = undefined;
      }
      setTrap();

      function addToOrder(entry) {
        order.push(entry.hook);
      }
    }

    function setTrap() {
      if (
        ready ||
        (type === "sync" && !(config.ready & create.SYNC)) ||
        (type === "async" && !(config.ready & create.ASYNC))
      ) {
        handlers.apply = trap;
      } else if (type === "sync" || !(config.ready & create.QUEUE)) {
        handlers.apply = function() {
          throw packageName + ": hooked function not ready";
        };
      } else {
        handlers.apply = function() {
          var args = arguments;
          postReady.push(function() {
            hookedFn.apply(args[1], args[2]);
          });
        };
      }
    }
  }

  dispatch.get = get;
  return dispatch;
}

/* global module */
module.exports = create;


/***/ }),

/***/ "./node_modules/dset/dist/index.mjs":
/*!******************************************!*\
  !*** ./node_modules/dset/dist/index.mjs ***!
  \******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   dset: () => (/* binding */ dset)
/* harmony export */ });
function dset(obj, keys, val) {
	keys.split && (keys=keys.split('.'));
	var i=0, l=keys.length, t=obj, x, k;
	while (i < l) {
		k = ''+keys[i++];
		if (k === '__proto__' || k === 'constructor' || k === 'prototype') break;
		t = t[k] = (i === l) ? val : (typeof(x=t[k])===typeof(keys)) ? x : (keys[i]*0 !== 0 || !!~(''+keys[i]).indexOf('.')) ? {} : [];
	}
}


/***/ }),

/***/ "./node_modules/klona/json/index.mjs":
/*!*******************************************!*\
  !*** ./node_modules/klona/json/index.mjs ***!
  \*******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   klona: () => (/* binding */ klona)
/* harmony export */ });
function klona(val) {
	var k, out, tmp;

	if (Array.isArray(val)) {
		out = Array(k=val.length);
		while (k--) out[k] = (tmp=val[k]) && typeof tmp === 'object' ? klona(tmp) : tmp;
		return out;
	}

	if (Object.prototype.toString.call(val) === '[object Object]') {
		out = {}; // null
		for (k in val) {
			if (k === '__proto__') {
				Object.defineProperty(out, k, {
					value: klona(val[k]),
					configurable: true,
					enumerable: true,
					writable: true,
				});
			} else {
				out[k] = (tmp=val[k]) && typeof tmp === 'object' ? klona(tmp) : tmp;
			}
		}
		return out;
	}

	return val;
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var chunkIds = deferred[i][0];
/******/ 				var fn = deferred[i][1];
/******/ 				var priority = deferred[i][2];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"prebid-core": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var chunkIds = data[0];
/******/ 			var moreModules = data[1];
/******/ 			var runtime = data[2];
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["pbjsChunk"] = self["pbjsChunk"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["chunk-core","creative-renderer-display"], () => (__webpack_require__("./src/prebid.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;

"use strict";
(self["pbjsChunk"] = self["pbjsChunk"] || []).push([["chunk-core"],{

/***/ "./src/Renderer.js":
/*!*************************!*\
  !*** ./src/Renderer.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Renderer: () => (/* binding */ Renderer),
/* harmony export */   executeRenderer: () => (/* binding */ executeRenderer),
/* harmony export */   isRendererRequired: () => (/* binding */ isRendererRequired)
/* harmony export */ });
/* harmony import */ var _adloader_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./adloader.js */ "./src/adloader.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils.js */ "./node_modules/dlv/index.js");
/* harmony import */ var _polyfill_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _prebidGlobal_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./prebidGlobal.js */ "./src/prebidGlobal.js");
/* harmony import */ var _activities_modules_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./activities/modules.js */ "./src/activities/modules.js");





const pbjsInstance = (0,_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_0__.getGlobal)();
const moduleCode = 'outstream';

/**
 * @typedef {object} Renderer
 *
 * A Renderer stores some functions which are used to render a particular Bid.
 * These are used in Outstream Video Bids, returned on the Bid by the adapter, and will
 * be used to render that bid unless the Publisher overrides them.
 */

function Renderer(options) {
  const {
    url,
    config,
    id,
    callback,
    loaded,
    adUnitCode,
    renderNow
  } = options;
  this.url = url;
  this.config = config;
  this.handlers = {};
  this.id = id;
  this.renderNow = renderNow;

  // a renderer may push to the command queue to delay rendering until the
  // render function is loaded by loadExternalScript, at which point the the command
  // queue will be processed
  this.loaded = loaded;
  this.cmd = [];
  this.push = func => {
    if (typeof func !== 'function') {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logError)('Commands given to Renderer.push must be wrapped in a function');
      return;
    }
    this.loaded ? func.call() : this.cmd.push(func);
  };

  // bidders may override this with the `callback` property given to `install`
  this.callback = callback || (() => {
    this.loaded = true;
    this.process();
  });

  // use a function, not an arrow, in order to be able to pass "arguments" through
  this.render = function () {
    const renderArgs = arguments;
    const runRender = () => {
      if (this._render) {
        this._render.apply(this, renderArgs);
      } else {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`No render function was provided, please use .setRender on the renderer`);
      }
    };
    if (isRendererPreferredFromAdUnit(adUnitCode)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`External Js not loaded by Renderer since renderer url and callback is already defined on adUnit ${adUnitCode}`);
      runRender();
    } else if (renderNow) {
      runRender();
    } else {
      // we expect to load a renderer url once only so cache the request to load script
      this.cmd.unshift(runRender); // should render run first ?
      (0,_adloader_js__WEBPACK_IMPORTED_MODULE_2__.loadExternalScript)(url, _activities_modules_js__WEBPACK_IMPORTED_MODULE_3__.MODULE_TYPE_PREBID, moduleCode, this.callback, this.documentContext);
    }
  }.bind(this); // bind the function to this object to avoid 'this' errors
}
Renderer.install = function (_ref) {
  let {
    url,
    config,
    id,
    callback,
    loaded,
    adUnitCode,
    renderNow
  } = _ref;
  return new Renderer({
    url,
    config,
    id,
    callback,
    loaded,
    adUnitCode,
    renderNow
  });
};
Renderer.prototype.getConfig = function () {
  return this.config;
};
Renderer.prototype.setRender = function (fn) {
  this._render = fn;
};
Renderer.prototype.setEventHandlers = function (handlers) {
  this.handlers = handlers;
};
Renderer.prototype.handleVideoEvent = function (_ref2) {
  let {
    id,
    eventName
  } = _ref2;
  if (typeof this.handlers[eventName] === 'function') {
    this.handlers[eventName]();
  }
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logMessage)(`Prebid Renderer event for id ${id} type ${eventName}`);
};

/*
 * Calls functions that were pushed to the command queue before the
 * renderer was loaded by `loadExternalScript`
 */
Renderer.prototype.process = function () {
  while (this.cmd.length > 0) {
    try {
      this.cmd.shift().call();
    } catch (error) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logError)('Error processing Renderer command: ', error);
    }
  }
};

/**
 * Checks whether creative rendering should be done by Renderer or not.
 * @param {Object} renderer Renderer object installed by adapter
 * @returns {Boolean}
 */
function isRendererRequired(renderer) {
  return !!(renderer && (renderer.url || renderer.renderNow));
}

/**
 * Render the bid returned by the adapter
 * @param {Object} renderer Renderer object installed by adapter
 * @param {Object} bid Bid response
 * @param {Document} doc context document of bid
 */
function executeRenderer(renderer, bid, doc) {
  let docContext = null;
  if (renderer.config && renderer.config.documentResolver) {
    docContext = renderer.config.documentResolver(bid, document, doc); // a user provided callback, which should return a Document, and expect the parameters; bid, sourceDocument, renderDocument
  }
  if (!docContext) {
    docContext = document;
  }
  renderer.documentContext = docContext;
  renderer.render(bid, renderer.documentContext);
}
function isRendererPreferredFromAdUnit(adUnitCode) {
  const adUnits = pbjsInstance.adUnits;
  const adUnit = (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_4__.find)(adUnits, adUnit => {
    return adUnit.code === adUnitCode;
  });
  if (!adUnit) {
    return false;
  }

  // renderer defined at adUnit level
  const adUnitRenderer = (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__["default"])(adUnit, 'renderer');
  const hasValidAdUnitRenderer = !!(adUnitRenderer && adUnitRenderer.url && adUnitRenderer.render);

  // renderer defined at adUnit.mediaTypes level
  const mediaTypeRenderer = (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__["default"])(adUnit, 'mediaTypes.video.renderer');
  const hasValidMediaTypeRenderer = !!(mediaTypeRenderer && mediaTypeRenderer.url && mediaTypeRenderer.render);
  return !!(hasValidAdUnitRenderer && !(adUnitRenderer.backupOnly === true) || hasValidMediaTypeRenderer && !(mediaTypeRenderer.backupOnly === true));
}

/***/ }),

/***/ "./src/activities/activities.js":
/*!**************************************!*\
  !*** ./src/activities/activities.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ACTIVITY_ACCESS_DEVICE: () => (/* binding */ ACTIVITY_ACCESS_DEVICE),
/* harmony export */   ACTIVITY_ENRICH_EIDS: () => (/* binding */ ACTIVITY_ENRICH_EIDS),
/* harmony export */   ACTIVITY_ENRICH_UFPD: () => (/* binding */ ACTIVITY_ENRICH_UFPD),
/* harmony export */   ACTIVITY_FETCH_BIDS: () => (/* binding */ ACTIVITY_FETCH_BIDS),
/* harmony export */   ACTIVITY_REPORT_ANALYTICS: () => (/* binding */ ACTIVITY_REPORT_ANALYTICS),
/* harmony export */   ACTIVITY_SYNC_USER: () => (/* binding */ ACTIVITY_SYNC_USER),
/* harmony export */   ACTIVITY_TRANSMIT_EIDS: () => (/* binding */ ACTIVITY_TRANSMIT_EIDS),
/* harmony export */   ACTIVITY_TRANSMIT_PRECISE_GEO: () => (/* binding */ ACTIVITY_TRANSMIT_PRECISE_GEO),
/* harmony export */   ACTIVITY_TRANSMIT_TID: () => (/* binding */ ACTIVITY_TRANSMIT_TID),
/* harmony export */   ACTIVITY_TRANSMIT_UFPD: () => (/* binding */ ACTIVITY_TRANSMIT_UFPD),
/* harmony export */   LOAD_EXTERNAL_SCRIPT: () => (/* binding */ LOAD_EXTERNAL_SCRIPT)
/* harmony export */ });
/**
 * Activity (that are relevant for privacy) definitions
 *
 * ref. https://docs.google.com/document/d/1dRxFUFmhh2jGanzGZvfkK_6jtHPpHXWD7Qsi6KEugeE
 * & https://github.com/prebid/Prebid.js/issues/9546
 */

/**
 * accessDevice: some component wants to read or write to localStorage or cookies.
 */
const ACTIVITY_ACCESS_DEVICE = 'accessDevice';
/**
 * syncUser: A bid adapter wants to run a user sync.
 */
const ACTIVITY_SYNC_USER = 'syncUser';
/**
 * enrichUfpd: some component wants to add user first-party data to bid requests.
 */
const ACTIVITY_ENRICH_UFPD = 'enrichUfpd';
/**
 * enrichEids: some component wants to add user IDs to bid requests.
 */
const ACTIVITY_ENRICH_EIDS = 'enrichEids';
/**
 * fetchBid: a bidder wants to bid.
 */
const ACTIVITY_FETCH_BIDS = 'fetchBids';

/**
 * reportAnalytics: some component wants to phone home with analytics data.
 */
const ACTIVITY_REPORT_ANALYTICS = 'reportAnalytics';

/**
 * some component wants access to (and send along) user IDs
 */
const ACTIVITY_TRANSMIT_EIDS = 'transmitEids';

/**
 * transmitUfpd: some component wants access to (and send along) user FPD
 */
const ACTIVITY_TRANSMIT_UFPD = 'transmitUfpd';

/**
 * transmitPreciseGeo: some component wants access to (and send along) geolocation info
 */
const ACTIVITY_TRANSMIT_PRECISE_GEO = 'transmitPreciseGeo';

/**
 * transmit TID: some component wants access ot (and send along) transaction IDs
 */
const ACTIVITY_TRANSMIT_TID = 'transmitTid';

/**
 * loadExternalScript: adLoader.js is allowed to load external script
 */
const LOAD_EXTERNAL_SCRIPT = 'loadExternalScript';

/***/ }),

/***/ "./src/activities/activityParams.js":
/*!******************************************!*\
  !*** ./src/activities/activityParams.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   activityParams: () => (/* binding */ activityParams)
/* harmony export */ });
/* harmony import */ var _adapterManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../adapterManager.js */ "./src/adapterManager.js");
/* harmony import */ var _params_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./params.js */ "./src/activities/params.js");



/**
 * Utility function for building common activity parameters - broken out to its own
 * file to avoid circular imports.
 */
const activityParams = (0,_params_js__WEBPACK_IMPORTED_MODULE_0__.activityParamsBuilder)(alias => _adapterManager_js__WEBPACK_IMPORTED_MODULE_1__["default"].resolveAlias(alias));

/***/ }),

/***/ "./src/activities/modules.js":
/*!***********************************!*\
  !*** ./src/activities/modules.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MODULE_TYPE_ANALYTICS: () => (/* binding */ MODULE_TYPE_ANALYTICS),
/* harmony export */   MODULE_TYPE_BIDDER: () => (/* binding */ MODULE_TYPE_BIDDER),
/* harmony export */   MODULE_TYPE_PREBID: () => (/* binding */ MODULE_TYPE_PREBID),
/* harmony export */   MODULE_TYPE_RTD: () => (/* binding */ MODULE_TYPE_RTD)
/* harmony export */ });
/* unused harmony export MODULE_TYPE_UID */
const MODULE_TYPE_PREBID = 'prebid';
const MODULE_TYPE_BIDDER = 'bidder';
const MODULE_TYPE_UID = 'userId';
const MODULE_TYPE_RTD = 'rtd';
const MODULE_TYPE_ANALYTICS = 'analytics';

/***/ }),

/***/ "./src/activities/params.js":
/*!**********************************!*\
  !*** ./src/activities/params.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ACTIVITY_PARAM_ADAPTER_CODE: () => (/* binding */ ACTIVITY_PARAM_ADAPTER_CODE),
/* harmony export */   ACTIVITY_PARAM_ANL_CONFIG: () => (/* binding */ ACTIVITY_PARAM_ANL_CONFIG),
/* harmony export */   ACTIVITY_PARAM_COMPONENT: () => (/* binding */ ACTIVITY_PARAM_COMPONENT),
/* harmony export */   ACTIVITY_PARAM_COMPONENT_NAME: () => (/* binding */ ACTIVITY_PARAM_COMPONENT_NAME),
/* harmony export */   ACTIVITY_PARAM_COMPONENT_TYPE: () => (/* binding */ ACTIVITY_PARAM_COMPONENT_TYPE),
/* harmony export */   ACTIVITY_PARAM_S2S_NAME: () => (/* binding */ ACTIVITY_PARAM_S2S_NAME),
/* harmony export */   ACTIVITY_PARAM_STORAGE_TYPE: () => (/* binding */ ACTIVITY_PARAM_STORAGE_TYPE),
/* harmony export */   ACTIVITY_PARAM_SYNC_TYPE: () => (/* binding */ ACTIVITY_PARAM_SYNC_TYPE),
/* harmony export */   ACTIVITY_PARAM_SYNC_URL: () => (/* binding */ ACTIVITY_PARAM_SYNC_URL),
/* harmony export */   activityParamsBuilder: () => (/* binding */ activityParamsBuilder)
/* harmony export */ });
/* unused harmony export buildActivityParams */
/* harmony import */ var _modules_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./modules.js */ "./src/activities/modules.js");
/* harmony import */ var _hook_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../hook.js */ "./src/hook.js");



/**
 * Component ID - who is trying to perform the activity?
 * Relevant for all activities.
 */
const ACTIVITY_PARAM_COMPONENT = 'component';
const ACTIVITY_PARAM_COMPONENT_TYPE = ACTIVITY_PARAM_COMPONENT + 'Type';
const ACTIVITY_PARAM_COMPONENT_NAME = ACTIVITY_PARAM_COMPONENT + 'Name';

/**
 * Code of the bid adapter that `componentName` is an alias of.
 * May be the same as the component name.
 *
 * relevant for all activities, but only when componentType is 'bidder'.
 */
const ACTIVITY_PARAM_ADAPTER_CODE = 'adapterCode';

/**
 * Storage type - either 'html5' or 'cookie'.
 * Relevant for: accessDevice
 */
const ACTIVITY_PARAM_STORAGE_TYPE = 'storageType';

/**
 * s2sConfig[].configName, used to identify a particular s2s instance
 * relevant for: fetchBids, but only when component is 'prebid.pbsBidAdapter'
 */
const ACTIVITY_PARAM_S2S_NAME = 'configName';
/**
 * user sync type - 'iframe' or 'pixel'
 * relevant for: syncUser
 */
const ACTIVITY_PARAM_SYNC_TYPE = 'syncType';
/**
 * user sync URL
 * relevant for: syncUser
 */
const ACTIVITY_PARAM_SYNC_URL = 'syncUrl';
/**
 * @private
 * Configuration options for analytics adapter - the argument passed to `enableAnalytics`.
 * Relevant for: reportAnalytics.
 * @constant
 * @type {string}
 */
const ACTIVITY_PARAM_ANL_CONFIG = '_config';
function activityParamsBuilder(resolveAlias) {
  return function activityParams(moduleType, moduleName, params) {
    const defaults = {
      [ACTIVITY_PARAM_COMPONENT_TYPE]: moduleType,
      [ACTIVITY_PARAM_COMPONENT_NAME]: moduleName,
      [ACTIVITY_PARAM_COMPONENT]: `${moduleType}.${moduleName}`
    };
    if (moduleType === _modules_js__WEBPACK_IMPORTED_MODULE_0__.MODULE_TYPE_BIDDER) {
      defaults[ACTIVITY_PARAM_ADAPTER_CODE] = resolveAlias(moduleName);
    }
    return buildActivityParams(Object.assign(defaults, params));
  };
}
const buildActivityParams = (0,_hook_js__WEBPACK_IMPORTED_MODULE_1__.hook)('sync', params => params);

/***/ }),

/***/ "./src/activities/redactor.js":
/*!************************************!*\
  !*** ./src/activities/redactor.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ORTB_EIDS_PATHS: () => (/* binding */ ORTB_EIDS_PATHS),
/* harmony export */   ORTB_UFPD_PATHS: () => (/* binding */ ORTB_UFPD_PATHS),
/* harmony export */   appliesWhenActivityDenied: () => (/* binding */ appliesWhenActivityDenied),
/* harmony export */   isData: () => (/* binding */ isData),
/* harmony export */   objectTransformer: () => (/* binding */ objectTransformer),
/* harmony export */   ortb2TransmitRules: () => (/* binding */ ortb2TransmitRules),
/* harmony export */   redactor: () => (/* binding */ redactor),
/* harmony export */   sessionedApplies: () => (/* binding */ sessionedApplies)
/* harmony export */ });
/* unused harmony exports ORTB_GEO_PATHS, ORTB_IPV4_PATHS, ORTB_IPV6_PATHS, redactRule, redactorFactory */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils.js */ "./node_modules/dlv/index.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../config.js */ "./src/config.js");
/* harmony import */ var _rules_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./rules.js */ "./src/activities/rules.js");
/* harmony import */ var _activities_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./activities.js */ "./src/activities/activities.js");
/* harmony import */ var _utils_ipUtils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/ipUtils.js */ "./src/utils/ipUtils.js");





const ORTB_UFPD_PATHS = ['data', 'ext.data', 'yob', 'gender', 'keywords', 'kwarray', 'id', 'buyeruid', 'customdata'].map(f => `user.${f}`).concat('device.ext.cdep');
const ORTB_EIDS_PATHS = ['user.eids', 'user.ext.eids'];
const ORTB_GEO_PATHS = ['user.geo.lat', 'user.geo.lon', 'device.geo.lat', 'device.geo.lon'];
const ORTB_IPV4_PATHS = ['device.ip'];
const ORTB_IPV6_PATHS = ['device.ipv6'];

/**
 * @typedef TransformationRuleDef
 * @property {name}
 * @property {Array[string]} paths dot-separated list of paths that this rule applies to.
 * @property {function(*): boolean} applies a predicate that should return true if this rule applies
 * (and the transformation defined herein should be applied). The arguments are those passed to the transformation function.
 * @property {name} a name for the rule; used to debounce calls to `applies` (and avoid excessive logging):
 * if a rule with the same name was already found to apply (or not), this one will (or won't) as well.
 */

/**
 * @typedef RedactRuleDef A rule that removes, or replaces, values from an object (modifications are done in-place).
 * @augments TransformationRuleDef
 * @property {function(*): *} get? substitution functions for values that should be redacted;
 *  takes in the original (unredacted) value as an input, and returns a substitute to use in the redacted
 *  version. If it returns undefined, or this option is omitted, protected paths will be removed
 *  from the redacted object.
 */

/**
 * @param {RedactRuleDef} ruleDef
 * @return {TransformationRule}
 */
function redactRule(ruleDef) {
  return Object.assign({
    get() {},
    run(root, path, object, property, applies) {
      const val = object && object[property];
      if (isData(val) && applies()) {
        const repl = this.get(val);
        if (repl === undefined) {
          delete object[property];
        } else {
          object[property] = repl;
        }
      }
    }
  }, ruleDef);
}

/**
 * @typedef TransformationRule
 * @augments TransformationRuleDef
 * @property {function} run rule logic - see `redactRule` for an example.
 */

/**
 * @typedef {Function} TransformationFunction
 * @param object object to transform
 * @param ...args arguments to pass down to rule's `apply` methods.
 */

/**
 * Return a transformation function that will apply the given rules to an object.
 *
 * @param {Array[TransformationRule]} rules
 * @return {TransformationFunction}
 */
function objectTransformer(rules) {
  rules.forEach(rule => {
    rule.paths = rule.paths.map(path => {
      const parts = path.split('.');
      const tail = parts.pop();
      return [parts.length > 0 ? parts.join('.') : null, tail];
    });
  });
  return function applyTransform(session, obj) {
    const result = [];
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }
    const applies = sessionedApplies(session, ...args);
    rules.forEach(rule => {
      if (session[rule.name] === false) return;
      for (const [head, tail] of rule.paths) {
        const parent = head == null ? obj : (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__["default"])(obj, head);
        result.push(rule.run(obj, head, parent, tail, applies.bind(null, rule)));
        if (session[rule.name] === false) return;
      }
    });
    return result.filter(el => el != null);
  };
}
function sessionedApplies(session) {
  for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }
  return function applies(rule) {
    if (!session.hasOwnProperty(rule.name)) {
      session[rule.name] = !!rule.applies(...args);
    }
    return session[rule.name];
  };
}
function isData(val) {
  return val != null && (typeof val !== 'object' || Object.keys(val).length > 0);
}
function appliesWhenActivityDenied(activity) {
  let isAllowed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _rules_js__WEBPACK_IMPORTED_MODULE_1__.isActivityAllowed;
  return function applies(params) {
    return !isAllowed(activity, params);
  };
}
function bidRequestTransmitRules() {
  let isAllowed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _rules_js__WEBPACK_IMPORTED_MODULE_1__.isActivityAllowed;
  return [{
    name: _activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_EIDS,
    paths: ['userId', 'userIdAsEids'],
    applies: appliesWhenActivityDenied(_activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_EIDS, isAllowed)
  }, {
    name: _activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_TID,
    paths: ['ortb2Imp.ext.tid'],
    applies: appliesWhenActivityDenied(_activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_TID, isAllowed)
  }].map(redactRule);
}
function ortb2TransmitRules() {
  let isAllowed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _rules_js__WEBPACK_IMPORTED_MODULE_1__.isActivityAllowed;
  return [{
    name: _activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_UFPD,
    paths: ORTB_UFPD_PATHS,
    applies: appliesWhenActivityDenied(_activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_UFPD, isAllowed)
  }, {
    name: _activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_EIDS,
    paths: ORTB_EIDS_PATHS,
    applies: appliesWhenActivityDenied(_activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_EIDS, isAllowed)
  }, {
    name: _activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_PRECISE_GEO,
    paths: ORTB_GEO_PATHS,
    applies: appliesWhenActivityDenied(_activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_PRECISE_GEO, isAllowed),
    get(val) {
      return Math.round((val + Number.EPSILON) * 100) / 100;
    }
  }, {
    name: _activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_PRECISE_GEO,
    paths: ORTB_IPV4_PATHS,
    applies: appliesWhenActivityDenied(_activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_PRECISE_GEO, isAllowed),
    get(val) {
      return (0,_utils_ipUtils_js__WEBPACK_IMPORTED_MODULE_3__.scrubIPv4)(val);
    }
  }, {
    name: _activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_PRECISE_GEO,
    paths: ORTB_IPV6_PATHS,
    applies: appliesWhenActivityDenied(_activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_PRECISE_GEO, isAllowed),
    get(val) {
      return (0,_utils_ipUtils_js__WEBPACK_IMPORTED_MODULE_3__.scrubIPv6)(val);
    }
  }, {
    name: _activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_TID,
    paths: ['source.tid'],
    applies: appliesWhenActivityDenied(_activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_TID, isAllowed)
  }].map(redactRule);
}
function redactorFactory() {
  let isAllowed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _rules_js__WEBPACK_IMPORTED_MODULE_1__.isActivityAllowed;
  const redactOrtb2 = objectTransformer(ortb2TransmitRules(isAllowed));
  const redactBidRequest = objectTransformer(bidRequestTransmitRules(isAllowed));
  return function redactor(params) {
    const session = {};
    return {
      ortb2(obj) {
        redactOrtb2(session, obj, params);
        return obj;
      },
      bidRequest(obj) {
        redactBidRequest(session, obj, params);
        return obj;
      }
    };
  };
}

/**
 * Returns an object that can redact other privacy-sensitive objects according
 * to activity rules.
 *
 * @param {{}} params activity parameters to use for activity checks
 * @return {{ortb2: function({}): {}, bidRequest: function({}): {}}} methods
 *  that can redact disallowed data from ORTB2 and/or bid request objects.
 */
const redactor = redactorFactory();

// by default, TIDs are off since version 8
(0,_rules_js__WEBPACK_IMPORTED_MODULE_1__.registerActivityControl)(_activities_js__WEBPACK_IMPORTED_MODULE_2__.ACTIVITY_TRANSMIT_TID, 'enableTIDs config', () => {
  if (!_config_js__WEBPACK_IMPORTED_MODULE_4__.config.getConfig('enableTIDs')) {
    return {
      allow: false,
      reason: 'TIDs are disabled'
    };
  }
});

/***/ }),

/***/ "./src/activities/rules.js":
/*!*********************************!*\
  !*** ./src/activities/rules.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isActivityAllowed: () => (/* binding */ isActivityAllowed),
/* harmony export */   registerActivityControl: () => (/* binding */ registerActivityControl)
/* harmony export */ });
/* unused harmony export ruleRegistry */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils.js */ "./src/utils.js");
/* harmony import */ var _params_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./params.js */ "./src/activities/params.js");


function ruleRegistry() {
  let logger = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.prefixLog)('Activity control:');
  const registry = {};
  function getRules(activity) {
    return registry[activity] = registry[activity] || [];
  }
  function runRule(activity, name, rule, params) {
    let res;
    try {
      res = rule(params);
    } catch (e) {
      logger.logError(`Exception in rule ${name} for '${activity}'`, e);
      res = {
        allow: false,
        reason: e
      };
    }
    return res && Object.assign({
      activity,
      name,
      component: params[_params_js__WEBPACK_IMPORTED_MODULE_1__.ACTIVITY_PARAM_COMPONENT]
    }, res);
  }
  const dupes = {};
  const DEDUPE_INTERVAL = 1000;
  function logResult(_ref) {
    let {
      activity,
      name,
      allow,
      reason,
      component
    } = _ref;
    const msg = `${name} ${allow ? 'allowed' : 'denied'} '${activity}' for '${component}'${reason ? ':' : ''}`;
    const deduping = dupes.hasOwnProperty(msg);
    if (deduping) {
      clearTimeout(dupes[msg]);
    }
    dupes[msg] = setTimeout(() => delete dupes[msg], DEDUPE_INTERVAL);
    if (!deduping) {
      const parts = [msg];
      reason && parts.push(reason);
      (allow ? logger.logInfo : logger.logWarn).apply(logger, parts);
    }
  }
  return [
  /**
   * Register an activity control rule.
   *
   * @param {string} activity - Activity name, as defined in `activities.js`.
   * @param {string} ruleName - A name for this rule, used for logging.
   * @param {function(Object): {allow: boolean, reason?: string}} rule - Rule definition function. Takes in activity
   *        parameters as a single map; MAY return an object {allow, reason}, where allow is true/false,
   *        and reason is an optional message used for logging.
   *
   *        {allow: true} will allow this activity AS LONG AS no other rules with the same or higher priority return {allow: false};
   *        {allow: false} will deny this activity AS LONG AS no other rules with higher priority return {allow: true};
   *        Returning null/undefined has no effect - the decision is left to other rules.
   *        If no rule returns an allow value, the default is to allow the activity.
   *
   * @param {number} [priority=10] - Rule priority; lower number means higher priority.
   * @returns {function(): void} - A function that unregisters the rule when called.
   */
  function registerActivityControl(activity, ruleName, rule) {
    let priority = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 10;
    const rules = getRules(activity);
    const pos = rules.findIndex(_ref2 => {
      let [itemPriority] = _ref2;
      return priority < itemPriority;
    });
    const entry = [priority, ruleName, rule];
    rules.splice(pos < 0 ? rules.length : pos, 0, entry);
    return function () {
      const idx = rules.indexOf(entry);
      if (idx >= 0) rules.splice(idx, 1);
    };
  },
  /**
   * Test whether an activity is allowed.
   *
   * @param {string} activity activity name
   * @param {{}} params activity parameters; should be generated through the `activityParams` utility.
   * @return {boolean} true for allow, false for deny.
   */
  function isActivityAllowed(activity, params) {
    let lastPriority, foundAllow;
    for (const [priority, name, rule] of getRules(activity)) {
      if (lastPriority !== priority && foundAllow) break;
      lastPriority = priority;
      const ruleResult = runRule(activity, name, rule, params);
      if (ruleResult) {
        if (!ruleResult.allow) {
          logResult(ruleResult);
          return false;
        } else {
          foundAllow = ruleResult;
        }
      }
    }
    foundAllow && logResult(foundAllow);
    return true;
  }];
}
const [registerActivityControl, isActivityAllowed] = ruleRegistry();

/***/ }),

/***/ "./src/adRendering.js":
/*!****************************!*\
  !*** ./src/adRendering.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   deferRendering: () => (/* binding */ deferRendering),
/* harmony export */   getBidToRender: () => (/* binding */ getBidToRender),
/* harmony export */   getRenderingData: () => (/* binding */ getRenderingData),
/* harmony export */   handleCreativeEvent: () => (/* binding */ handleCreativeEvent),
/* harmony export */   handleNativeMessage: () => (/* binding */ handleNativeMessage),
/* harmony export */   handleRender: () => (/* binding */ handleRender),
/* harmony export */   insertLocatorFrame: () => (/* binding */ insertLocatorFrame),
/* harmony export */   markBidAsRendered: () => (/* binding */ markBidAsRendered),
/* harmony export */   markWinner: () => (/* binding */ markWinner),
/* harmony export */   markWinningBid: () => (/* binding */ markWinningBid),
/* harmony export */   renderAdDirect: () => (/* binding */ renderAdDirect),
/* harmony export */   renderIfDeferred: () => (/* binding */ renderIfDeferred)
/* harmony export */ });
/* unused harmony exports emitAdRenderFail, emitAdRenderSucceeded, doRender */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./utils.js */ "./node_modules/dlv/index.js");
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./events.js */ "./src/events.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants.js */ "./src/constants.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var _Renderer_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./Renderer.js */ "./src/Renderer.js");
/* harmony import */ var _mediaTypes_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./mediaTypes.js */ "./src/mediaTypes.js");
/* harmony import */ var _auctionManager_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./auctionManager.js */ "./src/auctionManager.js");
/* harmony import */ var _creativeRenderers_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./creativeRenderers.js */ "./src/creativeRenderers.js");
/* harmony import */ var _hook_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./hook.js */ "./src/hook.js");
/* harmony import */ var _native_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./native.js */ "./src/native.js");
/* harmony import */ var _utils_promise_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils/promise.js */ "./src/utils/promise.js");
/* harmony import */ var _adapterManager_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./adapterManager.js */ "./src/adapterManager.js");
/* harmony import */ var _utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./utils/perfMetrics.js */ "./src/utils/perfMetrics.js");













const {
  AD_RENDER_FAILED,
  AD_RENDER_SUCCEEDED,
  STALE_RENDER,
  BID_WON
} = _constants_js__WEBPACK_IMPORTED_MODULE_0__.EVENTS;
const {
  EXCEPTION
} = _constants_js__WEBPACK_IMPORTED_MODULE_0__.AD_RENDER_FAILED_REASON;
const getBidToRender = (0,_hook_js__WEBPACK_IMPORTED_MODULE_1__.hook)('sync', function (adId) {
  let forRender = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  let override = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _utils_promise_js__WEBPACK_IMPORTED_MODULE_2__.GreedyPromise.resolve();
  return override.then(bid => bid ?? _auctionManager_js__WEBPACK_IMPORTED_MODULE_3__.auctionManager.findBidByAdId(adId)).catch(() => {});
});
const markWinningBid = (0,_hook_js__WEBPACK_IMPORTED_MODULE_1__.hook)('sync', function (bid) {
  _events_js__WEBPACK_IMPORTED_MODULE_4__.emit(BID_WON, bid);
  _auctionManager_js__WEBPACK_IMPORTED_MODULE_3__.auctionManager.addWinningBid(bid);
});

/**
 * Emit the AD_RENDER_FAILED event.
 *
 * @param {Object} data
 * @param data.reason one of the values in AD_RENDER_FAILED_REASON
 * @param data.message failure description
 * @param [data.bid] bid response object that failed to render
 * @param [data.id] adId that failed to render
 */
function emitAdRenderFail(_ref) {
  let {
    reason,
    message,
    bid,
    id
  } = _ref;
  const data = {
    reason,
    message
  };
  if (bid) {
    data.bid = bid;
    data.adId = bid.adId;
  }
  if (id) data.adId = id;
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logError)(`Error rendering ad (id: ${id}): ${message}`);
  _events_js__WEBPACK_IMPORTED_MODULE_4__.emit(AD_RENDER_FAILED, data);
}

/**
 * Emit the AD_RENDER_SUCCEEDED event.
 * (Note: Invocation of this function indicates that the render function did not generate an error, it does not guarantee that tracking for this event has occurred yet.)
 * @param {Object} data
 * @param data.doc document object that was used to `.write` the ad. Should be `null` if unavailable (e.g. for documents in
 * a cross-origin frame).
 * @param [data.bid] bid response object for the ad that was rendered
 * @param [data.id] adId that was rendered.
 */
function emitAdRenderSucceeded(_ref2) {
  let {
    doc,
    bid,
    id
  } = _ref2;
  const data = {
    doc
  };
  if (bid) data.bid = bid;
  if (id) data.adId = id;
  _adapterManager_js__WEBPACK_IMPORTED_MODULE_6__["default"].callAdRenderSucceededBidder(bid.adapterCode || bid.bidder, bid);
  _events_js__WEBPACK_IMPORTED_MODULE_4__.emit(AD_RENDER_SUCCEEDED, data);
}
function handleCreativeEvent(data, bidResponse) {
  switch (data.event) {
    case _constants_js__WEBPACK_IMPORTED_MODULE_0__.EVENTS.AD_RENDER_FAILED:
      emitAdRenderFail({
        bid: bidResponse,
        id: bidResponse.adId,
        reason: data.info.reason,
        message: data.info.message
      });
      break;
    case _constants_js__WEBPACK_IMPORTED_MODULE_0__.EVENTS.AD_RENDER_SUCCEEDED:
      emitAdRenderSucceeded({
        doc: null,
        bid: bidResponse,
        id: bidResponse.adId
      });
      break;
    default:
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logError)(`Received event request for unsupported event: '${data.event}' (adId: '${bidResponse.adId}')`);
  }
}
function handleNativeMessage(data, bidResponse, _ref3) {
  let {
    resizeFn,
    fireTrackers = _native_js__WEBPACK_IMPORTED_MODULE_7__.fireNativeTrackers
  } = _ref3;
  switch (data.action) {
    case 'resizeNativeHeight':
      resizeFn(data.width, data.height);
      break;
    default:
      fireTrackers(data, bidResponse);
  }
}
const HANDLERS = {
  [_constants_js__WEBPACK_IMPORTED_MODULE_0__.MESSAGES.EVENT]: handleCreativeEvent
};
if (true) {
  HANDLERS[_constants_js__WEBPACK_IMPORTED_MODULE_0__.MESSAGES.NATIVE] = handleNativeMessage;
}
function creativeMessageHandler(deps) {
  return function (type, data, bidResponse) {
    if (HANDLERS.hasOwnProperty(type)) {
      HANDLERS[type](data, bidResponse, deps);
    }
  };
}
const getRenderingData = (0,_hook_js__WEBPACK_IMPORTED_MODULE_1__.hook)('sync', function (bidResponse, options) {
  const {
    ad,
    adUrl,
    cpm,
    originalCpm,
    width,
    height
  } = bidResponse;
  const repl = {
    AUCTION_PRICE: originalCpm || cpm,
    CLICKTHROUGH: options?.clickUrl || ''
  };
  return {
    ad: (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.replaceMacros)(ad, repl),
    adUrl: (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.replaceMacros)(adUrl, repl),
    width,
    height
  };
});
const doRender = (0,_hook_js__WEBPACK_IMPORTED_MODULE_1__.hook)('sync', function (_ref4) {
  let {
    renderFn,
    resizeFn,
    bidResponse,
    options,
    doc,
    isMainDocument = doc === document && !(0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.inIframe)()
  } = _ref4;
  const videoBid =  true && bidResponse.mediaType === _mediaTypes_js__WEBPACK_IMPORTED_MODULE_8__.VIDEO;
  if (isMainDocument || videoBid) {
    emitAdRenderFail({
      reason: _constants_js__WEBPACK_IMPORTED_MODULE_0__.AD_RENDER_FAILED_REASON.PREVENT_WRITING_ON_MAIN_DOCUMENT,
      message: videoBid ? 'Cannot render video ad without a renderer' : `renderAd was prevented from writing to the main document.`,
      bid: bidResponse,
      id: bidResponse.adId
    });
    return;
  }
  const data = getRenderingData(bidResponse, options);
  renderFn(Object.assign({
    adId: bidResponse.adId
  }, data));
  const {
    width,
    height
  } = data;
  if ((width ?? height) != null) {
    resizeFn(width, height);
  }
});
doRender.before(function (next, args) {
  // run renderers from a high priority hook to allow the video module to insert itself between this and "normal" rendering.
  const {
    bidResponse,
    doc
  } = args;
  if ((0,_Renderer_js__WEBPACK_IMPORTED_MODULE_9__.isRendererRequired)(bidResponse.renderer)) {
    (0,_Renderer_js__WEBPACK_IMPORTED_MODULE_9__.executeRenderer)(bidResponse.renderer, bidResponse, doc);
    emitAdRenderSucceeded({
      doc,
      bid: bidResponse,
      id: bidResponse.adId
    });
    next.bail();
  } else {
    next(args);
  }
}, 100);
function handleRender(_ref5) {
  let {
    renderFn,
    resizeFn,
    adId,
    options,
    bidResponse,
    doc
  } = _ref5;
  deferRendering(bidResponse, () => {
    if (bidResponse == null) {
      emitAdRenderFail({
        reason: _constants_js__WEBPACK_IMPORTED_MODULE_0__.AD_RENDER_FAILED_REASON.CANNOT_FIND_AD,
        message: `Cannot find ad '${adId}'`,
        id: adId
      });
      return;
    }
    if (bidResponse.status === _constants_js__WEBPACK_IMPORTED_MODULE_0__.BID_STATUS.RENDERED) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logWarn)(`Ad id ${adId} has been rendered before`);
      _events_js__WEBPACK_IMPORTED_MODULE_4__.emit(STALE_RENDER, bidResponse);
      if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_10__["default"])(_config_js__WEBPACK_IMPORTED_MODULE_11__.config.getConfig('auctionOptions'), 'suppressStaleRender')) {
        return;
      }
    }
    try {
      doRender({
        renderFn,
        resizeFn,
        bidResponse,
        options,
        doc
      });
    } catch (e) {
      emitAdRenderFail({
        reason: _constants_js__WEBPACK_IMPORTED_MODULE_0__.AD_RENDER_FAILED_REASON.EXCEPTION,
        message: e.message,
        id: adId,
        bid: bidResponse
      });
    }
  });
}
function markBidAsRendered(bidResponse) {
  const metrics = (0,_utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_12__.useMetrics)(bidResponse.metrics);
  metrics.checkpoint('bidRender');
  metrics.timeBetween('bidWon', 'bidRender', 'render.deferred');
  metrics.timeBetween('auctionEnd', 'bidRender', 'render.pending');
  metrics.timeBetween('requestBids', 'bidRender', 'render.e2e');
  bidResponse.status = _constants_js__WEBPACK_IMPORTED_MODULE_0__.BID_STATUS.RENDERED;
}
const DEFERRED_RENDER = new WeakMap();
const WINNERS = new WeakSet();
function deferRendering(bidResponse, renderFn) {
  if (bidResponse == null) {
    // if the bid is missing, let renderFn deal with it now
    renderFn();
    return;
  }
  DEFERRED_RENDER.set(bidResponse, renderFn);
  if (!bidResponse.deferRendering) {
    renderIfDeferred(bidResponse);
  }
  markWinner(bidResponse);
}
function markWinner(bidResponse) {
  if (!WINNERS.has(bidResponse)) {
    WINNERS.add(bidResponse);
    markWinningBid(bidResponse);
  }
}
function renderIfDeferred(bidResponse) {
  const renderFn = DEFERRED_RENDER.get(bidResponse);
  if (renderFn) {
    renderFn();
    markBidAsRendered(bidResponse);
    DEFERRED_RENDER.delete(bidResponse);
  }
}
function renderAdDirect(doc, adId, options) {
  let bid;
  function fail(reason, message) {
    emitAdRenderFail(Object.assign({
      id: adId,
      bid
    }, {
      reason,
      message
    }));
  }
  function resizeFn(width, height) {
    if (doc.defaultView && doc.defaultView.frameElement) {
      width && (doc.defaultView.frameElement.width = width);
      height && (doc.defaultView.frameElement.height = height);
    }
  }
  const messageHandler = creativeMessageHandler({
    resizeFn
  });
  function renderFn(adData) {
    if (adData.ad) {
      doc.write(adData.ad);
      doc.close();
      emitAdRenderSucceeded({
        doc,
        bid,
        adId: bid.adId
      });
    } else {
      (0,_creativeRenderers_js__WEBPACK_IMPORTED_MODULE_13__.getCreativeRenderer)(bid).then(render => render(adData, {
        sendMessage: (type, data) => messageHandler(type, data, bid),
        mkFrame: _utils_js__WEBPACK_IMPORTED_MODULE_5__.createIframe
      }, doc.defaultView)).then(() => emitAdRenderSucceeded({
        doc,
        bid,
        adId: bid.adId
      }), e => {
        fail(e?.reason || _constants_js__WEBPACK_IMPORTED_MODULE_0__.AD_RENDER_FAILED_REASON.EXCEPTION, e?.message);
        e?.stack && (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logError)(e);
      });
    }
    // TODO: this is almost certainly the wrong way to do this
    const creativeComment = document.createComment(`Creative ${bid.creativeId} served by ${bid.bidder} Prebid.js Header Bidding`);
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.insertElement)(creativeComment, doc, 'html');
  }
  try {
    if (!adId || !doc) {
      fail(_constants_js__WEBPACK_IMPORTED_MODULE_0__.AD_RENDER_FAILED_REASON.MISSING_DOC_OR_ADID, `missing ${adId ? 'doc' : 'adId'}`);
    } else {
      getBidToRender(adId).then(bidResponse => {
        bid = bidResponse;
        handleRender({
          renderFn,
          resizeFn,
          adId,
          options: {
            clickUrl: options?.clickThrough
          },
          bidResponse,
          doc
        });
      });
    }
  } catch (e) {
    fail(EXCEPTION, e.message);
  }
}

/**
 * Insert an invisible, named iframe that can be used by creatives to locate the window Prebid is running in
 * (by looking for one that has `.frames[PB_LOCATOR]` defined).
 * This is necessary because in some situations creatives may be rendered inside nested iframes - Prebid is not necessarily
 * in the immediate parent window.
 */
function insertLocatorFrame() {
  if (!window.frames[_constants_js__WEBPACK_IMPORTED_MODULE_0__.PB_LOCATOR]) {
    if (!document.body) {
      window.requestAnimationFrame(insertLocatorFrame);
    } else {
      const frame = (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.createInvisibleIframe)();
      frame.name = _constants_js__WEBPACK_IMPORTED_MODULE_0__.PB_LOCATOR;
      document.body.appendChild(frame);
    }
  }
}

/***/ }),

/***/ "./src/adUnits.js":
/*!************************!*\
  !*** ./src/adUnits.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getBidderRequestsCounter: () => (/* binding */ getBidderRequestsCounter),
/* harmony export */   getBidderWinsCounter: () => (/* binding */ getBidderWinsCounter),
/* harmony export */   getRequestsCounter: () => (/* binding */ getRequestsCounter),
/* harmony export */   incrementBidderRequestsCounter: () => (/* binding */ incrementBidderRequestsCounter),
/* harmony export */   incrementBidderWinsCounter: () => (/* binding */ incrementBidderWinsCounter),
/* harmony export */   incrementRequestsCounter: () => (/* binding */ incrementRequestsCounter)
/* harmony export */ });
/* unused harmony export reset */
let adUnits = {};
function reset() {
  adUnits = {};
}
function ensureAdUnit(adunit, bidderCode) {
  let adUnit = adUnits[adunit] = adUnits[adunit] || {
    bidders: {}
  };
  if (bidderCode) {
    return adUnit.bidders[bidderCode] = adUnit.bidders[bidderCode] || {};
  }
  return adUnit;
}
function incrementAdUnitCount(adunit, counter, bidderCode) {
  let adUnit = ensureAdUnit(adunit, bidderCode);
  adUnit[counter] = (adUnit[counter] || 0) + 1;
  return adUnit[counter];
}

/**
 * Increments and returns current Adunit counter
 * @param {string} adunit id
 * @returns {number} current adunit count
 */
function incrementRequestsCounter(adunit) {
  return incrementAdUnitCount(adunit, 'requestsCounter');
}

/**
 * Increments and returns current Adunit requests counter for a bidder
 * @param {string} adunit id
 * @param {string} bidderCode code
 * @returns {number} current adunit bidder requests count
 */
function incrementBidderRequestsCounter(adunit, bidderCode) {
  return incrementAdUnitCount(adunit, 'requestsCounter', bidderCode);
}

/**
 * Increments and returns current Adunit wins counter for a bidder
 * @param {string} adunit id
 * @param {string} bidderCode code
 * @returns {number} current adunit bidder requests count
 */
function incrementBidderWinsCounter(adunit, bidderCode) {
  return incrementAdUnitCount(adunit, 'winsCounter', bidderCode);
}

/**
 * Returns current Adunit counter
 * @param {string} adunit id
 * @returns {number} current adunit count
 */
function getRequestsCounter(adunit) {
  return adUnits?.[adunit]?.requestsCounter || 0;
}

/**
 * Returns current Adunit requests counter for a specific bidder code
 * @param {string} adunit id
 * @param {string} bidder code
 * @returns {number} current adunit bidder requests count
 */
function getBidderRequestsCounter(adunit, bidder) {
  return adUnits?.[adunit]?.bidders?.[bidder]?.requestsCounter || 0;
}

/**
 * Returns current Adunit requests counter for a specific bidder code
 * @param {string} adunit id
 * @param {string} bidder code
 * @returns {number} current adunit bidder requests count
 */
function getBidderWinsCounter(adunit, bidder) {
  return adUnits?.[adunit]?.bidders?.[bidder]?.winsCounter || 0;
}

/***/ }),

/***/ "./src/adapter.js":
/*!************************!*\
  !*** ./src/adapter.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Adapter)
/* harmony export */ });
function Adapter(code) {
  var bidderCode = code;
  function setBidderCode(code) {
    bidderCode = code;
  }
  function getBidderCode() {
    return bidderCode;
  }
  function callBids() {}
  return {
    callBids: callBids,
    setBidderCode: setBidderCode,
    getBidderCode: getBidderCode
  };
}

/***/ }),

/***/ "./src/adapterManager.js":
/*!*******************************!*\
  !*** ./src/adapterManager.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   getS2SBidderSet: () => (/* binding */ getS2SBidderSet)
/* harmony export */ });
/* unused harmony exports PBS_ADAPTER_NAME, PARTITIONS, dep, s2sActivityParams, _filterBidsForAdUnit, filterBidsForAdUnit, setupAdUnitMediaTypes, _partitionBidders, partitionBidders */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./utils.js */ "./node_modules/dlv/index.js");
/* harmony import */ var _native_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./native.js */ "./src/native.js");
/* harmony import */ var _adapters_bidderFactory_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./adapters/bidderFactory.js */ "./src/adapters/bidderFactory.js");
/* harmony import */ var _ajax_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./ajax.js */ "./src/ajax.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var _hook_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./hook.js */ "./src/hook.js");
/* harmony import */ var _polyfill_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _adUnits_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./adUnits.js */ "./src/adUnits.js");
/* harmony import */ var _refererDetection_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./refererDetection.js */ "./src/refererDetection.js");
/* harmony import */ var _consentHandler_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./consentHandler.js */ "./src/consentHandler.js");
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./events.js */ "./src/events.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./constants.js */ "./src/constants.js");
/* harmony import */ var _utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./utils/perfMetrics.js */ "./src/utils/perfMetrics.js");
/* harmony import */ var _auctionManager_js__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./auctionManager.js */ "./src/auctionManager.js");
/* harmony import */ var _activities_modules_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./activities/modules.js */ "./src/activities/modules.js");
/* harmony import */ var _activities_rules_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./activities/rules.js */ "./src/activities/rules.js");
/* harmony import */ var _activities_activities_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./activities/activities.js */ "./src/activities/activities.js");
/* harmony import */ var _activities_params_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./activities/params.js */ "./src/activities/params.js");
/* harmony import */ var _activities_redactor_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./activities/redactor.js */ "./src/activities/redactor.js");
/** @module adaptermanger */





















const PBS_ADAPTER_NAME = 'pbsBidAdapter';
const PARTITIONS = {
  CLIENT: 'client',
  SERVER: 'server'
};
const dep = {
  isAllowed: _activities_rules_js__WEBPACK_IMPORTED_MODULE_0__.isActivityAllowed,
  redact: _activities_redactor_js__WEBPACK_IMPORTED_MODULE_1__.redactor
};
let adapterManager = {};
let _bidderRegistry = adapterManager.bidderRegistry = {};
let _aliasRegistry = adapterManager.aliasRegistry = {};
let _s2sConfigs = [];
_config_js__WEBPACK_IMPORTED_MODULE_2__.config.getConfig('s2sConfig', config => {
  if (config && config.s2sConfig) {
    _s2sConfigs = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.isArray)(config.s2sConfig) ? config.s2sConfig : [config.s2sConfig];
  }
});
var _analyticsRegistry = {};
const activityParams = (0,_activities_params_js__WEBPACK_IMPORTED_MODULE_4__.activityParamsBuilder)(alias => adapterManager.resolveAlias(alias));
function s2sActivityParams(s2sConfig) {
  return activityParams(_activities_modules_js__WEBPACK_IMPORTED_MODULE_5__.MODULE_TYPE_PREBID, PBS_ADAPTER_NAME, {
    [_activities_params_js__WEBPACK_IMPORTED_MODULE_4__.ACTIVITY_PARAM_S2S_NAME]: s2sConfig.configName
  });
}

/**
 * @typedef {object} LabelDescriptor
 * @property {boolean} labelAll describes whether or not this object expects all labels to match, or any label to match
 * @property {Array<string>} labels the labels listed on the bidder or adUnit
 * @property {Array<string>} activeLabels the labels specified as being active by requestBids
 */

function getBids(_ref) {
  let {
    bidderCode,
    auctionId,
    bidderRequestId,
    adUnits,
    src,
    metrics
  } = _ref;
  return adUnits.reduce((result, adUnit) => {
    const bids = adUnit.bids.filter(bid => bid.bidder === bidderCode);
    if (bidderCode == null && bids.length === 0 && adUnit.s2sBid != null) {
      bids.push({
        bidder: null
      });
    }
    result.push(bids.reduce((bids, bid) => {
      bid = Object.assign({}, bid, {
        ortb2Imp: (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.mergeDeep)({}, adUnit.ortb2Imp, bid.ortb2Imp)
      }, (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getDefinedParams)(adUnit, ['nativeParams', 'nativeOrtbRequest', 'mediaType', 'renderer']));
      const mediaTypes = bid.mediaTypes == null ? adUnit.mediaTypes : bid.mediaTypes;
      if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.isValidMediaTypes)(mediaTypes)) {
        bid = Object.assign({}, bid, {
          mediaTypes
        });
      } else {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)(`mediaTypes is not correctly configured for adunit ${adUnit.code}`);
      }
      if (src === 'client') {
        (0,_adUnits_js__WEBPACK_IMPORTED_MODULE_6__.incrementBidderRequestsCounter)(adUnit.code, bidderCode);
      }
      bids.push(Object.assign({}, bid, {
        adUnitCode: adUnit.code,
        transactionId: adUnit.transactionId,
        adUnitId: adUnit.adUnitId,
        sizes: (0,_utils_js__WEBPACK_IMPORTED_MODULE_7__["default"])(mediaTypes, 'banner.sizes') || (0,_utils_js__WEBPACK_IMPORTED_MODULE_7__["default"])(mediaTypes, 'video.playerSize') || [],
        bidId: bid.bid_id || (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getUniqueIdentifierStr)(),
        bidderRequestId,
        auctionId,
        src,
        metrics,
        bidRequestsCount: (0,_adUnits_js__WEBPACK_IMPORTED_MODULE_6__.getRequestsCounter)(adUnit.code),
        bidderRequestsCount: (0,_adUnits_js__WEBPACK_IMPORTED_MODULE_6__.getBidderRequestsCounter)(adUnit.code, bid.bidder),
        bidderWinsCount: (0,_adUnits_js__WEBPACK_IMPORTED_MODULE_6__.getBidderWinsCounter)(adUnit.code, bid.bidder),
        deferBilling: !!adUnit.deferBilling
      }));
      return bids;
    }, []));
    return result;
  }, []).reduce(_utils_js__WEBPACK_IMPORTED_MODULE_3__.flatten, []).filter(val => val !== '');
}
const hookedGetBids = (0,_hook_js__WEBPACK_IMPORTED_MODULE_8__.hook)('sync', getBids, 'getBids');

/**
 * Filter an adUnit's  bids for building client and/or server requests
 *
 * @param bids an array of bids as defined in an adUnit
 * @param s2sConfig null if the adUnit is being routed to a client adapter; otherwise the s2s adapter's config
 * @returns the subset of `bids` that are pertinent for the given `s2sConfig`
 */
function _filterBidsForAdUnit(bids, s2sConfig) {
  let {
    getS2SBidders = getS2SBidderSet
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  if (s2sConfig == null) {
    return bids;
  } else {
    const serverBidders = getS2SBidders(s2sConfig);
    return bids.filter(bid => serverBidders.has(bid.bidder));
  }
}
const filterBidsForAdUnit = (0,_hook_js__WEBPACK_IMPORTED_MODULE_8__.hook)('sync', _filterBidsForAdUnit, 'filterBidsForAdUnit');
function getAdUnitCopyForPrebidServer(adUnits, s2sConfig) {
  let adUnitsCopy = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.deepClone)(adUnits);
  let hasModuleBids = false;
  adUnitsCopy.forEach(adUnit => {
    // filter out client side bids
    const s2sBids = adUnit.bids.filter(b => b.module === PBS_ADAPTER_NAME && b.params?.configName === s2sConfig.configName);
    if (s2sBids.length === 1) {
      adUnit.s2sBid = s2sBids[0];
      hasModuleBids = true;
      adUnit.ortb2Imp = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.mergeDeep)({}, adUnit.s2sBid.ortb2Imp, adUnit.ortb2Imp);
    } else if (s2sBids.length > 1) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)('Multiple "module" bids for the same s2s configuration; all will be ignored', s2sBids);
    }
    adUnit.bids = filterBidsForAdUnit(adUnit.bids, s2sConfig).map(bid => {
      bid.bid_id = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getUniqueIdentifierStr)();
      return bid;
    });
  });

  // don't send empty requests
  adUnitsCopy = adUnitsCopy.filter(adUnit => {
    return adUnit.bids.length !== 0 || adUnit.s2sBid != null;
  });
  return {
    adUnits: adUnitsCopy,
    hasModuleBids
  };
}
function getAdUnitCopyForClientAdapters(adUnits) {
  let adUnitsClientCopy = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.deepClone)(adUnits);
  adUnitsClientCopy.forEach(adUnit => {
    adUnit.bids = filterBidsForAdUnit(adUnit.bids, null);
  });

  // don't send empty requests
  adUnitsClientCopy = adUnitsClientCopy.filter(adUnit => {
    return adUnit.bids.length !== 0;
  });
  return adUnitsClientCopy;
}

/**
 * Filter and/or modify media types for ad units based on the given labels.
 *
 * This should return adUnits that are active for the given labels, modified to have their `mediaTypes`
 * conform to size mapping configuration. If different bids for the same adUnit should use different `mediaTypes`,
 * they should be exposed under `adUnit.bids[].mediaTypes`.
 */
const setupAdUnitMediaTypes = (0,_hook_js__WEBPACK_IMPORTED_MODULE_8__.hook)('sync', (adUnits, labels) => {
  return adUnits;
}, 'setupAdUnitMediaTypes');

/**
 * @param {{}|Array<{}>} s2sConfigs
 * @returns {Set<String>} a set of all the bidder codes that should be routed through the S2S adapter(s)
 *                        as defined in `s2sConfigs`
 */
function getS2SBidderSet(s2sConfigs) {
  if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.isArray)(s2sConfigs)) s2sConfigs = [s2sConfigs];
  // `null` represents the "no bid bidder" - when an ad unit is meant only for S2S adapters, like stored impressions
  const serverBidders = new Set([null]);
  s2sConfigs.filter(s2s => s2s && s2s.enabled).flatMap(s2s => s2s.bidders).forEach(bidder => serverBidders.add(bidder));
  return serverBidders;
}

/**
 * @param {Array} adUnits - The ad units to be processed.
 * @param {Object} s2sConfigs - The server-to-server configurations.
 * @returns {Object} - An object containing arrays of bidder codes for client and server.
 * @returns {Object} return.client - Array of bidder codes that should be routed to client adapters.
 * @returns {Object} return.server - Array of bidder codes that should be routed to server adapters.
 */
function _partitionBidders(adUnits, s2sConfigs) {
  let {
    getS2SBidders = getS2SBidderSet
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const serverBidders = getS2SBidders(s2sConfigs);
  return (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getBidderCodes)(adUnits).reduce((memo, bidder) => {
    const partition = serverBidders.has(bidder) ? PARTITIONS.SERVER : PARTITIONS.CLIENT;
    memo[partition].push(bidder);
    return memo;
  }, {
    [PARTITIONS.CLIENT]: [],
    [PARTITIONS.SERVER]: []
  });
}
const partitionBidders = (0,_hook_js__WEBPACK_IMPORTED_MODULE_8__.hook)('sync', _partitionBidders, 'partitionBidders');
adapterManager.makeBidRequests = (0,_hook_js__WEBPACK_IMPORTED_MODULE_8__.hook)('sync', function (adUnits, auctionStart, auctionId, cbTimeout, labels) {
  let ortb2Fragments = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
  let auctionMetrics = arguments.length > 6 ? arguments[6] : undefined;
  auctionMetrics = (0,_utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_9__.useMetrics)(auctionMetrics);
  /**
   * emit and pass adunits for external modification
   * @see {@link https://github.com/prebid/Prebid.js/issues/4149|Issue}
   */
  _events_js__WEBPACK_IMPORTED_MODULE_10__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_11__.EVENTS.BEFORE_REQUEST_BIDS, adUnits);
  if (true) {
    (0,_native_js__WEBPACK_IMPORTED_MODULE_12__.decorateAdUnitsWithNativeParams)(adUnits);
  }
  adUnits.forEach(au => {
    if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.isPlainObject)(au.mediaTypes)) {
      au.mediaTypes = {};
    }
    // filter out bidders that cannot participate in the auction
    au.bids = au.bids.filter(bid => !bid.bidder || dep.isAllowed(_activities_activities_js__WEBPACK_IMPORTED_MODULE_13__.ACTIVITY_FETCH_BIDS, activityParams(_activities_modules_js__WEBPACK_IMPORTED_MODULE_5__.MODULE_TYPE_BIDDER, bid.bidder)));
    (0,_adUnits_js__WEBPACK_IMPORTED_MODULE_6__.incrementRequestsCounter)(au.code);
  });
  adUnits = setupAdUnitMediaTypes(adUnits, labels);
  let {
    [PARTITIONS.CLIENT]: clientBidders,
    [PARTITIONS.SERVER]: serverBidders
  } = partitionBidders(adUnits, _s2sConfigs);
  if (_config_js__WEBPACK_IMPORTED_MODULE_2__.config.getConfig('bidderSequence') === _config_js__WEBPACK_IMPORTED_MODULE_2__.RANDOM) {
    clientBidders = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.shuffle)(clientBidders);
  }
  const refererInfo = (0,_refererDetection_js__WEBPACK_IMPORTED_MODULE_14__.getRefererInfo)();
  let bidRequests = [];
  const ortb2 = ortb2Fragments.global || {};
  const bidderOrtb2 = ortb2Fragments.bidder || {};
  function addOrtb2(bidderRequest, s2sActivityParams) {
    const redact = dep.redact(s2sActivityParams != null ? s2sActivityParams : activityParams(_activities_modules_js__WEBPACK_IMPORTED_MODULE_5__.MODULE_TYPE_BIDDER, bidderRequest.bidderCode));
    const fpd = Object.freeze(redact.ortb2((0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.mergeDeep)({
      source: {
        tid: auctionId
      }
    }, ortb2, bidderOrtb2[bidderRequest.bidderCode])));
    bidderRequest.ortb2 = fpd;
    bidderRequest.bids = bidderRequest.bids.map(bid => {
      bid.ortb2 = fpd;
      return redact.bidRequest(bid);
    });
    return bidderRequest;
  }
  _s2sConfigs.forEach(s2sConfig => {
    const s2sParams = s2sActivityParams(s2sConfig);
    if (s2sConfig && s2sConfig.enabled && dep.isAllowed(_activities_activities_js__WEBPACK_IMPORTED_MODULE_13__.ACTIVITY_FETCH_BIDS, s2sParams)) {
      let {
        adUnits: adUnitsS2SCopy,
        hasModuleBids
      } = getAdUnitCopyForPrebidServer(adUnits, s2sConfig);

      // uniquePbsTid is so we know which server to send which bids to during the callBids function
      let uniquePbsTid = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.generateUUID)();
      (serverBidders.length === 0 && hasModuleBids ? [null] : serverBidders).forEach(bidderCode => {
        const bidderRequestId = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getUniqueIdentifierStr)();
        const metrics = auctionMetrics.fork();
        const bidderRequest = addOrtb2({
          bidderCode,
          auctionId,
          bidderRequestId,
          uniquePbsTid,
          bids: hookedGetBids({
            bidderCode,
            auctionId,
            bidderRequestId,
            'adUnits': (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.deepClone)(adUnitsS2SCopy),
            src: _constants_js__WEBPACK_IMPORTED_MODULE_11__.S2S.SRC,
            metrics
          }),
          auctionStart: auctionStart,
          timeout: s2sConfig.timeout,
          src: _constants_js__WEBPACK_IMPORTED_MODULE_11__.S2S.SRC,
          refererInfo,
          metrics
        }, s2sParams);
        if (bidderRequest.bids.length !== 0) {
          bidRequests.push(bidderRequest);
        }
      });

      // update the s2sAdUnits object and remove all bids that didn't pass sizeConfig/label checks from getBids()
      // this is to keep consistency and only allow bids/adunits that passed the checks to go to pbs
      adUnitsS2SCopy.forEach(adUnitCopy => {
        let validBids = adUnitCopy.bids.filter(adUnitBid => (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_15__.find)(bidRequests, request => (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_15__.find)(request.bids, reqBid => reqBid.bidId === adUnitBid.bid_id)));
        adUnitCopy.bids = validBids;
      });
      bidRequests.forEach(request => {
        if (request.adUnitsS2SCopy === undefined) {
          request.adUnitsS2SCopy = adUnitsS2SCopy.filter(au => au.bids.length > 0 || au.s2sBid != null);
        }
      });
    }
  });

  // client adapters
  let adUnitsClientCopy = getAdUnitCopyForClientAdapters(adUnits);
  clientBidders.forEach(bidderCode => {
    const bidderRequestId = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getUniqueIdentifierStr)();
    const metrics = auctionMetrics.fork();
    const bidderRequest = addOrtb2({
      bidderCode,
      auctionId,
      bidderRequestId,
      bids: hookedGetBids({
        bidderCode,
        auctionId,
        bidderRequestId,
        'adUnits': (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.deepClone)(adUnitsClientCopy),
        labels,
        src: 'client',
        metrics
      }),
      auctionStart: auctionStart,
      timeout: cbTimeout,
      refererInfo,
      metrics
    });
    const adapter = _bidderRegistry[bidderCode];
    if (!adapter) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)(`Trying to make a request for bidder that does not exist: ${bidderCode}`);
    }
    if (adapter && bidderRequest.bids && bidderRequest.bids.length !== 0) {
      bidRequests.push(bidderRequest);
    }
  });
  bidRequests.forEach(bidRequest => {
    if (_consentHandler_js__WEBPACK_IMPORTED_MODULE_16__.gdprDataHandler.getConsentData()) {
      bidRequest['gdprConsent'] = _consentHandler_js__WEBPACK_IMPORTED_MODULE_16__.gdprDataHandler.getConsentData();
    }
    if (_consentHandler_js__WEBPACK_IMPORTED_MODULE_16__.uspDataHandler.getConsentData()) {
      bidRequest['uspConsent'] = _consentHandler_js__WEBPACK_IMPORTED_MODULE_16__.uspDataHandler.getConsentData();
    }
    if (_consentHandler_js__WEBPACK_IMPORTED_MODULE_16__.gppDataHandler.getConsentData()) {
      bidRequest['gppConsent'] = _consentHandler_js__WEBPACK_IMPORTED_MODULE_16__.gppDataHandler.getConsentData();
    }
  });
  return bidRequests;
}, 'makeBidRequests');
adapterManager.callBids = function (adUnits, bidRequests, addBidResponse, doneCb, requestCallbacks, requestBidsTimeout, onTimelyResponse) {
  let ortb2Fragments = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : {};
  if (!bidRequests.length) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)('callBids executed with no bidRequests.  Were they filtered by labels or sizing?');
    return;
  }
  let [clientBidderRequests, serverBidderRequests] = bidRequests.reduce((partitions, bidRequest) => {
    partitions[Number(typeof bidRequest.src !== 'undefined' && bidRequest.src === _constants_js__WEBPACK_IMPORTED_MODULE_11__.S2S.SRC)].push(bidRequest);
    return partitions;
  }, [[], []]);
  var uniqueServerBidRequests = [];
  serverBidderRequests.forEach(serverBidRequest => {
    var index = -1;
    for (var i = 0; i < uniqueServerBidRequests.length; ++i) {
      if (serverBidRequest.uniquePbsTid === uniqueServerBidRequests[i].uniquePbsTid) {
        index = i;
        break;
      }
    }
    if (index <= -1) {
      uniqueServerBidRequests.push(serverBidRequest);
    }
  });
  let counter = 0;
  _s2sConfigs.forEach(s2sConfig => {
    if (s2sConfig && uniqueServerBidRequests[counter] && getS2SBidderSet(s2sConfig).has(uniqueServerBidRequests[counter].bidderCode)) {
      // s2s should get the same client side timeout as other client side requests.
      const s2sAjax = (0,_ajax_js__WEBPACK_IMPORTED_MODULE_17__.ajaxBuilder)(requestBidsTimeout, requestCallbacks ? {
        request: requestCallbacks.request.bind(null, 's2s'),
        done: requestCallbacks.done
      } : undefined);
      let adaptersServerSide = s2sConfig.bidders;
      const s2sAdapter = _bidderRegistry[s2sConfig.adapter];
      let uniquePbsTid = uniqueServerBidRequests[counter].uniquePbsTid;
      let adUnitsS2SCopy = uniqueServerBidRequests[counter].adUnitsS2SCopy;
      let uniqueServerRequests = serverBidderRequests.filter(serverBidRequest => serverBidRequest.uniquePbsTid === uniquePbsTid);
      if (s2sAdapter) {
        let s2sBidRequest = {
          'ad_units': adUnitsS2SCopy,
          s2sConfig,
          ortb2Fragments,
          requestBidsTimeout
        };
        if (s2sBidRequest.ad_units.length) {
          let doneCbs = uniqueServerRequests.map(bidRequest => {
            bidRequest.start = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.timestamp)();
            return function (timedOut) {
              if (!timedOut) {
                onTimelyResponse(bidRequest.bidderRequestId);
              }
              doneCb.apply(bidRequest, arguments);
            };
          });
          const bidders = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getBidderCodes)(s2sBidRequest.ad_units).filter(bidder => adaptersServerSide.includes(bidder));
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logMessage)(`CALLING S2S HEADER BIDDERS ==== ${bidders.length > 0 ? bidders.join(', ') : 'No bidder specified, using "ortb2Imp" definition(s) only'}`);

          // fire BID_REQUESTED event for each s2s bidRequest
          uniqueServerRequests.forEach(bidRequest => {
            // add the new sourceTid
            _events_js__WEBPACK_IMPORTED_MODULE_10__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_11__.EVENTS.BID_REQUESTED, {
              ...bidRequest,
              tid: bidRequest.auctionId
            });
          });

          // make bid requests
          s2sAdapter.callBids(s2sBidRequest, serverBidderRequests, addBidResponse, timedOut => doneCbs.forEach(done => done(timedOut)), s2sAjax);
        }
      } else {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)('missing ' + s2sConfig.adapter);
      }
      counter++;
    }
  });

  // handle client adapter requests
  clientBidderRequests.forEach(bidderRequest => {
    bidderRequest.start = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.timestamp)();
    // TODO : Do we check for bid in pool from here and skip calling adapter again ?
    const adapter = _bidderRegistry[bidderRequest.bidderCode];
    _config_js__WEBPACK_IMPORTED_MODULE_2__.config.runWithBidder(bidderRequest.bidderCode, () => {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logMessage)(`CALLING BIDDER`);
      _events_js__WEBPACK_IMPORTED_MODULE_10__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_11__.EVENTS.BID_REQUESTED, bidderRequest);
    });
    let ajax = (0,_ajax_js__WEBPACK_IMPORTED_MODULE_17__.ajaxBuilder)(requestBidsTimeout, requestCallbacks ? {
      request: requestCallbacks.request.bind(null, bidderRequest.bidderCode),
      done: requestCallbacks.done
    } : undefined);
    const adapterDone = doneCb.bind(bidderRequest);
    try {
      _config_js__WEBPACK_IMPORTED_MODULE_2__.config.runWithBidder(bidderRequest.bidderCode, adapter.callBids.bind(adapter, bidderRequest, addBidResponse, adapterDone, ajax, () => onTimelyResponse(bidderRequest.bidderRequestId), _config_js__WEBPACK_IMPORTED_MODULE_2__.config.callbackWithBidder(bidderRequest.bidderCode)));
    } catch (e) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)(`${bidderRequest.bidderCode} Bid Adapter emitted an uncaught error when parsing their bidRequest`, {
        e,
        bidRequest: bidderRequest
      });
      adapterDone();
    }
  });
};
function getSupportedMediaTypes(bidderCode) {
  let supportedMediaTypes = [];
  if ( true && (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_15__.includes)(adapterManager.videoAdapters, bidderCode)) supportedMediaTypes.push('video');
  if ( true && (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_15__.includes)(_native_js__WEBPACK_IMPORTED_MODULE_12__.nativeAdapters, bidderCode)) supportedMediaTypes.push('native');
  return supportedMediaTypes;
}
adapterManager.videoAdapters = []; // added by adapterLoader for now

adapterManager.registerBidAdapter = function (bidAdapter, bidderCode) {
  let {
    supportedMediaTypes = []
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  if (bidAdapter && bidderCode) {
    if (typeof bidAdapter.callBids === 'function') {
      _bidderRegistry[bidderCode] = bidAdapter;
      _consentHandler_js__WEBPACK_IMPORTED_MODULE_16__.GDPR_GVLIDS.register(_activities_modules_js__WEBPACK_IMPORTED_MODULE_5__.MODULE_TYPE_BIDDER, bidderCode, bidAdapter.getSpec?.().gvlid);
      if ( true && (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_15__.includes)(supportedMediaTypes, 'video')) {
        adapterManager.videoAdapters.push(bidderCode);
      }
      if ( true && (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_15__.includes)(supportedMediaTypes, 'native')) {
        _native_js__WEBPACK_IMPORTED_MODULE_12__.nativeAdapters.push(bidderCode);
      }
    } else {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)('Bidder adaptor error for bidder code: ' + bidderCode + 'bidder must implement a callBids() function');
    }
  } else {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)('bidAdapter or bidderCode not specified');
  }
};
adapterManager.aliasBidAdapter = function (bidderCode, alias, options) {
  let existingAlias = _bidderRegistry[alias];
  if (typeof existingAlias === 'undefined') {
    let bidAdapter = _bidderRegistry[bidderCode];
    if (typeof bidAdapter === 'undefined') {
      // check if alias is part of s2sConfig and allow them to register if so (as base bidder may be s2s-only)
      const nonS2SAlias = [];
      _s2sConfigs.forEach(s2sConfig => {
        if (s2sConfig.bidders && s2sConfig.bidders.length) {
          const s2sBidders = s2sConfig && s2sConfig.bidders;
          if (!(s2sConfig && (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_15__.includes)(s2sBidders, alias))) {
            nonS2SAlias.push(bidderCode);
          } else {
            _aliasRegistry[alias] = bidderCode;
          }
        }
      });
      nonS2SAlias.forEach(bidderCode => {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)('bidderCode "' + bidderCode + '" is not an existing bidder.', 'adapterManager.aliasBidAdapter');
      });
    } else {
      try {
        let newAdapter;
        let supportedMediaTypes = getSupportedMediaTypes(bidderCode);
        // Have kept old code to support backward compatibilitiy.
        // Remove this if loop when all adapters are supporting bidderFactory. i.e When Prebid.js is 1.0
        if (bidAdapter.constructor.prototype != Object.prototype) {
          newAdapter = new bidAdapter.constructor();
          newAdapter.setBidderCode(alias);
        } else {
          const {
            useBaseGvlid = false
          } = options || {};
          let spec = bidAdapter.getSpec();
          const gvlid = useBaseGvlid ? spec.gvlid : options?.gvlid;
          if (gvlid == null && spec.gvlid != null) {
            (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)(`Alias '${alias}' will NOT re-use the GVL ID of the original adapter ('${spec.code}', gvlid: ${spec.gvlid}). Functionality that requires TCF consent may not work as expected.`);
          }
          let skipPbsAliasing = options && options.skipPbsAliasing;
          newAdapter = (0,_adapters_bidderFactory_js__WEBPACK_IMPORTED_MODULE_18__.newBidder)(Object.assign({}, spec, {
            code: alias,
            gvlid,
            skipPbsAliasing
          }));
          _aliasRegistry[alias] = bidderCode;
        }
        adapterManager.registerBidAdapter(newAdapter, alias, {
          supportedMediaTypes
        });
      } catch (e) {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)(bidderCode + ' bidder does not currently support aliasing.', 'adapterManager.aliasBidAdapter');
      }
    }
  } else {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logMessage)('alias name "' + alias + '" has been already specified.');
  }
};
adapterManager.resolveAlias = function (alias) {
  let code = alias;
  let visited;
  while (_aliasRegistry[code] && (!visited || !visited.has(code))) {
    code = _aliasRegistry[code];
    (visited = visited || new Set()).add(code);
  }
  return code;
};
adapterManager.registerAnalyticsAdapter = function (_ref2) {
  let {
    adapter,
    code,
    gvlid
  } = _ref2;
  if (adapter && code) {
    if (typeof adapter.enableAnalytics === 'function') {
      adapter.code = code;
      _analyticsRegistry[code] = {
        adapter,
        gvlid
      };
      _consentHandler_js__WEBPACK_IMPORTED_MODULE_16__.GDPR_GVLIDS.register(_activities_modules_js__WEBPACK_IMPORTED_MODULE_5__.MODULE_TYPE_ANALYTICS, code, gvlid);
    } else {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)(`Prebid Error: Analytics adaptor error for analytics "${code}"
        analytics adapter must implement an enableAnalytics() function`);
    }
  } else {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)('Prebid Error: analyticsAdapter or analyticsCode not specified');
  }
};
adapterManager.enableAnalytics = function (config) {
  if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.isArray)(config)) {
    config = [config];
  }
  config.forEach(adapterConfig => {
    const entry = _analyticsRegistry[adapterConfig.provider];
    if (entry && entry.adapter) {
      if (dep.isAllowed(_activities_activities_js__WEBPACK_IMPORTED_MODULE_13__.ACTIVITY_REPORT_ANALYTICS, activityParams(_activities_modules_js__WEBPACK_IMPORTED_MODULE_5__.MODULE_TYPE_ANALYTICS, adapterConfig.provider, {
        [_activities_params_js__WEBPACK_IMPORTED_MODULE_4__.ACTIVITY_PARAM_ANL_CONFIG]: adapterConfig
      }))) {
        entry.adapter.enableAnalytics(adapterConfig);
      }
    } else {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)(`Prebid Error: no analytics adapter found in registry for '${adapterConfig.provider}'.`);
    }
  });
};
adapterManager.getBidAdapter = function (bidder) {
  return _bidderRegistry[bidder];
};
adapterManager.getAnalyticsAdapter = function (code) {
  return _analyticsRegistry[code];
};
function getBidderMethod(bidder, method) {
  const adapter = _bidderRegistry[bidder];
  const spec = adapter?.getSpec && adapter.getSpec();
  if (spec && spec[method] && typeof spec[method] === 'function') {
    return [spec, spec[method]];
  }
}
function invokeBidderMethod(bidder, method, spec, fn) {
  try {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logInfo)(`Invoking ${bidder}.${method}`);
    for (var _len = arguments.length, params = new Array(_len > 4 ? _len - 4 : 0), _key = 4; _key < _len; _key++) {
      params[_key - 4] = arguments[_key];
    }
    _config_js__WEBPACK_IMPORTED_MODULE_2__.config.runWithBidder(bidder, fn.bind(spec, ...params));
  } catch (e) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)(`Error calling ${method} of ${bidder}`);
  }
}
function tryCallBidderMethod(bidder, method, param) {
  if (param?.source !== _constants_js__WEBPACK_IMPORTED_MODULE_11__.S2S.SRC) {
    const target = getBidderMethod(bidder, method);
    if (target != null) {
      invokeBidderMethod(bidder, method, ...target, param);
    }
  }
}
adapterManager.callTimedOutBidders = function (adUnits, timedOutBidders, cbTimeout) {
  timedOutBidders = timedOutBidders.map(timedOutBidder => {
    // Adding user configured params & timeout to timeout event data
    timedOutBidder.params = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getUserConfiguredParams)(adUnits, timedOutBidder.adUnitCode, timedOutBidder.bidder);
    timedOutBidder.timeout = cbTimeout;
    return timedOutBidder;
  });
  timedOutBidders = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.groupBy)(timedOutBidders, 'bidder');
  Object.keys(timedOutBidders).forEach(bidder => {
    tryCallBidderMethod(bidder, 'onTimeout', timedOutBidders[bidder]);
  });
};
adapterManager.callBidWonBidder = function (bidder, bid, adUnits) {
  // Adding user configured params to bidWon event data
  bid.params = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getUserConfiguredParams)(adUnits, bid.adUnitCode, bid.bidder);
  (0,_adUnits_js__WEBPACK_IMPORTED_MODULE_6__.incrementBidderWinsCounter)(bid.adUnitCode, bid.bidder);
  tryCallBidderMethod(bidder, 'onBidWon', bid);
};
adapterManager.triggerBilling = (() => {
  const BILLED = new WeakSet();
  return bid => {
    if (!BILLED.has(bid)) {
      BILLED.add(bid);
      if (bid.source === _constants_js__WEBPACK_IMPORTED_MODULE_11__.S2S.SRC && bid.burl) {
        _utils_js__WEBPACK_IMPORTED_MODULE_3__.internal.triggerPixel(bid.burl);
      }
      tryCallBidderMethod(bid.bidder, 'onBidBillable', bid);
    }
  };
})();
adapterManager.callSetTargetingBidder = function (bidder, bid) {
  tryCallBidderMethod(bidder, 'onSetTargeting', bid);
};
adapterManager.callBidViewableBidder = function (bidder, bid) {
  tryCallBidderMethod(bidder, 'onBidViewable', bid);
};
adapterManager.callBidderError = function (bidder, error, bidderRequest) {
  const param = {
    error,
    bidderRequest
  };
  tryCallBidderMethod(bidder, 'onBidderError', param);
};
adapterManager.callAdRenderSucceededBidder = function (bidder, bid) {
  tryCallBidderMethod(bidder, 'onAdRenderSucceeded', bid);
};
function resolveAlias(alias) {
  const seen = new Set();
  while (_aliasRegistry.hasOwnProperty(alias) && !seen.has(alias)) {
    seen.add(alias);
    alias = _aliasRegistry[alias];
  }
  return alias;
}
/**
 * Ask every adapter to delete PII.
 * See https://github.com/prebid/Prebid.js/issues/9081
 */
adapterManager.callDataDeletionRequest = (0,_hook_js__WEBPACK_IMPORTED_MODULE_8__.hook)('sync', function () {
  for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }
  const method = 'onDataDeletionRequest';
  Object.keys(_bidderRegistry).filter(bidder => !_aliasRegistry.hasOwnProperty(bidder)).forEach(bidder => {
    const target = getBidderMethod(bidder, method);
    if (target != null) {
      const bidderRequests = _auctionManager_js__WEBPACK_IMPORTED_MODULE_19__.auctionManager.getBidsRequested().filter(br => resolveAlias(br.bidderCode) === bidder);
      invokeBidderMethod(bidder, method, ...target, bidderRequests, ...args);
    }
  });
  Object.entries(_analyticsRegistry).forEach(_ref3 => {
    let [name, entry] = _ref3;
    const fn = entry?.adapter?.[method];
    if (typeof fn === 'function') {
      try {
        fn.apply(entry.adapter, args);
      } catch (e) {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)(`error calling ${method} of ${name}`, e);
      }
    }
  });
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (adapterManager);

/***/ }),

/***/ "./src/adapters/bidderFactory.js":
/*!***************************************!*\
  !*** ./src/adapters/bidderFactory.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   newBidder: () => (/* binding */ newBidder),
/* harmony export */   registerBidder: () => (/* binding */ registerBidder)
/* harmony export */ });
/* unused harmony exports guardTids, processBidderRequests, registerSyncInner, addPaapiConfig, isValid, adapterMetrics */
/* harmony import */ var _adapter_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../adapter.js */ "./src/adapter.js");
/* harmony import */ var _adapterManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../adapterManager.js */ "./src/adapterManager.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../config.js */ "./src/config.js");
/* harmony import */ var _bidfactory_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../bidfactory.js */ "./src/bidfactory.js");
/* harmony import */ var _userSync_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../userSync.js */ "./src/userSync.js");
/* harmony import */ var _native_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../native.js */ "./src/native.js");
/* harmony import */ var _video_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ../video.js */ "./src/video.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../constants.js */ "./src/constants.js");
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../events.js */ "./src/events.js");
/* harmony import */ var _polyfill_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils.js */ "./src/utils.js");
/* harmony import */ var _hook_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../hook.js */ "./src/hook.js");
/* harmony import */ var _auctionManager_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../auctionManager.js */ "./src/auctionManager.js");
/* harmony import */ var _bidderSettings_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../bidderSettings.js */ "./src/bidderSettings.js");
/* harmony import */ var _utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/perfMetrics.js */ "./src/utils/perfMetrics.js");
/* harmony import */ var _activities_rules_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../activities/rules.js */ "./src/activities/rules.js");
/* harmony import */ var _activities_activityParams_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../activities/activityParams.js */ "./src/activities/activityParams.js");
/* harmony import */ var _activities_modules_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../activities/modules.js */ "./src/activities/modules.js");
/* harmony import */ var _activities_activities_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../activities/activities.js */ "./src/activities/activities.js");




















/**
 * @typedef {import('../mediaTypes.js').MediaType} MediaType
 * @typedef {import('../Renderer.js').Renderer} Renderer
 */

/**
 * This file aims to support Adapters during the Prebid 0.x -> 1.x transition.
 *
 * Prebid 1.x and Prebid 0.x will be in separate branches--perhaps for a long time.
 * This function defines an API for adapter construction which is compatible with both versions.
 * Adapters which use it can maintain their code in master, and only this file will need to change
 * in the 1.x branch.
 *
 * Typical usage looks something like:
 *
 * const adapter = registerBidder({
 *   code: 'myBidderCode',
 *   aliases: ['alias1', 'alias2'],
 *   supportedMediaTypes: ['video', 'native'],
 *   isBidRequestValid: function(paramsObject) { return true/false },
 *   buildRequests: function(bidRequests, bidderRequest) { return some ServerRequest(s) },
 *   interpretResponse: function(oneServerResponse) { return some Bids, or throw an error. }
 * });
 *
 * @see BidderSpec for the full API and more thorough descriptions.
 *
 */

/**
 * @typedef {object} BidderSpec An object containing the adapter-specific functions needed to
 * make a Bidder.
 *
 * @property {string} code A code which will be used to uniquely identify this bidder. This should be the same
 *   one as is used in the call to registerBidAdapter
 * @property {string[]} [aliases] A list of aliases which should also resolve to this bidder.
 * @property {MediaType[]} [supportedMediaTypes] A list of Media Types which the adapter supports.
 * @property {function(object): boolean} isBidRequestValid Determines whether or not the given bid has all the params
 *   needed to make a valid request.
 * @property {function(BidRequest[], bidderRequest): ServerRequest|ServerRequest[]} buildRequests Build the request to the Server
 *   which requests Bids for the given array of Requests. Each BidRequest in the argument array is guaranteed to have
 *   passed the isBidRequestValid() test.
 * @property {function(ServerResponse, BidRequest): Bid[]} interpretResponse Given a successful response from the Server,
 *   interpret it and return the Bid objects. This function will be run inside a try/catch.
 *   If it throws any errors, your bids will be discarded.
 * @property {function(SyncOptions, ServerResponse[]): UserSync[]} [getUserSyncs] Given an array of all the responses
 *   from the server, determine which user syncs should occur. The argument array will contain every element
 *   which has been sent through to interpretResponse. The order of syncs in this array matters. The most
 *   important ones should come first, since publishers may limit how many are dropped on their page.
 * @property {function(object): object} transformBidParams Updates bid params before creating bid request
 }}
 */

/**
 * @typedef {object} BidRequest
 *
 * @property {string} bidId A string which uniquely identifies this BidRequest in the current Auction.
 * @property {object} params Any bidder-specific params which the publisher used in their bid request.
 */

/**
 * @typedef {object} BidderAuctionResponse An object encapsulating an adapter response for current Auction
 *
 * @property {Array<Bid>} bids? Contextual bids returned by this adapter, if any
 * @property {Array<{bidId: String, config: {}}>} paapiAuctionConfigs? Array of paapi auction configs, each scoped to a particular bidId
 */

/**
 * @typedef {object} ServerRequest
 *
 * @property {('GET'|'POST')} method The type of request which this is.
 * @property {string} url The endpoint for the request. For example, "//bids.example.com".
 * @property {string|object} data Data to be sent in the request.
 * @property {object} options Content-Type set in the header of the bid request, overrides default 'text/plain'.
 *   If this is a GET request, they'll become query params. If it's a POST request, they'll be added to the body.
 *   Strings will be added as-is. Objects will be unpacked into query params based on key/value mappings, or
 *   JSON-serialized into the Request body.
 */

/**
 * @typedef {object} ServerResponse
 *
 * @property {*} body The response body. If this is legal JSON, then it will be parsed. Otherwise it'll be a
 *   string with the body's content.
 * @property {{get: function(string): string}} headers The response headers.
 *   Call this like `ServerResponse.headers.get("Content-Type")`
 */

/**
 * @typedef {object} Bid
 *
 * @property {string} requestId The specific BidRequest which this bid is aimed at.
 *   This should match the BidRequest.bidId which this Bid targets.
 * @property {string} ad A URL which can be used to load this ad, if it's chosen by the publisher.
 * @property {string} currency The currency code for the cpm value
 * @property {number} cpm The bid price, in US cents per thousand impressions.
 * @property {number} ttl Time-to-live - how long (in seconds) Prebid can use this bid.
 * @property {boolean} netRevenue Boolean defining whether the bid is Net or Gross.  The default is true (Net).
 * @property {number} height The height of the ad, in pixels.
 * @property {number} width The width of the ad, in pixels.
 *
 * @property {object} [native] Object for storing native creative assets
 * @property {object} [video] Object for storing video response data
 * @property {object} [meta] Object for storing bid meta data
 * @property {string} [meta.primaryCatId] The IAB primary category ID
 * @property {Renderer} renderer A Renderer which can be used as a default for this bid,
 *   if the publisher doesn't override it. This is only relevant for Outstream Video bids.
 */

/**
 * @typedef {Object} SyncOptions
 *
 * An object containing information about usersyncs which the adapter should obey.
 *
 * @property {boolean} iframeEnabled True if iframe usersyncs are allowed, and false otherwise
 * @property {boolean} pixelEnabled True if image usersyncs are allowed, and false otherwise
 */

/**
 * TODO: Move this to the UserSync module after that PR is merged.
 *
 * @typedef {object} UserSync
 *
 * @property {('image'|'iframe')} type The type of user sync to be done.
 * @property {string} url The URL which makes the sync happen.
 */

// common params for all mediaTypes
const COMMON_BID_RESPONSE_KEYS = ['cpm', 'ttl', 'creativeId', 'netRevenue', 'currency'];
const TIDS = ['auctionId', 'transactionId'];

/**
 * Register a bidder with prebid, using the given spec.
 *
 * If possible, Adapter modules should use this function instead of adapterManager.registerBidAdapter().
 *
 * @param {BidderSpec} spec An object containing the bare-bones functions we need to make a Bidder.
 */
function registerBidder(spec) {
  const mediaTypes = Array.isArray(spec.supportedMediaTypes) ? {
    supportedMediaTypes: spec.supportedMediaTypes
  } : undefined;
  function putBidder(spec) {
    const bidder = newBidder(spec);
    _adapterManager_js__WEBPACK_IMPORTED_MODULE_0__["default"].registerBidAdapter(bidder, spec.code, mediaTypes);
  }
  putBidder(spec);
  if (Array.isArray(spec.aliases)) {
    spec.aliases.forEach(alias => {
      let aliasCode = alias;
      let gvlid;
      let skipPbsAliasing;
      if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.isPlainObject)(alias)) {
        aliasCode = alias.code;
        gvlid = alias.gvlid;
        skipPbsAliasing = alias.skipPbsAliasing;
      }
      _adapterManager_js__WEBPACK_IMPORTED_MODULE_0__["default"].aliasRegistry[aliasCode] = spec.code;
      putBidder(Object.assign({}, spec, {
        code: aliasCode,
        gvlid,
        skipPbsAliasing
      }));
    });
  }
}
const guardTids = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.memoize)(_ref => {
  let {
    bidderCode
  } = _ref;
  if ((0,_activities_rules_js__WEBPACK_IMPORTED_MODULE_2__.isActivityAllowed)(_activities_activities_js__WEBPACK_IMPORTED_MODULE_3__.ACTIVITY_TRANSMIT_TID, (0,_activities_activityParams_js__WEBPACK_IMPORTED_MODULE_4__.activityParams)(_activities_modules_js__WEBPACK_IMPORTED_MODULE_5__.MODULE_TYPE_BIDDER, bidderCode))) {
    return {
      bidRequest: br => br,
      bidderRequest: br => br
    };
  }
  function get(target, prop, receiver) {
    if (TIDS.includes(prop)) {
      return null;
    }
    return Reflect.get(target, prop, receiver);
  }
  function privateAccessProxy(target, handler) {
    const proxy = new Proxy(target, handler);
    // always allow methods (such as getFloor) private access to TIDs
    Object.entries(target).filter(_ref2 => {
      let [_, v] = _ref2;
      return typeof v === 'function';
    }).forEach(_ref3 => {
      let [prop, fn] = _ref3;
      return proxy[prop] = fn.bind(target);
    });
    return proxy;
  }
  const bidRequest = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.memoize)(br => privateAccessProxy(br, {
    get
  }), arg => arg.bidId);
  /**
   * Return a view on bidd(er) requests where auctionId/transactionId are nulled if the bidder is not allowed `transmitTid`.
   *
   * Because both auctionId and transactionId are used for Prebid's own internal bookkeeping, we cannot simply erase them
   * from request objects; and because request objects are quite complex and not easily cloneable, we hide the IDs
   * with a proxy instead. This should be used only around the adapter logic.
   */
  return {
    bidRequest,
    bidderRequest: br => privateAccessProxy(br, {
      get(target, prop, receiver) {
        if (prop === 'bids') return br.bids.map(bidRequest);
        return get(target, prop, receiver);
      }
    })
  };
});

/**
 * Make a new bidder from the given spec. This is exported mainly for testing.
 * Adapters will probably find it more convenient to use registerBidder instead.
 *
 * @param {BidderSpec} spec
 */
function newBidder(spec) {
  return Object.assign(new _adapter_js__WEBPACK_IMPORTED_MODULE_6__["default"](spec.code), {
    getSpec: function () {
      return Object.freeze(Object.assign({}, spec));
    },
    registerSyncs,
    callBids: function (bidderRequest, addBidResponse, done, ajax, onTimelyResponse, configEnabledCallback) {
      if (!Array.isArray(bidderRequest.bids)) {
        return;
      }
      const tidGuard = guardTids(bidderRequest);
      const adUnitCodesHandled = {};
      function addBidWithCode(adUnitCode, bid) {
        const metrics = (0,_utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_7__.useMetrics)(bid.metrics);
        metrics.checkpoint('addBidResponse');
        adUnitCodesHandled[adUnitCode] = true;
        if (metrics.measureTime('addBidResponse.validate', () => isValid(adUnitCode, bid))) {
          addBidResponse(adUnitCode, bid);
        } else {
          addBidResponse.reject(adUnitCode, bid, _constants_js__WEBPACK_IMPORTED_MODULE_8__.REJECTION_REASON.INVALID);
        }
      }

      // After all the responses have come back, call done() and
      // register any required usersync pixels.
      const responses = [];
      function afterAllResponses() {
        done();
        _config_js__WEBPACK_IMPORTED_MODULE_9__.config.runWithBidder(spec.code, () => {
          _events_js__WEBPACK_IMPORTED_MODULE_10__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_8__.EVENTS.BIDDER_DONE, bidderRequest);
          registerSyncs(responses, bidderRequest.gdprConsent, bidderRequest.uspConsent, bidderRequest.gppConsent);
        });
      }
      const validBidRequests = adapterMetrics(bidderRequest).measureTime('validate', () => bidderRequest.bids.filter(br => filterAndWarn(tidGuard.bidRequest(br))));
      if (validBidRequests.length === 0) {
        afterAllResponses();
        return;
      }
      const bidRequestMap = {};
      validBidRequests.forEach(bid => {
        bidRequestMap[bid.bidId] = bid;
        // Delete this once we are 1.0
        if (!bid.adUnitCode) {
          bid.adUnitCode = bid.placementCode;
        }
      });
      processBidderRequests(spec, validBidRequests, bidderRequest, ajax, configEnabledCallback, {
        onRequest: requestObject => _events_js__WEBPACK_IMPORTED_MODULE_10__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_8__.EVENTS.BEFORE_BIDDER_HTTP, bidderRequest, requestObject),
        onResponse: resp => {
          onTimelyResponse(spec.code);
          responses.push(resp);
        },
        onPaapi: paapiConfig => {
          const bidRequest = bidRequestMap[paapiConfig.bidId];
          if (bidRequest) {
            addPaapiConfig(bidRequest, paapiConfig);
          } else {
            (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)('Received fledge auction configuration for an unknown bidId', paapiConfig);
          }
        },
        // If the server responds with an error, there's not much we can do beside logging.
        onError: (errorMessage, error) => {
          if (!error.timedOut) {
            onTimelyResponse(spec.code);
          }
          _adapterManager_js__WEBPACK_IMPORTED_MODULE_0__["default"].callBidderError(spec.code, error, bidderRequest);
          _events_js__WEBPACK_IMPORTED_MODULE_10__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_8__.EVENTS.BIDDER_ERROR, {
            error,
            bidderRequest
          });
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logError)(`Server call for ${spec.code} failed: ${errorMessage} ${error.status}. Continuing without bids.`);
        },
        onBid: bid => {
          const bidRequest = bidRequestMap[bid.requestId];
          if (bidRequest) {
            bid.adapterCode = bidRequest.bidder;
            if (isInvalidAlternateBidder(bid.bidderCode, bidRequest.bidder)) {
              (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`${bid.bidderCode} is not a registered partner or known bidder of ${bidRequest.bidder}, hence continuing without bid. If you wish to support this bidder, please mark allowAlternateBidderCodes as true in bidderSettings.`);
              addBidResponse.reject(bidRequest.adUnitCode, bid, _constants_js__WEBPACK_IMPORTED_MODULE_8__.REJECTION_REASON.BIDDER_DISALLOWED);
              return;
            }
            // creating a copy of original values as cpm and currency are modified later
            bid.originalCpm = bid.cpm;
            bid.originalCurrency = bid.currency;
            bid.meta = bid.meta || Object.assign({}, bid[bidRequest.bidder]);
            bid.deferBilling = bidRequest.deferBilling;
            bid.deferRendering = bid.deferBilling && (bid.deferRendering ?? typeof spec.onBidBillable !== 'function');
            const prebidBid = Object.assign((0,_bidfactory_js__WEBPACK_IMPORTED_MODULE_11__.createBid)(_constants_js__WEBPACK_IMPORTED_MODULE_8__.STATUS.GOOD, bidRequest), bid, (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.pick)(bidRequest, TIDS));
            addBidWithCode(bidRequest.adUnitCode, prebidBid);
          } else {
            (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`Bidder ${spec.code} made bid for unknown request ID: ${bid.requestId}. Ignoring.`);
            addBidResponse.reject(null, bid, _constants_js__WEBPACK_IMPORTED_MODULE_8__.REJECTION_REASON.INVALID_REQUEST_ID);
          }
        },
        onCompletion: afterAllResponses
      });
    }
  });
  function isInvalidAlternateBidder(responseBidder, requestBidder) {
    let allowAlternateBidderCodes = _bidderSettings_js__WEBPACK_IMPORTED_MODULE_12__.bidderSettings.get(requestBidder, 'allowAlternateBidderCodes') || false;
    let alternateBiddersList = _bidderSettings_js__WEBPACK_IMPORTED_MODULE_12__.bidderSettings.get(requestBidder, 'allowedAlternateBidderCodes');
    if (!!responseBidder && !!requestBidder && requestBidder !== responseBidder) {
      alternateBiddersList = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.isArray)(alternateBiddersList) ? alternateBiddersList.map(val => val.trim().toLowerCase()).filter(val => !!val).filter(_utils_js__WEBPACK_IMPORTED_MODULE_1__.uniques) : alternateBiddersList;
      if (!allowAlternateBidderCodes || (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.isArray)(alternateBiddersList) && alternateBiddersList[0] !== '*' && !alternateBiddersList.includes(responseBidder)) {
        return true;
      }
    }
    return false;
  }
  function registerSyncs(responses, gdprConsent, uspConsent, gppConsent) {
    registerSyncInner(spec, responses, gdprConsent, uspConsent, gppConsent);
  }
  function filterAndWarn(bid) {
    if (!spec.isBidRequestValid(bid)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`Invalid bid sent to bidder ${spec.code}: ${JSON.stringify(bid)}`);
      return false;
    }
    return true;
  }
}
const RESPONSE_PROPS = ['bids', 'paapi'];

/**
 * Run a set of bid requests - that entails converting them to HTTP requests, sending
 * them over the network, and parsing the responses.
 *
 * @param spec bid adapter spec
 * @param bids bid requests to run
 * @param bidderRequest the bid request object that `bids` is connected to
 * @param ajax ajax method to use
 * @param wrapCallback {function(callback)} a function used to wrap every callback (for the purpose of `config.currentBidder`)
 * @param onRequest {function({})} invoked once for each HTTP request built by the adapter - with the raw request
 * @param onResponse {function({})} invoked once on each successful HTTP response - with the raw response
 * @param onError {function(String, {})} invoked once for each HTTP error - with status code and response
 * @param onBid {function({})} invoked once for each bid in the response - with the bid as returned by interpretResponse
 * @param onCompletion {function()} invoked once when all bid requests have been processed
 */
const processBidderRequests = (0,_hook_js__WEBPACK_IMPORTED_MODULE_13__.hook)('sync', function (spec, bids, bidderRequest, ajax, wrapCallback, _ref4) {
  let {
    onRequest,
    onResponse,
    onPaapi,
    onError,
    onBid,
    onCompletion
  } = _ref4;
  const metrics = adapterMetrics(bidderRequest);
  onCompletion = metrics.startTiming('total').stopBefore(onCompletion);
  const tidGuard = guardTids(bidderRequest);
  let requests = metrics.measureTime('buildRequests', () => spec.buildRequests(bids.map(tidGuard.bidRequest), tidGuard.bidderRequest(bidderRequest)));
  if (!requests || requests.length === 0) {
    onCompletion();
    return;
  }
  if (!Array.isArray(requests)) {
    requests = [requests];
  }
  const requestDone = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.delayExecution)(onCompletion, requests.length);
  requests.forEach(request => {
    const requestMetrics = metrics.fork();
    function addBid(bid) {
      if (bid != null) bid.metrics = requestMetrics.fork().renameWith();
      onBid(bid);
    }
    // If the server responds successfully, use the adapter code to unpack the Bids from it.
    // If the adapter code fails, no bids should be added. After all the bids have been added,
    // make sure to call the `requestDone` function so that we're one step closer to calling onCompletion().
    const onSuccess = wrapCallback(function (response, responseObj) {
      networkDone();
      try {
        response = JSON.parse(response);
      } catch (e) {/* response might not be JSON... that's ok. */}

      // Make response headers available for #1742. These are lazy-loaded because most adapters won't need them.
      response = {
        body: response,
        headers: headerParser(responseObj)
      };
      onResponse(response);
      try {
        response = requestMetrics.measureTime('interpretResponse', () => spec.interpretResponse(response, request));
      } catch (err) {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logError)(`Bidder ${spec.code} failed to interpret the server's response. Continuing without bids`, null, err);
        requestDone();
        return;
      }

      // adapters can reply with:
      // a single bid
      // an array of bids
      // a BidderAuctionResponse object

      let bids, paapiConfigs;
      if (response && !Object.keys(response).some(key => !RESPONSE_PROPS.includes(key))) {
        bids = response.bids;
        paapiConfigs = response.paapi;
      } else {
        bids = response;
      }
      if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.isArray)(paapiConfigs)) {
        paapiConfigs.forEach(onPaapi);
      }
      if (bids) {
        if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.isArray)(bids)) {
          bids.forEach(addBid);
        } else {
          addBid(bids);
        }
      }
      requestDone();
      function headerParser(xmlHttpResponse) {
        return {
          get: responseObj.getResponseHeader.bind(responseObj)
        };
      }
    });
    const onFailure = wrapCallback(function (errorMessage, error) {
      networkDone();
      onError(errorMessage, error);
      requestDone();
    });
    onRequest(request);
    const networkDone = requestMetrics.startTiming('net');
    function getOptions(defaults) {
      const ro = request.options;
      return Object.assign(defaults, ro, {
        browsingTopics: ro?.hasOwnProperty('browsingTopics') && !ro.browsingTopics ? false : (_bidderSettings_js__WEBPACK_IMPORTED_MODULE_12__.bidderSettings.get(spec.code, 'topicsHeader') ?? true) && (0,_activities_rules_js__WEBPACK_IMPORTED_MODULE_2__.isActivityAllowed)(_activities_activities_js__WEBPACK_IMPORTED_MODULE_3__.ACTIVITY_TRANSMIT_UFPD, (0,_activities_activityParams_js__WEBPACK_IMPORTED_MODULE_4__.activityParams)(_activities_modules_js__WEBPACK_IMPORTED_MODULE_5__.MODULE_TYPE_BIDDER, spec.code))
      });
    }
    switch (request.method) {
      case 'GET':
        ajax(`${request.url}${formatGetParameters(request.data)}`, {
          success: onSuccess,
          error: onFailure
        }, undefined, getOptions({
          method: 'GET',
          withCredentials: true
        }));
        break;
      case 'POST':
        ajax(request.url, {
          success: onSuccess,
          error: onFailure
        }, typeof request.data === 'string' ? request.data : JSON.stringify(request.data), getOptions({
          method: 'POST',
          contentType: 'text/plain',
          withCredentials: true
        }));
        break;
      default:
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`Skipping invalid request from ${spec.code}. Request type ${request.type} must be GET or POST`);
        requestDone();
    }
    function formatGetParameters(data) {
      if (data) {
        return `?${typeof data === 'object' ? (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.parseQueryStringParameters)(data) : data}`;
      }
      return '';
    }
  });
}, 'processBidderRequests');
const registerSyncInner = (0,_hook_js__WEBPACK_IMPORTED_MODULE_13__.hook)('async', function (spec, responses, gdprConsent, uspConsent, gppConsent) {
  const aliasSyncEnabled = _config_js__WEBPACK_IMPORTED_MODULE_9__.config.getConfig('userSync.aliasSyncEnabled');
  if (spec.getUserSyncs && (aliasSyncEnabled || !_adapterManager_js__WEBPACK_IMPORTED_MODULE_0__["default"].aliasRegistry[spec.code])) {
    let filterConfig = _config_js__WEBPACK_IMPORTED_MODULE_9__.config.getConfig('userSync.filterSettings');
    let syncs = spec.getUserSyncs({
      iframeEnabled: !!(filterConfig && (filterConfig.iframe || filterConfig.all)),
      pixelEnabled: !!(filterConfig && (filterConfig.image || filterConfig.all))
    }, responses, gdprConsent, uspConsent, gppConsent);
    if (syncs) {
      if (!Array.isArray(syncs)) {
        syncs = [syncs];
      }
      syncs.forEach(sync => {
        _userSync_js__WEBPACK_IMPORTED_MODULE_14__.userSync.registerSync(sync.type, spec.code, sync.url);
      });
      _userSync_js__WEBPACK_IMPORTED_MODULE_14__.userSync.bidderDone(spec.code);
    }
  }
}, 'registerSyncs');
const addPaapiConfig = (0,_hook_js__WEBPACK_IMPORTED_MODULE_13__.hook)('sync', (request, paapiConfig) => {}, 'addPaapiConfig');

// check that the bid has a width and height set
function validBidSize(adUnitCode, bid) {
  let {
    index = _auctionManager_js__WEBPACK_IMPORTED_MODULE_15__.auctionManager.index
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  if ((bid.width || parseInt(bid.width, 10) === 0) && (bid.height || parseInt(bid.height, 10) === 0)) {
    bid.width = parseInt(bid.width, 10);
    bid.height = parseInt(bid.height, 10);
    return true;
  }
  const bidRequest = index.getBidRequest(bid);
  const mediaTypes = index.getMediaTypes(bid);
  const sizes = bidRequest && bidRequest.sizes || mediaTypes && mediaTypes.banner && mediaTypes.banner.sizes;
  const parsedSizes = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.parseSizesInput)(sizes);

  // if a banner impression has one valid size, we assign that size to any bid
  // response that does not explicitly set width or height
  if (parsedSizes.length === 1) {
    const [width, height] = parsedSizes[0].split('x');
    bid.width = parseInt(width, 10);
    bid.height = parseInt(height, 10);
    return true;
  }
  return false;
}

// Validate the arguments sent to us by the adapter. If this returns false, the bid should be totally ignored.
function isValid(adUnitCode, bid) {
  let {
    index = _auctionManager_js__WEBPACK_IMPORTED_MODULE_15__.auctionManager.index
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  function hasValidKeys() {
    let bidKeys = Object.keys(bid);
    return COMMON_BID_RESPONSE_KEYS.every(key => (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_16__.includes)(bidKeys, key) && !(0,_polyfill_js__WEBPACK_IMPORTED_MODULE_16__.includes)([undefined, null], bid[key]));
  }
  function errorMessage(msg) {
    return `Invalid bid from ${bid.bidderCode}. Ignoring bid: ${msg}`;
  }
  if (!adUnitCode) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)('No adUnitCode was supplied to addBidResponse.');
    return false;
  }
  if (!bid) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`Some adapter tried to add an undefined bid for ${adUnitCode}.`);
    return false;
  }
  if (!hasValidKeys()) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logError)(errorMessage(`Bidder ${bid.bidderCode} is missing required params. Check http://prebid.org/dev-docs/bidder-adapter-1.html for list of params.`));
    return false;
  }
  if ( true && bid.mediaType === 'native' && !(0,_native_js__WEBPACK_IMPORTED_MODULE_17__.nativeBidIsValid)(bid, {
    index
  })) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logError)(errorMessage('Native bid missing some required properties.'));
    return false;
  }
  if ( true && bid.mediaType === 'video' && !(0,_video_js__WEBPACK_IMPORTED_MODULE_18__.isValidVideoBid)(bid, {
    index
  })) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logError)(errorMessage(`Video bid does not have required vastUrl or renderer property`));
    return false;
  }
  if (bid.mediaType === 'banner' && !validBidSize(adUnitCode, bid, {
    index
  })) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logError)(errorMessage(`Banner bids require a width and height`));
    return false;
  }
  return true;
}
function adapterMetrics(bidderRequest) {
  return (0,_utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_7__.useMetrics)(bidderRequest.metrics).renameWith(n => [`adapter.client.${n}`, `adapters.client.${bidderRequest.bidderCode}.${n}`]);
}

/***/ }),

/***/ "./src/adloader.js":
/*!*************************!*\
  !*** ./src/adloader.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   loadExternalScript: () => (/* binding */ loadExternalScript)
/* harmony export */ });
/* harmony import */ var _activities_activities_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./activities/activities.js */ "./src/activities/activities.js");
/* harmony import */ var _activities_activityParams_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./activities/activityParams.js */ "./src/activities/activityParams.js");
/* harmony import */ var _activities_rules_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./activities/rules.js */ "./src/activities/rules.js");
/* harmony import */ var _polyfill_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");





const _requestCache = new WeakMap();
// The below list contains modules or vendors whom Prebid allows to load external JS.
const _approvedLoadExternalJSList = [
// Prebid maintained modules:
'debugging', 'outstream',
// Bid Modules - only exception is on rendering edge cases, to clean up in Prebid 10:
'improvedigital', 'showheroes-bs',
// RTD modules:
'aaxBlockmeter', 'adagio', 'adloox', 'akamaidap', 'arcspan', 'airgrid', 'browsi', 'brandmetrics', 'clean.io', 'humansecurity', 'confiant', 'contxtful', 'hadron', 'mediafilter', 'medianet', 'azerionedge', 'a1Media', 'geoedge', 'qortex', 'dynamicAdBoost', '51Degrees', 'symitridap', 'wurfl',
// UserId Submodules
'justtag', 'tncId', 'ftrackId', 'id5'];

/**
 * Loads external javascript. Can only be used if external JS is approved by Prebid. See https://github.com/prebid/prebid-js-external-js-template#policy
 * Each unique URL will be loaded at most 1 time.
 * @param {string} url the url to load
 * @param {string} moduleType moduleType of the module requesting this resource
 * @param {string} moduleCode bidderCode or module code of the module requesting this resource
 * @param {function} [callback] callback function to be called after the script is loaded
 * @param {Document} [doc] the context document, in which the script will be loaded, defaults to loaded document
 * @param {object} attributes an object of attributes to be added to the script with setAttribute by [key] and [value]; Only the attributes passed in the first request of a url will be added.
 */
function loadExternalScript(url, moduleType, moduleCode, callback, doc, attributes) {
  if (!(0,_activities_rules_js__WEBPACK_IMPORTED_MODULE_0__.isActivityAllowed)(_activities_activities_js__WEBPACK_IMPORTED_MODULE_1__.LOAD_EXTERNAL_SCRIPT, (0,_activities_activityParams_js__WEBPACK_IMPORTED_MODULE_2__.activityParams)(moduleType, moduleCode))) {
    return;
  }
  if (!moduleCode || !url) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)('cannot load external script without url and moduleCode');
    return;
  }
  if (!(0,_polyfill_js__WEBPACK_IMPORTED_MODULE_4__.includes)(_approvedLoadExternalJSList, moduleCode)) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)(`${moduleCode} not whitelisted for loading external JavaScript`);
    return;
  }
  if (!doc) {
    doc = document; // provide a "valid" key for the WeakMap
  }
  // only load each asset once
  const storedCachedObject = getCacheObject(doc, url);
  if (storedCachedObject) {
    if (callback && typeof callback === 'function') {
      if (storedCachedObject.loaded) {
        // invokeCallbacks immediately
        callback();
      } else {
        // queue the callback
        storedCachedObject.callbacks.push(callback);
      }
    }
    return storedCachedObject.tag;
  }
  const cachedDocObj = _requestCache.get(doc) || {};
  const cacheObject = {
    loaded: false,
    tag: null,
    callbacks: []
  };
  cachedDocObj[url] = cacheObject;
  _requestCache.set(doc, cachedDocObj);
  if (callback && typeof callback === 'function') {
    cacheObject.callbacks.push(callback);
  }
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)(`module ${moduleCode} is loading external JavaScript`);
  return requestResource(url, function () {
    cacheObject.loaded = true;
    try {
      for (let i = 0; i < cacheObject.callbacks.length; i++) {
        cacheObject.callbacks[i]();
      }
    } catch (e) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)('Error executing callback', 'adloader.js:loadExternalScript', e);
    }
  }, doc, attributes);
  function requestResource(tagSrc, callback, doc, attributes) {
    if (!doc) {
      doc = document;
    }
    var jptScript = doc.createElement('script');
    jptScript.type = 'text/javascript';
    jptScript.async = true;
    const cacheObject = getCacheObject(doc, url);
    if (cacheObject) {
      cacheObject.tag = jptScript;
    }
    if (jptScript.readyState) {
      jptScript.onreadystatechange = function () {
        if (jptScript.readyState === 'loaded' || jptScript.readyState === 'complete') {
          jptScript.onreadystatechange = null;
          callback();
        }
      };
    } else {
      jptScript.onload = function () {
        callback();
      };
    }
    jptScript.src = tagSrc;
    if (attributes) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.setScriptAttributes)(jptScript, attributes);
    }

    // add the new script tag to the page
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.insertElement)(jptScript, doc);
    return jptScript;
  }
  function getCacheObject(doc, url) {
    const cachedDocObj = _requestCache.get(doc);
    if (cachedDocObj && cachedDocObj[url]) {
      return cachedDocObj[url];
    }
    return null; // return new cache object?
  }
}
;

/***/ }),

/***/ "./src/ajax.js":
/*!*********************!*\
  !*** ./src/ajax.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ajaxBuilder: () => (/* binding */ ajaxBuilder)
/* harmony export */ });
/* unused harmony exports dep, toFetchRequest, fetcherFactory, attachCallbacks, sendBeacon, ajax, fetch */
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");


const dep = {
  fetch: window.fetch.bind(window),
  makeRequest: (r, o) => new Request(r, o),
  timeout(timeout, resource) {
    const ctl = new AbortController();
    let cancelTimer = setTimeout(() => {
      ctl.abort();
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logError)(`Request timeout after ${timeout}ms`, resource);
      cancelTimer = null;
    }, timeout);
    return {
      signal: ctl.signal,
      done() {
        cancelTimer && clearTimeout(cancelTimer);
      }
    };
  }
};
const GET = 'GET';
const POST = 'POST';
const CTYPE = 'Content-Type';

/**
 * transform legacy `ajax` parameters into a fetch request.
 * @returns {Request}
 */
function toFetchRequest(url, data) {
  let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const method = options.method || (data ? POST : GET);
  if (method === GET && data) {
    const urlInfo = (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.parseUrl)(url, options);
    Object.assign(urlInfo.search, data);
    url = (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.buildUrl)(urlInfo);
  }
  const headers = new Headers(options.customHeaders);
  headers.set(CTYPE, options.contentType || 'text/plain');
  const rqOpts = {
    method,
    headers
  };
  if (method !== GET && data) {
    rqOpts.body = data;
  }
  if (options.withCredentials) {
    rqOpts.credentials = 'include';
  }
  if (options.browsingTopics && isSecureContext) {
    // the Request constructor will throw an exception if the browser supports topics
    // but we're not in a secure context
    rqOpts.browsingTopics = true;
  }
  if (options.keepalive) {
    rqOpts.keepalive = true;
  }
  return dep.makeRequest(url, rqOpts);
}

/**
 * Return a version of `fetch` that automatically cancels requests after `timeout` milliseconds.
 *
 * If provided, `request` and `done` should be functions accepting a single argument.
 * `request` is invoked at the beginning of each request, and `done` at the end; both are passed its origin.
 *
 * @returns {function(*, {}?): Promise<Response>}
 */
function fetcherFactory() {
  let timeout = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 3000;
  let {
    request,
    done
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  let fetcher = (resource, options) => {
    let to;
    if (timeout != null && options?.signal == null && !_config_js__WEBPACK_IMPORTED_MODULE_1__.config.getConfig('disableAjaxTimeout')) {
      to = dep.timeout(timeout, resource);
      options = Object.assign({
        signal: to.signal
      }, options);
    }
    let pm = dep.fetch(resource, options);
    if (to?.done != null) pm = pm.finally(to.done);
    return pm;
  };
  if (request != null || done != null) {
    fetcher = (fetch => function (resource, options) {
      const origin = new URL(resource?.url == null ? resource : resource.url, document.location).origin;
      let req = fetch(resource, options);
      request && request(origin);
      if (done) req = req.finally(() => done(origin));
      return req;
    })(fetcher);
  }
  return fetcher;
}
function toXHR(_ref, responseText) {
  let {
    status,
    statusText = '',
    headers,
    url
  } = _ref;
  let xml = 0;
  function getXML(onError) {
    if (xml === 0) {
      try {
        xml = new DOMParser().parseFromString(responseText, headers?.get(CTYPE)?.split(';')?.[0]);
      } catch (e) {
        xml = null;
        onError && onError(e);
      }
    }
    return xml;
  }
  return {
    // eslint-disable-next-line prebid/no-global
    readyState: XMLHttpRequest.DONE,
    status,
    statusText,
    responseText,
    response: responseText,
    responseType: '',
    responseURL: url,
    get responseXML() {
      return getXML(_utils_js__WEBPACK_IMPORTED_MODULE_0__.logError);
    },
    getResponseHeader: header => headers?.has(header) ? headers.get(header) : null,
    toJSON() {
      return Object.assign({
        responseXML: getXML()
      }, this);
    },
    timedOut: false
  };
}

/**
 * attach legacy `ajax` callbacks to a fetch promise.
 */
function attachCallbacks(fetchPm, callback) {
  const {
    success,
    error
  } = typeof callback === 'object' && callback != null ? callback : {
    success: typeof callback === 'function' ? callback : () => null,
    error: (e, x) => (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logError)('Network error', e, x)
  };
  return fetchPm.then(response => response.text().then(responseText => [response, responseText])).then(_ref2 => {
    let [response, responseText] = _ref2;
    const xhr = toXHR(response, responseText);
    response.ok || response.status === 304 ? success(responseText, xhr) : error(response.statusText, xhr);
  }, reason => error('', Object.assign(toXHR({
    status: 0
  }, ''), {
    reason,
    timedOut: reason?.name === 'AbortError'
  })));
}
function ajaxBuilder() {
  let timeout = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 3000;
  let {
    request,
    done
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const fetcher = fetcherFactory(timeout, {
    request,
    done
  });
  return function (url, callback, data) {
    let options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    attachCallbacks(fetcher(toFetchRequest(url, data, options)), callback);
  };
}

/**
 * simple wrapper around sendBeacon such that invocations of navigator.sendBeacon can be centrally maintained.
 * verifies that the navigator and sendBeacon are defined for maximum compatibility
 * @param {string} url The URL that will receive the data. Can be relative or absolute.
 * @param {*} data An ArrayBuffer, a TypedArray, a DataView, a Blob, a string literal or object, a FormData or a URLSearchParams object containing the data to send.
 * @returns {boolean} true if the user agent successfully queued the data for transfer. Otherwise, it returns false.
 */
function sendBeacon(url, data) {
  if (!window.navigator || !window.navigator.sendBeacon) {
    return false;
  }
  return window.navigator.sendBeacon(url, data);
}
const ajax = ajaxBuilder();
const fetch = fetcherFactory();

/***/ }),

/***/ "./src/auction.js":
/*!************************!*\
  !*** ./src/auction.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AUCTION_COMPLETED: () => (/* binding */ AUCTION_COMPLETED),
/* harmony export */   addBidToAuction: () => (/* binding */ addBidToAuction),
/* harmony export */   getStandardBidderSettings: () => (/* binding */ getStandardBidderSettings),
/* harmony export */   newAuction: () => (/* binding */ newAuction)
/* harmony export */ });
/* unused harmony exports AUCTION_STARTED, AUCTION_IN_PROGRESS, resetAuctionState, addBidResponse, responsesReady, addBidderRequests, bidsBackCallback, auctionCallbacks, callPrebidCache, getMediaTypeGranularity, getPriceGranularity, getPriceByGranularity, getCreativeId, getAdvertiserDomain, getDSP, getPrimaryCatId, getKeyValueTargetingPairs, adjustBids */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./utils.js */ "./node_modules/dlv/index.js");
/* harmony import */ var _cpmBucketManager_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./cpmBucketManager.js */ "./src/cpmBucketManager.js");
/* harmony import */ var _native_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./native.js */ "./src/native.js");
/* harmony import */ var _videoCache_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./videoCache.js */ "./src/videoCache.js");
/* harmony import */ var _Renderer_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./Renderer.js */ "./src/Renderer.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var _userSync_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./userSync.js */ "./src/userSync.js");
/* harmony import */ var _hook_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./hook.js */ "./src/hook.js");
/* harmony import */ var _polyfill_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _video_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./video.js */ "./src/video.js");
/* harmony import */ var _mediaTypes_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./mediaTypes.js */ "./src/mediaTypes.js");
/* harmony import */ var _auctionManager_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./auctionManager.js */ "./src/auctionManager.js");
/* harmony import */ var _bidderSettings_js__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./bidderSettings.js */ "./src/bidderSettings.js");
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./events.js */ "./src/events.js");
/* harmony import */ var _adapterManager_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./adapterManager.js */ "./src/adapterManager.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./constants.js */ "./src/constants.js");
/* harmony import */ var _utils_promise_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./utils/promise.js */ "./src/utils/promise.js");
/* harmony import */ var _utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils/perfMetrics.js */ "./src/utils/perfMetrics.js");
/* harmony import */ var _utils_cpm_js__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./utils/cpm.js */ "./src/utils/cpm.js");
/* harmony import */ var _prebidGlobal_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./prebidGlobal.js */ "./src/prebidGlobal.js");
/**
 * Module for auction instances.
 *
 * In Prebid 0.x, $$PREBID_GLOBAL$$ had _bidsRequested and _bidsReceived as public properties.
 * Starting 1.0, Prebid will support concurrent auctions. Each auction instance will store private properties, bidsRequested and bidsReceived.
 *
 * AuctionManager will create an instance of auction and will store all the auctions.
 *
 */

/**
 * @typedef {import('../src/adapters/bidderFactory.js').BidRequest} BidRequest
 * @typedef {import('../src/adapters/bidderFactory.js').Bid} Bid
 * @typedef {import('../src/config.js').MediaTypePriceGranularity} MediaTypePriceGranularity
 * @typedef {import('../src/mediaTypes.js').MediaType} MediaType
 */

/**
 * @typedef {Object} AdUnit An object containing the adUnit configuration.
 *
 * @property {string} code A code which will be used to uniquely identify this bidder. This should be the same
 *   one as is used in the call to registerBidAdapter
 * @property {Array.<size>} sizes A list of size for adUnit.
 * @property {object} params Any bidder-specific params which the publisher used in their bid request.
 *   This is guaranteed to have passed the spec.areParamsValid() test.
 */

/**
 * @typedef {Array.<number>} size
 */

/**
 * @typedef {Array.<string>} AdUnitCode
 */

/**
 * @typedef {Object} BidderRequest
 *
 * @property {string} bidderCode - adUnit bidder
 * @property {number} auctionId - random UUID
 * @property {string} bidderRequestId - random string, unique key set on all bidRequest.bids[]
 * @property {Array.<Bid>} bids
 * @property {number} auctionStart - Date.now() at auction start
 * @property {number} timeout - callback timeout
 * @property {refererInfo} refererInfo - referer info object
 * @property {string} [tid] - random UUID (used for s2s)
 * @property {string} [src] - s2s or client (used for s2s)
 * @property {import('./types/ortb2.js').Ortb2.BidRequest} [ortb2] Global (not specific to any adUnit) first party data to use for all requests in this auction.
 */

/**
 * @typedef {Object} BidReceived
 * //TODO add all properties
 */

/**
 * @typedef {Object} Auction
 *
 * @property {function(): string} getAuctionStatus - returns the auction status which can be any one of 'started', 'in progress' or 'completed'
 * @property {function(): AdUnit[]} getAdUnits - return the adUnits for this auction instance
 * @property {function(): AdUnitCode[]} getAdUnitCodes - return the adUnitCodes for this auction instance
 * @property {function(): BidRequest[]} getBidRequests - get all bid requests for this auction instance
 * @property {function(): BidReceived[]} getBidsReceived - get all bid received for this auction instance
 * @property {function(): void} startAuctionTimer - sets the bidsBackHandler callback and starts the timer for auction
 * @property {function(): void} callBids - sends requests to all adapters for bids
 */





















const {
  syncUsers
} = _userSync_js__WEBPACK_IMPORTED_MODULE_0__.userSync;
const AUCTION_STARTED = 'started';
const AUCTION_IN_PROGRESS = 'inProgress';
const AUCTION_COMPLETED = 'completed';

// register event for bid adjustment
_events_js__WEBPACK_IMPORTED_MODULE_1__.on(_constants_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS.BID_ADJUSTMENT, function (bid) {
  adjustBids(bid);
});
const MAX_REQUESTS_PER_ORIGIN = 4;
const outstandingRequests = {};
const sourceInfo = {};
const queuedCalls = [];
const pbjsInstance = (0,_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_3__.getGlobal)();

/**
 * Clear global state for tests
 */
function resetAuctionState() {
  queuedCalls.length = 0;
  [outstandingRequests, sourceInfo].forEach(ob => Object.keys(ob).forEach(k => {
    delete ob[k];
  }));
}

/**
 * Creates new auction instance
 *
 * @param {Object} requestConfig
 * @param {AdUnit} requestConfig.adUnits
 * @param {AdUnitCode} requestConfig.adUnitCodes
 * @param {function():void} requestConfig.callback
 * @param {number} requestConfig.cbTimeout
 * @param {Array.<string>} requestConfig.labels
 * @param {string} requestConfig.auctionId
 * @param {{global: {}, bidder: {}}} requestConfig.ortb2Fragments first party data, separated into global
 *    (from getConfig('ortb2') + requestBids({ortb2})) and bidder (a map from bidderCode to ortb2)
 * @param {Object} requestConfig.metrics
 * @returns {Auction} auction instance
 */
function newAuction(_ref) {
  let {
    adUnits,
    adUnitCodes,
    callback,
    cbTimeout,
    labels,
    auctionId,
    ortb2Fragments,
    metrics
  } = _ref;
  metrics = (0,_utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_4__.useMetrics)(metrics);
  const _adUnits = adUnits;
  const _labels = labels;
  const _adUnitCodes = adUnitCodes;
  const _auctionId = auctionId || (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.generateUUID)();
  const _timeout = cbTimeout;
  const _timelyRequests = new Set();
  const done = (0,_utils_promise_js__WEBPACK_IMPORTED_MODULE_6__.defer)();
  const requestsDone = (0,_utils_promise_js__WEBPACK_IMPORTED_MODULE_6__.defer)();
  let _bidsRejected = [];
  let _callback = callback;
  let _bidderRequests = [];
  let _bidsReceived = [];
  let _noBids = [];
  let _winningBids = [];
  let _auctionStart;
  let _auctionEnd;
  let _timeoutTimer;
  let _auctionStatus;
  let _nonBids = [];
  function addBidRequests(bidderRequests) {
    _bidderRequests = _bidderRequests.concat(bidderRequests);
  }
  function addBidReceived(bidsReceived) {
    _bidsReceived = _bidsReceived.concat(bidsReceived);
  }
  function addBidRejected(bidsRejected) {
    _bidsRejected = _bidsRejected.concat(bidsRejected);
  }
  function addNoBid(noBid) {
    _noBids = _noBids.concat(noBid);
  }
  function addNonBids(seatnonbids) {
    _nonBids = _nonBids.concat(seatnonbids);
  }
  function getProperties() {
    return {
      auctionId: _auctionId,
      timestamp: _auctionStart,
      auctionEnd: _auctionEnd,
      auctionStatus: _auctionStatus,
      adUnits: _adUnits,
      adUnitCodes: _adUnitCodes,
      labels: _labels,
      bidderRequests: _bidderRequests,
      noBids: _noBids,
      bidsReceived: _bidsReceived,
      bidsRejected: _bidsRejected,
      winningBids: _winningBids,
      timeout: _timeout,
      metrics: metrics,
      seatNonBids: _nonBids
    };
  }
  function startAuctionTimer() {
    _timeoutTimer = setTimeout(() => executeCallback(true), _timeout);
  }
  function executeCallback(timedOut) {
    if (!timedOut) {
      clearTimeout(_timeoutTimer);
    } else {
      _events_js__WEBPACK_IMPORTED_MODULE_1__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS.AUCTION_TIMEOUT, getProperties());
    }
    if (_auctionEnd === undefined) {
      let timedOutRequests = [];
      if (timedOut) {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logMessage)(`Auction ${_auctionId} timedOut`);
        timedOutRequests = _bidderRequests.filter(rq => !_timelyRequests.has(rq.bidderRequestId)).flatMap(br => br.bids);
        if (timedOutRequests.length) {
          _events_js__WEBPACK_IMPORTED_MODULE_1__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS.BID_TIMEOUT, timedOutRequests);
        }
      }
      _auctionStatus = AUCTION_COMPLETED;
      _auctionEnd = Date.now();
      metrics.checkpoint('auctionEnd');
      metrics.timeBetween('requestBids', 'auctionEnd', 'requestBids.total');
      metrics.timeBetween('callBids', 'auctionEnd', 'requestBids.callBids');
      done.resolve();
      _events_js__WEBPACK_IMPORTED_MODULE_1__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS.AUCTION_END, getProperties());
      bidsBackCallback(_adUnits, function () {
        try {
          if (_callback != null) {
            const bids = _bidsReceived.filter(bid => _adUnitCodes.includes(bid.adUnitCode)).reduce(groupByPlacement, {});
            _callback.apply(pbjsInstance, [bids, timedOut, _auctionId]);
            _callback = null;
          }
        } catch (e) {
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logError)('Error executing bidsBackHandler', null, e);
        } finally {
          // Calling timed out bidders
          if (timedOutRequests.length) {
            _adapterManager_js__WEBPACK_IMPORTED_MODULE_7__["default"].callTimedOutBidders(adUnits, timedOutRequests, _timeout);
          }
          // Only automatically sync if the publisher has not chosen to "enableOverride"
          let userSyncConfig = _config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('userSync') || {};
          if (!userSyncConfig.enableOverride) {
            // Delay the auto sync by the config delay
            syncUsers(userSyncConfig.syncDelay);
          }
        }
      });
    }
  }
  function auctionDone() {
    _config_js__WEBPACK_IMPORTED_MODULE_8__.config.resetBidder();
    // when all bidders have called done callback atleast once it means auction is complete
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logInfo)(`Bids Received for Auction with id: ${_auctionId}`, _bidsReceived);
    _auctionStatus = AUCTION_COMPLETED;
    executeCallback(false);
  }
  function onTimelyResponse(bidderRequestId) {
    _timelyRequests.add(bidderRequestId);
  }
  function callBids() {
    _auctionStatus = AUCTION_STARTED;
    _auctionStart = Date.now();
    let bidRequests = metrics.measureTime('requestBids.makeRequests', () => _adapterManager_js__WEBPACK_IMPORTED_MODULE_7__["default"].makeBidRequests(_adUnits, _auctionStart, _auctionId, _timeout, _labels, ortb2Fragments, metrics));
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logInfo)(`Bids Requested for Auction with id: ${_auctionId}`, bidRequests);
    metrics.checkpoint('callBids');
    if (bidRequests.length < 1) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logWarn)('No valid bid requests returned for auction');
      auctionDone();
    } else {
      addBidderRequests.call({
        dispatch: addBidderRequestsCallback,
        context: this
      }, bidRequests);
    }
  }

  /**
   * callback executed after addBidderRequests completes
   * @param {BidRequest[]} bidRequests
   */
  function addBidderRequestsCallback(bidRequests) {
    bidRequests.forEach(bidRequest => {
      addBidRequests(bidRequest);
    });
    let requests = {};
    let call = {
      bidRequests,
      run: () => {
        startAuctionTimer();
        _auctionStatus = AUCTION_IN_PROGRESS;
        _events_js__WEBPACK_IMPORTED_MODULE_1__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS.AUCTION_INIT, getProperties());
        let callbacks = auctionCallbacks(auctionDone, this);
        _adapterManager_js__WEBPACK_IMPORTED_MODULE_7__["default"].callBids(_adUnits, bidRequests, callbacks.addBidResponse, callbacks.adapterDone, {
          request(source, origin) {
            increment(outstandingRequests, origin);
            increment(requests, source);
            if (!sourceInfo[source]) {
              sourceInfo[source] = {
                SRA: true,
                origin
              };
            }
            if (requests[source] > 1) {
              sourceInfo[source].SRA = false;
            }
          },
          done(origin) {
            outstandingRequests[origin]--;
            if (queuedCalls[0]) {
              if (runIfOriginHasCapacity(queuedCalls[0])) {
                queuedCalls.shift();
              }
            }
          }
        }, _timeout, onTimelyResponse, ortb2Fragments);
        requestsDone.resolve();
      }
    };
    if (!runIfOriginHasCapacity(call)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logWarn)('queueing auction due to limited endpoint capacity');
      queuedCalls.push(call);
    }
    function runIfOriginHasCapacity(call) {
      let hasCapacity = true;
      let maxRequests = _config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('maxRequestsPerOrigin') || MAX_REQUESTS_PER_ORIGIN;
      call.bidRequests.some(bidRequest => {
        let requests = 1;
        let source = typeof bidRequest.src !== 'undefined' && bidRequest.src === _constants_js__WEBPACK_IMPORTED_MODULE_2__.S2S.SRC ? 's2s' : bidRequest.bidderCode;
        // if we have no previous info on this source just let them through
        if (sourceInfo[source]) {
          if (sourceInfo[source].SRA === false) {
            // some bidders might use more than the MAX_REQUESTS_PER_ORIGIN in a single auction.  In those cases
            // set their request count to MAX_REQUESTS_PER_ORIGIN so the auction isn't permanently queued waiting
            // for capacity for that bidder
            requests = Math.min(bidRequest.bids.length, maxRequests);
          }
          if (outstandingRequests[sourceInfo[source].origin] + requests > maxRequests) {
            hasCapacity = false;
          }
        }
        // return only used for terminating this .some() iteration early if it is determined we don't have capacity
        return !hasCapacity;
      });
      if (hasCapacity) {
        call.run();
      }
      return hasCapacity;
    }
    function increment(obj, prop) {
      if (typeof obj[prop] === 'undefined') {
        obj[prop] = 1;
      } else {
        obj[prop]++;
      }
    }
  }
  function addWinningBid(winningBid) {
    _winningBids = _winningBids.concat(winningBid);
    _adapterManager_js__WEBPACK_IMPORTED_MODULE_7__["default"].callBidWonBidder(winningBid.adapterCode || winningBid.bidder, winningBid, adUnits);
    if (!winningBid.deferBilling) {
      _adapterManager_js__WEBPACK_IMPORTED_MODULE_7__["default"].triggerBilling(winningBid);
    }
  }
  function setBidTargeting(bid) {
    _adapterManager_js__WEBPACK_IMPORTED_MODULE_7__["default"].callSetTargetingBidder(bid.adapterCode || bid.bidder, bid);
  }
  _events_js__WEBPACK_IMPORTED_MODULE_1__.on(_constants_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS.SEAT_NON_BID, event => {
    if (event.auctionId === _auctionId) {
      addNonBids(event.seatnonbid);
    }
  });
  return {
    addBidReceived,
    addBidRejected,
    addNoBid,
    callBids,
    addWinningBid,
    setBidTargeting,
    getWinningBids: () => _winningBids,
    getAuctionStart: () => _auctionStart,
    getAuctionEnd: () => _auctionEnd,
    getTimeout: () => _timeout,
    getAuctionId: () => _auctionId,
    getAuctionStatus: () => _auctionStatus,
    getAdUnits: () => _adUnits,
    getAdUnitCodes: () => _adUnitCodes,
    getBidRequests: () => _bidderRequests,
    getBidsReceived: () => _bidsReceived,
    getNoBids: () => _noBids,
    getNonBids: () => _nonBids,
    getFPD: () => ortb2Fragments,
    getMetrics: () => metrics,
    end: done.promise,
    requestsDone: requestsDone.promise
  };
}

/**
 * Hook into this to intercept bids before they are added to an auction.
 *
 * @type {Function}
 * @param adUnitCode
 * @param bid
 * @param {function(String): void} reject a function that, when called, rejects `bid` with the given reason.
 */
const addBidResponse = (0,_hook_js__WEBPACK_IMPORTED_MODULE_9__.hook)('sync', function (adUnitCode, bid, reject) {
  if (!isValidPrice(bid)) {
    reject(_constants_js__WEBPACK_IMPORTED_MODULE_2__.REJECTION_REASON.PRICE_TOO_HIGH);
  } else {
    this.dispatch.call(null, adUnitCode, bid);
  }
}, 'addBidResponse');

/**
 * Delay hook for adapter responses.
 *
 * `ready` is a promise; auctions wait for it to resolve before closing. Modules can hook into this
 * to delay the end of auctions while they perform initialization that does not need to delay their start.
 */
const responsesReady = (0,_hook_js__WEBPACK_IMPORTED_MODULE_9__.hook)('sync', ready => ready, 'responsesReady');
const addBidderRequests = (0,_hook_js__WEBPACK_IMPORTED_MODULE_9__.hook)('sync', function (bidderRequests) {
  this.dispatch.call(this.context, bidderRequests);
}, 'addBidderRequests');
const bidsBackCallback = (0,_hook_js__WEBPACK_IMPORTED_MODULE_9__.hook)('async', function (adUnits, callback) {
  if (callback) {
    callback();
  }
}, 'bidsBackCallback');
function auctionCallbacks(auctionDone, auctionInstance) {
  let {
    index = _auctionManager_js__WEBPACK_IMPORTED_MODULE_10__.auctionManager.index
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  let outstandingBidsAdded = 0;
  let allAdapterCalledDone = false;
  let bidderRequestsDone = new Set();
  let bidResponseMap = {};
  function afterBidAdded() {
    outstandingBidsAdded--;
    if (allAdapterCalledDone && outstandingBidsAdded === 0) {
      auctionDone();
    }
  }
  function handleBidResponse(adUnitCode, bid, handler) {
    bidResponseMap[bid.requestId] = true;
    addCommonResponseProperties(bid, adUnitCode);
    outstandingBidsAdded++;
    return handler(afterBidAdded);
  }
  function acceptBidResponse(adUnitCode, bid) {
    handleBidResponse(adUnitCode, bid, done => {
      let bidResponse = getPreparedBidForAuction(bid);
      _events_js__WEBPACK_IMPORTED_MODULE_1__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS.BID_ACCEPTED, bidResponse);
      if ( true && bidResponse.mediaType === _mediaTypes_js__WEBPACK_IMPORTED_MODULE_11__.VIDEO) {
        tryAddVideoBid(auctionInstance, bidResponse, done);
      } else {
        if ( true && (0,_native_js__WEBPACK_IMPORTED_MODULE_12__.isNativeResponse)(bidResponse)) {
          (0,_native_js__WEBPACK_IMPORTED_MODULE_12__.setNativeResponseProperties)(bidResponse, index.getAdUnit(bidResponse));
        }
        addBidToAuction(auctionInstance, bidResponse);
        done();
      }
    });
  }
  function rejectBidResponse(adUnitCode, bid, reason) {
    return handleBidResponse(adUnitCode, bid, done => {
      bid.rejectionReason = reason;
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logWarn)(`Bid from ${bid.bidder || 'unknown bidder'} was rejected: ${reason}`, bid);
      _events_js__WEBPACK_IMPORTED_MODULE_1__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS.BID_REJECTED, bid);
      auctionInstance.addBidRejected(bid);
      done();
    });
  }
  function adapterDone() {
    let bidderRequest = this;
    let bidderRequests = auctionInstance.getBidRequests();
    const auctionOptionsConfig = _config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('auctionOptions');
    bidderRequestsDone.add(bidderRequest);
    if (auctionOptionsConfig && !(0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.isEmpty)(auctionOptionsConfig)) {
      const secondaryBidders = auctionOptionsConfig.secondaryBidders;
      if (secondaryBidders && !bidderRequests.every(bidder => (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_13__.includes)(secondaryBidders, bidder.bidderCode))) {
        bidderRequests = bidderRequests.filter(request => !(0,_polyfill_js__WEBPACK_IMPORTED_MODULE_13__.includes)(secondaryBidders, request.bidderCode));
      }
    }
    allAdapterCalledDone = bidderRequests.every(bidderRequest => bidderRequestsDone.has(bidderRequest));
    bidderRequest.bids.forEach(bid => {
      if (!bidResponseMap[bid.bidId]) {
        auctionInstance.addNoBid(bid);
        _events_js__WEBPACK_IMPORTED_MODULE_1__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS.NO_BID, bid);
      }
    });
    if (allAdapterCalledDone && outstandingBidsAdded === 0) {
      auctionDone();
    }
  }
  return {
    addBidResponse: function () {
      function addBid(adUnitCode, bid) {
        addBidResponse.call({
          dispatch: acceptBidResponse
        }, adUnitCode, bid, (() => {
          let rejected = false;
          return reason => {
            if (!rejected) {
              rejectBidResponse(adUnitCode, bid, reason);
              rejected = true;
            }
          };
        })());
      }
      addBid.reject = rejectBidResponse;
      return addBid;
    }(),
    adapterDone: function () {
      responsesReady(_utils_promise_js__WEBPACK_IMPORTED_MODULE_6__.GreedyPromise.resolve()).finally(() => adapterDone.call(this));
    }
  };
}

// Add a bid to the auction.
function addBidToAuction(auctionInstance, bidResponse) {
  setupBidTargeting(bidResponse);
  (0,_utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_4__.useMetrics)(bidResponse.metrics).timeSince('addBidResponse', 'addBidResponse.total');
  auctionInstance.addBidReceived(bidResponse);
  _events_js__WEBPACK_IMPORTED_MODULE_1__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS.BID_RESPONSE, bidResponse);
}

// Video bids may fail if the cache is down, or there's trouble on the network.
function tryAddVideoBid(auctionInstance, bidResponse, afterBidAdded) {
  let {
    index = _auctionManager_js__WEBPACK_IMPORTED_MODULE_10__.auctionManager.index
  } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  let addBid = true;
  const videoMediaType = (0,_utils_js__WEBPACK_IMPORTED_MODULE_14__["default"])(index.getMediaTypes({
    requestId: bidResponse.originalRequestId || bidResponse.requestId,
    adUnitId: bidResponse.adUnitId
  }), 'video');
  const context = videoMediaType && (0,_utils_js__WEBPACK_IMPORTED_MODULE_14__["default"])(videoMediaType, 'context');
  const useCacheKey = videoMediaType && (0,_utils_js__WEBPACK_IMPORTED_MODULE_14__["default"])(videoMediaType, 'useCacheKey');
  if (_config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('cache.url') && (useCacheKey || context !== _video_js__WEBPACK_IMPORTED_MODULE_15__.OUTSTREAM)) {
    if (!bidResponse.videoCacheKey || _config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('cache.ignoreBidderCacheKey')) {
      addBid = false;
      callPrebidCache(auctionInstance, bidResponse, afterBidAdded, videoMediaType);
    } else if (!bidResponse.vastUrl) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logError)('videoCacheKey specified but not required vastUrl for video bid');
      addBid = false;
    }
  }
  if (addBid) {
    addBidToAuction(auctionInstance, bidResponse);
    afterBidAdded();
  }
}
const callPrebidCache = (0,_hook_js__WEBPACK_IMPORTED_MODULE_9__.hook)('async', function (auctionInstance, bidResponse, afterBidAdded, videoMediaType) {
  if (true) {
    (0,_videoCache_js__WEBPACK_IMPORTED_MODULE_16__.batchAndStore)(auctionInstance, bidResponse, afterBidAdded);
  }
}, 'callPrebidCache');

/**
 * Augment `bidResponse` with properties that are common across all bids - including rejected bids.
 *
 */
function addCommonResponseProperties(bidResponse, adUnitCode) {
  let {
    index = _auctionManager_js__WEBPACK_IMPORTED_MODULE_10__.auctionManager.index
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const bidderRequest = index.getBidderRequest(bidResponse);
  const adUnit = index.getAdUnit(bidResponse);
  const start = bidderRequest && bidderRequest.start || bidResponse.requestTimestamp;
  Object.assign(bidResponse, {
    responseTimestamp: bidResponse.responseTimestamp || (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.timestamp)(),
    requestTimestamp: bidResponse.requestTimestamp || start,
    cpm: parseFloat(bidResponse.cpm) || 0,
    bidder: bidResponse.bidder || bidResponse.bidderCode,
    adUnitCode
  });
  if (adUnit?.ttlBuffer != null) {
    bidResponse.ttlBuffer = adUnit.ttlBuffer;
  }
  bidResponse.timeToRespond = bidResponse.responseTimestamp - bidResponse.requestTimestamp;
}

/**
 * Add additional bid response properties that are universal for all _accepted_ bids.
 */
function getPreparedBidForAuction(bid) {
  let {
    index = _auctionManager_js__WEBPACK_IMPORTED_MODULE_10__.auctionManager.index
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  // Let listeners know that now is the time to adjust the bid, if they want to.
  //
  // CAREFUL: Publishers rely on certain bid properties to be available (like cpm),
  // but others to not be set yet (like priceStrings). See #1372 and #1389.
  _events_js__WEBPACK_IMPORTED_MODULE_1__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS.BID_ADJUSTMENT, bid);

  // a publisher-defined renderer can be used to render bids
  const bidRenderer = index.getBidRequest(bid)?.renderer || index.getAdUnit(bid).renderer;

  // a publisher can also define a renderer for a mediaType
  const bidObjectMediaType = bid.mediaType;
  const mediaTypes = index.getMediaTypes(bid);
  const bidMediaType = mediaTypes && mediaTypes[bidObjectMediaType];
  var mediaTypeRenderer = bidMediaType && bidMediaType.renderer;
  var renderer = null;

  // the renderer for the mediaType takes precendence
  if (mediaTypeRenderer && mediaTypeRenderer.render && !(mediaTypeRenderer.backupOnly === true && bid.renderer)) {
    renderer = mediaTypeRenderer;
  } else if (bidRenderer && bidRenderer.render && !(bidRenderer.backupOnly === true && bid.renderer)) {
    renderer = bidRenderer;
  }
  if (renderer) {
    // be aware, an adapter could already have installed the bidder, in which case this overwrite's the existing adapter
    bid.renderer = _Renderer_js__WEBPACK_IMPORTED_MODULE_17__.Renderer.install({
      url: renderer.url,
      config: renderer.options,
      renderNow: renderer.url == null
    }); // rename options to config, to make it consistent?
    bid.renderer.setRender(renderer.render);
  }

  // Use the config value 'mediaTypeGranularity' if it has been defined for mediaType, else use 'customPriceBucket'
  const mediaTypeGranularity = getMediaTypeGranularity(bid.mediaType, mediaTypes, _config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('mediaTypePriceGranularity'));
  const priceStringsObj = (0,_cpmBucketManager_js__WEBPACK_IMPORTED_MODULE_18__.getPriceBucketString)(bid.cpm, typeof mediaTypeGranularity === 'object' ? mediaTypeGranularity : _config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('customPriceBucket'), _config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('currency.granularityMultiplier'));
  bid.pbLg = priceStringsObj.low;
  bid.pbMg = priceStringsObj.med;
  bid.pbHg = priceStringsObj.high;
  bid.pbAg = priceStringsObj.auto;
  bid.pbDg = priceStringsObj.dense;
  bid.pbCg = priceStringsObj.custom;
  return bid;
}
function setupBidTargeting(bidObject) {
  let keyValues;
  const cpmCheck = _bidderSettings_js__WEBPACK_IMPORTED_MODULE_19__.bidderSettings.get(bidObject.bidderCode, 'allowZeroCpmBids') === true ? bidObject.cpm >= 0 : bidObject.cpm > 0;
  if (bidObject.bidderCode && (cpmCheck || bidObject.dealId)) {
    keyValues = getKeyValueTargetingPairs(bidObject.bidderCode, bidObject);
  }

  // use any targeting provided as defaults, otherwise just set from getKeyValueTargetingPairs
  bidObject.adserverTargeting = Object.assign(bidObject.adserverTargeting || {}, keyValues);
}

/**
 * @param {MediaType} mediaType
 * @param mediaTypes media types map from adUnit
 * @param {MediaTypePriceGranularity} [mediaTypePriceGranularity]
 * @returns {(Object|string|undefined)}
 */
function getMediaTypeGranularity(mediaType, mediaTypes, mediaTypePriceGranularity) {
  if (mediaType && mediaTypePriceGranularity) {
    if ( true && mediaType === _mediaTypes_js__WEBPACK_IMPORTED_MODULE_11__.VIDEO) {
      const context = (0,_utils_js__WEBPACK_IMPORTED_MODULE_14__["default"])(mediaTypes, `${_mediaTypes_js__WEBPACK_IMPORTED_MODULE_11__.VIDEO}.context`, 'instream');
      if (mediaTypePriceGranularity[`${_mediaTypes_js__WEBPACK_IMPORTED_MODULE_11__.VIDEO}-${context}`]) {
        return mediaTypePriceGranularity[`${_mediaTypes_js__WEBPACK_IMPORTED_MODULE_11__.VIDEO}-${context}`];
      }
    }
    return mediaTypePriceGranularity[mediaType];
  }
}

/**
 * This function returns the price granularity defined. It can be either publisher defined or default value
 * @param {Bid} bid bid response object
 * @param {object} obj
 * @param {object} obj.index
 * @returns {string} granularity
 */
const getPriceGranularity = function (bid) {
  let {
    index = _auctionManager_js__WEBPACK_IMPORTED_MODULE_10__.auctionManager.index
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  // Use the config value 'mediaTypeGranularity' if it has been set for mediaType, else use 'priceGranularity'
  const mediaTypeGranularity = getMediaTypeGranularity(bid.mediaType, index.getMediaTypes(bid), _config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('mediaTypePriceGranularity'));
  const granularity = typeof bid.mediaType === 'string' && mediaTypeGranularity ? typeof mediaTypeGranularity === 'string' ? mediaTypeGranularity : 'custom' : _config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('priceGranularity');
  return granularity;
};

/**
 * This function returns a function to get bid price by price granularity
 * @param {string} granularity
 * @returns {function}
 */
const getPriceByGranularity = granularity => {
  return bid => {
    const bidGranularity = granularity || getPriceGranularity(bid);
    if (bidGranularity === _constants_js__WEBPACK_IMPORTED_MODULE_2__.GRANULARITY_OPTIONS.AUTO) {
      return bid.pbAg;
    } else if (bidGranularity === _constants_js__WEBPACK_IMPORTED_MODULE_2__.GRANULARITY_OPTIONS.DENSE) {
      return bid.pbDg;
    } else if (bidGranularity === _constants_js__WEBPACK_IMPORTED_MODULE_2__.GRANULARITY_OPTIONS.LOW) {
      return bid.pbLg;
    } else if (bidGranularity === _constants_js__WEBPACK_IMPORTED_MODULE_2__.GRANULARITY_OPTIONS.MEDIUM) {
      return bid.pbMg;
    } else if (bidGranularity === _constants_js__WEBPACK_IMPORTED_MODULE_2__.GRANULARITY_OPTIONS.HIGH) {
      return bid.pbHg;
    } else if (bidGranularity === _constants_js__WEBPACK_IMPORTED_MODULE_2__.GRANULARITY_OPTIONS.CUSTOM) {
      return bid.pbCg;
    }
  };
};

/**
 * This function returns a function to get crid from bid response
 * @returns {function}
 */
const getCreativeId = () => {
  return bid => {
    return bid.creativeId ? bid.creativeId : '';
  };
};

/**
 * This function returns a function to get first advertiser domain from bid response meta
 * @returns {function}
 */
const getAdvertiserDomain = () => {
  return bid => {
    return bid.meta && bid.meta.advertiserDomains && bid.meta.advertiserDomains.length > 0 ? [bid.meta.advertiserDomains].flat()[0] : '';
  };
};

/**
 * This function returns a function to get dsp name or id from bid response meta
 * @returns {function}
 */
const getDSP = () => {
  return bid => {
    return bid.meta && (bid.meta.networkId || bid.meta.networkName) ? (0,_utils_js__WEBPACK_IMPORTED_MODULE_14__["default"])(bid, 'meta.networkName') || (0,_utils_js__WEBPACK_IMPORTED_MODULE_14__["default"])(bid, 'meta.networkId') : '';
  };
};

/**
 * This function returns a function to get the primary category id from bid response meta
 * @returns {function}
 */
const getPrimaryCatId = () => {
  return bid => {
    return bid.meta && bid.meta.primaryCatId ? bid.meta.primaryCatId : '';
  };
};

// factory for key value objs
function createKeyVal(key, value) {
  return {
    key,
    val: typeof value === 'function' ? function (bidResponse, bidReq) {
      return value(bidResponse, bidReq);
    } : function (bidResponse) {
      return (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.getValue)(bidResponse, value);
    }
  };
}
function defaultAdserverTargeting() {
  return [createKeyVal(_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.BIDDER, 'bidderCode'), createKeyVal(_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.AD_ID, 'adId'), createKeyVal(_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.PRICE_BUCKET, getPriceByGranularity()), createKeyVal(_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.SIZE, 'size'), createKeyVal(_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.DEAL, 'dealId'), createKeyVal(_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.SOURCE, 'source'), createKeyVal(_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.FORMAT, 'mediaType'), createKeyVal(_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.ADOMAIN, getAdvertiserDomain()), createKeyVal(_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.ACAT, getPrimaryCatId()), createKeyVal(_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.DSP, getDSP()), createKeyVal(_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.CRID, getCreativeId())];
}

/**
 * @param {string} mediaType
 * @param {string} bidderCode
 * @returns {*}
 */
function getStandardBidderSettings(mediaType, bidderCode) {
  const standardSettings = Object.assign({}, _bidderSettings_js__WEBPACK_IMPORTED_MODULE_19__.bidderSettings.settingsFor(null));
  if (!standardSettings[_constants_js__WEBPACK_IMPORTED_MODULE_2__.JSON_MAPPING.ADSERVER_TARGETING]) {
    standardSettings[_constants_js__WEBPACK_IMPORTED_MODULE_2__.JSON_MAPPING.ADSERVER_TARGETING] = defaultAdserverTargeting();
  }
  if ( true && mediaType === 'video') {
    const adserverTargeting = standardSettings[_constants_js__WEBPACK_IMPORTED_MODULE_2__.JSON_MAPPING.ADSERVER_TARGETING].slice();
    standardSettings[_constants_js__WEBPACK_IMPORTED_MODULE_2__.JSON_MAPPING.ADSERVER_TARGETING] = adserverTargeting;

    // Adding hb_uuid + hb_cache_id
    [_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.UUID, _constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.CACHE_ID].forEach(targetingKeyVal => {
      if (typeof (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_13__.find)(adserverTargeting, kvPair => kvPair.key === targetingKeyVal) === 'undefined') {
        adserverTargeting.push(createKeyVal(targetingKeyVal, 'videoCacheKey'));
      }
    });

    // Adding hb_cache_host
    if (_config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('cache.url') && (!bidderCode || _bidderSettings_js__WEBPACK_IMPORTED_MODULE_19__.bidderSettings.get(bidderCode, 'sendStandardTargeting') !== false)) {
      const urlInfo = (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.parseUrl)(_config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('cache.url'));
      if (typeof (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_13__.find)(adserverTargeting, targetingKeyVal => targetingKeyVal.key === _constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.CACHE_HOST) === 'undefined') {
        adserverTargeting.push(createKeyVal(_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.CACHE_HOST, function (bidResponse) {
          return (0,_utils_js__WEBPACK_IMPORTED_MODULE_14__["default"])(bidResponse, `adserverTargeting.${_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.CACHE_HOST}`) ? bidResponse.adserverTargeting[_constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.CACHE_HOST] : urlInfo.hostname;
        }));
      }
    }
  }
  return standardSettings;
}
function getKeyValueTargetingPairs(bidderCode, custBidObj) {
  let {
    index = _auctionManager_js__WEBPACK_IMPORTED_MODULE_10__.auctionManager.index
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  if (!custBidObj) {
    return {};
  }
  const bidRequest = index.getBidRequest(custBidObj);
  var keyValues = {};

  // 1) set the keys from "standard" setting or from prebid defaults
  // initialize default if not set
  const standardSettings = getStandardBidderSettings(custBidObj.mediaType, bidderCode);
  setKeys(keyValues, standardSettings, custBidObj, bidRequest);

  // 2) set keys from specific bidder setting override if they exist
  if (bidderCode && _bidderSettings_js__WEBPACK_IMPORTED_MODULE_19__.bidderSettings.getOwn(bidderCode, _constants_js__WEBPACK_IMPORTED_MODULE_2__.JSON_MAPPING.ADSERVER_TARGETING)) {
    setKeys(keyValues, _bidderSettings_js__WEBPACK_IMPORTED_MODULE_19__.bidderSettings.ownSettingsFor(bidderCode), custBidObj, bidRequest);
    custBidObj.sendStandardTargeting = _bidderSettings_js__WEBPACK_IMPORTED_MODULE_19__.bidderSettings.get(bidderCode, 'sendStandardTargeting');
  }

  // set native key value targeting
  if ( true && custBidObj['native']) {
    keyValues = Object.assign({}, keyValues, (0,_native_js__WEBPACK_IMPORTED_MODULE_12__.getNativeTargeting)(custBidObj));
  }
  return keyValues;
}
function setKeys(keyValues, bidderSettings, custBidObj, bidReq) {
  var targeting = bidderSettings[_constants_js__WEBPACK_IMPORTED_MODULE_2__.JSON_MAPPING.ADSERVER_TARGETING];
  custBidObj.size = custBidObj.getSize();
  (targeting || []).forEach(function (kvPair) {
    var key = kvPair.key;
    var value = kvPair.val;
    if (keyValues[key]) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logWarn)('The key: ' + key + ' is being overwritten');
    }
    if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.isFn)(value)) {
      try {
        value = value(custBidObj, bidReq);
      } catch (e) {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logError)('bidmanager', 'ERROR', e);
      }
    }
    if ((typeof bidderSettings.suppressEmptyKeys !== 'undefined' && bidderSettings.suppressEmptyKeys === true || key === _constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.DEAL || key === _constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.ACAT || key === _constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.DSP || key === _constants_js__WEBPACK_IMPORTED_MODULE_2__.TARGETING_KEYS.CRID) && (
    // hb_deal & hb_acat are suppressed automatically if not set

    (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.isEmptyStr)(value) || value === null || value === undefined)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_5__.logInfo)("suppressing empty key '" + key + "' from adserver targeting");
    } else {
      keyValues[key] = value;
    }
  });
  return keyValues;
}
function adjustBids(bid) {
  let bidPriceAdjusted = (0,_utils_cpm_js__WEBPACK_IMPORTED_MODULE_20__.adjustCpm)(bid.cpm, bid);
  if (bidPriceAdjusted >= 0) {
    bid.cpm = bidPriceAdjusted;
  }
}

/**
 * groupByPlacement is a reduce function that converts an array of Bid objects
 * to an object with placement codes as keys, with each key representing an object
 * with an array of `Bid` objects for that placement
 * @returns {*} as { [adUnitCode]: { bids: [Bid, Bid, Bid] } }
 */
function groupByPlacement(bidsByPlacement, bid) {
  if (!bidsByPlacement[bid.adUnitCode]) {
    bidsByPlacement[bid.adUnitCode] = {
      bids: []
    };
  }
  bidsByPlacement[bid.adUnitCode].bids.push(bid);
  return bidsByPlacement;
}

/**
 * isValidPrice is price validation function
 * which checks if price from bid response
 * is not higher than top limit set in config
 * @type {Function}
 * @param bid
 * @returns {boolean}
 */
function isValidPrice(bid) {
  const maxBidValue = _config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('maxBid');
  if (!maxBidValue || !bid.cpm) return true;
  return maxBidValue >= Number(bid.cpm);
}

/***/ }),

/***/ "./src/auctionIndex.js":
/*!*****************************!*\
  !*** ./src/auctionIndex.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AuctionIndex: () => (/* binding */ AuctionIndex)
/* harmony export */ });
/**
 * @typedef {Object} AuctionIndex
 *
 * @property {function({ auctionId: * }): *} getAuction Returns auction instance for `auctionId`
 * @property {function({ adUnitId: * }): *} getAdUnit Returns `adUnit` object for `transactionId`.
 * You should prefer `getMediaTypes` for looking up bid media types.
 * @property {function({ adUnitId: *, requestId: * }): *} getMediaTypes Returns mediaTypes object from bidRequest (through `requestId`) falling back to the adUnit (through `transactionId`).
 * The bidRequest is given precedence because its mediaTypes can differ from the adUnit's (if bidder-specific labels are in use).
 * Bids that have no associated request do not have labels either, and use the adUnit's mediaTypes.
 * @property {function({ requestId: *, bidderRequestId: * }): *} getBidderRequest Returns bidderRequest that matches both requestId and bidderRequestId (if either or both are provided).
 * Bid responses are not guaranteed to have a corresponding request.
 * @property {function({ requestId: * }): *} getBidRequest Returns bidRequest object for requestId.
 * Bid responses are not guaranteed to have a corresponding request.
 */

/**
 * Retrieves request-related bid data.
 * All methods are designed to work with Bid (response) objects returned by bid adapters.
 */
function AuctionIndex(getAuctions) {
  Object.assign(this, {
    getAuction(_ref) {
      let {
        auctionId
      } = _ref;
      if (auctionId != null) {
        return getAuctions().find(auction => auction.getAuctionId() === auctionId);
      }
    },
    getAdUnit(_ref2) {
      let {
        adUnitId
      } = _ref2;
      if (adUnitId != null) {
        return getAuctions().flatMap(a => a.getAdUnits()).find(au => au.adUnitId === adUnitId);
      }
    },
    getMediaTypes(_ref3) {
      let {
        adUnitId,
        requestId
      } = _ref3;
      if (requestId != null) {
        const req = this.getBidRequest({
          requestId
        });
        if (req != null && (adUnitId == null || req.adUnitId === adUnitId)) {
          return req.mediaTypes;
        }
      } else if (adUnitId != null) {
        const au = this.getAdUnit({
          adUnitId
        });
        if (au != null) {
          return au.mediaTypes;
        }
      }
    },
    getBidderRequest(_ref4) {
      let {
        requestId,
        bidderRequestId
      } = _ref4;
      if (requestId != null || bidderRequestId != null) {
        let bers = getAuctions().flatMap(a => a.getBidRequests());
        if (bidderRequestId != null) {
          bers = bers.filter(ber => ber.bidderRequestId === bidderRequestId);
        }
        if (requestId == null) {
          return bers[0];
        } else {
          return bers.find(ber => ber.bids && ber.bids.find(br => br.bidId === requestId) != null);
        }
      }
    },
    getBidRequest(_ref5) {
      let {
        requestId
      } = _ref5;
      if (requestId != null) {
        return getAuctions().flatMap(a => a.getBidRequests()).flatMap(ber => ber.bids).find(br => br && br.bidId === requestId);
      }
    },
    getOrtb2(bid) {
      return this.getBidderRequest(bid)?.ortb2 || this.getAuction(bid)?.getFPD()?.global?.ortb2;
    }
  });
}

/***/ }),

/***/ "./src/auctionManager.js":
/*!*******************************!*\
  !*** ./src/auctionManager.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   auctionManager: () => (/* binding */ auctionManager)
/* harmony export */ });
/* unused harmony export newAuctionManager */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _auction_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./auction.js */ "./src/auction.js");
/* harmony import */ var _auctionIndex_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./auctionIndex.js */ "./src/auctionIndex.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./constants.js */ "./src/constants.js");
/* harmony import */ var _utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils/perfMetrics.js */ "./src/utils/perfMetrics.js");
/* harmony import */ var _utils_ttlCollection_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/ttlCollection.js */ "./src/utils/ttlCollection.js");
/* harmony import */ var _bidTTL_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./bidTTL.js */ "./src/bidTTL.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/**
 * AuctionManager modules is responsible for creating auction instances.
 * This module is the gateway for Prebid core to access auctions.
 * It stores all created instances of auction and can be used to get consolidated values from auction.
 */

/**
 * @typedef {Object} AuctionManager
 *
 * @property {function(): Array} getBidsRequested - returns consolidated bid requests
 * @property {function(): Array} getBidsReceived - returns consolidated bid received
 * @property {function(): Array} getAllBidsForAdUnitCode - returns consolidated bid received for a given adUnit
 * @property {function(): Array} getAdUnits - returns consolidated adUnits
 * @property {function(): Array} getAdUnitCodes - returns consolidated adUnitCodes
 * @property {function(): Object} createAuction - creates auction instance and stores it for future reference
 * @property {function(): Object} findBidByAdId - find bid received by adId. This function will be called by $$PREBID_GLOBAL$$.renderAd
 * @property {function(): Object} getStandardBidderAdServerTargeting - returns standard bidder targeting for all the adapters. Refer http://prebid.org/dev-docs/publisher-api-reference.html#module_pbjs.bidderSettings for more details
 * @property {function(Object): void} addWinningBid - add a winning bid to an auction based on auctionId
 * @property {function(): void} clearAllAuctions - clear all auctions for testing
 * @property {AuctionIndex} index
 */









const CACHE_TTL_SETTING = 'minBidCacheTTL';

/**
 * Creates new instance of auctionManager. There will only be one instance of auctionManager but
 * a factory is created to assist in testing.
 *
 * @returns {AuctionManager} auctionManagerInstance
 */
function newAuctionManager() {
  let minCacheTTL = null;
  const _auctions = (0,_utils_ttlCollection_js__WEBPACK_IMPORTED_MODULE_0__.ttlCollection)({
    startTime: au => au.end.then(() => au.getAuctionEnd()),
    ttl: au => minCacheTTL == null ? null : au.end.then(() => {
      return Math.max(minCacheTTL, ...au.getBidsReceived().map(_bidTTL_js__WEBPACK_IMPORTED_MODULE_1__.getTTL)) * 1000;
    })
  });
  (0,_bidTTL_js__WEBPACK_IMPORTED_MODULE_1__.onTTLBufferChange)(() => {
    if (minCacheTTL != null) _auctions.refresh();
  });
  _config_js__WEBPACK_IMPORTED_MODULE_2__.config.getConfig(CACHE_TTL_SETTING, cfg => {
    const prev = minCacheTTL;
    minCacheTTL = cfg?.[CACHE_TTL_SETTING];
    minCacheTTL = typeof minCacheTTL === 'number' ? minCacheTTL : null;
    if (prev !== minCacheTTL) {
      _auctions.refresh();
    }
  });
  const auctionManager = {
    onExpiry: _auctions.onExpiry
  };
  function getAuction(auctionId) {
    for (const auction of _auctions) {
      if (auction.getAuctionId() === auctionId) return auction;
    }
  }
  auctionManager.addWinningBid = function (bid) {
    const metrics = (0,_utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_3__.useMetrics)(bid.metrics);
    metrics.checkpoint('bidWon');
    metrics.timeBetween('auctionEnd', 'bidWon', 'adserver.pending');
    metrics.timeBetween('requestBids', 'bidWon', 'adserver.e2e');
    const auction = getAuction(bid.auctionId);
    if (auction) {
      auction.addWinningBid(bid);
    } else {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logWarn)(`Auction not found when adding winning bid`);
    }
  };
  Object.entries({
    getAllWinningBids: {
      name: 'getWinningBids'
    },
    getBidsRequested: {
      name: 'getBidRequests'
    },
    getNoBids: {},
    getAdUnits: {},
    getBidsReceived: {
      pre(auction) {
        return auction.getAuctionStatus() === _auction_js__WEBPACK_IMPORTED_MODULE_5__.AUCTION_COMPLETED;
      }
    },
    getAdUnitCodes: {
      post: _utils_js__WEBPACK_IMPORTED_MODULE_4__.uniques
    }
  }).forEach(_ref => {
    let [mgrMethod, {
      name = mgrMethod,
      pre,
      post
    }] = _ref;
    const mapper = pre == null ? auction => auction[name]() : auction => pre(auction) ? auction[name]() : [];
    const filter = post == null ? items => items : items => items.filter(post);
    auctionManager[mgrMethod] = () => {
      return filter(_auctions.toArray().flatMap(mapper));
    };
  });
  function allBidsReceived() {
    return _auctions.toArray().flatMap(au => au.getBidsReceived());
  }
  auctionManager.getAllBidsForAdUnitCode = function (adUnitCode) {
    return allBidsReceived().filter(bid => bid && bid.adUnitCode === adUnitCode);
  };
  auctionManager.createAuction = function (opts) {
    const auction = (0,_auction_js__WEBPACK_IMPORTED_MODULE_5__.newAuction)(opts);
    _addAuction(auction);
    return auction;
  };
  auctionManager.findBidByAdId = function (adId) {
    return allBidsReceived().find(bid => bid.adId === adId);
  };
  auctionManager.getStandardBidderAdServerTargeting = function () {
    return (0,_auction_js__WEBPACK_IMPORTED_MODULE_5__.getStandardBidderSettings)()[_constants_js__WEBPACK_IMPORTED_MODULE_6__.JSON_MAPPING.ADSERVER_TARGETING];
  };
  auctionManager.setStatusForBids = function (adId, status) {
    let bid = auctionManager.findBidByAdId(adId);
    if (bid) bid.status = status;
    if (bid && status === _constants_js__WEBPACK_IMPORTED_MODULE_6__.BID_STATUS.BID_TARGETING_SET) {
      const auction = getAuction(bid.auctionId);
      if (auction) auction.setBidTargeting(bid);
    }
  };
  auctionManager.getLastAuctionId = function () {
    const auctions = _auctions.toArray();
    return auctions.length && auctions[auctions.length - 1].getAuctionId();
  };
  auctionManager.clearAllAuctions = function () {
    _auctions.clear();
  };
  function _addAuction(auction) {
    _auctions.add(auction);
  }
  auctionManager.index = new _auctionIndex_js__WEBPACK_IMPORTED_MODULE_7__.AuctionIndex(() => _auctions.toArray());
  return auctionManager;
}
const auctionManager = newAuctionManager();

/***/ }),

/***/ "./src/bidTTL.js":
/*!***********************!*\
  !*** ./src/bidTTL.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getTTL: () => (/* binding */ getTTL),
/* harmony export */   onTTLBufferChange: () => (/* binding */ onTTLBufferChange)
/* harmony export */ });
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");


let TTL_BUFFER = 1;
const listeners = [];
_config_js__WEBPACK_IMPORTED_MODULE_0__.config.getConfig('ttlBuffer', cfg => {
  if (typeof cfg.ttlBuffer === 'number') {
    const prev = TTL_BUFFER;
    TTL_BUFFER = cfg.ttlBuffer;
    if (prev !== TTL_BUFFER) {
      listeners.forEach(l => l(TTL_BUFFER));
    }
  } else {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logError)('Invalid value for ttlBuffer', cfg.ttlBuffer);
  }
});
function getTTL(bid) {
  return bid.ttl - (bid.hasOwnProperty('ttlBuffer') ? bid.ttlBuffer : TTL_BUFFER);
}
function onTTLBufferChange(listener) {
  listeners.push(listener);
}

/***/ }),

/***/ "./src/bidderSettings.js":
/*!*******************************!*\
  !*** ./src/bidderSettings.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   bidderSettings: () => (/* binding */ bidderSettings)
/* harmony export */ });
/* unused harmony export ScopedSettings */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ "./node_modules/dlv/index.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _prebidGlobal_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./prebidGlobal.js */ "./src/prebidGlobal.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./constants.js */ "./src/constants.js");



class ScopedSettings {
  constructor(getSettings, defaultScope) {
    this.getSettings = getSettings;
    this.defaultScope = defaultScope;
  }

  /**
   * Get setting value at `path` under the given scope, falling back to the default scope if needed.
   * If `scope` is `null`, get the setting's default value.
   * @param scope {String|null}
   * @param path {String}
   * @returns {*}
   */
  get(scope, path) {
    let value = this.getOwn(scope, path);
    if (typeof value === 'undefined') {
      value = this.getOwn(null, path);
    }
    return value;
  }

  /**
   * Get the setting value at `path` *without* falling back to the default value.
   * @param scope {String}
   * @param path {String}
   * @returns {*}
   */
  getOwn(scope, path) {
    scope = this.#resolveScope(scope);
    return (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__["default"])(this.getSettings(), `${scope}.${path}`);
  }

  /**
   * @returns {string[]} all existing scopes except the default one.
   */
  getScopes() {
    return Object.keys(this.getSettings()).filter(scope => scope !== this.defaultScope);
  }

  /**
   * @returns all settings in the given scope, merged with the settings for the default scope.
   */
  settingsFor(scope) {
    return (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.mergeDeep)({}, this.ownSettingsFor(null), this.ownSettingsFor(scope));
  }

  /**
   * @returns all settings in the given scope, *without* any of the default settings.
   */
  ownSettingsFor(scope) {
    scope = this.#resolveScope(scope);
    return this.getSettings()[scope] || {};
  }
  #resolveScope(scope) {
    if (scope == null) {
      return this.defaultScope;
    } else {
      return scope;
    }
  }
}
const bidderSettings = new ScopedSettings(() => (0,_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_2__.getGlobal)().bidderSettings || {}, _constants_js__WEBPACK_IMPORTED_MODULE_3__.JSON_MAPPING.BD_SETTING_STANDARD);

/***/ }),

/***/ "./src/bidfactory.js":
/*!***************************!*\
  !*** ./src/bidfactory.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createBid: () => (/* binding */ createBid)
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");


/**
 Required paramaters
 bidderCode,
 height,
 width,
 statusCode
 Optional paramaters
 adId,
 cpm,
 ad,
 adUrl,
 dealId,
 priceKeyString;
 */
function Bid(statusCode) {
  let {
    src = 'client',
    bidder = '',
    bidId,
    transactionId,
    adUnitId,
    auctionId
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _bidSrc = src;
  var _statusCode = statusCode || 0;
  Object.assign(this, {
    bidderCode: bidder,
    width: 0,
    height: 0,
    statusMessage: _getStatus(),
    adId: (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.getUniqueIdentifierStr)(),
    requestId: bidId,
    transactionId,
    adUnitId,
    auctionId,
    mediaType: 'banner',
    source: _bidSrc
  });
  function _getStatus() {
    switch (_statusCode) {
      case 0:
        return 'Pending';
      case 1:
        return 'Bid available';
      case 2:
        return 'Bid returned empty or error response';
      case 3:
        return 'Bid timed out';
    }
  }
  this.getStatusCode = function () {
    return _statusCode;
  };

  // returns the size of the bid creative. Concatenation of width and height by â€˜xâ€™.
  this.getSize = function () {
    return this.width + 'x' + this.height;
  };
  this.getIdentifiers = function () {
    return {
      src: this.source,
      bidder: this.bidderCode,
      bidId: this.requestId,
      transactionId: this.transactionId,
      adUnitId: this.adUnitId,
      auctionId: this.auctionId
    };
  };
}

// Bid factory function.
function createBid(statusCode, identifiers) {
  return new Bid(statusCode, identifiers);
}

/***/ }),

/***/ "./src/config.js":
/*!***********************!*\
  !*** ./src/config.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RANDOM: () => (/* binding */ RANDOM),
/* harmony export */   config: () => (/* binding */ config)
/* harmony export */ });
/* unused harmony export newConfig */
/* harmony import */ var _cpmBucketManager_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./cpmBucketManager.js */ "./src/cpmBucketManager.js");
/* harmony import */ var _polyfill_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils.js */ "./node_modules/dlv/index.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./constants.js */ "./src/constants.js");
/*
 * Module for getting and setting Prebid configuration.
*/

/**
 * @typedef {Object} MediaTypePriceGranularity
 *
 * @property {(string|Object)} [banner]
 * @property {(string|Object)} [native]
 * @property {(string|Object)} [video]
 * @property {(string|Object)} [video-instream]
 * @property {(string|Object)} [video-outstream]
 */





const DEFAULT_DEBUG = (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.getParameterByName)(_constants_js__WEBPACK_IMPORTED_MODULE_1__.DEBUG_MODE).toUpperCase() === 'TRUE';
const DEFAULT_BIDDER_TIMEOUT = 3000;
const DEFAULT_ENABLE_SEND_ALL_BIDS = true;
const DEFAULT_DISABLE_AJAX_TIMEOUT = false;
const DEFAULT_BID_CACHE = false;
const DEFAULT_DEVICE_ACCESS = true;
const DEFAULT_MAX_NESTED_IFRAMES = 10;
const DEFAULT_MAXBID_VALUE = 5000;
const DEFAULT_IFRAMES_CONFIG = {};
const RANDOM = 'random';
const FIXED = 'fixed';
const VALID_ORDERS = {};
VALID_ORDERS[RANDOM] = true;
VALID_ORDERS[FIXED] = true;
const DEFAULT_BIDDER_SEQUENCE = RANDOM;
const GRANULARITY_OPTIONS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  AUTO: 'auto',
  DENSE: 'dense',
  CUSTOM: 'custom'
};
const ALL_TOPICS = '*';
function attachProperties(config) {
  let useDefaultValues = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  const values = useDefaultValues ? {
    priceGranularity: GRANULARITY_OPTIONS.MEDIUM,
    customPriceBucket: {},
    mediaTypePriceGranularity: {},
    bidderSequence: DEFAULT_BIDDER_SEQUENCE,
    auctionOptions: {}
  } : {};
  function getProp(name) {
    return values[name];
  }
  function setProp(name, val) {
    if (!values.hasOwnProperty(name)) {
      Object.defineProperty(config, name, {
        enumerable: true
      });
    }
    values[name] = val;
  }
  const props = {
    publisherDomain: {
      set(val) {
        if (val != null) {
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logWarn)('publisherDomain is deprecated and has no effect since v7 - use pageUrl instead');
        }
        setProp('publisherDomain', val);
      }
    },
    priceGranularity: {
      set(val) {
        if (validatePriceGranularity(val)) {
          if (typeof val === 'string') {
            setProp('priceGranularity', hasGranularity(val) ? val : GRANULARITY_OPTIONS.MEDIUM);
          } else if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(val)) {
            setProp('customPriceBucket', val);
            setProp('priceGranularity', GRANULARITY_OPTIONS.CUSTOM);
            (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logMessage)('Using custom price granularity');
          }
        }
      }
    },
    customPriceBucket: {},
    mediaTypePriceGranularity: {
      set(val) {
        val != null && setProp('mediaTypePriceGranularity', Object.keys(val).reduce((aggregate, item) => {
          if (validatePriceGranularity(val[item])) {
            if (typeof val === 'string') {
              aggregate[item] = hasGranularity(val[item]) ? val[item] : getProp('priceGranularity');
            } else if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(val)) {
              aggregate[item] = val[item];
              (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logMessage)(`Using custom price granularity for ${item}`);
            }
          } else {
            (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logWarn)(`Invalid price granularity for media type: ${item}`);
          }
          return aggregate;
        }, {}));
      }
    },
    bidderSequence: {
      set(val) {
        if (VALID_ORDERS[val]) {
          setProp('bidderSequence', val);
        } else {
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logWarn)(`Invalid order: ${val}. Bidder Sequence was not set.`);
        }
      }
    },
    auctionOptions: {
      set(val) {
        if (validateauctionOptions(val)) {
          setProp('auctionOptions', val);
        }
      }
    }
  };
  Object.defineProperties(config, Object.fromEntries(Object.entries(props).map(_ref => {
    let [k, def] = _ref;
    return [k, Object.assign({
      get: getProp.bind(null, k),
      set: setProp.bind(null, k),
      enumerable: values.hasOwnProperty(k),
      configurable: !values.hasOwnProperty(k)
    }, def)];
  })));
  return config;
  function hasGranularity(val) {
    return (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_2__.find)(Object.keys(GRANULARITY_OPTIONS), option => val === GRANULARITY_OPTIONS[option]);
  }
  function validatePriceGranularity(val) {
    if (!val) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logError)('Prebid Error: no value passed to `setPriceGranularity()`');
      return false;
    }
    if (typeof val === 'string') {
      if (!hasGranularity(val)) {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logWarn)('Prebid Warning: setPriceGranularity was called with invalid setting, using `medium` as default.');
      }
    } else if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(val)) {
      if (!(0,_cpmBucketManager_js__WEBPACK_IMPORTED_MODULE_3__.isValidPriceConfig)(val)) {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logError)('Invalid custom price value passed to `setPriceGranularity()`');
        return false;
      }
    }
    return true;
  }
  function validateauctionOptions(val) {
    if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(val)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logWarn)('Auction Options must be an object');
      return false;
    }
    for (let k of Object.keys(val)) {
      if (k !== 'secondaryBidders' && k !== 'suppressStaleRender') {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logWarn)(`Auction Options given an incorrect param: ${k}`);
        return false;
      }
      if (k === 'secondaryBidders') {
        if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isArray)(val[k])) {
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logWarn)(`Auction Options ${k} must be of type Array`);
          return false;
        } else if (!val[k].every(_utils_js__WEBPACK_IMPORTED_MODULE_0__.isStr)) {
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logWarn)(`Auction Options ${k} must be only string`);
          return false;
        }
      } else if (k === 'suppressStaleRender') {
        if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isBoolean)(val[k])) {
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logWarn)(`Auction Options ${k} must be of type boolean`);
          return false;
        }
      }
    }
    return true;
  }
}
function newConfig() {
  let listeners = [];
  let defaults;
  let config;
  let bidderConfig;
  let currBidder = null;
  function resetConfig() {
    defaults = {};
    let newConfig = attachProperties({
      // `debug` is equivalent to legacy `pbjs.logging` property
      debug: DEFAULT_DEBUG,
      bidderTimeout: DEFAULT_BIDDER_TIMEOUT,
      enableSendAllBids: DEFAULT_ENABLE_SEND_ALL_BIDS,
      useBidCache: DEFAULT_BID_CACHE,
      /**
       * deviceAccess set to false will disable setCookie, getCookie, hasLocalStorage
       * @type {boolean}
       */
      deviceAccess: DEFAULT_DEVICE_ACCESS,
      disableAjaxTimeout: DEFAULT_DISABLE_AJAX_TIMEOUT,
      // default max nested iframes for referer detection
      maxNestedIframes: DEFAULT_MAX_NESTED_IFRAMES,
      // default max bid
      maxBid: DEFAULT_MAXBID_VALUE,
      userSync: {
        topics: DEFAULT_IFRAMES_CONFIG
      }
    });
    if (config) {
      callSubscribers(Object.keys(config).reduce((memo, topic) => {
        if (config[topic] !== newConfig[topic]) {
          memo[topic] = newConfig[topic] || {};
        }
        return memo;
      }, {}));
    }
    config = newConfig;
    bidderConfig = {};
  }

  /**
   * Returns base config with bidder overrides (if there is currently a bidder)
   * @private
   */
  function _getConfig() {
    if (currBidder && bidderConfig && (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(bidderConfig[currBidder])) {
      let currBidderConfig = bidderConfig[currBidder];
      const configTopicSet = new Set(Object.keys(config).concat(Object.keys(currBidderConfig)));
      return (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_2__.arrayFrom)(configTopicSet).reduce((memo, topic) => {
        if (typeof currBidderConfig[topic] === 'undefined') {
          memo[topic] = config[topic];
        } else if (typeof config[topic] === 'undefined') {
          memo[topic] = currBidderConfig[topic];
        } else {
          if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(currBidderConfig[topic])) {
            memo[topic] = (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.mergeDeep)({}, config[topic], currBidderConfig[topic]);
          } else {
            memo[topic] = currBidderConfig[topic];
          }
        }
        return memo;
      }, {});
    }
    return Object.assign({}, config);
  }
  function _getRestrictedConfig() {
    // This causes reading 'ortb2' to throw an error; with prebid 7, that will almost
    // always be the incorrect way to access FPD configuration (https://github.com/prebid/Prebid.js/issues/7651)
    // code that needs the ortb2 config should explicitly use `getAnyConfig`
    // TODO: this is meant as a temporary tripwire to catch inadvertent use of `getConfig('ortb')` as we transition.
    // It should be removed once the risk of that happening is low enough.
    const conf = _getConfig();
    Object.defineProperty(conf, 'ortb2', {
      get: function () {
        throw new Error('invalid access to \'orbt2\' config - use request parameters instead');
      }
    });
    return conf;
  }
  const [getAnyConfig, getConfig] = [_getConfig, _getRestrictedConfig].map(accessor => {
    /*
     * Returns configuration object if called without parameters,
     * or single configuration property if given a string matching a configuration
     * property name.  Allows deep access e.g. getConfig('currency.adServerCurrency')
     *
     * If called with callback parameter, or a string and a callback parameter,
     * subscribes to configuration updates. See `subscribe` function for usage.
     */
    return function getConfig() {
      if (arguments.length <= 1 && typeof (arguments.length <= 0 ? undefined : arguments[0]) !== 'function') {
        const option = arguments.length <= 0 ? undefined : arguments[0];
        return option ? (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__["default"])(accessor(), option) : _getConfig();
      }
      return subscribe(...arguments);
    };
  });
  const [readConfig, readAnyConfig] = [getConfig, getAnyConfig].map(wrapee => {
    /*
     * Like getConfig, except that it returns a deepClone of the result.
     */
    return function readConfig() {
      let res = wrapee(...arguments);
      if (res && typeof res === 'object') {
        res = (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.deepClone)(res);
      }
      return res;
    };
  });

  /**
   * Internal API for modules (such as prebid-server) that might need access to all bidder config
   */
  function getBidderConfig() {
    return bidderConfig;
  }

  /*
   * Sets configuration given an object containing key-value pairs and calls
   * listeners that were added by the `subscribe` function
   */
  function setConfig(options) {
    if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(options)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logError)('setConfig options must be an object');
      return;
    }
    let topics = Object.keys(options);
    let topicalConfig = {};
    topics.forEach(topic => {
      let option = options[topic];
      if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(defaults[topic]) && (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(option)) {
        option = Object.assign({}, defaults[topic], option);
      }
      try {
        topicalConfig[topic] = config[topic] = option;
      } catch (e) {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logWarn)(`Cannot set config for property ${topic} : `, e);
      }
    });
    callSubscribers(topicalConfig);
  }

  /**
   * Sets configuration defaults which setConfig values can be applied on top of
   * @param {object} options
   */
  function setDefaults(options) {
    if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(defaults)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logError)('defaults must be an object');
      return;
    }
    Object.assign(defaults, options);
    // Add default values to config as well
    Object.assign(config, options);
  }

  /*
   * Adds a function to a set of listeners that are invoked whenever `setConfig`
   * is called. The subscribed function will be passed the options object that
   * was used in the `setConfig` call. Topics can be subscribed to to only get
   * updates when specific properties are updated by passing a topic string as
   * the first parameter.
   *
   * If `options.init` is true, the listener will be immediately called with the current options.
   *
   * Returns an `unsubscribe` function for removing the subscriber from the
   * set of listeners
   *
   * Example use:
   * // subscribe to all configuration changes
   * subscribe((config) => console.log('config set:', config));
   *
   * // subscribe to only 'logging' changes
   * subscribe('logging', (config) => console.log('logging set:', config));
   *
   * // unsubscribe
   * const unsubscribe = subscribe(...);
   * unsubscribe(); // no longer listening
   *
   */
  function subscribe(topic, listener) {
    let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    let callback = listener;
    if (typeof topic !== 'string') {
      // first param should be callback function in this case,
      // meaning it gets called for any config change
      callback = topic;
      topic = ALL_TOPICS;
      options = listener || {};
    }
    if (typeof callback !== 'function') {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logError)('listener must be a function');
      return;
    }
    const nl = {
      topic,
      callback
    };
    listeners.push(nl);
    if (options.init) {
      if (topic === ALL_TOPICS) {
        callback(getConfig());
      } else {
        // eslint-disable-next-line standard/no-callback-literal
        callback({
          [topic]: getConfig(topic)
        });
      }
    }

    // save and call this function to remove the listener
    return function unsubscribe() {
      listeners.splice(listeners.indexOf(nl), 1);
    };
  }

  /*
   * Calls listeners that were added by the `subscribe` function
   */
  function callSubscribers(options) {
    const TOPICS = Object.keys(options);

    // call subscribers of a specific topic, passing only that configuration
    listeners.filter(listener => (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_2__.includes)(TOPICS, listener.topic)).forEach(listener => {
      listener.callback({
        [listener.topic]: options[listener.topic]
      });
    });

    // call subscribers that didn't give a topic, passing everything that was set
    listeners.filter(listener => listener.topic === ALL_TOPICS).forEach(listener => listener.callback(options));
  }
  function setBidderConfig(config) {
    let mergeFlag = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    try {
      check(config);
      config.bidders.forEach(bidder => {
        if (!bidderConfig[bidder]) {
          bidderConfig[bidder] = attachProperties({}, false);
        }
        Object.keys(config.config).forEach(topic => {
          let option = config.config[topic];
          const currentConfig = bidderConfig[bidder][topic];
          if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(option) && (currentConfig == null || (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(currentConfig))) {
            const func = mergeFlag ? _utils_js__WEBPACK_IMPORTED_MODULE_0__.mergeDeep : Object.assign;
            bidderConfig[bidder][topic] = func({}, currentConfig || {}, option);
          } else {
            bidderConfig[bidder][topic] = option;
          }
        });
      });
    } catch (e) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logError)(e);
    }
    function check(obj) {
      if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(obj)) {
        throw 'setBidderConfig bidder options must be an object';
      }
      if (!(Array.isArray(obj.bidders) && obj.bidders.length)) {
        throw 'setBidderConfig bidder options must contain a bidders list with at least 1 bidder';
      }
      if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(obj.config)) {
        throw 'setBidderConfig bidder options must contain a config object';
      }
    }
  }
  function mergeConfig(obj) {
    if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(obj)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logError)('mergeConfig input must be an object');
      return;
    }
    const mergedConfig = (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.mergeDeep)(_getConfig(), obj);
    setConfig({
      ...mergedConfig
    });
    return mergedConfig;
  }
  function mergeBidderConfig(obj) {
    return setBidderConfig(obj, true);
  }

  /**
   * Internal functions for core to execute some synchronous code while having an active bidder set.
   */
  function runWithBidder(bidder, fn) {
    currBidder = bidder;
    try {
      return fn();
    } finally {
      resetBidder();
    }
  }
  function callbackWithBidder(bidder) {
    return function (cb) {
      return function () {
        if (typeof cb === 'function') {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          return runWithBidder(bidder, cb.bind(this, ...args));
        } else {
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logWarn)('config.callbackWithBidder callback is not a function');
        }
      };
    };
  }
  function getCurrentBidder() {
    return currBidder;
  }
  function resetBidder() {
    currBidder = null;
  }
  resetConfig();
  return {
    getCurrentBidder,
    resetBidder,
    getConfig,
    getAnyConfig,
    readConfig,
    readAnyConfig,
    setConfig,
    mergeConfig,
    setDefaults,
    resetConfig,
    runWithBidder,
    callbackWithBidder,
    setBidderConfig,
    getBidderConfig,
    mergeBidderConfig
  };
}

/**
 * Set a `cache.url` if we should use prebid-cache to store video bids before adding bids to the auction.
 * This must be set if you want to use the dfpAdServerVideo module.
 */
const config = newConfig();

/***/ }),

/***/ "./src/consentHandler.js":
/*!*******************************!*\
  !*** ./src/consentHandler.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GDPR_GVLIDS: () => (/* binding */ GDPR_GVLIDS),
/* harmony export */   allConsent: () => (/* binding */ allConsent),
/* harmony export */   gdprDataHandler: () => (/* binding */ gdprDataHandler),
/* harmony export */   gppDataHandler: () => (/* binding */ gppDataHandler),
/* harmony export */   uspDataHandler: () => (/* binding */ uspDataHandler)
/* harmony export */ });
/* unused harmony exports VENDORLESS_GVLID, ConsentHandler, gvlidRegistry, coppaDataHandler, multiHandler */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _utils_promise_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/promise.js */ "./src/utils/promise.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./config.js */ "./src/config.js");




/**
 * Placeholder gvlid for when vendor consent is not required. When this value is used as gvlid, the gdpr
 * enforcement module will take it to mean "vendor consent was given".
 *
 * see https://github.com/prebid/Prebid.js/issues/8161
 */
const VENDORLESS_GVLID = Object.freeze({});
class ConsentHandler {
  #enabled;
  #data;
  #defer;
  #ready;
  #dirty = true;
  #hash;
  generatedTime;
  hashFields;
  constructor() {
    this.reset();
  }
  #resolve(data) {
    this.#ready = true;
    this.#data = data;
    this.#defer.resolve(data);
  }

  /**
   * reset this handler (mainly for tests)
   */
  reset() {
    this.#defer = (0,_utils_promise_js__WEBPACK_IMPORTED_MODULE_0__.defer)();
    this.#enabled = false;
    this.#data = null;
    this.#ready = false;
    this.generatedTime = null;
  }

  /**
   * Enable this consent handler. This should be called by the relevant consent management module
   * on initialization.
   */
  enable() {
    this.#enabled = true;
  }

  /**
   * @returns {boolean} true if the related consent management module is enabled.
   */
  get enabled() {
    return this.#enabled;
  }

  /**
   * @returns {boolean} true if consent data has been resolved (it may be `null` if the resolution failed).
   */
  get ready() {
    return this.#ready;
  }

  /**
   * @returns a promise than resolves to the consent data, or null if no consent data is available
   */
  get promise() {
    if (this.#ready) {
      return _utils_promise_js__WEBPACK_IMPORTED_MODULE_0__.GreedyPromise.resolve(this.#data);
    }
    if (!this.#enabled) {
      this.#resolve(null);
    }
    return this.#defer.promise;
  }
  setConsentData(data) {
    let time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.timestamp)();
    this.generatedTime = time;
    this.#dirty = true;
    this.#resolve(data);
  }
  getConsentData() {
    return this.#data;
  }
  get hash() {
    if (this.#dirty) {
      this.#hash = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.cyrb53Hash)(JSON.stringify(this.#data && this.hashFields ? this.hashFields.map(f => this.#data[f]) : this.#data));
      this.#dirty = false;
    }
    return this.#hash;
  }
}
class UspConsentHandler extends ConsentHandler {
  getConsentMeta() {
    const consentData = this.getConsentData();
    if (consentData && this.generatedTime) {
      return {
        generatedAt: this.generatedTime
      };
    }
  }
}
class GdprConsentHandler extends ConsentHandler {
  hashFields = ['gdprApplies', 'consentString'];
  getConsentMeta() {
    const consentData = this.getConsentData();
    if (consentData && consentData.vendorData && this.generatedTime) {
      return {
        gdprApplies: consentData.gdprApplies,
        consentStringSize: (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.isStr)(consentData.vendorData.tcString) ? consentData.vendorData.tcString.length : 0,
        generatedAt: this.generatedTime,
        apiVersion: consentData.apiVersion
      };
    }
  }
}
class GppConsentHandler extends ConsentHandler {
  hashFields = ['applicableSections', 'gppString'];
  getConsentMeta() {
    const consentData = this.getConsentData();
    if (consentData && this.generatedTime) {
      return {
        generatedAt: this.generatedTime
      };
    }
  }
}
function gvlidRegistry() {
  const registry = {};
  const flat = {};
  const none = {};
  return {
    /**
     * Register a module's GVL ID.
     * @param {string} moduleType defined in `activities/modules.js`
     * @param {string} moduleName
     * @param {number} gvlid
     */
    register(moduleType, moduleName, gvlid) {
      if (gvlid) {
        (registry[moduleName] = registry[moduleName] || {})[moduleType] = gvlid;
        if (flat.hasOwnProperty(moduleName)) {
          if (flat[moduleName] !== gvlid) flat[moduleName] = none;
        } else {
          flat[moduleName] = gvlid;
        }
      }
    },
    /**
     * @typedef {Object} GvlIdResult
     * @property {Object.<string, number>} modules - A map from module type to that module's GVL ID.
     * @property {number} [gvlid] - The single GVL ID for this family of modules (only defined if all modules with this name declared the same ID).
     */

    /**
     * Get a module's GVL ID(s).
     *
     * @param {string} moduleName - The name of the module.
     * @return {GvlIdResult} An object where:
     *   `modules` is a map from module type to that module's GVL ID;
     *   `gvlid` is the single GVL ID for this family of modules (only defined if all modules with this name declare the same ID).
     */
    get(moduleName) {
      const result = {
        modules: registry[moduleName] || {}
      };
      if (flat.hasOwnProperty(moduleName) && flat[moduleName] !== none) {
        result.gvlid = flat[moduleName];
      }
      return result;
    }
  };
}
const gdprDataHandler = new GdprConsentHandler();
const uspDataHandler = new UspConsentHandler();
const gppDataHandler = new GppConsentHandler();
const coppaDataHandler = (() => {
  function getCoppa() {
    return !!_config_js__WEBPACK_IMPORTED_MODULE_2__.config.getConfig('coppa');
  }
  return {
    getCoppa,
    getConsentData: getCoppa,
    getConsentMeta: getCoppa,
    reset() {},
    get promise() {
      return _utils_promise_js__WEBPACK_IMPORTED_MODULE_0__.GreedyPromise.resolve(getCoppa());
    },
    get hash() {
      return getCoppa() ? '1' : '0';
    }
  };
})();
const GDPR_GVLIDS = gvlidRegistry();
const ALL_HANDLERS = {
  gdpr: gdprDataHandler,
  usp: uspDataHandler,
  gpp: gppDataHandler,
  coppa: coppaDataHandler
};
function multiHandler() {
  let handlers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ALL_HANDLERS;
  handlers = Object.entries(handlers);
  function collector(method) {
    return function () {
      return Object.fromEntries(handlers.map(_ref => {
        let [name, handler] = _ref;
        return [name, handler[method]()];
      }));
    };
  }
  return Object.assign({
    get promise() {
      return _utils_promise_js__WEBPACK_IMPORTED_MODULE_0__.GreedyPromise.all(handlers.map(_ref2 => {
        let [name, handler] = _ref2;
        return handler.promise.then(val => [name, val]);
      })).then(entries => Object.fromEntries(entries));
    },
    get hash() {
      return (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.cyrb53Hash)(handlers.map(_ref3 => {
        let [_, handler] = _ref3;
        return handler.hash;
      }).join(':'));
    }
  }, Object.fromEntries(['getConsentData', 'getConsentMeta', 'reset'].map(n => [n, collector(n)])));
}
const allConsent = multiHandler();

/***/ }),

/***/ "./src/constants.js":
/*!**************************!*\
  !*** ./src/constants.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AD_RENDER_FAILED_REASON: () => (/* binding */ AD_RENDER_FAILED_REASON),
/* harmony export */   BID_STATUS: () => (/* binding */ BID_STATUS),
/* harmony export */   DEBUG_MODE: () => (/* binding */ DEBUG_MODE),
/* harmony export */   DEFAULT_TARGETING_KEYS: () => (/* binding */ DEFAULT_TARGETING_KEYS),
/* harmony export */   EVENTS: () => (/* binding */ EVENTS),
/* harmony export */   EVENT_ID_PATHS: () => (/* binding */ EVENT_ID_PATHS),
/* harmony export */   GRANULARITY_OPTIONS: () => (/* binding */ GRANULARITY_OPTIONS),
/* harmony export */   JSON_MAPPING: () => (/* binding */ JSON_MAPPING),
/* harmony export */   MESSAGES: () => (/* binding */ MESSAGES),
/* harmony export */   NATIVE_ASSET_TYPES: () => (/* binding */ NATIVE_ASSET_TYPES),
/* harmony export */   NATIVE_IMAGE_TYPES: () => (/* binding */ NATIVE_IMAGE_TYPES),
/* harmony export */   NATIVE_KEYS: () => (/* binding */ NATIVE_KEYS),
/* harmony export */   NATIVE_KEYS_THAT_ARE_NOT_ASSETS: () => (/* binding */ NATIVE_KEYS_THAT_ARE_NOT_ASSETS),
/* harmony export */   PB_LOCATOR: () => (/* binding */ PB_LOCATOR),
/* harmony export */   PREBID_NATIVE_DATA_KEYS_TO_ORTB: () => (/* binding */ PREBID_NATIVE_DATA_KEYS_TO_ORTB),
/* harmony export */   REJECTION_REASON: () => (/* binding */ REJECTION_REASON),
/* harmony export */   S2S: () => (/* binding */ S2S),
/* harmony export */   STATUS: () => (/* binding */ STATUS),
/* harmony export */   TARGETING_KEYS: () => (/* binding */ TARGETING_KEYS)
/* harmony export */ });
const JSON_MAPPING = {
  PL_CODE: 'code',
  PL_SIZE: 'sizes',
  PL_BIDS: 'bids',
  BD_BIDDER: 'bidder',
  BD_ID: 'paramsd',
  BD_PL_ID: 'placementId',
  ADSERVER_TARGETING: 'adserverTargeting',
  BD_SETTING_STANDARD: 'standard'
};
const DEBUG_MODE = 'pbjs_debug';
const STATUS = {
  GOOD: 1
};
const EVENTS = {
  AUCTION_INIT: 'auctionInit',
  AUCTION_TIMEOUT: 'auctionTimeout',
  AUCTION_END: 'auctionEnd',
  BID_ADJUSTMENT: 'bidAdjustment',
  BID_TIMEOUT: 'bidTimeout',
  BID_REQUESTED: 'bidRequested',
  BID_RESPONSE: 'bidResponse',
  BID_REJECTED: 'bidRejected',
  NO_BID: 'noBid',
  SEAT_NON_BID: 'seatNonBid',
  BID_WON: 'bidWon',
  BIDDER_DONE: 'bidderDone',
  BIDDER_ERROR: 'bidderError',
  SET_TARGETING: 'setTargeting',
  BEFORE_REQUEST_BIDS: 'beforeRequestBids',
  BEFORE_BIDDER_HTTP: 'beforeBidderHttp',
  REQUEST_BIDS: 'requestBids',
  ADD_AD_UNITS: 'addAdUnits',
  AD_RENDER_FAILED: 'adRenderFailed',
  AD_RENDER_SUCCEEDED: 'adRenderSucceeded',
  TCF2_ENFORCEMENT: 'tcf2Enforcement',
  AUCTION_DEBUG: 'auctionDebug',
  BID_VIEWABLE: 'bidViewable',
  STALE_RENDER: 'staleRender',
  BILLABLE_EVENT: 'billableEvent',
  BID_ACCEPTED: 'bidAccepted',
  RUN_PAAPI_AUCTION: 'paapiRunAuction',
  PBS_ANALYTICS: 'pbsAnalytics',
  PAAPI_BID: 'paapiBid',
  PAAPI_NO_BID: 'paapiNoBid',
  PAAPI_ERROR: 'paapiError'
};
const AD_RENDER_FAILED_REASON = {
  PREVENT_WRITING_ON_MAIN_DOCUMENT: 'preventWritingOnMainDocument',
  NO_AD: 'noAd',
  EXCEPTION: 'exception',
  CANNOT_FIND_AD: 'cannotFindAd',
  MISSING_DOC_OR_ADID: 'missingDocOrAdid'
};
const EVENT_ID_PATHS = {
  bidWon: 'adUnitCode'
};
const GRANULARITY_OPTIONS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  AUTO: 'auto',
  DENSE: 'dense',
  CUSTOM: 'custom'
};
const TARGETING_KEYS = {
  BIDDER: 'hb_bidder',
  AD_ID: 'hb_adid',
  PRICE_BUCKET: 'hb_pb',
  SIZE: 'hb_size',
  DEAL: 'hb_deal',
  SOURCE: 'hb_source',
  FORMAT: 'hb_format',
  UUID: 'hb_uuid',
  CACHE_ID: 'hb_cache_id',
  CACHE_HOST: 'hb_cache_host',
  ADOMAIN: 'hb_adomain',
  ACAT: 'hb_acat',
  CRID: 'hb_crid',
  DSP: 'hb_dsp'
};
const DEFAULT_TARGETING_KEYS = {
  BIDDER: 'hb_bidder',
  AD_ID: 'hb_adid',
  PRICE_BUCKET: 'hb_pb',
  SIZE: 'hb_size',
  DEAL: 'hb_deal',
  FORMAT: 'hb_format',
  UUID: 'hb_uuid',
  CACHE_HOST: 'hb_cache_host'
};
const NATIVE_KEYS = {
  title: 'hb_native_title',
  body: 'hb_native_body',
  body2: 'hb_native_body2',
  privacyLink: 'hb_native_privacy',
  privacyIcon: 'hb_native_privicon',
  sponsoredBy: 'hb_native_brand',
  image: 'hb_native_image',
  icon: 'hb_native_icon',
  clickUrl: 'hb_native_linkurl',
  displayUrl: 'hb_native_displayurl',
  cta: 'hb_native_cta',
  rating: 'hb_native_rating',
  address: 'hb_native_address',
  downloads: 'hb_native_downloads',
  likes: 'hb_native_likes',
  phone: 'hb_native_phone',
  price: 'hb_native_price',
  salePrice: 'hb_native_saleprice',
  rendererUrl: 'hb_renderer_url',
  adTemplate: 'hb_adTemplate'
};
const S2S = {
  SRC: 's2s',
  DEFAULT_ENDPOINT: 'https://prebid.adnxs.com/pbs/v1/openrtb2/auction',
  SYNCED_BIDDERS_KEY: 'pbjsSyncs'
};
const BID_STATUS = {
  BID_TARGETING_SET: 'targetingSet',
  RENDERED: 'rendered',
  BID_REJECTED: 'bidRejected'
};
const REJECTION_REASON = {
  INVALID: 'Bid has missing or invalid properties',
  INVALID_REQUEST_ID: 'Invalid request ID',
  BIDDER_DISALLOWED: 'Bidder code is not allowed by allowedAlternateBidderCodes / allowUnknownBidderCodes',
  FLOOR_NOT_MET: 'Bid does not meet price floor',
  CANNOT_CONVERT_CURRENCY: 'Unable to convert currency',
  DSA_REQUIRED: 'Bid does not provide required DSA transparency info',
  DSA_MISMATCH: 'Bid indicates inappropriate DSA rendering method',
  PRICE_TOO_HIGH: 'Bid price exceeds maximum value'
};
const PREBID_NATIVE_DATA_KEYS_TO_ORTB = {
  body: 'desc',
  body2: 'desc2',
  sponsoredBy: 'sponsored',
  cta: 'ctatext',
  rating: 'rating',
  address: 'address',
  downloads: 'downloads',
  likes: 'likes',
  phone: 'phone',
  price: 'price',
  salePrice: 'saleprice',
  displayUrl: 'displayurl'
};
const NATIVE_ASSET_TYPES = {
  sponsored: 1,
  desc: 2,
  rating: 3,
  likes: 4,
  downloads: 5,
  price: 6,
  saleprice: 7,
  phone: 8,
  address: 9,
  desc2: 10,
  displayurl: 11,
  ctatext: 12
};
const NATIVE_IMAGE_TYPES = {
  ICON: 1,
  MAIN: 3
};
const NATIVE_KEYS_THAT_ARE_NOT_ASSETS = ['privacyIcon', 'clickUrl', 'sendTargetingKeys', 'adTemplate', 'rendererUrl', 'type'];
const MESSAGES = {
  REQUEST: 'Prebid Request',
  RESPONSE: 'Prebid Response',
  NATIVE: 'Prebid Native',
  EVENT: 'Prebid Event'
};
const PB_LOCATOR = '__pb_locator__';

/***/ }),

/***/ "./src/cpmBucketManager.js":
/*!*********************************!*\
  !*** ./src/cpmBucketManager.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getPriceBucketString: () => (/* binding */ getPriceBucketString),
/* harmony export */   isValidPriceConfig: () => (/* binding */ isValidPriceConfig)
/* harmony export */ });
/* harmony import */ var _polyfill_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./config.js */ "./src/config.js");



const _defaultPrecision = 2;
const _lgPriceConfig = {
  'buckets': [{
    'max': 5,
    'increment': 0.5
  }]
};
const _mgPriceConfig = {
  'buckets': [{
    'max': 20,
    'increment': 0.1
  }]
};
const _hgPriceConfig = {
  'buckets': [{
    'max': 20,
    'increment': 0.01
  }]
};
const _densePriceConfig = {
  'buckets': [{
    'max': 3,
    'increment': 0.01
  }, {
    'max': 8,
    'increment': 0.05
  }, {
    'max': 20,
    'increment': 0.5
  }]
};
const _autoPriceConfig = {
  'buckets': [{
    'max': 5,
    'increment': 0.05
  }, {
    'max': 10,
    'increment': 0.1
  }, {
    'max': 20,
    'increment': 0.5
  }]
};
function getPriceBucketString(cpm, customConfig) {
  let granularityMultiplier = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  let cpmFloat = parseFloat(cpm);
  if (isNaN(cpmFloat)) {
    cpmFloat = '';
  }
  return {
    low: cpmFloat === '' ? '' : getCpmStringValue(cpm, _lgPriceConfig, granularityMultiplier),
    med: cpmFloat === '' ? '' : getCpmStringValue(cpm, _mgPriceConfig, granularityMultiplier),
    high: cpmFloat === '' ? '' : getCpmStringValue(cpm, _hgPriceConfig, granularityMultiplier),
    auto: cpmFloat === '' ? '' : getCpmStringValue(cpm, _autoPriceConfig, granularityMultiplier),
    dense: cpmFloat === '' ? '' : getCpmStringValue(cpm, _densePriceConfig, granularityMultiplier),
    custom: cpmFloat === '' ? '' : getCpmStringValue(cpm, customConfig, granularityMultiplier)
  };
}
function getCpmStringValue(cpm, config, granularityMultiplier) {
  let cpmStr = '';
  if (!isValidPriceConfig(config)) {
    return cpmStr;
  }
  const cap = config.buckets.reduce((prev, curr) => {
    if (prev.max > curr.max) {
      return prev;
    }
    return curr;
  }, {
    'max': 0
  });
  let bucketFloor = 0;
  let bucket = (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_0__.find)(config.buckets, bucket => {
    if (cpm > cap.max * granularityMultiplier) {
      // cpm exceeds cap, just return the cap.
      let precision = bucket.precision;
      if (typeof precision === 'undefined') {
        precision = _defaultPrecision;
      }
      cpmStr = (bucket.max * granularityMultiplier).toFixed(precision);
    } else if (cpm <= bucket.max * granularityMultiplier && cpm >= bucketFloor * granularityMultiplier) {
      bucket.min = bucketFloor;
      return bucket;
    } else {
      bucketFloor = bucket.max;
    }
  });
  if (bucket) {
    cpmStr = getCpmTarget(cpm, bucket, granularityMultiplier);
  }
  return cpmStr;
}
function isValidPriceConfig(config) {
  if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.isEmpty)(config) || !config.buckets || !Array.isArray(config.buckets)) {
    return false;
  }
  let isValid = true;
  config.buckets.forEach(bucket => {
    if (!bucket.max || !bucket.increment) {
      isValid = false;
    }
  });
  return isValid;
}
function getCpmTarget(cpm, bucket, granularityMultiplier) {
  const precision = typeof bucket.precision !== 'undefined' ? bucket.precision : _defaultPrecision;
  const increment = bucket.increment * granularityMultiplier;
  const bucketMin = bucket.min * granularityMultiplier;
  let roundingFunction = Math.floor;
  let customRoundingFunction = _config_js__WEBPACK_IMPORTED_MODULE_2__.config.getConfig('cpmRoundingFunction');
  if (typeof customRoundingFunction === 'function') {
    roundingFunction = customRoundingFunction;
  }

  // start increments at the bucket min and then add bucket min back to arrive at the correct rounding
  // note - we're padding the values to avoid using decimals in the math prior to flooring
  // this is done as JS can return values slightly below the expected mark which would skew the price bucket target
  //   (eg 4.01 / 0.01 = 400.99999999999994)
  // min precison should be 2 to move decimal place over.
  let pow = Math.pow(10, precision + 2);
  let cpmToRound = (cpm * pow - bucketMin * pow) / (increment * pow);
  let cpmTarget;
  let invalidRounding;
  // It is likely that we will be passed {cpmRoundingFunction: roundingFunction()}
  // rather than the expected {cpmRoundingFunction: roundingFunction}. Default back to floor in that case
  try {
    cpmTarget = roundingFunction(cpmToRound) * increment + bucketMin;
  } catch (err) {
    invalidRounding = true;
  }
  if (invalidRounding || typeof cpmTarget !== 'number') {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)('Invalid rounding function passed in config');
    cpmTarget = Math.floor(cpmToRound) * increment + bucketMin;
  }
  // force to 10 decimal places to deal with imprecise decimal/binary conversions
  //    (for example 0.1 * 3 = 0.30000000000000004)

  cpmTarget = Number(cpmTarget.toFixed(10));
  return cpmTarget.toFixed(precision);
}


/***/ }),

/***/ "./src/creativeRenderers.js":
/*!**********************************!*\
  !*** ./src/creativeRenderers.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getCreativeRenderer: () => (/* binding */ getCreativeRenderer),
/* harmony export */   getCreativeRendererSource: () => (/* binding */ getCreativeRendererSource)
/* harmony export */ });
/* harmony import */ var _utils_promise_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils/promise.js */ "./src/utils/promise.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _libraries_creative_renderer_display_renderer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../libraries/creative-renderer-display/renderer.js */ "./libraries/creative-renderer-display/renderer.js");
/* harmony import */ var _hook_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./hook.js */ "./src/hook.js");




const getCreativeRendererSource = (0,_hook_js__WEBPACK_IMPORTED_MODULE_0__.hook)('sync', function (bidResponse) {
  return _libraries_creative_renderer_display_renderer_js__WEBPACK_IMPORTED_MODULE_1__.RENDERER;
});
const getCreativeRenderer = function () {
  const renderers = {};
  return function (bidResponse) {
    const src = getCreativeRendererSource(bidResponse);
    if (!renderers.hasOwnProperty(src)) {
      renderers[src] = new _utils_promise_js__WEBPACK_IMPORTED_MODULE_2__.GreedyPromise(resolve => {
        const iframe = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.createInvisibleIframe)();
        iframe.srcdoc = `<script>${src}</script>`;
        iframe.onload = () => resolve(iframe.contentWindow.render);
        document.body.appendChild(iframe);
      });
    }
    return renderers[src];
  };
}();

/***/ }),

/***/ "./src/debugging.js":
/*!**************************!*\
  !*** ./src/debugging.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   loadSession: () => (/* binding */ loadSession)
/* harmony export */ });
/* unused harmony exports DEBUG_KEY, debuggingModuleLoader, debuggingControls, reset */
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var _hook_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./hook.js */ "./src/hook.js");
/* harmony import */ var _prebidGlobal_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./prebidGlobal.js */ "./src/prebidGlobal.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _bidfactory_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./bidfactory.js */ "./src/bidfactory.js");
/* harmony import */ var _adloader_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./adloader.js */ "./src/adloader.js");
/* harmony import */ var _utils_promise_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/promise.js */ "./src/utils/promise.js");
/* harmony import */ var _activities_modules_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./activities/modules.js */ "./src/activities/modules.js");








const DEBUG_KEY = "__pbjs_debugging__";
function isDebuggingInstalled() {
  return (0,_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_0__.getGlobal)().installedModules.includes('debugging');
}
function loadScript(url) {
  return new _utils_promise_js__WEBPACK_IMPORTED_MODULE_1__.GreedyPromise(resolve => {
    (0,_adloader_js__WEBPACK_IMPORTED_MODULE_2__.loadExternalScript)(url, _activities_modules_js__WEBPACK_IMPORTED_MODULE_3__.MODULE_TYPE_PREBID, 'debugging', resolve);
  });
}
function debuggingModuleLoader() {
  let {
    alreadyInstalled = isDebuggingInstalled,
    script = loadScript
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  let loading = null;
  return function () {
    if (loading == null) {
      loading = new _utils_promise_js__WEBPACK_IMPORTED_MODULE_1__.GreedyPromise((resolve, reject) => {
        // run this in a 0-delay timeout to give installedModules time to be populated
        setTimeout(() => {
          if (alreadyInstalled()) {
            resolve();
          } else {
            const url = "/build/dev/debugging-standalone.js";
            (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logMessage)(`Debugging module not installed, loading it from "${url}"...`);
            (0,_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_0__.getGlobal)()._installDebugging = true;
            script(url).then(() => {
              (0,_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_0__.getGlobal)()._installDebugging({
                DEBUG_KEY,
                hook: _hook_js__WEBPACK_IMPORTED_MODULE_5__.hook,
                config: _config_js__WEBPACK_IMPORTED_MODULE_6__.config,
                createBid: _bidfactory_js__WEBPACK_IMPORTED_MODULE_7__.createBid,
                logger: (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.prefixLog)('DEBUG:')
              });
            }).then(resolve, reject);
          }
        });
      });
    }
    return loading;
  };
}
function debuggingControls() {
  let {
    load = debuggingModuleLoader(),
    hook = (0,_hook_js__WEBPACK_IMPORTED_MODULE_5__.getHook)('requestBids')
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  let promise = null;
  let enabled = false;
  function waitForDebugging(next) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    return (promise || _utils_promise_js__WEBPACK_IMPORTED_MODULE_1__.GreedyPromise.resolve()).then(() => next.apply(this, args));
  }
  function enable() {
    if (!enabled) {
      promise = load();
      // set debugging to high priority so that it has the opportunity to mess with most things
      hook.before(waitForDebugging, 99);
      enabled = true;
    }
  }
  function disable() {
    hook.getHooks({
      hook: waitForDebugging
    }).remove();
    enabled = false;
  }
  function reset() {
    promise = null;
    disable();
  }
  return {
    enable,
    disable,
    reset
  };
}
const ctl = debuggingControls();
const reset = ctl.reset;
function loadSession() {
  let storage = null;
  try {
    // eslint-disable-next-line prebid/no-global
    storage = window.sessionStorage;
  } catch (e) {}
  if (storage !== null) {
    let debugging = ctl;
    let config = null;
    try {
      config = storage.getItem(DEBUG_KEY);
    } catch (e) {}
    if (config !== null) {
      // just make sure the module runs; it will take care of parsing the config (and disabling itself if necessary)
      debugging.enable();
    }
  }
}
_config_js__WEBPACK_IMPORTED_MODULE_6__.config.getConfig('debugging', function (_ref) {
  let {
    debugging
  } = _ref;
  debugging?.enabled ? ctl.enable() : ctl.disable();
});

/***/ }),

/***/ "./src/events.js":
/*!***********************!*\
  !*** ./src/events.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   emit: () => (/* binding */ emit),
/* harmony export */   getEvents: () => (/* binding */ getEvents),
/* harmony export */   off: () => (/* binding */ off),
/* harmony export */   on: () => (/* binding */ on)
/* harmony export */ });
/* unused harmony exports get, addEvents, has, clearEvents */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./constants.js */ "./src/constants.js");
/* harmony import */ var _utils_ttlCollection_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/ttlCollection.js */ "./src/utils/ttlCollection.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/**
 * events.js
 */




const TTL_CONFIG = 'eventHistoryTTL';
let eventTTL = null;

// keep a record of all events fired
const eventsFired = (0,_utils_ttlCollection_js__WEBPACK_IMPORTED_MODULE_0__.ttlCollection)({
  monotonic: true,
  ttl: () => eventTTL
});
_config_js__WEBPACK_IMPORTED_MODULE_1__.config.getConfig(TTL_CONFIG, val => {
  const previous = eventTTL;
  val = val?.[TTL_CONFIG];
  eventTTL = typeof val === 'number' ? val * 1000 : null;
  if (previous !== eventTTL) {
    eventsFired.refresh();
  }
});
let slice = Array.prototype.slice;
let push = Array.prototype.push;

// define entire events
let allEvents = Object.values(_constants_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS);
const idPaths = _constants_js__WEBPACK_IMPORTED_MODULE_2__.EVENT_ID_PATHS;
const _public = function () {
  let _handlers = {};
  let _public = {};

  /**
   *
   * @param {String} eventString  The name of the event.
   * @param {Array} args  The payload emitted with the event.
   * @private
   */
  function _dispatch(eventString, args) {
    _utils_js__WEBPACK_IMPORTED_MODULE_3__.logMessage('Emitting event for: ' + eventString);
    let eventPayload = args[0] || {};
    let idPath = idPaths[eventString];
    let key = eventPayload[idPath];
    let event = _handlers[eventString] || {
      que: []
    };
    var eventKeys = Object.keys(event);
    let callbacks = [];

    // record the event:
    eventsFired.add({
      eventType: eventString,
      args: eventPayload,
      id: key,
      elapsedTime: _utils_js__WEBPACK_IMPORTED_MODULE_3__.getPerformanceNow()
    });

    /**
     * Push each specific callback to the `callbacks` array.
     * If the `event` map has a key that matches the value of the
     * event payload id path, e.g. `eventPayload[idPath]`, then apply
     * each function in the `que` array as an argument to push to the
     * `callbacks` array
     */
    if (key && eventKeys.includes(key)) {
      push.apply(callbacks, event[key].que);
    }

    /** Push each general callback to the `callbacks` array. */
    push.apply(callbacks, event.que);

    /** call each of the callbacks */
    (callbacks || []).forEach(function (fn) {
      if (!fn) return;
      try {
        fn.apply(null, args);
      } catch (e) {
        _utils_js__WEBPACK_IMPORTED_MODULE_3__.logError('Error executing handler:', 'events.js', e, eventString);
      }
    });
  }
  function _checkAvailableEvent(event) {
    return allEvents.includes(event);
  }
  _public.has = _checkAvailableEvent;
  _public.on = function (eventString, handler, id) {
    // check whether available event or not
    if (_checkAvailableEvent(eventString)) {
      let event = _handlers[eventString] || {
        que: []
      };
      if (id) {
        event[id] = event[id] || {
          que: []
        };
        event[id].que.push(handler);
      } else {
        event.que.push(handler);
      }
      _handlers[eventString] = event;
    } else {
      _utils_js__WEBPACK_IMPORTED_MODULE_3__.logError('Wrong event name : ' + eventString + ' Valid event names :' + allEvents);
    }
  };
  _public.emit = function (event) {
    let args = slice.call(arguments, 1);
    _dispatch(event, args);
  };
  _public.off = function (eventString, handler, id) {
    let event = _handlers[eventString];
    if (_utils_js__WEBPACK_IMPORTED_MODULE_3__.isEmpty(event) || _utils_js__WEBPACK_IMPORTED_MODULE_3__.isEmpty(event.que) && _utils_js__WEBPACK_IMPORTED_MODULE_3__.isEmpty(event[id])) {
      return;
    }
    if (id && (_utils_js__WEBPACK_IMPORTED_MODULE_3__.isEmpty(event[id]) || _utils_js__WEBPACK_IMPORTED_MODULE_3__.isEmpty(event[id].que))) {
      return;
    }
    if (id) {
      (event[id].que || []).forEach(function (_handler) {
        let que = event[id].que;
        if (_handler === handler) {
          que.splice(que.indexOf(_handler), 1);
        }
      });
    } else {
      (event.que || []).forEach(function (_handler) {
        let que = event.que;
        if (_handler === handler) {
          que.splice(que.indexOf(_handler), 1);
        }
      });
    }
    _handlers[eventString] = event;
  };
  _public.get = function () {
    return _handlers;
  };
  _public.addEvents = function (events) {
    allEvents = allEvents.concat(events);
  };

  /**
   * This method can return a copy of all the events fired
   * @return {Array} array of events fired
   */
  _public.getEvents = function () {
    return eventsFired.toArray().map(val => Object.assign({}, val));
  };
  window.prebidEvents = _public;
  return _public;
}();
_utils_js__WEBPACK_IMPORTED_MODULE_3__._setEventEmitter(_public.emit.bind(_public));
const {
  on,
  off,
  get,
  getEvents,
  emit,
  addEvents,
  has
} = _public;
function clearEvents() {
  eventsFired.clear();
}

/***/ }),

/***/ "./src/fpd/enrichment.js":
/*!*******************************!*\
  !*** ./src/fpd/enrichment.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   enrichFPD: () => (/* binding */ enrichFPD)
/* harmony export */ });
/* unused harmony export dep */
/* harmony import */ var _hook_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../hook.js */ "./src/hook.js");
/* harmony import */ var _refererDetection_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../refererDetection.js */ "./src/refererDetection.js");
/* harmony import */ var _rootDomain_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./rootDomain.js */ "./src/fpd/rootDomain.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils.js */ "./src/utils.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils.js */ "./node_modules/dset/dist/index.mjs");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../config.js */ "./src/config.js");
/* harmony import */ var _sua_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./sua.js */ "./src/fpd/sua.js");
/* harmony import */ var _utils_promise_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/promise.js */ "./src/utils/promise.js");
/* harmony import */ var _oneClient_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./oneClient.js */ "./src/fpd/oneClient.js");
/* harmony import */ var _activities_rules_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../activities/rules.js */ "./src/activities/rules.js");
/* harmony import */ var _activities_activityParams_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../activities/activityParams.js */ "./src/activities/activityParams.js");
/* harmony import */ var _activities_activities_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../activities/activities.js */ "./src/activities/activities.js");
/* harmony import */ var _activities_modules_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../activities/modules.js */ "./src/activities/modules.js");












const dep = {
  getRefererInfo: _refererDetection_js__WEBPACK_IMPORTED_MODULE_0__.getRefererInfo,
  findRootDomain: _rootDomain_js__WEBPACK_IMPORTED_MODULE_1__.findRootDomain,
  getWindowTop: _utils_js__WEBPACK_IMPORTED_MODULE_2__.getWindowTop,
  getWindowSelf: _utils_js__WEBPACK_IMPORTED_MODULE_2__.getWindowSelf,
  getHighEntropySUA: _sua_js__WEBPACK_IMPORTED_MODULE_3__.getHighEntropySUA,
  getLowEntropySUA: _sua_js__WEBPACK_IMPORTED_MODULE_3__.getLowEntropySUA
};
const oneClient = (0,_oneClient_js__WEBPACK_IMPORTED_MODULE_4__.clientSectionChecker)('FPD');

/**
 * Enrich an ortb2 object with first-party data.
 * @param {Promise<Object>} fpd - A promise that resolves to an ortb2 object.
 * @returns {Promise<Object>} - A promise that resolves to an enriched ortb2 object.
 */
const enrichFPD = (0,_hook_js__WEBPACK_IMPORTED_MODULE_5__.hook)('sync', fpd => {
  const promArr = [fpd, getSUA().catch(() => null), tryToGetCdepLabel().catch(() => null)];
  return _utils_promise_js__WEBPACK_IMPORTED_MODULE_6__.GreedyPromise.all(promArr).then(_ref => {
    let [ortb2, sua, cdep] = _ref;
    const ri = dep.getRefererInfo();
    Object.entries(ENRICHMENTS).forEach(_ref2 => {
      let [section, getEnrichments] = _ref2;
      const data = getEnrichments(ortb2, ri);
      if (data && Object.keys(data).length > 0) {
        ortb2[section] = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.mergeDeep)({}, data, ortb2[section]);
      }
    });
    if (sua) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_7__.dset)(ortb2, 'device.sua', Object.assign({}, sua, ortb2.device.sua));
    }
    if (cdep) {
      const ext = {
        cdep
      };
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_7__.dset)(ortb2, 'device.ext', Object.assign({}, ext, ortb2.device.ext));
    }
    ortb2 = oneClient(ortb2);
    for (let section of _oneClient_js__WEBPACK_IMPORTED_MODULE_4__.CLIENT_SECTIONS) {
      if ((0,_oneClient_js__WEBPACK_IMPORTED_MODULE_4__.hasSection)(ortb2, section)) {
        ortb2[section] = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.mergeDeep)({}, clientEnrichment(ortb2, ri), ortb2[section]);
        break;
      }
    }
    return ortb2;
  });
});
function winFallback(fn) {
  try {
    return fn(dep.getWindowTop());
  } catch (e) {
    return fn(dep.getWindowSelf());
  }
}
function getSUA() {
  const hints = _config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('firstPartyData.uaHints');
  return !Array.isArray(hints) || hints.length === 0 ? _utils_promise_js__WEBPACK_IMPORTED_MODULE_6__.GreedyPromise.resolve(dep.getLowEntropySUA()) : dep.getHighEntropySUA(hints);
}
function removeUndef(obj) {
  return (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.getDefinedParams)(obj, Object.keys(obj));
}
function tryToGetCdepLabel() {
  return _utils_promise_js__WEBPACK_IMPORTED_MODULE_6__.GreedyPromise.resolve('cookieDeprecationLabel' in navigator && (0,_activities_rules_js__WEBPACK_IMPORTED_MODULE_9__.isActivityAllowed)(_activities_activities_js__WEBPACK_IMPORTED_MODULE_10__.ACTIVITY_ACCESS_DEVICE, (0,_activities_activityParams_js__WEBPACK_IMPORTED_MODULE_11__.activityParams)(_activities_modules_js__WEBPACK_IMPORTED_MODULE_12__.MODULE_TYPE_PREBID, 'cdep')) && navigator.cookieDeprecationLabel.getValue());
}
const ENRICHMENTS = {
  site(ortb2, ri) {
    if (_oneClient_js__WEBPACK_IMPORTED_MODULE_4__.CLIENT_SECTIONS.filter(p => p !== 'site').some(_oneClient_js__WEBPACK_IMPORTED_MODULE_4__.hasSection.bind(null, ortb2))) {
      // do not enrich site if dooh or app are set
      return;
    }
    return removeUndef({
      page: ri.page,
      ref: ri.ref
    });
  },
  device() {
    return winFallback(win => {
      // screen.width and screen.height are the physical dimensions of the screen
      const w = win.screen.width;
      const h = win.screen.height;

      // vpw and vph are the viewport dimensions of the browser window
      const vpw = win.innerWidth || win.document.documentElement.clientWidth || win.document.body.clientWidth;
      const vph = win.innerHeight || win.document.documentElement.clientHeight || win.document.body.clientHeight;
      const device = {
        w,
        h,
        dnt: (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.getDNT)() ? 1 : 0,
        ua: win.navigator.userAgent,
        language: win.navigator.language.split('-').shift(),
        ext: {
          vpw,
          vph
        }
      };
      if (win.navigator?.webdriver) {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_7__.dset)(device, 'ext.webdriver', true);
      }
      return device;
    });
  },
  regs() {
    const regs = {};
    if (winFallback(win => win.navigator.globalPrivacyControl)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_7__.dset)(regs, 'ext.gpc', '1');
    }
    const coppa = _config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('coppa');
    if (typeof coppa === 'boolean') {
      regs.coppa = coppa ? 1 : 0;
    }
    return regs;
  }
};

// Enrichment of properties common across dooh, app and site - will be dropped into whatever
// section is appropriate
function clientEnrichment(ortb2, ri) {
  const domain = (0,_refererDetection_js__WEBPACK_IMPORTED_MODULE_0__.parseDomain)(ri.page, {
    noLeadingWww: true
  });
  const keywords = winFallback(win => win.document.querySelector('meta[name=\'keywords\']'))?.content?.replace?.(/\s/g, '');
  return removeUndef({
    domain,
    keywords,
    publisher: removeUndef({
      domain: dep.findRootDomain(domain)
    })
  });
}

/***/ }),

/***/ "./src/fpd/oneClient.js":
/*!******************************!*\
  !*** ./src/fpd/oneClient.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CLIENT_SECTIONS: () => (/* binding */ CLIENT_SECTIONS),
/* harmony export */   clientSectionChecker: () => (/* binding */ clientSectionChecker),
/* harmony export */   hasSection: () => (/* binding */ hasSection)
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils.js */ "./src/utils.js");


// mutually exclusive ORTB sections in order of priority - 'dooh' beats 'app' & 'site' and 'app' beats 'site';
// if one is set, the others will be removed
const CLIENT_SECTIONS = ['dooh', 'app', 'site'];
function clientSectionChecker(logPrefix) {
  return function onlyOneClientSection(ortb2) {
    CLIENT_SECTIONS.reduce((found, section) => {
      if (hasSection(ortb2, section)) {
        if (found != null) {
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logWarn)(`${logPrefix} specifies both '${found}' and '${section}'; dropping the latter.`);
          delete ortb2[section];
        } else {
          found = section;
        }
      }
      return found;
    }, null);
    return ortb2;
  };
}
function hasSection(ortb2, section) {
  return ortb2[section] != null && Object.keys(ortb2[section]).length > 0;
}

/***/ }),

/***/ "./src/fpd/rootDomain.js":
/*!*******************************!*\
  !*** ./src/fpd/rootDomain.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   findRootDomain: () => (/* binding */ findRootDomain)
/* harmony export */ });
/* unused harmony export coreStorage */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils.js */ "./src/utils.js");
/* harmony import */ var _storageManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../storageManager.js */ "./src/storageManager.js");


const coreStorage = (0,_storageManager_js__WEBPACK_IMPORTED_MODULE_0__.getCoreStorageManager)('fpdEnrichment');

/**
 * Find the root domain by testing for the topmost domain that will allow setting cookies.
 */

const findRootDomain = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.memoize)(function findRootDomain() {
  let fullDomain = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.location.host;
  if (!coreStorage.cookiesAreEnabled()) {
    return fullDomain;
  }
  const domainParts = fullDomain.split('.');
  if (domainParts.length === 2) {
    return fullDomain;
  }
  let rootDomain;
  let continueSearching;
  let startIndex = -2;
  const TEST_COOKIE_NAME = `_rdc${Date.now()}`;
  const TEST_COOKIE_VALUE = 'writeable';
  do {
    rootDomain = domainParts.slice(startIndex).join('.');
    let expirationDate = new Date((0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.timestamp)() + 10 * 1000).toUTCString();

    // Write a test cookie
    coreStorage.setCookie(TEST_COOKIE_NAME, TEST_COOKIE_VALUE, expirationDate, 'Lax', rootDomain, undefined);

    // See if the write was successful
    const value = coreStorage.getCookie(TEST_COOKIE_NAME, undefined);
    if (value === TEST_COOKIE_VALUE) {
      continueSearching = false;
      // Delete our test cookie
      coreStorage.setCookie(TEST_COOKIE_NAME, '', 'Thu, 01 Jan 1970 00:00:01 GMT', undefined, rootDomain, undefined);
    } else {
      startIndex += -1;
      continueSearching = Math.abs(startIndex) <= domainParts.length;
    }
  } while (continueSearching);
  return rootDomain;
});

/***/ }),

/***/ "./src/fpd/sua.js":
/*!************************!*\
  !*** ./src/fpd/sua.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getHighEntropySUA: () => (/* binding */ getHighEntropySUA),
/* harmony export */   getLowEntropySUA: () => (/* binding */ getLowEntropySUA)
/* harmony export */ });
/* unused harmony exports SUA_SOURCE_UNKNOWN, SUA_SOURCE_LOW_ENTROPY, SUA_SOURCE_HIGH_ENTROPY, SUA_SOURCE_UA_HEADER, HIGH_ENTROPY_HINTS, LOW_ENTROPY_HINTS, lowEntropySUAAccessor, highEntropySUAAccessor, uaDataToSUA */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils.js */ "./src/utils.js");
/* harmony import */ var _utils_promise_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/promise.js */ "./src/utils/promise.js");


const SUA_SOURCE_UNKNOWN = 0;
const SUA_SOURCE_LOW_ENTROPY = 1;
const SUA_SOURCE_HIGH_ENTROPY = 2;
const SUA_SOURCE_UA_HEADER = 3;

// "high entropy" (i.e. privacy-sensitive) fields that can be requested from the navigator.
const HIGH_ENTROPY_HINTS = ['architecture', 'bitness', 'model', 'platformVersion', 'fullVersionList'];
const LOW_ENTROPY_HINTS = ['brands', 'mobile', 'platform'];

/**
 * Returns low entropy UA client hints encoded as an ortb2.6 device.sua object; or null if no UA client hints are available.
 */
const getLowEntropySUA = lowEntropySUAAccessor();

/**
 * Returns a promise to high entropy UA client hints encoded as an ortb2.6 device.sua object, or null if no UA client hints are available.
 *
 * Note that the return value is a promise because the underlying browser API returns a promise; this
 * seems to plan for additional controls (such as alerts / permission request prompts to the user); it's unclear
 * at the moment if this means that asking for more hints would result in slower / more expensive calls.
 *
 * @param {Array[String]} hints hints to request, defaults to all (HIGH_ENTROPY_HINTS).
 */
const getHighEntropySUA = highEntropySUAAccessor();
function lowEntropySUAAccessor() {
  let uaData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.navigator?.userAgentData;
  const sua = uaData && LOW_ENTROPY_HINTS.some(h => typeof uaData[h] !== 'undefined') ? Object.freeze(uaDataToSUA(SUA_SOURCE_LOW_ENTROPY, uaData)) : null;
  return function () {
    return sua;
  };
}
function highEntropySUAAccessor() {
  let uaData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.navigator?.userAgentData;
  const cache = {};
  const keys = new WeakMap();
  return function () {
    let hints = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : HIGH_ENTROPY_HINTS;
    if (!keys.has(hints)) {
      const sorted = Array.from(hints);
      sorted.sort();
      keys.set(hints, sorted.join('|'));
    }
    const key = keys.get(hints);
    if (!cache.hasOwnProperty(key)) {
      try {
        cache[key] = uaData.getHighEntropyValues(hints).then(result => {
          return (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isEmpty)(result) ? null : Object.freeze(uaDataToSUA(SUA_SOURCE_HIGH_ENTROPY, result));
        }).catch(() => null);
      } catch (e) {
        cache[key] = _utils_promise_js__WEBPACK_IMPORTED_MODULE_1__.GreedyPromise.resolve(null);
      }
    }
    return cache[key];
  };
}

/**
 * Convert a User Agent client hints object to an ORTB 2.6 device.sua fragment
 * https://iabtechlab.com/wp-content/uploads/2022/04/OpenRTB-2-6_FINAL.pdf
 *
 * @param source source of the UAData object (0 to 3)
 * @param uaData https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/
 * @return {{}}
 */
function uaDataToSUA(source, uaData) {
  function toBrandVersion(brand, version) {
    const bv = {
      brand
    };
    if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isStr)(version) && !(0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isEmptyStr)(version)) {
      bv.version = version.split('.');
    }
    return bv;
  }
  const sua = {
    source
  };
  if (uaData.platform) {
    sua.platform = toBrandVersion(uaData.platform, uaData.platformVersion);
  }
  if (uaData.fullVersionList || uaData.brands) {
    sua.browsers = (uaData.fullVersionList || uaData.brands).map(_ref => {
      let {
        brand,
        version
      } = _ref;
      return toBrandVersion(brand, version);
    });
  }
  if (typeof uaData['mobile'] !== 'undefined') {
    sua.mobile = uaData.mobile ? 1 : 0;
  }
  ['model', 'bitness', 'architecture'].forEach(prop => {
    const value = uaData[prop];
    if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isStr)(value)) {
      sua[prop] = value;
    }
  });
  return sua;
}

/***/ }),

/***/ "./src/hook.js":
/*!*********************!*\
  !*** ./src/hook.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getHook: () => (/* binding */ getHook),
/* harmony export */   hook: () => (/* binding */ hook),
/* harmony export */   module: () => (/* binding */ module),
/* harmony export */   submodule: () => (/* binding */ submodule),
/* harmony export */   wrapHook: () => (/* binding */ wrapHook)
/* harmony export */ });
/* unused harmony exports ready, setupBeforeHookFnOnce */
/* harmony import */ var fun_hooks_no_eval_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fun-hooks/no-eval/index.js */ "./node_modules/fun-hooks/no-eval/index.js");
/* harmony import */ var fun_hooks_no_eval_index_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(fun_hooks_no_eval_index_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_promise_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/promise.js */ "./src/utils/promise.js");


let hook = fun_hooks_no_eval_index_js__WEBPACK_IMPORTED_MODULE_0___default()({
  ready: (fun_hooks_no_eval_index_js__WEBPACK_IMPORTED_MODULE_0___default().SYNC) | (fun_hooks_no_eval_index_js__WEBPACK_IMPORTED_MODULE_0___default().ASYNC) | (fun_hooks_no_eval_index_js__WEBPACK_IMPORTED_MODULE_0___default().QUEUE)
});
const readyCtl = (0,_utils_promise_js__WEBPACK_IMPORTED_MODULE_1__.defer)();
hook.ready = (() => {
  const ready = hook.ready;
  return function () {
    try {
      return ready.apply(hook, arguments);
    } finally {
      readyCtl.resolve();
    }
  };
})();

/**
 * A promise that resolves when hooks are ready.
 * @type {Promise}
 */
const ready = readyCtl.promise;
const getHook = hook.get;
function setupBeforeHookFnOnce(baseFn, hookFn) {
  let priority = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 15;
  let result = baseFn.getHooks({
    hook: hookFn
  });
  if (result.length === 0) {
    baseFn.before(hookFn, priority);
  }
}
const submoduleInstallMap = {};
function module(name, install) {
  let {
    postInstallAllowed = false
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  hook('async', function (submodules) {
    submodules.forEach(args => install(...args));
    if (postInstallAllowed) submoduleInstallMap[name] = install;
  }, name)([]); // will be queued until hook.ready() called in pbjs.processQueue();
}
function submodule(name) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }
  const install = submoduleInstallMap[name];
  if (install) return install(...args);
  getHook(name).before((next, modules) => {
    modules.push(args);
    next(modules);
  });
}

/**
 * Copy hook methods (.before, .after, etc) from a given hook to a given wrapper object.
 */
function wrapHook(hook, wrapper) {
  Object.defineProperties(wrapper, Object.fromEntries(['before', 'after', 'getHooks', 'removeAll'].map(m => [m, {
    get: () => hook[m]
  }])));
  return wrapper;
}

/***/ }),

/***/ "./src/mediaTypes.js":
/*!***************************!*\
  !*** ./src/mediaTypes.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ADPOD: () => (/* binding */ ADPOD),
/* harmony export */   BANNER: () => (/* binding */ BANNER),
/* harmony export */   NATIVE: () => (/* binding */ NATIVE),
/* harmony export */   VIDEO: () => (/* binding */ VIDEO)
/* harmony export */ });
/**
 * This file contains the valid Media Types in Prebid.
 *
 * All adapters are assumed to support banner ads. Other media types are specified by Adapters when they
 * register themselves with prebid-core.
 */

/**
 * @typedef {('native'|'video'|'banner')} MediaType
 * @typedef {('adpod')} VideoContext
 */

/** @type {MediaType} */
const NATIVE = 'native';
/** @type {MediaType} */
const VIDEO = 'video';
/** @type {MediaType} */
const BANNER = 'banner';
/** @type {VideoContext} */
const ADPOD = 'adpod';

/***/ }),

/***/ "./src/native.js":
/*!***********************!*\
  !*** ./src/native.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NATIVE_TARGETING_KEYS: () => (/* binding */ NATIVE_TARGETING_KEYS),
/* harmony export */   decorateAdUnitsWithNativeParams: () => (/* binding */ decorateAdUnitsWithNativeParams),
/* harmony export */   fireNativeTrackers: () => (/* binding */ fireNativeTrackers),
/* harmony export */   getAllAssetsMessage: () => (/* binding */ getAllAssetsMessage),
/* harmony export */   getAssetMessage: () => (/* binding */ getAssetMessage),
/* harmony export */   getNativeTargeting: () => (/* binding */ getNativeTargeting),
/* harmony export */   isNativeResponse: () => (/* binding */ isNativeResponse),
/* harmony export */   nativeAdapters: () => (/* binding */ nativeAdapters),
/* harmony export */   nativeBidIsValid: () => (/* binding */ nativeBidIsValid),
/* harmony export */   setNativeResponseProperties: () => (/* binding */ setNativeResponseProperties)
/* harmony export */ });
/* unused harmony exports IMAGE, processNativeAdUnitParams, isOpenRTBBidRequestValid, nativeAdUnit, nativeBidder, hasNonNativeBidder, isNativeOpenRTBBidValid, fireImpressionTrackers, fireClickTrackers, getNativeRenderingData, toOrtbNativeRequest, fromOrtbNativeRequest, convertOrtbRequestToProprietaryNative, legacyPropertiesToOrtbNative, toOrtbNativeResponse, toLegacyResponse */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./node_modules/dlv/index.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _polyfill_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _auctionManager_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./auctionManager.js */ "./src/auctionManager.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants.js */ "./src/constants.js");
/* harmony import */ var _mediaTypes_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./mediaTypes.js */ "./src/mediaTypes.js");
/* harmony import */ var _adRendering_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./adRendering.js */ "./src/adRendering.js");
/* harmony import */ var _creativeRenderers_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./creativeRenderers.js */ "./src/creativeRenderers.js");








/**
 * @typedef {import('../src/adapters/bidderFactory.js').BidRequest} BidRequest
 * @typedef {import('../src/adapters/bidderFactory.js').Bid} Bid
 */

const nativeAdapters = [];
const NATIVE_TARGETING_KEYS = Object.keys(_constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_KEYS).map(key => _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_KEYS[key]);
const IMAGE = {
  ortb: {
    ver: '1.2',
    assets: [{
      required: 1,
      id: 1,
      img: {
        type: 3,
        wmin: 100,
        hmin: 100
      }
    }, {
      required: 1,
      id: 2,
      title: {
        len: 140
      }
    }, {
      required: 1,
      id: 3,
      data: {
        type: 1
      }
    }, {
      required: 0,
      id: 4,
      data: {
        type: 2
      }
    }, {
      required: 0,
      id: 5,
      img: {
        type: 1,
        wmin: 20,
        hmin: 20
      }
    }]
  },
  image: {
    required: true
  },
  title: {
    required: true
  },
  sponsoredBy: {
    required: true
  },
  clickUrl: {
    required: true
  },
  body: {
    required: false
  },
  icon: {
    required: false
  }
};
const SUPPORTED_TYPES = {
  image: IMAGE
};

// inverse native maps useful for converting to legacy
const PREBID_NATIVE_DATA_KEYS_TO_ORTB_INVERSE = inverse(_constants_js__WEBPACK_IMPORTED_MODULE_0__.PREBID_NATIVE_DATA_KEYS_TO_ORTB);
const NATIVE_ASSET_TYPES_INVERSE = inverse(_constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_ASSET_TYPES);
const TRACKER_METHODS = {
  img: 1,
  js: 2,
  1: 'img',
  2: 'js'
};
const TRACKER_EVENTS = {
  impression: 1,
  'viewable-mrc50': 2,
  'viewable-mrc100': 3,
  'viewable-video50': 4
};
function isNativeResponse(bidResponse) {
  // check for native data and not mediaType; it's possible
  // to treat banner responses as native
  return bidResponse.native && typeof bidResponse.native === 'object';
}

/**
 * Recieves nativeParams from an adUnit. If the params were not of type 'type',
 * passes them on directly. If they were of type 'type', translate
 * them into the predefined specific asset requests for that type of native ad.
 */
function processNativeAdUnitParams(params) {
  if (params && params.type && typeIsSupported(params.type)) {
    params = SUPPORTED_TYPES[params.type];
  }
  if (params && params.ortb && !isOpenRTBBidRequestValid(params.ortb)) {
    return;
  }
  return params;
}
function decorateAdUnitsWithNativeParams(adUnits) {
  adUnits.forEach(adUnit => {
    const nativeParams = adUnit.nativeParams || (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__["default"])(adUnit, 'mediaTypes.native');
    if (nativeParams) {
      adUnit.nativeParams = processNativeAdUnitParams(nativeParams);
    }
    if (adUnit.nativeParams) {
      adUnit.nativeOrtbRequest = adUnit.nativeParams.ortb || toOrtbNativeRequest(adUnit.nativeParams);
    }
  });
}
function isOpenRTBBidRequestValid(ortb) {
  const assets = ortb.assets;
  if (!Array.isArray(assets) || assets.length === 0) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)(`assets in mediaTypes.native.ortb is not an array, or it's empty. Assets: `, assets);
    return false;
  }

  // validate that ids exist, that they are unique and that they are numbers
  const ids = assets.map(asset => asset.id);
  if (assets.length !== new Set(ids).size || ids.some(id => id !== parseInt(id, 10))) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)(`each asset object must have 'id' property, it must be unique and it must be an integer`);
    return false;
  }
  if (ortb.hasOwnProperty('eventtrackers') && !Array.isArray(ortb.eventtrackers)) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)('ortb.eventtrackers is not an array. Eventtrackers: ', ortb.eventtrackers);
    return false;
  }
  return assets.every(asset => isOpenRTBAssetValid(asset));
}
function isOpenRTBAssetValid(asset) {
  if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isPlainObject)(asset)) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)(`asset must be an object. Provided asset: `, asset);
    return false;
  }
  if (asset.img) {
    if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isNumber)(asset.img.w) && !(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isNumber)(asset.img.wmin)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)(`for img asset there must be 'w' or 'wmin' property`);
      return false;
    }
    if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isNumber)(asset.img.h) && !(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isNumber)(asset.img.hmin)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)(`for img asset there must be 'h' or 'hmin' property`);
      return false;
    }
  } else if (asset.title) {
    if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isNumber)(asset.title.len)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)(`for title asset there must be 'len' property defined`);
      return false;
    }
  } else if (asset.data) {
    if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isNumber)(asset.data.type)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)(`for data asset 'type' property must be a number`);
      return false;
    }
  } else if (asset.video) {
    if (!Array.isArray(asset.video.mimes) || !Array.isArray(asset.video.protocols) || !(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isNumber)(asset.video.minduration) || !(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isNumber)(asset.video.maxduration)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)('video asset is not properly configured');
      return false;
    }
  }
  return true;
}

/**
 * Check if the native type specified in the adUnit is supported by Prebid.
 */
function typeIsSupported(type) {
  if (!(type && (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_3__.includes)(Object.keys(SUPPORTED_TYPES), type))) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)(`${type} nativeParam is not supported`);
    return false;
  }
  return true;
}

/**
 * Helper functions for working with native-enabled adUnits
 * TODO: abstract this and the video helper functions into general
 * adunit validation helper functions
 */
const nativeAdUnit = adUnit => {
  const mediaType = adUnit.mediaType === 'native';
  const mediaTypes = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__["default"])(adUnit, 'mediaTypes.native');
  return mediaType || mediaTypes;
};
const nativeBidder = bid => (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_3__.includes)(nativeAdapters, bid.bidder);
const hasNonNativeBidder = adUnit => adUnit.bids.filter(bid => !nativeBidder(bid)).length;

/**
 * Validate that the native assets on this bid contain all assets that were
 * marked as required in the adUnit configuration.
 * @param {Bid} bid Native bid to validate
 * @param {BidRequest[]} bidRequests All bid requests for an auction
 * @return {Boolean} If object is valid
 */
function nativeBidIsValid(bid) {
  let {
    index = _auctionManager_js__WEBPACK_IMPORTED_MODULE_4__.auctionManager.index
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const adUnit = index.getAdUnit(bid);
  if (!adUnit) {
    return false;
  }
  let ortbRequest = adUnit.nativeOrtbRequest;
  let ortbResponse = bid.native?.ortb || toOrtbNativeResponse(bid.native, ortbRequest);
  return isNativeOpenRTBBidValid(ortbResponse, ortbRequest);
}
function isNativeOpenRTBBidValid(bidORTB, bidRequestORTB) {
  if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_1__["default"])(bidORTB, 'link.url')) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)(`native response doesn't have 'link' property. Ortb response: `, bidORTB);
    return false;
  }
  let requiredAssetIds = bidRequestORTB.assets.filter(asset => asset.required === 1).map(a => a.id);
  let returnedAssetIds = bidORTB.assets.map(asset => asset.id);
  const match = requiredAssetIds.every(assetId => (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_3__.includes)(returnedAssetIds, assetId));
  if (!match) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)(`didn't receive a bid with all required assets. Required ids: ${requiredAssetIds}, but received ids in response: ${returnedAssetIds}`);
  }
  return match;
}

/*
 * Native responses may have associated impression or click trackers.
 * This retrieves the appropriate tracker urls for the given ad object and
 * fires them. As a native creatives may be in a cross-origin frame, it may be
 * necessary to invoke this function via postMessage. secureCreatives is
 * configured to fire this function when it receives a `message` of 'Prebid Native'
 * and an `adId` with the value of the `bid.adId`. When a message is posted with
 * these parameters, impression trackers are fired. To fire click trackers, the
 * message should contain an `action` set to 'click'.
 *
 * // Native creative template example usage
 * <a href="%%CLICK_URL_UNESC%%%%PATTERN:hb_native_linkurl%%"
 *    target="_blank"
 *    onclick="fireTrackers('click')">
 *    %%PATTERN:hb_native_title%%
 * </a>
 *
 * <script>
 *   function fireTrackers(action) {
 *     var message = {message: 'Prebid Native', adId: '%%PATTERN:hb_adid%%'};
 *     if (action === 'click') {message.action = 'click';} // fires click trackers
 *     window.parent.postMessage(JSON.stringify(message), '*');
 *   }
 *   fireTrackers(); // fires impressions when creative is loaded
 * </script>
 */
function fireNativeTrackers(message, bidResponse) {
  const nativeResponse = bidResponse.native.ortb || legacyPropertiesToOrtbNative(bidResponse.native);
  if (message.action === 'click') {
    fireClickTrackers(nativeResponse, message?.assetId);
  } else {
    fireImpressionTrackers(nativeResponse);
  }
  return message.action;
}
function fireImpressionTrackers(nativeResponse) {
  let {
    runMarkup = mkup => (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.insertHtmlIntoIframe)(mkup),
    fetchURL = _utils_js__WEBPACK_IMPORTED_MODULE_2__.triggerPixel
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const impTrackers = (nativeResponse.eventtrackers || []).filter(tracker => tracker.event === TRACKER_EVENTS.impression);
  let {
    img,
    js
  } = impTrackers.reduce((tally, tracker) => {
    if (TRACKER_METHODS.hasOwnProperty(tracker.method)) {
      tally[TRACKER_METHODS[tracker.method]].push(tracker.url);
    }
    return tally;
  }, {
    img: [],
    js: []
  });
  if (nativeResponse.imptrackers) {
    img = img.concat(nativeResponse.imptrackers);
  }
  img.forEach(url => fetchURL(url));
  js = js.map(url => `<script async src="${url}"></script>`);
  if (nativeResponse.jstracker) {
    // jstracker is already HTML markup
    js = js.concat([nativeResponse.jstracker]);
  }
  if (js.length) {
    runMarkup(js.join('\n'));
  }
}
function fireClickTrackers(nativeResponse) {
  let assetId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  let {
    fetchURL = _utils_js__WEBPACK_IMPORTED_MODULE_2__.triggerPixel
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  // legacy click tracker
  if (!assetId) {
    (nativeResponse.link?.clicktrackers || []).forEach(url => fetchURL(url));
  } else {
    // ortb click tracker. This will try to call the clicktracker associated with the asset;
    // will fallback to the link if none is found.
    const assetIdLinkMap = (nativeResponse.assets || []).filter(a => a.link).reduce((map, asset) => {
      map[asset.id] = asset.link;
      return map;
    }, {});
    const masterClickTrackers = nativeResponse.link?.clicktrackers || [];
    let assetLink = assetIdLinkMap[assetId];
    let clickTrackers = masterClickTrackers;
    if (assetLink) {
      clickTrackers = assetLink.clicktrackers || [];
    }
    clickTrackers.forEach(url => fetchURL(url));
  }
}
function setNativeResponseProperties(bid, adUnit) {
  const nativeOrtbRequest = adUnit?.nativeOrtbRequest;
  const nativeOrtbResponse = bid.native?.ortb;
  if (nativeOrtbRequest && nativeOrtbResponse) {
    const legacyResponse = toLegacyResponse(nativeOrtbResponse, nativeOrtbRequest);
    Object.assign(bid.native, legacyResponse);
  }
  ['rendererUrl', 'adTemplate'].forEach(prop => {
    const val = adUnit?.nativeParams?.[prop];
    if (val) {
      bid.native[prop] = getAssetValue(val);
    }
  });
}

/**
 * Gets native targeting key-value pairs
 * @param {Object} bid
 * @return {Object} targeting
 */
function getNativeTargeting(bid) {
  let {
    index = _auctionManager_js__WEBPACK_IMPORTED_MODULE_4__.auctionManager.index
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  let keyValues = {};
  const adUnit = index.getAdUnit(bid);
  const globalSendTargetingKeys = adUnit?.nativeParams?.ortb == null && (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__["default"])(adUnit, `nativeParams.sendTargetingKeys`) !== false;
  const nativeKeys = getNativeKeys(adUnit);
  const flatBidNativeKeys = {
    ...bid.native,
    ...bid.native.ext
  };
  delete flatBidNativeKeys.ext;
  Object.keys(flatBidNativeKeys).forEach(asset => {
    const key = nativeKeys[asset];
    let value = getAssetValue(bid.native[asset]) || getAssetValue((0,_utils_js__WEBPACK_IMPORTED_MODULE_1__["default"])(bid, `native.ext.${asset}`));
    if (asset === 'adTemplate' || !key || !value) {
      return;
    }
    let sendPlaceholder = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__["default"])(adUnit, `nativeParams.${asset}.sendId`);
    if (typeof sendPlaceholder !== 'boolean') {
      sendPlaceholder = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__["default"])(adUnit, `nativeParams.ext.${asset}.sendId`);
    }
    if (sendPlaceholder) {
      const placeholder = `${key}:${bid.adId}`;
      value = placeholder;
    }
    let assetSendTargetingKeys = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__["default"])(adUnit, `nativeParams.${asset}.sendTargetingKeys`);
    if (typeof assetSendTargetingKeys !== 'boolean') {
      assetSendTargetingKeys = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__["default"])(adUnit, `nativeParams.ext.${asset}.sendTargetingKeys`);
    }
    const sendTargeting = typeof assetSendTargetingKeys === 'boolean' ? assetSendTargetingKeys : globalSendTargetingKeys;
    if (sendTargeting) {
      keyValues[key] = value;
    }
  });
  return keyValues;
}
function getNativeAssets(nativeProps, keys) {
  let ext = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  let assets = [];
  Object.entries(nativeProps).filter(_ref => {
    let [k, v] = _ref;
    return v && (ext === false && k === 'ext' || keys == null || keys.includes(k));
  }).forEach(_ref2 => {
    let [key, value] = _ref2;
    if (ext === false && key === 'ext') {
      assets.push(...getNativeAssets(value, keys, true));
    } else if (ext || _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_KEYS.hasOwnProperty(key)) {
      assets.push({
        key,
        value: getAssetValue(value)
      });
    }
  });
  return assets;
}
function getNativeRenderingData(bid, adUnit, keys) {
  const data = {
    ...(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.getDefinedParams)(bid.native, ['rendererUrl', 'adTemplate']),
    assets: getNativeAssets(bid.native, keys),
    nativeKeys: _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_KEYS
  };
  if (bid.native.ortb) {
    data.ortb = bid.native.ortb;
  } else if (adUnit.mediaTypes?.native?.ortb) {
    data.ortb = toOrtbNativeResponse(bid.native, adUnit.nativeOrtbRequest);
  }
  return data;
}
function assetsMessage(data, adObject, keys) {
  let {
    index = _auctionManager_js__WEBPACK_IMPORTED_MODULE_4__.auctionManager.index
  } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  const msg = {
    message: 'assetResponse',
    adId: data.adId
  };
  let renderData = (0,_adRendering_js__WEBPACK_IMPORTED_MODULE_5__.getRenderingData)(adObject).native;
  if (renderData) {
    // if we have native rendering data (set up by the nativeRendering module)
    // include it in full ("all assets") together with the renderer.
    // this is to allow PUC to use dynamic renderers without requiring changes in creative setup
    msg.native = Object.assign({}, renderData);
    msg.renderer = (0,_creativeRenderers_js__WEBPACK_IMPORTED_MODULE_6__.getCreativeRendererSource)(adObject);
    if (keys != null) {
      renderData.assets = renderData.assets.filter(_ref3 => {
        let {
          key
        } = _ref3;
        return keys.includes(key);
      });
    }
  } else {
    renderData = getNativeRenderingData(adObject, index.getAdUnit(adObject), keys);
  }
  return Object.assign(msg, renderData);
}
const NATIVE_KEYS_INVERTED = Object.fromEntries(Object.entries(_constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_KEYS).map(_ref4 => {
  let [k, v] = _ref4;
  return [v, k];
}));

/**
 * Constructs a message object containing asset values for each of the
 * requested data keys.
 */
function getAssetMessage(data, adObject) {
  const keys = data.assets.map(k => NATIVE_KEYS_INVERTED[k]);
  return assetsMessage(data, adObject, keys);
}
function getAllAssetsMessage(data, adObject) {
  return assetsMessage(data, adObject, null);
}

/**
 * Native assets can be a string or an object with a url prop. Returns the value
 * appropriate for sending in adserver targeting or placeholder replacement.
 */
function getAssetValue(value) {
  return value?.url || value;
}
function getNativeKeys(adUnit) {
  const extraNativeKeys = {};
  if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_1__["default"])(adUnit, 'nativeParams.ext')) {
    Object.keys(adUnit.nativeParams.ext).forEach(extKey => {
      extraNativeKeys[extKey] = `hb_native_${extKey}`;
    });
  }
  return {
    ..._constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_KEYS,
    ...extraNativeKeys
  };
}

/**
 * converts Prebid legacy native assets request to OpenRTB format
 * @param {object} legacyNativeAssets an object that describes a native bid request in Prebid proprietary format
 * @returns an OpenRTB format of the same bid request
 */
function toOrtbNativeRequest(legacyNativeAssets) {
  if (!legacyNativeAssets && !(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isPlainObject)(legacyNativeAssets)) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)('Native assets object is empty or not an object: ', legacyNativeAssets);
    return;
  }
  const ortb = {
    ver: '1.2',
    assets: []
  };
  for (let key in legacyNativeAssets) {
    // skip conversion for non-asset keys
    if (_constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_KEYS_THAT_ARE_NOT_ASSETS.includes(key)) continue;
    if (!_constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_KEYS.hasOwnProperty(key)) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)(`Unrecognized native asset code: ${key}. Asset will be ignored.`);
      continue;
    }
    if (key === 'privacyLink') {
      ortb.privacy = 1;
      continue;
    }
    const asset = legacyNativeAssets[key];
    let required = 0;
    if (asset.required && (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isBoolean)(asset.required)) {
      required = Number(asset.required);
    }
    const ortbAsset = {
      id: ortb.assets.length,
      required
    };
    // data cases
    if (key in _constants_js__WEBPACK_IMPORTED_MODULE_0__.PREBID_NATIVE_DATA_KEYS_TO_ORTB) {
      ortbAsset.data = {
        type: _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_ASSET_TYPES[_constants_js__WEBPACK_IMPORTED_MODULE_0__.PREBID_NATIVE_DATA_KEYS_TO_ORTB[key]]
      };
      if (asset.len) {
        ortbAsset.data.len = asset.len;
      }
      // icon or image case
    } else if (key === 'icon' || key === 'image') {
      ortbAsset.img = {
        type: key === 'icon' ? _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_IMAGE_TYPES.ICON : _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_IMAGE_TYPES.MAIN
      };
      // if min_width and min_height are defined in aspect_ratio, they are preferred
      if (asset.aspect_ratios) {
        if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isArray)(asset.aspect_ratios)) {
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)("image.aspect_ratios was passed, but it's not a an array:", asset.aspect_ratios);
        } else if (!asset.aspect_ratios.length) {
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)("image.aspect_ratios was passed, but it's empty:", asset.aspect_ratios);
        } else {
          const {
            min_width: minWidth,
            min_height: minHeight
          } = asset.aspect_ratios[0];
          if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isInteger)(minWidth) || !(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isInteger)(minHeight)) {
            (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)('image.aspect_ratios min_width or min_height are invalid: ', minWidth, minHeight);
          } else {
            ortbAsset.img.wmin = minWidth;
            ortbAsset.img.hmin = minHeight;
          }
          const aspectRatios = asset.aspect_ratios.filter(ar => ar.ratio_width && ar.ratio_height).map(ratio => `${ratio.ratio_width}:${ratio.ratio_height}`);
          if (aspectRatios.length > 0) {
            ortbAsset.img.ext = {
              aspectratios: aspectRatios
            };
          }
        }
      }

      // if asset.sizes exist, by OpenRTB spec we should remove wmin and hmin
      if (asset.sizes) {
        if (asset.sizes.length !== 2 || !(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isInteger)(asset.sizes[0]) || !(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isInteger)(asset.sizes[1])) {
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)('image.sizes was passed, but its value is not an array of integers:', asset.sizes);
        } else {
          ortbAsset.img.w = asset.sizes[0];
          ortbAsset.img.h = asset.sizes[1];
          delete ortbAsset.img.hmin;
          delete ortbAsset.img.wmin;
        }
      }
      // title case
    } else if (key === 'title') {
      ortbAsset.title = {
        // in openRTB, len is required for titles, while in legacy prebid was not.
        // for this reason, if len is missing in legacy prebid, we're adding a default value of 140.
        len: asset.len || 140
      };
      // all extensions to the native bid request are passed as is
    } else if (key === 'ext') {
      ortbAsset.ext = asset;
      // in `ext` case, required field is not needed
      delete ortbAsset.required;
    }
    ortb.assets.push(ortbAsset);
  }
  return ortb;
}

/**
 * Greatest common divisor between two positive integers
 * https://en.wikipedia.org/wiki/Euclidean_algorithm
 */
function gcd(a, b) {
  while (a && b && a !== b) {
    if (a > b) {
      a = a - b;
    } else {
      b = b - a;
    }
  }
  return a || b;
}

/**
 * This function converts an OpenRTB native request object to Prebid proprietary
 * format. The purpose of this function is to help adapters to handle the
 * transition phase where publishers may be using OpenRTB objects but the
 *  bidder does not yet support it.
 * @param {object} openRTBRequest an OpenRTB v1.2 request object
 * @returns a Prebid legacy native format request
 */
function fromOrtbNativeRequest(openRTBRequest) {
  if (!isOpenRTBBidRequestValid(openRTBRequest)) {
    return;
  }
  const oldNativeObject = {};
  for (const asset of openRTBRequest.assets) {
    if (asset.title) {
      const title = {
        required: asset.required ? Boolean(asset.required) : false,
        len: asset.title.len
      };
      oldNativeObject.title = title;
    } else if (asset.img) {
      const image = {
        required: asset.required ? Boolean(asset.required) : false
      };
      if (asset.img.w && asset.img.h) {
        image.sizes = [asset.img.w, asset.img.h];
      } else if (asset.img.wmin && asset.img.hmin) {
        const scale = gcd(asset.img.wmin, asset.img.hmin);
        image.aspect_ratios = [{
          min_width: asset.img.wmin,
          min_height: asset.img.hmin,
          ratio_width: asset.img.wmin / scale,
          ratio_height: asset.img.hmin / scale
        }];
      }
      if (asset.img.type === _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_IMAGE_TYPES.MAIN) {
        oldNativeObject.image = image;
      } else {
        oldNativeObject.icon = image;
      }
    } else if (asset.data) {
      let assetType = Object.keys(_constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_ASSET_TYPES).find(k => _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_ASSET_TYPES[k] === asset.data.type);
      let prebidAssetName = Object.keys(_constants_js__WEBPACK_IMPORTED_MODULE_0__.PREBID_NATIVE_DATA_KEYS_TO_ORTB).find(k => _constants_js__WEBPACK_IMPORTED_MODULE_0__.PREBID_NATIVE_DATA_KEYS_TO_ORTB[k] === assetType);
      oldNativeObject[prebidAssetName] = {
        required: asset.required ? Boolean(asset.required) : false
      };
      if (asset.data.len) {
        oldNativeObject[prebidAssetName].len = asset.data.len;
      }
    }
    if (openRTBRequest.privacy) {
      oldNativeObject.privacyLink = {
        required: false
      };
    }
    // video was not supported by old prebid assets
  }
  return oldNativeObject;
}

/**
 * Converts an OpenRTB request to a proprietary Prebid.js format.
 * The proprietary Prebid format has many limitations and will be dropped in
 * the future; adapters are encouraged to stop using it in favour of OpenRTB format.
 * IMPLEMENTATION DETAILS: This function returns the same exact object if no
 * conversion is needed. If a conversion is needed (meaning, at least one
 * bidRequest contains a native.ortb definition), it will return a copy.
 *
 * @param {BidRequest[]} bidRequests an array of valid bid requests
 * @returns an array of valid bid requests where the openRTB bids are converted to proprietary format.
 */
function convertOrtbRequestToProprietaryNative(bidRequests) {
  if (true) {
    if (!bidRequests || !(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isArray)(bidRequests)) return bidRequests;
    // check if a conversion is needed
    if (!bidRequests.some(bidRequest => (bidRequest?.mediaTypes || {})[_mediaTypes_js__WEBPACK_IMPORTED_MODULE_7__.NATIVE]?.ortb)) {
      return bidRequests;
    }
    let bidRequestsCopy = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.deepClone)(bidRequests);
    // convert Native ORTB definition to old-style prebid native definition
    for (const bidRequest of bidRequestsCopy) {
      if (bidRequest.mediaTypes && bidRequest.mediaTypes[_mediaTypes_js__WEBPACK_IMPORTED_MODULE_7__.NATIVE] && bidRequest.mediaTypes[_mediaTypes_js__WEBPACK_IMPORTED_MODULE_7__.NATIVE].ortb) {
        bidRequest.mediaTypes[_mediaTypes_js__WEBPACK_IMPORTED_MODULE_7__.NATIVE] = Object.assign((0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.pick)(bidRequest.mediaTypes[_mediaTypes_js__WEBPACK_IMPORTED_MODULE_7__.NATIVE], _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_KEYS_THAT_ARE_NOT_ASSETS), fromOrtbNativeRequest(bidRequest.mediaTypes[_mediaTypes_js__WEBPACK_IMPORTED_MODULE_7__.NATIVE].ortb));
        bidRequest.nativeParams = processNativeAdUnitParams(bidRequest.mediaTypes[_mediaTypes_js__WEBPACK_IMPORTED_MODULE_7__.NATIVE]);
      }
    }
    return bidRequestsCopy;
  }
  return bidRequests;
}

/**
 * convert PBJS proprietary native properties that are *not* assets to the ORTB native format.
 *
 * @param legacyNative `bidResponse.native` object as returned by adapters
 */
function legacyPropertiesToOrtbNative(legacyNative) {
  const response = {
    link: {},
    eventtrackers: []
  };
  Object.entries(legacyNative).forEach(_ref5 => {
    let [key, value] = _ref5;
    switch (key) {
      case 'clickUrl':
        response.link.url = value;
        break;
      case 'clickTrackers':
        response.link.clicktrackers = Array.isArray(value) ? value : [value];
        break;
      case 'impressionTrackers':
        (Array.isArray(value) ? value : [value]).forEach(url => {
          response.eventtrackers.push({
            event: TRACKER_EVENTS.impression,
            method: TRACKER_METHODS.img,
            url
          });
        });
        break;
      case 'javascriptTrackers':
        // jstracker is deprecated, but we need to use it here since 'javascriptTrackers' is markup, not an url
        // TODO: at the time of writing this, core expected javascriptTrackers to be a string (despite the name),
        // but many adapters are passing an array. It's possible that some of them are, in fact, passing URLs and not markup
        // in general, native trackers seem to be neglected and/or broken
        response.jstracker = Array.isArray(value) ? value.join('') : value;
        break;
      case 'privacyLink':
        response.privacy = value;
        break;
    }
  });
  return response;
}
function toOrtbNativeResponse(legacyResponse, ortbRequest) {
  const ortbResponse = {
    ...legacyPropertiesToOrtbNative(legacyResponse),
    assets: []
  };
  function useRequestAsset(predicate, fn) {
    let asset = ortbRequest.assets.find(predicate);
    if (asset != null) {
      asset = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.deepClone)(asset);
      fn(asset);
      ortbResponse.assets.push(asset);
    }
  }
  Object.keys(legacyResponse).filter(key => !!legacyResponse[key]).forEach(key => {
    const value = getAssetValue(legacyResponse[key]);
    switch (key) {
      // process titles
      case 'title':
        useRequestAsset(asset => asset.title != null, titleAsset => {
          titleAsset.title = {
            text: value
          };
        });
        break;
      case 'image':
      case 'icon':
        const imageType = key === 'image' ? _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_IMAGE_TYPES.MAIN : _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_IMAGE_TYPES.ICON;
        useRequestAsset(asset => asset.img != null && asset.img.type === imageType, imageAsset => {
          imageAsset.img = {
            url: value
          };
        });
        break;
      default:
        if (key in _constants_js__WEBPACK_IMPORTED_MODULE_0__.PREBID_NATIVE_DATA_KEYS_TO_ORTB) {
          useRequestAsset(asset => asset.data != null && asset.data.type === _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_ASSET_TYPES[_constants_js__WEBPACK_IMPORTED_MODULE_0__.PREBID_NATIVE_DATA_KEYS_TO_ORTB[key]], dataAsset => {
            dataAsset.data = {
              value
            };
          });
        }
        break;
    }
  });
  return ortbResponse;
}

/**
 * Generates a legacy response from an ortb response. Useful during the transition period.
 * @param {*} ortbResponse a standard ortb response object
 * @param {*} ortbRequest the ortb request, useful to match ids.
 * @returns an object containing the response in legacy native format: { title: "this is a title", image: ... }
 */
function toLegacyResponse(ortbResponse, ortbRequest) {
  const legacyResponse = {};
  const requestAssets = ortbRequest?.assets || [];
  legacyResponse.clickUrl = ortbResponse.link?.url;
  legacyResponse.privacyLink = ortbResponse.privacy;
  for (const asset of ortbResponse?.assets || []) {
    const requestAsset = requestAssets.find(reqAsset => asset.id === reqAsset.id);
    if (asset.title) {
      legacyResponse.title = asset.title.text;
    } else if (asset.img) {
      legacyResponse[requestAsset?.img?.type === _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_IMAGE_TYPES.MAIN ? 'image' : 'icon'] = {
        url: asset.img.url,
        width: asset.img.w,
        height: asset.img.h
      };
    } else if (asset.data) {
      legacyResponse[PREBID_NATIVE_DATA_KEYS_TO_ORTB_INVERSE[NATIVE_ASSET_TYPES_INVERSE[requestAsset?.data?.type]]] = asset.data.value;
    }
  }

  // Handle trackers
  legacyResponse.impressionTrackers = [];
  let jsTrackers = [];
  if (ortbResponse.imptrackers) {
    legacyResponse.impressionTrackers.push(...ortbResponse.imptrackers);
  }
  for (const eventTracker of ortbResponse?.eventtrackers || []) {
    if (eventTracker.event === TRACKER_EVENTS.impression && eventTracker.method === TRACKER_METHODS.img) {
      legacyResponse.impressionTrackers.push(eventTracker.url);
    }
    if (eventTracker.event === TRACKER_EVENTS.impression && eventTracker.method === TRACKER_METHODS.js) {
      jsTrackers.push(eventTracker.url);
    }
  }
  jsTrackers = jsTrackers.map(url => `<script async src="${url}"></script>`);
  if (ortbResponse?.jstracker) {
    jsTrackers.push(ortbResponse.jstracker);
  }
  if (jsTrackers.length) {
    legacyResponse.javascriptTrackers = jsTrackers.join('\n');
  }
  return legacyResponse;
}

/**
 * Inverts key-values of an object.
 */
function inverse(obj) {
  var retobj = {};
  for (var key in obj) {
    retobj[obj[key]] = key;
  }
  return retobj;
}

/***/ }),

/***/ "./src/polyfill.js":
/*!*************************!*\
  !*** ./src/polyfill.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   arrayFrom: () => (/* binding */ arrayFrom),
/* harmony export */   find: () => (/* binding */ find),
/* harmony export */   includes: () => (/* binding */ includes)
/* harmony export */ });
/* unused harmony export findIndex */
// These stubs are here to help transition away from core-js polyfills for browsers we are no longer supporting.
// You should not need these for new code; use stock JS instead!

function includes(target, elem, start) {
  return target && target.includes(elem, start) || false;
}
function arrayFrom() {
  return Array.from.apply(Array, arguments);
}
function find(arr, pred, thisArg) {
  return arr && arr.find(pred, thisArg);
}
function findIndex(arr, pred, thisArg) {
  return arr && arr.findIndex(pred, thisArg);
}

/***/ }),

/***/ "./src/prebid.js":
/*!***********************!*\
  !*** ./src/prebid.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* unused harmony exports setBattrForAdUnit, adUnitSetupChecks, checkAdUnitSetup, startAuction, executeCallbacks */
/* harmony import */ var _prebidGlobal_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./prebidGlobal.js */ "./src/prebidGlobal.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./utils.js */ "./node_modules/dset/dist/index.mjs");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./utils.js */ "./node_modules/dlv/index.js");
/* harmony import */ var _secureCreatives_js__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ./secureCreatives.js */ "./src/secureCreatives.js");
/* harmony import */ var _userSync_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./userSync.js */ "./src/userSync.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./auctionManager.js */ "./src/auctionManager.js");
/* harmony import */ var _targeting_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./targeting.js */ "./src/targeting.js");
/* harmony import */ var _hook_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./hook.js */ "./src/hook.js");
/* harmony import */ var _debugging_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./debugging.js */ "./src/debugging.js");
/* harmony import */ var _polyfill_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _bidfactory_js__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./bidfactory.js */ "./src/bidfactory.js");
/* harmony import */ var _storageManager_js__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./storageManager.js */ "./src/storageManager.js");
/* harmony import */ var _adapterManager_js__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./adapterManager.js */ "./src/adapterManager.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./constants.js */ "./src/constants.js");
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./events.js */ "./src/events.js");
/* harmony import */ var _utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./utils/perfMetrics.js */ "./src/utils/perfMetrics.js");
/* harmony import */ var _utils_promise_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./utils/promise.js */ "./src/utils/promise.js");
/* harmony import */ var _fpd_enrichment_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./fpd/enrichment.js */ "./src/fpd/enrichment.js");
/* harmony import */ var _consentHandler_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./consentHandler.js */ "./src/consentHandler.js");
/* harmony import */ var _adRendering_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./adRendering.js */ "./src/adRendering.js");
/* harmony import */ var _utils_reducers_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./utils/reducers.js */ "./src/utils/reducers.js");
/* harmony import */ var _video_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./video.js */ "./src/video.js");
/** @module pbjs */























const pbjsInstance = (0,_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_0__.getGlobal)();
const {
  triggerUserSyncs
} = _userSync_js__WEBPACK_IMPORTED_MODULE_1__.userSync;

/* private variables */
const {
  ADD_AD_UNITS,
  REQUEST_BIDS,
  SET_TARGETING
} = _constants_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS;
const eventValidators = {
  bidWon: checkDefinedPlacement
};

// initialize existing debugging sessions if present
(0,_debugging_js__WEBPACK_IMPORTED_MODULE_3__.loadSession)();

/* Public vars */
pbjsInstance.bidderSettings = pbjsInstance.bidderSettings || {};

// let the world know we are loaded
pbjsInstance.libLoaded = true;

// version auto generated from build
pbjsInstance.version = "v9.20.0-pre";
(0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Prebid.js v9.20.0-pre loaded");
pbjsInstance.installedModules = pbjsInstance.installedModules || [];

// create adUnit array
pbjsInstance.adUnits = pbjsInstance.adUnits || [];

// Allow publishers who enable user sync override to trigger their sync
pbjsInstance.triggerUserSyncs = triggerUserSyncs;
function checkDefinedPlacement(id) {
  var adUnitCodes = _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__.auctionManager.getBidsRequested().map(bidSet => bidSet.bids.map(bid => bid.adUnitCode)).reduce(_utils_js__WEBPACK_IMPORTED_MODULE_4__.flatten).filter(_utils_js__WEBPACK_IMPORTED_MODULE_4__.uniques);
  if (!adUnitCodes.includes(id)) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('The "' + id + '" placement is not defined.');
    return;
  }
  return true;
}
function validateSizes(sizes, targLength) {
  let cleanSizes = [];
  if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.isArray)(sizes) && (targLength ? sizes.length === targLength : sizes.length > 0)) {
    // check if an array of arrays or array of numbers
    if (sizes.every(sz => (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.isArrayOfNums)(sz, 2))) {
      cleanSizes = sizes;
    } else if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.isArrayOfNums)(sizes, 2)) {
      cleanSizes.push(sizes);
    }
  }
  return cleanSizes;
}
function setBattrForAdUnit(adUnit, mediaType) {
  const ortb2Imp = adUnit.ortb2Imp || {};
  const mediaTypes = adUnit.mediaTypes || {};
  if (ortb2Imp[mediaType]?.battr && mediaTypes[mediaType]?.battr && ortb2Imp[mediaType]?.battr !== mediaTypes[mediaType]?.battr) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logWarn)(`Ad unit ${adUnit.code} specifies conflicting ortb2Imp.${mediaType}.battr and mediaTypes.${mediaType}.battr, the latter will be ignored`, adUnit);
  }
  const battr = ortb2Imp[mediaType]?.battr || mediaTypes[mediaType]?.battr;
  if (battr != null) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_6__.dset)(adUnit, `ortb2Imp.${mediaType}.battr`, battr);
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_6__.dset)(adUnit, `mediaTypes.${mediaType}.battr`, battr);
  }
}
function validateBannerMediaType(adUnit) {
  const validatedAdUnit = (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.deepClone)(adUnit);
  const banner = validatedAdUnit.mediaTypes.banner;
  const bannerSizes = validateSizes(banner.sizes);
  if (bannerSizes.length > 0) {
    banner.sizes = bannerSizes;
    // Deprecation Warning: This property will be deprecated in next release in favor of adUnit.mediaTypes.banner.sizes
    validatedAdUnit.sizes = bannerSizes;
  } else {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('Detected a mediaTypes.banner object without a proper sizes field.  Please ensure the sizes are listed like: [[300, 250], ...].  Removing invalid mediaTypes.banner object from request.');
    delete validatedAdUnit.mediaTypes.banner;
  }
  setBattrForAdUnit(validatedAdUnit, 'banner');
  return validatedAdUnit;
}
function validateVideoMediaType(adUnit) {
  const validatedAdUnit = (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.deepClone)(adUnit);
  const video = validatedAdUnit.mediaTypes.video;
  if (video.playerSize) {
    let tarPlayerSizeLen = typeof video.playerSize[0] === 'number' ? 2 : 1;
    const videoSizes = validateSizes(video.playerSize, tarPlayerSizeLen);
    if (videoSizes.length > 0) {
      if (tarPlayerSizeLen === 2) {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)('Transforming video.playerSize from [640,480] to [[640,480]] so it\'s in the proper format.');
      }
      video.playerSize = videoSizes;
      // Deprecation Warning: This property will be deprecated in next release in favor of adUnit.mediaTypes.video.playerSize
      validatedAdUnit.sizes = videoSizes;
    } else {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('Detected incorrect configuration of mediaTypes.video.playerSize.  Please specify only one set of dimensions in a format like: [[640, 480]]. Removing invalid mediaTypes.video.playerSize property from request.');
      delete validatedAdUnit.mediaTypes.video.playerSize;
    }
  }
  (0,_video_js__WEBPACK_IMPORTED_MODULE_7__.validateOrtbVideoFields)(validatedAdUnit);
  setBattrForAdUnit(validatedAdUnit, 'video');
  return validatedAdUnit;
}
function validateNativeMediaType(adUnit) {
  function err(msg) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)(`Error in adUnit "${adUnit.code}": ${msg}. Removing native request from ad unit`, adUnit);
    delete validatedAdUnit.mediaTypes.native;
    return validatedAdUnit;
  }
  function checkDeprecated(onDeprecated) {
    for (const key of ['sendTargetingKeys', 'types']) {
      if (native.hasOwnProperty(key)) {
        const res = onDeprecated(key);
        if (res) return res;
      }
    }
  }
  const validatedAdUnit = (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.deepClone)(adUnit);
  const native = validatedAdUnit.mediaTypes.native;
  // if native assets are specified in OpenRTB format, remove legacy assets and print a warn.
  if (native.ortb) {
    if (native.ortb.assets?.some(asset => !(0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.isNumber)(asset.id) || asset.id < 0 || asset.id % 1 !== 0)) {
      return err('native asset ID must be a nonnegative integer');
    }
    if (checkDeprecated(key => err(`ORTB native requests cannot specify "${key}"`))) {
      return validatedAdUnit;
    }
    const legacyNativeKeys = Object.keys(_constants_js__WEBPACK_IMPORTED_MODULE_2__.NATIVE_KEYS).filter(key => _constants_js__WEBPACK_IMPORTED_MODULE_2__.NATIVE_KEYS[key].includes('hb_native_'));
    const nativeKeys = Object.keys(native);
    const intersection = nativeKeys.filter(nativeKey => legacyNativeKeys.includes(nativeKey));
    if (intersection.length > 0) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)(`when using native OpenRTB format, you cannot use legacy native properties. Deleting ${intersection} keys from request.`);
      intersection.forEach(legacyKey => delete validatedAdUnit.mediaTypes.native[legacyKey]);
    }
  } else {
    checkDeprecated(key => `mediaTypes.native.${key} is deprecated, consider using native ORTB instead`, adUnit);
  }
  if (native.image && native.image.sizes && !Array.isArray(native.image.sizes)) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('Please use an array of sizes for native.image.sizes field.  Removing invalid mediaTypes.native.image.sizes property from request.');
    delete validatedAdUnit.mediaTypes.native.image.sizes;
  }
  if (native.image && native.image.aspect_ratios && !Array.isArray(native.image.aspect_ratios)) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('Please use an array of sizes for native.image.aspect_ratios field.  Removing invalid mediaTypes.native.image.aspect_ratios property from request.');
    delete validatedAdUnit.mediaTypes.native.image.aspect_ratios;
  }
  if (native.icon && native.icon.sizes && !Array.isArray(native.icon.sizes)) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('Please use an array of sizes for native.icon.sizes field.  Removing invalid mediaTypes.native.icon.sizes property from request.');
    delete validatedAdUnit.mediaTypes.native.icon.sizes;
  }
  setBattrForAdUnit(validatedAdUnit, 'native');
  return validatedAdUnit;
}
function validateAdUnitPos(adUnit, mediaType) {
  let pos = (0,_utils_js__WEBPACK_IMPORTED_MODULE_8__["default"])(adUnit, `mediaTypes.${mediaType}.pos`);
  if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.isNumber)(pos) || isNaN(pos) || !isFinite(pos)) {
    let warning = `Value of property 'pos' on ad unit ${adUnit.code} should be of type: Number`;
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logWarn)(warning);
    delete adUnit.mediaTypes[mediaType].pos;
  }
  return adUnit;
}
function validateAdUnit(adUnit) {
  const msg = msg => `adUnit.code '${adUnit.code}' ${msg}`;
  const mediaTypes = adUnit.mediaTypes;
  const bids = adUnit.bids;
  if (bids != null && !(0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.isArray)(bids)) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)(msg(`defines 'adUnit.bids' that is not an array. Removing adUnit from auction`));
    return null;
  }
  if (bids == null && adUnit.ortb2Imp == null) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)(msg(`has no 'adUnit.bids' and no 'adUnit.ortb2Imp'. Removing adUnit from auction`));
    return null;
  }
  if (!mediaTypes || Object.keys(mediaTypes).length === 0) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)(msg(`does not define a 'mediaTypes' object.  This is a required field for the auction, so this adUnit has been removed.`));
    return null;
  }
  if (adUnit.ortb2Imp != null && (bids == null || bids.length === 0)) {
    adUnit.bids = [{
      bidder: null
    }]; // the 'null' bidder is treated as an s2s-only placeholder by adapterManager
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logMessage)(msg(`defines 'adUnit.ortb2Imp' with no 'adUnit.bids'; it will be seen only by S2S adapters`));
  }
  return adUnit;
}
const adUnitSetupChecks = {
  validateAdUnit,
  validateBannerMediaType,
  validateSizes
};
if (true) {
  Object.assign(adUnitSetupChecks, {
    validateNativeMediaType
  });
}
if (true) {
  Object.assign(adUnitSetupChecks, {
    validateVideoMediaType
  });
}
const checkAdUnitSetup = (0,_hook_js__WEBPACK_IMPORTED_MODULE_9__.hook)('sync', function (adUnits) {
  const validatedAdUnits = [];
  adUnits.forEach(adUnit => {
    adUnit = validateAdUnit(adUnit);
    if (adUnit == null) return;
    const mediaTypes = adUnit.mediaTypes;
    let validatedBanner, validatedVideo, validatedNative;
    if (mediaTypes.banner) {
      validatedBanner = validateBannerMediaType(adUnit);
      if (mediaTypes.banner.hasOwnProperty('pos')) validatedBanner = validateAdUnitPos(validatedBanner, 'banner');
    }
    if ( true && mediaTypes.video) {
      validatedVideo = validatedBanner ? validateVideoMediaType(validatedBanner) : validateVideoMediaType(adUnit);
      if (mediaTypes.video.hasOwnProperty('pos')) validatedVideo = validateAdUnitPos(validatedVideo, 'video');
    }
    if ( true && mediaTypes.native) {
      validatedNative = validatedVideo ? validateNativeMediaType(validatedVideo) : validatedBanner ? validateNativeMediaType(validatedBanner) : validateNativeMediaType(adUnit);
    }
    const validatedAdUnit = Object.assign({}, validatedBanner, validatedVideo, validatedNative);
    validatedAdUnits.push(validatedAdUnit);
  });
  return validatedAdUnits;
}, 'checkAdUnitSetup');
function fillAdUnitDefaults(adUnits) {
  if (true) {
    adUnits.forEach(au => (0,_video_js__WEBPACK_IMPORTED_MODULE_7__.fillVideoDefaults)(au));
  }
}

/// ///////////////////////////////
//                              //
//    Start Public APIs         //
//                              //
/// ///////////////////////////////

/**
 * This function returns the query string targeting parameters available at this moment for a given ad unit. Note that some bidder's response may not have been received if you call this function too quickly after the requests are sent.
 * @param  {string} [adunitCode] adUnitCode to get the bid responses for
 * @alias module:pbjs.getAdserverTargetingForAdUnitCodeStr
 * @return {Array}  returnObj return bids array
 */
pbjsInstance.getAdserverTargetingForAdUnitCodeStr = function (adunitCode) {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.getAdserverTargetingForAdUnitCodeStr", arguments);

  // call to retrieve bids array
  if (adunitCode) {
    var res = pbjsInstance.getAdserverTargetingForAdUnitCode(adunitCode);
    return (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.transformAdServerTargetingObj)(res);
  } else {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logMessage)('Need to call getAdserverTargetingForAdUnitCodeStr with adunitCode');
  }
};

/**
 * This function returns the query string targeting parameters available at this moment for a given ad unit. Note that some bidder's response may not have been received if you call this function too quickly after the requests are sent.
 * @param adunitCode {string} adUnitCode to get the bid responses for
 * @alias module:pbjs.getHighestUnusedBidResponseForAdUnitCode
 * @returns {Object}  returnObj return bid
 */
pbjsInstance.getHighestUnusedBidResponseForAdUnitCode = function (adunitCode) {
  if (adunitCode) {
    const bid = _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__.auctionManager.getAllBidsForAdUnitCode(adunitCode).filter(_targeting_js__WEBPACK_IMPORTED_MODULE_10__.isBidUsable);
    return bid.length ? bid.reduce(_utils_reducers_js__WEBPACK_IMPORTED_MODULE_11__.getHighestCpm) : {};
  } else {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logMessage)('Need to call getHighestUnusedBidResponseForAdUnitCode with adunitCode');
  }
};

/**
 * This function returns the query string targeting parameters available at this moment for a given ad unit. Note that some bidder's response may not have been received if you call this function too quickly after the requests are sent.
 * @param adUnitCode {string} adUnitCode to get the bid responses for
 * @alias module:pbjs.getAdserverTargetingForAdUnitCode
 * @returns {Object}  returnObj return bids
 */
pbjsInstance.getAdserverTargetingForAdUnitCode = function (adUnitCode) {
  return pbjsInstance.getAdserverTargeting(adUnitCode)[adUnitCode];
};

/**
 * returns all ad server targeting for all ad units
 * @return {Object} Map of adUnitCodes and targeting values []
 * @alias module:pbjs.getAdserverTargeting
 */

pbjsInstance.getAdserverTargeting = function (adUnitCode) {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.getAdserverTargeting", arguments);
  return _targeting_js__WEBPACK_IMPORTED_MODULE_10__.targeting.getAllTargeting(adUnitCode);
};
pbjsInstance.getConsentMetadata = function () {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.getConsentMetadata");
  return _consentHandler_js__WEBPACK_IMPORTED_MODULE_12__.allConsent.getConsentMeta();
};
function getBids(type) {
  const responses = _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__.auctionManager[type]().filter(bid => _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__.auctionManager.getAdUnitCodes().includes(bid.adUnitCode));

  // find the last auction id to get responses for most recent auction only
  const currentAuctionId = _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__.auctionManager.getLastAuctionId();
  return responses.map(bid => bid.adUnitCode).filter(_utils_js__WEBPACK_IMPORTED_MODULE_4__.uniques).map(adUnitCode => responses.filter(bid => bid.auctionId === currentAuctionId && bid.adUnitCode === adUnitCode)).filter(bids => bids && bids[0] && bids[0].adUnitCode).map(bids => {
    return {
      [bids[0].adUnitCode]: {
        bids
      }
    };
  }).reduce((a, b) => Object.assign(a, b), {});
}

/**
 * This function returns the bids requests involved in an auction but not bid on
 * @alias module:pbjs.getNoBids
 * @return {Object}            map | object that contains the bidRequests
 */

pbjsInstance.getNoBids = function () {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.getNoBids", arguments);
  return getBids('getNoBids');
};

/**
 * This function returns the bids requests involved in an auction but not bid on or the specified adUnitCode
 * @param  {string} adUnitCode adUnitCode
 * @alias module:pbjs.getNoBidsForAdUnitCode
 * @return {Object}           bidResponse object
 */

pbjsInstance.getNoBidsForAdUnitCode = function (adUnitCode) {
  const bids = _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__.auctionManager.getNoBids().filter(bid => bid.adUnitCode === adUnitCode);
  return {
    bids
  };
};

/**
 * This function returns the bid responses at the given moment.
 * @alias module:pbjs.getBidResponses
 * @return {Object}            map | object that contains the bidResponses
 */

pbjsInstance.getBidResponses = function () {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.getBidResponses", arguments);
  return getBids('getBidsReceived');
};

/**
 * Returns bidResponses for the specified adUnitCode
 * @param  {string} adUnitCode adUnitCode
 * @alias module:pbjs.getBidResponsesForAdUnitCode
 * @return {Object}            bidResponse object
 */

pbjsInstance.getBidResponsesForAdUnitCode = function (adUnitCode) {
  const bids = _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__.auctionManager.getBidsReceived().filter(bid => bid.adUnitCode === adUnitCode);
  return {
    bids
  };
};

/**
 * Set query string targeting on one or more GPT ad units.
 * @param {(string|string[])} adUnit a single `adUnit.code` or multiple.
 * @param {function(object): function(string): boolean} customSlotMatching gets a GoogleTag slot and returns a filter function for adUnitCode, so you can decide to match on either eg. return slot => { return adUnitCode => { return slot.getSlotElementId() === 'myFavoriteDivId'; } };
 * @alias module:pbjs.setTargetingForGPTAsync
 */
pbjsInstance.setTargetingForGPTAsync = function (adUnit, customSlotMatching) {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.setTargetingForGPTAsync", arguments);
  if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.isGptPubadsDefined)()) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('window.googletag is not defined on the page');
    return;
  }
  _targeting_js__WEBPACK_IMPORTED_MODULE_10__.targeting.setTargetingForGPT(adUnit, customSlotMatching);
};

/**
 * Set query string targeting on all AST (AppNexus Seller Tag) ad units. Note that this function has to be called after all ad units on page are defined. For working example code, see [Using Prebid.js with AppNexus Publisher Ad Server](http://prebid.org/dev-docs/examples/use-prebid-with-appnexus-ad-server.html).
 * @param  {(string|string[])} adUnitCodes adUnitCode or array of adUnitCodes
 * @alias module:pbjs.setTargetingForAst
 */
pbjsInstance.setTargetingForAst = function (adUnitCodes) {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.setTargetingForAn", arguments);
  if (!_targeting_js__WEBPACK_IMPORTED_MODULE_10__.targeting.isApntagDefined()) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('window.apntag is not defined on the page');
    return;
  }
  _targeting_js__WEBPACK_IMPORTED_MODULE_10__.targeting.setTargetingForAst(adUnitCodes);

  // emit event
  _events_js__WEBPACK_IMPORTED_MODULE_13__.emit(SET_TARGETING, _targeting_js__WEBPACK_IMPORTED_MODULE_10__.targeting.getAllTargeting());
};

/**
 * This function will render the ad (based on params) in the given iframe document passed through.
 * Note that doc SHOULD NOT be the parent document page as we can't doc.write() asynchronously
 * @param  {Document} doc document
 * @param  {string} id bid id to locate the ad
 * @alias module:pbjs.renderAd
 */
pbjsInstance.renderAd = (0,_hook_js__WEBPACK_IMPORTED_MODULE_9__.hook)('async', function (doc, id, options) {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.renderAd", arguments);
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logMessage)('Calling renderAd with adId :' + id);
  (0,_adRendering_js__WEBPACK_IMPORTED_MODULE_14__.renderAdDirect)(doc, id, options);
});

/**
 * Remove adUnit from the $$PREBID_GLOBAL$$ configuration, if there are no addUnitCode(s) it will remove all
 * @param  {string| Array} adUnitCode the adUnitCode(s) to remove
 * @alias module:pbjs.removeAdUnit
 */
pbjsInstance.removeAdUnit = function (adUnitCode) {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.removeAdUnit", arguments);
  if (!adUnitCode) {
    pbjsInstance.adUnits = [];
    return;
  }
  let adUnitCodes;
  if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.isArray)(adUnitCode)) {
    adUnitCodes = adUnitCode;
  } else {
    adUnitCodes = [adUnitCode];
  }
  adUnitCodes.forEach(adUnitCode => {
    for (let i = pbjsInstance.adUnits.length - 1; i >= 0; i--) {
      if (pbjsInstance.adUnits[i].code === adUnitCode) {
        pbjsInstance.adUnits.splice(i, 1);
      }
    }
  });
};

/**
 * @param {Object} requestOptions
 * @param {function} requestOptions.bidsBackHandler
 * @param {number} requestOptions.timeout
 * @param {Array} requestOptions.adUnits
 * @param {Array} requestOptions.adUnitCodes
 * @param {Array} requestOptions.labels
 * @param {String} requestOptions.auctionId
 * @alias module:pbjs.requestBids
 */
pbjsInstance.requestBids = function () {
  const delegate = (0,_hook_js__WEBPACK_IMPORTED_MODULE_9__.hook)('async', function () {
    let {
      bidsBackHandler,
      timeout,
      adUnits,
      adUnitCodes,
      labels,
      auctionId,
      ttlBuffer,
      ortb2,
      metrics,
      defer
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _events_js__WEBPACK_IMPORTED_MODULE_13__.emit(REQUEST_BIDS);
    const cbTimeout = timeout || _config_js__WEBPACK_IMPORTED_MODULE_15__.config.getConfig('bidderTimeout');
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.requestBids", arguments);
    if (adUnitCodes != null && !Array.isArray(adUnitCodes)) {
      adUnitCodes = [adUnitCodes];
    }
    if (adUnitCodes && adUnitCodes.length) {
      // if specific adUnitCodes supplied filter adUnits for those codes
      adUnits = adUnits.filter(unit => (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_16__.includes)(adUnitCodes, unit.code));
    } else {
      // otherwise derive adUnitCodes from adUnits
      adUnitCodes = adUnits && adUnits.map(unit => unit.code);
    }
    adUnitCodes = adUnitCodes.filter(_utils_js__WEBPACK_IMPORTED_MODULE_4__.uniques);
    const ortb2Fragments = {
      global: (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.mergeDeep)({}, _config_js__WEBPACK_IMPORTED_MODULE_15__.config.getAnyConfig('ortb2') || {}, ortb2 || {}),
      bidder: Object.fromEntries(Object.entries(_config_js__WEBPACK_IMPORTED_MODULE_15__.config.getBidderConfig()).map(_ref => {
        let [bidder, cfg] = _ref;
        return [bidder, cfg.ortb2];
      }).filter(_ref2 => {
        let [_, ortb2] = _ref2;
        return ortb2 != null;
      }))
    };
    return (0,_fpd_enrichment_js__WEBPACK_IMPORTED_MODULE_17__.enrichFPD)(_utils_promise_js__WEBPACK_IMPORTED_MODULE_18__.GreedyPromise.resolve(ortb2Fragments.global)).then(global => {
      ortb2Fragments.global = global;
      return startAuction({
        bidsBackHandler,
        timeout: cbTimeout,
        adUnits,
        adUnitCodes,
        labels,
        auctionId,
        ttlBuffer,
        ortb2Fragments,
        metrics,
        defer
      });
    });
  }, 'requestBids');
  return (0,_hook_js__WEBPACK_IMPORTED_MODULE_9__.wrapHook)(delegate, function requestBids() {
    let req = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    // unlike the main body of `delegate`, this runs before any other hook has a chance to;
    // it's also not restricted in its return value in the way `async` hooks are.

    // if the request does not specify adUnits, clone the global adUnit array;
    // otherwise, if the caller goes on to use addAdUnits/removeAdUnits, any asynchronous logic
    // in any hook might see their effects.
    let adUnits = req.adUnits || pbjsInstance.adUnits;
    req.adUnits = (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.isArray)(adUnits) ? adUnits.slice() : [adUnits];
    req.metrics = (0,_utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_19__.newMetrics)();
    req.metrics.checkpoint('requestBids');
    req.defer = (0,_utils_promise_js__WEBPACK_IMPORTED_MODULE_18__.defer)({
      promiseFactory: r => new Promise(r)
    });
    delegate.call(this, req);
    return req.defer.promise;
  });
}();
const startAuction = (0,_hook_js__WEBPACK_IMPORTED_MODULE_9__.hook)('async', function () {
  let {
    bidsBackHandler,
    timeout: cbTimeout,
    adUnits,
    ttlBuffer,
    adUnitCodes,
    labels,
    auctionId,
    ortb2Fragments,
    metrics,
    defer
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const s2sBidders = (0,_adapterManager_js__WEBPACK_IMPORTED_MODULE_20__.getS2SBidderSet)(_config_js__WEBPACK_IMPORTED_MODULE_15__.config.getConfig('s2sConfig') || []);
  fillAdUnitDefaults(adUnits);
  adUnits = (0,_utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_19__.useMetrics)(metrics).measureTime('requestBids.validate', () => checkAdUnitSetup(adUnits));
  function auctionDone(bids, timedOut, auctionId) {
    if (typeof bidsBackHandler === 'function') {
      try {
        bidsBackHandler(bids, timedOut, auctionId);
      } catch (e) {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('Error executing bidsBackHandler', null, e);
      }
    }
    defer.resolve({
      bids,
      timedOut,
      auctionId
    });
  }
  const tids = {};

  /*
   * for a given adunit which supports a set of mediaTypes
   * and a given bidder which supports a set of mediaTypes
   * a bidder is eligible to participate on the adunit
   * if it supports at least one of the mediaTypes on the adunit
   */
  adUnits.forEach(adUnit => {
    // get the adunit's mediaTypes, defaulting to banner if mediaTypes isn't present
    const adUnitMediaTypes = Object.keys(adUnit.mediaTypes || {
      'banner': 'banner'
    });

    // get the bidder's mediaTypes
    const allBidders = adUnit.bids.map(bid => bid.bidder);
    const bidderRegistry = _adapterManager_js__WEBPACK_IMPORTED_MODULE_20__["default"].bidderRegistry;
    const bidders = allBidders.filter(bidder => !s2sBidders.has(bidder));
    adUnit.adUnitId = (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.generateUUID)();
    const tid = adUnit.ortb2Imp?.ext?.tid;
    if (tid) {
      if (tids.hasOwnProperty(adUnit.code)) {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logWarn)(`Multiple distinct ortb2Imp.ext.tid were provided for twin ad units '${adUnit.code}'`);
      } else {
        tids[adUnit.code] = tid;
      }
    }
    if (ttlBuffer != null && !adUnit.hasOwnProperty('ttlBuffer')) {
      adUnit.ttlBuffer = ttlBuffer;
    }
    bidders.forEach(bidder => {
      const adapter = bidderRegistry[bidder];
      const spec = adapter && adapter.getSpec && adapter.getSpec();
      // banner is default if not specified in spec
      const bidderMediaTypes = spec && spec.supportedMediaTypes || ['banner'];

      // check if the bidder's mediaTypes are not in the adUnit's mediaTypes
      const bidderEligible = adUnitMediaTypes.some(type => (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_16__.includes)(bidderMediaTypes, type));
      if (!bidderEligible) {
        // drop the bidder from the ad unit if it's not compatible
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logWarn)((0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.unsupportedBidderMessage)(adUnit, bidder));
        adUnit.bids = adUnit.bids.filter(bid => bid.bidder !== bidder);
      }
    });
  });
  if (!adUnits || adUnits.length === 0) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logMessage)('No adUnits configured. No bids requested.');
    auctionDone();
  } else {
    adUnits.forEach(au => {
      const tid = au.ortb2Imp?.ext?.tid || tids[au.code] || (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.generateUUID)();
      if (!tids.hasOwnProperty(au.code)) {
        tids[au.code] = tid;
      }
      au.transactionId = tid;
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_6__.dset)(au, 'ortb2Imp.ext.tid', tid);
    });
    const auction = _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__.auctionManager.createAuction({
      adUnits,
      adUnitCodes,
      callback: auctionDone,
      cbTimeout,
      labels,
      auctionId,
      ortb2Fragments,
      metrics
    });
    let adUnitsLen = adUnits.length;
    if (adUnitsLen > 15) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)(`Current auction ${auction.getAuctionId()} contains ${adUnitsLen} adUnits.`, adUnits);
    }
    adUnitCodes.forEach(code => _targeting_js__WEBPACK_IMPORTED_MODULE_10__.targeting.setLatestAuctionForAdUnit(code, auction.getAuctionId()));
    auction.callBids();
  }
}, 'startAuction');
function executeCallbacks(fn, reqBidsConfigObj) {
  runAll(_storageManager_js__WEBPACK_IMPORTED_MODULE_21__.storageCallbacks);
  runAll(enableAnalyticsCallbacks);
  fn.call(this, reqBidsConfigObj);
  function runAll(queue) {
    var queued;
    while (queued = queue.shift()) {
      queued();
    }
  }
}

// This hook will execute all storage callbacks which were registered before gdpr enforcement hook was added. Some bidders, user id modules use storage functions when module is parsed but gdpr enforcement hook is not added at that stage as setConfig callbacks are yet to be called. Hence for such calls we execute all the stored callbacks just before requestBids. At this hook point we will know for sure that tcfControl module is added or not
pbjsInstance.requestBids.before(executeCallbacks, 49);

/**
 *
 * Add adunit(s)
 * @param {Array|Object} adUnitArr Array of adUnits or single adUnit Object.
 * @alias module:pbjs.addAdUnits
 */
pbjsInstance.addAdUnits = function (adUnitArr) {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.addAdUnits", arguments);
  pbjsInstance.adUnits.push.apply(pbjsInstance.adUnits, (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.isArray)(adUnitArr) ? adUnitArr : [adUnitArr]);
  // emit event
  _events_js__WEBPACK_IMPORTED_MODULE_13__.emit(ADD_AD_UNITS);
};

/**
 * @param {string} event the name of the event
 * @param {Function} handler a callback to set on event
 * @param {string} id an identifier in the context of the event
 * @alias module:pbjs.onEvent
 *
 * This API call allows you to register a callback to handle a Prebid.js event.
 * An optional `id` parameter provides more finely-grained event callback registration.
 * This makes it possible to register callback events for a specific item in the
 * event context. For example, `bidWon` events will accept an `id` for ad unit code.
 * `bidWon` callbacks registered with an ad unit code id will be called when a bid
 * for that ad unit code wins the auction. Without an `id` this method registers the
 * callback for every `bidWon` event.
 *
 * Currently `bidWon` is the only event that accepts an `id` parameter.
 */
pbjsInstance.onEvent = function (event, handler, id) {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.onEvent", arguments);
  if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.isFn)(handler)) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('The event handler provided is not a function and was not set on event "' + event + '".');
    return;
  }
  if (id && !eventValidators[event].call(null, id)) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('The id provided is not valid for event "' + event + '" and no handler was set.');
    return;
  }
  _events_js__WEBPACK_IMPORTED_MODULE_13__.on(event, handler, id);
};

/**
 * @param {string} event the name of the event
 * @param {Function} handler a callback to remove from the event
 * @param {string} id an identifier in the context of the event (see `$$PREBID_GLOBAL$$.onEvent`)
 * @alias module:pbjs.offEvent
 */
pbjsInstance.offEvent = function (event, handler, id) {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.offEvent", arguments);
  if (id && !eventValidators[event].call(null, id)) {
    return;
  }
  _events_js__WEBPACK_IMPORTED_MODULE_13__.off(event, handler, id);
};

/**
 * Return a copy of all events emitted
 *
 * @alias module:pbjs.getEvents
 */
pbjsInstance.getEvents = function () {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.getEvents");
  return _events_js__WEBPACK_IMPORTED_MODULE_13__.getEvents();
};

/*
 * Wrapper to register bidderAdapter externally (adapterManager.registerBidAdapter())
 * @param  {Function} bidderAdaptor [description]
 * @param  {string} bidderCode [description]
 * @alias module:pbjs.registerBidAdapter
 */
pbjsInstance.registerBidAdapter = function (bidderAdaptor, bidderCode) {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.registerBidAdapter", arguments);
  try {
    _adapterManager_js__WEBPACK_IMPORTED_MODULE_20__["default"].registerBidAdapter(bidderAdaptor(), bidderCode);
  } catch (e) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('Error registering bidder adapter : ' + e.message);
  }
};

/**
 * Wrapper to register analyticsAdapter externally (adapterManager.registerAnalyticsAdapter())
 * @param  {Object} options [description]
 * @alias module:pbjs.registerAnalyticsAdapter
 */
pbjsInstance.registerAnalyticsAdapter = function (options) {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.registerAnalyticsAdapter", arguments);
  try {
    _adapterManager_js__WEBPACK_IMPORTED_MODULE_20__["default"].registerAnalyticsAdapter(options);
  } catch (e) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('Error registering analytics adapter : ' + e.message);
  }
};

/**
 * Wrapper to bidfactory.createBid()
 * @param  {string} statusCode [description]
 * @alias module:pbjs.createBid
 * @return {Object} bidResponse [description]
 */
pbjsInstance.createBid = function (statusCode) {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.createBid", arguments);
  return (0,_bidfactory_js__WEBPACK_IMPORTED_MODULE_22__.createBid)(statusCode);
};

/**
 * Enable sending analytics data to the analytics provider of your
 * choice.
 *
 * For usage, see [Integrate with the Prebid Analytics
 * API](http://prebid.org/dev-docs/integrate-with-the-prebid-analytics-api.html).
 *
 * For a list of analytics adapters, see [Analytics for
 * Prebid](http://prebid.org/overview/analytics.html).
 * @param  {Object} config
 * @param {string} config.provider The name of the provider, e.g., `"ga"` for Google Analytics.
 * @param {Object} config.options The options for this particular analytics adapter.  This will likely vary between adapters.
 * @alias module:pbjs.enableAnalytics
 */

// Stores 'enableAnalytics' callbacks for later execution.
const enableAnalyticsCallbacks = [];
const enableAnalyticsCb = (0,_hook_js__WEBPACK_IMPORTED_MODULE_9__.hook)('async', function (config) {
  if (config && !(0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.isEmpty)(config)) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.enableAnalytics for: ", config);
    _adapterManager_js__WEBPACK_IMPORTED_MODULE_20__["default"].enableAnalytics(config);
  } else {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)("pbjs.enableAnalytics should be called with option {}");
  }
}, 'enableAnalyticsCb');
pbjsInstance.enableAnalytics = function (config) {
  enableAnalyticsCallbacks.push(enableAnalyticsCb.bind(this, config));
};

/**
 * @alias module:pbjs.aliasBidder
 */
pbjsInstance.aliasBidder = function (bidderCode, alias, options) {
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logInfo)("Invoking pbjs.aliasBidder", arguments);
  if (bidderCode && alias) {
    _adapterManager_js__WEBPACK_IMPORTED_MODULE_20__["default"].aliasBidAdapter(bidderCode, alias, options);
  } else {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('bidderCode and alias must be passed as arguments', "pbjs.aliasBidder");
  }
};

/**
 * @alias module:pbjs.aliasRegistry
 */
pbjsInstance.aliasRegistry = _adapterManager_js__WEBPACK_IMPORTED_MODULE_20__["default"].aliasRegistry;
_config_js__WEBPACK_IMPORTED_MODULE_15__.config.getConfig('aliasRegistry', config => {
  if (config.aliasRegistry === 'private') delete pbjsInstance.aliasRegistry;
});

/**
 * The bid response object returned by an external bidder adapter during the auction.
 * @typedef {Object} AdapterBidResponse
 * @property {string} pbAg Auto granularity price bucket; CPM <= 5 ? increment = 0.05 : CPM > 5 && CPM <= 10 ? increment = 0.10 : CPM > 10 && CPM <= 20 ? increment = 0.50 : CPM > 20 ? priceCap = 20.00.  Example: `"0.80"`.
 * @property {string} pbCg Custom price bucket.  For example setup, see {@link setPriceGranularity}.  Example: `"0.84"`.
 * @property {string} pbDg Dense granularity price bucket; CPM <= 3 ? increment = 0.01 : CPM > 3 && CPM <= 8 ? increment = 0.05 : CPM > 8 && CPM <= 20 ? increment = 0.50 : CPM > 20? priceCap = 20.00.  Example: `"0.84"`.
 * @property {string} pbLg Low granularity price bucket; $0.50 increment, capped at $5, floored to two decimal places.  Example: `"0.50"`.
 * @property {string} pbMg Medium granularity price bucket; $0.10 increment, capped at $20, floored to two decimal places.  Example: `"0.80"`.
 * @property {string} pbHg High granularity price bucket; $0.01 increment, capped at $20, floored to two decimal places.  Example: `"0.84"`.
 *
 * @property {string} bidder The string name of the bidder.  This *may* be the same as the `bidderCode`.  For For a list of all bidders and their codes, see [Bidders' Params](http://prebid.org/dev-docs/bidders.html).
 * @property {string} bidderCode The unique string that identifies this bidder.  For a list of all bidders and their codes, see [Bidders' Params](http://prebid.org/dev-docs/bidders.html).
 *
 * @property {string} requestId The [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier) representing the bid request.
 * @property {number} requestTimestamp The time at which the bid request was sent out, expressed in milliseconds.
 * @property {number} responseTimestamp The time at which the bid response was received, expressed in milliseconds.
 * @property {number} timeToRespond How long it took for the bidder to respond with this bid, expressed in milliseconds.
 *
 * @property {string} size The size of the ad creative, expressed in `"AxB"` format, where A and B are numbers of pixels.  Example: `"320x50"`.
 * @property {string} width The width of the ad creative in pixels.  Example: `"320"`.
 * @property {string} height The height of the ad creative in pixels.  Example: `"50"`.
 *
 * @property {string} ad The actual ad creative content, often HTML with CSS, JavaScript, and/or links to additional content.  Example: `"<div id='beacon_-YQbipJtdxmMCgEPHExLhmqzEm' style='position: absolute; left: 0px; top: 0px; visibility: hidden;'><img src='http://aplus-...'/></div><iframe src=\"http://aax-us-east.amazon-adsystem.com/e/is/8dcfcd..." width=\"728\" height=\"90\" frameborder=\"0\" ...></iframe>",`.
 * @property {number} ad_id The ad ID of the creative, as understood by the bidder's system.  Used by the line item's [creative in the ad server](http://prebid.org/adops/send-all-bids-adops.html#step-3-add-a-creative).
 * @property {string} adUnitCode The code used to uniquely identify the ad unit on the publisher's page.
 *
 * @property {string} statusMessage The status of the bid.  Allowed values: `"Bid available"` or `"Bid returned empty or error response"`.
 * @property {number} cpm The exact bid price from the bidder, expressed to the thousandths place.  Example: `"0.849"`.
 *
 * @property {Object} adserverTargeting An object whose values represent the ad server's targeting on the bid.
 * @property {string} adserverTargeting.hb_adid The ad ID of the creative, as understood by the ad server.
 * @property {string} adserverTargeting.hb_pb The price paid to show the creative, as logged in the ad server.
 * @property {string} adserverTargeting.hb_bidder The winning bidder whose ad creative will be served by the ad server.
 */

/**
 * Get all of the bids that have been rendered.  Useful for [troubleshooting your integration](http://prebid.org/dev-docs/prebid-troubleshooting-guide.html).
 * @return {Array<AdapterBidResponse>} A list of bids that have been rendered.
 */
pbjsInstance.getAllWinningBids = function () {
  return _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__.auctionManager.getAllWinningBids();
};

/**
 * Get all of the bids that have won their respective auctions.
 * @return {Array<AdapterBidResponse>} A list of bids that have won their respective auctions.
 */
pbjsInstance.getAllPrebidWinningBids = function () {
  return _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__.auctionManager.getBidsReceived().filter(bid => bid.status === _constants_js__WEBPACK_IMPORTED_MODULE_2__.BID_STATUS.BID_TARGETING_SET);
};

/**
 * Get array of highest cpm bids for all adUnits, or highest cpm bid
 * object for the given adUnit
 * @param {string} adUnitCode - optional ad unit code
 * @alias module:pbjs.getHighestCpmBids
 * @return {Array} array containing highest cpm bid object(s)
 */
pbjsInstance.getHighestCpmBids = function (adUnitCode) {
  return _targeting_js__WEBPACK_IMPORTED_MODULE_10__.targeting.getWinningBids(adUnitCode);
};
pbjsInstance.clearAllAuctions = function () {
  _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__.auctionManager.clearAllAuctions();
};
if (true) {
  /**
   * Mark the winning bid as used, should only be used in conjunction with video
   * @typedef {Object} MarkBidRequest
   * @property {string} adUnitCode The ad unit code
   * @property {string} adId The id representing the ad we want to mark
   *
   * @alias module:pbjs.markWinningBidAsUsed
   */
  pbjsInstance.markWinningBidAsUsed = function (_ref3) {
    let {
      adId,
      adUnitCode,
      analytics = false
    } = _ref3;
    let bids;
    if (adUnitCode && adId == null) {
      bids = _targeting_js__WEBPACK_IMPORTED_MODULE_10__.targeting.getWinningBids(adUnitCode);
    } else if (adId) {
      bids = _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__.auctionManager.getBidsReceived().filter(bid => bid.adId === adId);
    } else {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logWarn)('Improper use of markWinningBidAsUsed. It needs an adUnitCode or an adId to function.');
    }
    if (bids.length > 0) {
      if (analytics) {
        (0,_adRendering_js__WEBPACK_IMPORTED_MODULE_14__.markWinningBid)(bids[0]);
      } else {
        _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__.auctionManager.addWinningBid(bids[0]);
      }
      (0,_adRendering_js__WEBPACK_IMPORTED_MODULE_14__.markBidAsRendered)(bids[0]);
    }
  };
}

/**
 * Get Prebid config options
 * @param {Object} options
 * @alias module:pbjs.getConfig
 */
pbjsInstance.getConfig = _config_js__WEBPACK_IMPORTED_MODULE_15__.config.getAnyConfig;
pbjsInstance.readConfig = _config_js__WEBPACK_IMPORTED_MODULE_15__.config.readAnyConfig;
pbjsInstance.mergeConfig = _config_js__WEBPACK_IMPORTED_MODULE_15__.config.mergeConfig;
pbjsInstance.mergeBidderConfig = _config_js__WEBPACK_IMPORTED_MODULE_15__.config.mergeBidderConfig;

/**
 * Set Prebid config options.
 * See https://docs.prebid.org/dev-docs/publisher-api-reference/setConfig.html
 *
 * @param {Object} options Global Prebid configuration object. Must be JSON - no JavaScript functions are allowed.
 */
pbjsInstance.setConfig = _config_js__WEBPACK_IMPORTED_MODULE_15__.config.setConfig;
pbjsInstance.setBidderConfig = _config_js__WEBPACK_IMPORTED_MODULE_15__.config.setBidderConfig;
pbjsInstance.que.push(() => (0,_secureCreatives_js__WEBPACK_IMPORTED_MODULE_23__.listenMessagesFromCreative)());

/**
 * This queue lets users load Prebid asynchronously, but run functions the same way regardless of whether it gets loaded
 * before or after their script executes. For example, given the code:
 *
 * <script src="url/to/Prebid.js" async></script>
 * <script>
 *   var pbjs = pbjs || {};
 *   pbjs.cmd = pbjs.cmd || [];
 *   pbjs.cmd.push(functionToExecuteOncePrebidLoads);
 * </script>
 *
 * If the page's script runs before prebid loads, then their function gets added to the queue, and executed
 * by prebid once it's done loading. If it runs after prebid loads, then this monkey-patch causes their
 * function to execute immediately.
 *
 * @memberof pbjs
 * @param  {function} command A function which takes no arguments. This is guaranteed to run exactly once, and only after
 *                            the Prebid script has been fully loaded.
 * @alias module:pbjs.cmd.push
 */
pbjsInstance.cmd.push = function (command) {
  if (typeof command === 'function') {
    try {
      command.call();
    } catch (e) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('Error processing command :', e.message, e.stack);
    }
  } else {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)("Commands written into pbjs.cmd.push must be wrapped in a function");
  }
};
pbjsInstance.que.push = pbjsInstance.cmd.push;
function processQueue(queue) {
  queue.forEach(function (cmd) {
    if (typeof cmd.called === 'undefined') {
      try {
        cmd.call();
        cmd.called = true;
      } catch (e) {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.logError)('Error processing command :', 'prebid.js', e);
      }
    }
  });
}

/**
 * @alias module:pbjs.processQueue
 */
pbjsInstance.processQueue = function () {
  (0,_adRendering_js__WEBPACK_IMPORTED_MODULE_14__.insertLocatorFrame)();
  _hook_js__WEBPACK_IMPORTED_MODULE_9__.hook.ready();
  processQueue(pbjsInstance.que);
  processQueue(pbjsInstance.cmd);
};

/**
 * @alias module:pbjs.triggerBilling
 */
pbjsInstance.triggerBilling = _ref4 => {
  let {
    adId,
    adUnitCode
  } = _ref4;
  _auctionManager_js__WEBPACK_IMPORTED_MODULE_5__.auctionManager.getAllWinningBids().filter(bid => bid.adId === adId || adId == null && bid.adUnitCode === adUnitCode).forEach(bid => {
    _adapterManager_js__WEBPACK_IMPORTED_MODULE_20__["default"].triggerBilling(bid);
    (0,_adRendering_js__WEBPACK_IMPORTED_MODULE_14__.renderIfDeferred)(bid);
  });
};
/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (pbjsInstance);

/***/ }),

/***/ "./src/prebidGlobal.js":
/*!*****************************!*\
  !*** ./src/prebidGlobal.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getGlobal: () => (/* binding */ getGlobal),
/* harmony export */   registerModule: () => (/* binding */ registerModule)
/* harmony export */ });
// if $$PREBID_GLOBAL$$ already exists in global document scope, use it, if not, create the object
// global defination should happen BEFORE imports to avoid global undefined errors.
/* global $$DEFINE_PREBID_GLOBAL$$ */
const scope =  false ? 0 : window;
const global = scope.pbjs = scope.pbjs || {};
global.cmd = global.cmd || [];
global.que = global.que || [];

// create a pbjs global pointer
if (scope === window) {
  scope._pbjsGlobals = scope._pbjsGlobals || [];
  scope._pbjsGlobals.push("pbjs");
}
function getGlobal() {
  return global;
}
function registerModule(name) {
  global.installedModules.push(name);
}

/***/ }),

/***/ "./src/refererDetection.js":
/*!*********************************!*\
  !*** ./src/refererDetection.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRefererInfo: () => (/* binding */ getRefererInfo),
/* harmony export */   parseDomain: () => (/* binding */ parseDomain)
/* harmony export */ });
/* unused harmony exports ensureProtocol, detectReferer, cacheWithLocation */
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/**
 * The referer detection module attempts to gather referer information from the current page that prebid.js resides in.
 * The information that it tries to collect includes:
 * The detected top url in the nav bar,
 * Whether it was able to reach the top most window (if for example it was embedded in several iframes),
 * The number of iframes it was embedded in if applicable (by default max ten iframes),
 * A list of the domains of each embedded window if applicable.
 * Canonical URL which refers to an HTML link element, with the attribute of rel="canonical", found in the <head> element of your webpage
 */




/**
 * Prepend a URL with the page's protocol (http/https), if necessary.
 */
function ensureProtocol(url) {
  let win = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window;
  if (!url) return url;
  if (/\w+:\/\//.exec(url)) {
    // url already has protocol
    return url;
  }
  let windowProto = win.location.protocol;
  try {
    windowProto = win.top.location.protocol;
  } catch (e) {}
  if (/^\/\//.exec(url)) {
    // url uses relative protocol ("//example.com")
    return windowProto + url;
  } else {
    return `${windowProto}//${url}`;
  }
}

/**
 * Extract the domain portion from a URL.
 * @param {string} url - The URL to extract the domain from.
 * @param {Object} options - Options for parsing the domain.
 * @param {boolean} options.noLeadingWww - If true, remove 'www.' appearing at the beginning of the domain.
 * @param {boolean} options.noPort - If true, do not include the ':[port]' portion.
 * @return {string|undefined} - The extracted domain or undefined if the URL is invalid.
 */
function parseDomain(url) {
  let {
    noLeadingWww = false,
    noPort = false
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  try {
    url = new URL(ensureProtocol(url));
  } catch (e) {
    return;
  }
  url = noPort ? url.hostname : url.host;
  if (noLeadingWww && url.startsWith('www.')) {
    url = url.substring(4);
  }
  return url;
}

/**
 * This function returns canonical URL which refers to an HTML link element, with the attribute of rel="canonical", found in the <head> element of your webpage
 *
 * @param {Object} doc document
 * @returns {string|null}
 */
function getCanonicalUrl(doc) {
  try {
    const element = doc.querySelector("link[rel='canonical']");
    if (element !== null) {
      return element.href;
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

/**
 * @param {Window} win Window
 * @returns {Function}
 */
function detectReferer(win) {
  /**
   * This function would return a read-only array of hostnames for all the parent frames.
   * win.location.ancestorOrigins is only supported in webkit browsers. For non-webkit browsers it will return undefined.
   *
   * @param {Window} win Window object
   * @returns {(undefined|Array)} Ancestor origins or undefined
   */
  function getAncestorOrigins(win) {
    try {
      if (!win.location.ancestorOrigins) {
        return;
      }
      return win.location.ancestorOrigins;
    } catch (e) {
      // Ignore error
    }
  }

  // TODO: the meaning of "reachedTop" seems to be intentionally ambiguous - best to leave them out of
  // the typedef for now. (for example, unit tests enforce that "reachedTop" should be false in some situations where we
  // happily provide a location for the top).

  /**
   * @typedef {Object} refererInfo
   * @property {string|null} location the browser's location, or null if not available (due to cross-origin restrictions)
   * @property {string|null} canonicalUrl the site's canonical URL as set by the publisher, through setConfig({pageUrl}) or <link rel="canonical" />
   * @property {string|null} page the best candidate for the current page URL: `canonicalUrl`, falling back to `location`
   * @property {string|null} domain the domain portion of `page`
   * @property {string|null} ref the referrer (document.referrer) to the current page, or null if not available (due to cross-origin restrictions)
   * @property {string} topmostLocation of the top-most frame for which we could guess the location. Outside of cross-origin scenarios, this is equivalent to `location`.
   * @property {number} numIframes number of steps between window.self and window.top
   * @property {Array<string|null>} stack our best guess at the location for each frame, in the direction top -> self.
   */

  /**
   * Walk up the windows to get the origin stack and best available referrer, canonical URL, etc.
   *
   * @returns {refererInfo} An object containing referer information.
   */
  function refererInfo() {
    const stack = [];
    const ancestors = getAncestorOrigins(win);
    const maxNestedIframes = _config_js__WEBPACK_IMPORTED_MODULE_0__.config.getConfig('maxNestedIframes');
    let currentWindow;
    let bestLocation;
    let bestCanonicalUrl;
    let reachedTop = false;
    let level = 0;
    let valuesFromAmp = false;
    let inAmpFrame = false;
    let hasTopLocation = false;
    do {
      const previousWindow = currentWindow;
      const wasInAmpFrame = inAmpFrame;
      let currentLocation;
      let crossOrigin = false;
      let foundLocation = null;
      inAmpFrame = false;
      currentWindow = currentWindow ? currentWindow.parent : win;
      try {
        currentLocation = currentWindow.location.href || null;
      } catch (e) {
        crossOrigin = true;
      }
      if (crossOrigin) {
        if (wasInAmpFrame) {
          const context = previousWindow.context;
          try {
            foundLocation = context.sourceUrl;
            bestLocation = foundLocation;
            hasTopLocation = true;
            valuesFromAmp = true;
            if (currentWindow === win.top) {
              reachedTop = true;
            }
            if (context.canonicalUrl) {
              bestCanonicalUrl = context.canonicalUrl;
            }
          } catch (e) {/* Do nothing */}
        } else {
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)('Trying to access cross domain iframe. Continuing without referrer and location');
          try {
            // the referrer to an iframe is the parent window
            const referrer = previousWindow.document.referrer;
            if (referrer) {
              foundLocation = referrer;
              if (currentWindow === win.top) {
                reachedTop = true;
              }
            }
          } catch (e) {/* Do nothing */}
          if (!foundLocation && ancestors && ancestors[level - 1]) {
            foundLocation = ancestors[level - 1];
            if (currentWindow === win.top) {
              hasTopLocation = true;
            }
          }
          if (foundLocation && !valuesFromAmp) {
            bestLocation = foundLocation;
          }
        }
      } else {
        if (currentLocation) {
          foundLocation = currentLocation;
          bestLocation = foundLocation;
          valuesFromAmp = false;
          if (currentWindow === win.top) {
            reachedTop = true;
            const canonicalUrl = getCanonicalUrl(currentWindow.document);
            if (canonicalUrl) {
              bestCanonicalUrl = canonicalUrl;
            }
          }
        }
        if (currentWindow.context && currentWindow.context.sourceUrl) {
          inAmpFrame = true;
        }
      }
      stack.push(foundLocation);
      level++;
    } while (currentWindow !== win.top && level < maxNestedIframes);
    stack.reverse();
    let ref;
    try {
      ref = win.top.document.referrer;
    } catch (e) {}
    const location = reachedTop || hasTopLocation ? bestLocation : null;
    const canonicalUrl = _config_js__WEBPACK_IMPORTED_MODULE_0__.config.getConfig('pageUrl') || bestCanonicalUrl || null;
    let page = _config_js__WEBPACK_IMPORTED_MODULE_0__.config.getConfig('pageUrl') || location || ensureProtocol(canonicalUrl, win);
    if (location && location.indexOf('?') > -1 && page.indexOf('?') === -1) {
      page = `${page}${location.substring(location.indexOf('?'))}`;
    }
    return {
      reachedTop,
      isAmp: valuesFromAmp,
      numIframes: level - 1,
      stack,
      topmostLocation: bestLocation || null,
      location,
      canonicalUrl,
      page,
      domain: parseDomain(page) || null,
      ref: ref || null,
      // TODO: the "legacy" refererInfo object is provided here, for now, to accomodate
      // adapters that decided to just send it verbatim to their backend.
      legacy: {
        reachedTop,
        isAmp: valuesFromAmp,
        numIframes: level - 1,
        stack,
        referer: bestLocation || null,
        canonicalUrl
      }
    };
  }
  return refererInfo;
}

// cache result of fn (= referer info) as long as:
// - we are the top window
// - canonical URL tag and window location have not changed
function cacheWithLocation(fn) {
  let win = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window;
  if (win.top !== win) return fn;
  let canonical, href, value;
  return function () {
    const newCanonical = getCanonicalUrl(win.document);
    const newHref = win.location.href;
    if (canonical !== newCanonical || newHref !== href) {
      canonical = newCanonical;
      href = newHref;
      value = fn();
    }
    return value;
  };
}

/**
 * @type {function(): refererInfo}
 */
const getRefererInfo = cacheWithLocation(detectReferer(window));

/***/ }),

/***/ "./src/secureCreatives.js":
/*!********************************!*\
  !*** ./src/secureCreatives.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   listenMessagesFromCreative: () => (/* binding */ listenMessagesFromCreative)
/* harmony export */ });
/* unused harmony exports getReplier, receiveMessage, resizeRemoteCreative */
/* harmony import */ var _native_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./native.js */ "./src/native.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants.js */ "./src/constants.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _polyfill_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _adRendering_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./adRendering.js */ "./src/adRendering.js");
/* harmony import */ var _creativeRenderers_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./creativeRenderers.js */ "./src/creativeRenderers.js");
/* Secure Creatives
  Provides support for rendering creatives into cross domain iframes such as SafeFrame to prevent
   access to a publisher page from creative payloads.
 */







const {
  REQUEST,
  RESPONSE,
  NATIVE,
  EVENT
} = _constants_js__WEBPACK_IMPORTED_MODULE_0__.MESSAGES;
const HANDLER_MAP = {
  [REQUEST]: handleRenderRequest,
  [EVENT]: handleEventRequest
};
if (true) {
  Object.assign(HANDLER_MAP, {
    [NATIVE]: handleNativeRequest
  });
}
function listenMessagesFromCreative() {
  window.addEventListener('message', function (ev) {
    receiveMessage(ev);
  }, false);
}
function getReplier(ev) {
  if (ev.origin == null && ev.ports.length === 0) {
    return function () {
      const msg = 'Cannot post message to a frame with null origin. Please update creatives to use MessageChannel, see https://github.com/prebid/Prebid.js/issues/7870';
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logError)(msg);
      throw new Error(msg);
    };
  } else if (ev.ports.length > 0) {
    return function (message) {
      ev.ports[0].postMessage(JSON.stringify(message));
    };
  } else {
    return function (message) {
      ev.source.postMessage(JSON.stringify(message), ev.origin);
    };
  }
}
function ensureAdId(adId, reply) {
  return function (data) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    return reply(Object.assign({}, data, {
      adId
    }), ...args);
  };
}
function receiveMessage(ev) {
  var key = ev.message ? 'message' : 'data';
  var data = {};
  try {
    data = JSON.parse(ev[key]);
  } catch (e) {
    return;
  }
  if (data && data.adId && data.message && HANDLER_MAP.hasOwnProperty(data.message)) {
    return (0,_adRendering_js__WEBPACK_IMPORTED_MODULE_2__.getBidToRender)(data.adId, data.message === _constants_js__WEBPACK_IMPORTED_MODULE_0__.MESSAGES.REQUEST).then(adObject => {
      HANDLER_MAP[data.message](ensureAdId(data.adId, getReplier(ev)), data, adObject);
    });
  }
}
function getResizer(adId, bidResponse) {
  // in some situations adId !== bidResponse.adId
  // the first is the one that was requested and is tied to the element
  // the second is the one that is being rendered (sometimes different, e.g. in some paapi setups)
  return function (width, height) {
    resizeRemoteCreative({
      ...bidResponse,
      width,
      height,
      adId
    });
  };
}
function handleRenderRequest(reply, message, bidResponse) {
  (0,_adRendering_js__WEBPACK_IMPORTED_MODULE_2__.handleRender)({
    renderFn(adData) {
      reply(Object.assign({
        message: RESPONSE,
        renderer: (0,_creativeRenderers_js__WEBPACK_IMPORTED_MODULE_3__.getCreativeRendererSource)(bidResponse)
      }, adData));
    },
    resizeFn: getResizer(message.adId, bidResponse),
    options: message.options,
    adId: message.adId,
    bidResponse
  });
}
function handleNativeRequest(reply, data, adObject) {
  // handle this script from native template in an ad server
  // window.parent.postMessage(JSON.stringify({
  //   message: 'Prebid Native',
  //   adId: '%%PATTERN:hb_adid%%'
  // }), '*');
  if (adObject == null) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logError)(`Cannot find ad for x-origin event request: '${data.adId}'`);
    return;
  }
  switch (data.action) {
    case 'assetRequest':
      (0,_adRendering_js__WEBPACK_IMPORTED_MODULE_2__.deferRendering)(adObject, () => reply((0,_native_js__WEBPACK_IMPORTED_MODULE_4__.getAssetMessage)(data, adObject)));
      break;
    case 'allAssetRequest':
      (0,_adRendering_js__WEBPACK_IMPORTED_MODULE_2__.deferRendering)(adObject, () => reply((0,_native_js__WEBPACK_IMPORTED_MODULE_4__.getAllAssetsMessage)(data, adObject)));
      break;
    default:
      (0,_adRendering_js__WEBPACK_IMPORTED_MODULE_2__.handleNativeMessage)(data, adObject, {
        resizeFn: getResizer(data.adId, adObject)
      });
      (0,_adRendering_js__WEBPACK_IMPORTED_MODULE_2__.markWinner)(adObject);
  }
}
function handleEventRequest(reply, data, adObject) {
  if (adObject == null) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logError)(`Cannot find ad '${data.adId}' for x-origin event request`);
    return;
  }
  if (adObject.status !== _constants_js__WEBPACK_IMPORTED_MODULE_0__.BID_STATUS.RENDERED) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`Received x-origin event request without corresponding render request for ad '${adObject.adId}'`);
    return;
  }
  return (0,_adRendering_js__WEBPACK_IMPORTED_MODULE_2__.handleCreativeEvent)(data, adObject);
}
function resizeRemoteCreative(_ref) {
  let {
    adId,
    adUnitCode,
    width,
    height
  } = _ref;
  function getDimension(value) {
    return value ? value + 'px' : '100%';
  }
  // resize both container div + iframe
  ['div', 'iframe'].forEach(elmType => {
    // not select element that gets removed after dfp render
    let element = getElementByAdUnit(elmType + ':not([style*="display: none"])');
    if (element) {
      let elementStyle = element.style;
      elementStyle.width = getDimension(width);
      elementStyle.height = getDimension(height);
    } else {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logError)(`Unable to locate matching page element for adUnitCode ${adUnitCode}.  Can't resize it to ad's dimensions.  Please review setup.`);
    }
  });
  function getElementByAdUnit(elmType) {
    let id = getElementIdBasedOnAdServer(adId, adUnitCode);
    let parentDivEle = document.getElementById(id);
    return parentDivEle && parentDivEle.querySelector(elmType);
  }
  function getElementIdBasedOnAdServer(adId, adUnitCode) {
    if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.isGptPubadsDefined)()) {
      return getDfpElementId(adId);
    } else if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.isApnGetTagDefined)()) {
      return getAstElementId(adUnitCode);
    } else {
      return adUnitCode;
    }
  }
  function getDfpElementId(adId) {
    const slot = (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_5__.find)(window.googletag.pubads().getSlots(), slot => {
      return (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_5__.find)(slot.getTargetingKeys(), key => {
        return (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_5__.includes)(slot.getTargeting(key), adId);
      });
    });
    return slot ? slot.getSlotElementId() : null;
  }
  function getAstElementId(adUnitCode) {
    let astTag = window.apntag.getTag(adUnitCode);
    return astTag && astTag.targetId;
  }
}

/***/ }),

/***/ "./src/storageManager.js":
/*!*******************************!*\
  !*** ./src/storageManager.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getCoreStorageManager: () => (/* binding */ getCoreStorageManager),
/* harmony export */   getStorageManager: () => (/* binding */ getStorageManager),
/* harmony export */   storageCallbacks: () => (/* binding */ storageCallbacks)
/* harmony export */ });
/* unused harmony exports STORAGE_TYPE_LOCALSTORAGE, STORAGE_TYPE_COOKIES, newStorageManager, deviceAccessRule, storageAllowedRule, resetData */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _bidderSettings_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./bidderSettings.js */ "./src/bidderSettings.js");
/* harmony import */ var _activities_modules_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./activities/modules.js */ "./src/activities/modules.js");
/* harmony import */ var _activities_rules_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./activities/rules.js */ "./src/activities/rules.js");
/* harmony import */ var _activities_params_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./activities/params.js */ "./src/activities/params.js");
/* harmony import */ var _activities_activities_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./activities/activities.js */ "./src/activities/activities.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var _adapterManager_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./adapterManager.js */ "./src/adapterManager.js");
/* harmony import */ var _activities_activityParams_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./activities/activityParams.js */ "./src/activities/activityParams.js");









const STORAGE_TYPE_LOCALSTORAGE = 'html5';
const STORAGE_TYPE_COOKIES = 'cookie';
let storageCallbacks = [];

/* eslint-disable prebid/no-global */

/*
 *  Storage manager constructor. Consumers should prefer one of `getStorageManager` or `getCoreStorageManager`.
 */
function newStorageManager() {
  let {
    moduleName,
    moduleType
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  let {
    isAllowed = _activities_rules_js__WEBPACK_IMPORTED_MODULE_0__.isActivityAllowed
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  function isValid(cb, storageType) {
    let mod = moduleName;
    const curBidder = _config_js__WEBPACK_IMPORTED_MODULE_1__.config.getCurrentBidder();
    if (curBidder && moduleType === _activities_modules_js__WEBPACK_IMPORTED_MODULE_2__.MODULE_TYPE_BIDDER && _adapterManager_js__WEBPACK_IMPORTED_MODULE_3__["default"].aliasRegistry[curBidder] === moduleName) {
      mod = curBidder;
    }
    const result = {
      valid: isAllowed(_activities_activities_js__WEBPACK_IMPORTED_MODULE_4__.ACTIVITY_ACCESS_DEVICE, (0,_activities_activityParams_js__WEBPACK_IMPORTED_MODULE_5__.activityParams)(moduleType, mod, {
        [_activities_params_js__WEBPACK_IMPORTED_MODULE_6__.ACTIVITY_PARAM_STORAGE_TYPE]: storageType
      }))
    };
    return cb(result);
  }
  function schedule(operation, storageType, done) {
    if (done && typeof done === 'function') {
      storageCallbacks.push(function () {
        let result = isValid(operation, storageType);
        done(result);
      });
    } else {
      return isValid(operation, storageType);
    }
  }

  /**
   * @param {string} key
   * @param {string} value
   * @param {string} [expires='']
   * @param {string} [sameSite='/']
   * @param {string} [domain] domain (e.g., 'example.com' or 'subdomain.example.com').
   * If not specified, defaults to the host portion of the current document location.
   * If a domain is specified, subdomains are always included.
   * Domain must match the domain of the JavaScript origin. Setting cookies to foreign domains will be silently ignored.
   * @param {function} [done]
   */
  const setCookie = function (key, value, expires, sameSite, domain, done) {
    let cb = function (result) {
      if (result && result.valid) {
        const domainPortion = domain && domain !== '' ? ` ;domain=${encodeURIComponent(domain)}` : '';
        const expiresPortion = expires && expires !== '' ? ` ;expires=${expires}` : '';
        const isNone = sameSite != null && sameSite.toLowerCase() == 'none';
        const secure = isNone ? '; Secure' : '';
        // eslint-disable-next-line prebid/no-member
        document.cookie = `${key}=${encodeURIComponent(value)}${expiresPortion}; path=/${domainPortion}${sameSite ? `; SameSite=${sameSite}` : ''}${secure}`;
      }
    };
    return schedule(cb, STORAGE_TYPE_COOKIES, done);
  };

  /**
   * @param {string} name
   * @param {function} [done]
   * @returns {(string|null)}
   */
  const getCookie = function (name, done) {
    let cb = function (result) {
      if (result && result.valid) {
        let m = window.document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]*)\\s*(;|$)');
        return m ? decodeURIComponent(m[2]) : null;
      }
      return null;
    };
    return schedule(cb, STORAGE_TYPE_COOKIES, done);
  };

  /**
   * @param {function} [done]
   * @returns {boolean}
   */
  const cookiesAreEnabled = function (done) {
    let cb = function (result) {
      if (result && result.valid) {
        return (0,_utils_js__WEBPACK_IMPORTED_MODULE_7__.checkCookieSupport)();
      }
      return false;
    };
    return schedule(cb, STORAGE_TYPE_COOKIES, done);
  };
  function storageMethods(name) {
    const capName = name.charAt(0).toUpperCase() + name.substring(1);
    const backend = () => window[name];
    const hasStorage = function (done) {
      let cb = function (result) {
        if (result && result.valid) {
          try {
            return !!backend();
          } catch (e) {
            (0,_utils_js__WEBPACK_IMPORTED_MODULE_7__.logError)(`${name} api disabled`);
          }
        }
        return false;
      };
      return schedule(cb, STORAGE_TYPE_LOCALSTORAGE, done);
    };
    return {
      [`has${capName}`]: hasStorage,
      [`${name}IsEnabled`](done) {
        let cb = function (result) {
          if (result && result.valid) {
            try {
              backend().setItem('prebid.cookieTest', '1');
              return backend().getItem('prebid.cookieTest') === '1';
            } catch (error) {} finally {
              try {
                backend().removeItem('prebid.cookieTest');
              } catch (error) {}
            }
          }
          return false;
        };
        return schedule(cb, STORAGE_TYPE_LOCALSTORAGE, done);
      },
      [`setDataIn${capName}`](key, value, done) {
        let cb = function (result) {
          if (result && result.valid && hasStorage()) {
            backend().setItem(key, value);
          }
        };
        return schedule(cb, STORAGE_TYPE_LOCALSTORAGE, done);
      },
      [`getDataFrom${capName}`](key, done) {
        let cb = function (result) {
          if (result && result.valid && hasStorage()) {
            return backend().getItem(key);
          }
          return null;
        };
        return schedule(cb, STORAGE_TYPE_LOCALSTORAGE, done);
      },
      [`removeDataFrom${capName}`](key, done) {
        let cb = function (result) {
          if (result && result.valid && hasStorage()) {
            backend().removeItem(key);
          }
        };
        return schedule(cb, STORAGE_TYPE_LOCALSTORAGE, done);
      }
    };
  }

  /**
   * Returns all cookie values from the jar whose names contain the `keyLike`
   * Needs to exist in `utils.js` as it follows the StorageHandler interface defined in live-connect-js. If that module were to be removed, this function can go as well.
   * @param {string} keyLike
   * @param {function} [done]
   * @returns {string[]}
   */
  const findSimilarCookies = function (keyLike, done) {
    let cb = function (result) {
      if (result && result.valid) {
        const all = [];
        if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_7__.hasDeviceAccess)()) {
          // eslint-disable-next-line prebid/no-member
          const cookies = document.cookie.split(';');
          while (cookies.length) {
            const cookie = cookies.pop();
            let separatorIndex = cookie.indexOf('=');
            separatorIndex = separatorIndex < 0 ? cookie.length : separatorIndex;
            const cookieName = decodeURIComponent(cookie.slice(0, separatorIndex).replace(/^\s+/, ''));
            if (cookieName.indexOf(keyLike) >= 0) {
              all.push(decodeURIComponent(cookie.slice(separatorIndex + 1)));
            }
          }
        }
        return all;
      }
    };
    return schedule(cb, STORAGE_TYPE_COOKIES, done);
  };
  return {
    setCookie,
    getCookie,
    cookiesAreEnabled,
    ...storageMethods('localStorage'),
    ...storageMethods('sessionStorage'),
    findSimilarCookies
  };
}

/**
 * Get a storage manager for a particular module.
 *
 * Either bidderCode or a combination of moduleType + moduleName must be provided. The former is a shorthand
 *  for `{moduleType: 'bidder', moduleName: bidderCode}`.
 *
 */
function getStorageManager() {
  let {
    moduleType,
    moduleName,
    bidderCode
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  function err() {
    throw new Error(`Invalid invocation for getStorageManager: must set either bidderCode, or moduleType + moduleName`);
  }
  if (bidderCode) {
    if (moduleType && moduleType !== _activities_modules_js__WEBPACK_IMPORTED_MODULE_2__.MODULE_TYPE_BIDDER || moduleName) err();
    moduleType = _activities_modules_js__WEBPACK_IMPORTED_MODULE_2__.MODULE_TYPE_BIDDER;
    moduleName = bidderCode;
  } else if (!moduleName || !moduleType) {
    err();
  }
  return newStorageManager({
    moduleType,
    moduleName
  });
}

/**
 * Get a storage manager for "core" (vendorless, or first-party) modules. Shorthand for `getStorageManager({moduleName, moduleType: 'core'})`.
 *
 * @param {string} moduleName Module name
 */
function getCoreStorageManager(moduleName) {
  return newStorageManager({
    moduleName: moduleName,
    moduleType: _activities_modules_js__WEBPACK_IMPORTED_MODULE_2__.MODULE_TYPE_PREBID
  });
}

/**
 * Block all access to storage when deviceAccess = false
 */
function deviceAccessRule() {
  if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_7__.hasDeviceAccess)()) {
    return {
      allow: false
    };
  }
}
(0,_activities_rules_js__WEBPACK_IMPORTED_MODULE_0__.registerActivityControl)(_activities_activities_js__WEBPACK_IMPORTED_MODULE_4__.ACTIVITY_ACCESS_DEVICE, 'deviceAccess config', deviceAccessRule);

/**
 * By default, deny bidders accessDevice unless they enable it through bidderSettings
 *
 * // TODO: for backwards compat, the check is done on the adapter - rather than bidder's code.
 */
function storageAllowedRule(params) {
  let bs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _bidderSettings_js__WEBPACK_IMPORTED_MODULE_8__.bidderSettings;
  if (params[_activities_params_js__WEBPACK_IMPORTED_MODULE_6__.ACTIVITY_PARAM_COMPONENT_TYPE] !== _activities_modules_js__WEBPACK_IMPORTED_MODULE_2__.MODULE_TYPE_BIDDER) return;
  let allow = bs.get(params[_activities_params_js__WEBPACK_IMPORTED_MODULE_6__.ACTIVITY_PARAM_ADAPTER_CODE], 'storageAllowed');
  if (!allow || allow === true) {
    allow = !!allow;
  } else {
    const storageType = params[_activities_params_js__WEBPACK_IMPORTED_MODULE_6__.ACTIVITY_PARAM_STORAGE_TYPE];
    allow = Array.isArray(allow) ? allow.some(e => e === storageType) : allow === storageType;
  }
  if (!allow) {
    return {
      allow
    };
  }
}
(0,_activities_rules_js__WEBPACK_IMPORTED_MODULE_0__.registerActivityControl)(_activities_activities_js__WEBPACK_IMPORTED_MODULE_4__.ACTIVITY_ACCESS_DEVICE, 'bidderSettings.*.storageAllowed', storageAllowedRule);
function resetData() {
  storageCallbacks = [];
}

/***/ }),

/***/ "./src/targeting.js":
/*!**************************!*\
  !*** ./src/targeting.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isBidUsable: () => (/* binding */ isBidUsable),
/* harmony export */   targeting: () => (/* binding */ targeting)
/* harmony export */ });
/* unused harmony exports TARGETING_KEYS_ARR, filters, getHighestCpmBidsFromBidPool, sortByDealAndPriceBucketOrCpm, getGPTSlotsForAdUnits, newTargeting */
/* harmony import */ var _auctionManager_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./auctionManager.js */ "./src/auctionManager.js");
/* harmony import */ var _bidTTL_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./bidTTL.js */ "./src/bidTTL.js");
/* harmony import */ var _bidderSettings_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./bidderSettings.js */ "./src/bidderSettings.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants.js */ "./src/constants.js");
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./events.js */ "./src/events.js");
/* harmony import */ var _hook_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./hook.js */ "./src/hook.js");
/* harmony import */ var _mediaTypes_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./mediaTypes.js */ "./src/mediaTypes.js");
/* harmony import */ var _native_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./native.js */ "./src/native.js");
/* harmony import */ var _polyfill_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./utils.js */ "./node_modules/dlv/index.js");
/* harmony import */ var _utils_reducers_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./utils/reducers.js */ "./src/utils/reducers.js");












var pbTargetingKeys = [];
const MAX_DFP_KEYLENGTH = 20;
const CFG_ALLOW_TARGETING_KEYS = `targetingControls.allowTargetingKeys`;
const CFG_ADD_TARGETING_KEYS = `targetingControls.addTargetingKeys`;
const TARGETING_KEY_CONFIGURATION_ERROR_MSG = `Only one of "${CFG_ALLOW_TARGETING_KEYS}" or "${CFG_ADD_TARGETING_KEYS}" can be set`;
const TARGETING_KEYS_ARR = Object.keys(_constants_js__WEBPACK_IMPORTED_MODULE_0__.TARGETING_KEYS).map(key => _constants_js__WEBPACK_IMPORTED_MODULE_0__.TARGETING_KEYS[key]);

// return unexpired bids
const isBidNotExpired = bid => bid.responseTimestamp + (0,_bidTTL_js__WEBPACK_IMPORTED_MODULE_1__.getTTL)(bid) * 1000 > (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.timestamp)();

// return bids whose status is not set. Winning bids can only have a status of `rendered`.
const isUnusedBid = bid => bid && (bid.status && !(0,_polyfill_js__WEBPACK_IMPORTED_MODULE_3__.includes)([_constants_js__WEBPACK_IMPORTED_MODULE_0__.BID_STATUS.RENDERED], bid.status) || !bid.status);
let filters = {
  isActualBid(bid) {
    return bid.getStatusCode() === _constants_js__WEBPACK_IMPORTED_MODULE_0__.STATUS.GOOD;
  },
  isBidNotExpired,
  isUnusedBid
};
function isBidUsable(bid) {
  return !Object.values(filters).some(predicate => !predicate(bid));
}

// If two bids are found for same adUnitCode, we will use the highest one to take part in auction
// This can happen in case of concurrent auctions
// If adUnitBidLimit is set above 0 return top N number of bids
const getHighestCpmBidsFromBidPool = (0,_hook_js__WEBPACK_IMPORTED_MODULE_4__.hook)('sync', function (bidsReceived, winReducer) {
  let adUnitBidLimit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  let hasModified = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  let winSorter = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : _utils_js__WEBPACK_IMPORTED_MODULE_2__.sortByHighestCpm;
  if (!hasModified) {
    const bids = [];
    const dealPrioritization = _config_js__WEBPACK_IMPORTED_MODULE_5__.config.getConfig('sendBidsControl.dealPrioritization');
    // bucket by adUnitcode
    let buckets = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.groupBy)(bidsReceived, 'adUnitCode');
    // filter top bid for each bucket by bidder
    Object.keys(buckets).forEach(bucketKey => {
      let bucketBids = [];
      let bidsByBidder = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.groupBy)(buckets[bucketKey], 'bidderCode');
      Object.keys(bidsByBidder).forEach(key => {
        bucketBids.push(bidsByBidder[key].reduce(winReducer));
      });
      // if adUnitBidLimit is set, pass top N number bids
      if (adUnitBidLimit) {
        bucketBids = dealPrioritization ? bucketBids.sort(sortByDealAndPriceBucketOrCpm(true)) : bucketBids.sort((a, b) => b.cpm - a.cpm);
        bids.push(...bucketBids.slice(0, adUnitBidLimit));
      } else {
        bucketBids = bucketBids.sort(winSorter);
        bids.push(...bucketBids);
      }
    });
    return bids;
  }
  return bidsReceived;
});

/**
 * A descending sort function that will sort the list of objects based on the following two dimensions:
 *  - bids with a deal are sorted before bids w/o a deal
 *  - then sort bids in each grouping based on the hb_pb value
 * eg: the following list of bids would be sorted like:
 *  [{
 *    "hb_adid": "vwx",
 *    "hb_pb": "28",
 *    "hb_deal": "7747"
 *  }, {
 *    "hb_adid": "jkl",
 *    "hb_pb": "10",
 *    "hb_deal": "9234"
 *  }, {
 *    "hb_adid": "stu",
 *    "hb_pb": "50"
 *  }, {
 *    "hb_adid": "def",
 *    "hb_pb": "2"
 *  }]
 */
function sortByDealAndPriceBucketOrCpm() {
  let useCpm = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  return function (a, b) {
    if (a.adserverTargeting.hb_deal !== undefined && b.adserverTargeting.hb_deal === undefined) {
      return -1;
    }
    if (a.adserverTargeting.hb_deal === undefined && b.adserverTargeting.hb_deal !== undefined) {
      return 1;
    }

    // assuming both values either have a deal or don't have a deal - sort by the hb_pb param
    if (useCpm) {
      return b.cpm - a.cpm;
    }
    return b.adserverTargeting.hb_pb - a.adserverTargeting.hb_pb;
  };
}

/**
 * Return a map where each code in `adUnitCodes` maps to a list of GPT slots that match it.
 *
 * @param {Array<String>} adUnitCodes
 * @param customSlotMatching
 * @param getSlots
 * @return {Object.<string,any>}
 */
function getGPTSlotsForAdUnits(adUnitCodes, customSlotMatching) {
  let getSlots = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : () => window.googletag.pubads().getSlots();
  return getSlots().reduce((auToSlots, slot) => {
    const customMatch = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isFn)(customSlotMatching) && customSlotMatching(slot);
    Object.keys(auToSlots).filter((0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isFn)(customMatch) ? customMatch : (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isAdUnitCodeMatchingSlot)(slot)).forEach(au => auToSlots[au].push(slot));
    return auToSlots;
  }, Object.fromEntries(adUnitCodes.map(au => [au, []])));
}

/**
 * Clears targeting for bids
 */
function clearTargeting(slot) {
  pbTargetingKeys.forEach(key => {
    if (slot.getTargeting(key)) {
      slot.clearTargeting(key);
    }
  });
}

/**
 * @typedef {Object.<string,string>} targeting
 * @property {string} targeting_key
 */

/**
 * @typedef {Object.<string,Object.<string,string[]>[]>[]} targetingArray
 */

function newTargeting(auctionManager) {
  let targeting = {};
  let latestAuctionForAdUnit = {};
  targeting.setLatestAuctionForAdUnit = function (adUnitCode, auctionId) {
    latestAuctionForAdUnit[adUnitCode] = auctionId;
  };
  targeting.resetPresetTargeting = function (adUnitCode, customSlotMatching) {
    if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isGptPubadsDefined)()) {
      const adUnitCodes = getAdUnitCodes(adUnitCode);
      Object.values(getGPTSlotsForAdUnits(adUnitCodes, customSlotMatching)).forEach(slots => {
        slots.forEach(slot => {
          clearTargeting(slot);
        });
      });
    }
  };
  targeting.resetPresetTargetingAST = function (adUnitCode) {
    const adUnitCodes = getAdUnitCodes(adUnitCode);
    adUnitCodes.forEach(function (unit) {
      const astTag = window.apntag.getTag(unit);
      if (astTag && astTag.keywords) {
        const currentKeywords = Object.keys(astTag.keywords);
        const newKeywords = {};
        currentKeywords.forEach(key => {
          if (!(0,_polyfill_js__WEBPACK_IMPORTED_MODULE_3__.includes)(pbTargetingKeys, key.toLowerCase())) {
            newKeywords[key] = astTag.keywords[key];
          }
        });
        window.apntag.modifyTag(unit, {
          keywords: newKeywords
        });
      }
    });
  };
  function addBidToTargeting(bids) {
    let bidderLevelTargetingEnabled = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let deals = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    if (!bidderLevelTargetingEnabled) return [];
    const standardKeys =  true ? TARGETING_KEYS_ARR.concat(_native_js__WEBPACK_IMPORTED_MODULE_6__.NATIVE_TARGETING_KEYS) : 0;
    const allowSendAllBidsTargetingKeys = _config_js__WEBPACK_IMPORTED_MODULE_5__.config.getConfig('targetingControls.allowSendAllBidsTargetingKeys');
    const allowedSendAllBidTargeting = allowSendAllBidsTargetingKeys ? allowSendAllBidsTargetingKeys.map(key => _constants_js__WEBPACK_IMPORTED_MODULE_0__.TARGETING_KEYS[key]) : standardKeys;
    return bids.reduce((result, bid) => {
      if (!deals || bid.dealId) {
        const targetingValue = getTargetingMap(bid, standardKeys.filter(key => typeof bid.adserverTargeting[key] !== 'undefined' && (deals || allowedSendAllBidTargeting.indexOf(key) !== -1)));
        if (targetingValue) {
          result.push({
            [bid.adUnitCode]: targetingValue
          });
        }
      }
      return result;
    }, []);
  }
  function getBidderTargeting(bids) {
    const alwaysIncludeDeals = _config_js__WEBPACK_IMPORTED_MODULE_5__.config.getConfig('targetingControls.alwaysIncludeDeals');
    const bidderLevelTargetingEnabled = _config_js__WEBPACK_IMPORTED_MODULE_5__.config.getConfig('enableSendAllBids') || alwaysIncludeDeals;
    return addBidToTargeting(bids, bidderLevelTargetingEnabled, alwaysIncludeDeals);
  }

  /**
   * Returns filtered ad server targeting for custom and allowed keys.
   * @param {targetingArray} targeting
   * @param {string[]} allowedKeys
   * @return {targetingArray} filtered targeting
   */
  function getAllowedTargetingKeyValues(targeting, allowedKeys) {
    const defaultKeyring = Object.assign({}, _constants_js__WEBPACK_IMPORTED_MODULE_0__.TARGETING_KEYS, _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_KEYS);
    const defaultKeys = Object.keys(defaultKeyring);
    const keyDispositions = {};
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logInfo)(`allowTargetingKeys - allowed keys [ ${allowedKeys.map(k => defaultKeyring[k]).join(', ')} ]`);
    targeting.map(adUnit => {
      const adUnitCode = Object.keys(adUnit)[0];
      const keyring = adUnit[adUnitCode];
      const keys = keyring.filter(kvPair => {
        const key = Object.keys(kvPair)[0];
        // check if key is in default keys, if not, it's custom, we won't remove it.
        const isCustom = defaultKeys.filter(defaultKey => key.indexOf(defaultKeyring[defaultKey]) === 0).length === 0;
        // check if key explicitly allowed, if not, we'll remove it.
        const found = isCustom || (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_3__.find)(allowedKeys, allowedKey => {
          const allowedKeyName = defaultKeyring[allowedKey];
          // we're looking to see if the key exactly starts with one of our default keys.
          // (which hopefully means it's not custom)
          const found = key.indexOf(allowedKeyName) === 0;
          return found;
        });
        keyDispositions[key] = !found;
        return found;
      });
      adUnit[adUnitCode] = keys;
    });
    const removedKeys = Object.keys(keyDispositions).filter(d => keyDispositions[d]);
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logInfo)(`allowTargetingKeys - removed keys [ ${removedKeys.join(', ')} ]`);
    // remove any empty targeting objects, as they're unnecessary.
    const filteredTargeting = targeting.filter(adUnit => {
      const adUnitCode = Object.keys(adUnit)[0];
      const keyring = adUnit[adUnitCode];
      return keyring.length > 0;
    });
    return filteredTargeting;
  }

  /**
   * Returns all ad server targeting for all ad units.
   * @param {string=} adUnitCode
   * @return {Object.<string,targeting>} targeting
   */
  targeting.getAllTargeting = function (adUnitCode, bidLimit, bidsReceived) {
    let winReducer = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _utils_reducers_js__WEBPACK_IMPORTED_MODULE_7__.getHighestCpm;
    let winSorter = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : _utils_js__WEBPACK_IMPORTED_MODULE_2__.sortByHighestCpm;
    bidsReceived ||= getBidsReceived(winReducer, winSorter);
    const adUnitCodes = getAdUnitCodes(adUnitCode);
    const sendAllBids = _config_js__WEBPACK_IMPORTED_MODULE_5__.config.getConfig('enableSendAllBids');
    const bidLimitConfigValue = _config_js__WEBPACK_IMPORTED_MODULE_5__.config.getConfig('sendBidsControl.bidLimit');
    const adUnitBidLimit = sendAllBids && (bidLimit || bidLimitConfigValue) || 0;
    const {
      customKeysByUnit,
      filteredBids
    } = getfilteredBidsAndCustomKeys(adUnitCodes, bidsReceived);
    const bidsSorted = getHighestCpmBidsFromBidPool(filteredBids, winReducer, adUnitBidLimit, undefined, winSorter);
    let targeting = getTargetingLevels(bidsSorted, customKeysByUnit);
    const defaultKeys = Object.keys(Object.assign({}, _constants_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_TARGETING_KEYS, _constants_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE_KEYS));
    let allowedKeys = _config_js__WEBPACK_IMPORTED_MODULE_5__.config.getConfig(CFG_ALLOW_TARGETING_KEYS);
    const addedKeys = _config_js__WEBPACK_IMPORTED_MODULE_5__.config.getConfig(CFG_ADD_TARGETING_KEYS);
    if (addedKeys != null && allowedKeys != null) {
      throw new Error(TARGETING_KEY_CONFIGURATION_ERROR_MSG);
    } else if (addedKeys != null) {
      allowedKeys = defaultKeys.concat(addedKeys);
    } else {
      allowedKeys = allowedKeys || defaultKeys;
    }
    if (Array.isArray(allowedKeys) && allowedKeys.length > 0) {
      targeting = getAllowedTargetingKeyValues(targeting, allowedKeys);
    }
    targeting = flattenTargeting(targeting);
    const auctionKeysThreshold = _config_js__WEBPACK_IMPORTED_MODULE_5__.config.getConfig('targetingControls.auctionKeyMaxChars');
    if (auctionKeysThreshold) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logInfo)(`Detected 'targetingControls.auctionKeyMaxChars' was active for this auction; set with a limit of ${auctionKeysThreshold} characters.  Running checks on auction keys...`);
      targeting = filterTargetingKeys(targeting, auctionKeysThreshold);
    }

    // make sure at least there is a entry per adUnit code in the targetingSet so receivers of SET_TARGETING call's can know what ad units are being invoked
    adUnitCodes.forEach(code => {
      if (!targeting[code]) {
        targeting[code] = {};
      }
    });
    return targeting;
  };
  function updatePBTargetingKeys(adUnitCode) {
    Object.keys(adUnitCode).forEach(key => {
      adUnitCode[key].forEach(targetKey => {
        const targetKeys = Object.keys(targetKey);
        if (pbTargetingKeys.indexOf(targetKeys[0]) === -1) {
          pbTargetingKeys = targetKeys.concat(pbTargetingKeys);
        }
      });
    });
  }
  function getTargetingLevels(bidsSorted, customKeysByUnit) {
    const targeting = getWinningBidTargeting(bidsSorted).concat(getCustomBidTargeting(bidsSorted, customKeysByUnit)).concat(getBidderTargeting(bidsSorted)).concat(getAdUnitTargeting());
    targeting.forEach(adUnitCode => {
      updatePBTargetingKeys(adUnitCode);
    });
    return targeting;
  }
  function getfilteredBidsAndCustomKeys(adUnitCodes, bidsReceived) {
    const filteredBids = [];
    const customKeysByUnit = {};
    const alwaysIncludeDeals = _config_js__WEBPACK_IMPORTED_MODULE_5__.config.getConfig('targetingControls.alwaysIncludeDeals');
    bidsReceived.forEach(bid => {
      const adUnitIsEligible = (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_3__.includes)(adUnitCodes, bid.adUnitCode);
      const cpmAllowed = _bidderSettings_js__WEBPACK_IMPORTED_MODULE_8__.bidderSettings.get(bid.bidderCode, 'allowZeroCpmBids') === true ? bid.cpm >= 0 : bid.cpm > 0;
      const isPreferredDeal = alwaysIncludeDeals && bid.dealId;
      if (adUnitIsEligible && (isPreferredDeal || cpmAllowed)) {
        filteredBids.push(bid);
        Object.keys(bid.adserverTargeting).filter(getCustomKeys()).forEach(key => {
          const truncKey = key.substring(0, MAX_DFP_KEYLENGTH);
          const data = customKeysByUnit[bid.adUnitCode] || {};
          const value = [bid.adserverTargeting[key]];
          if (data[truncKey]) {
            data[truncKey] = data[truncKey].concat(value).filter(_utils_js__WEBPACK_IMPORTED_MODULE_2__.uniques);
          } else {
            data[truncKey] = value;
          }
          customKeysByUnit[bid.adUnitCode] = data;
        });
      }
    });
    return {
      filteredBids,
      customKeysByUnit
    };
  }

  // warn about conflicting configuration
  _config_js__WEBPACK_IMPORTED_MODULE_5__.config.getConfig('targetingControls', function (config) {
    if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_9__["default"])(config, CFG_ALLOW_TARGETING_KEYS) != null && (0,_utils_js__WEBPACK_IMPORTED_MODULE_9__["default"])(config, CFG_ADD_TARGETING_KEYS) != null) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)(TARGETING_KEY_CONFIGURATION_ERROR_MSG);
    }
  });

  // create an encoded string variant based on the keypairs of the provided object
  //  - note this will encode the characters between the keys (ie = and &)
  function convertKeysToQueryForm(keyMap) {
    return Object.keys(keyMap).reduce(function (queryString, key) {
      let encodedKeyPair = `${key}%3d${encodeURIComponent(keyMap[key])}%26`;
      return queryString += encodedKeyPair;
    }, '');
  }
  function filterTargetingKeys(targeting, auctionKeysThreshold) {
    // read each targeting.adUnit object and sort the adUnits into a list of adUnitCodes based on priorization setting (eg CPM)
    let targetingCopy = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.deepClone)(targeting);
    let targetingMap = Object.keys(targetingCopy).map(adUnitCode => {
      return {
        adUnitCode,
        adserverTargeting: targetingCopy[adUnitCode]
      };
    }).sort(sortByDealAndPriceBucketOrCpm());

    // iterate through the targeting based on above list and transform the keys into the query-equivalent and count characters
    return targetingMap.reduce(function (accMap, currMap, index, arr) {
      let adUnitQueryString = convertKeysToQueryForm(currMap.adserverTargeting);

      // for the last adUnit - trim last encoded ampersand from the converted query string
      if (index + 1 === arr.length) {
        adUnitQueryString = adUnitQueryString.slice(0, -3);
      }

      // if under running threshold add to result
      let code = currMap.adUnitCode;
      let querySize = adUnitQueryString.length;
      if (querySize <= auctionKeysThreshold) {
        auctionKeysThreshold -= querySize;
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logInfo)(`AdUnit '${code}' auction keys comprised of ${querySize} characters.  Deducted from running threshold; new limit is ${auctionKeysThreshold}`, targetingCopy[code]);
        accMap[code] = targetingCopy[code];
      } else {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logWarn)(`The following keys for adUnitCode '${code}' exceeded the current limit of the 'auctionKeyMaxChars' setting.\nThe key-set size was ${querySize}, the current allotted amount was ${auctionKeysThreshold}.\n`, targetingCopy[code]);
      }
      if (index + 1 === arr.length && Object.keys(accMap).length === 0) {
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)('No auction targeting keys were permitted due to the setting in setConfig(targetingControls.auctionKeyMaxChars).  Please review setup and consider adjusting.');
      }
      return accMap;
    }, {});
  }

  /**
   * Converts targeting array and flattens to make it easily iteratable
   * e.g: Sample input to this function
   * ```
   * [
   *    {
   *      "div-gpt-ad-1460505748561-0": [{"hb_bidder": ["appnexusAst"]}]
   *    },
   *    {
   *      "div-gpt-ad-1460505748561-0": [{"hb_bidder_appnexusAs": ["appnexusAst", "other"]}]
   *    }
   * ]
   * ```
   * Resulting array
   * ```
   * {
   *  "div-gpt-ad-1460505748561-0": {
   *    "hb_bidder": "appnexusAst",
   *    "hb_bidder_appnexusAs": "appnexusAst,other"
   *  }
   * }
   * ```
   *
   * @param {targetingArray}  targeting
   * @return {Object.<string,targeting>}  targeting
   */
  function flattenTargeting(targeting) {
    let targetingObj = targeting.map(targeting => {
      return {
        [Object.keys(targeting)[0]]: targeting[Object.keys(targeting)[0]].map(target => {
          return {
            [Object.keys(target)[0]]: target[Object.keys(target)[0]].join(',')
          };
        }).reduce((p, c) => Object.assign(c, p), {})
      };
    });
    targetingObj = targetingObj.reduce(function (accumulator, targeting) {
      var key = Object.keys(targeting)[0];
      accumulator[key] = Object.assign({}, accumulator[key], targeting[key]);
      return accumulator;
    }, {});
    return targetingObj;
  }
  targeting.setTargetingForGPT = (0,_hook_js__WEBPACK_IMPORTED_MODULE_4__.hook)('sync', function (adUnit, customSlotMatching) {
    // get our ad unit codes
    let targetingSet = targeting.getAllTargeting(adUnit);
    let resetMap = Object.fromEntries(pbTargetingKeys.map(key => [key, null]));
    Object.entries(getGPTSlotsForAdUnits(Object.keys(targetingSet), customSlotMatching)).forEach(_ref => {
      let [targetId, slots] = _ref;
      slots.forEach(slot => {
        // now set new targeting keys
        Object.keys(targetingSet[targetId]).forEach(key => {
          let value = targetingSet[targetId][key];
          if (typeof value === 'string' && value.indexOf(',') !== -1) {
            // due to the check the array will be formed only if string has ',' else plain string will be assigned as value
            value = value.split(',');
          }
          targetingSet[targetId][key] = value;
        });
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logMessage)(`Attempting to set targeting-map for slot: ${slot.getSlotElementId()} with targeting-map:`, targetingSet[targetId]);
        slot.updateTargetingFromMap(Object.assign({}, resetMap, targetingSet[targetId]));
      });
    });
    Object.keys(targetingSet).forEach(adUnitCode => {
      Object.keys(targetingSet[adUnitCode]).forEach(targetingKey => {
        if (targetingKey === 'hb_adid') {
          auctionManager.setStatusForBids(targetingSet[adUnitCode][targetingKey], _constants_js__WEBPACK_IMPORTED_MODULE_0__.BID_STATUS.BID_TARGETING_SET);
        }
      });
    });
    targeting.targetingDone(targetingSet);

    // emit event
    _events_js__WEBPACK_IMPORTED_MODULE_10__.emit(_constants_js__WEBPACK_IMPORTED_MODULE_0__.EVENTS.SET_TARGETING, targetingSet);
  }, 'setTargetingForGPT');
  targeting.targetingDone = (0,_hook_js__WEBPACK_IMPORTED_MODULE_4__.hook)('sync', function (targetingSet) {
    return targetingSet;
  }, 'targetingDone');

  /**
   * normlizes input to a `adUnit.code` array
   * @param  {(string|string[])} adUnitCode [description]
   * @return {string[]}     AdUnit code array
   */
  function getAdUnitCodes(adUnitCode) {
    if (typeof adUnitCode === 'string') {
      return [adUnitCode];
    } else if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isArray)(adUnitCode)) {
      return adUnitCode;
    }
    return auctionManager.getAdUnitCodes() || [];
  }
  function getBidsReceived() {
    let winReducer = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _utils_reducers_js__WEBPACK_IMPORTED_MODULE_7__.getOldestHighestCpmBid;
    let winSorter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
    let bidsReceived = auctionManager.getBidsReceived().reduce((bids, bid) => {
      const bidCacheEnabled = _config_js__WEBPACK_IMPORTED_MODULE_5__.config.getConfig('useBidCache');
      const filterFunction = _config_js__WEBPACK_IMPORTED_MODULE_5__.config.getConfig('bidCacheFilterFunction');
      const isBidFromLastAuction = latestAuctionForAdUnit[bid.adUnitCode] === bid.auctionId;
      const filterFunctionResult = bidCacheEnabled && !isBidFromLastAuction && typeof filterFunction === 'function' ? !!filterFunction(bid) : true;
      const cacheFilter = bidCacheEnabled || isBidFromLastAuction;
      const bidFilter = cacheFilter && filterFunctionResult;
      if (bidFilter && (0,_utils_js__WEBPACK_IMPORTED_MODULE_9__["default"])(bid, 'video.context') !== _mediaTypes_js__WEBPACK_IMPORTED_MODULE_11__.ADPOD && isBidUsable(bid)) {
        bid.latestTargetedAuctionId = latestAuctionForAdUnit[bid.adUnitCode];
        bids.push(bid);
      }
      return bids;
    }, []);
    return getHighestCpmBidsFromBidPool(bidsReceived, winReducer, undefined, undefined, undefined, winSorter);
  }

  /**
   * Returns top bids for a given adUnit or set of adUnits.
   * @param  {(string|string[])} adUnitCode adUnitCode or array of adUnitCodes
   * @param  {(Array|undefined)} bids - The received bids, defaulting to the result of getBidsReceived().
   * @param  {function(Array<Object>): Array<Object>} [winReducer = getHighestCpm] - reducer method
   * @param  {function(Array<Object>): Array<Object>} [winSorter = sortByHighestCpm] - sorter method
   * @return {Array<Object>} - An array of winning bids.
   */
  targeting.getWinningBids = function (adUnitCode, bids) {
    let winReducer = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _utils_reducers_js__WEBPACK_IMPORTED_MODULE_7__.getHighestCpm;
    let winSorter = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _utils_js__WEBPACK_IMPORTED_MODULE_2__.sortByHighestCpm;
    const usedCodes = [];
    const bidsReceived = bids || getBidsReceived(winReducer, winSorter);
    const adUnitCodes = getAdUnitCodes(adUnitCode);
    return bidsReceived.reduce((result, bid) => {
      const code = bid.adUnitCode;
      const cpmEligible = _bidderSettings_js__WEBPACK_IMPORTED_MODULE_8__.bidderSettings.get(code, 'allowZeroCpmBids') === true ? bid.cpm >= 0 : bid.cpm > 0;
      const isPreferredDeal = _config_js__WEBPACK_IMPORTED_MODULE_5__.config.getConfig('targetingControls.alwaysIncludeDeals') && bid.dealId;
      const eligible = (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_3__.includes)(adUnitCodes, code) && !(0,_polyfill_js__WEBPACK_IMPORTED_MODULE_3__.includes)(usedCodes, code) && (isPreferredDeal || cpmEligible);
      if (eligible) {
        result.push(bid);
        usedCodes.push(code);
      }
      return result;
    }, []);
  };

  /**
   * @param  {(string|string[])} adUnitCodes adUnitCode or array of adUnitCodes
   * Sets targeting for AST
   */
  targeting.setTargetingForAst = function (adUnitCodes) {
    let astTargeting = targeting.getAllTargeting(adUnitCodes);
    try {
      targeting.resetPresetTargetingAST(adUnitCodes);
    } catch (e) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)('unable to reset targeting for AST' + e);
    }
    Object.keys(astTargeting).forEach(targetId => Object.keys(astTargeting[targetId]).forEach(key => {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logMessage)(`Attempting to set targeting for targetId: ${targetId} key: ${key} value: ${astTargeting[targetId][key]}`);
      // setKeywords supports string and array as value
      if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isStr)(astTargeting[targetId][key]) || (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isArray)(astTargeting[targetId][key])) {
        let keywordsObj = {};
        let regex = /pt[0-9]/;
        if (key.search(regex) < 0) {
          keywordsObj[key.toUpperCase()] = astTargeting[targetId][key];
        } else {
          // pt${n} keys should not be uppercased
          keywordsObj[key] = astTargeting[targetId][key];
        }
        window.apntag.setKeywords(targetId, keywordsObj, {
          overrideKeyValue: true
        });
      }
    }));
  };

  /**
   * Get targeting key value pairs for winning bid.
   * @param {Array<Object>} bidsReceived code array
   * @return {targetingArray} winning bids targeting
   */
  function getWinningBidTargeting(bidsReceived) {
    let usedAdUnitCodes = [];
    let winners = bidsReceived.reduce((bids, bid) => {
      if (!(0,_polyfill_js__WEBPACK_IMPORTED_MODULE_3__.includes)(usedAdUnitCodes, bid.adUnitCode)) {
        bids.push(bid);
        usedAdUnitCodes.push(bid.adUnitCode);
      }
      return bids;
    }, []);
    let standardKeys = getStandardKeys();
    winners = winners.map(winner => {
      return {
        [winner.adUnitCode]: Object.keys(winner.adserverTargeting).filter(key => typeof winner.sendStandardTargeting === 'undefined' || winner.sendStandardTargeting || standardKeys.indexOf(key) === -1).reduce((acc, key) => {
          const targetingValue = [winner.adserverTargeting[key]];
          const targeting = {
            [key.substring(0, MAX_DFP_KEYLENGTH)]: targetingValue
          };
          if (key === _constants_js__WEBPACK_IMPORTED_MODULE_0__.TARGETING_KEYS.DEAL) {
            const bidderCodeTargetingKey = `${key}_${winner.bidderCode}`.substring(0, MAX_DFP_KEYLENGTH);
            const bidderCodeTargeting = {
              [bidderCodeTargetingKey]: targetingValue
            };
            return [...acc, targeting, bidderCodeTargeting];
          }
          return [...acc, targeting];
        }, [])
      };
    });
    return winners;
  }
  function getStandardKeys() {
    return auctionManager.getStandardBidderAdServerTargeting() // in case using a custom standard key set
    .map(targeting => targeting.key).concat(TARGETING_KEYS_ARR).filter(_utils_js__WEBPACK_IMPORTED_MODULE_2__.uniques); // standard keys defined in the library.
  }
  function getCustomKeys() {
    let standardKeys = getStandardKeys();
    if (true) {
      standardKeys = standardKeys.concat(_native_js__WEBPACK_IMPORTED_MODULE_6__.NATIVE_TARGETING_KEYS);
    }
    return function (key) {
      return standardKeys.indexOf(key) === -1;
    };
  }

  /**
   * Get custom targeting key value pairs for bids.
   * @param {Array<Object>} bidsSorted code array
   * @param {Object} customKeysByUnit code array
   * @return {targetingArray} bids with custom targeting defined in bidderSettings
   */
  function getCustomBidTargeting(bidsSorted, customKeysByUnit) {
    return bidsSorted.reduce((acc, bid) => {
      const newBid = Object.assign({}, bid);
      const customKeysForUnit = customKeysByUnit[newBid.adUnitCode];
      const targeting = [];
      if (customKeysForUnit) {
        Object.keys(customKeysForUnit).forEach(key => {
          if (key && customKeysForUnit[key]) targeting.push({
            [key]: customKeysForUnit[key]
          });
        });
      }
      acc.push({
        [newBid.adUnitCode]: targeting
      });
      return acc;
    }, []);
  }
  function getTargetingMap(bid, keys) {
    return keys.reduce((targeting, key) => {
      const value = bid.adserverTargeting[key];
      if (value) {
        targeting.push({
          [`${key}_${bid.bidderCode}`.substring(0, MAX_DFP_KEYLENGTH)]: [bid.adserverTargeting[key]]
        });
      }
      return targeting;
    }, []);
  }
  function getAdUnitTargeting() {
    function getTargetingObj(adUnit) {
      return (0,_utils_js__WEBPACK_IMPORTED_MODULE_9__["default"])(adUnit, _constants_js__WEBPACK_IMPORTED_MODULE_0__.JSON_MAPPING.ADSERVER_TARGETING);
    }
    function getTargetingValues(adUnit) {
      const aut = getTargetingObj(adUnit);
      return Object.keys(aut).map(function (key) {
        if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isStr)(aut[key])) aut[key] = aut[key].split(',').map(s => s.trim());
        if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isArray)(aut[key])) aut[key] = [aut[key]];
        return {
          [key]: aut[key]
        };
      });
    }
    return auctionManager.getAdUnits().filter(adUnit => getTargetingObj(adUnit)).reduce((result, adUnit) => {
      const targetingValues = getTargetingValues(adUnit);
      if (targetingValues) result.push({
        [adUnit.code]: targetingValues
      });
      return result;
    }, []);
  }
  targeting.isApntagDefined = function () {
    if (window.apntag && (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.isFn)(window.apntag.setKeywords)) {
      return true;
    }
  };
  return targeting;
}
const targeting = newTargeting(_auctionManager_js__WEBPACK_IMPORTED_MODULE_12__.auctionManager);

/***/ }),

/***/ "./src/userSync.js":
/*!*************************!*\
  !*** ./src/userSync.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   userSync: () => (/* binding */ userSync)
/* harmony export */ });
/* unused harmony exports USERSYNC_DEFAULT_CONFIG, newUserSync */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var _polyfill_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _storageManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./storageManager.js */ "./src/storageManager.js");
/* harmony import */ var _activities_rules_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./activities/rules.js */ "./src/activities/rules.js");
/* harmony import */ var _activities_activities_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./activities/activities.js */ "./src/activities/activities.js");
/* harmony import */ var _activities_params_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./activities/params.js */ "./src/activities/params.js");
/* harmony import */ var _activities_modules_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./activities/modules.js */ "./src/activities/modules.js");
/* harmony import */ var _activities_activityParams_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./activities/activityParams.js */ "./src/activities/activityParams.js");









const USERSYNC_DEFAULT_CONFIG = {
  syncEnabled: true,
  filterSettings: {
    image: {
      bidders: '*',
      filter: 'include'
    }
  },
  syncsPerBidder: 5,
  syncDelay: 3000,
  auctionDelay: 500
};

// Set userSync default values
_config_js__WEBPACK_IMPORTED_MODULE_0__.config.setDefaults({
  'userSync': (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.deepClone)(USERSYNC_DEFAULT_CONFIG)
});
const storage = (0,_storageManager_js__WEBPACK_IMPORTED_MODULE_2__.getCoreStorageManager)('usersync');

/**
 * Factory function which creates a new UserSyncPool.
 *
 * @param {} deps Configuration options and dependencies which the
 *   UserSync object needs in order to behave properly.
 */
function newUserSync(deps) {
  let publicApi = {};
  // A queue of user syncs for each adapter
  // Let getDefaultQueue() set the defaults
  let queue = getDefaultQueue();

  // Whether or not user syncs have been trigger on this page load for a specific bidder
  let hasFiredBidder = new Set();
  // How many bids for each adapter
  let numAdapterBids = {};

  // for now - default both to false in case filterSettings config is absent/misconfigured
  let permittedPixels = {
    image: true,
    iframe: false
  };

  // Use what is in config by default
  let usConfig = deps.config;
  // Update if it's (re)set
  _config_js__WEBPACK_IMPORTED_MODULE_0__.config.getConfig('userSync', conf => {
    // Added this logic for https://github.com/prebid/Prebid.js/issues/4864
    // if userSync.filterSettings does not contain image/all configs, merge in default image config to ensure image pixels are fired
    if (conf.userSync) {
      let fs = conf.userSync.filterSettings;
      if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.isPlainObject)(fs)) {
        if (!fs.image && !fs.all) {
          conf.userSync.filterSettings.image = {
            bidders: '*',
            filter: 'include'
          };
        }
      }
    }
    usConfig = Object.assign(usConfig, conf.userSync);
  });
  deps.regRule(_activities_activities_js__WEBPACK_IMPORTED_MODULE_3__.ACTIVITY_SYNC_USER, 'userSync config', params => {
    if (!usConfig.syncEnabled) {
      return {
        allow: false,
        reason: 'syncs are disabled'
      };
    }
    if (params[_activities_params_js__WEBPACK_IMPORTED_MODULE_4__.ACTIVITY_PARAM_COMPONENT_TYPE] === _activities_modules_js__WEBPACK_IMPORTED_MODULE_5__.MODULE_TYPE_BIDDER) {
      const syncType = params[_activities_params_js__WEBPACK_IMPORTED_MODULE_4__.ACTIVITY_PARAM_SYNC_TYPE];
      const bidder = params[_activities_params_js__WEBPACK_IMPORTED_MODULE_4__.ACTIVITY_PARAM_COMPONENT_NAME];
      if (!publicApi.canBidderRegisterSync(syncType, bidder)) {
        return {
          allow: false,
          reason: `${syncType} syncs are not enabled for ${bidder}`
        };
      }
    }
  });

  /**
   * @function getDefaultQueue
   * @summary Returns the default empty queue
   * @private
   * @return {object} A queue with no syncs
   */
  function getDefaultQueue() {
    return {
      image: [],
      iframe: []
    };
  }

  /**
   * @function fireSyncs
   * @summary Trigger all user syncs in the queue
   * @private
   */
  function fireSyncs() {
    if (!usConfig.syncEnabled || !deps.browserSupportsCookies) {
      return;
    }
    try {
      // Iframe syncs
      loadIframes();
      // Image pixels
      fireImagePixels();
    } catch (e) {
      return (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logError)('Error firing user syncs', e);
    }
    // Reset the user sync queue
    queue = getDefaultQueue();
  }
  function forEachFire(queue, fn) {
    // Randomize the order of the pixels before firing
    // This is to avoid giving any bidder who has registered multiple syncs
    // any preferential treatment and balancing them out
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.shuffle)(queue).forEach(fn);
  }

  /**
   * @function fireImagePixels
   * @summary Loops through user sync pixels and fires each one
   * @private
   */
  function fireImagePixels() {
    if (!permittedPixels.image) {
      return;
    }
    forEachFire(queue.image, sync => {
      let [bidderName, trackingPixelUrl] = sync;
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logMessage)(`Invoking image pixel user sync for bidder: ${bidderName}`);
      // Create image object and add the src url
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.triggerPixel)(trackingPixelUrl);
    });
  }

  /**
   * @function loadIframes
   * @summary Loops through iframe syncs and loads an iframe element into the page
   * @private
   */
  function loadIframes() {
    if (!permittedPixels.iframe) {
      return;
    }
    forEachFire(queue.iframe, sync => {
      let [bidderName, iframeUrl] = sync;
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logMessage)(`Invoking iframe user sync for bidder: ${bidderName}`);
      // Insert iframe into DOM
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.insertUserSyncIframe)(iframeUrl);
      // for a bidder, if iframe sync is present then remove image pixel
      removeImagePixelsForBidder(queue, bidderName);
    });
  }
  function removeImagePixelsForBidder(queue, iframeSyncBidderName) {
    queue.image = queue.image.filter(imageSync => {
      let imageSyncBidderName = imageSync[0];
      return imageSyncBidderName !== iframeSyncBidderName;
    });
  }

  /**
   * @function incrementAdapterBids
   * @summary Increment the count of user syncs queue for the adapter
   * @private
   * @param {object} numAdapterBids The object contain counts for all adapters
   * @param {string} bidder The name of the bidder adding a sync
   * @returns {object} The updated version of numAdapterBids
   */
  function incrementAdapterBids(numAdapterBids, bidder) {
    if (!numAdapterBids[bidder]) {
      numAdapterBids[bidder] = 1;
    } else {
      numAdapterBids[bidder] += 1;
    }
    return numAdapterBids;
  }

  /**
   * @function registerSync
   * @summary Add sync for this bidder to a queue to be fired later
   * @public
   * @param {string} type The type of the sync including image, iframe
   * @param {string} bidder The name of the adapter. e.g. "rubicon"
   * @param {string} url Either the pixel url or iframe url depending on the type
   * @example <caption>Using Image Sync</caption>
   * // registerSync(type, adapter, pixelUrl)
   * userSync.registerSync('image', 'rubicon', 'http://example.com/pixel')
   */
  publicApi.registerSync = (type, bidder, url) => {
    if (hasFiredBidder.has(bidder)) {
      return (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logMessage)(`already fired syncs for "${bidder}", ignoring registerSync call`);
    }
    if (!usConfig.syncEnabled || !(0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.isArray)(queue[type])) {
      return (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`User sync type "${type}" not supported`);
    }
    if (!bidder) {
      return (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`Bidder is required for registering sync`);
    }
    if (usConfig.syncsPerBidder !== 0 && Number(numAdapterBids[bidder]) >= usConfig.syncsPerBidder) {
      return (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`Number of user syncs exceeded for "${bidder}"`);
    }
    if (deps.isAllowed(_activities_activities_js__WEBPACK_IMPORTED_MODULE_3__.ACTIVITY_SYNC_USER, (0,_activities_activityParams_js__WEBPACK_IMPORTED_MODULE_6__.activityParams)(_activities_modules_js__WEBPACK_IMPORTED_MODULE_5__.MODULE_TYPE_BIDDER, bidder, {
      [_activities_params_js__WEBPACK_IMPORTED_MODULE_4__.ACTIVITY_PARAM_SYNC_TYPE]: type,
      [_activities_params_js__WEBPACK_IMPORTED_MODULE_4__.ACTIVITY_PARAM_SYNC_URL]: url
    }))) {
      // the bidder's pixel has passed all checks and is allowed to register
      queue[type].push([bidder, url]);
      numAdapterBids = incrementAdapterBids(numAdapterBids, bidder);
    }
  };

  /**
   * Mark a bidder as done with its user syncs - no more will be accepted from them in this session.
   * @param {string} bidderCode
   */
  publicApi.bidderDone = hasFiredBidder.add.bind(hasFiredBidder);

  /**
   * @function shouldBidderBeBlocked
   * @summary Check filterSettings logic to determine if the bidder should be prevented from registering their userSync tracker
   * @private
   * @param {string} type The type of the sync; either image or iframe
   * @param {string} bidder The name of the adapter. e.g. "rubicon"
   * @returns {boolean} true => bidder is not allowed to register; false => bidder can register
   */
  function shouldBidderBeBlocked(type, bidder) {
    let filterConfig = usConfig.filterSettings;

    // apply the filter check if the config object is there (eg filterSettings.iframe exists) and if the config object is properly setup
    if (isFilterConfigValid(filterConfig, type)) {
      permittedPixels[type] = true;
      let activeConfig = filterConfig.all ? filterConfig.all : filterConfig[type];
      let biddersToFilter = activeConfig.bidders === '*' ? [bidder] : activeConfig.bidders;
      let filterType = activeConfig.filter || 'include'; // set default if undefined

      // return true if the bidder is either: not part of the include (ie outside the whitelist) or part of the exclude (ie inside the blacklist)
      const checkForFiltering = {
        'include': (bidders, bidder) => !(0,_polyfill_js__WEBPACK_IMPORTED_MODULE_7__.includes)(bidders, bidder),
        'exclude': (bidders, bidder) => (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_7__.includes)(bidders, bidder)
      };
      return checkForFiltering[filterType](biddersToFilter, bidder);
    }
    return !permittedPixels[type];
  }

  /**
   * @function isFilterConfigValid
   * @summary Check if the filterSettings object in the userSync config is setup properly
   * @private
   * @param {object} filterConfig sub-config object taken from filterSettings
   * @param {string} type The type of the sync; either image or iframe
   * @returns {boolean} true => config is setup correctly, false => setup incorrectly or filterConfig[type] is not present
   */
  function isFilterConfigValid(filterConfig, type) {
    if (filterConfig.all && filterConfig[type]) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`Detected presence of the "filterSettings.all" and "filterSettings.${type}" in userSync config.  You cannot mix "all" with "iframe/image" configs; they are mutually exclusive.`);
      return false;
    }
    let activeConfig = filterConfig.all ? filterConfig.all : filterConfig[type];
    let activeConfigName = filterConfig.all ? 'all' : type;

    // if current pixel type isn't part of the config's logic, skip rest of the config checks...
    // we return false to skip subsequent filter checks in shouldBidderBeBlocked() function
    if (!activeConfig) {
      return false;
    }
    let filterField = activeConfig.filter;
    let biddersField = activeConfig.bidders;
    if (filterField && filterField !== 'include' && filterField !== 'exclude') {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`UserSync "filterSettings.${activeConfigName}.filter" setting '${filterField}' is not a valid option; use either 'include' or 'exclude'.`);
      return false;
    }
    if (biddersField !== '*' && !(Array.isArray(biddersField) && biddersField.length > 0 && biddersField.every(bidderInList => (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.isStr)(bidderInList) && bidderInList !== '*'))) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`Detected an invalid setup in userSync "filterSettings.${activeConfigName}.bidders"; use either '*' (to represent all bidders) or an array of bidders.`);
      return false;
    }
    return true;
  }

  /**
   * @function syncUsers
   * @summary Trigger all the user syncs based on publisher-defined timeout
   * @public
   * @param {number} timeout The delay in ms before syncing data - default 0
   */
  publicApi.syncUsers = function () {
    let timeout = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    if (timeout) {
      return setTimeout(fireSyncs, Number(timeout));
    }
    fireSyncs();
  };

  /**
   * @function triggerUserSyncs
   * @summary A `syncUsers` wrapper for determining if enableOverride has been turned on
   * @public
   */
  publicApi.triggerUserSyncs = () => {
    if (usConfig.enableOverride) {
      publicApi.syncUsers();
    }
  };
  publicApi.canBidderRegisterSync = (type, bidder) => {
    if (usConfig.filterSettings) {
      if (shouldBidderBeBlocked(type, bidder)) {
        return false;
      }
    }
    return true;
  };
  return publicApi;
}
const userSync = newUserSync(Object.defineProperties({
  config: _config_js__WEBPACK_IMPORTED_MODULE_0__.config.getConfig('userSync'),
  isAllowed: _activities_rules_js__WEBPACK_IMPORTED_MODULE_8__.isActivityAllowed,
  regRule: _activities_rules_js__WEBPACK_IMPORTED_MODULE_8__.registerActivityControl
}, {
  browserSupportsCookies: {
    get: function () {
      // call storage lazily to give time for consent data to be available
      return !(0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.isSafariBrowser)() && storage.cookiesAreEnabled();
    }
  }
}));

/**
 * @typedef {Object} UserSyncConfig
 *
 * @property {boolean} enableOverride
 * @property {boolean} syncEnabled
 * @property {number} syncsPerBidder
 * @property {string[]} enabledBidders
 * @property {Object} filterSettings
 */

/***/ }),

/***/ "./src/utils.js":
/*!**********************!*\
  !*** ./src/utils.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   _setEventEmitter: () => (/* binding */ _setEventEmitter),
/* harmony export */   binarySearch: () => (/* binding */ binarySearch),
/* harmony export */   buildUrl: () => (/* binding */ buildUrl),
/* harmony export */   checkCookieSupport: () => (/* binding */ checkCookieSupport),
/* harmony export */   compareCodeAndSlot: () => (/* binding */ compareCodeAndSlot),
/* harmony export */   contains: () => (/* binding */ contains),
/* harmony export */   createIframe: () => (/* binding */ createIframe),
/* harmony export */   createInvisibleIframe: () => (/* binding */ createInvisibleIframe),
/* harmony export */   cyrb53Hash: () => (/* binding */ cyrb53Hash),
/* harmony export */   deepClone: () => (/* binding */ deepClone),
/* harmony export */   deepEqual: () => (/* binding */ deepEqual),
/* harmony export */   delayExecution: () => (/* binding */ delayExecution),
/* harmony export */   flatten: () => (/* binding */ flatten),
/* harmony export */   generateUUID: () => (/* binding */ generateUUID),
/* harmony export */   getBidderCodes: () => (/* binding */ getBidderCodes),
/* harmony export */   getDNT: () => (/* binding */ getDNT),
/* harmony export */   getDefinedParams: () => (/* binding */ getDefinedParams),
/* harmony export */   getParameterByName: () => (/* binding */ getParameterByName),
/* harmony export */   getPerformanceNow: () => (/* binding */ getPerformanceNow),
/* harmony export */   getUniqueIdentifierStr: () => (/* binding */ getUniqueIdentifierStr),
/* harmony export */   getUserConfiguredParams: () => (/* binding */ getUserConfiguredParams),
/* harmony export */   getValue: () => (/* binding */ getValue),
/* harmony export */   getWindowSelf: () => (/* binding */ getWindowSelf),
/* harmony export */   getWindowTop: () => (/* binding */ getWindowTop),
/* harmony export */   groupBy: () => (/* binding */ groupBy),
/* harmony export */   hasDeviceAccess: () => (/* binding */ hasDeviceAccess),
/* harmony export */   inIframe: () => (/* binding */ inIframe),
/* harmony export */   insertElement: () => (/* binding */ insertElement),
/* harmony export */   insertHtmlIntoIframe: () => (/* binding */ insertHtmlIntoIframe),
/* harmony export */   insertUserSyncIframe: () => (/* binding */ insertUserSyncIframe),
/* harmony export */   internal: () => (/* binding */ internal),
/* harmony export */   isAdUnitCodeMatchingSlot: () => (/* binding */ isAdUnitCodeMatchingSlot),
/* harmony export */   isApnGetTagDefined: () => (/* binding */ isApnGetTagDefined),
/* harmony export */   isArray: () => (/* binding */ isArray),
/* harmony export */   isArrayOfNums: () => (/* binding */ isArrayOfNums),
/* harmony export */   isBoolean: () => (/* binding */ isBoolean),
/* harmony export */   isEmpty: () => (/* binding */ isEmpty),
/* harmony export */   isEmptyStr: () => (/* binding */ isEmptyStr),
/* harmony export */   isFn: () => (/* binding */ isFn),
/* harmony export */   isGptPubadsDefined: () => (/* binding */ isGptPubadsDefined),
/* harmony export */   isInteger: () => (/* binding */ isInteger),
/* harmony export */   isNumber: () => (/* binding */ isNumber),
/* harmony export */   isPlainObject: () => (/* binding */ isPlainObject),
/* harmony export */   isSafariBrowser: () => (/* binding */ isSafariBrowser),
/* harmony export */   isStr: () => (/* binding */ isStr),
/* harmony export */   isValidMediaTypes: () => (/* binding */ isValidMediaTypes),
/* harmony export */   logError: () => (/* binding */ logError),
/* harmony export */   logInfo: () => (/* binding */ logInfo),
/* harmony export */   logMessage: () => (/* binding */ logMessage),
/* harmony export */   logWarn: () => (/* binding */ logWarn),
/* harmony export */   memoize: () => (/* binding */ memoize),
/* harmony export */   mergeDeep: () => (/* binding */ mergeDeep),
/* harmony export */   parseQueryStringParameters: () => (/* binding */ parseQueryStringParameters),
/* harmony export */   parseSizesInput: () => (/* binding */ parseSizesInput),
/* harmony export */   parseUrl: () => (/* binding */ parseUrl),
/* harmony export */   pick: () => (/* binding */ pick),
/* harmony export */   prefixLog: () => (/* binding */ prefixLog),
/* harmony export */   replaceMacros: () => (/* binding */ replaceMacros),
/* harmony export */   safeJSONParse: () => (/* binding */ safeJSONParse),
/* harmony export */   setScriptAttributes: () => (/* binding */ setScriptAttributes),
/* harmony export */   shuffle: () => (/* binding */ shuffle),
/* harmony export */   sortByHighestCpm: () => (/* binding */ sortByHighestCpm),
/* harmony export */   timestamp: () => (/* binding */ timestamp),
/* harmony export */   transformAdServerTargetingObj: () => (/* binding */ transformAdServerTargetingObj),
/* harmony export */   triggerPixel: () => (/* binding */ triggerPixel),
/* harmony export */   uniques: () => (/* binding */ uniques),
/* harmony export */   unsupportedBidderMessage: () => (/* binding */ unsupportedBidderMessage)
/* harmony export */ });
/* unused harmony exports getPrebidInternal, getBidIdParameter, sizesToSizeTuples, sizeTupleToSizeString, parseGPTSingleSizeArray, sizeTupleToRtbSize, parseGPTSingleSizeArrayToRtbSize, getWindowLocation, canAccessWindowTop, hasConsoleLogger, debugTurnedOn, isA, _each, _map, waitForElementToLoad, createTrackPixelHtml, encodeMacroURI, createTrackPixelIframeHtml, getBidRequest, isSafeFrameWindow, getSafeframeGeometry, replaceAuctionPrice, replaceClickThrough, getDomLoadingDuration, cleanObj, parseQS, formatQS, safeJSONEncode, getUnixTimestampFromNow, convertObjectToArray, hasNonSerializableProperty, setOnAny, extractDomainFromHost, triggerNurlWithCpm */
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var klona_json__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! klona/json */ "./node_modules/klona/json/index.mjs");
/* harmony import */ var _polyfill_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./constants.js */ "./src/constants.js");
/* harmony import */ var _utils_promise_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils/promise.js */ "./src/utils/promise.js");
/* harmony import */ var _prebidGlobal_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./prebidGlobal.js */ "./src/prebidGlobal.js");
/* harmony import */ var dlv_index_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! dlv/index.js */ "./node_modules/dlv/index.js");









var tStr = 'String';
var tFn = 'Function';
var tNumb = 'Number';
var tObject = 'Object';
var tBoolean = 'Boolean';
var toString = Object.prototype.toString;
let consoleExists = Boolean(window.console);
let consoleLogExists = Boolean(consoleExists && window.console.log);
let consoleInfoExists = Boolean(consoleExists && window.console.info);
let consoleWarnExists = Boolean(consoleExists && window.console.warn);
let consoleErrorExists = Boolean(consoleExists && window.console.error);
let eventEmitter;
const pbjsInstance = (0,_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_0__.getGlobal)();
function _setEventEmitter(emitFn) {
  // called from events.js - this hoop is to avoid circular imports
  eventEmitter = emitFn;
}
function emitEvent() {
  if (eventEmitter != null) {
    eventEmitter(...arguments);
  }
}

// this allows stubbing of utility functions that are used internally by other utility functions
const internal = {
  checkCookieSupport,
  createTrackPixelIframeHtml,
  getWindowSelf,
  getWindowTop,
  canAccessWindowTop,
  getWindowLocation,
  insertUserSyncIframe,
  insertElement,
  isFn,
  triggerPixel,
  logError,
  logWarn,
  logMessage,
  logInfo,
  parseQS,
  formatQS,
  deepEqual
};
let prebidInternal = {};
/**
 * Returns object that is used as internal prebid namespace
 */
function getPrebidInternal() {
  return prebidInternal;
}

/* utility method to get incremental integer starting from 1 */
var getIncrementalInteger = function () {
  var count = 0;
  return function () {
    count++;
    return count;
  };
}();

// generate a random string (to be used as a dynamic JSONP callback)
function getUniqueIdentifierStr() {
  return getIncrementalInteger() + Math.random().toString(16).substr(2);
}

/**
 * Returns a random v4 UUID of the form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx,
 * where each x is replaced with a random hexadecimal digit from 0 to f,
 * and y is replaced with a random hexadecimal digit from 8 to b.
 * https://gist.github.com/jed/982883 via node-uuid
 */
function generateUUID(placeholder) {
  return placeholder ? (placeholder ^ _getRandomData() >> placeholder / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, generateUUID);
}

/**
 * Returns random data using the Crypto API if available and Math.random if not
 * Method is from https://gist.github.com/jed/982883 like generateUUID, direct link https://gist.github.com/jed/982883#gistcomment-45104
 */
function _getRandomData() {
  if (window && window.crypto && window.crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint8Array(1))[0] % 16;
  } else {
    return Math.random() * 16;
  }
}
function getBidIdParameter(key, paramsObj) {
  return paramsObj?.[key] || '';
}

// parse a query string object passed in bid params
// bid params should be an object such as {key: "value", key1 : "value1"}
// aliases to formatQS
function parseQueryStringParameters(queryObj) {
  let result = '';
  for (var k in queryObj) {
    if (queryObj.hasOwnProperty(k)) {
      result += k + '=' + encodeURIComponent(queryObj[k]) + '&';
    }
  }
  result = result.replace(/&$/, '');
  return result;
}

// transform an AdServer targeting bids into a query string to send to the adserver
function transformAdServerTargetingObj(targeting) {
  // we expect to receive targeting for a single slot at a time
  if (targeting && Object.getOwnPropertyNames(targeting).length > 0) {
    return Object.keys(targeting).map(key => `${key}=${encodeURIComponent(targeting[key])}`).join('&');
  } else {
    return '';
  }
}

/**
 * Parse a GPT-Style general size Array like `[[300, 250]]` or `"300x250,970x90"` into an array of width, height tuples `[[300, 250]]` or '[[300,250], [970,90]]'
 */
function sizesToSizeTuples(sizes) {
  if (typeof sizes === 'string') {
    // multiple sizes will be comma-separated
    return sizes.split(/\s*,\s*/).map(sz => sz.match(/^(\d+)x(\d+)$/i)).filter(match => match).map(_ref => {
      let [_, w, h] = _ref;
      return [parseInt(w, 10), parseInt(h, 10)];
    });
  } else if (Array.isArray(sizes)) {
    if (isValidGPTSingleSize(sizes)) {
      return [sizes];
    }
    return sizes.filter(isValidGPTSingleSize);
  }
  return [];
}

/**
 * Parse a GPT-Style general size Array like `[[300, 250]]` or `"300x250,970x90"` into an array of sizes `["300x250"]` or '['300x250', '970x90']'
 * @param  {(Array.<number[]>|Array.<number>)} sizeObj Input array or double array [300,250] or [[300,250], [728,90]]
 * @return {Array.<string>}  Array of strings like `["300x250"]` or `["300x250", "728x90"]`
 */
function parseSizesInput(sizeObj) {
  return sizesToSizeTuples(sizeObj).map(sizeTupleToSizeString);
}
function sizeTupleToSizeString(size) {
  return size[0] + 'x' + size[1];
}

// Parse a GPT style single size array, (i.e [300, 250])
// into an AppNexus style string, (i.e. 300x250)
function parseGPTSingleSizeArray(singleSize) {
  if (isValidGPTSingleSize(singleSize)) {
    return sizeTupleToSizeString(singleSize);
  }
}
function sizeTupleToRtbSize(size) {
  return {
    w: size[0],
    h: size[1]
  };
}

// Parse a GPT style single size array, (i.e [300, 250])
// into OpenRTB-compatible (imp.banner.w/h, imp.banner.format.w/h, imp.video.w/h) object(i.e. {w:300, h:250})
function parseGPTSingleSizeArrayToRtbSize(singleSize) {
  if (isValidGPTSingleSize(singleSize)) {
    return sizeTupleToRtbSize(singleSize);
  }
}
function isValidGPTSingleSize(singleSize) {
  // if we aren't exactly 2 items in this array, it is invalid
  return isArray(singleSize) && singleSize.length === 2 && !isNaN(singleSize[0]) && !isNaN(singleSize[1]);
}
function getWindowTop() {
  return window.top;
}
function getWindowSelf() {
  return window.self;
}
function getWindowLocation() {
  return window.location;
}
function canAccessWindowTop() {
  try {
    if (internal.getWindowTop().location.href) {
      return true;
    }
  } catch (e) {
    return false;
  }
}

/**
 * Wrappers to console.(log | info | warn | error). Takes N arguments, the same as the native methods
 */
function logMessage() {
  if (debugTurnedOn() && consoleLogExists) {
    // eslint-disable-next-line no-console
    console.log.apply(console, decorateLog(arguments, 'MESSAGE:'));
  }
}
function logInfo() {
  if (debugTurnedOn() && consoleInfoExists) {
    // eslint-disable-next-line no-console
    console.info.apply(console, decorateLog(arguments, 'INFO:'));
  }
}
function logWarn() {
  if (debugTurnedOn() && consoleWarnExists) {
    // eslint-disable-next-line no-console
    console.warn.apply(console, decorateLog(arguments, 'WARNING:'));
  }
  emitEvent(_constants_js__WEBPACK_IMPORTED_MODULE_1__.EVENTS.AUCTION_DEBUG, {
    type: 'WARNING',
    arguments: arguments
  });
}
function logError() {
  if (debugTurnedOn() && consoleErrorExists) {
    // eslint-disable-next-line no-console
    console.error.apply(console, decorateLog(arguments, 'ERROR:'));
  }
  emitEvent(_constants_js__WEBPACK_IMPORTED_MODULE_1__.EVENTS.AUCTION_DEBUG, {
    type: 'ERROR',
    arguments: arguments
  });
}
function prefixLog(prefix) {
  function decorate(fn) {
    return function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      fn(prefix, ...args);
    };
  }
  return {
    logError: decorate(logError),
    logWarn: decorate(logWarn),
    logMessage: decorate(logMessage),
    logInfo: decorate(logInfo)
  };
}
function decorateLog(args, prefix) {
  args = [].slice.call(args);
  let bidder = _config_js__WEBPACK_IMPORTED_MODULE_2__.config.getCurrentBidder();
  prefix && args.unshift(prefix);
  if (bidder) {
    args.unshift(label('#aaa'));
  }
  args.unshift(label('#3b88c3'));
  args.unshift('%cPrebid' + (bidder ? `%c${bidder}` : ''));
  return args;
  function label(color) {
    return `display: inline-block; color: #fff; background: ${color}; padding: 1px 4px; border-radius: 3px;`;
  }
}
function hasConsoleLogger() {
  return consoleLogExists;
}
function debugTurnedOn() {
  return !!_config_js__WEBPACK_IMPORTED_MODULE_2__.config.getConfig('debug');
}
const createIframe = (() => {
  const DEFAULTS = {
    border: '0px',
    hspace: '0',
    vspace: '0',
    marginWidth: '0',
    marginHeight: '0',
    scrolling: 'no',
    frameBorder: '0',
    allowtransparency: 'true'
  };
  return function (doc, attrs) {
    let style = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    const f = doc.createElement('iframe');
    Object.assign(f, Object.assign({}, DEFAULTS, attrs));
    Object.assign(f.style, style);
    return f;
  };
})();
function createInvisibleIframe() {
  return createIframe(document, {
    id: getUniqueIdentifierStr(),
    width: 0,
    height: 0,
    src: 'about:blank'
  }, {
    display: 'none',
    height: '0px',
    width: '0px',
    border: '0px'
  });
}

/*
 *   Check if a given parameter name exists in query string
 *   and if it does return the value
 */
function getParameterByName(name) {
  return parseQS(getWindowLocation().search)[name] || '';
}

/**
 * Return if the object is of the
 * given type.
 * @param {*} object to test
 * @param {String} _t type string (e.g., Array)
 * @return {Boolean} if object is of type _t
 */
function isA(object, _t) {
  return toString.call(object) === '[object ' + _t + ']';
}
function isFn(object) {
  return isA(object, tFn);
}
function isStr(object) {
  return isA(object, tStr);
}
const isArray = Array.isArray.bind(Array);
function isNumber(object) {
  return isA(object, tNumb);
}
function isPlainObject(object) {
  return isA(object, tObject);
}
function isBoolean(object) {
  return isA(object, tBoolean);
}

/**
 * Return if the object is "empty";
 * this includes falsey, no keys, or no items at indices
 * @param {*} object object to test
 * @return {Boolean} if object is empty
 */
function isEmpty(object) {
  if (!object) return true;
  if (isArray(object) || isStr(object)) {
    return !(object.length > 0);
  }
  return Object.keys(object).length <= 0;
}

/**
 * Return if string is empty, null, or undefined
 * @param str string to test
 * @returns {boolean} if string is empty
 */
function isEmptyStr(str) {
  return isStr(str) && (!str || str.length === 0);
}

/**
 * Iterate object with the function
 * falls back to es5 `forEach`
 * @param {Array|Object} object
 * @param {Function} fn - The function to execute for each element. It receives three arguments: value, key, and the original object.
 * @returns {void}
 */
function _each(object, fn) {
  if (isFn(object?.forEach)) return object.forEach(fn, this);
  Object.entries(object || {}).forEach(_ref2 => {
    let [k, v] = _ref2;
    return fn.call(this, v, k);
  });
}
function contains(a, obj) {
  return isFn(a?.includes) && a.includes(obj);
}

/**
 * Map an array or object into another array
 * given a function
 * @param {Array|Object} object
 * @param {Function} callback - The function to execute for each element. It receives three arguments: value, key, and the original object.
 * @return {Array}
 */
function _map(object, callback) {
  if (isFn(object?.map)) return object.map(callback);
  return Object.entries(object || {}).map(_ref3 => {
    let [k, v] = _ref3;
    return callback(v, k, object);
  });
}

/*
* Inserts an element(elm) as targets child, by default as first child
* @param {HTMLElement} elm
* @param {HTMLElement} [doc]
* @param {HTMLElement} [target]
* @param {Boolean} [asLastChildChild]
* @return {HTML Element}
*/
function insertElement(elm, doc, target, asLastChildChild) {
  doc = doc || document;
  let parentEl;
  if (target) {
    parentEl = doc.getElementsByTagName(target);
  } else {
    parentEl = doc.getElementsByTagName('head');
  }
  try {
    parentEl = parentEl.length ? parentEl : doc.getElementsByTagName('body');
    if (parentEl.length) {
      parentEl = parentEl[0];
      let insertBeforeEl = asLastChildChild ? null : parentEl.firstChild;
      return parentEl.insertBefore(elm, insertBeforeEl);
    }
  } catch (e) {}
}

/**
 * Returns a promise that completes when the given element triggers a 'load' or 'error' DOM event, or when
 * `timeout` milliseconds have elapsed.
 *
 * @param {HTMLElement} element
 * @param {Number} [timeout]
 * @returns {Promise}
 */
function waitForElementToLoad(element, timeout) {
  let timer = null;
  return new _utils_promise_js__WEBPACK_IMPORTED_MODULE_3__.GreedyPromise(resolve => {
    const onLoad = function () {
      element.removeEventListener('load', onLoad);
      element.removeEventListener('error', onLoad);
      if (timer != null) {
        window.clearTimeout(timer);
      }
      resolve();
    };
    element.addEventListener('load', onLoad);
    element.addEventListener('error', onLoad);
    if (timeout != null) {
      timer = window.setTimeout(onLoad, timeout);
    }
  });
}

/**
 * Inserts an image pixel with the specified `url` for cookie sync
 * @param {string} url URL string of the image pixel to load
 * @param  {function} [done] an optional exit callback, used when this usersync pixel is added during an async process
 * @param  {Number} [timeout] an optional timeout in milliseconds for the image to load before calling `done`
 */
function triggerPixel(url, done, timeout) {
  const img = new Image();
  if (done && internal.isFn(done)) {
    waitForElementToLoad(img, timeout).then(done);
  }
  img.src = url;
}

/**
 * Inserts an empty iframe with the specified `html`, primarily used for tracking purposes
 * (though could be for other purposes)
 * @param {string} htmlCode snippet of HTML code used for tracking purposes
 */
function insertHtmlIntoIframe(htmlCode) {
  if (!htmlCode) {
    return;
  }
  const iframe = createInvisibleIframe();
  internal.insertElement(iframe, document, 'body');
  (doc => {
    doc.open();
    doc.write(htmlCode);
    doc.close();
  })(iframe.contentWindow.document);
}

/**
 * Inserts empty iframe with the specified `url` for cookie sync
 * @param  {string} url URL to be requested
 * @param  {function} [done] an optional exit callback, used when this usersync pixel is added during an async process
 * @param  {Number} [timeout] an optional timeout in milliseconds for the iframe to load before calling `done`
 */
function insertUserSyncIframe(url, done, timeout) {
  let iframeHtml = internal.createTrackPixelIframeHtml(url, false, 'allow-scripts allow-same-origin');
  let div = document.createElement('div');
  div.innerHTML = iframeHtml;
  let iframe = div.firstChild;
  if (done && internal.isFn(done)) {
    waitForElementToLoad(iframe, timeout).then(done);
  }
  internal.insertElement(iframe, document, 'html', true);
}

/**
 * Creates a snippet of HTML that retrieves the specified `url`
 * @param  {string} url URL to be requested
 * @param encode
 * @return {string}     HTML snippet that contains the img src = set to `url`
 */
function createTrackPixelHtml(url) {
  let encode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : encodeURI;
  if (!url) {
    return '';
  }
  let escapedUrl = encode(url);
  let img = '<div style="position:absolute;left:0px;top:0px;visibility:hidden;">';
  img += '<img src="' + escapedUrl + '"></div>';
  return img;
}
;

/**
 * encodeURI, but preserves macros of the form '${MACRO}' (e.g. '${AUCTION_PRICE}')
 * @param url
 * @return {string}
 */
function encodeMacroURI(url) {
  const macros = Array.from(url.matchAll(/\$({[^}]+})/g)).map(match => match[1]);
  return macros.reduce((str, macro) => {
    return str.replace('$' + encodeURIComponent(macro), '$' + macro);
  }, encodeURI(url));
}

/**
 * Creates a snippet of Iframe HTML that retrieves the specified `url`
 * @param  {string} url plain URL to be requested
 * @param  {string} encodeUri boolean if URL should be encoded before inserted. Defaults to true
 * @param  {string} sandbox string if provided the sandbox attribute will be included with the given value
 * @return {string}     HTML snippet that contains the iframe src = set to `url`
 */
function createTrackPixelIframeHtml(url) {
  let encodeUri = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  let sandbox = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  if (!url) {
    return '';
  }
  if (encodeUri) {
    url = encodeURI(url);
  }
  if (sandbox) {
    sandbox = `sandbox="${sandbox}"`;
  }
  return `<iframe ${sandbox} id="${getUniqueIdentifierStr()}"
      frameborder="0"
      allowtransparency="true"
      marginheight="0" marginwidth="0"
      width="0" hspace="0" vspace="0" height="0"
      style="height:0px;width:0px;display:none;"
      scrolling="no"
      src="${url}">
    </iframe>`;
}
function uniques(value, index, arry) {
  return arry.indexOf(value) === index;
}
function flatten(a, b) {
  return a.concat(b);
}
function getBidRequest(id, bidderRequests) {
  if (!id) {
    return;
  }
  return bidderRequests.flatMap(br => br.bids).find(bid => ['bidId', 'adId', 'bid_id'].some(prop => bid[prop] === id));
}
function getValue(obj, key) {
  return obj[key];
}
function getBidderCodes() {
  let adUnits = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : pbjsInstance.adUnits;
  // this could memoize adUnits
  return adUnits.map(unit => unit.bids.map(bid => bid.bidder).reduce(flatten, [])).reduce(flatten, []).filter(bidder => typeof bidder !== 'undefined').filter(uniques);
}
function isGptPubadsDefined() {
  if (window.googletag && isFn(window.googletag.pubads) && isFn(window.googletag.pubads().getSlots)) {
    return true;
  }
}
function isApnGetTagDefined() {
  if (window.apntag && isFn(window.apntag.getTag)) {
    return true;
  }
}
const sortByHighestCpm = (a, b) => {
  return b.cpm - a.cpm;
};

/**
 * Fisherâ€“Yates shuffle
 * http://stackoverflow.com/a/6274398
 * https://bost.ocks.org/mike/shuffle/
 * istanbul ignore next
 */
function shuffle(array) {
  let counter = array.length;

  // while there are elements in the array
  while (counter > 0) {
    // pick a random index
    let index = Math.floor(Math.random() * counter);

    // decrease counter by 1
    counter--;

    // and swap the last element with it
    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }
  return array;
}
function deepClone(obj) {
  return (0,klona_json__WEBPACK_IMPORTED_MODULE_4__.klona)(obj) || {};
}
function inIframe() {
  try {
    return internal.getWindowSelf() !== internal.getWindowTop();
  } catch (e) {
    return true;
  }
}

/**
 * https://iabtechlab.com/wp-content/uploads/2016/03/SafeFrames_v1.1_final.pdf
 */
function isSafeFrameWindow() {
  if (!inIframe()) {
    return false;
  }
  const ws = internal.getWindowSelf();
  return !!(ws.$sf && ws.$sf.ext);
}

/**
 * Returns the result of calling the function $sf.ext.geom() if it exists
 * @see https://iabtechlab.com/wp-content/uploads/2016/03/SafeFrames_v1.1_final.pdf â€” 5.4 Function $sf.ext.geom
 * @returns {Object | undefined} geometric information about the container
 */
function getSafeframeGeometry() {
  try {
    const ws = getWindowSelf();
    return typeof ws.$sf.ext.geom === 'function' ? ws.$sf.ext.geom() : undefined;
  } catch (e) {
    logError('Error getting SafeFrame geometry', e);
    return undefined;
  }
}
function isSafariBrowser() {
  return /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
}
function replaceMacros(str, subs) {
  if (!str) return;
  return Object.entries(subs).reduce((str, _ref4) => {
    let [key, val] = _ref4;
    return str.replace(new RegExp('\\$\\{' + key + '\\}', 'g'), val || '');
  }, str);
}
function replaceAuctionPrice(str, cpm) {
  return replaceMacros(str, {
    AUCTION_PRICE: cpm
  });
}
function replaceClickThrough(str, clicktag) {
  if (!str || !clicktag || typeof clicktag !== 'string') return;
  return str.replace(/\${CLICKTHROUGH}/g, clicktag);
}
function timestamp() {
  return new Date().getTime();
}

/**
 * The returned value represents the time elapsed since the time origin. @see https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
 * @returns {number}
 */
function getPerformanceNow() {
  return window.performance && window.performance.now && window.performance.now() || 0;
}

/**
 * Retuns the difference between `timing.domLoading` and `timing.navigationStart`.
 * This function uses the deprecated `Performance.timing` API and should be removed in future.
 * It has not been updated yet because it is still used in some modules.
 * @deprecated
 * @param {Window} w The window object used to perform the api call. default to window.self
 * @returns {number}
 */
function getDomLoadingDuration(w) {
  let domLoadingDuration = -1;
  w = w || getWindowSelf();
  const performance = w.performance;
  if (w.performance?.timing) {
    if (w.performance.timing.navigationStart > 0) {
      const val = performance.timing.domLoading - performance.timing.navigationStart;
      if (val > 0) {
        domLoadingDuration = val;
      }
    }
  }
  return domLoadingDuration;
}

/**
 * When the deviceAccess flag config option is false, no cookies should be read or set
 * @returns {boolean}
 */
function hasDeviceAccess() {
  return _config_js__WEBPACK_IMPORTED_MODULE_2__.config.getConfig('deviceAccess') !== false;
}

/**
 * @returns {(boolean|undefined)}
 */
function checkCookieSupport() {
  // eslint-disable-next-line prebid/no-member
  if (window.navigator.cookieEnabled || !!document.cookie.length) {
    return true;
  }
}

/**
 * Given a function, return a function which only executes the original after
 * it's been called numRequiredCalls times.
 *
 * Note that the arguments from the previous calls will *not* be forwarded to the original function.
 * Only the final call's arguments matter.
 *
 * @param {function} func The function which should be executed, once the returned function has been executed
 *   numRequiredCalls times.
 * @param {number} numRequiredCalls The number of times which the returned function needs to be called before
 *   func is.
 */
function delayExecution(func, numRequiredCalls) {
  if (numRequiredCalls < 1) {
    throw new Error(`numRequiredCalls must be a positive number. Got ${numRequiredCalls}`);
  }
  let numCalls = 0;
  return function () {
    numCalls++;
    if (numCalls === numRequiredCalls) {
      func.apply(this, arguments);
    }
  };
}

/**
 * https://stackoverflow.com/a/34890276/428704
 * @param {Array} xs
 * @param {string} key
 * @returns {Object} {${key_value}: ${groupByArray}, key_value: {groupByArray}}
 */
function groupBy(xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}

/**
 * Build an object consisting of only defined parameters to avoid creating an
 * object with defined keys and undefined values.
 * @param {Object} object The object to pick defined params out of
 * @param {string[]} params An array of strings representing properties to look for in the object
 * @returns {Object} An object containing all the specified values that are defined
 */
function getDefinedParams(object, params) {
  return params.filter(param => object[param]).reduce((bid, param) => Object.assign(bid, {
    [param]: object[param]
  }), {});
}

/**
 * @typedef {Object} MediaTypes
 * @property {Object} banner banner configuration
 * @property {Object} native native configuration
 * @property {Object} video video configuration
 */

/**
 * Validates an adunit's `mediaTypes` parameter
 * @param {MediaTypes} mediaTypes mediaTypes parameter to validate
 * @return {boolean} If object is valid
 */
function isValidMediaTypes(mediaTypes) {
  const SUPPORTED_MEDIA_TYPES = ['banner', 'native', 'video'];
  const SUPPORTED_STREAM_TYPES = ['instream', 'outstream', 'adpod'];
  const types = Object.keys(mediaTypes);
  if (!types.every(type => (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_5__.includes)(SUPPORTED_MEDIA_TYPES, type))) {
    return false;
  }
  if ( true && mediaTypes.video && mediaTypes.video.context) {
    return (0,_polyfill_js__WEBPACK_IMPORTED_MODULE_5__.includes)(SUPPORTED_STREAM_TYPES, mediaTypes.video.context);
  }
  return true;
}

/**
 * Returns user configured bidder params from adunit
 * @param {Object} adUnits
 * @param {string} adUnitCode code
 * @param {string} bidder code
 * @return {Array} user configured param for the given bidder adunit configuration
 */
function getUserConfiguredParams(adUnits, adUnitCode, bidder) {
  return adUnits.filter(adUnit => adUnit.code === adUnitCode).flatMap(adUnit => adUnit.bids).filter(bidderData => bidderData.bidder === bidder).map(bidderData => bidderData.params || {});
}

/**
 * Returns Do Not Track state
 */
function getDNT() {
  return navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1' || navigator.doNotTrack === 'yes';
}
const compareCodeAndSlot = (slot, adUnitCode) => slot.getAdUnitPath() === adUnitCode || slot.getSlotElementId() === adUnitCode;

/**
 * Returns filter function to match adUnitCode in slot
 * @param {Object} slot GoogleTag slot
 * @return {function} filter function
 */
function isAdUnitCodeMatchingSlot(slot) {
  return adUnitCode => compareCodeAndSlot(slot, adUnitCode);
}

/**
 * Constructs warning message for when unsupported bidders are dropped from an adunit
 * @param {Object} adUnit ad unit from which the bidder is being dropped
 * @param {string} bidder bidder code that is not compatible with the adUnit
 * @return {string} warning message to display when condition is met
 */
function unsupportedBidderMessage(adUnit, bidder) {
  const mediaType = Object.keys(adUnit.mediaTypes || {
    'banner': 'banner'
  }).join(', ');
  return `
    ${adUnit.code} is a ${mediaType} ad unit
    containing bidders that don't support ${mediaType}: ${bidder}.
    This bidder won't fetch demand.
  `;
}

/**
 * Checks input is integer or not
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
 * @param {*} value
 */
const isInteger = Number.isInteger.bind(Number);

/**
 * Returns a new object with undefined properties removed from given object
 * @param obj the object to clean
 */
function cleanObj(obj) {
  return Object.fromEntries(Object.entries(obj).filter(_ref5 => {
    let [_, v] = _ref5;
    return typeof v !== 'undefined';
  }));
}

/**
 * Create a new object with selected properties.  Also allows property renaming and transform functions.
 * @param obj the original object
 * @param properties An array of desired properties
 */
function pick(obj, properties) {
  if (typeof obj !== 'object') {
    return {};
  }
  return properties.reduce((newObj, prop, i) => {
    if (typeof prop === 'function') {
      return newObj;
    }
    let newProp = prop;
    let match = prop.match(/^(.+?)\sas\s(.+?)$/i);
    if (match) {
      prop = match[1];
      newProp = match[2];
    }
    let value = obj[prop];
    if (typeof properties[i + 1] === 'function') {
      value = properties[i + 1](value, newObj);
    }
    if (typeof value !== 'undefined') {
      newObj[newProp] = value;
    }
    return newObj;
  }, {});
}
function isArrayOfNums(val, size) {
  return isArray(val) && (size ? val.length === size : true) && val.every(v => isInteger(v));
}
function parseQS(query) {
  return !query ? {} : query.replace(/^\?/, '').split('&').reduce((acc, criteria) => {
    let [k, v] = criteria.split('=');
    if (/\[\]$/.test(k)) {
      k = k.replace('[]', '');
      acc[k] = acc[k] || [];
      acc[k].push(v);
    } else {
      acc[k] = v || '';
    }
    return acc;
  }, {});
}
function formatQS(query) {
  return Object.keys(query).map(k => Array.isArray(query[k]) ? query[k].map(v => `${k}[]=${v}`).join('&') : `${k}=${query[k]}`).join('&');
}
function parseUrl(url, options) {
  let parsed = document.createElement('a');
  if (options && 'noDecodeWholeURL' in options && options.noDecodeWholeURL) {
    parsed.href = url;
  } else {
    parsed.href = decodeURIComponent(url);
  }
  // in window.location 'search' is string, not object
  let qsAsString = options && 'decodeSearchAsString' in options && options.decodeSearchAsString;
  return {
    href: parsed.href,
    protocol: (parsed.protocol || '').replace(/:$/, ''),
    hostname: parsed.hostname,
    port: +parsed.port,
    pathname: parsed.pathname.replace(/^(?!\/)/, '/'),
    search: qsAsString ? parsed.search : internal.parseQS(parsed.search || ''),
    hash: (parsed.hash || '').replace(/^#/, ''),
    host: parsed.host || window.location.host
  };
}
function buildUrl(obj) {
  return (obj.protocol || 'http') + '://' + (obj.host || obj.hostname + (obj.port ? `:${obj.port}` : '')) + (obj.pathname || '') + (obj.search ? `?${internal.formatQS(obj.search || '')}` : '') + (obj.hash ? `#${obj.hash}` : '');
}

/**
 * This function deeply compares two objects checking for their equivalence.
 * @param {Object} obj1
 * @param {Object} obj2
 * @param {Object} [options] - Options for comparison.
 * @param {boolean} [options.checkTypes=false] - If set, two objects with identical properties but different constructors will *not* be considered equivalent.
 * @returns {boolean} - Returns `true` if the objects are equivalent, `false` otherwise.
 */
function deepEqual(obj1, obj2) {
  let {
    checkTypes = false
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  if (obj1 === obj2) return true;else if (typeof obj1 === 'object' && obj1 !== null && typeof obj2 === 'object' && obj2 !== null && (!checkTypes || obj1.constructor === obj2.constructor)) {
    const props1 = Object.keys(obj1);
    if (props1.length !== Object.keys(obj2).length) return false;
    for (let prop of props1) {
      if (obj2.hasOwnProperty(prop)) {
        if (!deepEqual(obj1[prop], obj2[prop], {
          checkTypes
        })) {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}
function mergeDeep(target) {
  for (var _len2 = arguments.length, sources = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    sources[_key2 - 1] = arguments[_key2];
  }
  if (!sources.length) return target;
  const source = sources.shift();
  if (isPlainObject(target) && isPlainObject(source)) {
    for (const key in source) {
      if (isPlainObject(source[key])) {
        if (!target[key]) Object.assign(target, {
          [key]: {}
        });
        mergeDeep(target[key], source[key]);
      } else if (isArray(source[key])) {
        if (!target[key]) {
          Object.assign(target, {
            [key]: [...source[key]]
          });
        } else if (isArray(target[key])) {
          source[key].forEach(obj => {
            let addItFlag = 1;
            for (let i = 0; i < target[key].length; i++) {
              if (deepEqual(target[key][i], obj)) {
                addItFlag = 0;
                break;
              }
            }
            if (addItFlag) {
              target[key].push(obj);
            }
          });
        }
      } else {
        Object.assign(target, {
          [key]: source[key]
        });
      }
    }
  }
  return mergeDeep(target, ...sources);
}

/**
 * returns a hash of a string using a fast algorithm
 * source: https://stackoverflow.com/a/52171480/845390
 * @param str
 * @param seed (optional)
 * @returns {string}
 */
function cyrb53Hash(str) {
  let seed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  // IE doesn't support imul
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul#Polyfill
  let imul = function (opA, opB) {
    if (isFn(Math.imul)) {
      return Math.imul(opA, opB);
    } else {
      opB |= 0; // ensure that opB is an integer. opA will automatically be coerced.
      // floating points give us 53 bits of precision to work with plus 1 sign bit
      // automatically handled for our convienence:
      // 1. 0x003fffff /*opA & 0x000fffff*/ * 0x7fffffff /*opB*/ = 0x1fffff7fc00001
      //    0x1fffff7fc00001 < Number.MAX_SAFE_INTEGER /*0x1fffffffffffff*/
      var result = (opA & 0x003fffff) * opB;
      // 2. We can remove an integer coersion from the statement above because:
      //    0x1fffff7fc00001 + 0xffc00000 = 0x1fffffff800001
      //    0x1fffffff800001 < Number.MAX_SAFE_INTEGER /*0x1fffffffffffff*/
      if (opA & 0xffc00000) result += (opA & 0xffc00000) * opB | 0;
      return result | 0;
    }
  };
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = imul(h1 ^ ch, 2654435761);
    h2 = imul(h2 ^ ch, 1597334677);
  }
  h1 = imul(h1 ^ h1 >>> 16, 2246822507) ^ imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = imul(h2 ^ h2 >>> 16, 2246822507) ^ imul(h1 ^ h1 >>> 13, 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString();
}

/**
 * returns the result of `JSON.parse(data)`, or undefined if that throws an error.
 * @param data
 * @returns {any}
 */
function safeJSONParse(data) {
  try {
    return JSON.parse(data);
  } catch (e) {}
}
function safeJSONEncode(data) {
  try {
    return JSON.stringify(data);
  } catch (e) {
    return '';
  }
}

/**
 * Returns a memoized version of `fn`.
 *
 * @param fn
 * @param key cache key generator, invoked with the same arguments passed to `fn`.
 *        By default, the first argument is used as key.
 * @return {function(): any}
 */
function memoize(fn) {
  let key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (arg) {
    return arg;
  };
  const cache = new Map();
  const memoized = function () {
    const cacheKey = key.apply(this, arguments);
    if (!cache.has(cacheKey)) {
      cache.set(cacheKey, fn.apply(this, arguments));
    }
    return cache.get(cacheKey);
  };
  memoized.clear = cache.clear.bind(cache);
  return memoized;
}

/**
 * Returns a Unix timestamp for given time value and unit.
 * @param {number} timeValue numeric value, defaults to 0 (which means now)
 * @param {string} timeUnit defaults to days (or 'd'), use 'm' for minutes. Any parameter that isn't 'd' or 'm' will return Date.now().
 * @returns {number}
 */
function getUnixTimestampFromNow() {
  let timeValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  let timeUnit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'd';
  const acceptableUnits = ['m', 'd'];
  if (acceptableUnits.indexOf(timeUnit) < 0) {
    return Date.now();
  }
  const multiplication = timeValue / (timeUnit === 'm' ? 1440 : 1);
  return Date.now() + (timeValue && timeValue > 0 ? 1000 * 60 * 60 * 24 * multiplication : 0);
}

/**
 * Converts given object into an array, so {key: 1, anotherKey: 'fred', third: ['fred']} is turned
 * into [{key: 1}, {anotherKey: 'fred'}, {third: ['fred']}]
 * @param {Object} obj the object
 * @returns {Array}
 */
function convertObjectToArray(obj) {
  return Object.keys(obj).map(key => {
    return {
      [key]: obj[key]
    };
  });
}

/**
 * Sets dataset attributes on a script
 * @param {HTMLScriptElement} script
 * @param {object} attributes
 */
function setScriptAttributes(script, attributes) {
  Object.entries(attributes).forEach(_ref6 => {
    let [k, v] = _ref6;
    return script.setAttribute(k, v);
  });
}

/**
 * Perform a binary search for `el` on an ordered array `arr`.
 *
 * @returns the lowest nonnegative integer I that satisfies:
 *   key(arr[i]) >= key(el) for each i between I and arr.length
 *
 *   (if one or more matches are found for `el`, returns the index of the first;
 *   if the element is not found, return the index of the first element that's greater;
 *   if no greater element exists, return `arr.length`)
 */
function binarySearch(arr, el) {
  let key = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : el => el;
  let left = 0;
  let right = arr.length && arr.length - 1;
  const target = key(el);
  while (right - left > 1) {
    const middle = left + Math.round((right - left) / 2);
    if (target > key(arr[middle])) {
      left = middle;
    } else {
      right = middle;
    }
  }
  while (arr.length > left && target > key(arr[left])) {
    left++;
  }
  return left;
}

/**
 * Checks if an object has non-serializable properties.
 * Non-serializable properties are functions and RegExp objects.
 *
 * @param {Object} obj - The object to check.
 * @param {Set} checkedObjects - A set of properties that have already been checked.
 * @returns {boolean} - Returns true if the object has non-serializable properties, false otherwise.
 */
function hasNonSerializableProperty(obj) {
  let checkedObjects = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Set();
  for (const key in obj) {
    const value = obj[key];
    const type = typeof value;
    if (value === undefined || type === 'function' || type === 'symbol' || value instanceof RegExp || value instanceof Map || value instanceof Set || value instanceof Date || value !== null && type === 'object' && value.hasOwnProperty('toJSON')) {
      return true;
    }
    if (value !== null && type === 'object' && value.constructor === Object) {
      if (checkedObjects.has(value)) {
        // circular reference, means we have a non-serializable property
        return true;
      }
      checkedObjects.add(value);
      if (hasNonSerializableProperty(value, checkedObjects)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Returns the value of a nested property in an array of objects.
 *
 * @param {Array} collection - Array of objects.
 * @param {String} key - Key of nested property.
 * @returns {any, undefined} - Value of nested property.
 */
function setOnAny(collection, key) {
  for (let i = 0, result; i < collection.length; i++) {
    result = (0,dlv_index_js__WEBPACK_IMPORTED_MODULE_6__["default"])(collection[i], key);
    if (result) {
      return result;
    }
  }
  return undefined;
}
function extractDomainFromHost(pageHost) {
  let domain = null;
  try {
    let domains = /[-\w]+\.([-\w]+|[-\w]{3,}|[-\w]{1,3}\.[-\w]{2})$/i.exec(pageHost);
    if (domains != null && domains.length > 0) {
      domain = domains[0];
      for (let i = 1; i < domains.length; i++) {
        if (domains[i].length > domain.length) {
          domain = domains[i];
        }
      }
    }
  } catch (e) {
    domain = null;
  }
  return domain;
}
function triggerNurlWithCpm(bid, cpm) {
  if (isStr(bid.nurl) && bid.nurl !== '') {
    bid.nurl = bid.nurl.replace(/\${AUCTION_PRICE}/, cpm);
    triggerPixel(bid.nurl);
  }
}

/***/ }),

/***/ "./src/utils/cpm.js":
/*!**************************!*\
  !*** ./src/utils/cpm.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   adjustCpm: () => (/* binding */ adjustCpm)
/* harmony export */ });
/* harmony import */ var _auctionManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../auctionManager.js */ "./src/auctionManager.js");
/* harmony import */ var _bidderSettings_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../bidderSettings.js */ "./src/bidderSettings.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils.js */ "./src/utils.js");



function adjustCpm(cpm, bidResponse, bidRequest) {
  let {
    index = _auctionManager_js__WEBPACK_IMPORTED_MODULE_0__.auctionManager.index,
    bs = _bidderSettings_js__WEBPACK_IMPORTED_MODULE_1__.bidderSettings
  } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  bidRequest = bidRequest || index.getBidRequest(bidResponse);
  const adapterCode = bidResponse?.adapterCode;
  const bidderCode = bidResponse?.bidderCode || bidRequest?.bidder;
  const adjustAlternateBids = bs.get(bidResponse?.adapterCode, 'adjustAlternateBids');
  const bidCpmAdjustment = bs.getOwn(bidderCode, 'bidCpmAdjustment') || bs.get(adjustAlternateBids ? adapterCode : bidderCode, 'bidCpmAdjustment');
  if (bidCpmAdjustment && typeof bidCpmAdjustment === 'function') {
    try {
      return bidCpmAdjustment(cpm, Object.assign({}, bidResponse), bidRequest);
    } catch (e) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.logError)('Error during bid adjustment', e);
    }
  }
  return cpm;
}

/***/ }),

/***/ "./src/utils/focusTimeout.js":
/*!***********************************!*\
  !*** ./src/utils/focusTimeout.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setFocusTimeout: () => (/* binding */ setFocusTimeout)
/* harmony export */ });
/* unused harmony export reset */
let outOfFocusStart = null; // enforce null otherwise it could be undefined and the callback wouldn't execute
let timeOutOfFocus = 0;
let suspendedTimeouts = [];
function trackTimeOutOfFocus() {
  if (document.hidden) {
    outOfFocusStart = Date.now();
  } else {
    timeOutOfFocus += Date.now() - (outOfFocusStart ?? 0); // when the page is loaded in hidden state outOfFocusStart is undefined, which results in timeoutOffset being NaN
    outOfFocusStart = null;
    suspendedTimeouts.forEach(_ref => {
      let {
        callback,
        startTime,
        setTimerId
      } = _ref;
      return setTimerId(setFocusTimeout(callback, timeOutOfFocus - startTime)());
    });
    suspendedTimeouts = [];
  }
}
document.addEventListener('visibilitychange', trackTimeOutOfFocus);
function reset() {
  outOfFocusStart = null;
  timeOutOfFocus = 0;
  suspendedTimeouts = [];
  document.removeEventListener('visibilitychange', trackTimeOutOfFocus);
  document.addEventListener('visibilitychange', trackTimeOutOfFocus);
}

/**
 * Wraps native setTimeout function in order to count time only when page is focused
 *
 * @param {function(*): ()} [callback] - A function that will be invoked after passed time
 * @param {number} [milliseconds] - Minimum duration (in milliseconds) that the callback will be executed after
 * @returns {function(*): (number)} - Getter function for current timer id
 */
function setFocusTimeout(callback, milliseconds) {
  const startTime = timeOutOfFocus;
  let timerId = setTimeout(() => {
    if (timeOutOfFocus === startTime && outOfFocusStart == null) {
      callback();
    } else if (outOfFocusStart != null) {
      // case when timeout ended during page is out of focus
      suspendedTimeouts.push({
        callback,
        startTime,
        setTimerId(newId) {
          timerId = newId;
        }
      });
    } else {
      timerId = setFocusTimeout(callback, timeOutOfFocus - startTime)();
    }
  }, milliseconds);
  return () => timerId;
}

/***/ }),

/***/ "./src/utils/ipUtils.js":
/*!******************************!*\
  !*** ./src/utils/ipUtils.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   scrubIPv4: () => (/* binding */ scrubIPv4),
/* harmony export */   scrubIPv6: () => (/* binding */ scrubIPv6)
/* harmony export */ });
function scrubIPv4(ip) {
  if (!ip) {
    return null;
  }
  const ones = 24;
  let ipParts = ip.split('.').map(Number);
  if (ipParts.length != 4) {
    return null;
  }
  let mask = [];
  for (let i = 0; i < 4; i++) {
    let n = Math.max(0, Math.min(8, ones - i * 8));
    mask.push(0xff << 8 - n & 0xff);
  }
  let maskedIP = ipParts.map((part, i) => part & mask[i]);
  return maskedIP.join('.');
}
function scrubIPv6(ip) {
  if (!ip) {
    return null;
  }
  const ones = 64;
  let ipParts = ip.split(':').map(part => parseInt(part, 16));
  ipParts = ipParts.map(part => isNaN(part) ? 0 : part);
  while (ipParts.length < 8) {
    ipParts.push(0);
  }
  if (ipParts.length != 8) {
    return null;
  }
  let mask = [];
  for (let i = 0; i < 8; i++) {
    let n = Math.max(0, Math.min(16, ones - i * 16));
    mask.push(0xffff << 16 - n & 0xffff);
  }
  let maskedIP = ipParts.map((part, i) => part & mask[i]);
  return maskedIP.map(part => part.toString(16)).join(':');
}

/***/ }),

/***/ "./src/utils/perfMetrics.js":
/*!**********************************!*\
  !*** ./src/utils/perfMetrics.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   newMetrics: () => (/* binding */ newMetrics),
/* harmony export */   timedAuctionHook: () => (/* binding */ timedAuctionHook),
/* harmony export */   useMetrics: () => (/* binding */ useMetrics)
/* harmony export */ });
/* unused harmony exports CONFIG_TOGGLE, metricsFactory, hookTimer, timedBidResponseHook */
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config.js */ "./src/config.js");

const CONFIG_TOGGLE = 'performanceMetrics';
const getTime = window.performance && window.performance.now ? () => window.performance.now() : () => Date.now();
const NODES = new WeakMap();
function metricsFactory() {
  let {
    now = getTime,
    mkNode = makeNode,
    mkTimer = makeTimer,
    mkRenamer = rename => rename,
    nodes = NODES
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return function newMetrics() {
    function makeMetrics(self) {
      let rename = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : n => ({
        forEach(fn) {
          fn(n);
        }
      });
      rename = mkRenamer(rename);
      function accessor(slot) {
        return function (name) {
          return self.dfWalk({
            visit(edge, node) {
              const obj = node[slot];
              if (obj.hasOwnProperty(name)) {
                return obj[name];
              }
            }
          });
        };
      }
      const getTimestamp = accessor('timestamps');

      /**
       * Register a metric.
       *
       * @param name metric name
       * @param value metric valiue
       */
      function setMetric(name, value) {
        const names = rename(name);
        self.dfWalk({
          follow(inEdge, outEdge) {
            return outEdge.propagate && (!inEdge || !inEdge.stopPropagation);
          },
          visit(edge, node) {
            names.forEach(name => {
              if (edge == null) {
                node.metrics[name] = value;
              } else {
                if (!node.groups.hasOwnProperty(name)) {
                  node.groups[name] = [];
                }
                node.groups[name].push(value);
              }
            });
          }
        });
      }

      /**
       * Mark the current time as a checkpoint with the given name, to be referenced later
       * by `timeSince` or `timeBetween`.
       *
       * @param name checkpoint name
       */
      function checkpoint(name) {
        self.timestamps[name] = now();
      }

      /**
       * Get the tame passed since `checkpoint`, and optionally save it as a metric.
       *
       * @param {string} checkpoint checkpoint name
       * @param {string} [metric] - The name of the metric to save. Optional.
       * @returns {number|null} - The time in milliseconds between now and the checkpoint, or `null` if the checkpoint is not found.
       */
      function timeSince(checkpoint, metric) {
        const ts = getTimestamp(checkpoint);
        const elapsed = ts != null ? now() - ts : null;
        if (metric != null) {
          setMetric(metric, elapsed);
        }
        return elapsed;
      }

      /**
       * Get the time passed between `startCheckpoint` and `endCheckpoint`, optionally saving it as a metric.
       *
       * @param {string} startCheckpoint - The name of the starting checkpoint.
       * @param {string} endCheckpoint - The name of the ending checkpoint.
       * @param {string} [metric] - The name of the metric to save. Optional.
       * @returns {number|null} - The time in milliseconds between `startCheckpoint` and `endCheckpoint`, or `null` if either checkpoint is not found.
       */
      function timeBetween(startCheckpoint, endCheckpoint, metric) {
        const start = getTimestamp(startCheckpoint);
        const end = getTimestamp(endCheckpoint);
        const elapsed = start != null && end != null ? end - start : null;
        if (metric != null) {
          setMetric(metric, elapsed);
        }
        return elapsed;
      }

      /**
       * A function that, when called, stops a time measure and saves it as a metric.
       *
       * @typedef {function(): void} MetricsTimer
       * @template {function} F
       * @property {function(F): F} stopBefore returns a wrapper around the given function that begins by
       *   stopping this time measure.
       * @property {function(F): F} stopAfter returns a wrapper around the given function that ends by
       *   stopping this time measure.
       */

      /**
       * Start measuring a time metric with the given name.
       *
       * @param name metric name
       * @return {MetricsTimer}
       */
      function startTiming(name) {
        return mkTimer(now, val => setMetric(name, val));
      }

      /**
       * Run fn and measure the time spent in it.
       *
       * @template T
       * @param name the name to use for the measured time metric
       * @param {function(): T} fn
       * @return {T} the return value of `fn`
       */
      function measureTime(name, fn) {
        return startTiming(name).stopAfter(fn)();
      }

      /**
       * @typedef {Function} HookFn
       * @property {Function(T): void} bail
       *
       * @template T
       * @typedef {HookFn} TimedHookFn
       * @property {Function(): void} stopTiming
       * @property {T} untimed
       */

      /**
       * Convenience method for measuring time spent in a `.before` or `.after` hook.
       *
       * @template T
       * @param {string} name - The metric name.
       * @param {HookFn} next - The hook's `next` (first) argument.
       * @param {function(TimedHookFn): T} fn - A function that will be run immediately; it takes `next`,
       *    where both `next` and `next.bail` automatically
       *    call `stopTiming` before continuing with the original hook.
       * @return {T} - The return value of `fn`.
       */
      function measureHookTime(name, next, fn) {
        const stopTiming = startTiming(name);
        return fn(function (orig) {
          const next = stopTiming.stopBefore(orig);
          next.bail = orig.bail && stopTiming.stopBefore(orig.bail);
          next.stopTiming = stopTiming;
          next.untimed = orig;
          return next;
        }(next));
      }

      /**
       * Get all registered metrics.
       * @return {{}}
       */
      function getMetrics() {
        let result = {};
        self.dfWalk({
          visit(edge, node) {
            result = Object.assign({}, !edge || edge.includeGroups ? node.groups : null, node.metrics, result);
          }
        });
        return result;
      }

      /**
       * Create and return a new metrics object that starts as a view on all metrics registered here,
       * and - by default - also propagates all new metrics here.
       *
       * Propagated metrics are grouped together, and intended for repeated operations. For example, with the following:
       *
       * ```
       * const metrics = newMetrics();
       * const requests = metrics.measureTime('buildRequests', buildRequests)
       * requests.forEach((req) => {
       *   const requestMetrics = metrics.fork();
       *   requestMetrics.measureTime('processRequest', () => processRequest(req);
       * })
       * ```
       *
       * if `buildRequests` takes 10ms and returns 3 objects, which respectively take 100, 200, and 300ms in `processRequest`, then
       * the final `metrics.getMetrics()` would be:
       *
       * ```
       * {
       *    buildRequests: 10,
       *    processRequest: [100, 200, 300]
       * }
       * ```
       *
       * while the inner `requestMetrics.getMetrics()` would be:
       *
       * ```
       * {
       *   buildRequests: 10,
       *   processRequest: 100 // or 200 for the 2nd loop, etc
       * }
       * ```
       *
       *
       * @param {Object} [options={}] - Options for forking the metrics.
       * @param {boolean} [options.propagate=true] - If false, the forked metrics will not be propagated here.
       * @param {boolean} [options.stopPropagation=false] - If true, propagation from the new metrics is stopped here, instead of
       *   continuing up the chain (if for example these metrics were themselves created through `.fork()`).
       * @param {boolean} [options.includeGroups=false] - If true, the forked metrics will also replicate metrics that were propagated
       *   here from elsewhere. For example:
       *   ```
       *   const metrics = newMetrics();
       *   const op1 = metrics.fork();
       *   const withoutGroups = metrics.fork();
       *   const withGroups = metrics.fork({includeGroups: true});
       *   op1.setMetric('foo', 'bar');
       *   withoutGroups.getMetrics() // {}
       *   withGroups.getMetrics() // {foo: ['bar']}
       *   ```
       * @returns {Object} - The new metrics object.
       */
      function fork() {
        let {
          propagate = true,
          stopPropagation = false,
          includeGroups = false
        } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        return makeMetrics(mkNode([[self, {
          propagate,
          stopPropagation,
          includeGroups
        }]]), rename);
      }

      /**
       * Join `otherMetrics` with these; all metrics from `otherMetrics` will (by default) be propagated here,
       * and all metrics from here will be included in `otherMetrics`.
       *
       * `propagate`, `stopPropagation` and `includeGroups` have the same semantics as in `.fork()`.
       */
      function join(otherMetrics) {
        let {
          propagate = true,
          stopPropagation = false,
          includeGroups = false
        } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        const other = nodes.get(otherMetrics);
        if (other != null) {
          other.addParent(self, {
            propagate,
            stopPropagation,
            includeGroups
          });
        }
      }

      /**
       * return a version of these metrics where all new metrics are renamed according to `renameFn`.
       *
       * @param {function(String): Array[String]} renameFn
       */
      function renameWith(renameFn) {
        return makeMetrics(self, renameFn);
      }

      /**
       * Create a new metrics object that uses the same propagation and renaming rules as this one.
       */
      function newMetrics() {
        return makeMetrics(self.newSibling(), rename);
      }
      const metrics = {
        startTiming,
        measureTime,
        measureHookTime,
        checkpoint,
        timeSince,
        timeBetween,
        setMetric,
        getMetrics,
        fork,
        join,
        newMetrics,
        renameWith,
        toJSON() {
          return getMetrics();
        }
      };
      nodes.set(metrics, self);
      return metrics;
    }
    return makeMetrics(mkNode([]));
  };
}
function wrapFn(fn, before, after) {
  return function () {
    before && before();
    try {
      return fn.apply(this, arguments);
    } finally {
      after && after();
    }
  };
}
function makeTimer(now, cb) {
  const start = now();
  let done = false;
  function stopTiming() {
    if (!done) {
      // eslint-disable-next-line standard/no-callback-literal
      cb(now() - start);
      done = true;
    }
  }
  stopTiming.stopBefore = fn => wrapFn(fn, stopTiming);
  stopTiming.stopAfter = fn => wrapFn(fn, null, stopTiming);
  return stopTiming;
}
function makeNode(parents) {
  return {
    metrics: {},
    timestamps: {},
    groups: {},
    addParent(node, edge) {
      parents.push([node, edge]);
    },
    newSibling() {
      return makeNode(parents.slice());
    },
    dfWalk() {
      let {
        visit,
        follow = () => true,
        visited = new Set(),
        inEdge
      } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      let res;
      if (!visited.has(this)) {
        visited.add(this);
        res = visit(inEdge, this);
        if (res != null) return res;
        for (const [parent, outEdge] of parents) {
          if (follow(inEdge, outEdge)) {
            res = parent.dfWalk({
              visit,
              follow,
              visited,
              inEdge: outEdge
            });
            if (res != null) return res;
          }
        }
      }
    }
  };
}
const nullMetrics = (() => {
  const nop = function () {};
  const empty = () => ({});
  const none = {
    forEach: nop
  };
  const nullTimer = () => null;
  nullTimer.stopBefore = fn => fn;
  nullTimer.stopAfter = fn => fn;
  const nullNode = Object.defineProperties({
    dfWalk: nop,
    newSibling: () => nullNode,
    addParent: nop
  }, Object.fromEntries(['metrics', 'timestamps', 'groups'].map(prop => [prop, {
    get: empty
  }])));
  return metricsFactory({
    now: () => 0,
    mkNode: () => nullNode,
    mkRenamer: () => () => none,
    mkTimer: () => nullTimer,
    nodes: {
      get: nop,
      set: nop
    }
  })();
})();
let enabled = true;
_config_js__WEBPACK_IMPORTED_MODULE_0__.config.getConfig(CONFIG_TOGGLE, cfg => {
  enabled = !!cfg[CONFIG_TOGGLE];
});

/**
 * convenience fallback function for metrics that may be undefined, especially during tests.
 */
function useMetrics(metrics) {
  return enabled && metrics || nullMetrics;
}
const newMetrics = (() => {
  const makeMetrics = metricsFactory();
  return function () {
    return enabled ? makeMetrics() : nullMetrics;
  };
})();
function hookTimer(prefix, getMetrics) {
  return function (name, hookFn) {
    return function (next) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      const that = this;
      return useMetrics(getMetrics.apply(that, args)).measureHookTime(prefix + name, next, function (next) {
        return hookFn.call(that, next, ...args);
      });
    };
  };
}
const timedAuctionHook = hookTimer('requestBids.', req => req.metrics);
const timedBidResponseHook = hookTimer('addBidResponse.', (_, bid) => bid.metrics);

/***/ }),

/***/ "./src/utils/promise.js":
/*!******************************!*\
  !*** ./src/utils/promise.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GreedyPromise: () => (/* binding */ GreedyPromise),
/* harmony export */   defer: () => (/* binding */ defer)
/* harmony export */ });
const SUCCESS = 0;
const FAIL = 1;

/**
 * A version of Promise that runs callbacks synchronously when it can (i.e. after it's been fulfilled or rejected).
 */
class GreedyPromise {
  #result;
  #callbacks;

  /**
   * Convenience wrapper for setTimeout; takes care of returning an already fulfilled GreedyPromise when the delay is zero.
   *
   * @param {Number} delayMs delay in milliseconds
   * @returns {GreedyPromise} a promise that resolves (to undefined) in `delayMs` milliseconds
   */
  static timeout() {
    let delayMs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    return new GreedyPromise(resolve => {
      delayMs === 0 ? resolve() : setTimeout(resolve, delayMs);
    });
  }
  constructor(resolver) {
    if (typeof resolver !== 'function') {
      throw new Error('resolver not a function');
    }
    const result = [];
    const callbacks = [];
    let [resolve, reject] = [SUCCESS, FAIL].map(type => {
      return function (value) {
        if (type === SUCCESS && typeof value?.then === 'function') {
          value.then(resolve, reject);
        } else if (!result.length) {
          result.push(type, value);
          while (callbacks.length) callbacks.shift()();
        }
      };
    });
    try {
      resolver(resolve, reject);
    } catch (e) {
      reject(e);
    }
    this.#result = result;
    this.#callbacks = callbacks;
  }
  then(onSuccess, onError) {
    const result = this.#result;
    return new this.constructor((resolve, reject) => {
      const continuation = () => {
        let value = result[1];
        let [handler, resolveFn] = result[0] === SUCCESS ? [onSuccess, resolve] : [onError, reject];
        if (typeof handler === 'function') {
          try {
            value = handler(value);
          } catch (e) {
            reject(e);
            return;
          }
          resolveFn = resolve;
        }
        resolveFn(value);
      };
      result.length ? continuation() : this.#callbacks.push(continuation);
    });
  }
  catch(onError) {
    return this.then(null, onError);
  }
  finally(onFinally) {
    let val;
    return this.then(v => {
      val = v;
      return onFinally();
    }, e => {
      val = this.constructor.reject(e);
      return onFinally();
    }).then(() => val);
  }
  static #collect(promises, collector, done) {
    let cnt = promises.length;
    function clt() {
      collector.apply(this, arguments);
      if (--cnt <= 0 && done) done();
    }
    promises.length === 0 && done ? done() : promises.forEach((p, i) => this.resolve(p).then(val => clt(true, val, i), err => clt(false, err, i)));
  }
  static race(promises) {
    return new this((resolve, reject) => {
      this.#collect(promises, (success, result) => success ? resolve(result) : reject(result));
    });
  }
  static all(promises) {
    return new this((resolve, reject) => {
      let res = [];
      this.#collect(promises, (success, val, i) => success ? res[i] = val : reject(val), () => resolve(res));
    });
  }
  static allSettled(promises) {
    return new this(resolve => {
      let res = [];
      this.#collect(promises, (success, val, i) => res[i] = success ? {
        status: 'fulfilled',
        value: val
      } : {
        status: 'rejected',
        reason: val
      }, () => resolve(res));
    });
  }
  static resolve(value) {
    return new this(resolve => resolve(value));
  }
  static reject(error) {
    return new this((resolve, reject) => reject(error));
  }
}

/**
 * @returns a {promise, resolve, reject} trio where `promise` is resolved by calling `resolve` or `reject`.
 */
function defer() {
  let {
    promiseFactory = resolver => new GreedyPromise(resolver)
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  function invoker(delegate) {
    return val => delegate(val);
  }
  let resolveFn, rejectFn;
  return {
    promise: promiseFactory((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    }),
    resolve: invoker(resolveFn),
    reject: invoker(rejectFn)
  };
}

/***/ }),

/***/ "./src/utils/reducers.js":
/*!*******************************!*\
  !*** ./src/utils/reducers.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getHighestCpm: () => (/* binding */ getHighestCpm),
/* harmony export */   getOldestHighestCpmBid: () => (/* binding */ getOldestHighestCpmBid)
/* harmony export */ });
/* unused harmony exports simpleCompare, keyCompare, reverseCompare, tiebreakCompare, minimum, maximum, getLatestHighestCpmBid */
function simpleCompare(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
function keyCompare() {
  let key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : item => item;
  return (a, b) => simpleCompare(key(a), key(b));
}
function reverseCompare() {
  let compare = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : simpleCompare;
  return (a, b) => -compare(a, b) || 0;
}
function tiebreakCompare() {
  for (var _len = arguments.length, compares = new Array(_len), _key = 0; _key < _len; _key++) {
    compares[_key] = arguments[_key];
  }
  return function (a, b) {
    for (const cmp of compares) {
      const val = cmp(a, b);
      if (val !== 0) return val;
    }
    return 0;
  };
}
function minimum() {
  let compare = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : simpleCompare;
  return (min, item) => compare(item, min) < 0 ? item : min;
}
function maximum() {
  let compare = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : simpleCompare;
  return minimum(reverseCompare(compare));
}
const cpmCompare = keyCompare(bid => bid.cpm);
const timestampCompare = keyCompare(bid => bid.responseTimestamp);

// This function will get highest cpm value bid, in case of tie it will return the bid with lowest timeToRespond
const getHighestCpm = maximum(tiebreakCompare(cpmCompare, reverseCompare(keyCompare(bid => bid.timeToRespond))));

// This function will get the oldest hightest cpm value bid, in case of tie it will return the bid which came in first
// Use case for tie: https://github.com/prebid/Prebid.js/issues/2448
const getOldestHighestCpmBid = maximum(tiebreakCompare(cpmCompare, reverseCompare(timestampCompare)));

// This function will get the latest hightest cpm value bid, in case of tie it will return the bid which came in last
// Use case for tie: https://github.com/prebid/Prebid.js/issues/2539
const getLatestHighestCpmBid = maximum(tiebreakCompare(cpmCompare, timestampCompare));

/***/ }),

/***/ "./src/utils/ttlCollection.js":
/*!************************************!*\
  !*** ./src/utils/ttlCollection.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ttlCollection: () => (/* binding */ ttlCollection)
/* harmony export */ });
/* harmony import */ var _promise_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./promise.js */ "./src/utils/promise.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils.js */ "./src/utils.js");
/* harmony import */ var _focusTimeout_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./focusTimeout.js */ "./src/utils/focusTimeout.js");




/**
 * Create a set-like collection that automatically forgets items after a certain time.
 *
 * @param {function(*): (number|Promise<number>)} [startTime=timestamp] - A function taking an item added to this collection,
 *   and returning (a promise to) a timestamp to be used as the starting time for the item
 *   (the item will be dropped after `ttl(item)` milliseconds have elapsed since this timestamp).
 *   Defaults to the time the item was added to the collection.
 * @param {function(*): (number|void|Promise<number|void>)} [ttl=() => null] - A function taking an item added to this collection,
 *   and returning (a promise to) the duration (in milliseconds) the item should be kept in it.
 *   May return null to indicate that the item should be persisted indefinitely.
 * @param {boolean} [monotonic=false] - Set to true for better performance, but only if, given any two items A and B in this collection:
 *   if A was added before B, then:
 *     - startTime(A) + ttl(A) <= startTime(B) + ttl(B)
 *     - Promise.all([startTime(A), ttl(A)]) never resolves later than Promise.all([startTime(B), ttl(B)])
 * @param {number} [slack=5000] - Maximum duration (in milliseconds) that an item is allowed to persist
 *   once past its TTL. This is also roughly the interval between "garbage collection" sweeps.
 * @returns {Object} A set-like collection with automatic TTL expiration.
 * @returns {function(*): void} return.add - Add an item to the collection.
 * @returns {function(): void} return.clear - Clear the collection.
 * @returns {function(): Array<*>} return.toArray - Get all the items in the collection, in insertion order.
 * @returns {function(): void} return.refresh - Refresh the TTL for each item in the collection.
 * @returns {function(function(*)): function(): void} return.onExpiry - Register a callback to be run when an item has expired and is about to be
 *   removed from the collection. Returns an un-registration function
 */
function ttlCollection() {
  let {
    startTime = _utils_js__WEBPACK_IMPORTED_MODULE_0__.timestamp,
    ttl = () => null,
    monotonic = false,
    slack = 5000
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const items = new Map();
  const callbacks = [];
  const pendingPurge = [];
  const markForPurge = monotonic ? entry => pendingPurge.push(entry) : entry => pendingPurge.splice((0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.binarySearch)(pendingPurge, entry, el => el.expiry), 0, entry);
  let nextPurge, task;
  function reschedulePurge() {
    task && clearTimeout(task);
    if (pendingPurge.length > 0) {
      const now = (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.timestamp)();
      nextPurge = Math.max(now, pendingPurge[0].expiry + slack);
      task = (0,_focusTimeout_js__WEBPACK_IMPORTED_MODULE_1__.setFocusTimeout)(() => {
        const now = (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.timestamp)();
        let cnt = 0;
        for (const entry of pendingPurge) {
          if (entry.expiry > now) break;
          callbacks.forEach(cb => {
            try {
              cb(entry.item);
            } catch (e) {
              (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logError)(e);
            }
          });
          items.delete(entry.item);
          cnt++;
        }
        pendingPurge.splice(0, cnt);
        task = null;
        reschedulePurge();
      }, nextPurge - now);
    } else {
      task = null;
    }
  }
  function mkEntry(item) {
    const values = {};
    const thisCohort = currentCohort;
    let expiry;
    function update() {
      if (thisCohort === currentCohort && values.start != null && values.delta != null) {
        expiry = values.start + values.delta;
        markForPurge(entry);
        if (task == null || nextPurge > expiry + slack) {
          reschedulePurge();
        }
      }
    }
    const [init, refresh] = Object.entries({
      start: startTime,
      delta: ttl
    }).map(_ref => {
      let [field, getter] = _ref;
      let currentCall;
      return function () {
        const thisCall = currentCall = {};
        _promise_js__WEBPACK_IMPORTED_MODULE_2__.GreedyPromise.resolve(getter(item)).then(val => {
          if (thisCall === currentCall) {
            values[field] = val;
            update();
          }
        });
      };
    });
    const entry = {
      item,
      refresh,
      get expiry() {
        return expiry;
      }
    };
    init();
    refresh();
    return entry;
  }
  let currentCohort = {};
  return {
    [Symbol.iterator]: () => items.keys(),
    /**
     * Add an item to this collection.
     * @param item
     */
    add(item) {
      !items.has(item) && items.set(item, mkEntry(item));
    },
    /**
     * Clear this collection.
     */
    clear() {
      pendingPurge.length = 0;
      reschedulePurge();
      items.clear();
      currentCohort = {};
    },
    /**
     * @returns {[]} all the items in this collection, in insertion order.
     */
    toArray() {
      return Array.from(items.keys());
    },
    /**
     * Refresh the TTL for each item in this collection.
     */
    refresh() {
      pendingPurge.length = 0;
      reschedulePurge();
      for (const entry of items.values()) {
        entry.refresh();
      }
    },
    /**
     * Register a callback to be run when an item has expired and is about to be
     * removed the from the collection.
     * @param cb a callback that takes the expired item as argument
     * @return an unregistration function.
     */
    onExpiry(cb) {
      callbacks.push(cb);
      return () => {
        const idx = callbacks.indexOf(cb);
        if (idx >= 0) {
          callbacks.splice(idx, 1);
        }
      };
    }
  };
}

/***/ }),

/***/ "./src/video.js":
/*!**********************!*\
  !*** ./src/video.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   INSTREAM: () => (/* binding */ INSTREAM),
/* harmony export */   OUTSTREAM: () => (/* binding */ OUTSTREAM),
/* harmony export */   fillVideoDefaults: () => (/* binding */ fillVideoDefaults),
/* harmony export */   isValidVideoBid: () => (/* binding */ isValidVideoBid),
/* harmony export */   validateOrtbVideoFields: () => (/* binding */ validateOrtbVideoFields)
/* harmony export */ });
/* unused harmony exports ORTB_VIDEO_PARAMS, checkVideoBidSetup */
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils.js */ "./node_modules/dlv/index.js");
/* harmony import */ var _src_config_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../src/config.js */ "./src/config.js");
/* harmony import */ var _hook_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./hook.js */ "./src/hook.js");
/* harmony import */ var _auctionManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./auctionManager.js */ "./src/auctionManager.js");




const OUTSTREAM = 'outstream';
const INSTREAM = 'instream';

/**
 * List of OpenRTB 2.x video object properties with simple validators.
 * Not included: `companionad`, `durfloors`, `ext`
 * reference: https://github.com/InteractiveAdvertisingBureau/openrtb2.x/blob/main/2.6.md
 */
const ORTB_VIDEO_PARAMS = new Map([['mimes', value => Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'string')], ['minduration', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['maxduration', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['startdelay', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['maxseq', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['poddur', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['protocols', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isArrayOfNums], ['w', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['h', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['podid', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isStr], ['podseq', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['rqddurs', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isArrayOfNums], ['placement', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger],
// deprecated, see plcmt
['plcmt', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['linearity', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['skip', value => [1, 0].includes(value)], ['skipmin', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['skipafter', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['sequence', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger],
// deprecated
['slotinpod', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['mincpmpersec', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isNumber], ['battr', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isArrayOfNums], ['maxextended', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['minbitrate', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['maxbitrate', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['boxingallowed', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['playbackmethod', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isArrayOfNums], ['playbackend', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['delivery', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isArrayOfNums], ['pos', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isInteger], ['api', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isArrayOfNums], ['companiontype', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isArrayOfNums], ['poddedupe', _utils_js__WEBPACK_IMPORTED_MODULE_0__.isArrayOfNums]]);
function fillVideoDefaults(adUnit) {
  const video = adUnit?.mediaTypes?.video;
  if (video != null && video.plcmt == null) {
    if (video.context === OUTSTREAM || [2, 3, 4].includes(video.placement)) {
      video.plcmt = 4;
    } else if (video.context !== OUTSTREAM && [2, 6].includes(video.playbackmethod)) {
      video.plcmt = 2;
    }
  }
}

/**
 * validateOrtbVideoFields mutates the `adUnit.mediaTypes.video` object by removing invalid ortb properties (default).
 * The onInvalidParam callback can be used to handle invalid properties differently.
 * Other properties are ignored and kept as is.
 *
 * @param {Object} adUnit - The adUnit object.
 * @param {Function} onInvalidParam - The callback function to be called with key, value, and adUnit.
 * @returns {void}
 */
function validateOrtbVideoFields(adUnit, onInvalidParam) {
  const videoParams = adUnit?.mediaTypes?.video;
  if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(videoParams)) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logWarn)(`validateOrtbVideoFields: videoParams must be an object.`);
    return;
  }
  if (videoParams != null) {
    Object.entries(videoParams).forEach(_ref => {
      let [key, value] = _ref;
      if (!ORTB_VIDEO_PARAMS.has(key)) {
        return;
      }
      const isValid = ORTB_VIDEO_PARAMS.get(key)(value);
      if (!isValid) {
        if (typeof onInvalidParam === 'function') {
          onInvalidParam(key, value, adUnit);
        } else {
          delete videoParams[key];
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logWarn)(`Invalid prop in adUnit "${adUnit.code}": Invalid value for mediaTypes.video.${key} ORTB property. The property has been removed.`);
        }
      }
    });
  }
}

/**
 * @typedef {object} VideoBid
 * @property {string} adId id of the bid
 */

/**
 * Validate that the assets required for video context are present on the bid
 * @param {VideoBid} bid Video bid to validate
 * @param {Object} [options] - Options object
 * @param {Object} [options.index=auctionManager.index] - Index object, defaulting to `auctionManager.index`
 * @return {Boolean} If object is valid
 */
function isValidVideoBid(bid) {
  let {
    index = _auctionManager_js__WEBPACK_IMPORTED_MODULE_1__.auctionManager.index
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const videoMediaType = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(index.getMediaTypes(bid), 'video');
  const context = videoMediaType && (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(videoMediaType, 'context');
  const useCacheKey = videoMediaType && (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(videoMediaType, 'useCacheKey');
  const adUnit = index.getAdUnit(bid);

  // if context not defined assume default 'instream' for video bids
  // instream bids require a vast url or vast xml content
  return checkVideoBidSetup(bid, adUnit, videoMediaType, context, useCacheKey);
}
const checkVideoBidSetup = (0,_hook_js__WEBPACK_IMPORTED_MODULE_3__.hook)('sync', function (bid, adUnit, videoMediaType, context, useCacheKey) {
  if (videoMediaType && (useCacheKey || context !== OUTSTREAM)) {
    // xml-only video bids require a prebid cache url
    if (!_src_config_js__WEBPACK_IMPORTED_MODULE_4__.config.getConfig('cache.url') && bid.vastXml && !bid.vastUrl) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.logError)(`
        This bid contains only vastXml and will not work when a prebid cache url is not specified.
        Try enabling prebid cache with pbjs.setConfig({ cache: {url: "..."} });
      `);
      return false;
    }
    return !!(bid.vastUrl || bid.vastXml);
  }

  // outstream bids require a renderer on the bid or pub-defined on adunit
  if (context === OUTSTREAM && !useCacheKey) {
    return !!(bid.renderer || adUnit && adUnit.renderer || videoMediaType.renderer);
  }
  return true;
}, 'checkVideoBidSetup');

/***/ }),

/***/ "./src/videoCache.js":
/*!***************************!*\
  !*** ./src/videoCache.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   batchAndStore: () => (/* binding */ batchAndStore)
/* harmony export */ });
/* unused harmony exports store, getCacheUrl, _internal, storeBatch, batchingCache */
/* harmony import */ var _ajax_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ajax.js */ "./src/ajax.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var _auctionManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./auctionManager.js */ "./src/auctionManager.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/* harmony import */ var _auction_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./auction.js */ "./src/auction.js");
/**
 * This module interacts with the server used to cache video ad content to be restored later.
 * At a high level, the expected workflow goes like this:
 *
 *   - Request video ads from Bidders
 *   - Generate IDs for each valid bid, and cache the key/value pair on the server.
 *   - Return these IDs so that publishers can use them to fetch the bids later.
 *
 * This trickery helps integrate with ad servers, which set character limits on request params.
 */







/**
 * Might be useful to be configurable in the future
 * Depending on publisher needs
 */
const ttlBufferInSeconds = 15;

/**
 * @typedef {object} CacheableUrlBid
 * @property {string} vastUrl A URL which loads some valid VAST XML.
 */

/**
 * @typedef {object} CacheablePayloadBid
 * @property {string} vastXml Some VAST XML which loads an ad in a video player.
 */

/**
 * A CacheableBid describes the types which the videoCache can store.
 *
 * @typedef {CacheableUrlBid|CacheablePayloadBid} CacheableBid
 */

/**
 * Function which wraps a URI that serves VAST XML, so that it can be loaded.
 *
 * @param {string} uri The URI where the VAST content can be found.
 * @param {(string|string[])} impTrackerURLs An impression tracker URL for the delivery of the video ad
 * @return A VAST URL which loads XML from the given URI.
 */
function wrapURI(uri, impTrackerURLs) {
  impTrackerURLs = impTrackerURLs && (Array.isArray(impTrackerURLs) ? impTrackerURLs : [impTrackerURLs]);
  // Technically, this is vulnerable to cross-script injection by sketchy vastUrl bids.
  // We could make sure it's a valid URI... but since we're loading VAST XML from the
  // URL they provide anyway, that's probably not a big deal.
  let impressions = impTrackerURLs ? impTrackerURLs.map(trk => `<Impression><![CDATA[${trk}]]></Impression>`).join('') : '';
  return `<VAST version="3.0">
    <Ad>
      <Wrapper>
        <AdSystem>prebid.org wrapper</AdSystem>
        <VASTAdTagURI><![CDATA[${uri}]]></VASTAdTagURI>
        ${impressions}
        <Creatives></Creatives>
      </Wrapper>
    </Ad>
  </VAST>`;
}

/**
 * Wraps a bid in the format expected by the prebid-server endpoints, or returns null if
 * the bid can't be converted cleanly.
 *
 * @param {CacheableBid} bid
 * @param {Object} [options] - Options object.
 * @param {Object} [options.index=auctionManager.index] - Index object, defaulting to `auctionManager.index`.
 * @return {Object|null} - The payload to be sent to the prebid-server endpoints, or null if the bid can't be converted cleanly.
 */
function toStorageRequest(bid) {
  let {
    index = _auctionManager_js__WEBPACK_IMPORTED_MODULE_0__.auctionManager.index
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const vastValue = bid.vastXml ? bid.vastXml : wrapURI(bid.vastUrl, bid.vastImpUrl);
  const auction = index.getAuction(bid);
  const ttlWithBuffer = Number(bid.ttl) + ttlBufferInSeconds;
  let payload = {
    type: 'xml',
    value: vastValue,
    ttlseconds: ttlWithBuffer
  };
  if (_config_js__WEBPACK_IMPORTED_MODULE_1__.config.getConfig('cache.vasttrack')) {
    payload.bidder = bid.bidder;
    payload.bidid = bid.requestId;
    payload.aid = bid.auctionId;
  }
  if (auction != null) {
    payload.timestamp = auction.getAuctionStart();
  }
  if (typeof bid.customCacheKey === 'string' && bid.customCacheKey !== '') {
    payload.key = bid.customCacheKey;
  }
  return payload;
}

/**
 * A function which should be called with the results of the storage operation.
 *
 * @callback videoCacheStoreCallback
 *
 * @param {Error} [error] The error, if one occurred.
 * @param {?string[]} uuids An array of unique IDs. The array will have one element for each bid we were asked
 *   to store. It may include null elements if some of the bids were malformed, or an error occurred.
 *   Each non-null element in this array is a valid input into the retrieve function, which will fetch
 *   some VAST XML which can be used to render this bid's ad.
 */

/**
 * A function which bridges the APIs between the videoCacheStoreCallback and our ajax function's API.
 *
 * @param {videoCacheStoreCallback} done A callback to the "store" function.
 * @return {Function} A callback which interprets the cache server's responses, and makes up the right
 *   arguments for our callback.
 */
function shimStorageCallback(done) {
  return {
    success: function (responseBody) {
      let ids;
      try {
        ids = JSON.parse(responseBody).responses;
      } catch (e) {
        done(e, []);
        return;
      }
      if (ids) {
        done(null, ids);
      } else {
        done(new Error("The cache server didn't respond with a responses property."), []);
      }
    },
    error: function (statusText, responseBody) {
      done(new Error(`Error storing video ad in the cache: ${statusText}: ${JSON.stringify(responseBody)}`), []);
    }
  };
}

/**
 * If the given bid is for a Video ad, generate a unique ID and cache it somewhere server-side.
 *
 * @param {CacheableBid[]} bids A list of bid objects which should be cached.
 * @param {videoCacheStoreCallback} [done] An optional callback which should be executed after
 * the data has been stored in the cache.
 */
function store(bids, done) {
  let getAjax = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _ajax_js__WEBPACK_IMPORTED_MODULE_2__.ajaxBuilder;
  const requestData = {
    puts: bids.map(toStorageRequest)
  };
  const ajax = getAjax(_config_js__WEBPACK_IMPORTED_MODULE_1__.config.getConfig('cache.timeout'));
  ajax(_config_js__WEBPACK_IMPORTED_MODULE_1__.config.getConfig('cache.url'), shimStorageCallback(done), JSON.stringify(requestData), {
    contentType: 'text/plain',
    withCredentials: true
  });
}
function getCacheUrl(id) {
  return `${_config_js__WEBPACK_IMPORTED_MODULE_1__.config.getConfig('cache.url')}?uuid=${id}`;
}
const _internal = {
  store
};
function storeBatch(batch) {
  const bids = batch.map(entry => entry.bidResponse);
  function err(msg) {
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)(`Failed to save to the video cache: ${msg}. Video bids will be discarded:`, bids);
  }
  _internal.store(bids, function (error, cacheIds) {
    if (error) {
      err(error);
    } else if (batch.length !== cacheIds.length) {
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)(`expected ${batch.length} cache IDs, got ${cacheIds.length} instead`);
    } else {
      cacheIds.forEach((cacheId, i) => {
        const {
          auctionInstance,
          bidResponse,
          afterBidAdded
        } = batch[i];
        if (cacheId.uuid === '') {
          (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)(`Supplied video cache key was already in use by Prebid Cache; caching attempt was rejected. Video bid must be discarded.`);
        } else {
          bidResponse.videoCacheKey = cacheId.uuid;
          if (!bidResponse.vastUrl) {
            bidResponse.vastUrl = getCacheUrl(bidResponse.videoCacheKey);
          }
          (0,_auction_js__WEBPACK_IMPORTED_MODULE_4__.addBidToAuction)(auctionInstance, bidResponse);
          afterBidAdded();
        }
      });
    }
  });
}
;
let batchSize, batchTimeout;
if (true) {
  _config_js__WEBPACK_IMPORTED_MODULE_1__.config.getConfig('cache', cacheConfig => {
    batchSize = typeof cacheConfig.cache.batchSize === 'number' && cacheConfig.cache.batchSize > 0 ? cacheConfig.cache.batchSize : 1;
    batchTimeout = typeof cacheConfig.cache.batchTimeout === 'number' && cacheConfig.cache.batchTimeout > 0 ? cacheConfig.cache.batchTimeout : 0;
  });
}
const batchingCache = function () {
  let timeout = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : setTimeout;
  let cache = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : storeBatch;
  let batches = [[]];
  let debouncing = false;
  const noTimeout = cb => cb();
  return function (auctionInstance, bidResponse, afterBidAdded) {
    const batchFunc = batchTimeout > 0 ? timeout : noTimeout;
    if (batches[batches.length - 1].length >= batchSize) {
      batches.push([]);
    }
    batches[batches.length - 1].push({
      auctionInstance,
      bidResponse,
      afterBidAdded
    });
    if (!debouncing) {
      debouncing = true;
      batchFunc(() => {
        batches.forEach(cache);
        batches = [[]];
        debouncing = false;
      }, batchTimeout);
    }
  };
};
const batchAndStore = batchingCache();

/***/ })

}]);

"use strict";
(self["pbjsChunk"] = self["pbjsChunk"] || []).push([["creative-renderer-display"],{

/***/ "./libraries/creative-renderer-display/renderer.js":
/*!*********************************************************!*\
  !*** ./libraries/creative-renderer-display/renderer.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RENDERER: () => (/* binding */ RENDERER)
/* harmony export */ });
// this file is autogenerated, see creative/README.md
const RENDERER = "(()=>{\"use strict\";window.render=function({ad:d,adUrl:e,width:i,height:r},{mkFrame:n},o){if(!d&&!e)throw{reason:\"noAd\",message:\"Missing ad markup or URL\"};{const s=o.document,t={width:i,height:r};e&&!d?t.src=e:t.srcdoc=d,s.body.appendChild(n(s,t))}}})();";

/***/ })

}]);

"use strict";
(self["pbjsChunk"] = self["pbjsChunk"] || []).push([["gptUtils"],{

/***/ "./libraries/gptUtils/gptUtils.js":
/*!****************************************!*\
  !*** ./libraries/gptUtils/gptUtils.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getGptSlotInfoForAdUnitCode: () => (/* binding */ getGptSlotInfoForAdUnitCode)
/* harmony export */ });
/* unused harmony exports isSlotMatchingAdUnitCode, getGptSlotForAdUnitCode, taxonomies, getSignals, getSegments, subscribeToGamEvent, subscribeToGamSlotRenderEndedEvent */
/* harmony import */ var _src_fpd_oneClient_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../src/fpd/oneClient.js */ "./src/fpd/oneClient.js");
/* harmony import */ var _src_polyfill_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../src/polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _src_utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../src/utils.js */ "./src/utils.js");
/* harmony import */ var _src_utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../src/utils.js */ "./node_modules/dlv/index.js");




/**
 * Returns filter function to match adUnitCode in slot
 * @param {string} adUnitCode AdUnit code
 * @return {function} filter function
 */
function isSlotMatchingAdUnitCode(adUnitCode) {
  return slot => (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_0__.compareCodeAndSlot)(slot, adUnitCode);
}

/**
 * @summary Uses the adUnit's code in order to find a matching gpt slot object on the page
 */
function getGptSlotForAdUnitCode(adUnitCode) {
  let matchingSlot;
  if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_0__.isGptPubadsDefined)()) {
    // find the first matching gpt slot on the page
    matchingSlot = (0,_src_polyfill_js__WEBPACK_IMPORTED_MODULE_1__.find)(window.googletag.pubads().getSlots(), isSlotMatchingAdUnitCode(adUnitCode));
  }
  return matchingSlot;
}

/**
 * @summary Uses the adUnit's code in order to find a matching gptSlot on the page
 */
function getGptSlotInfoForAdUnitCode(adUnitCode) {
  const matchingSlot = getGptSlotForAdUnitCode(adUnitCode);
  if (matchingSlot) {
    return {
      gptSlot: matchingSlot.getAdUnitPath(),
      divId: matchingSlot.getSlotElementId()
    };
  }
  return {};
}
const taxonomies = ['IAB_AUDIENCE_1_1', 'IAB_CONTENT_2_2'];
function getSignals(fpd) {
  const signals = Object.entries({
    [taxonomies[0]]: getSegments(fpd, ['user.data'], 4),
    [taxonomies[1]]: getSegments(fpd, _src_fpd_oneClient_js__WEBPACK_IMPORTED_MODULE_2__.CLIENT_SECTIONS.map(section => `${section}.content.data`), 6)
  }).map(_ref => {
    let [taxonomy, values] = _ref;
    return values.length ? {
      taxonomy,
      values
    } : null;
  }).filter(ob => ob);
  return signals;
}
function getSegments(fpd, sections, segtax) {
  return sections.flatMap(section => (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__["default"])(fpd, section) || []).filter(datum => datum.ext?.segtax === segtax).flatMap(datum => datum.segment?.map(seg => seg.id)).filter(ob => ob).filter(_src_utils_js__WEBPACK_IMPORTED_MODULE_0__.uniques);
}

/**
 * Add an event listener on the given GAM event.
 * If GPT Pubads isn't defined, window.googletag is set to a new object.
 * @param {String} event
 * @param {Function} callback
 */
function subscribeToGamEvent(event, callback) {
  const register = () => window.googletag.pubads().addEventListener(event, callback);
  if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_0__.isGptPubadsDefined)()) {
    register();
    return;
  }
  window.googletag = window.googletag || {};
  window.googletag.cmd = window.googletag.cmd || [];
  window.googletag.cmd.push(register);
}

/**
 * @typedef {Object} Slot
 * @property {function(String): (String|null)} get
 * @property {function(): String} getAdUnitPath
 * @property {function(): String[]} getAttributeKeys
 * @property {function(): String[]} getCategoryExclusions
 * @property {function(String): String} getSlotElementId
 * @property {function(): String[]} getTargeting
 * @property {function(): String[]} getTargetingKeys
 * @see {@link https://developers.google.com/publisher-tag/reference#googletag.Slot GPT official docs}
 */

/**
 * @typedef {Object} SlotRenderEndedEvent
 * @property {(String|null)} advertiserId
 * @property {(String|null)} campaignId
 * @property {(String[]|null)} companyIds
 * @property {(Number|null)} creativeId
 * @property {(Number|null)} creativeTemplateId
 * @property {(Boolean)} isBackfill
 * @property {(Boolean)} isEmpty
 * @property {(Number[]|null)} labelIds
 * @property {(Number|null)} lineItemId
 * @property {(String)} serviceName
 * @property {(string|Number[]|null)} size
 * @property {(Slot)} slot
 * @property {(Boolean)} slotContentChanged
 * @property {(Number|null)} sourceAgnosticCreativeId
 * @property {(Number|null)} sourceAgnosticLineItemId
 * @property {(Number[]|null)} yieldGroupIds
 * @see {@link https://developers.google.com/publisher-tag/reference#googletag.events.SlotRenderEndedEvent GPT official docs}
 */

/**
 * @callback SlotRenderEndedEventCallback
 * @param {SlotRenderEndedEvent} event
 * @returns {void}
 */

/**
 * Add an event listener on the GAM event 'slotRenderEnded'.
 * @param {SlotRenderEndedEventCallback} callback
 */
function subscribeToGamSlotRenderEndedEvent(callback) {
  subscribeToGamEvent('slotRenderEnded', callback);
}

/***/ })

}]);

"use strict";
(self["pbjsChunk"] = self["pbjsChunk"] || []).push([["objectGuard"],{

/***/ "./libraries/objectGuard/objectGuard.js":
/*!**********************************************!*\
  !*** ./libraries/objectGuard/objectGuard.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   objectGuard: () => (/* binding */ objectGuard),
/* harmony export */   writeProtectRule: () => (/* binding */ writeProtectRule)
/* harmony export */ });
/* harmony import */ var _src_activities_redactor_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../src/activities/redactor.js */ "./src/activities/redactor.js");
/* harmony import */ var _src_utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../src/utils.js */ "./src/utils.js");
/* harmony import */ var _src_utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../src/utils.js */ "./node_modules/dlv/index.js");
/* harmony import */ var _src_utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../src/utils.js */ "./node_modules/dset/dist/index.mjs");



/**
 * @typedef {import('../src/activities/redactor.js').TransformationRuleDef} TransformationRuleDef
 * @typedef {import('../src/adapters/bidderFactory.js').TransformationRule} TransformationRule
 * @typedef {Object} ObjectGuard
 * @property {*} obj a view on the guarded object
 * @property {function(): void} verify a function that checks for and rolls back disallowed changes to the guarded object
 */

/**
 * Create a factory function for object guards using the given rules.
 *
 * An object guard is a pair {obj, verify} where:
 *  - `obj` is a view on the guarded object that applies "redact" rules (the same rules used in activites/redactor.js)
 *  - `verify` is a function that, when called, will check that the guarded object was not modified
 *   in a way that violates any "write protect" rules, and rolls back any offending changes.
 *
 * This is meant to provide sandboxed version of a privacy-sensitive object, where reads
 * are filtered through redaction rules and writes are checked against write protect rules.
 *
 * @param {Array[TransformationRule]} rules
 * @return {function(*, ...[*]): ObjectGuard}
 */
function objectGuard(rules) {
  const root = {};
  const writeRules = [];
  rules.forEach(rule => {
    if (rule.wp) writeRules.push(rule);
    if (!rule.get) return;
    rule.paths.forEach(path => {
      let node = root;
      path.split('.').forEach(el => {
        node.children = node.children || {};
        node.children[el] = node.children[el] || {};
        node = node.children[el];
      });
      node.rule = rule;
    });
  });
  const wpTransformer = (0,_src_activities_redactor_js__WEBPACK_IMPORTED_MODULE_0__.objectTransformer)(writeRules);
  function mkGuard(obj, tree, applies) {
    return new Proxy(obj, {
      get(target, prop, receiver) {
        const val = Reflect.get(target, prop, receiver);
        if (tree.hasOwnProperty(prop)) {
          const {
            children,
            rule
          } = tree[prop];
          if (children && val != null && typeof val === 'object') {
            return mkGuard(val, children, applies);
          } else if (rule && (0,_src_activities_redactor_js__WEBPACK_IMPORTED_MODULE_0__.isData)(val) && applies(rule)) {
            return rule.get(val);
          }
        }
        return val;
      }
    });
  }
  function mkVerify(transformResult) {
    return function () {
      transformResult.forEach(fn => fn());
    };
  }
  return function guard(obj) {
    const session = {};
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    return {
      obj: mkGuard(obj, root.children || {}, (0,_src_activities_redactor_js__WEBPACK_IMPORTED_MODULE_0__.sessionedApplies)(session, ...args)),
      verify: mkVerify(wpTransformer(session, obj, ...args))
    };
  };
}

/**
 * @param {TransformationRuleDef} ruleDef
 * @return {TransformationRule}
 */
function writeProtectRule(ruleDef) {
  return Object.assign({
    wp: true,
    run(root, path, object, property, applies) {
      const origHasProp = object && object.hasOwnProperty(property);
      const original = origHasProp ? object[property] : undefined;
      const origCopy = origHasProp && original != null && typeof original === 'object' ? (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_1__.deepClone)(original) : original;
      return function () {
        const object = path == null ? root : (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(root, path);
        const finalHasProp = object && (0,_src_activities_redactor_js__WEBPACK_IMPORTED_MODULE_0__.isData)(object[property]);
        const finalValue = finalHasProp ? object[property] : undefined;
        if (!origHasProp && finalHasProp && applies()) {
          delete object[property];
        } else if ((origHasProp !== finalHasProp || finalValue !== original || !(0,_src_utils_js__WEBPACK_IMPORTED_MODULE_1__.deepEqual)(finalValue, origCopy)) && applies()) {
          (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.dset)(root, (path == null ? [] : [path]).concat(property).join('.'), origCopy);
        }
      };
    }
  }, ruleDef);
}

/***/ }),

/***/ "./libraries/objectGuard/ortbGuard.js":
/*!********************************************!*\
  !*** ./libraries/objectGuard/ortbGuard.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   guardOrtb2Fragments: () => (/* binding */ guardOrtb2Fragments)
/* harmony export */ });
/* unused harmony exports ortb2GuardFactory, ortb2Guard, ortb2FragmentsGuardFactory */
/* harmony import */ var _src_activities_rules_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../src/activities/rules.js */ "./src/activities/rules.js");
/* harmony import */ var _src_activities_activities_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../src/activities/activities.js */ "./src/activities/activities.js");
/* harmony import */ var _src_activities_redactor_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../src/activities/redactor.js */ "./src/activities/redactor.js");
/* harmony import */ var _objectGuard_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./objectGuard.js */ "./libraries/objectGuard/objectGuard.js");
/* harmony import */ var _src_utils_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../src/utils.js */ "./src/utils.js");






/**
 * @typedef {import('./objectGuard.js').ObjectGuard} ObjectGuard
 */

function ortb2EnrichRules() {
  let isAllowed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _src_activities_rules_js__WEBPACK_IMPORTED_MODULE_0__.isActivityAllowed;
  return [{
    name: _src_activities_activities_js__WEBPACK_IMPORTED_MODULE_1__.ACTIVITY_ENRICH_EIDS,
    paths: _src_activities_redactor_js__WEBPACK_IMPORTED_MODULE_2__.ORTB_EIDS_PATHS,
    applies: (0,_src_activities_redactor_js__WEBPACK_IMPORTED_MODULE_2__.appliesWhenActivityDenied)(_src_activities_activities_js__WEBPACK_IMPORTED_MODULE_1__.ACTIVITY_ENRICH_EIDS, isAllowed)
  }, {
    name: _src_activities_activities_js__WEBPACK_IMPORTED_MODULE_1__.ACTIVITY_ENRICH_UFPD,
    paths: _src_activities_redactor_js__WEBPACK_IMPORTED_MODULE_2__.ORTB_UFPD_PATHS,
    applies: (0,_src_activities_redactor_js__WEBPACK_IMPORTED_MODULE_2__.appliesWhenActivityDenied)(_src_activities_activities_js__WEBPACK_IMPORTED_MODULE_1__.ACTIVITY_ENRICH_UFPD, isAllowed)
  }].map(_objectGuard_js__WEBPACK_IMPORTED_MODULE_3__.writeProtectRule);
}
function ortb2GuardFactory() {
  let isAllowed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _src_activities_rules_js__WEBPACK_IMPORTED_MODULE_0__.isActivityAllowed;
  return (0,_objectGuard_js__WEBPACK_IMPORTED_MODULE_3__.objectGuard)((0,_src_activities_redactor_js__WEBPACK_IMPORTED_MODULE_2__.ortb2TransmitRules)(isAllowed).concat(ortb2EnrichRules(isAllowed)));
}

/**
 *
 *
 * @typedef {Function} ortb2Guard
 * @param {{}} ortb2 ORTB object to guard
 * @param {{}} params activity params to use for activity checks
 * @returns {ObjectGuard}
 */

/*
 * Get a guard for an ORTB object. Read access is restricted in the same way it'd be redacted (see activites/redactor.js);
 * and writes are checked against the enrich* activites.
 *
 * @type ortb2Guard
 */
const ortb2Guard = ortb2GuardFactory();
function ortb2FragmentsGuardFactory() {
  let guardOrtb2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ortb2Guard;
  return function guardOrtb2Fragments(fragments, params) {
    fragments.global = fragments.global || {};
    fragments.bidder = fragments.bidder || {};
    const bidders = new Set(Object.keys(fragments.bidder));
    const verifiers = [];
    function makeGuard(ortb2) {
      const guard = guardOrtb2(ortb2, params);
      verifiers.push(guard.verify);
      return guard.obj;
    }
    const obj = {
      global: makeGuard(fragments.global),
      bidder: Object.fromEntries(Object.entries(fragments.bidder).map(_ref => {
        let [bidder, ortb2] = _ref;
        return [bidder, makeGuard(ortb2)];
      }))
    };
    return {
      obj,
      verify() {
        Object.entries(obj.bidder).filter(_ref2 => {
          let [bidder] = _ref2;
          return !bidders.has(bidder);
        }).forEach(_ref3 => {
          let [bidder, ortb2] = _ref3;
          const repl = {};
          const guard = guardOrtb2(repl, params);
          (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_4__.mergeDeep)(guard.obj, ortb2);
          guard.verify();
          fragments.bidder[bidder] = repl;
        });
        verifiers.forEach(fn => fn());
      }
    };
  };
}

/**
 * Get a guard for an ortb2Fragments object.
 * @type {function(*, *): ObjectGuard}
 */
const guardOrtb2Fragments = ortb2FragmentsGuardFactory();

/***/ })

}]);

"use strict";
(self["pbjsChunk"] = self["pbjsChunk"] || []).push([["ixBidAdapter"],{

/***/ "./modules/ixBidAdapter.js":
/*!*********************************!*\
  !*** ./modules/ixBidAdapter.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* unused harmony exports LOCAL_STORAGE_FEATURE_TOGGLES_KEY, storage, FEATURE_TOGGLES, bidToVideoImp, bidToNativeImp, spec, combineImps, deduplicateImpExtFields, removeSiteIDs, addDeviceInfo */
/* harmony import */ var _src_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../src/prebidGlobal.js */ "./src/prebidGlobal.js");
/* harmony import */ var _src_utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../src/utils.js */ "./node_modules/dlv/index.js");
/* harmony import */ var _src_utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../src/utils.js */ "./src/utils.js");
/* harmony import */ var _src_utils_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../src/utils.js */ "./node_modules/dset/dist/index.mjs");
/* harmony import */ var _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../src/mediaTypes.js */ "./src/mediaTypes.js");
/* harmony import */ var _src_config_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../src/config.js */ "./src/config.js");
/* harmony import */ var _src_storageManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../src/storageManager.js */ "./src/storageManager.js");
/* harmony import */ var _src_polyfill_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../src/polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _src_adapters_bidderFactory_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../src/adapters/bidderFactory.js */ "./src/adapters/bidderFactory.js");
/* harmony import */ var _src_video_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../src/video.js */ "./src/video.js");
/* harmony import */ var _src_Renderer_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../src/Renderer.js */ "./src/Renderer.js");
/* harmony import */ var _libraries_gptUtils_gptUtils_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../libraries/gptUtils/gptUtils.js */ "./libraries/gptUtils/gptUtils.js");










const BIDDER_CODE = 'ix';
const GLOBAL_VENDOR_ID = 10;
const SECURE_BID_URL = 'https://htlb.casalemedia.com/openrtb/pbjs';
const SUPPORTED_AD_TYPES = [_src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.BANNER, _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.VIDEO, _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE];
const BANNER_ENDPOINT_VERSION = 7.2;
const VIDEO_ENDPOINT_VERSION = 8.1;
const CENT_TO_DOLLAR_FACTOR = 100;
const BANNER_TIME_TO_LIVE = 300;
const VIDEO_TIME_TO_LIVE = 3600; // 1hr
const NATIVE_TIME_TO_LIVE = 3600; // Since native can have video, use ttl same as video
const NET_REVENUE = true;
const MAX_REQUEST_LIMIT = 4;
const MAX_EID_SOURCES = 50;
const OUTSTREAM_MINIMUM_PLAYER_SIZE = [144, 144];
const PRICE_TO_DOLLAR_FACTOR = {
  JPY: 1
};
const IFRAME_USER_SYNC_URL = 'https://js-sec.indexww.com/um/ixmatch.html';
const FLOOR_SOURCE = {
  PBJS: 'p',
  IX: 'x'
};
const IMG_USER_SYNC_URL = 'https://dsum.casalemedia.com/pbusermatch?origin=prebid';
const FIRST_PARTY_DATA = {
  SITE: ['id', 'name', 'domain', 'cat', 'sectioncat', 'pagecat', 'page', 'ref', 'search', 'mobile', 'privacypolicy', 'publisher', 'content', 'keywords', 'ext'],
  USER: ['id', 'buyeruid', 'yob', 'gender', 'keywords', 'customdata', 'geo', 'data', 'ext']
};
const SOURCE_RTI_MAPPING = {
  'liveramp.com': 'idl',
  'netid.de': 'NETID',
  'neustar.biz': 'fabrickId',
  'zeotap.com': 'zeotapIdPlus',
  'uidapi.com': 'UID2',
  'adserver.org': 'TDID'
};
const PROVIDERS = ['lipbid', 'criteoId', 'merkleId', 'parrableId', 'connectid', 'tapadId', 'quantcastId', 'pubProvidedId', 'pairId'];
const REQUIRED_VIDEO_PARAMS = ['mimes', 'minduration', 'maxduration']; // note: protocol/protocols is also reqd
const VIDEO_PARAMS_ALLOW_LIST = ['mimes', 'minduration', 'maxduration', 'protocols', 'protocol', 'startdelay', 'placement', 'linearity', 'skip', 'skipmin', 'skipafter', 'sequence', 'battr', 'maxextended', 'minbitrate', 'maxbitrate', 'boxingallowed', 'playbackmethod', 'playbackend', 'delivery', 'pos', 'companionad', 'api', 'companiontype', 'ext', 'playerSize', 'w', 'h', 'plcmt'];
const LOCAL_STORAGE_KEY = 'ixdiag';
const LOCAL_STORAGE_FEATURE_TOGGLES_KEY = `${BIDDER_CODE}_features`;
const storage = (0,_src_storageManager_js__WEBPACK_IMPORTED_MODULE_1__.getStorageManager)({
  bidderCode: BIDDER_CODE
});
const FEATURE_TOGGLES = {
  // Update with list of CFTs to be requested from Exchange
  REQUESTED_FEATURE_TOGGLES: ['pbjs_enable_multiformat', 'pbjs_allow_all_eids'],
  featureToggles: {},
  isFeatureEnabled: function (ft) {
    return (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(this.featureToggles, `features.${ft}.activated`, false);
  },
  getFeatureToggles: function () {
    if (storage.localStorageIsEnabled()) {
      const parsedToggles = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.safeJSONParse)(storage.getDataFromLocalStorage(LOCAL_STORAGE_FEATURE_TOGGLES_KEY));
      if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(parsedToggles, 'expiry') && parsedToggles.expiry >= new Date().getTime()) {
        this.featureToggles = parsedToggles;
      } else {
        this.clearFeatureToggles();
      }
    }
  },
  setFeatureToggles: function (serverResponse) {
    const responseBody = serverResponse.body;
    const expiryTime = new Date();
    const toggles = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(responseBody, 'ext.features');
    if (toggles) {
      this.featureToggles = {
        expiry: expiryTime.setHours(expiryTime.getHours() + 1),
        features: toggles
      };
      if (storage.localStorageIsEnabled()) {
        storage.setDataInLocalStorage(LOCAL_STORAGE_FEATURE_TOGGLES_KEY, JSON.stringify(this.featureToggles));
      }
    }
  },
  clearFeatureToggles: function () {
    this.featureToggles = {};
    if (storage.localStorageIsEnabled()) {
      storage.removeDataFromLocalStorage(LOCAL_STORAGE_FEATURE_TOGGLES_KEY);
    }
  }
};
let siteID = 0;
let gdprConsent = '';
let usPrivacy = '';
let defaultVideoPlacement = false;

// Possible values for bidResponse.seatBid[].bid[].mtype which indicates the type of the creative markup so that it can properly be associated with the right sub-object of the BidRequest.Imp.
const MEDIA_TYPES = {
  Banner: 1,
  Video: 2,
  Audio: 3,
  Native: 4
};

/**
 * Transform valid bid request config object to banner impression object that will be sent to ad server.
 *
 * @param  {object} bid A valid bid request config object
 * @return {object}     A impression object that will be sent to ad server.
 */
function bidToBannerImp(bid) {
  const imp = bidToImp(bid, _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.BANNER);
  imp.banner = {};
  imp.adunitCode = bid.adUnitCode;
  const impSize = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'params.size');
  if (impSize) {
    imp.banner.w = impSize[0];
    imp.banner.h = impSize[1];
  }
  imp.banner.topframe = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.inIframe)() ? 0 : 1;
  _applyFloor(bid, imp, _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.BANNER);
  return imp;
}

/**
 * Sets imp.displaymanager
 *
 * @param {object} imp
 * @param {object} bid
 */
function setDisplayManager(imp, bid) {
  if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.video.context') === _src_video_js__WEBPACK_IMPORTED_MODULE_4__.OUTSTREAM) {
    let renderer = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.video.renderer');
    if (!renderer) {
      renderer = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'renderer');
    }
    if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'schain', false)) {
      imp.displaymanager = 'pbjs_wrapper';
    } else if (renderer && typeof renderer === 'object') {
      if (renderer.url !== undefined) {
        let domain = '';
        try {
          domain = new URL(renderer.url).hostname;
        } catch {
          return;
        }
        if (domain.includes('js-sec.indexww')) {
          imp.displaymanager = 'ix';
        } else {
          imp.displaymanager = renderer.url;
        }
      }
    } else {
      imp.displaymanager = 'ix';
    }
  }
}

/**
 * Transform valid bid request config object to video impression object that will be sent to ad server.
 *
 * @param  {object} bid A valid bid request config object.
 * @return {object}     A impression object that will be sent to ad server.
 */
function bidToVideoImp(bid) {
  const imp = bidToImp(bid, _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.VIDEO);
  const videoAdUnitRef = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.video');
  const videoParamRef = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'params.video');
  const videoParamErrors = checkVideoParams(videoAdUnitRef, videoParamRef);
  if (videoParamErrors.length) {
    return {};
  }
  imp.video = videoParamRef ? (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.deepClone)(bid.params.video) : {};
  // populate imp level transactionId
  let tid = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'ortb2Imp.ext.tid');
  if (tid) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'ext.tid', tid);
  }
  setDisplayManager(imp, bid);

  // AdUnit-Specific First Party Data
  addAdUnitFPD(imp, bid);

  // copy all video properties to imp object
  for (const adUnitProperty in videoAdUnitRef) {
    if (VIDEO_PARAMS_ALLOW_LIST.indexOf(adUnitProperty) !== -1 && !imp.video.hasOwnProperty(adUnitProperty)) {
      imp.video[adUnitProperty] = videoAdUnitRef[adUnitProperty];
    }
  }
  if (imp.video.minduration > imp.video.maxduration) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)(`IX Bid Adapter: video minduration [${imp.video.minduration}] cannot be greater than video maxduration [${imp.video.maxduration}]`);
    return {};
  }
  const context = videoParamRef && videoParamRef.context || videoAdUnitRef && videoAdUnitRef.context;
  verifyVideoPlcmt(imp);

  // if placement not already defined, pick one based on `context`
  if (context && !imp.video.hasOwnProperty('placement')) {
    if (context === _src_video_js__WEBPACK_IMPORTED_MODULE_4__.INSTREAM) {
      imp.video.placement = 1;
    } else if (context === _src_video_js__WEBPACK_IMPORTED_MODULE_4__.OUTSTREAM) {
      if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(videoParamRef, 'playerConfig.floatOnScroll')) {
        imp.video.placement = 5;
      } else {
        imp.video.placement = 3;
        defaultVideoPlacement = true;
      }
    } else {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)(`IX Bid Adapter: Video context '${context}' is not supported`);
    }
  }
  if (!(imp.video.w && imp.video.h)) {
    // Getting impression Size
    const impSize = getFirstSize((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(imp, 'video.playerSize')) || getFirstSize((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'params.size'));
    if (impSize) {
      imp.video.w = impSize[0];
      imp.video.h = impSize[1];
    } else {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)('IX Bid Adapter: Video size is missing in [mediaTypes.video]');
      return {};
    }
  }
  _applyFloor(bid, imp, _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.VIDEO);
  return imp;
}
function verifyVideoPlcmt(imp) {
  if (imp.video.hasOwnProperty('plcmt') && (!(0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isInteger)(imp.video.plcmt) || imp.video.plcmt < 1 || imp.video.plcmt > 4)) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)(`IX Bid Adapter: video.plcmt [${imp.video.plcmt}] must be an integer between 1-4 inclusive`);
    delete imp.video.plcmt;
  }
}

/**
 * Transform valid bid request config object to native impression object that will be sent to ad server.
 *
 * @param  {object} bid A valid bid request config object.
 * @return {object}     A impression object that will be sent to ad server.
 */
function bidToNativeImp(bid) {
  const imp = bidToImp(bid, _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE);
  const request = bid.nativeOrtbRequest;
  request.eventtrackers = [{
    event: 1,
    methods: [1, 2]
  }];
  request.privacy = 1;
  imp.native = {
    request: JSON.stringify(request),
    ver: '1.2'
  };

  // populate imp level transactionId
  let tid = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'ortb2Imp.ext.tid');
  if (tid) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'ext.tid', tid);
  }

  // AdUnit-Specific First Party Data
  addAdUnitFPD(imp, bid);
  _applyFloor(bid, imp, _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE);
  return imp;
}

/**
 * Converts an incoming PBJS bid to an IX Impression
 * @param {object} bid   PBJS bid object
 * @returns {object}     IX impression object
 */
function bidToImp(bid, mediaType) {
  const imp = {};
  imp.id = bid.bidId;
  if (isExchangeIdConfigured() && (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, `params.externalId`)) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'ext.externalID', bid.params.externalId);
  }
  if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, `params.${mediaType}.siteId`) && !isNaN(Number(bid.params[mediaType].siteId))) {
    switch (mediaType) {
      case _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.BANNER:
        (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'ext.siteID', bid.params.banner.siteId.toString());
        break;
      case _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.VIDEO:
        (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'ext.siteID', bid.params.video.siteId.toString());
        break;
      case _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE:
        (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'ext.siteID', bid.params.native.siteId.toString());
        break;
    }
  } else {
    if (bid.params.siteId) {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'ext.siteID', bid.params.siteId.toString());
    }
  }

  // populate imp level sid
  if (bid.params.hasOwnProperty('id') && (typeof bid.params.id === 'string' || typeof bid.params.id === 'number')) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'ext.sid', String(bid.params.id));
  }
  return imp;
}

/**
 * Gets priceFloors floors and IX adapter floors,
 * Validates and sets the higher one on the impression
 * @param  {object}    bid bid object
 * @param  {object}    imp impression object
 * @param  {string}    mediaType the impression ad type, one of the SUPPORTED_AD_TYPES
 */
function _applyFloor(bid, imp, mediaType) {
  let adapterFloor = null;
  let moduleFloor = null;
  if (bid.params.bidFloor && bid.params.bidFloorCur) {
    adapterFloor = {
      floor: bid.params.bidFloor,
      currency: bid.params.bidFloorCur
    };
  }
  if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isFn)(bid.getFloor)) {
    let _mediaType = '*';
    let _size = '*';
    if (mediaType && (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.contains)(SUPPORTED_AD_TYPES, mediaType)) {
      const {
        w: width,
        h: height
      } = imp[mediaType];
      _mediaType = mediaType;
      _size = [width, height];
    }
    try {
      moduleFloor = bid.getFloor({
        mediaType: _mediaType,
        size: _size
      });
    } catch (err) {
      // continue with no module floors
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)('priceFloors module call getFloor failed, error : ', err);
    }
  }

  // Prioritize module floor over bidder.param floor
  let setFloor = false;
  if (moduleFloor) {
    imp.bidfloor = moduleFloor.floor;
    imp.bidfloorcur = moduleFloor.currency;
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'ext.fl', FLOOR_SOURCE.PBJS);
    setFloor = true;
  } else if (adapterFloor) {
    imp.bidfloor = adapterFloor.floor;
    imp.bidfloorcur = adapterFloor.currency;
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'ext.fl', FLOOR_SOURCE.IX);
    setFloor = true;
  }
  if (setFloor) {
    if (mediaType == _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.BANNER) {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'banner.ext.bidfloor', imp.bidfloor);
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'banner.ext.fl', imp.ext.fl);
    } else if (mediaType == _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.VIDEO) {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'video.ext.bidfloor', imp.bidfloor);
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'video.ext.fl', imp.ext.fl);
    } else {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'native.ext.bidfloor', imp.bidfloor);
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'native.ext.fl', imp.ext.fl);
    }
  }
}

/**
 * Parses a raw bid for the relevant information.
 *
 * @param  {object} rawBid   The bid to be parsed.
 * @param  {string} currency Global currency in bid response.
 * @return {object} bid      The parsed bid.
 */
function parseBid(rawBid, currency, bidRequest) {
  const bid = {};
  const isValidExpiry = !!((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(rawBid, 'exp') && (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isInteger)(rawBid.exp));
  const dealID = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(rawBid, 'dealid') || (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(rawBid, 'ext.dealid');
  if (PRICE_TO_DOLLAR_FACTOR.hasOwnProperty(currency)) {
    bid.cpm = rawBid.price / PRICE_TO_DOLLAR_FACTOR[currency];
  } else {
    bid.cpm = rawBid.price / CENT_TO_DOLLAR_FACTOR;
  }
  bid.requestId = rawBid.impid;
  if (dealID) {
    bid.dealId = dealID;
  }
  bid.netRevenue = NET_REVENUE;
  bid.currency = currency;
  bid.creativeId = rawBid.hasOwnProperty('crid') ? rawBid.crid : '-';
  // If mtype = video is passed and vastURl is not set, set vastxml
  if (rawBid.mtype == MEDIA_TYPES.Video && (rawBid.ext && !rawBid.ext.vasturl || !rawBid.ext)) {
    bid.vastXml = rawBid.adm;
  } else if (rawBid.ext && rawBid.ext.vasturl) {
    bid.vastUrl = rawBid.ext.vasturl;
  }
  let parsedAdm = null;
  // Detect whether the adm is (probably) JSON
  if (typeof rawBid.adm === 'string' && rawBid.adm[0] === '{' && rawBid.adm[rawBid.adm.length - 1] === '}') {
    try {
      parsedAdm = JSON.parse(rawBid.adm);
    } catch (err) {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)('adm looks like JSON but failed to parse: ', err);
    }
  }

  // in the event of a video
  if (rawBid.ext && rawBid.ext.vasturl || rawBid.mtype == MEDIA_TYPES.Video) {
    bid.width = bidRequest.video.w;
    bid.height = bidRequest.video.h;
    bid.mediaType = _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.VIDEO;
    bid.mediaTypes = bidRequest.mediaTypes;
    bid.ttl = isValidExpiry ? rawBid.exp : VIDEO_TIME_TO_LIVE;
  } else if (parsedAdm && parsedAdm.native) {
    bid.native = {
      ortb: parsedAdm.native
    };
    bid.width = rawBid.w ? rawBid.w : 1;
    bid.height = rawBid.h ? rawBid.h : 1;
    bid.mediaType = _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE;
    bid.ttl = isValidExpiry ? rawBid.exp : NATIVE_TIME_TO_LIVE;
  } else {
    bid.ad = rawBid.adm;
    bid.width = rawBid.w;
    bid.height = rawBid.h;
    bid.mediaType = _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.BANNER;
    bid.ttl = isValidExpiry ? rawBid.exp : BANNER_TIME_TO_LIVE;
  }
  bid.meta = {};
  bid.meta.networkId = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(rawBid, 'ext.dspid');
  bid.meta.brandId = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(rawBid, 'ext.advbrandid');
  bid.meta.brandName = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(rawBid, 'ext.advbrand');
  if (rawBid.adomain && rawBid.adomain.length > 0) {
    bid.meta.advertiserDomains = rawBid.adomain;
  }
  if (rawBid.ext?.dsa) {
    bid.meta.dsa = rawBid.ext.dsa;
  }
  return bid;
}

/**
 * Determines whether or not the given object is valid size format.
 *
 * @param  {*}       size The object to be validated.
 * @return {boolean}      True if this is a valid size format, and false otherwise.
 */
function isValidSize(size) {
  return Array.isArray(size) && size.length === 2 && (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isInteger)(size[0]) && (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isInteger)(size[1]);
}

/**
 * Determines whether or not the given size object is an element of the size
 * array.
 *
 * @param  {Array}  sizeArray The size array.
 * @param  {object} size      The size object.
 * @return {boolean}          True if the size object is an element of the size array, and false
 *                            otherwise.
 */
function includesSize() {
  let sizeArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  let size = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  if (isValidSize(sizeArray)) {
    return sizeArray[0] === size[0] && sizeArray[1] === size[1];
  }
  for (let i = 0; i < sizeArray.length; i++) {
    if (sizeArray[i][0] === size[0] && sizeArray[i][1] === size[1]) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if all required video params are present
 * @param {object} mediaTypeVideoRef Ad unit level mediaTypes object
 * @param {object} paramsVideoRef    IX bidder params level video object
 * @returns {string[]}               Are the required video params available
 */
function checkVideoParams(mediaTypeVideoRef, paramsVideoRef) {
  const errorList = [];
  if (!mediaTypeVideoRef) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)('IX Bid Adapter: mediaTypes.video is the preferred location for video params in ad unit');
  }
  for (let property of REQUIRED_VIDEO_PARAMS) {
    const propInMediaType = mediaTypeVideoRef && mediaTypeVideoRef.hasOwnProperty(property);
    const propInVideoRef = paramsVideoRef && paramsVideoRef.hasOwnProperty(property);
    if (!propInMediaType && !propInVideoRef) {
      errorList.push(`IX Bid Adapter: ${property} is not included in either the adunit or params level`);
    }
  }

  // check protocols/protocol
  const protocolMediaType = mediaTypeVideoRef && mediaTypeVideoRef.hasOwnProperty('protocol');
  const protocolsMediaType = mediaTypeVideoRef && mediaTypeVideoRef.hasOwnProperty('protocols');
  const protocolVideoRef = paramsVideoRef && paramsVideoRef.hasOwnProperty('protocol');
  const protocolsVideoRef = paramsVideoRef && paramsVideoRef.hasOwnProperty('protocols');
  if (!(protocolMediaType || protocolsMediaType || protocolVideoRef || protocolsVideoRef)) {
    errorList.push('IX Bid Adapter: protocol/protcols is not included in either the adunit or params level');
  }
  return errorList;
}

/**
 * Get One size from Size Array
 * [[250,350]] -> [250, 350]
 * [250, 350]  -> [250, 350]
 * @param {Array} sizes array of sizes
 */
function getFirstSize() {
  let sizes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  if (isValidSize(sizes)) {
    return sizes;
  } else if (isValidSize(sizes[0])) {
    return sizes[0];
  }
  return false;
}

/**
 * Determines whether or not the given bidFloor parameters are valid.
 *
 * @param  {number}  bidFloor    The bidFloor parameter inside bid request config.
 * @param  {number}  bidFloorCur The bidFloorCur parameter inside bid request config.
 * @return {boolean}                True if this is a valid bidFloor parameters format, and false
 *                               otherwise.
 */
function isValidBidFloorParams(bidFloor, bidFloorCur) {
  const curRegex = /^[A-Z]{3}$/;
  return Boolean(typeof bidFloor === 'number' && typeof bidFloorCur === 'string' && bidFloorCur.match(curRegex));
}
function nativeMediaTypeValid(bid) {
  const nativeMediaTypes = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.native');
  if (nativeMediaTypes === undefined) {
    return true;
  }
  return bid.nativeOrtbRequest && Array.isArray(bid.nativeOrtbRequest.assets) && bid.nativeOrtbRequest.assets.length > 0;
}

/**
 * Get bid request object with the associated id.
 *
 * @param  {*}      id          Id of the impression.
 * @param  {Array}  impressions List of impressions sent in the request.
 * @return {object}             The impression with the associated id.
 */
function getBidRequest(id, impressions, validBidRequests) {
  if (!id) {
    return;
  }
  const bidRequest = {
    ...(0,_src_polyfill_js__WEBPACK_IMPORTED_MODULE_6__.find)(validBidRequests, bid => bid.bidId === id),
    ...(0,_src_polyfill_js__WEBPACK_IMPORTED_MODULE_6__.find)(impressions, imp => imp.id === id)
  };
  return bidRequest;
}

/**
 * From the userIdAsEids array, filter for the ones our adserver can use, and modify them
 * for our purposes, e.g. add rtiPartner
 * @param {Array} allEids userIdAsEids passed in by prebid
 * @return {object} contains toSend (eids to send to the adserver) and seenSources (used to filter
 *                  identity info from IX Library)
 */
function getEidInfo(allEids) {
  let toSend = [];
  let seenSources = {};
  if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isArray)(allEids)) {
    for (const eid of allEids) {
      const isSourceMapped = SOURCE_RTI_MAPPING.hasOwnProperty(eid.source);
      const hasUids = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(eid, 'uids.0');
      if (hasUids) {
        seenSources[eid.source] = true;
        if (isSourceMapped && SOURCE_RTI_MAPPING[eid.source] !== '') {
          eid.uids[0].ext = {
            rtiPartner: SOURCE_RTI_MAPPING[eid.source]
          };
        }
        toSend.push(eid);
        if (toSend.length >= MAX_EID_SOURCES) {
          break;
        }
      }
    }
  }
  return {
    toSend,
    seenSources
  };
}

/**
 * Builds a request object to be sent to the ad server based on bid requests.
 *
 * @param  {Array}  validBidRequests A list of valid bid request config objects.
 * @param  {object} bidderRequest    An object containing other info like gdprConsent.
 * @param  {object} impressions      An object containing a list of impression objects describing the bids for each transaction
 * @param  {Array}  version          Endpoint version denoting banner, video or native.
 * @return {Array}                   List of objects describing the request to the server.
 *
 */
function buildRequest(validBidRequests, bidderRequest, impressions, version) {
  // Always use secure HTTPS protocol.
  let baseUrl = SECURE_BID_URL;
  // Get ids from Prebid User ID Modules
  let eidInfo = getEidInfo((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequests, '0.userIdAsEids'));
  let userEids = eidInfo.toSend;

  // RTI ids will be included in the bid request if the function getIdentityInfo() is loaded
  // and if the data for the partner exist
  if (window.headertag && typeof window.headertag.getIdentityInfo === 'function') {
    addRTI(userEids, eidInfo);
  }
  const requests = [];
  let r = createRequest(validBidRequests);

  // Add FTs to be requested from Exchange
  r = addRequestedFeatureToggles(r, FEATURE_TOGGLES.REQUESTED_FEATURE_TOGGLES);

  // getting ixdiags for adunits of the video, outstream & multi format (MF) style
  const fledgeEnabled = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bidderRequest, 'paapi.enabled');
  let ixdiag = buildIXDiag(validBidRequests, fledgeEnabled);
  for (let key in ixdiag) {
    r.ext.ixdiag[key] = ixdiag[key];
  }
  r = enrichRequest(r, bidderRequest, impressions, validBidRequests, userEids);
  r = applyRegulations(r, bidderRequest);
  let payload = {};
  if (validBidRequests[0].params.siteId) {
    siteID = validBidRequests[0].params.siteId;
    payload.s = siteID;
  }
  const impKeys = Object.keys(impressions);
  let isFpdAdded = false;
  for (let adUnitIndex = 0; adUnitIndex < impKeys.length; adUnitIndex++) {
    if (requests.length >= MAX_REQUEST_LIMIT) {
      break;
    }
    r = addImpressions(impressions, impKeys, r, adUnitIndex);
    const fpd = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bidderRequest, 'ortb2') || {};
    const site = {
      ...(fpd.site || fpd.context)
    };

    // update page URL with IX FPD KVs if they exist
    site.page = getIxFirstPartyDataPageUrl(bidderRequest);
    const user = {
      ...fpd.user
    };
    if (!(0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isEmpty)(fpd) && !isFpdAdded) {
      r = addFPD(bidderRequest, r, fpd, site, user);
      r.site = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.mergeDeep)({}, r.site, site);
      r.user = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.mergeDeep)({}, r.user, user);
      isFpdAdded = true;
    }

    // add identifiers info to ixDiag
    r = addIdentifiersInfo(impressions, r, impKeys, adUnitIndex, payload, baseUrl);
    const isLastAdUnit = adUnitIndex === impKeys.length - 1;
    r = addDeviceInfo(r);
    r = deduplicateImpExtFields(r);
    r = removeSiteIDs(r);
    if (isLastAdUnit) {
      let exchangeUrl = `${baseUrl}?`;
      if (siteID !== 0) {
        exchangeUrl += `s=${siteID}`;
      }
      if (isExchangeIdConfigured()) {
        exchangeUrl += siteID !== 0 ? '&' : '';
        exchangeUrl += `p=${_src_config_js__WEBPACK_IMPORTED_MODULE_7__.config.getConfig('exchangeId')}`;
      }
      requests.push({
        method: 'POST',
        url: exchangeUrl,
        data: (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.deepClone)(r),
        option: {
          contentType: 'text/plain'
        },
        validBidRequests
      });
      r.imp = [];
      isFpdAdded = false;
    }
  }
  return requests;
}

/**
 * addRTI adds RTI info of the partner to retrieved user IDs from prebid ID module.
 *
 * @param {Array} userEids userEids info retrieved from prebid
 * @param {Array} eidInfo eidInfo info from prebid
 */
function addRTI(userEids, eidInfo) {
  let identityInfo = window.headertag.getIdentityInfo();
  if (identityInfo && typeof identityInfo === 'object') {
    for (const partnerName in identityInfo) {
      if (userEids.length >= MAX_EID_SOURCES) {
        return;
      }
      if (identityInfo.hasOwnProperty(partnerName)) {
        let response = identityInfo[partnerName];
        if (!response.responsePending && response.data && typeof response.data === 'object' && Object.keys(response.data).length && !eidInfo.seenSources[response.data.source]) {
          userEids.push(response.data);
        }
      }
    }
  }
}

/**
 * createRequest creates the base request object
 * @param  {Array}  validBidRequests A list of valid bid request config objects.
 * @return {object}                  Object describing the request to the server.
 */
function createRequest(validBidRequests) {
  const r = {};
  // Since bidderRequestId are the same for different bid request, just use the first one.
  r.id = validBidRequests[0].bidderRequestId.toString();
  r.site = {};
  r.ext = {};
  r.ext.source = 'prebid';
  r.ext.ixdiag = {};
  r.ext.ixdiag.ls = storage.localStorageIsEnabled();
  r.imp = [];
  r.at = 1;
  return r;
}

/**
 * Adds requested feature toggles to the provided request object to be sent to Exchange.
 * @param {object} r - The request object to add feature toggles to.
 * @param {Array} requestedFeatureToggles - The list of feature toggles to add.
 * @returns {object} The updated request object with the added feature toggles.
 */
function addRequestedFeatureToggles(r, requestedFeatureToggles) {
  if (requestedFeatureToggles.length > 0) {
    r.ext.features = {};
    // Loop through each feature toggle and add it to the features object.
    // Add current activation status as well.
    requestedFeatureToggles.forEach(toggle => {
      r.ext.features[toggle] = {
        activated: FEATURE_TOGGLES.isFeatureEnabled(toggle)
      };
    });
  }
  return r;
}

/**
 * enrichRequest adds userSync configs, source, and referer info to request and ixDiag objects.
 *
 * @param  {object} r                Base reuqest object.
 * @param  {object} bidderRequest    An object containing other info like gdprConsent.
 * @param  {Array}  impressions      A list of impressions to be added to the request.
 * @param  {Array}  validBidRequests A list of valid bid request config objects.
 * @param  {Array}  userEids         User ID info retrieved from Prebid ID module.
 * @return {object}                  Enriched object describing the request to the server.
 */
function enrichRequest(r, bidderRequest, impressions, validBidRequests, userEids) {
  const tmax = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bidderRequest, 'timeout');
  if (tmax) {
    r.ext.ixdiag.tmax = tmax;
  }
  if (_src_config_js__WEBPACK_IMPORTED_MODULE_7__.config.getConfig('userSync')) {
    r.ext.ixdiag.syncsPerBidder = _src_config_js__WEBPACK_IMPORTED_MODULE_7__.config.getConfig('userSync').syncsPerBidder;
  }

  // Add number of available imps to ixDiag.
  r.ext.ixdiag.imps = Object.keys(impressions).length;

  // set source.tid to auctionId for outgoing request to Exchange.
  r.source = {
    tid: bidderRequest?.ortb2?.source?.tid
  };

  // if an schain is provided, send it along
  if (validBidRequests[0].schain) {
    r.source.ext = {};
    r.source.ext.schain = validBidRequests[0].schain;
  }
  if (userEids.length > 0) {
    r.user = {};
    r.user.eids = userEids;
  }
  if (document.referrer && document.referrer !== '') {
    r.site.ref = document.referrer;
  }
  return r;
}

/**
 * applyRegulations applies regulation info such as GDPR and GPP to the reqeust obejct.
 *
 * @param  {object}  r                Base reuqest object.
 * @param  {object}  bidderRequest    An object containing other info like gdprConsent.
 * @return {object}                   Object enriched with regulation info describing the request to the server.
 */
function applyRegulations(r, bidderRequest) {
  // Apply GDPR information to the request if GDPR is enabled.
  if (bidderRequest) {
    if (bidderRequest.gdprConsent) {
      gdprConsent = bidderRequest.gdprConsent;
      if (gdprConsent.hasOwnProperty('gdprApplies')) {
        r.regs = {
          ext: {
            gdpr: gdprConsent.gdprApplies ? 1 : 0
          }
        };
      }
      if (gdprConsent.hasOwnProperty('consentString')) {
        r.user = r.user || {};
        r.user.ext = {
          consent: gdprConsent.consentString || ''
        };
        if (gdprConsent.hasOwnProperty('addtlConsent') && gdprConsent.addtlConsent) {
          r.user.ext.consented_providers_settings = {
            addtl_consent: gdprConsent.addtlConsent
          };
        }
      }
    }
    if (bidderRequest.uspConsent) {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(r, 'regs.ext.us_privacy', bidderRequest.uspConsent);
      usPrivacy = bidderRequest.uspConsent;
    }
    const pageUrl = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bidderRequest, 'refererInfo.page');
    if (pageUrl) {
      r.site.page = pageUrl;
    }
    if (bidderRequest.gppConsent) {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(r, 'regs.gpp', bidderRequest.gppConsent.gppString);
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(r, 'regs.gpp_sid', bidderRequest.gppConsent.applicableSections);
    }
  }
  if (_src_config_js__WEBPACK_IMPORTED_MODULE_7__.config.getConfig('coppa')) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(r, 'regs.coppa', 1);
  }
  return r;
}

/**
 * addImpressions adds impressions to request object
 *
 * @param  {Array}  impressions        List of impressions to be added to the request.
 * @param  {Array}  impKeys            List of impression keys.
 * @param  {object} r                  Reuqest object.
 * @param  {number}    adUnitIndex        Index of the current add unit
 * @return {object}                    Reqyest object with added impressions describing the request to the server.
 */
function addImpressions(impressions, impKeys, r, adUnitIndex) {
  const adUnitImpressions = impressions[impKeys[adUnitIndex]];
  const {
    missingImps: missingBannerImpressions = [],
    ixImps = []
  } = adUnitImpressions;
  const sourceImpressions = {
    ixImps,
    missingBannerImpressions
  };
  const impressionObjects = Object.keys(sourceImpressions).map(key => sourceImpressions[key]).filter(item => Array.isArray(item)).reduce((acc, curr) => acc.concat(...curr), []);
  const gpid = impressions[impKeys[adUnitIndex]].gpid;
  const dfpAdUnitCode = impressions[impKeys[adUnitIndex]].dfp_ad_unit_code;
  const tid = impressions[impKeys[adUnitIndex]].tid;
  const sid = impressions[impKeys[adUnitIndex]].sid;
  const auctionEnvironment = impressions[impKeys[adUnitIndex]].ae;
  const paapi = impressions[impKeys[adUnitIndex]].paapi;
  const bannerImpressions = impressionObjects.filter(impression => _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.BANNER in impression);
  const otherImpressions = impressionObjects.filter(impression => !(_src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.BANNER in impression));
  if (bannerImpressions.length > 0) {
    const bannerImpsKeyed = bannerImpressions.reduce((acc, bannerImp) => {
      if (!acc[bannerImp.adunitCode]) {
        acc[bannerImp.adunitCode] = [];
      }
      acc[bannerImp.adunitCode].push(bannerImp);
      return acc;
    }, {});
    for (const impId in bannerImpsKeyed) {
      const bannerImps = bannerImpsKeyed[impId];
      const {
        id,
        banner: {
          topframe
        }
      } = bannerImps[0];
      let externalID = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bannerImps[0], 'ext.externalID');
      const _bannerImpression = {
        id,
        banner: {
          topframe,
          format: bannerImps.map(_ref => {
            let {
              banner: {
                w,
                h
              },
              ext
            } = _ref;
            return {
              w,
              h,
              ext
            };
          })
        }
      };
      for (let i = 0; i < _bannerImpression.banner.format.length; i++) {
        // We add sid and externalID in imp.ext therefore, remove from banner.format[].ext
        if (_bannerImpression.banner.format[i].ext != null) {
          if (_bannerImpression.banner.format[i].ext.sid != null) {
            delete _bannerImpression.banner.format[i].ext.sid;
          }
          if (_bannerImpression.banner.format[i].ext.externalID != null) {
            delete _bannerImpression.banner.format[i].ext.externalID;
          }
        }

        // add floor per size
        if ('bidfloor' in bannerImps[i]) {
          _bannerImpression.banner.format[i].ext.bidfloor = bannerImps[i].bidfloor;
        }
        if (JSON.stringify(_bannerImpression.banner.format[i].ext) === '{}') {
          delete _bannerImpression.banner.format[i].ext;
        }
      }
      const position = impressions[impKeys[adUnitIndex]].pos;
      if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isInteger)(position)) {
        _bannerImpression.banner.pos = position;
      }
      if (dfpAdUnitCode || gpid || tid || sid || auctionEnvironment || externalID || paapi) {
        _bannerImpression.ext = {};
        _bannerImpression.ext.dfp_ad_unit_code = dfpAdUnitCode;
        _bannerImpression.ext.gpid = gpid;
        _bannerImpression.ext.tid = tid;
        _bannerImpression.ext.sid = sid;
        _bannerImpression.ext.externalID = externalID;

        // enable fledge auction
        if (auctionEnvironment == 1) {
          _bannerImpression.ext.ae = 1;
          _bannerImpression.ext.paapi = paapi;
        }
      }
      if ('bidfloor' in bannerImps[0]) {
        _bannerImpression.bidfloor = bannerImps[0].bidfloor;
      }
      if ('bidfloorcur' in bannerImps[0]) {
        _bannerImpression.bidfloorcur = bannerImps[0].bidfloorcur;
      }
      const adUnitFPD = impressions[impKeys[adUnitIndex]].adUnitFPD;
      if (adUnitFPD) {
        (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(_bannerImpression, 'ext.data', adUnitFPD);
      }
      r.imp.push(_bannerImpression);
    }
  }
  if (otherImpressions.length > 0) {
    // Creates multiformat imp if they have the same ID
    // if not same ID, just add the imp to the imp array
    // Removes imp.ext.bidfloor
    // Sets imp.ext.siteID to one of the other [video/native].ext.siteid if imp.ext.siteID doesnt exist
    otherImpressions.forEach(imp => {
      if (gpid) {
        (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'ext.gpid', gpid);
      }
      if (r.imp.length > 0) {
        let matchFound = false;
        r.imp.forEach((rImp, index) => {
          if (imp.id === rImp.id && _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.VIDEO in imp) {
            rImp.video = imp.video;
            rImp.video.ext = Object.assign({}, imp.video.ext, imp.ext);
            if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(rImp, 'video.ext.bidfloor', false) && (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(rImp, 'bidfloor', false)) {
              if (rImp.video.ext.bidfloor < rImp.bidfloor) {
                rImp.bidfloor = rImp.video.ext.bidfloor;
              }
            }
            if (!(0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(rImp, 'ext.siteID', false) && (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(imp, 'video.ext.siteID')) {
              (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(rImp, 'ext.siteID', imp.video.ext.siteID);
              (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(r, 'ext.ixdiag.usid', true);
            }
            matchFound = true;
          } else if (imp.id === rImp.id && _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE in imp) {
            rImp.native = imp.native;
            rImp.native.ext = Object.assign({}, imp.native.ext, imp.ext);
            if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(rImp, 'native.ext.bidfloor', false) && (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(rImp, 'bidfloor', false)) {
              if (rImp.native.ext.bidfloor < rImp.bidfloor) {
                rImp.bidfloor = rImp.native.ext.bidfloor;
              }
            }
            if (!(0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(rImp, 'ext.siteID', false) && (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(imp, 'native.ext.siteID', false)) {
              (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(rImp, 'ext.siteID', imp.native.ext.siteID);
              (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(r, 'ext.ixdiag.usid', true);
            }
            matchFound = true;
          }
        });
        if (!matchFound) {
          r.imp.push(imp);
        }
      } else {
        r.imp.push(imp);
      }
    });
  }
  return r;
}

/**
This function retrieves the page URL and appends first party data query parameters
to it without adding duplicate query parameters. Returns original referer URL if no IX FPD exists.
@param {Object} bidderRequest - The bidder request object containing information about the bid and the page.
@returns {string} - The modified page URL with first party data query parameters appended.
 */
function getIxFirstPartyDataPageUrl(bidderRequest) {
  // Parse additional runtime configs.
  const bidderCode = bidderRequest && bidderRequest.bidderCode || 'ix';
  const otherIxConfig = _src_config_js__WEBPACK_IMPORTED_MODULE_7__.config.getConfig(bidderCode);
  let pageUrl = '';
  if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bidderRequest, 'ortb2.site.page')) {
    pageUrl = bidderRequest.ortb2.site.page;
  } else {
    pageUrl = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bidderRequest, 'refererInfo.page');
  }
  if (otherIxConfig) {
    // Append firstPartyData to r.site.page if firstPartyData exists.
    if (typeof otherIxConfig.firstPartyData === 'object') {
      const firstPartyData = otherIxConfig.firstPartyData;
      return appendIXQueryParams(bidderRequest, pageUrl, firstPartyData);
    }
  }
  return pageUrl;
}

/**
This function appends the provided query parameters to the given URL without adding duplicate query parameters.
@param {Object} bidderRequest - The bidder request object containing information about the bid and the page to be used as fallback in case url is not valid.
@param {string} url - The base URL to which query parameters will be appended.
@param {Object} params - An object containing key-value pairs of query parameters to append.
@returns {string} - The modified URL with the provided query parameters appended.
 */
function appendIXQueryParams(bidderRequest, url, params) {
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch (error) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)(`IX Bid Adapter: Invalid URL set in ortb2.site.page: ${url}. Using referer URL instead.`);
    urlObj = new URL((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bidderRequest, 'refererInfo.page'));
  }
  const searchParams = new URLSearchParams(urlObj.search);

  // Loop through the provided query parameters and append them
  for (const [key, value] of Object.entries(params)) {
    if (!searchParams.has(key)) {
      searchParams.append(key, value);
    }
  }

  // Construct the final URL with the updated query parameters
  urlObj.search = searchParams.toString();
  return urlObj.toString();
}

/**
 * addFPD adds ortb2 first party data to request object.
 *
 * @param  {object} bidderRequest     An object containing other info like gdprConsent.
 * @param  {object} r                 Reuqest object.
 * @param  {object} fpd               ortb2 first party data.
 * @param  {object} site              First party site data.
 * @param  {object} user              First party user data.
 * @return {object}                   Reqyest object with added FPD describing the request to the server.
 */
function addFPD(bidderRequest, r, fpd, site, user) {
  r.ext.ixdiag.fpd = true;
  Object.keys(site).forEach(key => {
    if (FIRST_PARTY_DATA.SITE.indexOf(key) === -1) {
      delete site[key];
    }
  });
  Object.keys(user).forEach(key => {
    if (FIRST_PARTY_DATA.USER.indexOf(key) === -1) {
      delete user[key];
    }
  });
  if (fpd.device) {
    const sua = {
      ...fpd.device.sua
    };
    if (!(0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isEmpty)(sua)) {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(r, 'device.sua', sua);
    }
  }

  // regulations from ortb2
  if (fpd.hasOwnProperty('regs') && !bidderRequest.gppConsent) {
    if (fpd.regs.hasOwnProperty('gpp') && typeof fpd.regs.gpp == 'string') {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(r, 'regs.gpp', fpd.regs.gpp);
    }
    if (fpd.regs.hasOwnProperty('gpp_sid') && Array.isArray(fpd.regs.gpp_sid)) {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(r, 'regs.gpp_sid', fpd.regs.gpp_sid);
    }
    if (fpd.regs.ext?.dsa) {
      const pubDsaObj = fpd.regs.ext.dsa;
      const dsaObj = {};
      ['dsarequired', 'pubrender', 'datatopub'].forEach(dsaKey => {
        if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isNumber)(pubDsaObj[dsaKey])) {
          dsaObj[dsaKey] = pubDsaObj[dsaKey];
        }
      });
      if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isArray)(pubDsaObj.transparency)) {
        const tpData = [];
        pubDsaObj.transparency.forEach(tpObj => {
          if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isPlainObject)(tpObj) && (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isStr)(tpObj.domain) && tpObj.domain != '' && (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isArray)(tpObj.dsaparams) && tpObj.dsaparams.every(v => (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isNumber)(v))) {
            tpData.push(tpObj);
          }
        });
        if (tpData.length > 0) {
          dsaObj.transparency = tpData;
        }
      }
      if (!(0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isEmpty)(dsaObj)) (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(r, 'regs.ext.dsa', dsaObj);
    }
  }
  return r;
}

/**
 * Adds First-Party Data (FPD) from the bid object to the imp object.
 *
 * @param {Object} imp - The imp object, representing an impression in the OpenRTB format.
 * @param {Object} bid - The bid object, containing information about the bid request.
 */
function addAdUnitFPD(imp, bid) {
  const adUnitFPD = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'ortb2Imp.ext.data');
  if (adUnitFPD) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(imp, 'ext.data', adUnitFPD);
  }
}

/**
 * addIdentifiersInfo adds indentifier info to ixDaig.
 *
 * @param  {Array}  impressions        List of impressions to be added to the request.
 * @param  {object} r                  Reuqest object.
 * @param  {Array}  impKeys            List of impression keys.
 * @param  {number}    adUnitIndex        Index of the current add unit
 * @param  {object} payload            Request payload object.
 * @param  {string} baseUrl            Base exchagne URL.
 * @return {object}                    Reqyest object with added indentigfier info to ixDiag.
 */
function addIdentifiersInfo(impressions, r, impKeys, adUnitIndex, payload, baseUrl) {
  const pbaAdSlot = impressions[impKeys[adUnitIndex]].pbadslot;
  const tagId = impressions[impKeys[adUnitIndex]].tagId;
  const adUnitCode = impressions[impKeys[adUnitIndex]].adUnitCode;
  const divId = impressions[impKeys[adUnitIndex]].divId;
  if (pbaAdSlot || tagId || adUnitCode || divId) {
    r.ext.ixdiag.pbadslot = pbaAdSlot;
    r.ext.ixdiag.tagid = tagId;
    r.ext.ixdiag.adunitcode = adUnitCode;
    r.ext.ixdiag.divId = divId;
  }
  return r;
}

/**
 * Return an object of user IDs stored by Prebid User ID module
 *
 * @returns {Array} ID providers that are present in userIds
 */
function _getUserIds(bidRequest) {
  const userIds = bidRequest.userId || {};
  return PROVIDERS.filter(provider => userIds[provider]);
}

/**
 * Calculates IX diagnostics values and packages them into an object
 *
 * @param {Array} validBidRequests - The valid bid requests from prebid
 * @param {boolean} fledgeEnabled - Flag indicating if protected audience (fledge) is enabled
 * @return {Object} IX diag values for ad units
 */
function buildIXDiag(validBidRequests, fledgeEnabled) {
  var adUnitMap = validBidRequests.map(bidRequest => bidRequest.adUnitCode).filter((value, index, arr) => arr.indexOf(value) === index);
  let allEids = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequests, '0.userIdAsEids', []);
  let ixdiag = {
    mfu: 0,
    bu: 0,
    iu: 0,
    nu: 0,
    ou: 0,
    allu: 0,
    ren: false,
    version: "9.20.0-pre",
    userIds: _getUserIds(validBidRequests[0]),
    url: window.location.href.split('?')[0],
    vpd: defaultVideoPlacement,
    ae: fledgeEnabled,
    eidLength: allEids.length
  };

  // create ad unit map and collect the required diag properties
  for (let adUnit of adUnitMap) {
    let bid = validBidRequests.filter(bidRequest => bidRequest.adUnitCode === adUnit)[0];
    if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes')) {
      if (Object.keys(bid.mediaTypes).length > 1) {
        ixdiag.mfu++;
      }
      if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.native')) {
        ixdiag.nu++;
      }
      if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.banner')) {
        ixdiag.bu++;
      }
      if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.video.context') === 'outstream') {
        ixdiag.ou++;
        if (isIndexRendererPreferred(bid)) {
          ixdiag.ren = true;
        }
      }
      if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.video.context') === 'instream') {
        ixdiag.iu++;
      }
      ixdiag.allu++;
    }
  }
  return ixdiag;
}

/**
 *
 * @param  {Array}   bannerSizeList list of banner sizes
 * @param  {Array}   bannerSize the size to be removed
 * @return {boolean} true if successfully removed, false if not found
 */

function removeFromSizes(bannerSizeList, bannerSize) {
  if (!bannerSize) return;
  for (let i = 0; i < bannerSizeList.length; i++) {
    const size = bannerSizeList[i];
    if (bannerSize[0] === size[0] && bannerSize[1] === size[1]) {
      bannerSizeList.splice(i, 1);
      break;
    }
  }
}

/**
 * Creates IX Native impressions based on validBidRequests
 * @param {object}  validBidRequest valid request provided by prebid
 * @param {object}  nativeImps reference to created native impressions
 */
function createNativeImps(validBidRequest, nativeImps) {
  const imp = bidToNativeImp(validBidRequest);
  if (Object.keys(imp).length != 0) {
    nativeImps[validBidRequest.adUnitCode] = {};
    nativeImps[validBidRequest.adUnitCode].ixImps = [];
    nativeImps[validBidRequest.adUnitCode].ixImps.push(imp);
    nativeImps[validBidRequest.adUnitCode].gpid = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'ortb2Imp.ext.gpid');
    nativeImps[validBidRequest.adUnitCode].dfp_ad_unit_code = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'ortb2Imp.ext.data.adserver.adslot');
    nativeImps[validBidRequest.adUnitCode].pbadslot = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'ortb2Imp.ext.data.pbadslot');
    nativeImps[validBidRequest.adUnitCode].tagId = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'params.tagId');
    const adUnitCode = validBidRequest.adUnitCode;
    const divId = document.getElementById(adUnitCode) ? adUnitCode : (0,_libraries_gptUtils_gptUtils_js__WEBPACK_IMPORTED_MODULE_8__.getGptSlotInfoForAdUnitCode)(adUnitCode).divId;
    nativeImps[validBidRequest.adUnitCode].adUnitCode = adUnitCode;
    nativeImps[validBidRequest.adUnitCode].divId = divId;
  }
}

/**
 * Creates IX Video impressions based on validBidRequests
 * @param {object}  validBidRequest valid request provided by prebid
 * @param {object}  videoImps reference to created video impressions
 */
function createVideoImps(validBidRequest, videoImps) {
  const imp = bidToVideoImp(validBidRequest);
  if (Object.keys(imp).length != 0) {
    videoImps[validBidRequest.adUnitCode] = {};
    videoImps[validBidRequest.adUnitCode].ixImps = [];
    videoImps[validBidRequest.adUnitCode].ixImps.push(imp);
    videoImps[validBidRequest.adUnitCode].gpid = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'ortb2Imp.ext.gpid');
    videoImps[validBidRequest.adUnitCode].dfp_ad_unit_code = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'ortb2Imp.ext.data.adserver.adslot');
    videoImps[validBidRequest.adUnitCode].pbadslot = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'ortb2Imp.ext.data.pbadslot');
    videoImps[validBidRequest.adUnitCode].tagId = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'params.tagId');
    const adUnitCode = validBidRequest.adUnitCode;
    const divId = document.getElementById(adUnitCode) ? adUnitCode : (0,_libraries_gptUtils_gptUtils_js__WEBPACK_IMPORTED_MODULE_8__.getGptSlotInfoForAdUnitCode)(adUnitCode).divId;
    videoImps[validBidRequest.adUnitCode].adUnitCode = adUnitCode;
    videoImps[validBidRequest.adUnitCode].divId = divId;
  }
}

/**
 * Creates IX banner impressions based on validBidRequests
 * @param {object}  validBidRequest valid request provided by prebid
 * @param {object}  missingBannerSizes reference to missing banner config sizes
 * @param {object}  bannerImps reference to created banner impressions
 */
function createBannerImps(validBidRequest, missingBannerSizes, bannerImps, bidderRequest) {
  let imp = bidToBannerImp(validBidRequest);
  const bannerSizeDefined = includesSize((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'mediaTypes.banner.sizes'), (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'params.size'));
  if (!bannerImps.hasOwnProperty(validBidRequest.adUnitCode)) {
    bannerImps[validBidRequest.adUnitCode] = {};
  }
  bannerImps[validBidRequest.adUnitCode].gpid = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'ortb2Imp.ext.gpid');
  bannerImps[validBidRequest.adUnitCode].dfp_ad_unit_code = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'ortb2Imp.ext.data.adserver.adslot');
  bannerImps[validBidRequest.adUnitCode].tid = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'ortb2Imp.ext.tid');
  bannerImps[validBidRequest.adUnitCode].pbadslot = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'ortb2Imp.ext.data.pbadslot');
  bannerImps[validBidRequest.adUnitCode].tagId = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'params.tagId');
  bannerImps[validBidRequest.adUnitCode].pos = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'mediaTypes.banner.pos');

  // Add Fledge flag if enabled
  const fledgeEnabled = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bidderRequest, 'paapi.enabled');
  if (fledgeEnabled) {
    const auctionEnvironment = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'ortb2Imp.ext.ae');
    const paapi = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'ortb2Imp.ext.paapi');
    if (paapi) {
      bannerImps[validBidRequest.adUnitCode].paapi = paapi;
    }
    if (auctionEnvironment) {
      if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.isInteger)(auctionEnvironment)) {
        bannerImps[validBidRequest.adUnitCode].ae = auctionEnvironment;
      } else {
        (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)('error setting auction environment flag - must be an integer');
      }
    }
  }

  // AdUnit-Specific First Party Data
  const adUnitFPD = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'ortb2Imp.ext.data');
  if (adUnitFPD) {
    bannerImps[validBidRequest.adUnitCode].adUnitFPD = adUnitFPD;
  }
  const sid = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'params.id');
  if (sid && (typeof sid === 'string' || typeof sid === 'number')) {
    bannerImps[validBidRequest.adUnitCode].sid = String(sid);
  }
  const adUnitCode = validBidRequest.adUnitCode;
  const divId = document.getElementById(adUnitCode) ? adUnitCode : (0,_libraries_gptUtils_gptUtils_js__WEBPACK_IMPORTED_MODULE_8__.getGptSlotInfoForAdUnitCode)(adUnitCode).divId;
  bannerImps[validBidRequest.adUnitCode].adUnitCode = adUnitCode;
  bannerImps[validBidRequest.adUnitCode].divId = divId;

  // Create IX imps from params.size
  if (bannerSizeDefined) {
    if (!bannerImps[validBidRequest.adUnitCode].hasOwnProperty('ixImps')) {
      bannerImps[validBidRequest.adUnitCode].ixImps = [];
    }
    bannerImps[validBidRequest.adUnitCode].ixImps.push(imp);
  }
  updateMissingSizes(validBidRequest, missingBannerSizes, imp);
}

/**
 * Updates the Object to track missing banner sizes.
 *
 * @param {object} validBidRequest    The bid request for an ad unit's with a configured size.
 * @param {object} missingBannerSizes The object containing missing banner sizes
 * @param {object} imp                The impression for the bidrequest
 */
function updateMissingSizes(validBidRequest, missingBannerSizes, imp) {
  if (missingBannerSizes.hasOwnProperty(validBidRequest.adUnitCode)) {
    let currentSizeList = [];
    if (missingBannerSizes[validBidRequest.adUnitCode].hasOwnProperty('missingSizes')) {
      currentSizeList = missingBannerSizes[validBidRequest.adUnitCode].missingSizes;
    }
    removeFromSizes(currentSizeList, validBidRequest.params.size);
    missingBannerSizes[validBidRequest.adUnitCode].missingSizes = currentSizeList;
  } else {
    // New Ad Unit
    if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'mediaTypes.banner.sizes')) {
      let sizeList = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.deepClone)(validBidRequest.mediaTypes.banner.sizes);
      removeFromSizes(sizeList, validBidRequest.params.size);
      let newAdUnitEntry = {
        'missingSizes': sizeList,
        'impression': imp
      };
      missingBannerSizes[validBidRequest.adUnitCode] = newAdUnitEntry;
    }
  }
}

/**
 * @param  {object} bid      ValidBidRequest object, used to adjust floor
 * @param  {object} imp      Impression object to be modified
 * @param  {Array}  newSize  The new size to be applied
 * @return {object} newImp   Updated impression object
 */
function createMissingBannerImp(bid, imp, newSize) {
  const newImp = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.deepClone)(imp);
  newImp.banner.w = newSize[0];
  newImp.banner.h = newSize[1];
  _applyFloor(bid, newImp, _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.BANNER);
  return newImp;
}

/**
 *
 * Initialize IX Outstream Renderer
 * @param {Object} bid
 */
function outstreamRenderer(bid) {
  bid.renderer.push(function () {
    const adUnitCode = bid.adUnitCode;
    const divId = document.getElementById(adUnitCode) ? adUnitCode : (0,_libraries_gptUtils_gptUtils_js__WEBPACK_IMPORTED_MODULE_8__.getGptSlotInfoForAdUnitCode)(adUnitCode).divId;
    if (!divId) {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)(`IX Bid Adapter: adUnitCode: ${divId} not found on page.`);
      return;
    }
    window.createIXPlayer(divId, bid);
  });
}

/**
 * Create Outstream Renderer
 * @param {string} id
 * @returns {Renderer}
 */
function createRenderer(id, renderUrl) {
  const renderer = _src_Renderer_js__WEBPACK_IMPORTED_MODULE_9__.Renderer.install({
    id: id,
    url: renderUrl,
    loaded: false
  });
  try {
    renderer.setRender(outstreamRenderer);
  } catch (err) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)('Prebid Error calling setRender on renderer', err);
    return null;
  }
  if (!renderUrl) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)('Outstream renderer URL not found');
    return null;
  }
  return renderer;
}

/**
 * Returns whether our renderer could potentially be used.
 * @param {*} bid bid object
 */
function isIndexRendererPreferred(bid) {
  if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.video.context') !== 'outstream') {
    return false;
  }

  // ad unit renderer could be on the adUnit.mediaTypes.video level or adUnit level
  let renderer = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.video.renderer');
  if (!renderer) {
    renderer = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'renderer');
  }
  const isValid = !!(typeof renderer === 'object' && renderer.url && renderer.render);

  // if renderer on the adunit is not valid or it's only a backup, our renderer may be used
  return !isValid || renderer.backupOnly;
}
function isExchangeIdConfigured() {
  let exchangeId = _src_config_js__WEBPACK_IMPORTED_MODULE_7__.config.getConfig('exchangeId');
  if (typeof exchangeId === 'number' && isFinite(exchangeId)) {
    return true;
  }
  if (typeof exchangeId === 'string' && exchangeId.trim() !== '' && isFinite(Number(exchangeId))) {
    return true;
  }
  return false;
}
const spec = {
  code: BIDDER_CODE,
  gvlid: GLOBAL_VENDOR_ID,
  supportedMediaTypes: SUPPORTED_AD_TYPES,
  /**
   * Determines whether or not the given bid request is valid.
   *
   * @param  {object}  bid The bid to validate.
   * @return {boolean}     True if this is a valid bid, and false otherwise.
   */
  isBidRequestValid: function (bid) {
    const paramsVideoRef = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'params.video');
    const paramsSize = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'params.size');
    const mediaTypeBannerSizes = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.banner.sizes');
    const mediaTypeVideoRef = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.video');
    const mediaTypeVideoPlayerSize = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.video.playerSize');
    const hasBidFloor = bid.params.hasOwnProperty('bidFloor');
    const hasBidFloorCur = bid.params.hasOwnProperty('bidFloorCur');
    if (bid.hasOwnProperty('mediaType') && !(0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.contains)(SUPPORTED_AD_TYPES, bid.mediaType)) {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)('IX Bid Adapter: media type is not supported.');
      return false;
    }
    if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.banner') && !mediaTypeBannerSizes) {
      return false;
    }
    if (paramsSize) {
      // since there is an ix bidder level size, make sure its valid
      const ixSize = getFirstSize(paramsSize);
      if (!ixSize) {
        (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)('IX Bid Adapter: size has invalid format.');
        return false;
      }
      // check if the ix bidder level size, is present in ad unit level
      if (!includesSize(bid.sizes, ixSize) && !includesSize(mediaTypeVideoPlayerSize, ixSize) && !includesSize(mediaTypeBannerSizes, ixSize)) {
        (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)('IX Bid Adapter: bid size is not included in ad unit sizes or player size.');
        return false;
      }
    }
    if (!isExchangeIdConfigured() && bid.params.siteId == undefined) {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)('IX Bid Adapter: Invalid configuration - either siteId or exchangeId must be configured.');
      return false;
    }
    if (bid.params.siteId !== undefined) {
      if (typeof bid.params.siteId !== 'string' && typeof bid.params.siteId !== 'number') {
        (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)('IX Bid Adapter: siteId must be string or number type.');
        return false;
      }
      if (typeof bid.params.siteId !== 'string' && isNaN(Number(bid.params.siteId))) {
        (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)('IX Bid Adapter: siteId must valid value');
        return false;
      }
    }
    if (hasBidFloor || hasBidFloorCur) {
      if (!(hasBidFloor && hasBidFloorCur && isValidBidFloorParams(bid.params.bidFloor, bid.params.bidFloorCur))) {
        (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)('IX Bid Adapter: bidFloor / bidFloorCur parameter has invalid format.');
        return false;
      }
    }
    if (mediaTypeVideoRef && paramsVideoRef) {
      const videoImp = bidToVideoImp(bid).video;
      const errorList = checkVideoParams(mediaTypeVideoRef, paramsVideoRef);
      if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bid, 'mediaTypes.video.context') === _src_video_js__WEBPACK_IMPORTED_MODULE_4__.OUTSTREAM && isIndexRendererPreferred(bid) && videoImp) {
        const outstreamPlayerSize = [(0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(videoImp, 'w'), (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(videoImp, 'h')];
        const isValidSize = outstreamPlayerSize[0] >= OUTSTREAM_MINIMUM_PLAYER_SIZE[0] && outstreamPlayerSize[1] >= OUTSTREAM_MINIMUM_PLAYER_SIZE[1];
        if (!isValidSize) {
          (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)(`IX Bid Adapter: ${outstreamPlayerSize} is an invalid size for IX outstream renderer`);
          return false;
        }
      }
      if (errorList.length) {
        errorList.forEach(err => {
          (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)(err);
        });
        return false;
      }
    }
    return nativeMediaTypeValid(bid);
  },
  // For testing only - resets the siteID to 0 so that it can be set again
  resetSiteID: function () {
    siteID = 0;
  },
  /**
   * Make a server request from the list of BidRequests.
   *
   * @param  {Array}  validBidRequests A list of valid bid request config objects.
   * @param  {object} bidderRequest    A object contains bids and other info like gdprConsent.
   * @return {object}                  Info describing the request to the server.
   */
  buildRequests: function (validBidRequests, bidderRequest) {
    const reqs = []; // Stores banner + video requests
    const bannerImps = {}; // Stores created banner impressions
    const videoImps = {}; // Stores created video impressions
    const nativeImps = {}; // Stores created native impressions
    const missingBannerSizes = {}; // To capture the missing sizes i.e not configured for ix
    FEATURE_TOGGLES.getFeatureToggles();

    // Step 1: Create impresssions from IX params
    validBidRequests.forEach(validBidRequest => {
      const adUnitMediaTypes = Object.keys((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(validBidRequest, 'mediaTypes', {}));
      for (const type in adUnitMediaTypes) {
        switch (adUnitMediaTypes[type]) {
          case _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.BANNER:
            createBannerImps(validBidRequest, missingBannerSizes, bannerImps, bidderRequest);
            break;
          case _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.VIDEO:
            createVideoImps(validBidRequest, videoImps);
            break;
          case _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE:
            createNativeImps(validBidRequest, nativeImps);
            break;
          default:
            (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)(`IX Bid Adapter: ad unit mediaTypes ${type} is not supported`);
        }
      }
    });

    // Step 2: Update banner impressions with missing sizes
    for (let adunitCode in missingBannerSizes) {
      if (missingBannerSizes.hasOwnProperty(adunitCode)) {
        let missingSizes = missingBannerSizes[adunitCode].missingSizes;
        if (!bannerImps.hasOwnProperty(adunitCode)) {
          bannerImps[adunitCode] = {};
        }
        if (!bannerImps[adunitCode].hasOwnProperty('missingImps')) {
          bannerImps[adunitCode].missingImps = [];
          bannerImps[adunitCode].missingCount = 0;
        }
        let origImp = missingBannerSizes[adunitCode].impression;
        for (let i = 0; i < missingSizes.length; i++) {
          let newImp = createMissingBannerImp(validBidRequests[0], origImp, missingSizes[i]);
          bannerImps[adunitCode].missingImps.push(newImp);
          bannerImps[adunitCode].missingCount++;
        }
      }
    }

    // Step 3: Build banner, video & native requests
    let allImps = [];
    if (Object.keys(bannerImps).length > 0) {
      allImps.push(bannerImps);
    }
    if (Object.keys(videoImps).length > 0) {
      allImps.push(videoImps);
    }
    if (Object.keys(nativeImps).length > 0) {
      allImps.push(nativeImps);
    }
    if (FEATURE_TOGGLES.isFeatureEnabled('pbjs_enable_multiformat')) {
      reqs.push(...buildRequest(validBidRequests, bidderRequest, combineImps(allImps)));
    } else {
      if (Object.keys(bannerImps).length > 0) {
        reqs.push(...buildRequest(validBidRequests, bidderRequest, bannerImps, BANNER_ENDPOINT_VERSION));
      }
      if (Object.keys(videoImps).length > 0) {
        reqs.push(...buildRequest(validBidRequests, bidderRequest, videoImps, VIDEO_ENDPOINT_VERSION));
      }
      if (Object.keys(nativeImps).length > 0) {
        reqs.push(...buildRequest(validBidRequests, bidderRequest, nativeImps));
      }
    }
    return reqs;
  },
  /**
   * Unpack the response from the server into a list of bids.
   *
   * @param  {object} serverResponse A successful response from the server.
   * @param  {object} bidderRequest  The bid request sent to the server.
   * @return {Array}                 An array of bids which were nested inside the server.
   */
  interpretResponse: function (serverResponse, bidderRequest) {
    const bids = [];
    let bid = null;

    // Extract the FLEDGE auction configuration list from the response
    let fledgeAuctionConfigs = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(serverResponse, 'body.ext.protectedAudienceAuctionConfigs') || [];
    FEATURE_TOGGLES.setFeatureToggles(serverResponse);
    if (!serverResponse.hasOwnProperty('body')) {
      return bids;
    }
    const responseBody = serverResponse.body;
    const seatbid = responseBody.seatbid || [];
    for (let i = 0; i < seatbid.length; i++) {
      if (!seatbid[i].hasOwnProperty('bid')) {
        continue;
      }

      // Transform rawBid in bid response to the format that will be accepted by prebid.
      const innerBids = seatbid[i].bid;
      const requestBid = bidderRequest.data;
      for (let j = 0; j < innerBids.length; j++) {
        const bidRequest = getBidRequest(innerBids[j].impid, requestBid.imp, bidderRequest.validBidRequests);
        bid = parseBid(innerBids[j], responseBody.cur, bidRequest);
        if (bid.mediaType === _src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.VIDEO && isIndexRendererPreferred(bidRequest)) {
          const renderUrl = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(responseBody, 'ext.videoplayerurl');
          bid.renderer = createRenderer(innerBids[j].bidId, renderUrl);
          if (!bid.renderer) {
            continue;
          }
        }
        bids.push(bid);
      }
      if ((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(requestBid, 'ext.ixdiag.err')) {
        if (storage.localStorageIsEnabled()) {
          try {
            storage.removeDataFromLocalStorage(LOCAL_STORAGE_KEY);
          } catch (e) {
            (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logError)('ix can not clear ixdiag from localStorage.');
          }
        }
      }
    }
    if (Array.isArray(fledgeAuctionConfigs) && fledgeAuctionConfigs.length > 0) {
      // Validate and filter fledgeAuctionConfigs
      fledgeAuctionConfigs = fledgeAuctionConfigs.filter(config => {
        if (!isValidAuctionConfig(config)) {
          (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)('Malformed auction config detected:', config);
          return false;
        }
        return true;
      });
      try {
        return {
          bids,
          paapi: fledgeAuctionConfigs
        };
      } catch (error) {
        (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)('Error attaching AuctionConfigs', error);
        return bids;
      }
    } else {
      return bids;
    }
  },
  /**
   * Determine which user syncs should occur
   * @param {object} syncOptions
   * @param {Array} serverResponses
   * @returns {Array} User sync pixels
   */
  getUserSyncs: function (syncOptions, serverResponses) {
    const syncs = [];
    let publisherSyncsPerBidderOverride = null;
    if (serverResponses.length > 0) {
      publisherSyncsPerBidderOverride = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_2__["default"])(serverResponses[0], 'body.ext.publishersyncsperbidderoverride');
    }
    if (publisherSyncsPerBidderOverride !== undefined && publisherSyncsPerBidderOverride == 0) {
      return [];
    }
    if (syncOptions.iframeEnabled) {
      syncs.push({
        type: 'iframe',
        url: IFRAME_USER_SYNC_URL
      });
    } else {
      let publisherSyncsPerBidder = null;
      if (_src_config_js__WEBPACK_IMPORTED_MODULE_7__.config.getConfig('userSync')) {
        publisherSyncsPerBidder = _src_config_js__WEBPACK_IMPORTED_MODULE_7__.config.getConfig('userSync').syncsPerBidder;
      }
      if (publisherSyncsPerBidder === 0) {
        publisherSyncsPerBidder = publisherSyncsPerBidderOverride;
      }
      if (publisherSyncsPerBidderOverride && (publisherSyncsPerBidder === 0 || publisherSyncsPerBidder)) {
        publisherSyncsPerBidder = publisherSyncsPerBidderOverride > publisherSyncsPerBidder ? publisherSyncsPerBidder : publisherSyncsPerBidderOverride;
      } else {
        publisherSyncsPerBidder = 1;
      }
      for (let i = 0; i < publisherSyncsPerBidder; i++) {
        syncs.push({
          type: 'image',
          url: buildImgSyncUrl(publisherSyncsPerBidder, i)
        });
      }
    }
    return syncs;
  }
};

/**
 * Build img user sync url
 * @param {number} syncsPerBidder number of syncs Per Bidder
 * @param {number} index index to pass
 * @returns {string} img user sync url
 */
function buildImgSyncUrl(syncsPerBidder, index) {
  let consentString = '';
  let gdprApplies = '0';
  if (gdprConsent && gdprConsent.hasOwnProperty('gdprApplies')) {
    gdprApplies = gdprConsent.gdprApplies ? '1' : '0';
  }
  if (gdprConsent && gdprConsent.hasOwnProperty('consentString')) {
    consentString = gdprConsent.consentString || '';
  }
  let siteIdParam = siteID !== 0 ? '&site_id=' + siteID.toString() : '';
  return IMG_USER_SYNC_URL + siteIdParam + '&p=' + syncsPerBidder.toString() + '&i=' + index.toString() + '&gdpr=' + gdprApplies + '&gdpr_consent=' + consentString + '&us_privacy=' + (usPrivacy || '');
}

/**
 * Combines all imps into a single object
 * @param {Array} imps array of imps
 * @returns object
 */
function combineImps(imps) {
  const result = {};
  imps.forEach(imp => {
    Object.keys(imp).forEach(key => {
      if (Object.keys(result).includes(key)) {
        if (result[key].hasOwnProperty('ixImps') && imp[key].hasOwnProperty('ixImps')) {
          result[key].ixImps = [...result[key].ixImps, ...imp[key].ixImps];
        } else if (result[key].hasOwnProperty('missingImps') && imp[key].hasOwnProperty('missingImps')) {
          result[key].missingImps = [...result[key].missingImps, ...imp[key].missingImps];
        } else if (imp[key].hasOwnProperty('ixImps')) {
          result[key].ixImps = imp[key].ixImps;
        } else if (imp[key].hasOwnProperty('missingImps')) {
          result[key].missingImps = imp[key].missingImps;
        }
      } else {
        result[key] = imp[key];
      }
    });
  });
  return result;
}

/**
 * Deduplicates ext fields. For example if imp.ext.tid exists, removes imp.banner.ext.tid
 *
 * @param {object} r request object
 * @returns object
 */
function deduplicateImpExtFields(r) {
  r.imp.forEach((imp, index) => {
    const impExt = imp.ext;
    if (impExt == undefined) {
      return r;
    }
    if (getFormatCount(imp) < 2) {
      return;
    }
    Object.keys(impExt).forEach(key => {
      if (_src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.BANNER in imp) {
        const bannerExt = imp.banner.ext;
        if (bannerExt !== undefined && bannerExt[key] !== undefined && bannerExt[key] == impExt[key]) {
          delete r.imp[index].banner.ext[key];
        }
        if (imp.banner.format !== undefined) {
          for (let i = 0; i < imp.banner.format.length; i++) {
            if (imp.banner.format[i].ext != undefined && imp.banner.format[i].ext[key] != undefined && imp.banner.format[i].ext[key] == impExt[key]) {
              delete r.imp[index].banner.format[i].ext[key];
            }
          }
        }
      }
      if (_src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.VIDEO in imp) {
        const videoExt = imp.video.ext;
        if (videoExt !== undefined && videoExt[key] !== undefined && videoExt[key] == impExt[key]) {
          delete r.imp[index].video.ext[key];
        }
      }
      if (_src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE in imp) {
        const nativeExt = imp.native.ext;
        if (nativeExt !== undefined && nativeExt[key] !== undefined && nativeExt[key] == impExt[key]) {
          delete r.imp[index].native.ext[key];
        }
      }
    });
  });
  return r;
}

/**
 * Removes ext.siteids in multiformat scenario
 * Site id will be set only at imp.ext.siteId
 *
 * @param {object} r request object
 * @returns object
 */
function removeSiteIDs(r) {
  r.imp.forEach((imp, index) => {
    const impExt = imp.ext;
    if (impExt == undefined) {
      return r;
    }
    if (getFormatCount(imp) < 2) {
      return;
    }
    if (_src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.BANNER in imp) {
      const bannerExt = imp.banner.ext;
      if (bannerExt !== undefined && bannerExt.siteID !== undefined) {
        delete r.imp[index].banner.ext.siteID;
      }
      if (imp.banner.format !== undefined) {
        for (let i = 0; i < imp.banner.format.length; i++) {
          if (imp.banner.format[i].ext !== undefined && imp.banner.format[i].ext.siteID !== undefined) {
            (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(r.imp[index], 'ext.siteID', imp.banner.format[i].ext.siteID);
            (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_5__.dset)(r, 'ext.ixdiag.usid', true);
            delete r.imp[index].banner.format[i].ext.siteID;
          }
        }
      }
    }
    if (_src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.VIDEO in imp) {
      const videoExt = imp.video.ext;
      if (videoExt !== undefined && videoExt.siteID !== undefined) {
        delete r.imp[index].video.ext.siteID;
      }
    }
    if (_src_mediaTypes_js__WEBPACK_IMPORTED_MODULE_0__.NATIVE in imp) {
      const nativeExt = imp.native.ext;
      if (nativeExt !== undefined && nativeExt.siteID !== undefined) {
        delete r.imp[index].native.ext.siteID;
      }
    }
  });
  return r;
}

/**
 * Gets count of banner/video/native formats in imp
 * @param {object} imp
 * @returns int
 */
function getFormatCount(imp) {
  let formatCount = 0;
  if (imp.banner !== undefined) {
    formatCount += 1;
  }
  if (imp.video !== undefined) {
    formatCount += 1;
  }
  if (imp.native !== undefined) {
    formatCount += 1;
  }
  return formatCount;
}

/**
 * Checks if auction config is valid
 * @param {object} config
 * @returns bool
 */
function isValidAuctionConfig(config) {
  return typeof config === 'object' && config !== null;
}

/**
 * Adds device.w / device.h info
 * @param {object} r
 * @returns object
 */
function addDeviceInfo(r) {
  if (r.device == undefined) {
    r.device = {};
  }
  r.device.h = window.screen.height;
  r.device.w = window.screen.width;
  return r;
}
(0,_src_adapters_bidderFactory_js__WEBPACK_IMPORTED_MODULE_10__.registerBidder)(spec);
(0,_src_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_11__.registerModule)('ixBidAdapter');

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ __webpack_require__.O(0, ["gptUtils","chunk-core","creative-renderer-display"], () => (__webpack_exec__("./modules/ixBidAdapter.js")));
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);

"use strict";
(self["pbjsChunk"] = self["pbjsChunk"] || []).push([["permutiveRtdProvider"],{

/***/ "./modules/permutiveRtdProvider.js":
/*!*****************************************!*\
  !*** ./modules/permutiveRtdProvider.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* unused harmony exports PERMUTIVE_SUBMODULE_CONFIG_KEY, PERMUTIVE_STANDARD_KEYWORD, PERMUTIVE_CUSTOM_COHORTS_KEYWORD, PERMUTIVE_STANDARD_AUD_KEYWORD, storage, getModuleConfig, setBidderRtb, isAcEnabled, isPermutiveOnPage, getSegments, readAndSetCohorts, permutiveSubmodule */
/* harmony import */ var _src_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../src/prebidGlobal.js */ "./src/prebidGlobal.js");
/* harmony import */ var _src_hook_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../src/hook.js */ "./src/hook.js");
/* harmony import */ var _src_storageManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../src/storageManager.js */ "./src/storageManager.js");
/* harmony import */ var _src_utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../src/utils.js */ "./src/utils.js");
/* harmony import */ var _src_utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../src/utils.js */ "./node_modules/dlv/index.js");
/* harmony import */ var _src_utils_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../src/utils.js */ "./node_modules/dset/dist/index.mjs");
/* harmony import */ var _src_polyfill_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../src/polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _src_activities_modules_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../src/activities/modules.js */ "./src/activities/modules.js");

/**
 * This module adds permutive provider to the real time data module
 * The {@link module:modules/realTimeData} module is required
 * The module will add custom segment targeting to ad units of specific bidders
 * @module modules/permutiveRtdProvider
 * @requires module:modules/realTimeData
 */







/**
 * @typedef {import('../modules/rtdModule/index.js').RtdSubmodule} RtdSubmodule
 */

const MODULE_NAME = 'permutive';
const logger = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_0__.prefixLog)('[PermutiveRTD]');
const PERMUTIVE_SUBMODULE_CONFIG_KEY = 'permutive-prebid-rtd';
const PERMUTIVE_STANDARD_KEYWORD = 'p_standard';
const PERMUTIVE_CUSTOM_COHORTS_KEYWORD = 'permutive';
const PERMUTIVE_STANDARD_AUD_KEYWORD = 'p_standard_aud';
const storage = (0,_src_storageManager_js__WEBPACK_IMPORTED_MODULE_1__.getStorageManager)({
  moduleType: _src_activities_modules_js__WEBPACK_IMPORTED_MODULE_2__.MODULE_TYPE_RTD,
  moduleName: MODULE_NAME
});
function init(moduleConfig, userConsent) {
  readPermutiveModuleConfigFromCache();
  return true;
}
function liftIntoParams(params) {
  return (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(params) ? {
    params
  } : {};
}
let cachedPermutiveModuleConfig = {};

/**
 * Access the submodules RTD params that are cached to LocalStorage by the Permutive SDK. This lets the RTD submodule
 * apply publisher defined params set in the Permutive platform, so they may still be applied if the Permutive SDK has
 * not initialised before this submodule is initialised.
 */
function readPermutiveModuleConfigFromCache() {
  const params = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_0__.safeJSONParse)(storage.getDataFromLocalStorage(PERMUTIVE_SUBMODULE_CONFIG_KEY));
  return cachedPermutiveModuleConfig = liftIntoParams(params);
}

/**
 * Access the submodules RTD params attached to the Permutive SDK.
 *
 * @return The Permutive config available by the Permutive SDK or null if the operation errors.
 */
function getParamsFromPermutive() {
  try {
    return liftIntoParams(window.permutive.addons.prebid.getPermutiveRtdConfig());
  } catch (e) {
    return null;
  }
}

/**
 * Merges segments into existing bidder config in reverse priority order. The highest priority is 1.
 *
 *   1. customModuleConfig <- set by publisher with pbjs.setConfig
 *   2. permutiveRtdConfig <- set by the publisher using the Permutive platform
 *   3. defaultConfig
 *
 * As items with a higher priority will be deeply merged into the previous config, deep merges are performed by
 * reversing the priority order.
 *
 * @param {Object} customModuleConfig - Publisher config for module
 * @return {Object} Deep merges of the default, Permutive and custom config.
 */
function getModuleConfig(customModuleConfig) {
  // Use the params from Permutive if available, otherwise fallback to the cached value set by Permutive.
  const permutiveModuleConfig = getParamsFromPermutive() || cachedPermutiveModuleConfig;
  return (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_0__.mergeDeep)({
    waitForIt: false,
    params: {
      maxSegs: 500,
      acBidders: [],
      overwrites: {}
    }
  }, permutiveModuleConfig, customModuleConfig);
}

/**
 * Sets ortb2 config for ac bidders
 * @param {Object} bidderOrtb2 - The ortb2 object for the all bidders
 * @param {Object} moduleConfig - Publisher config for module
 * @param {Object} segmentData - Segment data grouped by bidder or type
 */
function setBidderRtb(bidderOrtb2, moduleConfig, segmentData) {
  const acBidders = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__["default"])(moduleConfig, 'params.acBidders');
  const maxSegs = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__["default"])(moduleConfig, 'params.maxSegs');
  const transformationConfigs = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__["default"])(moduleConfig, 'params.transformations') || [];
  const ssps = segmentData?.ssp?.ssps ?? [];
  const sspCohorts = segmentData?.ssp?.cohorts ?? [];
  const topics = segmentData?.topics ?? {};
  const bidders = new Set([...acBidders, ...ssps]);
  bidders.forEach(function (bidder) {
    const currConfig = {
      ortb2: bidderOrtb2[bidder] || {}
    };
    let cohorts = [];
    const isAcBidder = acBidders.indexOf(bidder) > -1;
    if (isAcBidder) {
      cohorts = segmentData.ac;
    }
    const isSspBidder = ssps.indexOf(bidder) > -1;
    if (isSspBidder) {
      cohorts = [...new Set([...cohorts, ...sspCohorts])].slice(0, maxSegs);
    }
    const nextConfig = updateOrtbConfig(bidder, currConfig, cohorts, sspCohorts, topics, transformationConfigs, segmentData);
    bidderOrtb2[bidder] = nextConfig.ortb2;
  });
}

/**
 * Updates `user.data` object in existing bidder config with Permutive segments
 * @param {string} bidder - The bidder identifier
 * @param {Object} currConfig - Current bidder config
 * @param {string[]} segmentIDs - Permutive segment IDs
 * @param {string[]} sspSegmentIDs - Permutive SSP segment IDs
 * @param {Object} topics - Privacy Sandbox Topics, keyed by IAB taxonomy version (600, 601, etc.)
 * @param {Object[]} transformationConfigs - array of objects with `id` and `config` properties, used to determine
 *                                           the transformations on user data to include the ORTB2 object
 * @param {Object} segmentData - The segments available for targeting
 * @return {Object} Merged ortb2 object
 */
function updateOrtbConfig(bidder, currConfig, segmentIDs, sspSegmentIDs, topics, transformationConfigs, segmentData) {
  logger.logInfo(`Current ortb2 config`, {
    bidder,
    config: currConfig
  });
  const customCohortsData = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__["default"])(segmentData, bidder) || [];
  const name = 'permutive.com';
  const permutiveUserData = {
    name,
    segment: segmentIDs.map(segmentId => ({
      id: segmentId
    }))
  };
  const transformedUserData = transformationConfigs.filter(_ref => {
    let {
      id
    } = _ref;
    return ortb2UserDataTransformations.hasOwnProperty(id);
  }).map(_ref2 => {
    let {
      id,
      config
    } = _ref2;
    return ortb2UserDataTransformations[id](permutiveUserData, config);
  });
  const customCohortsUserData = {
    name: PERMUTIVE_CUSTOM_COHORTS_KEYWORD,
    segment: customCohortsData.map(cohortID => ({
      id: cohortID
    }))
  };
  const ortbConfig = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_0__.mergeDeep)({}, currConfig);
  const currentUserData = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__["default"])(ortbConfig, 'ortb2.user.data') || [];
  let topicsUserData = [];
  for (const [k, value] of Object.entries(topics)) {
    topicsUserData.push({
      name,
      ext: {
        segtax: Number(k)
      },
      segment: value.map(topic => ({
        id: topic.toString()
      }))
    });
  }
  const updatedUserData = currentUserData.filter(el => el.name !== permutiveUserData.name && el.name !== customCohortsUserData.name).concat(permutiveUserData, transformedUserData, customCohortsUserData).concat(topicsUserData);
  logger.logInfo(`Updating ortb2.user.data`, {
    bidder,
    user_data: updatedUserData
  });
  (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_4__.dset)(ortbConfig, 'ortb2.user.data', updatedUserData);

  // Set ortb2.user.keywords
  const currentKeywords = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__["default"])(ortbConfig, 'ortb2.user.keywords');
  const keywordGroups = {
    [PERMUTIVE_STANDARD_KEYWORD]: segmentIDs,
    [PERMUTIVE_STANDARD_AUD_KEYWORD]: sspSegmentIDs,
    [PERMUTIVE_CUSTOM_COHORTS_KEYWORD]: customCohortsData
  };

  // Transform groups of key-values into a single array of strings
  // i.e { permutive: ['1', '2'], p_standard: ['3', '4'] } => ['permutive=1', 'permutive=2', 'p_standard=3',' p_standard=4']
  const transformedKeywordGroups = Object.entries(keywordGroups).flatMap(_ref3 => {
    let [keyword, ids] = _ref3;
    return ids.map(id => `${keyword}=${id}`);
  });
  const keywords = [currentKeywords, ...transformedKeywordGroups].filter(Boolean).join(',');
  logger.logInfo(`Updating ortb2.user.keywords`, {
    bidder,
    keywords
  });
  (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_4__.dset)(ortbConfig, 'ortb2.user.keywords', keywords);

  // Set user extensions
  if (segmentIDs.length > 0) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_4__.dset)(ortbConfig, `ortb2.user.ext.data.${PERMUTIVE_STANDARD_KEYWORD}`, segmentIDs);
    logger.logInfo(`Extending ortb2.user.ext.data with "${PERMUTIVE_STANDARD_KEYWORD}"`, segmentIDs);
  }
  if (customCohortsData.length > 0) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_4__.dset)(ortbConfig, `ortb2.user.ext.data.${PERMUTIVE_CUSTOM_COHORTS_KEYWORD}`, customCohortsData.map(String));
    logger.logInfo(`Extending ortb2.user.ext.data with "${PERMUTIVE_CUSTOM_COHORTS_KEYWORD}"`, customCohortsData);
  }

  // Set site extensions
  if (segmentIDs.length > 0) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_4__.dset)(ortbConfig, `ortb2.site.ext.permutive.${PERMUTIVE_STANDARD_KEYWORD}`, segmentIDs);
    logger.logInfo(`Extending ortb2.site.ext.permutive with "${PERMUTIVE_STANDARD_KEYWORD}"`, segmentIDs);
  }
  logger.logInfo(`Updated ortb2 config`, {
    bidder,
    config: ortbConfig
  });
  return ortbConfig;
}

/**
 * Set segments on bid request object
 * @param {Object} reqBidsConfigObj - Bid request object
 * @param {Object} moduleConfig - Module configuration
 * @param {Object} segmentData - Segment object
 */
function setSegments(reqBidsConfigObj, moduleConfig, segmentData) {
  const adUnits = reqBidsConfigObj && reqBidsConfigObj.adUnits || (0,_src_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_5__.getGlobal)().adUnits;
  const utils = {
    deepSetValue: _src_utils_js__WEBPACK_IMPORTED_MODULE_4__.dset,
    deepAccess: _src_utils_js__WEBPACK_IMPORTED_MODULE_3__["default"],
    isFn: _src_utils_js__WEBPACK_IMPORTED_MODULE_0__.isFn,
    mergeDeep: _src_utils_js__WEBPACK_IMPORTED_MODULE_0__.mergeDeep
  };
  const aliasMap = {
    appnexusAst: 'appnexus'
  };
  if (!adUnits) {
    return;
  }
  adUnits.forEach(adUnit => {
    adUnit.bids.forEach(bid => {
      let {
        bidder
      } = bid;
      if (typeof aliasMap[bidder] !== 'undefined') {
        bidder = aliasMap[bidder];
      }
      const acEnabled = isAcEnabled(moduleConfig, bidder);
      const customFn = getCustomBidderFn(moduleConfig, bidder);
      if (customFn) {
        // For backwards compatibility we pass an identity function to any custom bidder function set by a publisher
        const bidIdentity = bid => bid;
        customFn(bid, segmentData, acEnabled, utils, bidIdentity);
      }
    });
  });
}

/**
 * Catch and log errors
 * @param {function} fn - Function to safely evaluate
 */
function makeSafe(fn) {
  try {
    return fn();
  } catch (e) {
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_0__.logError)(e);
  }
}
function getCustomBidderFn(moduleConfig, bidder) {
  const overwriteFn = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__["default"])(moduleConfig, `params.overwrites.${bidder}`);
  if (overwriteFn && (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_0__.isFn)(overwriteFn)) {
    return overwriteFn;
  } else {
    return null;
  }
}

/**
 * Check whether ac is enabled for bidder
 * @param {Object} moduleConfig - Module configuration
 * @param {string} bidder - Bidder name
 * @return {boolean}
 */
function isAcEnabled(moduleConfig, bidder) {
  const acBidders = (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__["default"])(moduleConfig, 'params.acBidders') || [];
  return (0,_src_polyfill_js__WEBPACK_IMPORTED_MODULE_6__.includes)(acBidders, bidder);
}

/**
 * Check whether Permutive is on page
 * @return {boolean}
 */
function isPermutiveOnPage() {
  return typeof window.permutive !== 'undefined' && typeof window.permutive.ready === 'function';
}

/**
 * Get all relevant segment IDs in an object
 * @param {number} maxSegs - Maximum number of segments to be included
 * @return {Object}
 */
function getSegments(maxSegs) {
  const segments = {
    ac: makeSafe(() => {
      const legacySegs = makeSafe(() => readSegments('_psegs', []).map(Number).filter(seg => seg >= 1000000).map(String)) || [];
      const _ppam = makeSafe(() => readSegments('_ppam', []).map(String)) || [];
      const _pcrprs = makeSafe(() => readSegments('_pcrprs', []).map(String)) || [];
      return [..._pcrprs, ..._ppam, ...legacySegs];
    }) || [],
    ix: makeSafe(() => {
      const _pindexs = readSegments('_pindexs', []);
      return _pindexs.map(String);
    }) || [],
    rubicon: makeSafe(() => {
      const _prubicons = readSegments('_prubicons', []);
      return _prubicons.map(String);
    }) || [],
    appnexus: makeSafe(() => {
      const _papns = readSegments('_papns', []);
      return _papns.map(String);
    }) || [],
    gam: makeSafe(() => {
      const _pdfps = readSegments('_pdfps', []);
      return _pdfps.map(String);
    }) || [],
    ssp: makeSafe(() => {
      const _pssps = readSegments('_pssps', {
        cohorts: [],
        ssps: []
      });
      return {
        cohorts: makeSafe(() => _pssps.cohorts.map(String)) || [],
        ssps: makeSafe(() => _pssps.ssps.map(String)) || []
      };
    }),
    topics: makeSafe(() => {
      const _ppsts = readSegments('_ppsts', {});
      const topics = {};
      for (const [k, value] of Object.entries(_ppsts)) {
        topics[k] = makeSafe(() => value.map(String)) || [];
      }
      return topics;
    }) || {}
  };
  for (const bidder in segments) {
    if (bidder === 'ssp') {
      if (segments[bidder].cohorts && Array.isArray(segments[bidder].cohorts)) {
        segments[bidder].cohorts = segments[bidder].cohorts.slice(0, maxSegs);
      }
    } else if (bidder === 'topics') {
      for (const taxonomy in segments[bidder]) {
        segments[bidder][taxonomy] = segments[bidder][taxonomy].slice(0, maxSegs);
      }
    } else {
      segments[bidder] = segments[bidder].slice(0, maxSegs);
    }
  }
  logger.logInfo(`Read segments`, segments);
  return segments;
}

/**
 * Gets an array of segment IDs from LocalStorage
 * or return the default value provided.
 * @template A
 * @param {string} key
 * @param {A} defaultValue
 * @return {A}
 */
function readSegments(key, defaultValue) {
  try {
    return JSON.parse(storage.getDataFromLocalStorage(key)) || defaultValue;
  } catch (e) {
    return defaultValue;
  }
}
const unknownIabSegmentId = '_unknown_';

/**
 * Functions to apply to ORT2B2 `user.data` objects.
 * Each function should return an a new object containing a `name`, (optional) `ext` and `segment`
 * properties. The result of the each transformation defined here will be appended to the array
 * under `user.data` in the bid request.
 */
const ortb2UserDataTransformations = {
  iab: (userData, config) => ({
    name: userData.name,
    ext: {
      segtax: config.segtax
    },
    segment: (userData.segment || []).map(segment => ({
      id: iabSegmentId(segment.id, config.iabIds)
    })).filter(segment => segment.id !== unknownIabSegmentId)
  })
};

/**
 * Transform a Permutive segment ID into an IAB audience taxonomy ID.
 * @param {string} permutiveSegmentId
 * @param {Object} iabIds object of mappings between Permutive and IAB segment IDs (key: permutive ID, value: IAB ID)
 * @return {string} IAB audience taxonomy ID associated with the Permutive segment ID
 */
function iabSegmentId(permutiveSegmentId, iabIds) {
  return iabIds[permutiveSegmentId] || unknownIabSegmentId;
}

/**
 * Pull the latest configuration and cohort information and update accordingly.
 *
 * @param reqBidsConfigObj - Bidder provided config for request
 * @param moduleConfig - Publisher provided config
 */
function readAndSetCohorts(reqBidsConfigObj, moduleConfig) {
  const segmentData = getSegments((0,_src_utils_js__WEBPACK_IMPORTED_MODULE_3__["default"])(moduleConfig, 'params.maxSegs'));
  makeSafe(function () {
    // Legacy route with custom parameters
    // ACK policy violation, in process of removing
    setSegments(reqBidsConfigObj, moduleConfig, segmentData);
  });
  makeSafe(function () {
    // Route for bidders supporting ORTB2
    setBidderRtb(reqBidsConfigObj.ortb2Fragments?.bidder, moduleConfig, segmentData);
  });
}
let permutiveSDKInRealTime = false;

/** @type {RtdSubmodule} */
const permutiveSubmodule = {
  name: MODULE_NAME,
  getBidRequestData: function (reqBidsConfigObj, callback, customModuleConfig) {
    const completeBidRequestData = () => {
      logger.logInfo(`Request data updated`);
      callback();
    };
    const moduleConfig = getModuleConfig(customModuleConfig);
    readAndSetCohorts(reqBidsConfigObj, moduleConfig);
    makeSafe(function () {
      if (permutiveSDKInRealTime || !(moduleConfig.waitForIt && isPermutiveOnPage())) {
        return completeBidRequestData();
      }
      window.permutive.ready(function () {
        logger.logInfo(`SDK is realtime, updating cohorts`);
        permutiveSDKInRealTime = true;
        readAndSetCohorts(reqBidsConfigObj, getModuleConfig(customModuleConfig));
        completeBidRequestData();
      }, 'realtime');
      logger.logInfo(`Registered cohort update when SDK is realtime`);
    });
  },
  init: init
};
(0,_src_hook_js__WEBPACK_IMPORTED_MODULE_7__.submodule)('realTimeData', permutiveSubmodule);
(0,_src_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_5__.registerModule)('permutiveRtdProvider');

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ __webpack_require__.O(0, ["chunk-core","creative-renderer-display"], () => (__webpack_exec__("./modules/permutiveRtdProvider.js")));
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);

"use strict";
(self["pbjsChunk"] = self["pbjsChunk"] || []).push([["rtdModule"],{

/***/ "./modules/rtdModule/index.js":
/*!************************************!*\
  !*** ./modules/rtdModule/index.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* unused harmony exports subModules, attachRealTimeDataProvider, init, setBidRequestsData, getAdUnitTargeting, deepMerge, onDataDeletionRequest */
/* harmony import */ var _src_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../../src/prebidGlobal.js */ "./src/prebidGlobal.js");
/* harmony import */ var _src_config_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../src/config.js */ "./src/config.js");
/* harmony import */ var _src_hook_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../src/hook.js */ "./src/hook.js");
/* harmony import */ var _src_utils_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../src/utils.js */ "./src/utils.js");
/* harmony import */ var _src_events_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../src/events.js */ "./src/events.js");
/* harmony import */ var _src_constants_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../src/constants.js */ "./src/constants.js");
/* harmony import */ var _src_adapterManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../src/adapterManager.js */ "./src/adapterManager.js");
/* harmony import */ var _src_consentHandler_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../src/consentHandler.js */ "./src/consentHandler.js");
/* harmony import */ var _src_polyfill_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../src/polyfill.js */ "./src/polyfill.js");
/* harmony import */ var _src_utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../src/utils/perfMetrics.js */ "./src/utils/perfMetrics.js");
/* harmony import */ var _src_activities_modules_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../src/activities/modules.js */ "./src/activities/modules.js");
/* harmony import */ var _libraries_objectGuard_ortbGuard_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../libraries/objectGuard/ortbGuard.js */ "./libraries/objectGuard/ortbGuard.js");
/* harmony import */ var _src_activities_params_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../src/activities/params.js */ "./src/activities/params.js");

/**
 * This module adds Real time data support to prebid.js
 * @module modules/realTimeData
 * @typedef {import('../../modules/rtdModule/index.js').SubmoduleConfig} SubmoduleConfig
 */

/**
 * @interface UserConsentData
 */
/**
 * @property
 * @summary gdpr consent
 * @name UserConsentData#gdpr
 * @type {Object}
 */
/**
 * @property
 * @summary usp consent
 * @name UserConsentData#usp
 * @type {Object}
 */
/**
 * @property
 * @summary coppa
 * @name UserConsentData#coppa
 * @type {boolean}
 */

/**
 * @interface RtdSubmodule
 */

/**
 * @function
 * @summary return real time data
 * @name RtdSubmodule#getTargetingData
 * @param {string[]} adUnitsCodes
 * @param {SubmoduleConfig} config
 * @param {UserConsentData} userConsent
 * @param {auction} auction
 */

/**
 * @function
 * @summary modify bid request data
 * @name RtdSubmodule#getBidRequestData
 * @param {Object} reqBidsConfigObj
 * @param {function} callback
 * @param {SubmoduleConfig} config
 * @param {UserConsentData} userConsent
 */

/**
 * @property
 * @summary used to link submodule with config
 * @name RtdSubmodule#name
 * @type {string}
 */

/**
 * @property
 * @summary used to link submodule with config
 * @name RtdSubmodule#config
 * @type {Object}
 */

/**
 * @function
 * @summary init sub module
 * @name RtdSubmodule#init
 * @param {SubmoduleConfig} config
 * @param {UserConsentData} user consent
 * @return {boolean} false to remove sub module
 */

/**
 * @function
 * @summary on auction init event
 * @name RtdSubmodule#onAuctionInitEvent
 * @param {Object} data
 * @param {SubmoduleConfig} config
 * @param {UserConsentData} userConsent
 */

/**
 * @function
 * @summary on auction end event
 * @name RtdSubmodule#onAuctionEndEvent
 * @param {Object} data
 * @param {SubmoduleConfig} config
 * @param {UserConsentData} userConsent
 */

/**
 * @function
 * @summary on bid response event
 * @name RtdSubmodule#onBidResponseEvent
 * @param {Object} data
 * @param {SubmoduleConfig} config
 * @param {UserConsentData} userConsent
 */

/**
 * @function
 * @summary on bid requested event
 * @name RtdSubmodule#onBidRequestEvent
 * @param {Object} data
 * @param {SubmoduleConfig} config
 * @param {UserConsentData} userConsent
 */

/**
 * @function
 * @summary on data deletion request
 * @name RtdSubmodule#onDataDeletionRequest
 * @param {SubmoduleConfig} config
 */

/**
 * @interface ModuleConfig
 */

/**
 * @property
 * @summary auction delay
 * @name ModuleConfig#auctionDelay
 * @type {number}
 */

/**
 * @property
 * @summary list of sub modules
 * @name ModuleConfig#dataProviders
 * @type {SubmoduleConfig[]}
 */

/**
 * @interface SubModuleConfig
 */

/**
 * @property
 * @summary params for provide (sub module)
 * @name SubModuleConfig#params
 * @type {Object}
 */

/**
 * @property
 * @summary name
 * @name ModuleConfig#name
 * @type {string}
 */

/**
 * @property
 * @summary delay auction for this sub module
 * @name ModuleConfig#waitForIt
 * @type {boolean}
 */













const activityParams = (0,_src_activities_params_js__WEBPACK_IMPORTED_MODULE_0__.activityParamsBuilder)(al => _src_adapterManager_js__WEBPACK_IMPORTED_MODULE_1__["default"].resolveAlias(al));

/** @type {string} */
const MODULE_NAME = 'realTimeData';
/** @type {RtdSubmodule[]} */
let registeredSubModules = [];
/** @type {RtdSubmodule[]} */
let subModules = [];
/** @type {ModuleConfig} */
let _moduleConfig;
/** @type {SubmoduleConfig[]} */
let _dataProviders = [];
/** @type {UserConsentData} */
let _userConsent;

/**
 * Register a Real-Time Data (RTD) submodule.
 *
 * @param {Object} submodule The RTD submodule to register.
 * @param {string} submodule.name The name of the RTD submodule.
 * @param {number} [submodule.gvlid] The Global Vendor List ID (GVLID) of the RTD submodule.
 * @returns {function(): void} A de-registration function that will unregister the module when called.
 */
function attachRealTimeDataProvider(submodule) {
  registeredSubModules.push(submodule);
  _src_consentHandler_js__WEBPACK_IMPORTED_MODULE_2__.GDPR_GVLIDS.register(_src_activities_modules_js__WEBPACK_IMPORTED_MODULE_3__.MODULE_TYPE_RTD, submodule.name, submodule.gvlid);
  return function detach() {
    const idx = registeredSubModules.indexOf(submodule);
    if (idx >= 0) {
      registeredSubModules.splice(idx, 1);
      initSubModules();
    }
  };
}

/**
 * call each sub module event function by config order
 */
const setEventsListeners = function () {
  let registered = false;
  return function setEventsListeners() {
    if (!registered) {
      Object.entries({
        [_src_constants_js__WEBPACK_IMPORTED_MODULE_4__.EVENTS.AUCTION_INIT]: ['onAuctionInitEvent'],
        [_src_constants_js__WEBPACK_IMPORTED_MODULE_4__.EVENTS.AUCTION_END]: ['onAuctionEndEvent', getAdUnitTargeting],
        [_src_constants_js__WEBPACK_IMPORTED_MODULE_4__.EVENTS.BID_RESPONSE]: ['onBidResponseEvent'],
        [_src_constants_js__WEBPACK_IMPORTED_MODULE_4__.EVENTS.BID_REQUESTED]: ['onBidRequestEvent'],
        [_src_constants_js__WEBPACK_IMPORTED_MODULE_4__.EVENTS.BID_ACCEPTED]: ['onBidAcceptedEvent']
      }).forEach(_ref => {
        let [ev, [handler, preprocess]] = _ref;
        _src_events_js__WEBPACK_IMPORTED_MODULE_5__.on(ev, args => {
          preprocess && preprocess(args);
          subModules.forEach(sm => {
            try {
              sm[handler] && sm[handler](args, sm.config, _userConsent);
            } catch (e) {
              (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_6__.logError)(`RTD provider '${sm.name}': error in '${handler}':`, e);
            }
          });
        });
      });
      registered = true;
    }
  };
}();
function init(config) {
  const confListener = config.getConfig(MODULE_NAME, _ref2 => {
    let {
      realTimeData
    } = _ref2;
    if (!realTimeData.dataProviders) {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_6__.logError)('missing parameters for real time module');
      return;
    }
    confListener(); // unsubscribe config listener
    _moduleConfig = realTimeData;
    _dataProviders = realTimeData.dataProviders;
    setEventsListeners();
    (0,_src_hook_js__WEBPACK_IMPORTED_MODULE_7__.getHook)('startAuction').before(setBidRequestsData, 20); // RTD should run before FPD
    _src_adapterManager_js__WEBPACK_IMPORTED_MODULE_1__["default"].callDataDeletionRequest.before(onDataDeletionRequest);
    initSubModules();
  });
}
function getConsentData() {
  return {
    gdpr: _src_consentHandler_js__WEBPACK_IMPORTED_MODULE_2__.gdprDataHandler.getConsentData(),
    usp: _src_consentHandler_js__WEBPACK_IMPORTED_MODULE_2__.uspDataHandler.getConsentData(),
    gpp: _src_consentHandler_js__WEBPACK_IMPORTED_MODULE_2__.gppDataHandler.getConsentData(),
    coppa: !!_src_config_js__WEBPACK_IMPORTED_MODULE_8__.config.getConfig('coppa')
  };
}

/**
 * call each sub module init function by config order
 * if no init function / init return failure / module not configured - remove it from submodules list
 */
function initSubModules() {
  _userConsent = getConsentData();
  let subModulesByOrder = [];
  _dataProviders.forEach(provider => {
    const sm = (0,_src_polyfill_js__WEBPACK_IMPORTED_MODULE_9__.find)(registeredSubModules, s => s.name === provider.name);
    const initResponse = sm && sm.init && sm.init(provider, _userConsent);
    if (initResponse) {
      subModulesByOrder.push(Object.assign(sm, {
        config: provider
      }));
    }
  });
  subModules = subModulesByOrder;
  (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_6__.logInfo)(`Real time data module enabled, using submodules: ${subModules.map(m => m.name).join(', ')}`);
}

/**
 * loop through configured data providers If the data provider has registered getBidRequestData,
 * call it, providing reqBidsConfigObj, consent data and module params
 * this allows submodules to modify bidders
 * @param {Object} reqBidsConfigObj required; This is the same param that's used in pbjs.requestBids.
 * @param {function} fn required; The next function in the chain, used by hook.js
 */
const setBidRequestsData = (0,_src_utils_perfMetrics_js__WEBPACK_IMPORTED_MODULE_10__.timedAuctionHook)('rtd', function setBidRequestsData(fn, reqBidsConfigObj) {
  _userConsent = getConsentData();
  const relevantSubModules = [];
  const prioritySubModules = [];
  subModules.forEach(sm => {
    if (typeof sm.getBidRequestData !== 'function') {
      return;
    }
    relevantSubModules.push(sm);
    const config = sm.config;
    if (config && config.waitForIt) {
      prioritySubModules.push(sm);
    }
  });
  const shouldDelayAuction = prioritySubModules.length && _moduleConfig.auctionDelay && _moduleConfig.auctionDelay > 0;
  let callbacksExpected = prioritySubModules.length;
  let isDone = false;
  let waitTimeout;
  const verifiers = [];
  if (!relevantSubModules.length) {
    return exitHook();
  }
  waitTimeout = setTimeout(exitHook, shouldDelayAuction ? _moduleConfig.auctionDelay : 0);
  relevantSubModules.forEach(sm => {
    const fpdGuard = (0,_libraries_objectGuard_ortbGuard_js__WEBPACK_IMPORTED_MODULE_11__.guardOrtb2Fragments)(reqBidsConfigObj.ortb2Fragments || {}, activityParams(_src_activities_modules_js__WEBPACK_IMPORTED_MODULE_3__.MODULE_TYPE_RTD, sm.name));
    verifiers.push(fpdGuard.verify);
    reqBidsConfigObj.ortb2Fragments = fpdGuard.obj;
    sm.getBidRequestData(reqBidsConfigObj, onGetBidRequestDataCallback.bind(sm), sm.config, _userConsent);
  });
  function onGetBidRequestDataCallback() {
    if (isDone) {
      return;
    }
    if (this.config && this.config.waitForIt) {
      callbacksExpected--;
    }
    if (callbacksExpected === 0) {
      setTimeout(exitHook, 0);
    }
  }
  function exitHook() {
    if (isDone) {
      return;
    }
    isDone = true;
    clearTimeout(waitTimeout);
    verifiers.forEach(fn => fn());
    fn.call(this, reqBidsConfigObj);
  }
});

/**
 * loop through configured data providers If the data provider has registered getTargetingData,
 * call it, providing ad unit codes, consent data and module params
 * the sub mlodle will return data to set on the ad unit
 * this function used to place key values on primary ad server per ad unit
 * @param {Object} auction object received on auction end event
 */
function getAdUnitTargeting(auction) {
  const relevantSubModules = subModules.filter(sm => typeof sm.getTargetingData === 'function');
  if (!relevantSubModules.length) {
    return;
  }

  // get data
  const adUnitCodes = auction.adUnitCodes;
  if (!adUnitCodes) {
    return;
  }
  let targeting = [];
  for (let i = relevantSubModules.length - 1; i >= 0; i--) {
    const smTargeting = relevantSubModules[i].getTargetingData(adUnitCodes, relevantSubModules[i].config, _userConsent, auction);
    if (smTargeting && typeof smTargeting === 'object') {
      targeting.push(smTargeting);
    } else {
      (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_6__.logWarn)('invalid getTargetingData response for sub module', relevantSubModules[i].name);
    }
  }
  // place data on auction adUnits
  const mergedTargeting = deepMerge(targeting);
  auction.adUnits.forEach(adUnit => {
    const kv = adUnit.code && mergedTargeting[adUnit.code];
    if (!kv) {
      return;
    }
    (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_6__.logInfo)('RTD set ad unit targeting of', kv, 'for', adUnit);
    adUnit[_src_constants_js__WEBPACK_IMPORTED_MODULE_4__.JSON_MAPPING.ADSERVER_TARGETING] = Object.assign(adUnit[_src_constants_js__WEBPACK_IMPORTED_MODULE_4__.JSON_MAPPING.ADSERVER_TARGETING] || {}, kv);
  });
  return auction.adUnits;
}

/**
 * deep merge array of objects
 * @param {Array} arr - objects array
 * @return {Object} merged object
 */
function deepMerge(arr) {
  if (!Array.isArray(arr) || !arr.length) {
    return {};
  }
  return arr.reduce((merged, obj) => {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (!merged.hasOwnProperty(key)) merged[key] = obj[key];else {
          // duplicate key - merge values
          const dp = obj[key];
          for (let dk in dp) {
            if (dp.hasOwnProperty(dk)) merged[key][dk] = dp[dk];
          }
        }
      }
    }
    return merged;
  }, {});
}
function onDataDeletionRequest(next) {
  subModules.forEach(sm => {
    if (typeof sm.onDataDeletionRequest === 'function') {
      try {
        sm.onDataDeletionRequest(sm.config);
      } catch (e) {
        (0,_src_utils_js__WEBPACK_IMPORTED_MODULE_6__.logError)(`Error executing ${sm.name}.onDataDeletionRequest`, e);
      }
    }
  });
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }
  next.apply(this, args);
}
(0,_src_hook_js__WEBPACK_IMPORTED_MODULE_7__.module)('realTimeData', attachRealTimeDataProvider);
init(_src_config_js__WEBPACK_IMPORTED_MODULE_8__.config);
(0,_src_prebidGlobal_js__WEBPACK_IMPORTED_MODULE_12__.registerModule)('rtdModule');

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ __webpack_require__.O(0, ["objectGuard","chunk-core","creative-renderer-display"], () => (__webpack_exec__("./modules/rtdModule/index.js")));
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);

})()
 
   pbjs.processQueue();
 
} else {
 try {
  if(window.pbjs.getConfig('debug')) {
    console.warn('Attempted to load a copy of Prebid.js that clashes with the existing \'pbjs\' instance. Load aborted.');
  }
 } catch (e) {}
}

//# sourceMappingURL=prebid.js.map
