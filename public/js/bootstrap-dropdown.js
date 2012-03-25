/* ============================================================
 * bootstrap-dropdown.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#dropdowns
 * ============================================================
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
 * ============================================================ */
!function(d){var b='[data-toggle="dropdown"]',a=function(f){var e=d(f).on("click.dropdown.data-api",this.toggle);d("html").on("click.dropdown.data-api",function(){e.parent().removeClass("open")})};a.prototype={constructor:a,toggle:function(j){var i=d(this),f=i.attr("data-target"),h,g;if(!f){f=i.attr("href");f=f&&f.replace(/.*(?=#[^\s]*$)/,"")}h=d(f);h.length||(h=i.parent());g=h.hasClass("open");c();!g&&h.toggleClass("open");return false}};function c(){d(b).parent().removeClass("open")}d.fn.dropdown=function(e){return this.each(function(){var g=d(this),f=g.data("dropdown");if(!f){g.data("dropdown",(f=new a(this)))}if(typeof e=="string"){f[e].call(g)}})};d.fn.dropdown.Constructor=a;d(function(){d("html").on("click.dropdown.data-api",c);d("body").on("click.dropdown.data-api",b,a.prototype.toggle)})}(window.jQuery);
