/* #License 
 *
 * The MIT License (MIT)
 *
 * This software consists of voluntary contributions made by many
 * individuals. For exact contribution history, see the revision history
 * available at https://github.com/shovelapps/shovelapps-cms
 *
 * The following license applies to all parts of this software except as
 * documented below:
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * All files located in the node_modules and external directories are
 * externally maintained libraries used by this software which have their
 * own licenses; we recommend you read them, as their terms may differ from
 * the terms above.
 *
 * Copyright (c) 2014-2015 Shovel apps, Inc. All rights reserved.
 * (info@shovelapps.com) / www.shovelapps.com / www.shovelapps.org
 */

var db = require("../db"),
  debug = require("debug")("cms:editables"),
  cheerio = require("cheerio");
/**
 * Registers URL routes for handling saving of an editable's content
 *
 * @param {express.App} express request handler.
 */
module.exports = function(app) {
  app.cms.frontend.hook("afterrender", function(rendered, locals, next) {
    db.editables.all(function(err, updatedEditables) {
      if (err) {
        debug("Error finding editables", err);
        next(err);
      }
      rendered.html = replaceEditables(rendered.html, updatedEditables);
      next();
    });
  });
  app.post("/admin/editable", function(req, res) {
    debug("Tried to save editable %s", req.param("id"));
    db.editables.saveEdition({
      id: req.param("id"),
      html: req.param("html")
    }, function() {
      res.send("hola");
    });
  });
};

function replaceEditables(html, editables) {
  var a = editables.reduce(function(obj, cur) {
    obj[cur.editableId] = cur;
    return obj;
  }, {});
  var $ = cheerio.load(html);

  // Replace all data-editable elements
  // with the last stored HTML for that element
  $("[data-editable!=''][data-editable]").each(function() {
    var editableId = $(this).attr("data-editable");
    // For all data-editables declared on the theme
    // but are unmodified by the user
    if (a[editableId]) {
      $(this).html(a[editableId].html);
    }
  });
  return $.html();
}