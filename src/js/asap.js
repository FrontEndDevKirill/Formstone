;(function ($, Formstone, undefined) {

	/* global ga */

	"use strict";
	/**
	 * @method private
	 * @name initialize
	 * @description Initializes plugin.
	 * @param opts [object] "Plugin options"
	 */

	function initialize(options) {
		if (Instance) {
			return;
		}

		// Check for push/pop support
		if (!Formstone.support.history) {
			return;
		}

		$Body = Formstone.$body;

		Instance = $.extend(Defaults, options);

		Instance.$container = $(Instance.container);

		if (Instance.render === $.noop) {
			Instance.render = renderState;
		}

		if (Instance.transitionOut === $.noop) {
			Instance.transitionOut = function() {
				return $.Deferred().resolve();
			};
		}

		// Capture current url & state
		CurrentURL = window.location.href;

		// Bind state events
		$Window.on(Events.popState, onPop);

		enable();
	}

	/**
	 * @method private
	 * @name disable
	 * @description Disable ASAP
	 * @example $.asap("enable");
	 */

	function disable() {
		if ($Body && $Body.hasClass(RawClasses.base)) {
			$Body.off(Events.click)
				 .removeClass(RawClasses.base);
		}
	}

	/**
	 * @method private
	 * @name enable
	 * @description Enables ASAP
	 * @example $.asap("enable");
	 */

	function enable() {
		if ($Body && !$Body.hasClass(RawClasses.base)) {
			$Body.on(Events.click, Defaults.selector, onClick)
				 .addClass(RawClasses.base);
		}
	}

	/**
	 * @method
	 * @name load
	 * @description Loads new page
	 * @param opts [url] <''> "URL to load"
	 * @example $.asap("load", "http://website.com/page/");
	 */

	/**
	 * @method private
	 * @name load
	 * @description Loads new page
	 * @param opts [url] <''> "URL to load"
	 */

	function load(url) {
		if (!Instance || !Formstone.support.history) {
			window.location.href = url;
		} else if (url) {
			requestURL(url);
		}

		return;
	}

	/**
	 * @method private
	 * @name onClick
	 * @description Handles click events
	 * @param e [object] "Event data"
	 */

	function onClick(e) {
		var url = e.currentTarget;

		// Ignore everything but normal click
		if (  (e.which > 1 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) || (window.location.protocol !== url.protocol || window.location.host !== url.host) || url.target === "_blank" ) {
			return;
		}

		// Update state on hash change
		if (url.hash && (url.href.replace(url.hash, "") === window.location.href.replace(location.hash, "") || url.href === window.location.href + "#")) {
			return;
		}

		Functions.killEvent(e);
		e.stopImmediatePropagation();

		if (url.href !== CurrentURL) {
			requestURL(url.href);
		}
	}

	/**
	 * @method private
	 * @name onPop
	 * @description Handles history navigation events
	 * @param e [object] "Event data"
	 */

	function onPop(e) {
		var data = e.originalEvent.state;

		if (data) {
			if (Instance.modal && Visited === 0 && data.url && !data.initial) {
				// If opening content in a 'modal', return to original page on reload->back
				window.location.href = data.url;
			} else {
				// Check if data exists
				if (data.url !== CurrentURL) {
					if (Instance.force) {
						// Force a new request, even if navigating back
						requestURL(data.url);
					} else {
						// Fire request event
						$Window.trigger(Events.requested, [ true ]);

						process(data.url, data.hash, data.data, data.scroll, false);
					}
				}
			}
		}
	}

	/**
	 * @method private
	 * @name requestURL
	 * @description Requests new content via AJAX
	 * @param url [string] "URL to load"
	 */

	function requestURL(url) {
		if (Request) {
			Request.abort();
		}

		// Fire request event
		$Window.trigger(Events.requested, [ false ]);

		// Get transition out deferred
		Instance.transitionOutDeferred = Instance.transitionOut.apply(Window, [ false ]);

		var parsed     = parseURL(url),
			data       = parsed.data,
			hash       = parsed.hash,
			cleanURL   = parsed.url,
			error      = "User error",
			response   = null,
			requestDeferred = $.Deferred();

		data[ Instance.requestKey ] = true;

		// Request new content
		Request = $.ajax({
			url: cleanURL,
			data: data,
			dataType: "json",
			cache: Instance.cache,
			xhr: function() {
				// custom xhr
				var xhr = new Window.XMLHttpRequest();

				/*
				//Upload progress ?
				xhr.upload.addEventListener("progress", function(e) {
					if (e.lengthComputable) {
						var percent = (e.loaded / e.total) / 2;
						$window.trigger(Events.progress, [ percent ]);
					}
				}, false);
				*/

				//Download progress
				xhr.addEventListener("progress", function(e) {
					if (e.lengthComputable) {
						var percent = e.loaded / e.total;
						$Window.trigger(Events.progress, [ percent ]);
					}
				}, false);

				return xhr;
			},
			success: function(resp, status, jqXHR) {
				response  = ($.type(resp) === "string") ? $.parseJSON(resp) : resp;

				// handle redirects - requires passing new location with json response
				if (resp.location) {
					url = resp.location;

					parsed = parseURL(url);
					hash   = parsed.hash;
				}

				requestDeferred.resolve();
			},
			error: function(jqXHR, status, err) {
				error = err;

				requestDeferred.reject();
			}
		});

		$.when(requestDeferred, Instance.transitionOutDeferred).done(function() {
			process(url, hash, response, (Instance.jump ? 0 : false), true);
		}).fail(function() {
			$Window.trigger(Events.failed, [ error ]);
		});
	}

	/**
	 * @method private
	 * @name parseURL
	 * @description Parse url parts
	 * @param url [string] "URL to parse"
	 */

	function parseURL(url) {
		var queryIndex = url.indexOf("?"),
			hashIndex  = url.indexOf("#"),
			data       = {},
			hash       = "",
			cleanURL   = url;

		if (hashIndex > -1) {
			hash = url.slice(hashIndex);
			cleanURL = url.slice(0, hashIndex);
		}

		if (queryIndex > -1) {
			data = getQueryParams( url.slice(queryIndex + 1, ((hashIndex > -1) ? hashIndex : url.length)) );
			cleanURL = url.slice(0, queryIndex);
		}

		return {
			hash    : hash,
			data    : data,
			url     : url
		};
	}

	/**
	 * @method private
	 * @name process
	 * @description Processes a state
	 * @param url [string] "State URL"
	 * @param data [object] "State Data"
	 * @param scrollTop [int] "Current scroll position"
	 * @param doPush [boolean] "Flag to replace or add state"
	 */

	function process(url, hash, data, scrollTop, doPush) {
		// Fire load event
		$Window.trigger(Events.loaded, [ data ]);

		// Trigger analytics page view
		$.analytics("pageview");

		// Update current state before rendering new state
		// saveState(data);

		// Render before updating
		Instance.render.call(this, data, hash);

		// Update current url
		CurrentURL = url;

		if (doPush) {
			// Push new states to the stack
			history.pushState({
				url: CurrentURL,
				data: data,
				scroll: scrollTop,
				hash: hash
			}, "state-" + CurrentURL, CurrentURL);

			Visited++;
		} else {
			// Update state with history data
			// saveState(data);
		}

		$Window.trigger(Events.rendered, [ data ]);

		if (hash !== "") {
			var $el = $(hash);

			if ($el.length) {
				scrollTop = $el.offset().top;
			}
		}

		if (scrollTop !== false) {
			$Window.scrollTop(scrollTop);
		}
	}

	/**
	 * @method private
	 * @name renderState
	 * @description Renders a new state
	 * @param data [object] "State Data"
	 * @param hash [string] "Hash"
	 */

	function renderState(data, hash) {
		// Update DOM
		if ($.type(data) !== "undefined") {
			var $target;

			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					$target = $(key);

					if ($target.length) {
						$target.html(data[key]);
					}
				}
			}
		}
	}

	/**
	 * @method private
	 * @name saveState
	 * @description Saves the current state
	 * @param data [object] "State Data"
	 */

	function saveState(data) {
		var cache = [];

		if ($.type(data) !== "undefined") {
			var $target;

			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					$target = $(key);

					if ($target.length) {
						cache[key] = $target.html();
					}
				}
			}
		}

		// Update state
		history.replaceState({
			url: CurrentURL,
			data: cache,
			scroll: $Window.scrollTop()
		}, "state-" + CurrentURL, CurrentURL);
	}

	/**
	 * @method private
	 * @name replaceURL
	 * @description Updates current url in history
	 * @param url [string] "New URL"
	 */

	/**
	 * @method
	 * @name replace
	 * @description Updates current url in history
	 * @param url [string] "New URL"
	 */

	function replaceURL(url) {
		var currentState = history.state,
			data = [];

		if (currentState && currentState.data) {
			data = currentState.data;
		}

		CurrentURL = url;

		saveState(data);
	}

	/**
	 * @method private
	 * @name unescape
	 * @description Unescapes HTML
	 * @param text [string] "Text to unescape"
	 */

	function unescape(text) {
		return text.replace(/&lt;/g, "<")
				   .replace(/&gt;/g, ">")
				   .replace(/&nbsp;/g, " ")
				   .replace(/&amp;/g, "&")
				   .replace(/&quot;/g, '"')
				   .replace(/&#039;/g, "'");
	}

	/**
	 * @method private
	 * @name getQueryParams
	 * @description Returns keyed object containing all GET query parameters
	 * @param url [string] "URL to parse"
	 * @return [object] "Keyed query params"
	 */

	function getQueryParams(url) {
		var params = {},
			parts = url.slice( url.indexOf("?") + 1 ).split("&");

		for (var i = 0; i < parts.length; i++) {
			var part = parts[i].split("=");
			params[ part[0] ] = part[1];
		}

		return params;
    }

	/**
	 * @plugin
	 * @name ASAP
	 * @description A jQuery plugin for asynchronous page loads.
	 * @type utility
	 * @main asap.js
	 * @dependency jQuery
	 * @dependency core.js
	 * @dependency analytics.js
	 */

	var Plugin = Formstone.Plugin("asap", {
			utilities: {
				_initialize    : initialize,

				load           : load,
				replace        : replaceURL
			},

			/**
			 * @events
			 * @event requested.asap "Before request is made; triggered on window. Second parameter 'true' if pop event"
			 * @event progress.asap "As request is loaded; triggered on window"
			 * @event loaded.asap "After request is loaded; triggered on window"
			 * @event rendered.asap "After state is rendered; triggered on window"
			 * @event failed.asap "After load error; triggered on window"
			 */

			events: {
				failed      : "failed",
				loaded      : "loaded",
				popState    : "popstate",
				progress    : "progress",
				requested   : "requested",
				rendered    : "rendered"
			}
		}),

		/**
		 * @options
		 * @param cache [boolean] <true> "Cache AJAX responses"
		 * @param force [boolean] <false> "Forces new requests when navigating back/forward"
		 * @param jump [boolean] <true> "Jump page to top on render"
		 * @param modal [boolean] <false> "Flag for content loaded into modal"
		 * @param selector [string] <'a'> "Target DOM Selector"
		 * @param render [function] <$.noop> "Custom render function"
		 * @param requestKey [string] <'fs-asap'> "GET variable for requests"
		 * @param transitionOut [function] <$.noop> "Transition timing callback; should return user defined $.Deferred object, which must eventually resolve"
		 */

		Defaults = {
			cache         : true,
			force         : false,
			jump          : true,
			modal         : false,
			selector      : "a",
			render        : $.noop,
			requestKey    : "fs-asap",
			transitionOut   : $.noop
		},

		// Localize References

		$Window       = Formstone.$window,
		Window        = $Window[0],
		$Body,

		Functions     = Plugin.functions,
		Events        = Plugin.events,
		RawClasses    = Plugin.classes.raw,

		// Internal

		CurrentURL    = '',
		Visited       = 0,
		Request,
		Instance;
})(jQuery, Formstone);