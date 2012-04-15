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
/* =============================================================
 * bootstrap-scrollspy.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#scrollspy
 * =============================================================
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
 * ============================================================== */
!function(b){function a(f,e){var g=b.proxy(this.process,this),c=b(f).is("body")?b(window):b(f),d;this.options=b.extend({},b.fn.scrollspy.defaults,e);this.$scrollElement=c.on("scroll.scroll.data-api",g);this.selector=(this.options.target||((d=b(f).attr("href"))&&d.replace(/.*(?=#[^\s]+$)/,""))||"")+" .nav li > a";this.$body=b("body").on("click.scroll.data-api",this.selector,g);this.refresh();this.process()}a.prototype={constructor:a,refresh:function(){this.targets=this.$body.find(this.selector).map(function(){var c=b(this).attr("href");return/^#\w/.test(c)&&b(c).length?c:null});this.offsets=b.map(this.targets,function(c){return b(c).position().top})},process:function(){var f=this.$scrollElement.scrollTop()+this.options.offset,e=this.offsets,c=this.targets,g=this.activeTarget,d;for(d=e.length;d--;){g!=c[d]&&f>=e[d]&&(!e[d+1]||f<=e[d+1])&&this.activate(c[d])}},activate:function(d){var c;this.activeTarget=d;this.$body.find(this.selector).parent(".active").removeClass("active");c=this.$body.find(this.selector+'[href="'+d+'"]').parent("li").addClass("active");if(c.parent(".dropdown-menu")){c.closest("li.dropdown").addClass("active")}}};b.fn.scrollspy=function(c){return this.each(function(){var f=b(this),e=f.data("scrollspy"),d=typeof c=="object"&&c;if(!e){f.data("scrollspy",(e=new a(this,d)))}if(typeof c=="string"){e[c]()}})};b.fn.scrollspy.Constructor=a;b.fn.scrollspy.defaults={offset:10};b(function(){b('[data-spy="scroll"]').each(function(){var c=b(this);c.scrollspy(c.data())})})}(window.jQuery);
