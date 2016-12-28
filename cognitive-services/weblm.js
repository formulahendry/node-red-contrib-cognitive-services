var request = require('request');

module.exports = function(RED)
{
    function weblm(config)
    {
        RED.nodes.createNode(this,config);
        var node = this;
        this.on('input', function(msg)
        {
            console.log("config.operation=" + config.operation);
            if (this.credentials == null || this.credentials.key == null || this.credentials.key == "")
            {
                node.error("Input subscription key", msg);
                console.log("Input subscription key");
            }
            else
            {
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

                    //console.log("options=" + JSON.stringify(options));   
                    request.post(options, function (error, response, body)
                    {
                        try
                        {
                            if (!error)
                            {
                                console.log("response.statusCode=" + response.statusCode + ", body=" + body);
                                if (response.statusCode == 200 && body.results != null && body.results.length > 0)
                                {
                                    msg.payload = body.results[0].probability;
                                    node.send(msg);
                                }
                                else
                                {
                                    node.error(body);
                                }
                            }
                            else
                            {
                                node.error(error);
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

                    //console.log("options=" + JSON.stringify(options));   
                    request(options, function (error, response, body)
                    {
                        try
                        {
                            if (!error)
                            {
                                console.log("response.statusCode=" + response.statusCode + ", body=" + body);
                                if (response.statusCode == 200)
                                {
                                    msg.payload = body;
                                    node.send(msg);
                                }
                                else
                                {
                                    node.error(body);
                                }
                            }
                            else
                            {
                                node.error(error);
                            }          
                        }
                        catch (e)
                        {
                            node.error(e, msg);
                            console.log("exception=" + e);
                        }
                    });
                }
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