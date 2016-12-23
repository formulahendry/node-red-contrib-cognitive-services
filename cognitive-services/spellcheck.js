var request = require('request');

module.exports = function(RED)
{
    function spellcheck(config)
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

            var options = {
                url: 'https://api.cognitive.microsoft.com/bing/v5.0/spellcheck/?mkt=en-us',
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.credentials.key,
                    'Content-Type': 'application/json'
                },
                form: {
                    "Text": msg.payload
                }
            };
            console.log("options=" + JSON.stringify(options));            
            request.post(options, function (error, response, body)
            {
                try
                {
                    if (!error)
                    {
                        console.log("response.statusCode=" + response.statusCode + ", body=" + body);
                        if (response.statusCode == 200)
                        {
                            msg.payload = JSON.parse(body).flaggedTokens;
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
        });
    }

    RED.nodes.registerType("Bing Spell Check", spellcheck,
    {
        credentials: {
            key: {
                type: "password"
            }
        }
    });                       
}