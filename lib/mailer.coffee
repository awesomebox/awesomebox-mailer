juice = require 'juice'
async = require 'async'
nodemailer = require 'nodemailer'
walkabout = require 'awesomebox/node_modules/walkabout'
{RenderPipeline} = require('awesomebox').ViewPipeline

class Mailer
  constructor: (@config = {}) ->
    transport = @config.transport
    @template_root = @config.template_root
    delete @config.transport
    delete @config.template_root
    
    transport ?= 'SMTP' if @config.service?
    
    console.log transport, @config
    
    @transport = nodemailer.createTransport(transport, @config)
    @template_root = walkabout(@template_root) if @template_root?
  
  _render_html: (path, data, callback) ->
    pipeline = RenderPipeline.configure(
      resolve_to: 'content'
      path:
        content: @template_root
    ).publish_to (err, cmd) ->
      return callback(err) if err?
      return callback() unless cmd.content?
      
      juice.juiceContent cmd.content, {url: 'file://' + cmd.resolved.file.absolute_path}, (err, html) ->
        return callback(err) if err?
        callback(null, html)
    
    pipeline.push(
      path: path
      data: data
      content_type: 'html'
    )
  
  _render_text: (path, data, callback) ->
    pipeline = RenderPipeline.configure(
      resolve_to: 'content'
      path:
        content: @template_root
    ).publish_to (err, cmd) ->
      return callback(err) if err?
      callback(null, cmd.content)
      
    pipeline.push(
      path: path
      data: data
      content_type: 'txt'
    )
  
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
