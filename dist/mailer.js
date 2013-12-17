(function() {
  var Mailer, Renderer, async, helpers, juice, nodemailer, path, _ref;

  path = require('path');

  juice = require('juice');

  async = require('async');

  nodemailer = require('nodemailer');

  try {
    _ref = require(path.join(process.cwd(), 'node_modules', 'awesomebox-core')), helpers = _ref.helpers, Renderer = _ref.Renderer;
  } catch (err) {
    console.log('\nYou must npm install awesomebox-core in order to use awesomebox-mailer\n');
    throw err;
  }

  Mailer = (function() {

    function Mailer(config) {
      var transport;
      this.config = config != null ? config : {};
      transport = this.config.transport;
      this.template_root = this.config.template_root;
      delete this.config.transport;
      delete this.config.template_root;
      if (this.config.service != null) {
        if (transport == null) {
          transport = 'SMTP';
        }
      }
      this.transport = nodemailer.createTransport(transport, this.config);
      if (this.template_root != null) {
        this.template_root = path.resolve(this.template_root);
        this.renderer = new Renderer({
          root: this.template_root
        });
      }
    }

    Mailer.prototype._render_html = function(path, data, next) {
      var file;
      path = path.replace(/\.html$/, '') + '.html';
      file = helpers.find_file(this.template_root, path);
      if (file == null) {
        return next();
      }
      return this.renderer.render(file, data).then(function(opts) {
        if (opts.content == null) {
          return next();
        }
        return q.ninvoke(juice, 'juiceContent', opts.content, {
          url: 'file://' + file
        }).then(function(html) {
          return next(null, html);
        });
      })["catch"](next);
    };

    Mailer.prototype._render_text = function(path, data, next) {
      var file;
      path = path.replace(/\.text$/, '') + '.text';
      file = helpers.find_file(this.template_root, path);
      if (file == null) {
        return next();
      }
      return this.renderer.render(file, data).then(function(opts) {
        if (opts.content == null) {
          return next();
        }
        return next(null, opts.content);
      })["catch"](next);
    };

    Mailer.prototype.send = function(opts, callback) {
      var do_send, _ref1,
        _this = this;
      do_send = function() {
        if (opts.text == null) {
          opts.generateTextFromHTML = true;
        }
        return _this.transport.sendMail(opts, function(err, res) {
          if (err != null) {
            return typeof callback === "function" ? callback(err) : void 0;
          }
          return typeof callback === "function" ? callback(null, res) : void 0;
        });
      };
      if ((opts.text != null) || (opts.html != null)) {
        return do_send();
      }
      if (opts.template == null) {
        return typeof callback === "function" ? callback(new Error('Must specify at least a template or html or text')) : void 0;
      }
      if ((_ref1 = opts.data) == null) {
        opts.data = {};
      }
      opts.template = '/' + opts.template.replace(/^\/+/, '');
      return async.parallel({
        html: function(cb) {
          return _this._render_html(opts.template, opts.data, cb);
        },
        text: function(cb) {
          return _this._render_text(opts.template, opts.data, cb);
        }
      }, function(err, data) {
        if (err != null) {
          return typeof callback === "function" ? callback(err) : void 0;
        }
        if (data.html != null) {
          opts.html = data.html;
        }
        if (data.text != null) {
          opts.text = data.text;
        }
        return do_send();
      });
    };

    return Mailer;

  })();

  module.exports = function(config) {
    return new Mailer(config);
  };

  module.exports.Mailer = Mailer;

}).call(this);
