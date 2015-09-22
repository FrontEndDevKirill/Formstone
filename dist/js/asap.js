/*! formstone v0.8.14 [asap.js] 2015-09-22 | MIT License | formstone.it */

!function(a,b,c){"use strict";function d(c){r||b.support.history&&(p=b.$body,r=a.extend(t,c),r.$container=a(r.container),r.render===a.noop&&(r.render=l),r.transitionOut===a.noop&&(r.transitionOut=function(){return a.Deferred().resolve()}),z=window.location.href,u.on(x.popState,h),e())}function e(){p&&!p.hasClass(y.base)&&p.on(x.click,t.selector,g).addClass(y.base)}function f(a){r&&b.support.history?a&&i(a):window.location.href=a}function g(a){var b=a.currentTarget;a.which>1||a.metaKey||a.ctrlKey||a.shiftKey||a.altKey||window.location.protocol!==b.protocol||window.location.host!==b.host||"_blank"===b.target||(!b.hash||b.href.replace(b.hash,"")!==window.location.href.replace(location.hash,"")&&b.href!==window.location.href+"#")&&(w.killEvent(a),a.stopImmediatePropagation(),b.href!==z&&i(b.href))}function h(a){var b=a.originalEvent.state;b&&(r.modal&&0===A&&b.url&&!b.initial?window.location.href=b.url:b.url!==z&&(r.force?i(b.url):(u.trigger(x.requested,[!0]),k(b.url,b.hash,b.data,b.scroll,!1))))}function i(b){q&&q.abort(),u.trigger(x.requested,[!1]),r.transitionOutDeferred=r.transitionOut.apply(v,[!1]);var c=j(b),d=c.data,e=c.hash,f=c.url,g="User error",h=null,i=a.Deferred();d[r.requestKey]=!0,q=a.ajax({url:f,data:d,dataType:"json",cache:r.cache,xhr:function(){var a=new v.XMLHttpRequest;return a.addEventListener("progress",function(a){if(a.lengthComputable){var b=a.loaded/a.total;u.trigger(x.progress,[b])}},!1),a},success:function(d,f,g){h="string"===a.type(d)?a.parseJSON(d):d,d.location&&(b=d.location,c=j(b),e=c.hash),i.resolve()},error:function(a,b,c){g=c,i.reject()}}),a.when(i,r.transitionOutDeferred).done(function(){k(b,e,h,r.jump?0:!1,!0)}).fail(function(){u.trigger(x.failed,[g])})}function j(a){var b=a.indexOf("?"),c=a.indexOf("#"),d={},e="",f=a;return c>-1&&(e=a.slice(c),f=a.slice(0,c)),b>-1&&(d=o(a.slice(b+1,c>-1?c:a.length)),f=a.slice(0,b)),{hash:e,data:d,url:a}}function k(b,c,d,e,f){if(u.trigger(x.loaded,[d]),a.analytics("pageview"),r.render.call(this,d,c),z=b,f&&(history.pushState({url:z,data:d,scroll:e,hash:c},"state-"+z,z),A++),u.trigger(x.rendered,[d]),""!==c){var g=a(c);g.length&&(e=g.offset().top)}e!==!1&&u.scrollTop(e)}function l(b,c){if("undefined"!==a.type(b)){var d;for(var e in b)b.hasOwnProperty(e)&&(d=a(e),d.length&&d.html(b[e]))}}function m(b){var c=[];if("undefined"!==a.type(b)){var d;for(var e in b)b.hasOwnProperty(e)&&(d=a(e),d.length&&(c[e]=d.html()))}history.replaceState({url:z,data:c,scroll:u.scrollTop()},"state-"+z,z)}function n(a){var b=history.state,c=[];b&&b.data&&(c=b.data),z=a,m(c)}function o(a){for(var b={},c=a.slice(a.indexOf("?")+1).split("&"),d=0;d<c.length;d++){var e=c[d].split("=");b[e[0]]=e[1]}return b}var p,q,r,s=b.Plugin("asap",{utilities:{_initialize:d,load:f,replace:n},events:{failed:"failed",loaded:"loaded",popState:"popstate",progress:"progress",requested:"requested",rendered:"rendered"}}),t={cache:!0,force:!1,jump:!0,modal:!1,selector:"a",render:a.noop,requestKey:"fs-asap",transitionOut:a.noop},u=b.$window,v=u[0],w=s.functions,x=s.events,y=s.classes.raw,z="",A=0}(jQuery,Formstone);