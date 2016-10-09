var request = require('request');

module.exports = function(RED) {
    function weblm(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.on('input', function(msg) {
            console.log("config.operation=" + config.operation);
            if (this.credentials == null || this.credentials.key == null || this.credentials.key == "")
            {
                node.error("Input subscription key", msg);
                console.log("Input subscription key");
            }

            if (config.operation == "cjp") // Calculate Joint Probability
            {
                var options = {
                    url: 'https://api.projectoxford.ai/text/weblm/v1.0/calculateJointProbability?model=body',
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': this.credentials.key,
                        'Content-Type': 'application/json'
                    },
                    json: {
                        "queries": [msg.payload]
                    }
                };
                request.post(options, function (error, response, body)
                {
                    try {
                        console.log("body=" + body);
                        if (body.results != null && body.results.length > 0)
                        {
                            msg.payload = body.results[0].probability;
                            node.send(msg);
                        }
                    }
                    catch (e)
                    {
                        node.error(e, msg);
                        console.log("exception=" + e);
                    }
                });
            }
            else if (config.operation == "lam") // List Available Models
            {
                var options = {
                    url: 'https://api.projectoxford.ai/text/weblm/v1.0/models',
                    method: 'GET',
                    headers: {
                        'Ocp-Apim-Subscription-Key': this.credentials.key,
                        'Content-Type': 'application/json'
                    }
                };
                request(options, function (error, response, body)
                {
                    try {
                        console.log("body=" + body);
                        msg.payload = body;
                        node.send(msg);
                    }
                    catch (e)
                    {
                        node.error(e, msg);
                        console.log("exception=" + e);
                    }
                });
            }
        });
    }

    RED.nodes.registerType("Web Language Model", weblm,
    {
        credentials: {
            key: {
                type: "password"
            }
        }
    });                       
}