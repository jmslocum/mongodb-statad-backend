# mongodb-statsd-backend
This is a simple backend for etsy/statsd that will store all reported stats into mongodb
collections. 

## How it works
As statsd emits statistics to the back end, it will write each type of stat to a named
collection. The collections it creates are 'timers', 'counters', 'counter_rates', 
'gauges', 'sets', 'timer_counters', 'timer_data', and 'statsd_metrics'.

Each named metric will be broken into its own record, and each record has the following
schema:

    {
      time : Number,
      namespace : String,
      bucket : String,
      value : Object
    }

The value holds the actual metric data for the stat. This data is free form is in the 
same format that it is emitted from the statsd server. 

## Dependencies
mongoose

### installing dependencies
    npm install 

## How to install
To use this backend simply

1. clone the repo
2. install the dependencies
3. create a config file that uses the backend
4. run statsd with the config file

## How to configure
There is only one config value used by this backend, and it is `mongoUrl`. This
URL is in the same format accepted by mongoose applications. If no value is
specified for this field, the default database `mongodb://localhost/statsd` is used.

    {
      mongoUrl : 'mongodb://yourHost:port/database',
      backends: ["/path/to/your/mongodb-statsd-backend/mongo"]
    }

## License
This project is available for use under the MIT license.

Copyright (c) 2018 James Slocum (jamesslocum.com)

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
