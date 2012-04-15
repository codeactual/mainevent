/* ==========================================================
 * bootstrap-carousel.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#carousel
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */
!function(a){var b=function(d,c){this.$element=a(d);this.options=a.extend({},a.fn.carousel.defaults,c);this.options.slide&&this.slide(this.options.slide);this.options.pause=="hover"&&this.$element.on("mouseenter",a.proxy(this.pause,this)).on("mouseleave",a.proxy(this.cycle,this))};b.prototype={cycle:function(){this.interval=setInterval(a.proxy(this.next,this),this.options.interval);return this},to:function(g){var c=this.$element.find(".active"),d=c.parent().children(),e=d.index(c),f=this;if(g>(d.length-1)||g<0){return}if(this.sliding){return this.$element.one("slid",function(){f.to(g)})}if(e==g){return this.pause().cycle()}return this.slide(g>e?"next":"prev",a(d[g]))},pause:function(){clearInterval(this.interval);this.interval=null;return this},next:function(){if(this.sliding){return}return this.slide("next")},prev:function(){if(this.sliding){return}return this.slide("prev")},slide:function(f,e){var c=this.$element.find(".active"),d=e||c[f](),j=this.interval,h=f=="next"?"left":"right",i=f=="next"?"first":"last",g=this;this.sliding=true;j&&this.pause();d=d.length?d:this.$element.find(".item")[i]();if(d.hasClass("active")){return}if(!a.support.transition&&this.$element.hasClass("slide")){this.$element.trigger("slide");c.removeClass("active");d.addClass("active");this.sliding=false;this.$element.trigger("slid")}else{d.addClass(f);d[0].offsetWidth;c.addClass(h);d.addClass(h);this.$element.trigger("slide");this.$element.one(a.support.transition.end,function(){d.removeClass([f,h].join(" ")).addClass("active");c.removeClass(["active",h].join(" "));g.sliding=false;setTimeout(function(){g.$element.trigger("slid")},0)})}j&&this.cycle();return this}};a.fn.carousel=function(c){return this.each(function(){var f=a(this),e=f.data("carousel"),d=typeof c=="object"&&c;if(!e){f.data("carousel",(e=new b(this,d)))}if(typeof c=="number"){e.to(c)}else{if(typeof c=="string"||(c=d.slide)){e[c]()}else{e.cycle()}}})};a.fn.carousel.defaults={interval:5000,pause:"hover"};a.fn.carousel.Constructor=b;a(function(){a("body").on("click.carousel.data-api","[data-slide]",function(h){var g=a(this),d,c=a(g.attr("data-target")||(d=g.attr("href"))&&d.replace(/.*(?=#[^\s]+$)/,"")),f=!c.data("modal")&&a.extend({},c.data(),g.data());c.carousel(f);h.preventDefault()})})}(window.jQuery);
/* ========================================================
 * bootstrap-tab.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#tabs
 * ========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================== */
!function(b){var a=function(c){this.element=b(c)};a.prototype={constructor:a,show:function(){var g=this.element,e=g.closest("ul:not(.dropdown-menu)"),d=g.attr("data-target"),f,c;if(!d){d=g.attr("href");d=d&&d.replace(/.*(?=#[^\s]*$)/,"")}if(g.parent("li").hasClass("active")){return}f=e.find(".active a").last()[0];g.trigger({type:"show",relatedTarget:f});c=b(d);this.activate(g.parent("li"),e);this.activate(c,c.parent(),function(){g.trigger({type:"shown",relatedTarget:f})})},activate:function(e,d,h){var c=d.find("> .active"),g=h&&b.support.transition&&c.hasClass("fade");function f(){c.removeClass("active").find("> .dropdown-menu > .active").removeClass("active");e.addClass("active");if(g){e[0].offsetWidth;e.addClass("in")}else{e.removeClass("fade")}if(e.parent(".dropdown-menu")){e.closest("li.dropdown").addClass("active")}h&&h()}g?c.one(b.support.transition.end,f):f();c.removeClass("in")}};b.fn.tab=function(c){return this.each(function(){var e=b(this),d=e.data("tab");if(!d){e.data("tab",(d=new a(this)))}if(typeof c=="string"){d[c]()}})};b.fn.tab.Constructor=a;b(function(){b("body").on("click.tab.data-api",'[data-toggle="tab"], [data-toggle="pill"]',function(c){c.preventDefault();b(this).tab("show")})})}(window.jQuery);
