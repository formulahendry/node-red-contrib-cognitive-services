var request = require('request');

module.exports = function(RED)
{
    function emotion(config)
    {
        RED.nodes.createNode(this,config);
        var node = this;
        this.on('input', function(msg)
        {
            if (this.credentials == null || this.credentials.key == null || this.credentials.key == "")
            {
                node.error("Input subscription key", msg);
                console.log("Input subscription key");
            }
            else
            {
                var options = null;
                if (Buffer.isBuffer(msg.payload))
                {
                    options = {
                        url: 'https://api.projectoxford.ai/emotion/v1.0/recognize',
                        method: 'POST',
                        headers: {
                            'Ocp-Apim-Subscription-Key': this.credentials.key,
                            'Content-Type': 'application/octet-stream'
                        },
                        "body": msg.payload
                    };
                }
                else if (typeof(msg.payload) == 'string' && (msg.payload.indexOf('http://') === 0 || msg.payload.indexOf('https://') === 0))
                {
                    options = {
                        url: 'https://api.projectoxford.ai/emotion/v1.0/recognize',
                        method: 'POST',
                        headers: {
                            'Ocp-Apim-Subscription-Key': this.credentials.key,
                            'Content-Type': 'application/json'
                        },
                        json: {
                            "url": msg.payload
                        }
                    };
                }

                if (options != null)
                {
                    //console.log("options=" + JSON.stringify(options));
                    request.post(options, function (error, response, body)
                    {
                        try
                        {
                            if (!error)
                            {
                                try { body = JSON.parse(body); } catch (e) {}
                                console.log("response.statusCode=" + response.statusCode + ", body=" + JSON.stringify(body));
                                if (response.statusCode == 200 && body != null && body.length > 0 && body[0] != null && body[0].scores != null)
                                {
                                    msg.payload = body[0].scores;
                                    msg.detail = body;
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
                        }
                    });
                }
                else
                {
                    node.error("Unsupported format: This node supports Buffer data from file-in node and URL String data");
                }
            }
        });
    }

    RED.nodes.registerType("Emotion", emotion,
    {
        credentials: {
            key: {
                type: "password"
            }
        }
    });                       
}