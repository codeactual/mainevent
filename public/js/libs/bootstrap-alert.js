/* ==========================================================
 * bootstrap-alert.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#alerts
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
!function(c){var b='[data-dismiss="alert"]',a=function(d){c(d).on("click",b,this.close)};a.prototype={constructor:a,close:function(i){var h=c(this),f=h.attr("data-target"),g;if(!f){f=h.attr("href");f=f&&f.replace(/.*(?=#[^\s]*$)/,"")}g=c(f);g.trigger("close");i&&i.preventDefault();g.length||(g=h.hasClass("alert")?h:h.parent());g.trigger("close").removeClass("in");function d(){g.trigger("closed").remove()}c.support.transition&&g.hasClass("fade")?g.on(c.support.transition.end,d):d()}};c.fn.alert=function(d){return this.each(function(){var f=c(this),e=f.data("alert");if(!e){f.data("alert",(e=new a(this)))}if(typeof d=="string"){e[d].call(f)}})};c.fn.alert.Constructor=a;c(function(){c("body").on("click.alert.data-api",b,a.prototype.close)})}(window.jQuery);
