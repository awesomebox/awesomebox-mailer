# awesomebox-mailer

Simple mailer using nodemailer, awesomebox, and juice

## Installation

```bash
$ npm install awesomebox-mailer
```

## Usage

Look at [nodemailer](http://www.nodemailer.com/) for configuration and email options.

To use templates, just pass a `template` parameter to the `send` method rather than using
`text` and `html`. Just reference templates that have `html` and `txt` extensions and pass a
`data` parameter to use data in your templates.

Check out the examples directory.

## License
Copyright (c) 2013 Matt Insler  
Licensed under the MIT license.
