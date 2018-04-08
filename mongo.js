var mongoose = require('mongoose');

var logger;

var mongoStats = {
  last_flush : 0,
  last_exception : 0
};
/**
 * Define Schema for writing stats to the database
 */
var statsdSchema = mongoose.Schema({
  time : Number,
  namespace : String, 
  bucket : String, 
  value : mongoose.Schema.Types.Mixed
});

/**
 *  Create the models depending on the differnt stat types,
 *  each model uses the same schema, but records it's stats to
 *  a different collections
 */
var models = {
  'timers' : mongoose.model('timer', statsdSchema),
  'counters' : mongoose.model('counter', statsdSchema),
  'counter_rates' : mongoose.model('counter_rates', statsdSchema),
  'gauges' : mongoose.model('gauge', statsdSchema),
  'sets' : mongoose.model('set', statsdSchema),
  'timer_counters' : mongoose.model('timer_counter', statsdSchema),
  'timer_data' : mongoose.model('timer_data', statsdSchema, 'timer_data'),
  'statsd_metrics' : mongoose.model('statsd_metrics', statsdSchema),
  'pctThreshold' : mongoose.model('pctThreshold', statsdSchema)
};

/**
 * Populate the model with the values from the statsd server
 * 
 * @param time - The unix timestamp for this stat 
 * @param key - the namespace and bucket for stat
 * @param value - the actual stat record
 * @param model - the database model to apply the values to
 */
function populateFields(time, key, value, model) {
  model.time = time;
  if (key.indexOf('.') > 0) {
    model.namespace = key.slice(0, key.lastIndexOf('.'));
    model.bucket = key.slice(key.lastIndexOf('.') + 1, key.length);
  }
  else {
    model.namespace = '';
    model.bucket = key;
  }
  model.value = value;
}

/**
 *  Write the model to the database, and log any errors if
 *  it goes wrong
 *
 *  @param model - the model to write to the database
 */
function saveModel(model) {
  model.save(function(error) {
    if (error){
      var key = (model.namespace ? model.namespace + '.' : '') + model.bucket;
      this.logger.log('Unable to write ' + model.modelName + ' key:\"' + 
          key + '\" to database ', 'ERROR');
    }
  });
}

/**
 *  This will build and store the individual stats to
 *  the database.
 *
 *  @param time - The unix timestamp for this stat
 *  @param type - the type of statistic this is, used to
 *    look up the approperate model
 *  @param stat - the raw stat data from statsd
 */
function writeStat(time, type, stat) {
  if (!stat) return;

  Object.keys(stat).forEach(function(key) {
    var model = new (models[type])();
    populateFields(time, key, stat[key], model);
    saveModel(model);
  });
}

/**
 *  This is the connector function to make this a statsd backend
 *
 *  @param startup_time - The unix timestamp this server started at
 *  @param config - The config from statsd
 *  @param events - The events to hook to, 'flush', 'paket', and 'status'
 *  @param logger - The statsd logger
 */
exports.init = function(startup_time, config, events, logger) {
  logger.log('Starting mongoDB backend');
  this.logger = logger;

  var mongoUrl = config.mongoUrl;

  if (!mongoUrl) {
    mongoUrl = 'mongodb://localhost/statsd';
    logger.log('Using defualt database: \'statsd\'');
  }

  try {
    mongoose.connect(mongoUrl).catch(function(err) {
      logger.log('Unable to connect to database url: ' + mongoUrl + ', error: ' + err, 'ERROR');
      return false;
    });

    mongoose.connection.on('error', function(err) {
      logger.log('Unable to connect to database url: ' + mongoUrl + ', error: ' + err, 'ERROR');
    });

    events.on('flush', onFlush);
    events.on('status', onStatus);
    
    mongoStats.last_flush = startup_time;
    mongoStats.last_exception = startup_time;

    return true;
  }catch (exception) {
    logger.log('Failed to start mongo backend. exception: ' + exception, 'ERROR');
    return false;
  }
};

/**
 *  This is called every time statsd flushes the stats. 
 *
 *  NOTE: this ignores pctThreshold value
 *
 *  @param time - The unix timestamp of the flush
 *  @param metrics - All of the flushed metrics as a JSON object
 */
var onFlush = function(time, metrics) {
  mongoStats.last_flush = time;
  Object.keys(metrics).forEach(function(key) {
    if (key === 'pctThreshold') return;
    writeStat(time, key, metrics[key]);    
  });
}

/**
 *  This is called every time statsd requests the status of
 *  this backend plugin
 *
 *  @param write - The callback method to write the stats to
 */
var onStatus = function(write) {
  for (var stat in mongoStats) {
    write(null, 'mongoDB', stat, mongoStats[stat]);
  }
}

