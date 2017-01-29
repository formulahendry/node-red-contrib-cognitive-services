var request = require('request');

module.exports = function(RED)
{
    function videosearch(config)
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
                if (config.operation == "search") // Search
                {
                    var options = {
                        url: 'https://api.cognitive.microsoft.com/bing/v5.0/videos/search?q=' + encodeURI(msg.payload),
                        method: 'GET',
                        headers: {
                            'Ocp-Apim-Subscription-Key': this.credentials.key
                        }
                    };

                    //console.log("options=" + JSON.stringify(options));   
                    request(options, function (error, response, body)
                    {
                        try
                        {
                            if (!error)
                            {
                                try { body = JSON.parse(body); } catch (e) {}
                                console.log("response.statusCode=" + response.statusCode + ", body=" + JSON.stringify(body));
                                if (response.statusCode == 200 && body != null && body.value != null)
                                {
                                     var urls = [];
                                     for (var i = 0; i < body.value.length; i++)
                                     {
                                         urls[i] = body.value[i].contentUrl;
                                     }
                                     msg.payload = urls;
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
                else if (config.operation == "trendingtopics") // Trending Topics
                {
                    var options = {
                        url: 'https://api.cognitive.microsoft.com/bing/v5.0/videos/trending',
                        method: 'GET',
                        headers: {
                            'Ocp-Apim-Subscription-Key': this.credentials.key
                        }
                    };

                    //console.log("options=" + JSON.stringify(options));   
                    request(options, function (error, response, body)
                    {
                        try
                        {
                            if (!error)
                            {
                                try { body = JSON.parse(body); } catch (e) {}
                                console.log("response.statusCode=" + response.statusCode + ", body=" + JSON.stringify(body));
                                if (response.statusCode == 200 && body != null && body.value != null)
                                {
                                    msg.payload = body.value;
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
                    node.error("Unsupported operation: " + config.operation);
                }
            }
        });
    }

    RED.nodes.registerType("Bing Video Search", videosearch,
    {
        credentials: {
            key: {
                type: "password"
            }
        }
    });                       
}