path = require 'path'
juice = require 'juice'
async = require 'async'
nodemailer = require 'nodemailer'
try
  {helpers, Renderer} = require path.join(process.cwd(), 'node_modules', 'awesomebox-core')
catch err
  console.log '\nYou must npm install awesomebox-core in order to use awesomebox-mailer\n'
  throw err

class Mailer
  constructor: (@config = {}) ->
    transport = @config.transport
    @template_root = @config.template_root
    delete @config.transport
    delete @config.template_root
    
    transport ?= 'SMTP' if @config.service?
    
    @transport = nodemailer.createTransport(transport, @config)
    if @template_root?
      @template_root = path.resolve(@template_root)
      @renderer = new Renderer(root: @template_root)
  
  _render_html: (path, data, next) ->
    path = path.replace(/\.html$/, '') + '.html'
    file = helpers.find_file(@template_root, path)
    return next() unless file?
    
    @renderer.render(file, data)
    .then (opts) ->
      return next() unless opts.content?
      
      juice.juiceContent opts.content, {url: 'file://' + file}, (err, html) ->
        return next(err) if err?
        next(null, html)
    .catch(next)
  
  _render_text: (path, data, next) ->
    path = path.replace(/\.text$/, '') + '.text'
    file = helpers.find_file(@template_root, path)
    return next() unless file?
    
    @renderer.render(file, data)
    .then (opts) ->
      return next() unless opts.content?
      next(null, opts.content)
    .catch(next)
  
  send: (opts, callback) ->
    do_send = =>
      opts.generateTextFromHTML = true unless opts.text?
      
      @transport.sendMail opts, (err, res) ->
        return callback?(err) if err?
        callback?(null, res)
    
    return do_send() if opts.text? or opts.html?
    
    return callback?(new Error('Must specify at least a template or html or text')) unless opts.template?
    
    opts.data ?= {}
    opts.template = '/' + opts.template.replace(/^\/+/, '')
    
    async.parallel
      html: (cb) => @_render_html(opts.template, opts.data, cb)
      text: (cb) => @_render_text(opts.template, opts.data, cb)
    , (err, data) ->
      return callback?(err) if err?
      
      opts.html = data.html if data.html?
      opts.text = data.text if data.text?
      
      do_send()

module.exports = (config) -> new Mailer(config)
module.exports.Mailer = Mailer
