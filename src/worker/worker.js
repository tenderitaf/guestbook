var amqp    = require('amqplib/callback_api');
var nano    = require('nano')('http://localhost:5984');
var async   = require('async');
var request = require('request');

async.waterfall([
    function(callback) {
		var hooks = [];
		var webhooks_db = nano.use('webhooks');
		webhooks_db.view('main', 'all', function (err, hook) {
			hook.rows.forEach(function (row) {
				hooks.push(row.value.url);
			});
            callback(null, hooks);
		});

    },
    function(hooks, callback) {
        // console.log(hooks);

        amqp.connect('amqp://localhost', function(err, conn) {
            conn.createChannel(function(err, ch) {
                var q = 'comments';

                ch.assertQueue(q, {durable: true});
                console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
                ch.consume(q, function(msg) {
                    hooks.forEach(function (url) {
                        console.log("Request to " + url);
                        request({
                            url: url,
                            method: "post",
                            json: msg.content.toString()
                        }, function (error, response, body) {
                        });
                    });
                    ch.ack(msg);

                    console.log(" [x] Complete: %s", msg.content.toString());
                });
            });
        });
    }
], function (err, result) {
});


