(function() {
  var Mailer, RenderPipeline, async, juice, nodemailer, walkabout;

  juice = require('juice');

  async = require('async');

  walkabout = require('walkabout');

  nodemailer = require('nodemailer');

  RenderPipeline = require('awesomebox').ViewPipeline.RenderPipeline;

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
        this.template_root = walkabout(this.template_root);
      }
    }

    Mailer.prototype._render_html = function(path, data, callback) {
      var pipeline;
      pipeline = RenderPipeline.configure({
        resolve_to: 'content',
        path: {
          content: this.template_root
        }
      }).publish_to(function(err, cmd) {
        if (err != null) {
          return callback(err);
        }
        if (cmd.content == null) {
          return callback();
        }
        return juice.juiceContent(cmd.content, {
          url: 'file://' + cmd.resolved.file.absolute_path
        }, function(err, html) {
          if (err != null) {
            return callback(err);
          }
          return callback(null, html);
        });
      });
      return pipeline.push({
        path: path,
        data: data,
        content_type: 'html'
      });
    };

    Mailer.prototype._render_text = function(path, data, callback) {
      var pipeline;
      pipeline = RenderPipeline.configure({
        resolve_to: 'content',
        path: {
          content: this.template_root
        }
      }).publish_to(function(err, cmd) {
        if (err != null) {
          return callback(err);
        }
        return callback(null, cmd.content);
      });
      return pipeline.push({
        path: path,
        data: data,
        content_type: 'text'
      });
    };

    Mailer.prototype.send = function(opts, callback) {
      var do_send, _ref,
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
      if ((_ref = opts.data) == null) {
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
