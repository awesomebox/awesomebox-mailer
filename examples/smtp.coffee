mailer = require('../lib/mailer')(
  service: process.env.MAILER_SERVICE
  auth:
    user: process.env.MAILER_USER
    pass: process.env.MAILER_PASS
  template_root: __dirname + '/templates'
)

mailer.send
  to: 'some-email@gmail.com'
  from: 'noreply@example.com'
  subject: 'This is a test'
  template: 'foo'
  data:
    name: 'Boo Boo'
, ->
  console.log arguments
  mailer.transport.close()
